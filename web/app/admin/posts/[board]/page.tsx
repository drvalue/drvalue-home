'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { adminFetch, adminJson, boardOf, EMPLOYMENT_LABEL, isFuture, Page, PostRow, shortDate, shortWhen, yymm } from '@/lib/admin'
import InlineConfirm from '../../ui/InlineConfirm'
import { pageOf, useQuery } from '../../ui/query'
import SearchBox from '../../ui/SearchBox'
import { useToast } from '../../ui/toast'

/** 목록에 대표 그림 칸이 있는 게시판. 나머지는 빈 칸을 두지 않는다. */
const WITH_THUMB = ['notice', 'press', 'news', 'patent', 'copyright']

/** 상태 거름 한 칸에 공개/초안과 예약/내림 예정을 같이 둔다. 앞 둘은 ?status=, 뒤 둘은 ?schedule=. */
const SCHEDULES = ['scheduled', 'unpublishing']
const FILTERS: { value: string; label: string }[] = [
  { value: '', label: '전체 상태' },
  { value: 'published', label: '공개' },
  { value: 'draft', label: '초안' },
  { value: 'scheduled', label: '예약' },
  { value: 'unpublishing', label: '내림 예정' },
]

/**
 * 게시판 목록. 증서·수행실적·FAQ·연혁은 화살표로 순서를 바꾼다 — 사이트가 그 순서로 그린다.
 * 연혁은 사이트가 연도로 먼저 줄 세우므로 연도별로 묶고, 연도를 넘는 화살표는 끈다.
 * 검색어·상태·쪽은 주소에 남는다. 좁은 화면(640px 이하)에서는 표가 카드로 바뀐다(CSS).
 */
