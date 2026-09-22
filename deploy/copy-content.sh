#!/usr/bin/env bash
# 원본 DB(보통 로컬 개발 DB)의 콘텐츠를 대상 DB(운영 관리형 DB)로 옮긴다.
#
# 옮기는 것: 글·번역·첨부·파일 정보·언어 · 페이지 글 · 메인 배너·팝업 · 메뉴 · 정적 장 검색 정보.
# 옮기지 않는 것:
#   - 관리자 계정(admin_users) · 변경 이력(admin_revisions) · 문의(inquiries) — 로컬 검사 흔적이다.
#     운영의 관리자는 IAM 로그인 때 생긴다.
#   - 옛 Directus 표 전부 — directus_users 에 비밀번호 해시, directus_sessions 에 세션이 있다.
# 파일 본체(data/uploads)는 따로 복사한다(docs/operations.md 「새 서버 배포」).
#
# 대상은 먼저 api 를 한 번 띄워 스키마가 있어야 한다(api 가 뜰 때 만든다). 옮길 표는 비우고 채운다.
#
#   SRC_HOST=… SRC_PORT=… SRC_DB=… SRC_USER=… SRC_PASSWORD=… \
#   DST_HOST=… DST_PORT=… DST_DB=… DST_USER=… DST_PASSWORD=… \
#   bash deploy/copy-content.sh            # 무엇을 몇 줄 옮길지만 보여 준다
#   bash deploy/copy-content.sh --apply    # 실제로 옮긴다
#
# pg_dump·psql 은 postgres:10-alpine 컨테이너로 돌린다(서버에 따로 깔지 않는다). 비밀번호는 환경변수로만 넘긴다.
set -euo pipefail

TABLES=(
  languages
  directus_files
  posts posts_translations posts_files
  page_contents
  home_banners home_banner_translations home_popups home_popup_translations
  site_menu_items site_menu_item_translations
  page_meta page_meta_translations
)
APPLY="${1:-}"
PG_IMAGE="postgres:10-alpine"

need() { [ -n "${!1:-}" ] || { echo "$1 가 비었다" >&2; exit 2; }; }
for v in SRC_HOST SRC_PORT SRC_DB SRC_USER SRC_PASSWORD DST_HOST DST_PORT DST_DB DST_USER DST_PASSWORD; do need "$v"; done

pg() { # 쪽(SRC|DST) 명령...
  local side="$1"; shift
  local h="${side}_HOST" p="${side}_PORT" d="${side}_DB" u="${side}_USER" w="${side}_PASSWORD"
  docker run --rm -i --add-host=host.docker.internal:host-gateway \
    -e PGPASSWORD="${!w}" -e PGHOST="${!h}" -e PGPORT="${!p}" -e PGDATABASE="${!d}" -e PGUSER="${!u}" \
    "$PG_IMAGE" "$@"
}

echo "== 옮길 줄 수 (원본 → 대상 지금)"
for t in "${TABLES[@]}"; do
  s=$(pg SRC psql -tA -c "select count(*) from public.$t" 2>/dev/null || echo "없음")
  d=$(pg DST psql -tA -c "select count(*) from public.$t" 2>/dev/null || echo "없음")
  printf '  %-30s %6s → %s\n' "$t" "$s" "$d"
done
[ "$APPLY" = "--apply" ] || { echo "(보기만 했다 — 옮기려면 --apply)"; exit 0; }

args=(); for t in "${TABLES[@]}"; do args+=(-t "public.$t"); done
list=$(printf 'public.%s, ' "${TABLES[@]}"); list="${list%, }"
tmp=$(mktemp); trap 'rm -f "$tmp"' EXIT
# 줄만(스키마는 대상에 이미 있다). 소유자·권한은 싣지 않는다 — 관리형 DB 의 계정 이름이 다르다.
pg SRC pg_dump --data-only --no-owner --no-privileges "${args[@]}" > "$tmp"
{
  echo "BEGIN;"
  echo "TRUNCATE $list RESTART IDENTITY CASCADE;"
  cat "$tmp"
  echo "COMMIT;"
} | pg DST psql -v ON_ERROR_STOP=1 -q >/dev/null
echo "== 옮긴 뒤 (대상)"
for t in "${TABLES[@]}"; do printf '  %-30s %6s\n' "$t" "$(pg DST psql -tA -c "select count(*) from public.$t")"; done
echo "끝. web 을 다시 띄우거나 1분 기다린다(메뉴 캐시)."
