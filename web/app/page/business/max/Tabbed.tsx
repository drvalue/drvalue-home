'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * 제품군 탭. 한 번에 **하나만** 보인다 — 세로로 다 깔아 두면 내려가며 다 보이니
 * 탭이 아니다(사용자 지적, 2026-09-22).
 *
 * 판(panel)은 서버가 다 그려 보내고 여기서는 보일 것만 고른다. 첫 번째만 보이게
 * 서버에서 그려지므로 스크립트가 없어도 첫 제품군은 온전히 읽힌다.
 *
 * 탭을 바꾸면 그 판 안의 등장 표시(data-rv)를 다시 「기다림」 상태로 되돌려
 * 촤자작이 다시 돈다 — 숨어 있던 동안은 Reveal 이 「이미 보임」으로 쳐서 안 걸었기 때문.
 * 주소의 #id(메뉴 ·「어디부터 볼까」 3열에서 옴)로 열리면 그 탭을 켠다.
 */
export default function Tabbed({ tabs, children }: { tabs: { t: string; id: string }[]; children: ReactNode[] }) {
  const [cur, setCur] = useState(0)
  const box = useRef<HTMLDivElement>(null)

  const pick = (i: number) => {
    setCur(i)
    // 다음 그림 틱에 판이 보이므로 그때 등장을 다시 건다.
    requestAnimationFrame(() => {
      const panel = box.current?.querySelectorAll<HTMLElement>('.mx_tabpanel')[i]
      if (!panel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      panel.querySelectorAll<HTMLElement>('[data-rv]').forEach((el) => {
        el.classList.remove('rv-in')
        el.classList.add('rv-wait')
        Array.from(el.children).forEach((c, k) => (c as HTMLElement).style.setProperty('--i', String(k)))
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('rv-in')))
      })
    })
  }

  useEffect(() => {
    // 「이 제품군 보기」 링크(#id)로 와도 단추로 누른 것과 같이 — 재등장까지.
    const byHash = () => {
      const i = tabs.findIndex((t) => `#${t.id}` === window.location.hash)
      if (i >= 0) pick(i)
    }
    byHash()
    window.addEventListener('hashchange', byHash)
    return () => window.removeEventListener('hashchange', byHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs])

  return (
    <div ref={box}>
      <div className="mx_wrap">
        <div className="mx_tabs" role="tablist" aria-label="제품군">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={i === cur}
              aria-controls={t.id}
              className={i === cur ? 'on' : undefined}
              onClick={() => pick(i)}
            >
              {t.t}
            </button>
          ))}
        </div>
      </div>
      {children.map((c, i) => (
        <div key={tabs[i]?.id ?? i} id={tabs[i]?.id} role="tabpanel" aria-labelledby={`tab-${tabs[i]?.id}`} className="mx_tabpanel" hidden={i !== cur}>
          {c}
        </div>
      ))}
    </div>
  )
}
