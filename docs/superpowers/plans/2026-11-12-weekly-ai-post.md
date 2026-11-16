# 제조 AI 주간 글 자동 발행 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 주 1회, 제조 AI 소식 한 건을 조사·집필·검사해 통과한 글만 뉴스 게시판에 사람 손 없이 공개한다.

**Architecture:** api(Nest)에 새 모듈 `core/autopost`. 한 시간마다 도는 cron 이 「이번 주 기록이 있나」를 보고, 없으면 Claude API(조사 → 집필 → 판정)로 글을 만들어 코드 검사를 거친 뒤 `AdminPostDefaultService` 의 시스템 행위자 입구로 저장한다. 바깥 HTTP 입구는 없다. 주 단위 상태는 새 표 `autopost_runs`.

**Tech Stack:** NestJS 11 · TypeORM(Postgres) · `@nestjs/schedule` · `@anthropic-ai/sdk`(새 의존성) · 테스트는 빌드 뒤 `node --test` 로 `dist` 를 읽는 `.test.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-12-weekly-ai-post-design.md` — 실행자는 이 계획과 같이 읽는다.

## Global Constraints

- 가지 `heysep/weekly-ai-post`. `main` 을 고치지 않는다. 커밋은 경로를 적어서(`git add -A` 금지), 커밋마다 `git push`.
- 커밋 메시지 끝: `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`
- 먼저 읽는다: `docs/standards.md` · `docs/engineering-notes.md` · `api/AGENTS.md` · `docs/security.md`(커밋 안 되는 파일).
- 모듈 모양은 `core/admin-post`·`core/admin-schedule` 을 따른다. `python3 api/scripts/check-pattern.py` 문제 0.
- `process.env` 는 `api/src/common/config/app-config.ts` 에서만 읽는다.
- `@Cron` 진입점에 `@ServiceException` 을 겹치지 않는다. 진입점이 잡고 일은 `run(ctx)` 가 한다.
- 조사·집필·판정 호출 동안 DB 트랜잭션을 열지 않는다.
- 키 값을 로그·기록 표·오류 문장·문서에 싣지 않는다.
- 모델 `claude-opus-5-5` · 웹 검색 `web_search_20260209` · 웹 fetch `web_fetch_20260209` · 구조화 출력 `output_config.format`. Claude 호출 코드를 쓰기 전에 `claude-api` 스킬의 `typescript/claude-api/README.md`·`tool-use.md` 를 읽는다. SDK 이름을 추측하지 않는다.
- 운영 컨테이너에 `TZ` 가 없다. 주·요일·시각은 +09:00 을 코드에서 더해 계산한다.
- 한 주 시도 최대 2번. 오류로 끝난 주만 다시 한다. 검사 탈락은 다시 하지 않는다.
- 금지 문자열: `디알밸류`·`GrowXD`·`CosmoGMP`·`M.AX`(단 `M.AX 얼라이언스` 는 통과). 출처 제목 칸은 검사하지 않는다.
- 글에 AI 작성 표기를 넣지 않는다. 그림·이모지 없음. 한국어(`ko-KR`)만.
- 기존 검사 수가 줄면 되돌린다(`docs/standards.md` 「검사 통과 기준」).

## Review Focus

1. **출처 날짜가 비었거나 형식이 다른 글**(`2026.11.10`, `November 10`, 빈 값) → 「14일 안」으로 통과하면 안 된다. 읽을 수 없는 날짜는 탈락. (Task 3)
2. **숫자의 표기 차이**(본문 `1,200억`·`30%` vs 주장 `1200억`·`30 %`, 전각 숫자) → 같은 값으로 맞춰 보고, 못 맞추면 탈락 쪽으로. (Task 3)
3. **모델 출력에 든 HTML·꺾쇠·`javascript:` 주소** → 글자는 이스케이프돼 나가고, http(s) 가 아닌 주소는 탈락. (Task 2·3)
4. **컨테이너가 조사 도중 재시작** → 「진행 중」 행이 남는다. 2시간 뒤 오류로 닫히고 시도 횟수 안에서 한 번 더 돈다. 글이 두 편 생기면 안 된다. (Task 4·7)
5. **일요일 밤 늦게 처음 켜짐·해 넘김 주**(ISO 주 1주차·53주차) → 주 키가 KST 기준으로 맞고, 같은 주에 두 번 만들지 않는다. (Task 1)

---

## File Structure

