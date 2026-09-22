'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CmsHomePopup } from '@/lib/cms'

const KEY = (id: number) => `dv_popup_until_${id}`

/** 「N일 동안 보지 않기」를 누른 팝업인가. 저장소를 못 쓰면(사생활 모드 등) 안 누른 것으로 본다. */
function dismissed(id: number): boolean {
  try {
    const until = Number(localStorage.getItem(KEY(id)) || 0)
    return until > Date.now()
  } catch {
    return false
  }
}

/** 오늘 하루 = 오늘 자정까지. N일 = 오늘 포함 N일째 자정까지(이 컴퓨터 시간). */
function remember(id: number, days: number): void {
  const until = new Date()
  until.setHours(24, 0, 0, 0)
  until.setDate(until.getDate() + (days - 1))
  try {
    localStorage.setItem(KEY(id), String(until.getTime()))
  } catch {
    // 저장소를 못 쓰면 이번 방문에서만 닫힌다.
  }
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * 메인 팝업(관리 화면 「메인 화면 › 팝업」). 뜨는 차례대로 **하나씩** — 닫으면 다음 것이 뜬다. 겹쳐 띄우면
 * 휴대폰에서 닫기 버튼이 서로를 가리고, 화면 읽기 프로그램에는 대화상자가 둘이 된다.
 *
 * 서버는 아무것도 그리지 않는다(첫 상태가 빈 줄). 그래서 자바스크립트가 꺼진 화면에는 안 뜨고,
 * 뜨더라도 글을 가리지 않는다. 대화상자: 포커스를 안에 가두고 Escape·닫기로 닫으며, 닫으면 여기 오기
 * 전 요소로 포커스를 돌려준다. 움직임 줄이기를 켠 사람에게는 나타나는 움직임이 없다(CSS).
 */
export default function HomePopups({ popups }: { popups: CmsHomePopup[] }) {
  const [queue, setQueue] = useState<CmsHomePopup[]>([])
  const box = useRef<HTMLDivElement>(null)
  const first = useRef<HTMLButtonElement>(null)
  const back = useRef<Element | null>(null)
  const current = queue[0]

  useEffect(() => {
    setQueue(popups.filter((p) => !dismissed(p.id)))
  }, [popups])

  const next = useCallback(() => setQueue((q) => q.slice(1)), [])

  useEffect(() => {
    if (!current) {
      if (back.current instanceof HTMLElement) back.current.focus()
      back.current = null
      return
    }
    if (!back.current) back.current = document.activeElement
    first.current?.focus()
  }, [current])

  if (!current) return null
  const titleId = `dvpop-title-${current.id}`
  const img = current.image && (
    <img src={current.image.url} alt={current.image.alt} width={current.image.width ?? current.width} height={current.image.height ?? 300} />
  )

  return (
    <div
      className="dvpop_back"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) next()
      }}
    >
      <div
        ref={box}
        className="dvpop"
        role="dialog"
        aria-modal="true"
        aria-labelledby={current.title ? titleId : undefined}
        aria-label={current.title ? undefined : '알림'}
        style={{ width: current.width }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            next()
            return
          }
          if (e.key !== 'Tab' || !box.current) return
          const items = Array.from(box.current.querySelectorAll<HTMLElement>(FOCUSABLE))
          if (items.length === 0) return
          const firstEl = items[0]
          const lastEl = items[items.length - 1]
          if (e.shiftKey && document.activeElement === firstEl) {
            e.preventDefault()
            lastEl.focus()
          } else if (!e.shiftKey && document.activeElement === lastEl) {
            e.preventDefault()
            firstEl.focus()
          }
        }}
      >
        {img && (current.link ? <a href={current.link.href} className="dvpop_img">{img}</a> : <div className="dvpop_img">{img}</div>)}
        {(current.title || current.body) && (
          <div className="dvpop_text">
            {current.title && <h2 id={titleId}>{current.title}</h2>}
            {/* 내용은 api 가 저장할 때 허용 태그만 남긴 HTML 이다(sanitize-html). */}
            {current.body && <div className="dvpop_body" dangerouslySetInnerHTML={{ __html: current.body }} />}
          </div>
        )}
        <div className="dvpop_btns">
          {current.link && (
            <a className="dvpop_go" href={current.link.href}>
              {current.link.label}
            </a>
          )}
          <div className="dvpop_close">
            {current.dismiss_days > 0 && (
              <button
                type="button"
                onClick={() => {
                  remember(current.id, current.dismiss_days)
                  next()
                }}
              >
                {current.dismiss_days === 1 ? '오늘 하루 보지 않기' : `${current.dismiss_days}일 동안 보지 않기`}
              </button>
            )}
            {/* 열리면 「닫기」에 포커스 — 실수로 Enter 를 눌러도 안전한 쪽. */}
            <button ref={first} type="button" onClick={next}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
