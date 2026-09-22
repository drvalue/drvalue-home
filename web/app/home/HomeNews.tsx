'use client'

import { useState } from 'react'
import { BOARD_LABEL, BOARD_PAGE, type NewsItem } from './news'

/**
 * 메인의 소식 목록. 카드였다가 목록으로 바꿨다 — 사용자 결정. 한 줄에 분류·제목·날짜.
 *
 * 글은 서버에서 읽어 넘겨준다 — 여기서 부르면 화면이 한 번 비었다가 채워져서
 * 메인에 빈 칸이 번쩍인다. 이 컴포넌트가 하는 일은 고르기와 움직임뿐이다.
 */

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'notice', label: '공지사항' },
  { key: 'press', label: '보도자료' },
] as const

function fmt(d: string | null): string {
  if (!d) return ''
  const [y, m, day] = d.slice(0, 10).split('-')
  return `${y}.${m}.${day}`
}

export default function HomeNews({ items }: { items: NewsItem[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('all')
  const shown = tab === 'all' ? items : items.filter((i) => i.board === tab)

  return (
    <>
      <div className="dvnews_tabs" role="tablist" aria-label="소식 분류">
        {TABS.map((t) => {
          const n = t.key === 'all' ? items.length : items.filter((i) => i.board === t.key).length
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`dvnews_tab${tab === t.key ? ' is-on' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}<span className="dvnews_n">{n}</span>
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <p className="dvnews_empty">아직 등록된 소식이 없습니다.</p>
      ) : (
        <ul className="dvnews_list">
          {shown.map((it, i) => (
            <li
              className="dvnews_row"
              key={`${it.board}-${it.slug}`}
              /* 한 줄씩 늦게 떠오르게 한다. 한꺼번에 나타나면 움직임이 아니라 깜빡임이다. */
              style={{ animationDelay: `${Math.min(i, 5) * 70}ms` }}
            >
              <a href={`${BOARD_PAGE[it.board]}/${encodeURIComponent(it.slug)}`}>
                <span className={`dvnews_badge is-${it.board}`}>{BOARD_LABEL[it.board]}</span>
                <h4>{it.title}</h4>
                <time className="dvnews_date" dateTime={it.published_date ?? undefined}>
                  {fmt(it.published_date)}
                </time>
                <i className="fa fa-angle-right dvnews_arrow" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
