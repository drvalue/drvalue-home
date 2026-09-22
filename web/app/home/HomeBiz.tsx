'use client'

import { useState } from 'react'
import type { HomeBizCard } from './content'

/**
 * 메인의 사업영역 카드(관리 화면 「메인 화면 › 문구」의 사업영역 카드 · 처음 글은 content.ts).
 *
 * 넣은 이유가 꾸밈만은 아니다. **메인 본문에서 비즈니스 쪽으로 가는 링크가
 * 하나도 없었다** — 새로 만든 제조AI(M.AX) 페이지도 헤더 드롭다운으로만
 * 갈 수 있었다. 카드가 그 입구다.
 *
 * 처음 문구는 각 페이지의 첫 문단에서 그대로 가져왔다. 메인에서 본 말과 들어가서
 * 보는 말이 다르면 잘못 들어온 줄 안다 — 고칠 때도 그 장의 첫 문단과 맞춘다.
 */

export default function HomeBiz({ cards }: { cards: HomeBizCard[] }) {
  // 어느 카드에 손이 올라가 있는지. CSS :hover 만으로도 되지만, 키보드로
  // 훑을 때도 같은 것이 보여야 해서 상태로 들고 있다.
  const [on, setOn] = useState<number | null>(null)

  return (
    <ul className="dvbiz_grid">
      {cards.map((b, i) => (
        <li
          key={`${b.href}-${i}`}
          className={`dvbiz_card${on === i ? ' is-on' : ''}`}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <a
            href={b.href}
            onMouseEnter={() => setOn(i)}
            onMouseLeave={() => setOn(null)}
            onFocus={() => setOn(i)}
            onBlur={() => setOn(null)}
          >
            <span className="dvbiz_ico"><i className={`fa ${b.icon}`} /></span>
            <span className="dvbiz_kicker">{b.kicker}</span>
            <h4>{b.title}</h4>
            <p>{b.lead}</p>
            <ul className="dvbiz_points">
              {b.points.map((p, k) => <li key={k}>{p.text}</li>)}
            </ul>
            <span className="dvbiz_go" aria-hidden="true">자세히 보기<i className="fa fa-angle-right" /></span>
          </a>
        </li>
      ))}
    </ul>
  )
}