```
api/src/core/autopost/
├── autopost.module.ts
├── model/article.ts                       # 구조화 출력의 형(순수)
├── service/autopost-week.ts               # 주 키·때가 됐나(순수)
├── service/autopost-render.ts             # 글 → HTML(순수)
├── service/autopost-lint.ts               # 코드 검사(순수)
├── service/autopost-plan.ts               # 기록 행을 보고 할 일 정하기(순수)
├── service/autopost-default.service.ts    # cron · 순서 짜기
├── client/autopost-claude.client.ts       # Claude 호출 셋
├── repository/autopost-run-default.repository.ts
├── error/autopost.error.ts
└── service/*.test.mjs
api/src/common/entity/autopost-run.entity.ts
api/src/autopost-cli.ts                    # 손으로 돌리기
db/migrations/0023-autopost-runs.sql · db/schema.sql
```

---

### Task 1: 주 키와 「때가 됐나」

**Files:**
- Create: `api/src/core/autopost/service/autopost-week.ts`
- Test: `api/src/core/autopost/service/autopost-week.test.mjs`

**Interfaces:**
- Produces: `weekKey(now: Date): string` — KST 기준 ISO 주, `'2026-W46'` 꼴. `isDue(now: Date): boolean` — 그 주 화요일 09:00 KST 이후면 true(수~일도 true, 월요일과 화요일 09:00 전은 false). `kstDate(now: Date): string` — `'2026-11-12'`.

- [ ] **Step 1: 실패하는 테스트**

```js
test('주 키는 KST 로 센다', () => {
  assert.equal(weekKey(new Date('2026-11-09T14:59:00Z')), '2026-W46'); // KST 월 23:59
  assert.equal(weekKey(new Date('2026-11-08T15:00:00Z')), '2026-W46'); // KST 월 00:00
  assert.equal(weekKey(new Date('2026-11-08T14:59:00Z')), '2026-W45'); // KST 일 23:59
});
test('해 넘김 주', () => {
  assert.equal(weekKey(new Date('2026-12-31T03:00:00Z')), '2026-W53');
  assert.equal(weekKey(new Date('2027-01-03T03:00:00Z')), '2026-W53');
  assert.equal(weekKey(new Date('2027-01-04T03:00:00Z')), '2027-W01');
});
test('화요일 09:00 KST 부터', () => {
  assert.equal(isDue(new Date('2026-11-09T23:59:00Z')), false); // 화 08:59
  assert.equal(isDue(new Date('2026-11-10T00:00:00Z')), true);  // 화 09:00
  assert.equal(isDue(new Date('2026-11-15T14:00:00Z')), true);  // 일 23:00
  assert.equal(isDue(new Date('2026-11-09T03:00:00Z')), false); // 월 12:00
});
test('kstDate', () => assert.equal(kstDate(new Date('2026-11-11T15:30:00Z')), '2026-11-12'));
```

- [ ] **Step 2:** `cd api && npm run build && node --test src/core/autopost/service/autopost-week.test.mjs` → FAIL(모듈 없음)
- [ ] **Step 3:** 세 함수를 구현한다. `Date` 에 9시간을 더한 뒤 UTC 접근자만 쓴다(`Intl`·로컬 시간대 금지).
- [ ] **Step 4:** 같은 명령 → PASS
- [ ] **Step 5:** 커밋 `자동 글: 주 키와 발행 시각 계산`

---

### Task 2: 글의 형과 HTML 만들기

**Files:**
- Create: `api/src/core/autopost/model/article.ts`, `api/src/core/autopost/service/autopost-render.ts`
- Test: `api/src/core/autopost/service/autopost-render.test.mjs`

**Interfaces:**
- Produces (`model/article.ts`):

```ts
export interface ArticleSource { title: string; url: string; publisher: string; published: string } // published: 'YYYY-MM-DD'
export interface ArticleClaim { sentence: string; value: string; source_url: string; quote: string }
export interface ArticleSection { heading: string; paragraphs: string[] }
export interface Article {
  title: string; summary: string; seo_description: string;
  hook: string[]; sections: ArticleSection[];
  sources: ArticleSource[]; claims: ArticleClaim[];
}
export const ARTICLE_JSON_SCHEMA: object; // 위 형과 같은 JSON Schema(additionalProperties:false, 전부 required)
```

