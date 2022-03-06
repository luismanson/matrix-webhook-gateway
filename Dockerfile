FROM node:current-bullseye-slim AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npx ttsc --outDir out

FROM node:current-bullseye-slim
WORKDIR /app

ENV WEBHOOK_CONFIG /config/gateway-config.yaml
ENV WEBHOOK_APPSERVICE_CONFIG /data/appservice-webhook-gateway.yaml
ENV WEBHOOK_AUTO_MIGRATE true

RUN mkdir /data
RUN mkdir /data/plugins
RUN mkdir /config
RUN chown 997:1001 /app /data /config

COPY --from=build /build/out /app
COPY --from=build /build/node_modules /app/node_modules
COPY --from=build /build/templates /app/templates

RUN mkdir /app/src/webhooks/plugins
RUN chown -R 997:1001 /app/src/webhooks/plugins

EXPOSE 8020
EXPOSE 8023
USER 997:1001

ENTRYPOINT ["/usr/local/bin/node", "entry.js"]
CMD []
