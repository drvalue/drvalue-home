'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Shot } from './maxContent'

/**
 * 제품 화면을 눌러서 크게 보는 창.
 *
 * 이 화면들은 표가 빽빽한 업무 화면이다(1600px 원본). 글 옆 칸에 줄여 넣으면
 * 무엇이 적혀 있는지 못 읽는다 — "화면이 있다" 는 것만 보이고 "무엇을 하는
 * 화면인지" 는 안 보인다. 그래서 눌러서 원래 크기로 본다.
 *
 * 브라우저 기본 대화상자를 쓰지 않는다. 그것은 페이지를 멈춰서 다른 것이
 * 전부 같이 멎는다(사이트 다른 곳에서 겪은 문제다).
 *
 * Esc 로 닫고, 여러 장이면 좌우 화살표로 넘긴다. 열려 있는 동안 뒤쪽이
 * 스크롤되지 않게 막는다 — 안 막으면 닫았을 때 엉뚱한 자리에 가 있다.
 */
export default function ShotViewer({
  shots,
  index,
  onClose,
  onMove,
}: {
  shots: Shot[]
  index: number
  onClose: () => void
  onMove: (i: number) => void
}) {
  const cur = shots[index]
  const box = useRef<HTMLDivElement>(null)

  const key = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'Tab') {
        // 초점을 창 안에 가둔다. 안 가두면 Tab 이 뒤쪽 화면을 돈다.
        const f = box.current?.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')
        if (!f?.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
      else if (e.key === 'ArrowRight' && shots.length > 1) onMove((index + 1) % shots.length)
      else if (e.key === 'ArrowLeft' && shots.length > 1)
        onMove((index - 1 + shots.length) % shots.length)
    },
    [index, shots.length, onClose, onMove],
  )

  useEffect(() => {
    document.addEventListener('keydown', key)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', key)
      document.body.style.overflow = prev
    }
  }, [key])

  // 열리면 닫기 단추로 초점을 옮기고, 닫히면 열었던 자리로 돌려준다.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    box.current?.querySelector<HTMLElement>('button[aria-label="닫기"]')?.focus()
    return () => opener?.focus()
  }, [])

  if (!cur) return null

  // **body 로 옮겨 그린다.** 이 창은 화면 전체를 덮어야 하는데, 페이지 안에
  // 두면 transform 이 걸린 조상(패널의 등장 애니메이션)이 position:fixed 의
  // 기준이 되어 그 안에 갇힌다. 실제로 패널 크기만큼만 덮였다.
  return createPortal(
    <div className="dvshot_view" role="dialog" aria-modal="true" aria-label={cur.alt} onClick={onClose} ref={box}>
      <div className="dvshot_bar">
        <p>{cur.alt}</p>
        <div>
          {shots.length > 1 && (
            <span className="dvshot_n">{index + 1} / {shots.length}</span>
          )}
          <button type="button" onClick={onClose} aria-label="닫기">✕</button>
        </div>
      </div>

      {/* 그림 자체를 누르면 닫히지 않게 막는다 — 표를 짚어 가며 보게 된다. */}
      <div className="dvshot_body" onClick={(e) => e.stopPropagation()}>
        {shots.length > 1 && (
          <button
            type="button"
            className="dvshot_prev"
            aria-label="이전 화면"
            onClick={() => onMove((index - 1 + shots.length) % shots.length)}
          >
            ‹
          </button>
        )}
        <img src={cur.src} alt={cur.alt} width={cur.w} height={cur.h} />
        {shots.length > 1 && (
          <button
            type="button"
            className="dvshot_next"
            aria-label="다음 화면"
            onClick={() => onMove((index + 1) % shots.length)}
          >
            ›
          </button>
        )}
      </div>
      <p className="dvshot_hint">
        빈 곳을 누르거나 Esc 로 닫습니다{shots.length > 1 ? ' · ← → 로 넘깁니다' : ''}
      </p>
    </div>,
    document.body,
  )
}

/** 돋보기 지름(px)과 배율. 표 글자가 읽히는 최소 배율이 2.2 였다. */
const LENS = 200
const ZOOM = 2.2

