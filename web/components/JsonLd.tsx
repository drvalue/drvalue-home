/**
 * 구조화 데이터 한 덩이(schema.org JSON-LD). 값에 `</script` 가 들어가 문서가 끊기지 않게 `<` 만 막는다.
 * 값은 화면에 이미 보이는 것만 넣는다 — 화면과 다른 말을 기계에게만 하면 되레 손해다.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c') }}
    />
  )
}
