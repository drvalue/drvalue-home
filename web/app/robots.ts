import type { MetadataRoute } from 'next'
import { SITE_ORIGIN } from '@/lib/seo'

/**
 * 어디를 읽고 어디를 읽지 말지.
 *
 * 미리보기로 올린 사본에서는 통째로 막는다. 회사 사이트가 두 벌 색인되면
 * 서로 경쟁한다 — 같은 이유로 next.config.mjs 가 noindex 헤더도 붙인다.
 *
 * AI 답변 엔진(GPTBot · ClaudeBot · PerplexityBot · Google-Extended · CCBot)도 막지 않는다 —
 * 회사 소개·제품 설명이 답변에 인용되는 것이 이 사이트에 이득이다(문의가 목적). 규칙은 모두와 같고,
 * 정책을 드러내 두려고 이름을 따로 적는다. 막기로 하면 이 묶음의 allow 를 disallow: '/' 로 바꾼다.
 * 요약본은 /llms.txt 에 있다.
 */
const AI_CRAWLERS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot']

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
      { userAgent: AI_CRAWLERS, allow, disallow },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  }
}
