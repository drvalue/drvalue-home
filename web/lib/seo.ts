/**
 * 검색엔진과 공유 미리보기가 읽는 것들.
 *
 * 왜 생겼나: 옮기기 전 PHP 사이트는 17장이 전부 같은 제목(`디알밸류 - AI 제조
 * 솔루션`)을 썼고 설명문·공유카드·대표주소가 하나도 없었다. 검색 결과에서
 * 서로 구분이 안 됐다는 뜻이다. 운영본을 직접 받아서 확인한 값이라 이관하며
 * 잃은 게 아니라 원래 없던 것이다.
 *
 * 그래서 **원본과 글자 단위로 같지 않게 된다.** 대조 검사(scripts/compare.py)가
 * 이것을 고의로 바꾼 것으로 알고 지나가게 해 뒀다. 검사를 끈 게 아니다.
 */

import type { Metadata } from 'next'

/** 운영 주소. 미리보기에 올려도 대표주소는 운영 쪽을 가리켜야 한다. */
export const SITE_ORIGIN = 'https://drvalue.co.kr'

export const SITE_NAME = '디알밸류'

/** 푸터에 이미 적혀 있는 값이다. 여기서 새로 지어내지 않는다. */
export const ORG = {
  name: '주식회사 디알밸류',
  alt: 'drvalue',
  ceo: '용미숙',
  bizNo: '491-87-02850',
  tel: '031-400-3880',
  email: 'hi@drvalue.co.kr',
  addr: '경기도 안산시 상록구 한양대학로 55, 창업보육센터 318호',
  locality: '안산시',
  region: '경기도',
} as const

/**
 * 페이지 한 장의 머리 정보.
 *
 * `title` 은 페이지 고유 부분만 넘긴다 — 뒤의 ` | 디알밸류` 는 여기서 붙인다.
 * `description` 은 **그 페이지에 실제로 적혀 있는 내용**을 줄여 쓴다.
 * 없는 말을 넣으면 검색 결과와 실제 화면이 어긋나 되레 손해다.
 */
export function pageMeta({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string
  description: string
  path: string
  noIndex?: boolean
}): Metadata {
  const full = `${title} | ${SITE_NAME}`
  const url = `${SITE_ORIGIN}${path}`
  return {
    title: full,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: full,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'ko_KR',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: full, description },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  }
}
