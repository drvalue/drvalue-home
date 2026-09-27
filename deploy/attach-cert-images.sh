#!/usr/bin/env bash
# 특허·저작권 글에 증서 그림(thumbnail)을 붙인다 — 운영 배포로 업로드(500)가 풀린 뒤 한 번 돌린다.
#
# 왜 있나: 특허·저작권 장은 증서 그림이 있는 글만 그린다(web page.tsx 의 filter).
#   글 11건은 이미 DB 에 있고, 이 스크립트가 마스킹한 증서 그림을 올려 각 글에 문다.
#   증서 그림은 가림 처리본을 쓴다(patent1 발명자 주민번호·주소, patent2·3 대리인 칸).
#
# 선행:
#   1) 운영이 업로드 고침이 든 이미지로 떠 있어야 한다: cd /srv/drvalue && git pull && docker compose up -d --build
#   2) 마스킹본이 deploy/masked/ 에 있어야 한다(이 저장소에 커밋돼 있다).
#
# 실행(비밀값은 명령행에 노출되지 않게 앞에 export 로 준다. 정본 env 는 루트 .env 하나다):
#   export ADMIN_SESSION_SECRET="$(grep '^ADMIN_SESSION_SECRET=' .env | cut -d= -f2)"
#   ADMIN_EMAIL=you@drvalue.co.kr bash deploy/attach-cert-images.sh
#
# 멱등: 이미 그림이 붙은 글은 건너뛴다. 부분 실행 뒤 다시 돌려도 안전하다.
# 안전장치: (a) 마스킹본 SHA-256 을 아래 고정 매니페스트와 대조해 하나라도 다르면 아무것도 안 올린다
#   — 개인정보가 든 원본 증서가 섞여 올라가는 것을 막는다. (b) 대상 글이 board+제목으로 정확히 1건이
#   아니면(0건·2건 이상) 전체 중단. (c) 성공 판정은 thumbnail 이 우리가 올린 그 id 인지로 한다.
set -euo pipefail

BASE="${API_BASE:-https://drvalue.co.kr}"
HERE="$(cd "$(dirname "$0")" && pwd)"
MASK_DIR="${MASK_DIR:-$HERE/masked}"
DIST="${DIST:-$HERE/../api/dist}"   # session-token.js 가 있는 곳

[ -n "${ADMIN_SESSION_SECRET:-}" ] || { echo "ADMIN_SESSION_SECRET 이 없다(루트 .env 값). export 로 준다." >&2; exit 2; }
EMAIL="${ADMIN_EMAIL:?이력에 남을 관리자 이메일을 ADMIN_EMAIL 로 준다 — admin_users 에 있어야 한다}"
[ -d "$MASK_DIR" ] || { echo "마스킹본 폴더가 없다: $MASK_DIR" >&2; exit 2; }
[ -f "$DIST/common/session/session-token.js" ] || { echo "api 를 먼저 빌드하라(npm run build) 또는 DIST 로 dist 경로를 준다." >&2; exit 2; }

# 승인된 마스킹본의 SHA-256. 이 값과 다르면(원본이 섞였거나 파일이 바뀌었으면) 시작도 하지 않는다.
read -r -d '' MANIFEST <<'EOF' || true
76955d45c2874273cd03483ba18526ca8e10a14833b5c6b5aeb69de21cf0454a  patent1.png
c5358c879783af2aebbb6e66b5e72d1a97b641a18b142def1c813ebccc603b88  patent2.png
7977222d997c765704211dc6375618adec7a975a665b19c889099e7fe64cf43b  patent3.png
ab90050172cf3c16bb78f7f8c49ab8a5a3926a52d5d45c9a8e26b0347b3eb6ef  patent4.png
4076f31f13e7c840f0ba92d24446033fc34e77bffae18a4e424a371c8520e2b1  patent5.png
0fa44fc90b112d514bf910b9f2e79b69e3ceef3cb45f6b581b3f13690dcfc647  patent6.png
99ce81cec2e092c137222c0ff926f1db43307b57ddaf39c01550a00fcd8b32c3  copyright1.png
1c50cc1334b30dc23995843c7c1cb3bff0695b2c1662d8eb85f5798aff87d15f  copyright2.png
776f79b8a906a958399c5c3384147488201a0e68051ee31e974def4feda4c125  copyright3.png
6bc0910259e02d32e46e819765c7acf1aee386e87a1704fadb51abd9beb6e836  copyright4.png
8e68b63194da29ea1c0fc2896266f21100ab5296f4f4e7bf918ea13b344e177b  copyright5.png
EOF

# 글 → 증서 그림 (board|title|file). title 로 운영 글을 찾는다.
read -r -d '' MAP <<'EOF' || true
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

# SHA-256 — 리눅스는 sha256sum, 맥은 shasum. 둘 다 없으면 대조를 못 하니 중단(닫히는 쪽).
sha256() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1
  elif command -v shasum >/dev/null 2>&1; then shasum -a 256 "$1" | cut -d' ' -f1
  else echo "❌ sha256sum·shasum 둘 다 없다 — 무결성 대조 불가." >&2; exit 3; fi
}

# (a) 마스킹본 무결성 — 하나라도 어긋나면 아무 업로드도 안 한다.
echo "마스킹본 대조…"
while read -r want name; do
  [ -z "$name" ] && continue
  f="$MASK_DIR/$name"
  [ -f "$f" ] || { echo "❌ 마스킹본 없음: $f" >&2; exit 3; }
  got=$(sha256 "$f")
  [ "$got" = "$want" ] || { echo "❌ 해시 불일치(원본이 섞였을 수 있다): $name" >&2; echo "   기대 $want / 실제 $got" >&2; exit 3; }
