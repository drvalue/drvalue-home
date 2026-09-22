/**
 * 파일 목록·올리기만 Next 가 직접 Nest 로 넘긴다. 나머지 /api/* 는 next.config 의 rewrite 가 넘긴다.
 *
 * rewrite 로 넘기면 Next 가 요청 본문을 메모리에 복사하며 10MB(proxyClientMaxBodySize)에서
 * 자른다 — 그림·PDF 20MB, 영상 200MB 가 안 올라가고 요청이 끝나지 않는다(실측). 한도를 올리면
 * 익명 주소까지 모든 요청의 복사 한도가 같이 오른다. 그래서 이 주소 하나만 버퍼 없이 흘려보낸다.
 * 인증·형식·크기 검사는 Nest 가 한다. 여기는 아무것도 판단하지 않는다.
 * 같은 주소라 GET(목록)도 여기로 온다 — 파일 시스템 경로가 rewrite 보다 먼저다.
 */
export const dynamic = 'force-dynamic'

const ORIGIN = process.env.API_ORIGIN || 'http://localhost:3500'
const PASS_REQUEST = ['content-type', 'cookie', 'user-agent', 'x-forwarded-for']
const PASS_RESPONSE = ['content-type', 'cache-control', 'set-cookie']

function pick(from: Headers, names: string[]): Headers {
  const out = new Headers()
  for (const n of names) {
    const v = from.get(n)
    if (v) out.set(n, v)
  }
  return out
}

async function forward(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const res = await fetch(`${ORIGIN}/api/admin/files${url.search}`, {
    method: req.method,
    headers: pick(req.headers, PASS_REQUEST),
    body: req.method === 'GET' ? undefined : req.body,
    // 본문을 모으지 않고 흘려보낸다(Node fetch 는 스트림 본문에 duplex 를 요구한다).
    duplex: 'half',
    cache: 'no-store',
  } as RequestInit & { duplex: 'half' })
  return new Response(res.body, { status: res.status, headers: pick(res.headers, PASS_RESPONSE) })
}

export const GET = forward
export const POST = forward
