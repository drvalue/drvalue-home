import type { HomeBizCard } from './content'

/**
 * 메인의 사업영역(관리 화면 「메인 화면 › 문구」의 사업영역 카드 · 처음 글은 content.ts).
 *
 * 넣은 이유가 꾸밈만은 아니다. **메인 본문에서 비즈니스 쪽으로 가는 링크가
 * 하나도 없었다** — 새로 만든 제조AI(M.AX) 페이지도 헤더 드롭다운으로만
 * 갈 수 있었다. 이 줄들이 그 입구다.
 *
 * 처음 문구는 각 페이지의 첫 문단에서 그대로 가져왔다. 메인에서 본 말과 들어가서
 * 보는 말이 다르면 잘못 들어온 줄 안다 — 고칠 때도 그 장의 첫 문단과 맞춘다.
 *
 * 2026-09-28 아이콘 카드 3열 → M.AX 허브 제품 줄과 같은 구도(왼쪽 글 · 오른쪽 큰 사진).
 * 사진은 관리 화면에 칸이 없어 주소로 고른다. 모르는 주소면 사진 없이 글만 선다.
 */
const PHOTO: Record<string, { src: string; alt: string }> = {
  '/page/business/max': { src: '/photo/biz-max.webp', alt: '공장에서 노트북으로 설비 현황을 보는 작업자' },
  '/page/business/ai_sol': { src: '/photo/biz-ai.webp', alt: '두 모니터로 코드를 작성하는 개발자' },
  '/page/business/smart_fac': { src: '/photo/biz-factory.webp', alt: '프레스 설비가 늘어선 생산 라인' },
}

export default function HomeBiz({ cards }: { cards: HomeBizCard[] }) {
  return (
    <ul className="dvbiz_rows">
      {cards.map((b, i) => {
        const photo = PHOTO[b.href]
        return (
          <li key={`${b.href}-${i}`} className={`dvbiz_row${photo ? '' : ' is-text'}`}>
            <div className="dvbiz_txt">
              <span className="dvbiz_kicker">{b.kicker}</span>
              <h4>{b.title}</h4>
              <p>{b.lead}</p>
              <ul className="dvbiz_points">
                {b.points.map((p, k) => <li key={k}>{p.text}</li>)}
              </ul>
              <a className="dvbiz_go" href={b.href}>
                {b.title} 자세히 보기<i className="fa fa-angle-right" aria-hidden="true" />
              </a>
            </div>
            {photo && (
              <a className="dvbiz_photo" href={b.href} tabIndex={-1} aria-hidden="true">
                <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" width={1200} height={800} />
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}
