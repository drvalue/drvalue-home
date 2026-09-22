'use client'

import { useState } from 'react'

/**
 * 메인의 사업영역 카드 3장.
 *
 * 넣은 이유가 꾸밈만은 아니다. **메인 본문에서 비즈니스 쪽으로 가는 링크가
 * 하나도 없었다** — 새로 만든 제조AI(M.AX) 페이지도 헤더 드롭다운으로만
 * 갈 수 있었다. 카드가 그 입구다.
 *
 * 문구는 각 페이지의 첫 문단에서 그대로 가져왔다. 메인에서 본 말과 들어가서
 * 보는 말이 다르면 잘못 들어온 줄 안다.
 */

type Biz = { href: string; kicker: string; title: string; lead: string; points: string[]; icon: string }

const BIZ: Biz[] = [
  {
    href: '/page/business/max',
    kicker: 'MANUFACTURING AI',
    title: '제조AI(M.AX)',
    lead: '견적부터 출고까지 하나의 흐름으로 연결된 업종 특화 MES 와 제조 AI.',
    points: ['PCB · 화장품 업종 특화', 'MES 공통 프로세스 6단계', '제조 특화 AI 5대 기능'],
    icon: 'fa-cogs',
  },
  {
    href: '/page/business/ai_sol',
    kicker: 'AI SOLUTION DEVELOPMENT',
    title: 'AI 솔루션 개발',
    lead: '최신 LLM 부터 보안이 강조된 온프레미스 로컬 AI 까지 맞춤형으로 제안합니다.',
    points: ['Global LLM 최적화', '보안 특화 로컬 LLM', 'RAG 기반 지식 서비스'],
    icon: 'fa-comments-o',
  },
  {
    href: '/page/business/smart_fac',
    kicker: 'NEXT-GEN MANUFACTURING',
    title: '스마트 팩토리 사업',
    lead: '현장의 모든 설비와 공정을 디지털로 연결해 실시간 최적화를 실현합니다.',
    points: ['AI 자동 견적 (Costing)', 'IoT 통합 모니터링', 'MES/ERP 실시간 연계'],
    icon: 'fa-industry',
  },
]

export default function HomeBiz() {
  // 어느 카드에 손이 올라가 있는지. CSS :hover 만으로도 되지만, 키보드로
  // 훑을 때도 같은 것이 보여야 해서 상태로 들고 있다.
  const [on, setOn] = useState<string | null>(null)

  return (
    <ul className="dvbiz_grid">
      {BIZ.map((b, i) => (
        <li
          key={b.href}
          className={`dvbiz_card${on === b.href ? ' is-on' : ''}`}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <a
            href={b.href}
            onMouseEnter={() => setOn(b.href)}
            onMouseLeave={() => setOn(null)}
            onFocus={() => setOn(b.href)}
            onBlur={() => setOn(null)}
          >
            <span className="dvbiz_ico"><i className={`fa ${b.icon}`} /></span>
            <span className="dvbiz_kicker">{b.kicker}</span>
            <h4>{b.title}</h4>
            <p>{b.lead}</p>
            <ul className="dvbiz_points">
              {b.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
            <span className="dvbiz_go" aria-hidden="true">자세히 보기<i className="fa fa-angle-right" /></span>
          </a>
        </li>
      ))}
    </ul>
  )
}
