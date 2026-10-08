FROM node:22.22.2-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.22.2-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/manager/assets ./dist/manager/assets
COPY --from=build /app/help ./help
COPY --from=build /app/tools/cp03d-cross-structure-production-proof.mjs ./tools/cp03d-cross-structure-production-proof.mjs
COPY --from=build /app/tools/af01-conversation-postgres-migrate.mjs ./tools/af01-conversation-postgres-migrate.mjs
COPY --from=build /app/tools/af02-long-context-production-proof.mjs ./tools/af02-long-context-production-proof.mjs
CMD ["node","dist/manager/server.js"]
