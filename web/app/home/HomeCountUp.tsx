'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * 숫자를 화면에 들어올 때 0 에서 세어 올린다. 홈의 머리 그림·역량 구역과,
 * 어느 장이든 `data-count` 를 단 숫자가 대상이다. app/layout.tsx 가 전 화면에 건다.
 *
 * **화면에 아무것도 안 그린다.** 그 숫자는 PHP 원본에서 그대로 옮겨 온
 * 마크업이고, 감싸거나 고치면 원본과 달라진다(scripts/check-home.py 가
 * 그걸 잡는다). 그래서 붙이지 않고 **이미 있는 글자를 찾아 바꾸기만** 한다.
 *
 * 목표값을 글자에서 바로 읽으면 안 된다. effect 는 두 번 이상 돈다
 * (React StrictMode, Fast Refresh). 첫 번째가 "6개" 를 "0개" 로 바꿔 놓으면
 * 두 번째는 **0 을 목표값으로 읽어서** 0 에서 0 까지 세는 꼴이 된다 —
 * 실제로 그렇게 깨졌다. 그래서 원본 값을 `data-dv-count` 에 한 번만 박아
 * 두고 언제나 거기서 읽는다.
 *
 * 한 번만 센다. 스크롤을 오르내릴 때마다 다시 세면 장난감처럼 보인다.
 * 움직임을 줄이라고 설정한 사람에게는 원본 숫자를 그대로 둔다.
 *
 * **탭이 뒤에 있으면 세지 않고 바로 최종값을 쓴다.** 브라우저는 안 보이는
 * 탭의 requestAnimationFrame 을 멈춘다. 그대로 두면 새 탭으로 열어 놓은
 * 사람에게 숫자가 0 에서 굳은 채로 남는다(실측: 600ms 동안 0프레임).
 */
export default function HomeCountUp() {
  // layout 에 한 번 마운트되므로 화면이 바뀔 때마다 다시 돌아야 한다.
  const pathname = usePathname()
  useEffect(() => {
    // 홈 머리 그림은 원본 마크업이라 선택자로, 그 밖은 `data-count` 로 잡는다.
    const els = [...document.querySelectorAll<HTMLElement>(
      '.dv_hero_proof b, [data-count]',
    )]
    if (!els.length) return

    // 원본 글자를 한 번만 박는다. 이미 있으면 그것이 진실이다.
    for (const el of els) {
      if (!el.dataset.dvCount) el.dataset.dvCount = el.textContent ?? ''
    }

    const targets = els
      .map((el) => {
        const m = (el.dataset.dvCount ?? '').match(/^(\d+)(.*)$/)
        return m ? { el, to: Number(m[1]), tail: m[2] } : null
      })
      .filter((x): x is { el: HTMLElement; to: number; tail: string } => x !== null)
    if (!targets.length) return

    // 움직임을 줄이라고 한 사람에게는 손대지 않는다. 원본 숫자를 되돌려 둔다.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (const t of targets) t.el.textContent = `${t.to}${t.tail}`
      return
    }

    const rafs = new Set<number>()
    const settle = (t: (typeof targets)[number]) => {
      t.el.textContent = `${t.to}${t.tail}`
    }
    const run = (t: (typeof targets)[number]) => {
      if (document.hidden) {
        settle(t)
        return
      }
      const dur = 900
      const t0 = performance.now()
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur)
        // 끝에서 천천히 멈춘다. 선형으로 세면 뚝 끊긴 느낌이다.
        const eased = 1 - (1 - p) ** 3
        t.el.textContent = `${Math.round(t.to * eased)}${t.tail}`
        if (p < 1) rafs.add(requestAnimationFrame(step))
      }
      rafs.add(requestAnimationFrame(step))
    }

    // 세는 도중에 탭이 뒤로 가면 rAF 가 멎는다. 그때 남은 것을 바로 채운다.
    const onHide = () => {
      if (!document.hidden) return
      for (const id of rafs) cancelAnimationFrame(id)
      rafs.clear()
      for (const t of targets) settle(t)
    }
    document.addEventListener('visibilitychange', onHide)

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const t = targets.find((x) => x.el === e.target)
          io.unobserve(e.target)
          if (t) run(t)
        }
      },
      { threshold: 0.5 },
    )
    for (const t of targets) {
      // 안 보이는 탭에서는 0 으로 비우지도 않는다. 0 이 보이는 상태로
      // 굳는 것이 이 구역에서 가장 나쁜 결과다.
      if (!document.hidden) t.el.textContent = `0${t.tail}`
      io.observe(t.el)
    }
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onHide)
      for (const id of rafs) cancelAnimationFrame(id)
      rafs.clear()
      // 중간에 멈췄으면 원본 숫자로 되돌린다. 0 인 채로 남으면 안 된다.
      for (const t of targets) settle(t)
    }
  }, [pathname])

  return null
}
