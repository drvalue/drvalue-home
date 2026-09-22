'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * v4 꾸밈의 움직임 둘. 둘 다 없어도 화면은 온전하다 — 실패가 안전한 쪽.
 *
 *  1. 낱말 등장: `[data-words]` 의 글을 낱말 단위 <span class="mx_w"> 로 쪼개고
 *     --i 를 준다. CSS 가 그 순서로 띄운다. 흐림(blur)은 안 쓴다 — 한글이 뭉개진다.
 *  2. 패럴랙스: `.mx_plate` 가 화면을 지나는 동안 안의 화면은 위로, 덩어리는
 *     아래로 살짝 움직인다. 스크롤마다 rAF 한 번.
 *
 * GSAP 를 안 들인다. 이 둘을 위해 70KB 를 받게 할 이유가 없다(Reveal.tsx 와 같은 결정).
 */
export default function MotionFx() {
  const pathname = usePathname()
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // 1. 낱말 쪼개기 — 자식 노드를 걸으며 글 노드만 바꾼다. <b> 안도 같이.
    let n = 0
    const split = (el: Node) => {
      for (const c of Array.from(el.childNodes)) {
        if (c.nodeType === Node.TEXT_NODE) {
          const parts = (c.textContent ?? '').split(/(\s+)/)
          const frag = document.createDocumentFragment()
          for (const p of parts) {
            if (!p) continue
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); continue }
            const s = document.createElement('span')
            s.className = 'mx_w'
            s.style.setProperty('--i', String(n++))
            s.textContent = p
            frag.appendChild(s)
          }
          c.replaceWith(frag)
        } else if (c.nodeType === Node.ELEMENT_NODE && (c as Element).tagName !== 'BR') {
          split(c)
        }
      }
    }
    document.querySelectorAll<HTMLElement>('[data-words]:not([data-split])').forEach((el) => {
      el.dataset.split = '1'
      n = 0
      split(el)
    })

    // 2. 패럴랙스
    const plates = Array.from(document.querySelectorAll<HTMLElement>('.mx_plate'))
    if (!plates.length) return
    let frame: number | null = null
    const apply = () => {
      const vh = window.innerHeight
      for (const p of plates) {
        const r = p.getBoundingClientRect()
        // 숨은 탭 판은 rect 가 전부 0 이다 — 건너뛴다. 안 그러면 t=1 로 계산돼 -40px 이 박힌 채 열린다.
        if (!r.width && !r.height) continue
        const off = r.bottom < -200 || r.top > vh + 200
        p.classList.toggle('is-off', off)
        if (off) continue
        // 0 = 아래에서 막 들어옴, 1 = 위로 막 나감
        const t = (vh - r.top) / (vh + r.height)
        const y = (0.5 - t) * 80
        const shot = p.querySelector<HTMLElement>('.mx_browser, .mx_phone')
        if (shot) shot.style.transform = `translateY(${y.toFixed(1)}px)`
        p.querySelectorAll<HTMLElement>('.mx_blob').forEach((b) => { b.style.marginTop = `${(-y * 1.2).toFixed(1)}px` })
      }
      frame = null
    }
    const onScroll = () => { if (frame === null) frame = requestAnimationFrame(apply) }
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [pathname])
  return null
}
