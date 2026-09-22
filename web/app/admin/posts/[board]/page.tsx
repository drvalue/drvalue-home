'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { adminFetch, adminJson, boardOf, Page, PostRow, yymm } from '@/lib/admin'

/**
 * 게시판 목록. 증서·수행실적·연혁은 화살표로 순서를 바꾼다 — 사이트가 그 순서로 그린다.
 * 삭제는 브라우저 다이얼로그 없이 행 안에서 한 번 더 누른다.
 */
export default function PostListPage() {
  const { board: boardKey } = useParams<{ board: string }>()
  const board = boardOf(boardKey)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<Page<PostRow> | null>(null)
  const [error, setError] = useState('')
  const [asking, setAsking] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!board) return
    const qs = new URLSearchParams({ board: board.key, page: String(page) })
    if (q) qs.set('q', q)
    if (status) qs.set('status', status)
    try {
      setRows(await adminFetch<Page<PostRow>>(`/api/admin/posts?${qs}`))
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [board, page, q, status])

  useEffect(() => {
    load()
  }, [load])

  if (!board) return <div className="dva_error">없는 게시판이다: {boardKey}</div>

  async function remove(id: number) {
    setBusy(true)
    try {
      await adminFetch(`/api/admin/posts/${id}`, { method: 'DELETE' })
      setAsking(null)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  /** 지금 쪽 안에서 한 칸 옮기고, 쪽 전체 순서를 그대로 보낸다. */
  async function move(i: number, dir: -1 | 1) {
    if (!rows) return
    const j = i + dir
    if (j < 0 || j >= rows.data.length) return
    const next = [...rows.data]
    ;[next[i], next[j]] = [next[j], next[i]]
    setRows({ ...rows, data: next })
    setBusy(true)
    try {
      await adminJson('/api/admin/posts/reorder', 'POST', { ids: next.map((r) => r.id) })
      await load()
    } catch (e) {
      setError((e as Error).message)
      await load()
    } finally {
      setBusy(false)
    }
  }

  const pages = rows ? Math.max(1, Math.ceil(rows.total / rows.pageSize)) : 1

  return (
    <>
      <div className="dva_head">
        <h1>{board.label}</h1>
        <Link href={`/admin/posts/${board.key}/new`} className="dva_btn is-primary">새 글</Link>
      </div>
      <div className="dva_tools">
        <input
          type="search"
          placeholder="제목·주소 검색"
          aria-label="검색"
          defaultValue={q}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { setQ((e.target as HTMLInputElement).value.trim()); setPage(1) }
          }}
          style={{ width: 'auto' }}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} aria-label="상태로 거르기" style={{ width: 'auto' }}>
          <option value="">전체</option>
          <option value="published">공개</option>
          <option value="draft">초안</option>
        </select>
        {board.ordered && <small style={{ color: 'var(--dva-muted)' }}>화살표로 옮긴 순서가 사이트의 순서다.</small>}
      </div>
      {error && <div className="dva_error">{error}</div>}
      <div className="dva_tw">
        <table className="dva_table">
          <thead>
            <tr>
              {board.ordered && <th style={{ width: 70 }}>순서</th>}
              <th style={{ width: 48 }}></th>
              <th>제목</th>
              <th>상태</th>
              {board.key === 'patent' || board.key === 'copyright' ? <th>번호</th> : null}
              {board.key === 'history' ? <th>연도</th> : null}
              {board.key === 'case' ? <th>기간</th> : null}
              <th>표시 날짜</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows && rows.data.length === 0 && (
              <tr><td colSpan={8} className="dva_empty">글이 없다</td></tr>
            )}
            {rows?.data.map((r, i) => (
              <tr key={r.id}>
                {board.ordered && (
                  <td className="is-num">
                    <button type="button" className="dva_btn is-small" aria-label="위로" disabled={busy || i === 0} onClick={() => move(i, -1)}>↑</button>{' '}
                    <button type="button" className="dva_btn is-small" aria-label="아래로" disabled={busy || i === rows.data.length - 1} onClick={() => move(i, 1)}>↓</button>
                  </td>
                )}
                <td>
                  {r.thumbnail ? <img className="dva_thumb" src={r.thumbnail} width={36} height={36} alt="" /> : null}
                </td>
                <td className="is-title">
                  <Link href={`/admin/posts/${board.key}/${r.id}`}>{r.title || '(제목 없음)'}</Link>
                  {r.is_pinned && <span className="dva_pill is-pinned">고정</span>}
                </td>
                <td><span className={`dva_pill is-${r.status}`}>{r.status === 'published' ? '공개' : '초안'}</span></td>
                {board.key === 'patent' || board.key === 'copyright' ? <td className="is-num">{r.cert_no ?? ''}</td> : null}
                {board.key === 'history' ? <td className="is-num">{r.history_year ?? ''}</td> : null}
                {board.key === 'case' ? <td className="is-num">{yymm(r.period_start)}~{yymm(r.period_end)}</td> : null}
                <td className="is-num">{r.published_date}</td>
                <td className="is-act">
                  {asking === r.id ? (
                    <span className="dva_confirm">
                      지운다?
                      <button type="button" className="dva_btn is-small is-danger" disabled={busy} onClick={() => remove(r.id)}>예</button>
                      <button type="button" className="dva_btn is-small" onClick={() => setAsking(null)}>아니오</button>
                    </span>
                  ) : (
                    <button type="button" className="dva_btn is-small" onClick={() => setAsking(r.id)}>삭제</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dva_pager">
        <button type="button" className="dva_btn is-small" disabled={page <= 1} onClick={() => setPage(page - 1)}>이전</button>
        <span>{page} / {pages} · {rows?.total ?? 0}건</span>
        <button type="button" className="dva_btn is-small" disabled={page >= pages} onClick={() => setPage(page + 1)}>다음</button>
      </div>
    </>
  )
}
