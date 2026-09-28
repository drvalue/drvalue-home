import type { MetadataRoute } from 'next'
import { SITE_ORIGIN } from '@/lib/seo'

/**
 * 어디를 읽고 어디를 읽지 말지.
 *
 * 미리보기로 올린 사본에서는 통째로 막는다. 회사 사이트가 두 벌 색인되면
 * 서로 경쟁한다 — 같은 이유로 next.config.mjs 가 noindex 헤더도 붙인다.
 *
 * AI 답변 엔진도 막지 않는다 — 회사 소개·제품 설명이 답변에 인용되는 것이 이 사이트에 이득이다(문의가 목적).
 * 규칙은 모두와 같고, 정책을 드러내 두려고 이름을 따로 적는다. 막기로 하면 이 묶음의 allow 를 disallow: '/' 로 바꾼다.
 *
 * 두 갈래를 구분해 적는다(2026-09-28 SEO·GEO 조사 — 각 회사 크롤러 문서):
 *  - 검색·답변용(막으면 그 회사 AI 검색 답변에서 빠진다): OAI-SearchBot · ChatGPT-User(OpenAI), Claude-SearchBot ·
 *    Claude-User(Anthropic), PerplexityBot · Perplexity-User, Yeti(네이버), Daumoa(다음), Bingbot(빙·코파일럿), Applebot
 *  - 학습용(막아도 검색 노출과 무관하다고 각 회사가 밝힌다): GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot
 * 지금은 둘 다 연다. 학습용만 막기로 하면 AI_TRAINING 묶음을 { userAgent: AI_TRAINING, disallow: '/' } 로 바꾼다(allow 없이 —
 * allow '/' 가 남으면 disallow '/' 와 길이가 같아 구글은 allow 쪽을 택한다).
 * 요약본은 /llms.txt(구글은 쓰지 않는다고 밝혔다 — 비용이 없어서 둔다), 새 글은 /rss.xml.
 */
const AI_SEARCH = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Yeti', 'Daumoa', 'Bingbot', 'Applebot']
const AI_TRAINING = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot']

export default function robots(): MetadataRoute.Robots {
  if (process.env.NOINDEX === '1') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  // 증서 그림·글 그림은 /api/content/assets 에서 나온다(게시된 글이 가리키는 것만 — 관문).
  // 더 긴 규칙이 이긴다: /api/ 는 막되 이 경로는 연다.
  const allow = ['/', '/api/content/assets/']
  // 글 작성 안내와 내부 API. 사람이 찾아올 자리가 아니다.
  const disallow = ['/api/', '/admin', '/page/support/notify_form']
  return {
    rules: [
      { userAgent: '*', allow, disallow },
      { userAgent: AI_SEARCH, allow, disallow },
      { userAgent: AI_TRAINING, allow, disallow },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  }
}
