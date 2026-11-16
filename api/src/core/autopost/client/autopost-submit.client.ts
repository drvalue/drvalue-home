/**
 * 사람 기계에서 서버의 받는 입구(`/api/autopost/*`)를 부르는 쪽. DB 도 Nest 도 안 띄운다 — 명령(`--submit-bundle` · `--rules-from`)이 쓴다.
 * 토큰은 헤더에만 싣는다. 오류 문장·출력에 넣지 않는다.
 */

export interface SubmitResult {
  outcome: 'published' | 'refused';
  reasons: string[];
  post_id: number | null;
  pictures: number;
}

type Fetch = typeof fetch;

/** 묶음 본문의 한도. 서버(`BUNDLE_BODY_LIMIT`)와 같다 — 서버 앞의 web 프록시가 10MB 에서 잘라 그 아래로 잡았다. */
export const SUBMIT_MAX_BYTES = 9 * 1024 * 1024;

/**
 * 받는 서버의 주소(출처만 — `https://drvalue.co.kr`). https 만 받는다: 토큰이 평문으로 나가지 않게.
 * 이 기계의 주소(localhost · 127.0.0.1)만 http 를 받는다(로컬 시험). 틀리면 null.
 */
export function submitOrigin(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local))
    return null;
  if (url.username || url.password) return null;
  return url.origin;
}

async function call<T>(
  origin: string,
  path: string,
  token: string,
  init: { method: 'GET' | 'POST'; body?: string },
  doFetch: Fetch,
): Promise<T> {
  const res = await doFetch(`${origin}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body && { 'Content-Type': 'application/json' }),
    },
    body: init.body,
    // 넘겨 보내는 곳을 따라가지 않는다 — 토큰이 다른 주소로 실려 가지 않게.
    redirect: 'error',
    signal: AbortSignal.timeout(120_000),
  });
  const json = (await res.json().catch(() => null)) as {
    data?: T;
    resultCode?: string;
    message?: string;
  } | null;
  // 토큰이 틀리면 서버가 큰 본문을 읽지 않아, 그림이 든 묶음은 401 이 아니라 413 으로 돌아온다.
  if (res.status === 413)
    throw new Error(
      '서버가 받지 않았습니다 (413) — 토큰이 서버와 다르거나 묶음이 너무 큽니다',
    );
  if (!res.ok || !json?.data)
    throw new Error(
      `서버가 받지 않았습니다 (${res.status}${json?.resultCode ? ` ${json.resultCode}` : ''}${json?.message ? ` — ${json.message}` : ''})`,
    );
  return json.data;
}

/** 묶음(검사·판정을 지난 글과 그림)을 서버에 넣는다. 서버가 코드 검사를 다시 돌리고 주간 기록을 잡아 공개한다. */
export function submitBundle(
  origin: string,
  token: string,
  bundle: {
    article: unknown;
    pictures?: { section: number | null; data: string }[];
  },
  doFetch: Fetch = fetch,
): Promise<SubmitResult> {
  const body = JSON.stringify({
    article: bundle.article,
    pictures: (Array.isArray(bundle.pictures) ? bundle.pictures : []).map(
      (pic) => ({ section: pic.section, data: pic.data }),
    ),
  });
  // 넘는 묶음은 보내지 않는다 — 서버 앞의 프록시가 중간에 끊어 알 수 없는 500 으로 돌아온다.
  const bytes = Buffer.byteLength(body);
  if (bytes > SUBMIT_MAX_BYTES)
    return Promise.reject(
      new Error(
        `묶음이 너무 큽니다 (${(bytes / 1024 / 1024).toFixed(1)}MB, 한도 9MB) — 그림을 줄이거나 빼 주세요`,
      ),
    );
  return call<SubmitResult>(
    origin,
    '/api/autopost/bundle',
    token,
    { method: 'POST', body },
    doFetch,
  );
}

/** 서버의 기록으로 만든 규칙 글자(「이미 다룬 글」이 운영의 것이다). */
export async function fetchRules(
  origin: string,
  token: string,
  doFetch: Fetch = fetch,
): Promise<string> {
  const data = await call<{ text: string }>(
    origin,
    '/api/autopost/rules',
    token,
    { method: 'GET' },
    doFetch,
  );
  return data.text;
}