- Produces (`autopost-render.ts`): `renderArticle(a: Article): string`, `CTA_HTML: string`, `bodyText(a: Article): string`(모델이 쓴 글자만 — 제목·요약·설명·훅·단락 제목·단락을 줄바꿈으로 이은 것. 출처 제목과 CTA 는 뺀다).
- 고정 문구(코드 상수, 그대로):
  `<p>제조 현장에 AI 를 어떻게 들일지 고민하고 계신다면 <a href="/page/support/notify_form">문의</a>를 남겨 주세요.</p>`

- [ ] **Step 1: 실패하는 테스트** — 고정 자료 `sample`(훅 2문단, 단락 4개, 출처 2개)로:

```js
const { sanitizeBody } = require('../../../../dist/common/html/sanitize-body.js');
test('만든 HTML 은 소독의 고정점', () => { const h = renderArticle(sample); assert.equal(sanitizeBody(h), h); });
test('모양', () => {
  const h = renderArticle(sample);
  assert.match(h, /^<p>/);
  assert.equal((h.match(/<h2>/g) || []).length, sample.sections.length + 1); // + 출처
  assert.ok(h.includes('<h2>1. ' + sample.sections[0].heading + '</h2>'));
  assert.ok(h.includes('target="_blank" rel="noopener noreferrer"'));
  assert.ok(h.endsWith(CTA_HTML));
});
test('모델이 쓴 꺾쇠·따옴표는 글자로 나간다', () => {
  const h = renderArticle({ ...sample, hook: ['<script>alert(1)</script> & "x"'] });
  assert.ok(!h.includes('<script>'));
  assert.equal(sanitizeBody(h), h);
});
test('bodyText 에 출처 제목·CTA 가 없다', () => {
  const t = bodyText({ ...sample, sources: [{ ...sample.sources[0], title: 'M.AX 뉴스' }] });
  assert.ok(!t.includes('M.AX 뉴스')); assert.ok(!t.includes('문의'));
});
```

- [ ] **Step 2:** 빌드 + `node --test …autopost-render.test.mjs` → FAIL
- [ ] **Step 3:** 구현. 순서: 훅 `<p>` 들 → 단락마다 `<h2>N. 제목</h2>` + `<p>` 들 → `<h2>출처</h2><ul><li><a href target rel>제목</a> — 발행처, 날짜</li>…</ul>` → `CTA_HTML`. 글자는 `& < > "` 를 이스케이프. 줄바꿈·들여쓰기 없이 한 줄로 잇는다(소독 고정점이 되게 — 안 맞으면 소독 결과에 맞춘다).
- [ ] **Step 4:** PASS
- [ ] **Step 5:** 커밋 `자동 글: 글의 형과 HTML 만들기`

---

### Task 3: 코드 검사

**Files:**
- Create: `api/src/core/autopost/service/autopost-lint.ts`
- Test: `api/src/core/autopost/service/autopost-lint.test.mjs`

**Interfaces:**
- Consumes: `Article`, `bodyText`, `renderArticle`, `sanitizeBody`.
- Produces:

```ts
export interface LintContext { today: string /* KST 'YYYY-MM-DD' */; usedSourceUrls: string[]; verified: Record<string, boolean> /* claim.value → 판정 */ }
export function lintStructure(a: Article, ctx: Pick<LintContext, 'today' | 'usedSourceUrls'>): string[]; // 판정 호출 전에 돌린다
export function lintClaims(a: Article, verified: Record<string, boolean>): string[];                      // 판정 뒤에 돌린다
export function numbersIn(text: string): string[]; // 정규화한 숫자 토큰
```

돌려주는 것은 사람이 읽는 한국어 사유 문장의 목록. 빈 배열이면 통과.

