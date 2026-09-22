#!/usr/bin/env bash
# 옮긴 페이지 전부를 PHP 원본과 대 본다.
#
# PHP 원본(:3300)과 Next(:3400)가 둘 다 떠 있어야 한다.
#   docker run -d --name drvalue_php -p 3300:80 -v "$PWD/..":/var/www/html php:8.3-apache
set -u
HERE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$HERE"

# 검사 대상은 lib/phpRoutes.mjs 한 곳에서 읽는다. 앱 폴더 이름에는 이제
# `.php` 가 없어서 폴더를 훑는 방법이 안 통하고, 목록을 여기 또 적으면
# 새 페이지를 넣을 때 한쪽만 고쳐 놓게 된다.
#
# **`.php` 가 붙은 옛 주소로 부른다.** PHP(:3300)는 그 주소로만 응답하고,
# Next(:3400)는 308 로 새 주소에 넘긴다 — compare.py 가 308 을 따라간다.
# 그래서 한 주소로 양쪽을 다 잰다.
PAGES=$(node -e "import('./lib/phpRoutes.mjs').then(m=>console.log(m.CLEAN_PATHS.map(p=>p+'.php').join('\n')))")

# 물음표 뒤 값에 따라 화면이 갈리는 페이지. 기본값만 재면 나머지 갈래는
# 아무도 안 본다.
# 홈(`/`)은 여기 없다. 원본에 없던 소식·신뢰의 근거 구역이 붙어서 이제
# 글자 단위로 같지 않다 — 원본이 그대로 남았는지는 scripts/check-home.py 가
# 따로 잰다.
# 이 문자열 안에는 주석을 넣지 않는다. 띄어쓰기로 쪼개져서 주석까지 주소가 된다.
PAGES="$PAGES
/page/support/notify_form.php?board=press"

# 대조 전에 소스가 스스로 깨진 곳이 없는지 먼저 본다. 깨져 있으면 모든
# 페이지가 500 이 되어서 "전부 다름" 으로 나오고, 진짜 원인이 안 보인다.
if ! python3 scripts/check-src.py; then
  echo "소스 검사에서 걸렸다. 대조는 돌리지 않는다."
  exit 1
fi

# 그림·CSS 가 public 안에 실제로 있는지도 본다. 빠지면 조용히 404 라
# 대조는 통과하면서 화면만 깨진다.
if ! python3 scripts/check-assets.py; then
  echo "그림·CSS 가 빠졌다. 대조는 돌리지 않는다."
  exit 1
fi

# 탭 막대는 compare.py 가 양쪽에서 떼고 본다(REDESIGNED). 뗀 자리를 여기서
# 대신 본다 — 이게 없으면 헤더는 아무도 안 보는 구멍이 된다.
if ! python3 scripts/check-header.py; then
  echo "탭 막대 검사에서 걸렸다. 대조는 돌리지 않는다."
  exit 1
fi

pass=0; fail=0
for pg in $PAGES; do
  out=$(python3 scripts/compare.py "$pg" 2>&1)
  n=$(printf '%s' "$out" | sed -n 's/.*차이 \([0-9]*\)건.*/\1/p')
  if [ "${n:-1}" = "0" ]; then
    pass=$((pass+1)); printf '  PASS  %s\n' "$pg"
  else
    fail=$((fail+1)); printf '  FAIL  %s (차이 %s건)\n' "$pg" "${n:-?}"
    printf '%s\n' "$out" | sed -n '/다름\|순서/,$p' | head -14 | sed 's/^/        /'
  fi
done
echo
echo "PASS=$pass FAIL=$fail"
[ "$fail" -eq 0 ]
