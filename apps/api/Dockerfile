FROM node:24.19.0-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile --filter @careerground/api... --ignore-scripts=false
COPY apps/api apps/api
COPY packages/contracts packages/contracts
COPY packages/config packages/config
RUN pnpm --filter @careerground/contracts build && pnpm --filter @careerground/api build

FROM node:24.19.0-alpine AS runtime
ENV NODE_ENV=production API_PORT=4000
WORKDIR /app
RUN apk add --no-cache wget
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD wget -qO- http://127.0.0.1:4000/api/v1/health/ready || exit 1
CMD ["node", "apps/api/dist/main.js"]
