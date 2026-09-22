import type { MetadataRoute } from 'next'
import { SITE_ORIGIN } from '@/lib/seo'

/**
 * 어디를 읽고 어디를 읽지 말지.
 *
 * 미리보기로 올린 사본에서는 통째로 막는다. 회사 사이트가 두 벌 색인되면
 * 서로 경쟁한다 — 같은 이유로 next.config.mjs 가 noindex 헤더도 붙인다.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.NOINDEX === '1') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 글 작성 안내와 내부 API. 사람이 찾아올 자리가 아니다.
      disallow: ['/api/', '/admin', '/page/support/notify_form'],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  }
}
