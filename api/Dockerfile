# API(Nest) + 관리 화면 API 이미지. 빌드 단계에서 nest build 를 돌리고, 실행 단계에는
# 운영 의존성과 dist/ 만 담는다. DB(postgres)가 먼저 떠 있어야 한다.
#
# 빌드는 compose 로 한다(추가 문맥 db 가 필요하다):  docker compose build api
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3500 UPLOADS_DIR=/data/uploads
# 업로드 폴더. compose 가 ./data/uploads(호스트)를 여기에 물린다. su-exec 로 시작 때 권한을 맞춘다.
RUN apk add --no-cache su-exec \
  && addgroup -S api && adduser -S api -G api && mkdir -p /data/uploads && chown -R api:api /data
COPY --from=build --chown=api:api /app/node_modules ./node_modules
COPY --from=build --chown=api:api /app/dist ./dist
COPY --from=build --chown=api:api /app/package.json ./
# 스키마·마이그레이션(저장소 루트 db/). compose 가 추가 빌드 문맥 `db` 로 넘긴다.
COPY --from=db --chown=api:api . ./db
EXPOSE 3500
# 컨테이너는 root 로 뜨지만 앱은 api 로 돈다. root 로 있는 잠깐 동안 바인드 마운트된 업로드 폴더의
# 소유자를 api 로 맞춘다 — 새 서버에서 호스트 폴더가 root 소유로 생기면(gitignore 라 체크아웃에 없다)
# 비루트 앱이 못 써서 업로드가 500 이 됐다. 그 뒤 su-exec 로 api 로 떨어뜨려 앱을 실행한다.
# 마이그레이션이 실패하면 서버도 안 뜬다.
CMD ["sh", "-c", "chown api:api /data/uploads 2>/dev/null || true; exec su-exec api sh -c 'node dist/common/database/migrate.js && exec node dist/main.js'"]
