# API(Nest) 이미지. 빌드 단계에서 nest build 를 돌리고, 실행 단계에는
# 운영 의존성과 dist/ 만 담는다.
#
# 빌드:  docker build -t drvalue-api ./api
# 실행:  docker run -p 3500:3500 --env-file api/.env drvalue-api
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3500
RUN addgroup -S api && adduser -S api -G api
COPY --from=build --chown=api:api /app/node_modules ./node_modules
COPY --from=build --chown=api:api /app/dist ./dist
COPY --from=build --chown=api:api /app/package.json ./
USER api
EXPOSE 3500
CMD ["node", "dist/main.js"]
