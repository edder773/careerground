FROM node:24.19.0-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile --filter @careerground/web... --ignore-scripts=false
COPY apps/web apps/web
COPY packages packages
ARG VITE_API_URL=/api/v1
ARG VITE_APP_NAME=CareerGround
ENV VITE_API_URL=$VITE_API_URL VITE_APP_NAME=$VITE_APP_NAME
RUN pnpm --filter @careerground/contracts build && pnpm --filter @careerground/ui build && pnpm --filter @careerground/web build

FROM nginx:1.29-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/ || exit 1
