'use client'

import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react'

/**
 * 판정·양식 탭(cadon · autoform · cuton · 한건)의 자동 넘김. 2026-09-28 에 뺐다가 29 일 되살렸다
 * (사용자: 「자동으로 넘어가는 게 왜 안 됨?」 — 싫었던 것은 「기다려야만 다음을 볼 수 있는」 것이지 넘김 자체가 아니었다).
 *
 * - 켜진 탭의 막대가 차오르고, **막대 애니메이션이 끝나면** 다음 탭으로 간다 — 타이머를 따로 두지 않아 막대와 어긋나지 않는다.
 * - 누르면 바로 그 탭으로 가고 막대가 처음부터 찬다(tick 이 key 를 바꾼다).
 * - 손(마우스·포커스)이 올라가 있거나 화면 밖이면 막대가 멈춘다(animation-play-state).
 * - 움직임을 줄인 사람에게는 넘기지 않는다 — 막대는 꽉 찬 채로 선다(CSS).
 */
export function useAutoTabs(n: number, ms = 6000) {
  const [cur, setCur] = useState(0)
  const [tick, setTick] = useState(0)
  const [hold, setHold] = useState(false)
  const [seen, setSeen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const go = useCallback((i: number) => {
    setCur(((i % n) + n) % n)
    setTick((t) => t + 1)
  }, [n])

  const next = useCallback(() => go(cur + 1), [go, cur])

  const running = seen && !hold && n > 1
  const boxProps = {
    ref: box,
    onMouseEnter: () => setHold(true),
    onMouseLeave: () => setHold(false),
    // 누른 뒤의 포커스로는 멈추지 않는다 — 키보드로 훑을 때만(:focus-visible).
    onFocus: (e: FocusEvent<HTMLElement>) => { if (e.target.matches(':focus-visible')) setHold(true) },
    onBlur: () => setHold(false),
  }
  /** 켜진 탭 막대 안에 넣는 채움(<b key={tick} {...fillProps} />). 끝나면 다음 탭. */
  const fillProps = {
    className: 'tab_fill',
    style: { animationDuration: `${ms}ms`, animationPlayState: running ? 'running' : 'paused' } as const,
    onAnimationEnd: next,
  }
  return { cur, tick, go, boxProps, fillProps }
}