규칙과 값:
- 제목 10~60자 · 요약 20~200자 · `seo_description` 50~160자 · 훅 1~3문단 · 단락 4~6개 · 단락마다 문단 1~5개 · 출처 1~6개 · 주장 1개 이상.
- 출처 `url` 은 `new URL()` 로 읽히고 `http:`/`https:`. `published` 는 `^\d{4}-\d{2}-\d{2}$` 이고 실제 날짜이며 `today` 기준 0~14일 전(미래 날짜 탈락).
- 출처 `url` 이 `usedSourceUrls` 에 있으면 탈락(비교 전 끝 `/`·`#…`·`utm_*` 쿼리를 뗀다).
- 주장의 `source_url` 은 출처 목록에 있어야 한다.
- 금지 문자열: `bodyText(a)` 에 `디알밸류`·`GrowXD`·`CosmoGMP`·`M.AX`. `M.AX 얼라이언스`(사이 공백 0~1)를 먼저 지우고 본다.
- 이모지(`\p{Extended_Pictographic}`)가 `bodyText` 에 있으면 탈락.
- `sanitizeBody(renderArticle(a)) !== renderArticle(a)` 면 탈락.
- 숫자: `numbersIn(bodyText(a))` 의 토큰마다 「`verified[v] === true` 인 주장 `v` 의 `numbersIn(v)` 중 하나」에 있어야 한다. 없으면 `주장 목록에 없는 숫자: <토큰>`. `verified[v] !== true` 인 주장이 하나라도 있으면 `출처에서 확인되지 않은 주장: <sentence>`.
- `numbersIn` 정규화: 전각 숫자 → 반각, 숫자 사이 쉼표 제거, 숫자와 단위 사이 공백 제거. 토큰은 숫자열(소수점 포함)만 — 단위는 붙이지 않는다(`30%`·`30 %`·`30퍼센트` 가 모두 `30`). 예외(검사 안 함): 단락 번호로 쓰인 것은 `bodyText` 에 없으니 해당 없음 · 4자리 연도(`19xx`·`20xx` 뒤에 `년`) · `N월`·`N일` · 한 자리 숫자 뒤의 `가지`·`개`·`번째`·`단계`.

- [ ] **Step 1: 실패하는 테스트** — `good`(통과하는 고정 자료, `today='2026-11-12'`)에서 한 군데씩 바꿔:

```js
const pass = (a, c = {}) => [...lintStructure(a, { today: '2026-11-12', usedSourceUrls: [], ...c }), ...lintClaims(a, allTrue(a))];
test('통과', () => assert.deepEqual(pass(good), []));
test('주장에 없는 숫자', () => assert.match(pass(withHook(good, '불량률이 47% 줄었습니다.')).join(), /주장 목록에 없는 숫자: 47/));
test('표기 차이는 같은 값', () => { /* 주장 value '1,200억 원', 본문 '１２００억' → 통과 */ });
test('확인 안 된 주장', () => assert.match(lintClaims(good, { ...allTrue(good), [good.claims[0].value]: false }).join(), /확인되지 않은 주장/));
test('오래된 출처', () => assert.ok(pass(withSourceDate(good, '2026-10-28')).length));   // 15일 전
test('14일 전은 통과', () => assert.deepEqual(pass(withSourceDate(good, '2026-10-29')), []));
test('읽을 수 없는 날짜', () => { for (const d of ['', '2026.11.10', 'November 10, 2026', '2026-13-40', '2026-11-13']) assert.ok(pass(withSourceDate(good, d)).length, d); });
test('겹치는 출처', () => assert.ok(pass(good, { usedSourceUrls: [good.sources[0].url + '/?utm_source=x#top'] }).length));
test('금지 문자열', () => { for (const s of ['디알밸류', 'GrowXD', 'CosmoGMP', 'M.AX 플랫폼']) assert.ok(pass(withHook(good, s + ' 이야기입니다.')).length, s); });
test('M.AX 얼라이언스는 통과', () => assert.deepEqual(pass(withHook(good, '산업부가 M.AX 얼라이언스를 출범했습니다.')), []));
test('출처 제목의 M.AX 는 안 본다', () => assert.deepEqual(pass(withSourceTitle(good, 'M.AX 관련 발표')), []));
test('http 가 아닌 주소', () => assert.ok(pass(withSourceUrl(good, 'javascript:alert(1)')).length));
test('이모지', () => assert.ok(pass(withHook(good, '🚨 속보입니다.')).length));
test('연도·날짜·한 자리 개수는 숫자 검사 예외', () => assert.deepEqual(pass(withHook(good, '2026년 11월 10일, 세 회사가 3가지 기능을 냈습니다.')), []));
```

- [ ] **Step 2:** FAIL 확인
- [ ] **Step 3:** 구현
- [ ] **Step 4:** PASS
- [ ] **Step 5:** 커밋 `자동 글: 코드 검사(숫자 대조·출처 날짜·금지 문자열)`

---

### Task 4: 기록 표와 「할 일 정하기」