export default function PostListPage() {
  const { board: boardKey } = useParams<{ board: string }>()
  const board = boardOf(boardKey)
  const query = useQuery()
  const q = query.get('q')
  const status = query.get('status')
  // 예약 거름은 api 의 schedule(scheduled | unpublishing). 그 밖의 값은 api 가 400 이라 여기서 버린다.
  const scheduleRaw = query.get('schedule')
  const schedule = SCHEDULES.includes(scheduleRaw) ? scheduleRaw : ''
  const page = pageOf(query.get('page'))
  const toast = useToast()
  const [rows, setRows] = useState<Page<PostRow> | null>(null)
  const [error, setError] = useState('')
  const [asking, setAsking] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const triggers = useRef(new Map<number, HTMLButtonElement>())

  const load = useCallback(async () => {
    if (!board) return
    const qs = new URLSearchParams({ board: board.key, page: String(page) })
    if (q) qs.set('q', q)
    if (schedule) qs.set('schedule', schedule)
    else if (status) qs.set('status', status)
    try {
      setRows(await adminFetch<Page<PostRow>>(`/api/admin/posts?${qs}`))
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [board, page, q, status, schedule])

  useEffect(() => {
    load()
  }, [load])

  if (!board) return <div className="dva_error">게시판을 찾을 수 없습니다.</div>

  const isHistory = board.key === 'history'
  const yearOf = (r: PostRow) => r.history_year ?? ''

  function closeConfirm(id: number) {
    setAsking(null)
    requestAnimationFrame(() => triggers.current.get(id)?.focus())
  }

  async function remove(r: PostRow) {
    setBusy(true)
    try {
      await adminFetch(`/api/admin/posts/${r.id}`, { method: 'DELETE' })
      setAsking(null)
      toast(`「${r.title || '제목 없음'}」 글을 삭제했습니다. 변경 이력에서 되돌릴 수 있습니다.`)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  /** 지금 쪽 안에서 한 칸 옮기고, 쪽 전체 순서를 그대로 보낸다. 연혁은 같은 연도 안에서만. */
  const canMove = (i: number, dir: -1 | 1) => {
    if (!rows) return false
    const j = i + dir
    if (j < 0 || j >= rows.data.length) return false
    return !isHistory || yearOf(rows.data[i]) === yearOf(rows.data[j])
  }
  async function move(i: number, dir: -1 | 1) {
    if (!rows || !canMove(i, dir)) return
    const j = i + dir
    const next = [...rows.data]
    ;[next[i], next[j]] = [next[j], next[i]]
    setRows({ ...rows, data: next })
    setBusy(true)
    try {
      await adminJson('/api/admin/posts/reorder', 'POST', { ids: next.map((r) => r.id) })
      toast('순서를 바꿨습니다. 사이트에 바로 반영됩니다.')
      await load()
    } catch (e) {
      setError((e as Error).message)
      await load()
    } finally {
      setBusy(false)
    }
  }

  const pages = rows ? Math.max(1, Math.ceil(rows.total / rows.pageSize)) : 1
  const withThumb = WITH_THUMB.includes(board.key)
  const extra: { label: string; cell: (r: PostRow) => React.ReactNode; num?: boolean }[] = []
  if (board.key === 'patent' || board.key === 'copyright') extra.push({ label: '번호', cell: (r) => r.cert_no ?? '', num: true })
  if (board.key === 'case') extra.push({ label: '기간', cell: (r) => `${yymm(r.period_start)}~${yymm(r.period_end)}`, num: true })
  if (board.key === 'press' || board.key === 'news') extra.push({ label: '매체', cell: (r) => r.press_media ?? '' })
  if (board.key === 'recruit') {
    extra.push({ label: '고용 형태', cell: (r) => EMPLOYMENT_LABEL[r.employment_type ?? ''] ?? '' })
    extra.push({ label: '마감', cell: (r) => (r.is_open_ended ? '상시' : (r.deadline ?? '')), num: true })
  }
  if (board.key === 'faq') extra.push({ label: '분류', cell: (r) => r.faq_category ?? '' })
  // 연혁·수행실적·FAQ·증서는 사이트에 표시 날짜가 안 나온다 — 목록에서도 뺀다.
  const showDate = !board.ordered
  const cols = (board.ordered ? 1 : 0) + (withThumb ? 1 : 0) + 3 + extra.length + (showDate ? 1 : 0)

  return (
    <>
      <div className="dva_head">
        <h1>{board.label}</h1>
        <Link href={`/admin/posts/${board.key}/new`} className="dva_btn is-primary">
          새 글
        </Link>
      </div>
      <div className="dva_tools">
        <SearchBox value={q} onSearch={(v) => query.set({ q: v, page: null })} placeholder="제목·주소로 찾기" label="제목·주소로 찾기" />
        <select
          value={schedule || status}
          onChange={(e) => {
            const v = e.target.value
            if (SCHEDULES.includes(v)) query.set({ schedule: v, status: null, page: null })
            else query.set({ status: v, schedule: null, page: null })
          }}
          aria-label="상태로 거르기"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        {board.ordered && (
          <small className="dva_hint">
            {isHistory ? '같은 연도 안에서 화살표로 바꾼 순서대로 사이트에 나옵니다.' : '화살표로 바꾼 순서대로 사이트에 나옵니다.'}
          </small>
        )}
      </div>
      {error && (
        <div className="dva_error" role="alert">
          {error}
        </div>
      )}
      <div className="dva_tw">
        <table className="dva_table is-cards">
          <thead>
            <tr>
              {board.ordered && <th style={{ width: 84 }}>순서</th>}
              {withThumb && <th style={{ width: 52 }}>그림</th>}
              <th>제목</th>
              <th>상태</th>
              {extra.map((x) => (
                <th key={x.label}>{x.label}</th>
              ))}
              {showDate && <th>표시 날짜</th>}
              <th>
                <span className="dva_sr">동작</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows && rows.data.length === 0 && (
              <tr className="is-empty">
                <td colSpan={cols}>
                  <div className="dva_empty">
                    <p>{q || status || schedule ? '조건에 맞는 글이 없습니다.' : '아직 쓴 글이 없습니다.'}</p>
                    {q || status || schedule ? (
                      <button type="button" className="dva_btn" onClick={() => query.set({ q: null, status: null, schedule: null, page: null })}>
                        조건 지우기
                      </button>
                    ) : (
                      <Link href={`/admin/posts/${board.key}/new`} className="dva_btn is-primary">
                        첫 글 쓰기
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {rows?.data.map((r, i) => {
              const newYear = isHistory && (i === 0 || yearOf(rows.data[i - 1]) !== yearOf(r))
              return (
                <Fragment key={r.id}>
                  {newYear && (
                    <tr className="dva_grouprow">
                      <th colSpan={cols} scope="colgroup">
                        {yearOf(r) ? `${yearOf(r)}년` : '연도 없음'}
                      </th>
                    </tr>
                  )}
                  <tr>
                    {board.ordered && (
                      <td className="is-order" data-label="순서">
                        <button type="button" className="dva_btn is-small" aria-label={`${r.title} 위로`} disabled={busy || !canMove(i, -1)} onClick={() => move(i, -1)}>
                          ↑
                        </button>
                        <button type="button" className="dva_btn is-small" aria-label={`${r.title} 아래로`} disabled={busy || !canMove(i, 1)} onClick={() => move(i, 1)}>
                          ↓
                        </button>
                      </td>
                    )}
                    {withThumb && (
                      <td className="is-thumb">
                        {r.thumbnail ? <img className="dva_thumb" src={r.thumbnail} width={36} height={36} alt="" /> : null}
                      </td>
                    )}
                    <td className="is-title">
                      <Link href={`/admin/posts/${board.key}/${r.id}`}>{r.title || '(제목 없음)'}</Link>
                      {r.is_pinned && <span className="dva_pill is-pinned">고정</span>}
                    </td>
                    <td className="is-status" data-label="상태">
                      <span className={`dva_pill is-${r.status}`}>{r.status === 'published' ? '공개' : '초안'}</span>
                      {isFuture(r.publish_at) && (
                        <span className="dva_pill is-scheduled" title={`${shortWhen(r.publish_at)}에 사이트에 나옵니다.`}>
                          예약 {shortWhen(r.publish_at)}
                        </span>
                      )}
                      {isFuture(r.unpublish_at) && (
                        <span className="dva_pill is-unpublishing" title={`${shortWhen(r.unpublish_at)}에 초안으로 돌아갑니다.`}>
                          내림 예정 {shortDate(r.unpublish_at)}
                        </span>
                      )}
                    </td>
                    {extra.map((x) => (
                      <td key={x.label} className={x.num ? 'is-num' : undefined} data-label={x.label}>
                        {x.cell(r)}
                      </td>
                    ))}
                    {showDate && (
                      <td className="is-num" data-label="표시 날짜">
                        {r.published_date}
                      </td>
                    )}
                    <td className="is-act">
                      {asking === r.id ? (
                        <InlineConfirm message="이 글을 삭제할까요?" confirmLabel="삭제" busy={busy} onConfirm={() => remove(r)} onCancel={() => closeConfirm(r.id)} />
                      ) : (
                        <button
                          ref={(el) => {
                            if (el) triggers.current.set(r.id, el)
                          }}
                          type="button"
                          className="dva_btn is-small"
                          onClick={() => setAsking(r.id)}
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="dva_pager">
        <button type="button" className="dva_btn is-small" disabled={page <= 1} onClick={() => query.set({ page: page - 1 })}>
          이전
        </button>
        <span>
          {page} / {pages} · {rows?.total ?? 0}건
        </span>
        <button type="button" className="dva_btn is-small" disabled={page >= pages} onClick={() => query.set({ page: page + 1 })}>
          다음
        </button>
      </div>
    </>
  )
}
