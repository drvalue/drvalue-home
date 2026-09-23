#!/usr/bin/env bash
# 특허·저작권 글에 증서 그림을 붙인다 — 운영 배포로 업로드(500)가 풀린 뒤 한 번 돌린다.
#
# 왜 있나: 특허·저작권 장은 증서 그림(thumbnail)이 있는 글만 그린다(web page.tsx:157).
#   글 11건은 이미 DB 에 있고, 이 스크립트가 마스킹한 증서 그림을 올려 각 글에 물린다.
#   증서 그림은 가림 처리본을 쓴다(patent1 발명자 주민번호·주소, patent2·3 대리인 칸).
#
# 선행:
#   1) 운영이 업로드 고침이 든 이미지로 떠 있어야 한다: cd /srv/drvalue && git pull && docker compose up -d --build
#      (그전에는 POST /api/admin/files 가 500 ADMIN_FILE_UPLOAD_UNKNOWN 이다)
#   2) 마스킹본이 있어야 한다. 이 스크립트와 같은 폴더의 masked/ 를 먼저 본다.
#      없으면 MASK_DIR 로 경로를 준다.
#
# 실행:
#   ADMIN_SESSION_SECRET=... ADMIN_EMAIL=you@drvalue.co.kr bash deploy/attach-cert-images.sh
#   (ADMIN_SESSION_SECRET 은 루트 .env 값. ADMIN_EMAIL 은 이력에 남을 관리자 계정 — admin_users 에 있어야 한다)
#
# 멱등: 이미 그림이 붙은 글은 건너뛴다. 여러 번 돌려도 그림은 한 번만.
set -euo pipefail

BASE="${API_BASE:-https://drvalue.co.kr}"
HERE="$(cd "$(dirname "$0")" && pwd)"
MASK_DIR="${MASK_DIR:-$HERE/masked}"
DIST="${DIST:-$HERE/../api/dist}"   # session-token.js 가 있는 곳

[ -n "${ADMIN_SESSION_SECRET:-}" ] || { echo "ADMIN_SESSION_SECRET 이 없다(루트 .env 값)." >&2; exit 2; }
EMAIL="${ADMIN_EMAIL:?이력에 남을 관리자 이메일을 ADMIN_EMAIL 로 준다 — admin_users 에 있어야 한다}"
[ -d "$MASK_DIR" ] || { echo "마스킹본 폴더가 없다: $MASK_DIR (MASK_DIR 로 경로를 주거나 masked/ 를 여기 둔다)" >&2; exit 2; }
[ -f "$DIST/common/session/session-token.js" ] || { echo "api 를 먼저 빌드하라(npm run build) 또는 DIST 로 dist 경로를 준다." >&2; exit 2; }

# 글 → 증서 그림 파일 (board|title|file). title 로 운영 글을 찾는다.
MAP=$(cat <<'EOF'
patent|마이크로서비스 아키텍처를 활용한 SaaS 서비스 제공 서버 및 방법|patent1.png
patent|SaaS 서비스를 제공하는 방법 및 그 시스템|patent2.png
patent|SaaS 어플리케이션 통합 관리 시스템 및 방법|patent3.png
patent|AI 에이전트를 활용한 도면인식 기반의 BOM 및 공정 자동 매칭 서버 및 방법|patent4.png
patent|인공지능 모델 기반의 건축 분야 온톨로지 구축 방법 및 그 전자 장치|patent5.png
patent|도면 인식 결과 검증을 위해 온톨로지를 이용하는 방법 및 그 전자 장치|patent6.png
copyright|클라우드 네이티브(CloudNative) 환경의 마이크로 서비스 아키텍처(MSA) 기반 사스(SaaS) 생산관리시스템(MES)|copyright1.png
copyright|그로우톡|copyright2.png
copyright|AI 하이브리드 LLM 기반 클라우드 MES 와 탄소절감형 제조매칭플랫폼 통합 연계 시스템|copyright3.png
copyright|차량관제 및 관리 시스템|copyright4.png
copyright|마이크로 서비스 아키텍처(MSA) 기반 제조 입찰 플랫폼|copyright5.png
EOF
)

