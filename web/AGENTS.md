# web — 공개 화면

## 이 덩어리가 맡는 것

사람이 보는 화면 전부. 주소 체계(옛 `.php` 주소를 308 로 받는 것 포함),
상단 메뉴, 검사 스크립트.

## 맡지 않는 것

- **데이터베이스를 직접 부르지 않는다.** Directus 를 모른다. `/api` 만 부른다.
- 메일 발송·세션·속도 제한은 `api` 것이다.
- 게시판 글을 만들거나 고치지 않는다. 읽기만 한다.
- 저장소 루트의 PHP 파일을 고치지 않는다.

## 늘 지켜야 하는 것

- **메뉴는 `lib/menu.ts` 하나에서 온다.** 상단 탭 막대 · 현재 위치 줄 ·
  왼쪽 차례표 · 사이트맵이 전부 이 파일을 읽는다. 다른 데 목록을 적으면
  한쪽만 고쳐져 어긋난다.
  - `hidden: true` 는 「드롭다운에 안 띄우되 이름은 아는」 항목이다. 현재
    위치 줄이 그 이름을 써야 해서 지우지 않는다.
  - `match` 가 배열인 이유는 M.AX 와 AI솔루션이 둘 다 `/page/business/`
    밑을 쓰기 때문이다.
- **페이지 전용 CSS 는 템플릿 문자열이다. 안에 역따옴표를 넣지 않는다.**
  하나만 들어가도 문자열이 끊겨 그 화면이 통째로 문법 오류가 되고, 모든
  화면이 500 이 된다.
- **가로 스크롤이 없어야 한다** — 390 · 768 · 1024 · 1280 · 1440.
  표·도식·코드 블록만 예외이고 자기 컨테이너 안에서만 민다.
- **자바스크립트가 꺼져도 글이 다 보여야 한다.** 등장 효과는 스크립트가
  숨기고, 스크립트가 안 돌면 아무것도 안 숨는다. 장치는 `app/layout.tsx`
  에 한 번 걸려 있고 규칙은 `styles/motion.css` 다 — 어느 장이든 표시만
  단다: `data-rv`(구역·자식 차례) · `data-rv="shot"`(그림) · `data-count`
  (숫자). 공개 장은 전부 새 틀(SolutionShell + `data-rv`)이다. AOS(`data-aos`)는 숨김 장 patent_old 에만 남았고 `<noscript>` 가 켠다.
- **제품 화면은 기능마다 한 장만 보인다.** 여러 장이면 첫 장 + 「N장 크게
  보기」다. 격자로 깔면 사진이 글보다 커진다(사용자가 되돌렸다).
- **`public/screens/` 에 안 쓰는 화면을 두지 않는다.** `check-pages.py` 가
  0장을 요구한다. 설명 그림·시안·같은 장면의 중복은 넣지 않는다.
- **`prefers-reduced-motion` 을 켠 사람에게 움직임을 끈다.** 끄되 결과는
  같다 — 숫자는 최종값, 글은 보임.
- **`<img>` 에 `width`·`height` 를 적는다.** 안 적으면 그림이 늦게 올 때
  화면이 한 번 흔들린다.
- **화면에 적는 숫자는 자료에서 센다.** 손으로 적지 않는다.
- `public/css`·`public/img`·`public/icon` 은 **루트 원본과 별개인 복사본**
  이다(커밋 `6f505ba` 에서 심볼릭 링크를 풀었다). 루트 `css/` 만 고치면
  Next 화면은 안 바뀐다. `style.css`·`header.css` 는 이미 내용이 다르다 —
  PHP 화면도 같이 바뀌어야 하면 양쪽을 다 고친다.

## 이 덩어리의 방식

- 화면은 서버 컴포넌트가 기본이다. 브라우저에서만 되는 일(관찰·모달·
  스크롤)만 `'use client'` 로 뺀다.
- 제품 설명·화면 캡처 설명은 `app/page/business/max/maxContent.ts` 와
  `app/page/service/solutionContent.ts` 에서 온다. 화면 파일에 글을 적지
  않는다 — 자료를 고쳤을 때 화면이 옛말을 하게 된다.
- 수행 과제는 `app/page/portfolio/portfolio/list.ts` 하나를 읽는다.
- 원본과 일부러 다르게 만든 자리는 **등록하고, 대신 볼 검사를 같이 만든다.**
  등록만 하고 검사를 안 만들면 그건 검사를 끈 것이다.

## 무엇을 검사하나

고치기 전과 후에 돌린다. 숫자가 줄면 되돌린다.

```bash
python3 scripts/check-src.py      # 제일 먼저. CSS 문자열이 깨졌나
python3 scripts/check-home.py     # 21/21   (:3400 이 떠 있어야 한다)
python3 scripts/check-header.py   # 103/103
python3 scripts/check-a11y.py     # 266/266
python3 scripts/check-assets.py   # 빠진 파일 0
python3 scripts/check-pages.py    # 98/54
npx tsc --noEmit && npx next build
```

`check-src.py` 를 먼저 돌리는 이유: CSS 문자열이 깨져 있으면 모든 화면이
500 이 되어 「전부 다름」으로 나오고 진짜 원인이 안 보인다.

**새로 채운 13장은 `check-pages.py` 가 본다** — 본문 글자·그림 수의 바닥, 등장
표시, 화면 파일 실재, 안 쓰는 화면 0장. 바닥은 채운 날의 실측이다. 낮추려면
왜 줄어도 되는지를 먼저 적는다.

브라우저로 볼 때는 다음 넷을 다 본다 — 보통 화면 / 자바스크립트 끈 화면 /
움직임 줄이기 켠 화면 / 390px.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