/**
 * 한 장 그리기.
 *
 * 마우스를 올리면 그 자리가 돋보기로 확대된다. 이 화면들은 표가 빽빽한
 * 업무 화면이라 글 옆 칸에 줄여 넣으면 무엇이 적혀 있는지 못 읽는다.
 * 큰 창을 열지 않고도 짚어 가며 볼 수 있어야 한다.
 *
 * 돋보기는 `background-position` 만 옮긴다 — 그림을 한 장 더 받지 않는다.
 * 손으로 쓰는 화면에는 hover 가 없으므로 CSS 에서 숨기고, 거기서는
 * 눌러서 큰 창을 여는 기존 방법만 남는다.
 */
function Shot({ s, onOpen }: { s: Shot; onOpen: () => void }) {
  const frame = useRef<HTMLDivElement>(null)
  const [lens, setLens] = useState<{ x: number; y: number; bx: number; by: number; w: number } | null>(null)

  function move(e: React.MouseEvent<HTMLElement>) {
    const el = frame.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    // 커서가 가리키는 지점이 돋보기 한가운데 오게 배경을 민다.
    setLens({ x, y, bx: -(x * ZOOM - LENS / 2), by: -(y * ZOOM - LENS / 2), w: r.width })
  }

  return (
    <figure className="dvshot">
      {/* 「크게 보기」 단추와 돋보기가 이 칸 안에 겹쳐 놓인다. */}
      <div
        className={`dvshot_frame${lens ? ' is-lens' : ''}`}
        ref={frame}
        onMouseMove={move}
        onMouseLeave={() => setLens(null)}
      >
        {/* **원본보다 크게 늘리지 않는다.** 화면 캡처는 대부분 1600 폭이라 칸을
            그대로 채우지만, 세로형 상담 화면(502px)은 늘리면 흐려진다 — 실제로
            502 짜리가 700 으로 늘어나 글자가 뭉갰다. */}
        <img
          src={s.src}
          alt={s.alt}
          width={s.w}
          height={s.h}
          loading="lazy"
          decoding="async"
          style={{ maxWidth: s.w }}
        />
        <button type="button" className="dvshot_open" onClick={onOpen} aria-label={`${s.alt} 크게 보기`}>
          <span className="dvshot_zoom" aria-hidden="true">
            <i className="fa fa-search-plus" /> 크게 보기
          </span>
        </button>
        {lens && (
          <span
            className="dvshot_lens"
            aria-hidden="true"
            style={{
              left: lens.x,
              top: lens.y,
              backgroundImage: `url(${s.src})`,
              backgroundSize: `${Math.round(lens.w * ZOOM)}px auto`,
              backgroundPosition: `${Math.round(lens.bx)}px ${Math.round(lens.by)}px`,
            }}
          />
        )}
      </div>
      <figcaption>{s.alt}</figcaption>
    </figure>
  )
}

/**
 * 화면 캡처 묶음. **한 장만 보인다** — 사용자 결정. 여러 장을 격자로 깔았더니
 * 글보다 사진이 커서 과했다. 나머지는 눌러서 여는 창 안에서 화살표로 넘긴다.
 */
export function Shots({ shots, label }: { shots: Shot[]; label?: string }) {
  const [open, setOpen] = useState<number | null>(null)
  const first = shots[0]
  if (!first) return null
  return (
    <>
      <div className="dvshot_grid">
        <Shot s={first} onOpen={() => setOpen(0)} />
      </div>
      {shots.length > 1 && (
        // 둘째 장부터 연다 — 첫 장은 이미 보인다. 스크립트가 없으면 이 단추는 아무 일도
        // 못 한다(글은 다 보이니 고장은 아니다). 이름에 어느 기능의 화면인지를 넣는다.
        <button
          type="button"
          className="dvshot_more"
          aria-label={`${label ? label + ' ' : ''}화면 ${shots.length}장 크게 보기`}
          onClick={() => setOpen(1)}
        >
          화면 {shots.length}장 크게 보기<i className="fa fa-angle-right" aria-hidden="true" />
        </button>
      )}
      {open !== null && (
        <ShotViewer shots={shots} index={open} onClose={() => setOpen(null)} onMove={setOpen} />
      )}
    </>
  )
}
