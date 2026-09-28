'use client'

import { useEffect, useState } from 'react'

/**
 * 맨 위 · 맨 아래로 가는 단추 둘(2026-09-28 사용자). 오른쪽 아래, 채팅 위젯(growchat) 위에 세로로 쌓는다.
 *
 * - 조금 내려야(400px) 「맨 위」가 뜨고, 바닥 근처(200px)면 「맨 아래」가 숨는다. 짧은 장이면 둘 다 없다.
 * - 스크립트가 없으면 아무것도 안 그린다 — 단추가 동작하지 않는 채로 남지 않게.
 * - 움직임을 줄인 사람에게는 부드럽게 흐르지 않고 바로 간다.
 */
const CSS = `
.dv_jump { position: fixed; right: 24px; bottom: 104px; z-index: 900; display: flex; flex-direction: column; gap: 8px; }
.dv_jump button { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 1px solid #e5e8eb; border-radius: 50%; background: #fff; color: #191f28; box-shadow: 0 4px 12px rgba(21,34,56,.10); cursor: pointer; transition: background .15s, border-color .15s; }
.dv_jump button:hover { background: #f2f4f6; border-color: #d1d6db; }
.dv_jump button:focus-visible { outline: 2px solid #191f28; outline-offset: 2px; }
.dv_jump svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
@media (max-width: 640px) { .dv_jump { right: 16px; bottom: 92px; } }
/* 폰에서 쿠키 동의 줄이 떠 있는 동안은 그 위로 올린다 — 겹쳤다. */
@media (max-width: 640px) { body:has(.dv_consent) .dv_jump { bottom: 124px; } }
@media print { .dv_jump { display: none; } }
`

export default function ScrollJump() {
  const [up, setUp] = useState(false)
  const [down, setDown] = useState(false)

  useEffect(() => {
    let frame: number | null = null
    const read = () => {
      frame = null
      const y = window.scrollY
      const room = document.documentElement.scrollHeight - window.innerHeight - y
      setUp(y > 400)
      setDown(room > 200 && document.documentElement.scrollHeight > window.innerHeight * 2)
    }
    const onScroll = () => { if (frame === null) frame = requestAnimationFrame(read) }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [])

  const go = (top: number) => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top, behavior: still ? 'auto' : 'smooth' })
  }

  if (!up && !down) return null
  return (
    <div className="dv_jump">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {up && (
        <button type="button" aria-label="맨 위로" title="맨 위로" onClick={() => go(0)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
        </button>
      )}
      {down && (
        <button type="button" aria-label="맨 아래로" title="맨 아래로" onClick={() => go(document.documentElement.scrollHeight)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      )}
    </div>
  )
}
