import { AI_SHOWN, INDUSTRIES, type Feature, type Shot } from './maxContent'
import { PORTFOLIO_LIST } from '../../portfolio/portfolio/list'

/**
 * 「무엇이 달라집니까」 + 「말이 아니라 만든 것」.
 *
 * 왜 만들었나: M.AX 소개 장이 **우리 시스템의 구조 순서**로 돼 있었다 —
 * 공통 프로세스(내부 구조) 다음에 바로 업종 고르기(분류 메뉴)다. 공장이
 * 알고 싶은 "무엇이 달라지나" 와 "믿을 만한가" 는 둘 다 없었고, 정작 제일
 * 구체적인 문장(사양 오류 재투입 차단, 납기 준수 90%)은 하위 장 안쪽에
 * 묻혀 있었다.
 *
 * **여기서 새로 쓴 문장은 없다.** 고르기만 한다 — 문장·화면은 하위 장이
 * 쓰는 자료(maxContent)에서, 과제는 수행실적 장과 같은 파일에서 온다.
 *
 * 고르개는 **라디오 단추 여섯 개**다. 자바스크립트를 안 쓴다 — 키보드로
 * 화살표만 눌러도 넘어가고, 스크립트가 죽어도 첫 칸이 열린 채로 남는다.
 * 여섯 칸을 똑같은 상자로 늘어놓으면 읽는 사람이 어디를 봐야 할지 모른다.
 * 하나를 고르면 그 기능의 **실제 화면**이 옆에 뜬다.
 */

/** 앞에 세울 결과 여섯. 못 찾으면 조용히 빠진다. */
const WANT: { id: string; from: string; tag: string; href: string }[] = [
  { id: 'p2', from: 'pcb', tag: 'PCB MES', href: '/page/business/max/pcb-mes' },
  { id: 'p4', from: 'pcb', tag: 'PCB MES', href: '/page/business/max/pcb-mes' },
  { id: 'p6', from: 'pcb', tag: 'PCB MES', href: '/page/business/max/pcb-mes' },
  { id: 'c2', from: 'cos', tag: '화장품 MES', href: '/page/business/max/cosmetics-mes' },
  { id: 'c3', from: 'cos', tag: '화장품 MES', href: '/page/business/max/cosmetics-mes' },
  { id: 'a3', from: 'ai', tag: 'MES AI', href: '/page/business/max/mes-ai' },
]

/** `**굵게**` 표시를 뗀다. 한 줄 요약에서는 강조가 오히려 시끄럽다. */
const plain = (t: string) => t.replace(/\*\*/g, '')

type Out = {
  id: string; from: string; tag: string; href: string
  short: string; title: string; line: string; points: string[]; shot?: Shot
}

function build(id: string, from: string): Omit<Out, 'id' | 'from' | 'tag' | 'href'> | null {
  if (from === 'ai') {
    const a = AI_SHOWN.find((x) => x.id === id)
    if (!a) return null
    return {
      short: plain(a.title), title: plain(a.title),
      line: plain(a.steps[0] ?? ''), points: a.steps.slice(0, 3).map(plain), shot: a.shots?.[0],
    }
  }
  const ind = INDUSTRIES.find((i) => i.id === from)
  // 업종 기능에는 id 가 없고 차례(no)가 있다. 'p2' 의 2 가 그 차례다.
  const f: Feature | undefined = ind?.features.find((x) => x.no === Number(id.slice(1)))
  if (!f) return null
  return {
    // 고르개에는 짧은 이름(kicker)을, 펼친 쪽에는 온전한 제목을 쓴다.
    short: f.kicker.replace(/^[^-]+ - /, ''), title: plain(f.title),
    line: plain(f.callout?.result ?? f.points[0] ?? ''),
    points: f.points.slice(0, 3).map(plain), shot: f.shots?.[0],
  }
}

const OUTCOMES: Out[] = WANT.flatMap((w) => {
  const b = build(w.id, w.from)
  return b ? [{ ...w, ...b }] : []
})

/** 이미 만들어 돌린 것. 과제명에 MES·PCB·화장품 이 든 것만 고른다. */
const BUILT = PORTFOLIO_LIST.filter((p) => /MES|PCB|화장품/.test(p['과제명']))

