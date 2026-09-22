'use client'

import { useState } from 'react'

/**
 * 표지만 먼저 놓고, 누를 때 유튜브를 불러온다.
 *
 * 왜: 이 페이지만 JS 가 다른 페이지의 3.6배였다(실측 1,345KB vs 370KB).
 * 영상을 볼 생각이 없는 사람도 유튜브 플레이어를 통째로 내려받고 있었다.
 * 표지 그림은 유튜브가 주는 것이라 새로 만들 게 없다.
 *
 * 표지는 `<img>` 라서 JS 가 안 돌아도 무엇이 있는 자리인지 보인다.
 * 누르면 그때 iframe 이 들어오고 `autoplay` 로 바로 재생된다 —
 * 사람이 누른 다음이라 브라우저가 막지 않는다.
 */
export default function VideoFacade({
  id,
  title,
}: {
  id: string
  title: string
}) {
  const [on, setOn] = useState(false)

  if (on) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={true}
      />
    )
  }

  return (
    <button type="button" className="dvvid_play" onClick={() => setOn(true)}>
      {/* 유튜브가 주는 표지. maxres 가 없는 영상이 있어 hq 를 쓴다 — 항상 있다. */}
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt={title}
        width={480}
        height={360}
        loading="lazy"
        decoding="async"
      />
      <span className="dvvid_btn" aria-hidden="true">
        <svg viewBox="0 0 68 48" width="68" height="48">
          <path d="M66.5 7.7a8.6 8.6 0 0 0-6-6C55.2 0 34 0 34 0S12.8 0 7.5 1.7a8.6 8.6 0 0 0-6 6A90 90 0 0 0 0 24a90 90 0 0 0 1.5 16.3 8.6 8.6 0 0 0 6 6C12.8 48 34 48 34 48s21.2 0 26.5-1.7a8.6 8.6 0 0 0 6-6A90 90 0 0 0 68 24a90 90 0 0 0-1.5-16.3z" fill="#d71920"/>
          <path d="M27 34V14l18 10-18 10z" fill="#fff"/>
        </svg>
      </span>
      <span className="dvvid_label">{title} 재생</span>
    </button>
  )
}
