# API(Nest) + 관리 화면 API 이미지. 빌드 단계에서 nest build 를 돌리고, 실행 단계에는
# 운영 의존성과 dist/ 만 담는다. DB(postgres)가 먼저 떠 있어야 한다.
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
ENV NODE_ENV=production PORT=3500 UPLOADS_DIR=/data/uploads
# 업로드 폴더. compose 가 ./data/uploads 를 여기에 물린다.
RUN addgroup -S api && adduser -S api -G api && mkdir -p /data/uploads && chown -R api:api /data
COPY --from=build --chown=api:api /app/node_modules ./node_modules
COPY --from=build --chown=api:api /app/dist ./dist
COPY --from=build --chown=api:api /app/package.json ./
USER api
EXPOSE 3500
CMD ["node", "dist/main.js"]
