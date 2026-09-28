/**
 * robots.txt 의 규칙 묶음을 정한다. import 가 없는 순수 함수다 — `robots-rules.test.mjs` 가 node 로 바로 읽는다.
 * 어떤 봇이 어느 묶음인지와 그 이유는 app/robots.ts 머리 주석에 있다.
 */

/** 검색엔진. 막으면 그 검색에서 사이트가 통째로 빠진다 — 관리 화면 스위치와 무관하게 늘 연다. */
export const SEARCH_ENGINES = ['Yeti', 'Daumoa', 'Bingbot', 'Applebot']
/** AI 검색·답변 봇. 막으면 그 회사 AI 검색 답변에서 빠진다(관리 화면 「AI 검색 답변 허용」). */
export const AI_SEARCH = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User']
/** AI 학습용 수집. 막아도 검색 노출과 무관하다고 각 회사가 밝힌다(관리 화면 「AI 학습 수집 허용」). */
export const AI_TRAINING = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot']

export type RobotsRule = { userAgent: string | string[]; allow?: string[]; disallow: string | string[] }

/**
 * 스위치 둘로 묶음을 만든다. `settings` 가 null(api 를 못 읽음)이면 둘 다 연다 — 이 스위치가 생기기 전과 같다.
 * 막는 묶음에는 allow 를 두지 않는다: allow '/' 가 남으면 disallow '/' 와 길이가 같아 구글은 allow 쪽을 택한다.
 */
export function robotsRules(settings: { ai_search_allowed: boolean; ai_training_allowed: boolean } | null): RobotsRule[] {
  // 증서 그림·글 그림은 /api/content/assets 에서 나온다(게시된 글이 가리키는 것만 — 관문).
  // 더 긴 규칙이 이긴다: /api/ 는 막되 이 경로는 연다.
  const allow = ['/', '/api/content/assets/']
  // 글 작성 안내와 내부 API. 사람이 찾아올 자리가 아니다.
  const disallow = ['/api/', '/admin', '/page/support/notify_form']
  const open = (userAgent: string | string[]): RobotsRule => ({ userAgent, allow, disallow })
  const shut = (userAgent: string[]): RobotsRule => ({ userAgent, disallow: '/' })
  const aiSearch = settings?.ai_search_allowed ?? true
  const aiTraining = settings?.ai_training_allowed ?? true
  return [
    open('*'),
    open(SEARCH_ENGINES),
    aiSearch ? open(AI_SEARCH) : shut(AI_SEARCH),
    aiTraining ? open(AI_TRAINING) : shut(AI_TRAINING),
  ]
}
