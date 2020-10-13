


import { Cli, Bridge, AppServiceRegistration, MatrixUser, WeakEvent, Request, BridgeContext } from "matrix-appservice-bridge";

export default class AppService {

    private constructor() {
    }

    static create(): AppService {
        let appservice = new AppService();
        new Cli({
            registrationPath: "",
            generateRegistration: function(reg: AppServiceRegistration, callback) {
                reg.setId(AppServiceRegistration.generateToken());
                reg.setHomeserverToken(AppServiceRegistration.generateToken());
                reg.setAppServiceToken(AppServiceRegistration.generateToken());
                reg.setSenderLocalpart("webhook");
                reg.addRegexPattern("users", "@hook_.*", true);
                callback(reg);
            },
            run: appservice.run
        }).run();
        return appservice;
    }

    private run(port: number, config: Record<string, unknown>) {
        let bridge = new Bridge({
            homeserverUrl: "http://127.0.0.1:8008",
            domain: "matrix.local",
            registration: "registration.yaml",
            disableStores: true,
            controller: {
                onUserQuery: function(user: MatrixUser): Object {
                    console.log(`User provision requested: ${user.localpart}:${user.host}`);
                    return {}
                },
                onEvent: function(request: Request<WeakEvent>, context: BridgeContext) {
                    let event = request.getData();
                    if (event.type === "m.room.message") {
                        console.log(`New message: ${event.content.body}`);
                        if (event.sender != bridge.getBot().getUserId()) {
                            bridge.getIntent().sendMessage(event.room_id, {
                                msgtype: "m.text",
                                body: "PONG"
                            });
                        }
                    } else if (event.type === "m.room.member" && event.content.membership === "invite") {
                        console.log(`${event.state_key} was invited to ${event.room_id}`);
                        if (event.state_key === bridge.getBot().getUserId()) {
                            console.log(`Accepting invite.`);
                            bridge.getIntent(event.state_key)
                                .join(event.room_id);
                        }
                    }else {
                        console.log(`Event ignored: ${event.type}`);
                        return;
                    }
                    return;
                },
            }
        });
        console.log(`Ready on port ${port}`);
        bridge.run(8023, config);
    }
}

