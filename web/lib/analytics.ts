/**
 * 방문 통계(GTM → GA4). 빌드 때 `NEXT_PUBLIC_GTM_ID` 를 넘기면 실린다 — 없으면 아무것도 안 싣는다.
 * 예전에는 `GTM-NLL3QGRF` 가 코드에 박혀 있어 미리보기 빌드도 운영 GTM 에 기록을 보냈다.
 * 운영은 compose 의 빌드 인자로 이 값을 넘긴다(docs/operations.md 「환경변수」).
 *
 * 켜는 판단(`tagsGtmId`)은 서버(루트 레이아웃)가 한다 — 미리보기 표시 NOINDEX 는 브라우저 번들에
 * 안 들어간다. 동의(Consent Mode v2)는 기본 거부, 방문자가 「동의」해야 analytics 만 허용한다.
 */
export const JQUERY_SRC = 'https://code.jquery.com/jquery-3.6.0.min.js'

const GTM_RE = /^GTM-[A-Z0-9]{4,12}$/

/** 실을 GTM id. 없거나 모양이 틀리거나 미리보기(NOINDEX=1)면 null. 서버에서만 부른다. */
export function tagsGtmId(): string | null {
  const id = (process.env.NEXT_PUBLIC_GTM_ID ?? '').trim()
  if (!GTM_RE.test(id)) return null
  if (process.env.NOINDEX === '1') return null
  return id
}

/** 방문자의 동의 기록(localStorage). 개인을 알아볼 값은 없다 — 고른 것 하나뿐. */
export const CONSENT_KEY = 'dv_consent'