**Files:**
- Create: `db/migrations/0023-autopost-runs.sql`, `api/src/common/entity/autopost-run.entity.ts`, `api/src/core/autopost/repository/autopost-run-default.repository.ts`, `api/src/core/autopost/service/autopost-plan.ts`
- Modify: `db/schema.sql`(같은 표를 끝에), 엔티티 등록 자리(`post.entity.ts` 가 등록된 곳을 찾아 같은 방식으로)
- Test: `api/src/core/autopost/service/autopost-plan.test.mjs`

**Interfaces:**
- 표 `autopost_runs`: `week_key varchar(8) PRIMARY KEY` · `status varchar(12) NOT NULL` (`running`·`published`·`drafted`·`skipped`·`error`) · `attempts smallint NOT NULL DEFAULT 1` · `reason text` · `post_id integer`(FK 없음 — 글을 지워도 기록은 남는다) · `article jsonb` · `input_tokens integer` · `output_tokens integer` · `started_on timestamptz NOT NULL DEFAULT now()` · `finished_on timestamptz`. 마이그레이션은 `CREATE TABLE IF NOT EXISTS`, 머리 주석은 0021 의 모양을 따른다.
- `planRun(row: { status: string; attempts: number; startedOn: Date } | null, now: Date): 'start' | 'retry' | 'reap' | 'none'`
  - 행 없음 → `start` · `running` 이고 시작 2시간 넘음 → `reap` · `running` 2시간 이내 → `none` · `error` 이고 `attempts < 2` → `retry` · 그 밖 → `none`.
- 저장소: `findByWeek(ctx, weekKey)` · `claim(ctx, weekKey): Promise<boolean>`(`INSERT … ON CONFLICT (week_key) DO NOTHING`, 넣었으면 true) · `claimRetry(ctx, weekKey): Promise<boolean>`(`UPDATE … SET status='running', attempts=attempts+1, started_on=now() WHERE week_key=$1 AND status='error' AND attempts<2`) · `finish(ctx, weekKey, patch)` · `usedSourceUrls(ctx, limit = 30): Promise<string[]>`(`status='published'` 행의 `article->'sources'` 에서 url, 최근 순).

- [ ] **Step 1: 실패하는 테스트**

```js
const t0 = new Date('2026-11-10T00:00:00Z'), h = (n) => new Date(t0.getTime() + n * 3600e3);
test('할 일', () => {
  assert.equal(planRun(null, t0), 'start');
  assert.equal(planRun({ status: 'running', attempts: 1, startedOn: t0 }, h(1.9)), 'none');
  assert.equal(planRun({ status: 'running', attempts: 1, startedOn: t0 }, h(2.1)), 'reap');
  assert.equal(planRun({ status: 'error', attempts: 1, startedOn: t0 }, h(1)), 'retry');
  assert.equal(planRun({ status: 'error', attempts: 2, startedOn: t0 }, h(1)), 'none');
  for (const s of ['published', 'drafted', 'skipped']) assert.equal(planRun({ status: s, attempts: 1, startedOn: t0 }, h(1)), 'none');
});
```

- [ ] **Step 2:** FAIL 확인
- [ ] **Step 3:** 마이그레이션·schema·엔티티·저장소·`planRun` 구현
- [ ] **Step 4:** 테스트 PASS. 로컬 DB 에 마이그레이션이 두 번 돌아도 같은지 확인: api 를 두 번 띄워 오류 없음(`docs/operations.md` 의 띄우는 순서).
- [ ] **Step 5:** 커밋 `자동 글: 주 단위 기록 표 autopost_runs (마이그레이션 0023)`

---

### Task 5: 시스템 행위자 입구와 설정

**Files:**
- Modify: `api/src/core/admin-post/service/admin-post-default.service.ts`(`create` 옆), `api/src/common/config/app-config.ts`, `.env.example`, `docker-compose.yml`(api `environment` 에 두 줄 — `NOINDEX` 줄과 같은 `${…:-}` 모양)
- Test: `api/src/core/autopost/service/autopost-config.test.mjs`

**Interfaces:**
- Produces: `AdminPostDefaultService.createAsSystem(ctx: ITransactionContext, dto: ControllerAdminPostDefaultSaveDto, actor: string): Promise<Detail>` — `dto.board !== 'news'` 면 `AdminPostError` 의 새 코드(`SYSTEM_BOARD`, 403)로 던진다. 그 밖에는 `create` 와 같은 일(한국어 제목 필수·slug 겹침·소독·순서·변경 이력의 `actor`·IndexNow). `create` 와 몸통을 나눠 쓰되 `create` 의 동작은 그대로 둔다.
- Produces: `AppConfig.autopost = { get enabled(): boolean /* AUTOPOST_ENABLED === '1' */, get apiKey(): string /* ANTHROPIC_API_KEY ?? '' */, get ready(): boolean /* enabled && apiKey !== '' */ }`.