done <<< "$MANIFEST"
echo "  11장 전부 승인된 마스킹본과 일치."

# 서명 세션 하나(1시간). verify.sh 와 같은 방식. 비밀값은 명령행 인수가 아니라 환경변수로만 넘긴다.
TOK=$(cd "$DIST/.." && EMAIL="$EMAIL" ADMIN_SESSION_SECRET="$ADMIN_SESSION_SECRET" node -e "const{issueSession}=require('./dist/common/session/session-token.js');console.log(issueSession(process.env.ADMIN_SESSION_SECRET,{email:process.env.EMAIL,role:'admin',name:'attach-cert-images',exp:Date.now()+3600000}))")
[ -n "$TOK" ] || { echo "세션 발급 실패." >&2; exit 1; }
COOKIE="dv_admin=$TOK"
api() { curl -s -m 90 -H "Cookie: $COOKIE" "$@"; }

# (b) 대상이 전부 정확히 1건인지 먼저 검증 — 하나라도 0건/복수면 쓰기 전에 중단.
#     목록은 한 쪽 30건이라, 그 게시판 전체(total)가 30 을 넘으면 우리가 다 못 본 것이라 판정을 못 한다 → 중단.
#     특허·저작권은 각 6·5 건이라 정상 범위. total 이 커지면 스크립트를 페이지 처리로 고쳐야 한다.
echo "대상 글 검증…"
while IFS='|' read -r board title file; do
  [ -z "$board" ] && continue
  n=$(api "$BASE/api/admin/posts?board=$board" \
    | python3 -c "import sys,json;d=json.load(sys.stdin);t=sys.argv[1]
if d.get('total',0) > len(d['data']): print('OVERFLOW'); raise SystemExit
print(sum(1 for x in d['data'] if x.get('title')==t))" "$title")
  [ "$n" = "OVERFLOW" ] && { echo "❌ $board  게시판이 한 쪽(30)을 넘는다 — 이 스크립트는 못 쓴다(페이지 처리 필요)." >&2; exit 4; }
  [ "$n" = "1" ] || { echo "❌ $board  제목 매칭 $n 건(1 이어야 한다): $title" >&2; exit 4; }
done <<< "$MAP"
echo "  11건 전부 정확히 1건."

ok=0; skip=0; fail=0
while IFS='|' read -r board title file; do
  [ -z "$board" ] && continue
  img="$MASK_DIR/$file"

  post=$(api "$BASE/api/admin/posts?board=$board" \
    | python3 -c "import sys,json;d=json.load(sys.stdin);t=sys.argv[1];r=next((x for x in d['data'] if x.get('title')==t),None);print(json.dumps(r) if r else '')" "$title")
  id=$(echo "$post" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
  has=$(echo "$post" | python3 -c "import sys,json;print('y' if json.load(sys.stdin).get('thumbnail') else 'n')")
  [ "$has" = "y" ] && { echo "⏭  $board  이미 그림 있음: ${title:0:30}"; skip=$((skip+1)); continue; }

  up=$(api -X POST "$BASE/api/admin/files" -F "file=@$img;type=image/png" -F "title=$title")
  fid=$(echo "$up" | python3 -c "import sys,json
try: print((json.load(sys.stdin).get('data') or {}).get('id') or '')
except Exception: print('')")
  [ -n "$fid" ] || { echo "❌ $board  업로드 실패: ${title:0:30} — $(echo "$up" | head -c 120)"; fail=$((fail+1)); continue; }

  # 글 한 건을 받아 thumbnail 만 더해 다시 저장한다. PUT 은 전체 저장이라, 안 보낸 칸은 서버가
  # 보존하지만(undefined→건너뜀), 번역은 보낸 것으로 덮으므로 8칸을 **전부 그대로** 넘긴다.
  full=$(api "$BASE/api/admin/posts/$id" | python3 -c "import sys,json;print(json.dumps(json.load(sys.stdin)['data'],ensure_ascii=False))")
  body=$(echo "$full" | python3 -c "
import sys,json
p=json.load(sys.stdin); fid=sys.argv[1]
keep=['board','published_date','publish_at','unpublish_at','is_pinned','slug',
      'cert_state','cert_no','cert_date','cert_made_date','cert_kind','no_index']
out={k:p[k] for k in keep if p.get(k) is not None}
out['thumbnail']=fid
tcols=['languages_code','title','summary','body','case_category_label','faq_category','seo_title','seo_description']
tr=p.get('translations') or []
out['translations']=[{c:x.get(c) for c in tcols if c in x} for x in tr] or [{'languages_code':'ko-KR','title':p.get('title')}]
print(json.dumps(out,ensure_ascii=False))" "$fid")
  res=$(api -X PUT "$BASE/api/admin/posts/$id" -H "Content-Type: application/json" -d "$body")
  got=$(echo "$res" | python3 -c "import sys,json
try: print((json.load(sys.stdin).get('data') or {}).get('thumbnail') or '')
except Exception: print('')" 2>/dev/null)
  # PUT 응답의 thumbnail 은 파일 id 라 우리가 올린 fid 와 같아야 붙은 것이다.
  if [ "$got" = "$fid" ]; then echo "✅ $board  ${title:0:30}"; ok=$((ok+1))
  else echo "❌ $board  붙이기 실패(fid=$fid got=$got): ${title:0:24} — $(echo "$res" | head -c 100)"; fail=$((fail+1)); fi
done <<< "$MAP"

echo
echo "붙임 $ok · 건너뜀 $skip · 실패 $fail"
[ "$fail" -eq 0 ]
