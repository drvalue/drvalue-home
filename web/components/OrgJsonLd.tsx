import { ORG, SITE_NAME, SITE_ORIGIN } from '@/lib/seo'

/**
 * 회사 정보를 기계가 읽을 형태로 한 벌 심는다.
 *
 * 값은 전부 푸터와 「찾아오시는 길」 에 이미 적혀 있는 것이다. 여기서 새로
 * 지어내지 않는다 — 화면과 어긋나면 되레 손해다.
 *
 * 전화번호는 대표전화 하나로 맞췄다. 예전에는 「찾아오시는 길」 에만 개인
 * 휴대전화가 적혀 있어 푸터와 달랐다. 검색엔진은 번호가 여러 군데에서
 * 일치하는지를 회사 신원 확인에 쓴다.
 */
export default function OrgJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORG.name,
    alternateName: [SITE_NAME, ORG.alt],
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/opt/logo.png`,
    email: ORG.email,
    telephone: ORG.tel,
    address: {
      '@type': 'PostalAddress',
      streetAddress: ORG.addr,
      addressLocality: ORG.locality,
      addressRegion: ORG.region,
      addressCountry: 'KR',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: ORG.tel,
      email: ORG.email,
      contactType: 'sales',
      areaServed: 'KR',
      availableLanguage: ['ko'],
    },
    founder: { '@type': 'Person', name: ORG.ceo },
    identifier: { '@type': 'PropertyValue', name: '사업자등록번호', value: ORG.bizNo },
  }
  return (
    <script
      type="application/ld+json"
      // 값에 `<` 가 들어갈 일이 없는 자리다. 그래도 `</script` 로 문서가
      // 끊기지 않게 한 글자만 막아 둔다.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
