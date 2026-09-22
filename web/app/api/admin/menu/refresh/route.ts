import { revalidateTag } from 'next/cache'
import { MENU_TAG } from '@/lib/menu-cms'

/**
 * 메뉴 캐시 비우기. 관리 화면이 메뉴를 저장한 뒤 부른다 — 머리글은 메뉴를 60초 캐시하므로(lib/menu-cms.ts)
 * 이것이 없으면 저장이 최대 1분 늦게 보인다. 이 주소 하나만 Next 가 받는다(파일 경로가 rewrite 보다 먼저).
 *
 * 누가 불러도 되는지는 여기서 정하지 않는다. 같은 쿠키로 api 의 관리 메뉴(GET /api/admin/menu)를 불러
 * 200 이면 비운다 — 메뉴를 고칠 수 있는 범위(전체 권한·마케팅)가 곧 비울 수 있는 범위다. 규칙은 api 에만 있다.
 * 비우는 것은 캐시뿐이라 잘못 불려도 다음 요청이 api 를 한 번 더 읽을 뿐이다.
 */
export const dynamic = 'force-dynamic'

const ORIGIN = process.env.API_ORIGIN || 'http://localhost:3500'

export async function POST(req: Request): Promise<Response> {
  const cookie = req.headers.get('cookie') ?? ''
  let res: Response
  try {
    res = await fetch(`${ORIGIN}/api/admin/menu`, { headers: { cookie }, cache: 'no-store' })
  } catch {
    return Response.json(
      { data: null, status: 502, resultCode: 'MENU_REFRESH_UPSTREAM', message: '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 502 },
    )
  }
  if (!res.ok) {
    // api 의 에러 본문(합니다체 문구)을 그대로 돌려준다 — 401 이면 관리 화면이 로그인으로 보낸다.
    return new Response(res.body, { status: res.status, headers: { 'content-type': 'application/json' } })
  }
  // 다음 요청은 기다렸다가 새 메뉴로 그린다(오래된 메뉴를 한 번 더 보이지 않게).
  revalidateTag(MENU_TAG, { expire: 0 })
  return Response.json({ ok: true })
}
