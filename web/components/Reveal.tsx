'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * 스크롤을 내리면 구역이 떠오르게 한다. `data-rv` 가 붙은 것만 본다.
 * 규칙은 styles/motion.css, 마운트는 app/layout.tsx — 전 화면에 걸려 있다.
 *
 * **기본값은 「보인다」다.** 흔한 방식(CSS 에서 `opacity:0` 으로 두고 스크립트가
 * 켜 주기)은 스크립트가 죽으면 글이 영원히 안 보인다. 이 저장소에 이미 그런
 * 죽은 코드가 있었다 — style.css 의 `.reveal` 은 `opacity:0` 인데 `.active` 를
 * 붙이는 코드가 **한 곳도 없었다**(실측 0곳).
 *
 * 그래서 숨기는 일도 여기서 한다:
 *
 *  1. 첫 화면에 이미 보이는 것은 **건드리지 않는다.** 숨겼다 켜면 그 자체가
 *     깜빡임이다.
 *  2. 접힌 선 아래 것에만 `rv-wait` 를 붙여 숨기고, 화면에 들어오면 켠다.
 *  3. 애니메이션을 줄여 달라고 한 사람에게는 아무것도 안 붙인다.
 *
 * 그래서 이 파일이 안 실행되면 **전부 보인다.** 실패가 안전한 쪽이다.
 *
 * 저쪽(아이파킹)은 같은 일을 GSAP + ScrollTrigger + Observer + splitting 으로
 * 한다 — 이 하나를 위해 내려받는 스크립트가 여럿이다. 여기서는 브라우저에
 * 이미 있는 IntersectionObserver 를 쓴다.
 */
export default function Reveal() {
  // layout 에 한 번 마운트되므로 화면이 바뀔 때마다 다시 돌아야 한다.
  const pathname = usePathname()
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (typeof IntersectionObserver === 'undefined') return

    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-rv]'))
    if (!els.length) return

    // 접힌 선보다 조금 위까지는 「이미 보이는 것」으로 친다. 딱 경계에 걸친
    // 것을 숨기면 켜지자마자 켜져서 깜빡임만 남는다.
    const fold = window.innerHeight * 0.9
    const waiting = els.filter((el) => el.getBoundingClientRect().top > fold)
    if (!waiting.length) return
    waiting.forEach((el) => {
      el.classList.add('rv-wait')
      // 자식이 차례로 뜨도록 번호를 준다. CSS 가 --i 로 지연을 계산한다.
      Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty('--i', String(i)))
    })

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.classList.add('rv-in')
          io.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    )
    waiting.forEach((el) => io.observe(el))

    // 관찰이 어떤 이유로든 안 돌면 8초 뒤에 전부 켠다. 숨긴 채로 남는 것보다
    // 애니메이션을 잃는 쪽이 낫다.
    const bail = window.setTimeout(() => {
      waiting.forEach((el) => el.classList.add('rv-in'))
    }, 8000)

    return () => {
      io.disconnect()
      window.clearTimeout(bail)
      waiting.forEach((el) => {
        el.classList.remove('rv-wait', 'rv-in')
        Array.from(el.children).forEach((c) => (c as HTMLElement).style.removeProperty('--i'))
      })
    }
  }, [pathname])

  return null
}
