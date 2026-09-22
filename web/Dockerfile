# 홈페이지(Next) 이미지. 세 단계 — 의존성 → 빌드 → 실행.
# 실행 단계에는 next.config.mjs 의 output: 'standalone' 이 만든 server.js 와
# 정적 파일만 들어간다(node_modules 통째가 아니라 필요한 것만 → 수백 MB 절약).
#
# 빌드:  docker build -t drvalue-web ./web
# 실행:  docker run -p 3400:3400 --env-file web/.env drvalue-web
# 보통은 루트의 docker-compose.yml 로 api·CMS 와 같이 띄운다.
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 빌드 때만 쓰는 값. 검색 차단(NOINDEX)은 미리보기 배포에서만 1 로 넘긴다.
ARG NOINDEX=
ENV NOINDEX=$NOINDEX NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3400 HOSTNAME=0.0.0.0
RUN addgroup -S web && adduser -S web -G web
COPY --from=build --chown=web:web /app/.next/standalone ./
COPY --from=build --chown=web:web /app/.next/static ./.next/static
COPY --from=build --chown=web:web /app/public ./public
USER web
EXPOSE 3400
CMD ["node", "server.js"]
