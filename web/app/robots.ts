import type { MetadataRoute } from 'next'
import { SITE_ORIGIN } from '@/lib/seo'
import { robotsRules } from '@/lib/robots-rules'
import { getSearchSettings } from '@/lib/search-settings'

/**
 * 어디를 읽고 어디를 읽지 말지.
 *
 * 미리보기로 올린 사본에서는 통째로 막는다. 회사 사이트가 두 벌 색인되면
 * 서로 경쟁한다 — 같은 이유로 next.config.mjs 가 noindex 헤더도 붙인다.
 *
 * 봇을 세 갈래로 나눠 적는다(2026-09-28 SEO·GEO 조사 — 각 회사 크롤러 문서). 목록은 lib/robots-rules.ts:
 *  - 검색엔진(Yeti 네이버 · Daumoa 다음 · Bingbot 빙·코파일럿 · Applebot): 늘 연다. 막으면 네이버·빙 검색에서 사이트가
 *    통째로 빠진다 — 그래서 AI 스위치와 묶지 않는다.
 *  - AI 검색·답변(OAI-SearchBot · ChatGPT-User · Claude-SearchBot · Claude-User · PerplexityBot · Perplexity-User): 관리 화면
 *    「SEO › 검색엔진 설정」의 「AI 검색 답변 허용」. 끄면 이 묶음이 disallow '/' 가 되고 그 회사 AI 검색 답변에서 빠진다.
 *  - AI 학습용(GPTBot · ClaudeBot · Google-Extended · Applebot-Extended · CCBot): 「AI 학습 수집 허용」. 막아도 검색 노출과
 *    무관하다고 각 회사가 밝힌다.
 * 기본은 둘 다 연다 — 회사 소개·제품 설명이 답변에 인용되는 것이 이 사이트에 이득이다(문의가 목적). 막는 묶음에는 allow 를
 * 안 둔다(allow '/' 가 남으면 disallow '/' 와 길이가 같아 구글은 allow 쪽을 택한다). api 를 못 읽으면 둘 다 연다.
 * 설정은 1분 캐시로 읽는다(lib/search-settings.ts) — 저장 뒤 1분 안에 이 파일이 바뀐다.
 * 요약본은 /llms.txt(구글은 쓰지 않는다고 밝혔다 — 비용이 없어서 둔다), 새 글은 /rss.xml.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (process.env.NOINDEX === '1') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: robotsRules(await getSearchSettings()),
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  }
}
