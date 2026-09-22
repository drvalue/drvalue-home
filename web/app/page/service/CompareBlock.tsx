import { texts, toShot, type CompareContent } from '../pageContentParts'

/**
 * 서비스 시연 장의 전/후 칸 — 어두운 카드(예전 대화 말풍선) + 밝은 카드(제품 화면) + ✕ 목록 · ✓ 목록.
 * 네 장(오토폼 · CADON · 컷온 · 한건)과 채팅이 같은 짜임이라 한 곳에서 그린다. 장마다 다른 것은
 * 클래스 몇 개와 목록의 등장 방식뿐이라 그것만 받는다. 글과 그림은 페이지 글(CompareContent)이다.
 */
export default function CompareBlock({
  c,
  pairClass = '',
  lightClass = '',
  listsRv = true,
}: {
  c: CompareContent
  /** hk_pair 에 덧붙는 클래스(채팅 ' gc_pair'). */
  pairClass?: string
  /** 밝은 카드에 덧붙는 클래스(오토폼 ' af_light' · 컷온 ' ct_light'). */
  lightClass?: string
  /** 목록 묶음의 등장 방식 — 오토폼만 'pop'. */
  listsRv?: true | 'pop'
}) {
  const shot = toShot(c.shot)
  return (
    <>
      <div className={`hk_pair${pairClass}`} data-rv>
        <figure className="hk_card hk_dark">
          <div className="hk_bubbles">
            {c.before.bubbles.map((b, i) => (
              <p key={i} className={`hk_bb ${b.who}`} style={{ ['--i' as string]: i }}>{b.t}</p>
            ))}
          </div>
        </figure>
        <figure className={`hk_card hk_light${lightClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {shot && <img src={shot.src} alt={shot.alt} width={shot.w} height={shot.h} loading="lazy" />}
        </figure>
      </div>
      <div className="hk_lists" data-rv={listsRv}>
        <div>
          <h3><i className="hk_x" aria-hidden="true">✕</i>{c.before.title}</h3>
          <ul>{texts(c.before.points).map((p) => <li key={p} className="hk_no">{p}</li>)}</ul>
        </div>
        <div>
          <h3><i className="hk_ok" aria-hidden="true">✓</i>{c.after.title}</h3>
          <ul>{texts(c.after.points).map((p) => <li key={p} className="hk_yes">{p}</li>)}</ul>
        </div>
      </div>
    </>
  )
}