/** 칸에 적을 숫자. 전부 자료에서 센다. */
const COUNT = (() => {
  const shots = new Set<string>()
  INDUSTRIES.forEach((i) => i.features.forEach((f) => f.shots?.forEach((s) => shots.add(s.src))))
  AI_SHOWN.forEach((a) => a.shots?.forEach((s) => shots.add(s.src)))
  return {
    ind: INDUSTRIES.length,
    ai: AI_SHOWN.length,
    feats: INDUSTRIES.reduce((n, i) => n + i.features.length, 0),
    shots: shots.size,
  }
})()

export function MaxCounts() {
  const rows = [
    { n: COUNT.ind, t: '업종별 MES' },
    { n: COUNT.ai, t: '제조 AI 기능' },
    { n: COUNT.feats, t: '업종 기능' },
    { n: COUNT.shots, t: 'M.AX 실제 화면' },
  ]
  return (
    <p className="mx_count">
      {rows.map((r) => (
        <span key={r.t}>
          <b data-count>{r.n}</b>
          {r.t}
        </span>
      ))}
    </p>
  )
}

/**
 * 고르개 + 화면.
 *
 * 라디오는 **목록보다 먼저** 그린다. CSS 의 형제 선택자(`~`)가 뒤쪽만
 * 볼 수 있기 때문이다. 화면에는 안 보이고 키보드 초점만 받는다.
 */
export function MaxOutcomes() {
  return (
    <div className="mx_pick">
      {OUTCOMES.map((o, i) => (
        <input
          key={o.id}
          type="radio"
          name="mx_pick"
          id={`mx_pick_${o.id}`}
          defaultChecked={i === 0}
          className="mx_pick_radio"
        />
      ))}

      <div className="mx_pick_list" role="presentation">
        {OUTCOMES.map((o) => (
          <label key={o.id} htmlFor={`mx_pick_${o.id}`} className={`mx_pick_tab mx_pick_${o.id}`}>
            <span className="mx_pick_tag">{o.tag}</span>
            <b>{o.short}</b>
            <i aria-hidden="true">→</i>
          </label>
        ))}
      </div>

      <div className="mx_pick_stage">
        {OUTCOMES.map((o) => (
          <article key={o.id} className={`mx_pick_panel mx_panel_${o.id}`}>
            {o.shot && (
              <a className="mx_pick_shot" href={o.href}>
                <img src={o.shot.src} alt={o.shot.alt} width={o.shot.w} height={o.shot.h} loading="lazy" />
              </a>
            )}
            <div className="mx_pick_body">
              <h3>{o.title}</h3>
              <ul>
                {o.points.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <a className="mx_pick_more" href={o.href}>
                {o.tag} 장에서 보기<i aria-hidden="true">→</i>
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export function MaxBuilt() {
  return (
    <div className="mx_builtgrid">
      {BUILT.map((p) => (
        <a className="mx_built" key={p['과제명']} href="/page/portfolio/portfolio">
          <span className="mx_built_top">
            <span className="mx_built_kind">{p['구분']}</span>
            <span className="mx_built_when">{p['기간']}</span>
          </span>
          <b>{p['과제명']}</b>
        </a>
      ))}
    </div>
  )
}

/** CSS 가 고른 칸만 보여 주려면 아이디마다 규칙이 하나씩 있어야 한다.
 *  손으로 여섯 벌 적지 않고 자료에서 만들어 낸다 — 항목이 늘면 따라 는다. */
export const MX_PICK_CSS = OUTCOMES.map(
  (o) =>
    `#dvmax #mx_pick_${o.id}:checked ~ .mx_pick_list .mx_pick_${o.id}{background:#fff;border-color:#d71920;box-shadow:0 6px 18px rgba(0,0,0,.06)}` +
    `#dvmax #mx_pick_${o.id}:checked ~ .mx_pick_list .mx_pick_${o.id} b{color:#d71920}` +
    `#dvmax #mx_pick_${o.id}:checked ~ .mx_pick_list .mx_pick_${o.id} i{opacity:1;transform:none}` +
    `#dvmax #mx_pick_${o.id}:checked ~ .mx_pick_stage .mx_panel_${o.id}{display:grid;animation:mxPanelIn .32s cubic-bezier(.22,.68,.24,1) both}`,
).join('\n')
