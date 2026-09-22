/**
 * 메인에 띄울 소식을 CMS 에서 읽어 온다.
 *
 * 게시판 화면은 브라우저에서 `/api/...` 를 부르지만 메인은 서버에서 그린다.
 * 서버에는 브라우저의 `/api` 되넘김이 없으므로 Nest 주소를 직접 쓴다 —
 * next.config.mjs 의 rewrite 와 같은 환경변수를 본다.
 *
 * **CMS 가 죽어도 메인은 떠야 한다.** 그래서 실패를 던지지 않고 빈 배열을
 * 돌려준다. 화면 쪽에서 소식 구역만 빠진다.
 */
import type { CmsPost } from '@/lib/cms'
import type { ApiResponse } from '@/lib/api-types.gen'

/** 공개 목록의 글에서 홈 소식이 쓰는 칸 — 모양은 api 문서의 것(lib/cms.ts 의 CmsPost). */
export type NewsItem = Pick<CmsPost, 'slug' | 'title' | 'summary' | 'published_date'> & { board: 'notice' | 'press' }

/** 게시판마다 목록 화면이 다르다. 카드에서 바로 그 글로 간다. */
export const BOARD_PAGE: Record<NewsItem['board'], string> = {
  notice: '/page/support/notice',
  press: '/page/support/press',
}

export const BOARD_LABEL: Record<NewsItem['board'], string> = {
  notice: '공지사항',
  press: '보도자료',
}

const ORIGIN = process.env.API_ORIGIN || 'http://localhost:3500'

async function one(board: NewsItem['board'], limit: number): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `${ORIGIN}/api/content/posts?board=${board}&page=1`,
      // 요청마다 DB 에서 읽는다. api→DB 직결이라 비용이 없다. 저장 즉시 반영이 곧 동기화다.
      { cache: 'no-store' },
    )
    if (!res.ok) return []
    const body = (await res.json()) as Partial<ApiResponse<'GET /api/content/posts'>>
    // ?board= 로 한 게시판(notice·press)만 받았으니 그 줄들의 board 는 그 둘 중 하나다.
    return (body.data ?? []).slice(0, limit) as NewsItem[]
  } catch {
    return []
  }
}

/** 공지·보도자료를 합쳐 날짜 역순으로. 날짜가 없는 글은 뒤로 민다. */
export async function latestNews(limit = 6): Promise<NewsItem[]> {
  const [notice, press] = await Promise.all([one('notice', limit), one('press', limit)])
  return [...notice, ...press]
    .sort((a, b) => (b.published_date ?? '').localeCompare(a.published_date ?? ''))
    .slice(0, limit)
}