- [ ] **Step 1: 실패하는 테스트** — `process.env` 를 바꿔 가며: 둘 다 없음 → `ready` false · 키만 → false · `AUTOPOST_ENABLED=true`(1 이 아님)+키 → false · `1`+빈 키 → false · `1`+키 → true.
- [ ] **Step 2:** FAIL 확인
- [ ] **Step 3:** 구현. `.env.example` 에는 이름과 한 줄 설명만(값 없음).
- [ ] **Step 4:** PASS · 기존 테스트 전부(`api/AGENTS.md:254` 의 명령) PASS · `bash api/scripts/verify.sh` 가 고치기 전과 같은 수로 통과(글 만들기 구간이 그대로인지).
- [ ] **Step 5:** 커밋 `자동 글: 뉴스 전용 시스템 행위자 입구와 닫힌 기본값 설정`

---

### Task 6: Claude 호출

**Files:**
- Create: `api/src/core/autopost/client/autopost-claude.client.ts`
- Modify: `api/package.json`(`@anthropic-ai/sdk` 최신 안정판)

**Interfaces:**
- Produces:

```ts
export interface Usage { input: number; output: number }
export interface Research { topic: string; notes: string; sourceUrls: string[] }
export interface AutopostClient {
  research(input: { today: string; avoidTitles: string[]; avoidUrls: string[] }): Promise<{ research: Research; usage: Usage }>;
  write(input: { today: string; research: Research; errors?: string[]; previous?: Article }): Promise<{ article: Article; usage: Usage }>;
  verify(article: Article): Promise<{ verified: Record<string, boolean>; usage: Usage }>; // claim.value → 출처 원문에 그 뜻으로 있나
}
export const AUTOPOST_CLIENT = Symbol('AUTOPOST_CLIENT');
@Injectable() export class AutopostClaudeClient implements AutopostClient
```

- 호출 셋의 모양:
  - `research`: 웹 검색 도구(`max_uses: 10`). 프롬프트에 스펙의 범위·최근 14일·1차 출처 우선·피할 제목과 주소. 끝에 `Research` 를 구조화 출력으로 받는 **두 번째 호출**로 정리한다(웹 도구 호출의 본문을 그대로 넘긴다). 인용(citations)과 구조화 출력을 한 호출에 같이 쓰지 않는다.
  - `write`: 도구 없음. `output_config.format` 에 `ARTICLE_JSON_SCHEMA`. 프롬프트에 스펙 「한 편이 만들어지는 순서」 2번의 틀·말투·금지 사항, `errors` 가 있으면 「이전 글과 떨어진 사유」를 붙인다.
  - `verify`: 웹 fetch 도구(`max_uses` = 출처 수 + 2). 메시지에 출처 주소와 주장 목록을 넣는다(fetch 는 대화에 나온 주소만 연다). 끝에 `{ results: [{ value, found: boolean }] }` 를 구조화 출력으로 받는 두 번째 호출. 응답에 없는 주장·fetch 가 실패한 출처에 기댄 주장은 `false`.
- `stop_reason` 이 `refusal`·`max_tokens` 면 던진다. `pause_turn` 은 이어서 보낸다(스킬 문서의 방식).
- 클라이언트 생성은 `new Anthropic({ apiKey: AppConfig.autopost.apiKey })`. 키를 오류 문장에 넣지 않는다.
- 시간 제한은 호출마다 10분.

- [ ] **Step 1:** `claude-api` 스킬의 TypeScript 문서를 읽는다(구조화 출력, 서버 도구, `pause_turn`).
- [ ] **Step 2:** 의존성 추가 · 구현. 네트워크 테스트는 두지 않는다 — Task 8 의 「보기만」 실행이 이 파일의 증거다.
- [ ] **Step 3:** `cd api && npm run typecheck && npm run build` 통과
- [ ] **Step 4:** 커밋 `자동 글: Claude 호출(조사·집필·판정)`

---

### Task 7: 순서 짜기와 cron

