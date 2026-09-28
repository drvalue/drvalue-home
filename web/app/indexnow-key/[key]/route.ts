import { indexNowKey } from '@/lib/indexnow'

/**
 * IndexNow 키 파일. `/<키>.txt` 를 next.config 의 fallback rewrite 가 이리로 넘긴다 — 있는 주소
 * (`/llms.txt` · `/robots.txt`)는 fallback 보다 먼저 잡혀서 안 온다. 설정한 키와 같은 이름일 때만
 * 키를 내고, 나머지는 404(키가 없거나 미리보기면 전부 404). 키는 비밀이 아니다 — 검색엔진이 읽으라고 두는 값이다.
 */
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }): Promise<Response> {
  const { key } = await params
  const want = indexNowKey()
  if (!want || key !== want) return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  return new Response(want, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
