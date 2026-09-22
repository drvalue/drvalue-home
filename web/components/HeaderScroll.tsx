'use client'

import { useEffect } from 'react'

/** 참조 코드(Google AI Studio Header.tsx)의 값 그대로. 20px 만 내려도 바뀐다. */
const SOLID_AT = 20

/**
 * 조금이라도 내리면 헤더를 흰 막대로 되돌린다.
 *
 * **투명이 기본값이다.** 반대로(맨 위일 때만 투명하게) 만들었더니 어두운
 * 머리 그림이 있는 장을 열 때마다 흰 막대가 한 번 번쩍이고 사라졌다 —
 * 서버가 그린 화면은 흰 막대인데 스크립트가 붙고 나서야 투명해지기 때문이다.
 * 정지 화면 캡처로는 안 잡히고 새로고침할 때만 보인다.
 *
 * 투명을 기본값으로 둬도 안전한 이유: 투명해지는 규칙이 CSS 에서
 * `html:has(.mx_hero, .hero_sub_banner)` 로 묶여 있다. **어두운 머리 그림이
 * 실제로 있는 장에서만** 적용되므로, 스크립트가 죽어도 흰 글씨가 밝은 배경
 * 위에 남는 일이 없다.
 *
 * 받은 참조 코드가 `isScrolled` 로 하던 것이다. 아이파킹도 같은 동작을 쓴다 —
 * 첫 화면에서는 사진 위에 흰 글씨로 떠 있고, 조금만 내리면 흰 막대가 된다.
 *
 * 값을 <html> 에 둔다. 헤더 자신에 두면 CSS 에서 형제·자손만 짚을 수 있는데,
 * 우리는 헤더 안쪽(로고·탭·단추)을 한꺼번에 바꿔야 한다.
 */
export default function HeaderScroll() {
  useEffect(() => {
    let frame: number | null = null

    const apply = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0
      const root = document.documentElement
      if (y > SOLID_AT) root.dataset.hdr = 'scrolled'
      else delete root.dataset.hdr
      frame = null
    }

    const onScroll = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(apply)
    }

    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame !== null) window.cancelAnimationFrame(frame)
      delete document.documentElement.dataset.hdr
    }
  }, [])

  return null
}