**Files:**
- Create: `api/src/core/autopost/service/autopost-default.service.ts`, `api/src/core/autopost/error/autopost.error.ts`, `api/src/core/autopost/autopost.module.ts`
- Modify: `api/src/app/app.module.ts`(모듈 등록)
- Test: `api/src/core/autopost/service/autopost-flow.test.mjs`

**Interfaces:**
- Consumes: Task 1~6 의 전부.
- Produces:

```ts
export type AutopostMode = 'auto' | 'preview' | 'draft';
export interface AutopostResult { outcome: 'published' | 'drafted' | 'skipped' | 'preview'; reasons: string[]; article?: Article; html?: string; postId?: number; usage: Usage }
export async function produce(client: AutopostClient, input: { today: string; avoidTitles: string[]; avoidUrls: string[] }): Promise<{ ok: boolean; article: Article; reasons: string[]; usage: Usage }>; // 순수한 순서 — DB 없음
class AutopostDefaultService { tick(): Promise<void>; run(ctx, mode: AutopostMode, now?: Date): Promise<AutopostResult | null> }
```

- `produce`: 조사 → 집필 → `lintStructure` → (통과하면) 판정 → `lintClaims`. 사유가 있으면 `write` 를 `errors`·`previous` 와 함께 **한 번** 더 부르고 같은 검사를 다시 한다. `usage` 는 전부 더한다.
- `run('auto')`: `AppConfig.autopost.ready` 가 아니면 `null`(Claude 를 부르지 않는다) → `isDue(now)` 아니면 `null` → `planRun` 에 따라 `reap`(행을 `error` 로 닫고 이번 틱은 끝) · `start`(`claim`)·`retry`(`claimRetry`) — 잡지 못하면 `null` → `produce` → 통과면 `createAsSystem`(짧은 트랜잭션, `status: 'published'`, `board: 'news'`, `slug: 'mfg-ai-' + today.replaceAll('-','')`, `published_date: today`, 번역 `ko-KR` 에 제목·요약·본문·`seo_title`(= 제목)·`seo_description`) 뒤 `finish('published')` · 탈락이면 `finish('skipped', reasons, article)` · 던져지면 `finish('error', 사유 한 줄)`.
- `run('preview')`: 설정의 `enabled` 는 보지 않고 키만 본다. 기록 표를 건드리지 않고 `produce` 결과와 HTML 을 돌려준다.
- `run('draft')`: `preview` + 통과 여부와 무관하게 `createAsSystem` 을 `status: 'draft'`, slug 끝에 `-draft-<시각36진>` 으로. 기록 표는 건드리지 않는다.
- `tick()`: `@Cron(CronExpression.EVERY_HOUR)`. `admin-schedule` 의 `tick` 과 같은 모양(잡고 로그만). 꺼져 있으면 모듈이 뜰 때 `자동 글: 꺼져 있습니다` 한 줄.
- 행위자 `autopost@system`.

- [ ] **Step 1: 실패하는 테스트** — 가짜 `AutopostClient`(호출 횟수를 센다)로 `produce`:

```js
test('한 번에 통과', async () => { const c = fake({ articles: [good] }); const r = await produce(c, input); assert.equal(r.ok, true); assert.deepEqual(c.calls, { research: 1, write: 1, verify: 1 }); });
test('떨어지면 한 번만 다시 쓴다', async () => { const c = fake({ articles: [bad, good] }); const r = await produce(c, input); assert.equal(r.ok, true); assert.equal(c.calls.write, 2); assert.ok(c.lastWrite.errors.length); });
test('두 번 떨어지면 탈락', async () => { const c = fake({ articles: [bad, bad] }); const r = await produce(c, input); assert.equal(r.ok, false); assert.equal(c.calls.write, 2); assert.ok(r.reasons.length); });
test('구조 검사에 떨어지면 판정 호출을 안 한다', async () => { const c = fake({ articles: [badStructure, badStructure] }); await produce(c, input); assert.equal(c.calls.verify, 0); });
test('판정이 없다고 한 주장이 있으면 탈락', async () => { const c = fake({ articles: [good, good], verified: () => false }); assert.equal((await produce(c, input)).ok, false); });
test('토큰 수를 전부 더한다', async () => { /* research 10/1 + write 20/2 + verify 30/3 → { input: 60, output: 6 } */ });
```

