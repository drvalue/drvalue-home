import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from '@/lib/seo'
import { cmsBoard } from '@/lib/cms'
import { BOARDS, detailPath } from '../(site)/page/support/board/boards'

/**
 * /rss.xml — 공지·보도·뉴스의 최근 글(RSS 2.0).
 *
 * 왜: 네이버 서치어드바이저는 사이트맵과 함께 RSS 를 제출받아 새 글을 빨리 가져간다(2026-09-28 SEO·GEO 조사).
 * 새로 지은 말은 없다 — 제목·요약·게시일은 게시판 글 그대로. 검색에서 제외한 글(no_index)은 싣지 않는다.
 * 요청마다 만든다 — 글을 올리면 바로 들어간다.
 */
export const dynamic = 'force-dynamic'

const KEYS = ['notice', 'press', 'news'] as const

/**
 * XML 본문에 넣을 글. XML 1.0 이 금지하는 제어 문자(한글·워드에서 붙여 넣은 글에 \x0B·\x0C 가 섞여 온다)를 먼저 지운다 —
 * 하나만 섞여도 피드 전체가 깨져 네이버가 통째로 거부한다. 그다음 태그 문자와 & 를 막는다.
 */
const x = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function GET(): Promise<Response> {
  const lists = await Promise.all(KEYS.map((b) => cmsBoard(b, 30)))
  // api 가 안 닿으면 빈 피드(200)를 5분 캐시하지 않는다 — 크롤러가 「글 없음」으로 읽는다.
  if (lists.every((l) => l === null)) return new Response('feed unavailable', { status: 503, headers: { 'cache-control': 'no-store' } })
  const items = lists
    .flatMap((rows, i) => (rows ?? []).filter((r) => !r.no_index).map((r) => ({ conf: BOARDS[KEYS[i]], r })))
    .sort((a, b) => (b.r.published_date ?? '').localeCompare(a.r.published_date ?? ''))
    .slice(0, 50)

  const body = items
    .map(({ conf, r }) => {
      const link = `${SITE_ORIGIN}${detailPath(conf, r.slug)}`
      const desc = r.seo_description || r.summary || ''
      const date = new Date(r.published_date)
      return [
        '    <item>',
        `      <title>${x(r.title ?? '')}</title>`,
        `      <link>${x(link)}</link>`,
        `      <guid isPermaLink="true">${x(link)}</guid>`,
        `      <category>${x(conf.label)}</category>`,
        ...(desc ? [`      <description>${x(desc)}</description>`] : []),
        ...(Number.isNaN(date.getTime()) ? [] : [`      <pubDate>${date.toUTCString()}</pubDate>`]),
        '    </item>',
      ].join('\n')
    })
    .join('\n')

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${x(SITE_NAME)} 소식</title>`,
    `    <link>${SITE_ORIGIN}</link>`,
    `    <description>${x(SITE_DESCRIPTION)}</description>`,
    '    <language>ko</language>',
    `    <atom:link href="${SITE_ORIGIN}/rss.xml" rel="self" type="application/rss+xml" />`,
    body,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=300' } })
}
