/**
 * IndexNow 키. 검색엔진(Bing · Naver …)이 `https://drvalue.co.kr/<키>.txt` 를 열어 알림을 보낸 쪽이
 * 이 사이트인지 확인한다. 알림은 api 가 보낸다(`api/src/common/indexnow`) — 같은 `INDEXNOW_KEY` 를 읽는다.
 *
 * 비었거나 모양(8~128자, 영문·숫자·-)이 틀리거나 미리보기(NOINDEX=1)면 null — 키 파일도 404 다.
 * 실행 때 읽는다(빌드에 굳히지 않는다). 서버에서만 부른다.
 */
export function indexNowKey(): string | null {
  if (process.env.NOINDEX === '1') return null
  const raw = (process.env.INDEXNOW_KEY ?? '').trim()
  return /^[A-Za-z0-9-]{8,128}$/.test(raw) ? raw : null
}