# 서명 세션 하나(1시간). verify.sh 와 같은 방식 — 키를 아는 사람은 이미 서버 관리자다.
TOK=$(cd "$DIST/.." && node -e "const{issueSession}=require('./dist/common/session/session-token.js');console.log(issueSession(process.env.ADMIN_SESSION_SECRET,{email:process.env.EMAIL,role:'admin',name:'attach-cert-images',exp:Date.now()+3600000}))" EMAIL="$EMAIL" ADMIN_SESSION_SECRET="$ADMIN_SESSION_SECRET")
[ -n "$TOK" ] || { echo "세션 발급 실패." >&2; exit 1; }
COOKIE="dv_admin=$TOK"

api() { curl -s -m 60 -H "Cookie: $COOKIE" "$@"; }

ok=0; skip=0; fail=0
while IFS='|' read -r board title file; do
  [ -z "$board" ] && continue
  img="$MASK_DIR/$file"
  [ -f "$img" ] || { echo "❌ $board  파일 없음: $img"; fail=$((fail+1)); continue; }

  # 운영에서 이 글을 board+제목으로 찾는다.
  post=$(api "$BASE/api/admin/posts?board=$board&pageSize=100" \
    | python3 -c "import sys,json;d=json.load(sys.stdin);t=sys.argv[1];r=next((x for x in d['data'] if x.get('title')==t),None);print(json.dumps(r) if r else '')" "$title")
  [ -n "$post" ] || { echo "❌ $board  글 못 찾음: $title"; fail=$((fail+1)); continue; }
  id=$(echo "$post" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
  has=$(echo "$post" | python3 -c "import sys,json;print('y' if json.load(sys.stdin).get('thumbnail') else 'n')")
  [ "$has" = "y" ] && { echo "⏭  $board  이미 그림 있음: ${title:0:30}"; skip=$((skip+1)); continue; }

  # 그림을 올린다.
  up=$(api -X POST "$BASE/api/admin/files" -F "file=@$img;type=image/png" -F "title=$title")
  fid=$(echo "$up" | python3 -c "import sys,json
try: print((json.load(sys.stdin).get('data') or {}).get('id') or '')
except Exception: print('')")
  [ -n "$fid" ] || { echo "❌ $board  업로드 실패: ${title:0:30} — $(echo "$up" | head -c 120)"; fail=$((fail+1)); continue; }

  # 글 한 건을 받아 thumbnail 만 더해 다시 저장한다(PUT 은 전체 저장이라 필수 칸을 그대로 넘긴다).
  full=$(api "$BASE/api/admin/posts/$id" | python3 -c "import sys,json;print(json.dumps(json.load(sys.stdin)['data'],ensure_ascii=False))")
  body=$(echo "$full" | python3 -c "
import sys,json
p=json.load(sys.stdin); fid=sys.argv[1]
keep=['board','published_date','publish_at','unpublish_at','is_pinned','slug',
      'cert_state','cert_no','cert_date','cert_made_date','cert_kind','no_index']
out={k:p[k] for k in keep if p.get(k) is not None}
out['thumbnail']=fid
tr=p.get('translations') or []
out['translations']=[{'languages_code':x['languages_code'],'title':x.get('title'),
                      'summary':x.get('summary'),'body':x.get('body')} for x in tr] or \
                    [{'languages_code':'ko-KR','title':p.get('title')}]
print(json.dumps(out,ensure_ascii=False))" "$fid")
  res=$(api -X PUT "$BASE/api/admin/posts/$id" -H "Content-Type: application/json" -d "$body")
  good=$(echo "$res" | python3 -c "import sys,json
try: print('y' if (json.load(sys.stdin).get('data') or {}).get('thumbnail') else 'n')
except Exception: print('n')")
  if [ "$good" = "y" ]; then echo "✅ $board  ${title:0:30}"; ok=$((ok+1))
  else echo "❌ $board  붙이기 실패: ${title:0:30} — $(echo "$res" | head -c 120)"; fail=$((fail+1)); fi
done <<< "$MAP"

echo
echo "붙임 $ok · 건너뜀 $skip · 실패 $fail"
[ "$fail" -eq 0 ]
