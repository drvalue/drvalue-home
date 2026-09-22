'use client'

import { useState } from 'react'
import { proofYears, type HomeProofCard } from './content'

/** 분류 이름을 클래스에 쓸 영문으로 바꾼다. 클래스에 한글을 넣지 않는다. */
const KIND_CLASS: Record<HomeProofCard['kind'], string> = {
  인증: 'cert',
  선정: 'award',
  협력: 'partner',
}

/**
 * 메인의 "신뢰의 근거" 카드(관리 화면 「메인 화면 › 문구」 · 처음 글은 proofData.ts).
 *
 * 연도로 고른다 — 분류(인증·선정·협력)로 고르면 "선정" 에 몰려서 고르는
 * 재미가 없고, 연혁 원문이 연도로 묶여 있어 대조하기도 쉽다. 연도 고르개는 카드의 연도로 만든다.
 */
export default function HomeProof({ cards }: { cards: HomeProofCard[] }) {
  const years = proofYears(cards)
  const [year, setYear] = useState<string>(years[0] ?? '')

  return (
    <>
      <div className="dvproof_tabs" role="tablist" aria-label="연도">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            role="tab"
            aria-selected={year === y}
            className={`dvproof_tab${year === y ? ' is-on' : ''}`}
            onClick={() => setYear(y)}
          >
            {y}
            <span className="dvproof_n" data-count>{cards.filter((p) => p.year === y).length}</span>
          </button>
        ))}
      </div>

      {/* 고른 해가 아닌 카드도 DOM 에는 남긴다. 걸러서 지워 버리면 검색엔진이
          다른 해의 인증·선정을 아예 못 본다 — 이 구역의 값어치가 거기 있다. */}
      <ul className="dvproof_grid">
        {cards.map((p, n) => {
          const i = cards.filter((x) => x.year === p.year).indexOf(p)
          return (
          <li
            className={`dvproof_card is-${KIND_CLASS[p.kind] ?? 'cert'}`}
            key={`${p.year}-${n}`}
            hidden={p.year !== year}
            style={{ animationDelay: `${Math.min(i, 5) * 70}ms` }}
          >
            <span className="dvproof_ico"><i className={`fa ${p.icon}`} /></span>
            <span className="dvproof_kind">{p.kind}</span>
            <h4>{p.title}</h4>
            {p.detail && <p>{p.detail}</p>}
          </li>
          )
        })}
      </ul>
    </>
  )
}