- [ ] **Step 2:** FAIL 확인
- [ ] **Step 3:** 구현. `produce` 는 `autopost-default.service.ts` 밖으로 내보내는 순수 함수.
- [ ] **Step 4:** 테스트 PASS · `python3 api/scripts/check-pattern.py` 문제 0(컨트롤러 없는 모듈이 `admin-schedule` 처럼 통과하는지 — 안 되면 스크립트가 `admin-schedule` 을 어떻게 받는지 보고 같은 조건을 맞춘다) · 환경변수 없이 api 를 띄워 `자동 글: 꺼져 있습니다` 가 찍히고 `autopost_runs` 에 행이 안 생기는 것.
- [ ] **Step 5:** 커밋 `자동 글: 한 주 한 편 순서 짜기와 한 시간 cron`

---

### Task 8: 손으로 돌리기와 실제 실행

**Files:**
- Create: `api/src/autopost-cli.ts`
- Modify: `api/package.json`(`"autopost": "node dist/autopost-cli.js"`)

**Interfaces:**
- `npm run autopost -- --preview` · `npm run autopost -- --draft`. `NestFactory.createApplicationContext(AppModule)` 로 띄워 `AutopostDefaultService.run(ctx, mode)` 를 부르고 닫는다. 출력: 결과(`outcome`)·사유 목록·제목·HTML·토큰 수(입력/출력). 인자가 없거나 다르면 쓰는 법을 찍고 종료코드 2.

- [ ] **Step 1:** 구현 · 빌드
- [ ] **Step 2:** 키 없이 `npm run autopost -- --preview` → 「키가 없습니다」 한 줄, 종료코드 1, Claude 호출 없음.
- [ ] **Step 3:** 키가 있으면 `--preview` 를 한 번 돌려 출력 전체를 스크래치패드 파일로 남긴다. 사람이 읽을 것: 글, 사유, 토큰 수. 키가 없으면 **이 단계는 판정 불가**로 적고 넘어간다(키 값을 묻거나 출력하지 않는다 — 사용자가 `.env` 에 직접 넣는다).
- [ ] **Step 4:** 키가 있으면 `--draft` 한 번 → 그 글이 `/page/support/news` 목록·`/sitemap.xml`·`/rss.xml` 에 **없는** 것, 관리 화면에서 공개로 바꾸면 셋에 **있는** 것, 그림 없는 글에서 목록(`BoardList.tsx`)·첫 화면 소식 칸(`HomeNews.tsx`)이 깨지지 않는 것. 확인 뒤 그 글은 지운다(지우기 전에 사용자에게 알린다).
- [ ] **Step 5:** 커밋 `자동 글: 손으로 돌리는 명령(보기만·초안으로)`

---

### Task 9: 문서와 전체 검사

**Files:**
- Modify: `docs/business-rules.md`(「게시판」), `docs/operations.md`(환경변수 표·명령), `api/AGENTS.md`(기능 목록·테스트 명령 줄과 개수), `docs/architecture.md`(바깥 의존에 Claude API), `docs/tracking/status.md`(이 기능 줄 + 낡은 「새 서버에 올린다」「전환 날짜」 바로잡기), `docs/security.md`(커밋 안 됨 — 새 비밀값·닫힌 기본값)
- Create: `docs/tracking/decisions/0020-제조-AI-주간-글-사람-검수-없이-공개.md` + `index.md` 한 줄

- [ ] **Step 1:** 문서를 고친다. 결정 0020 에는 「무엇을 정했나 · 다르게 정할 수도 있었던 것(초안 → 사람 승인) · 대가(검사가 못 막는 것 넷 — 스펙의 목록 그대로) · 실패 알림 없음」.
- [ ] **Step 2:** 전체 검사: `cd api && npm run typecheck && npm run build` · `api/AGENTS.md` 의 `node --test …` 줄(새 테스트 파일 포함, 개수 갱신) · `python3 api/scripts/check-pattern.py` · `bash api/scripts/verify.sh` · web 쪽 `docs/standards.md` 「검사 통과 기준」의 명령들(`check-boards.py` 포함). 수가 줄지 않았는지 고치기 전 값과 나란히 적는다. 못 돌린 검사는 「판정 불가」와 이유.
- [ ] **Step 3:** 커밋 `자동 글: 문서와 결정 0020` · push · PR 을 연다(`main` 대상, 본문에 못 막는 것·판정 불가 항목·켜는 법: 운영 `.env` 에 `ANTHROPIC_API_KEY`·`AUTOPOST_ENABLED=1` 을 넣고 배포). **병합과 운영 켜기는 사람이 한다.**
