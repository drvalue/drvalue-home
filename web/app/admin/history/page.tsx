'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminFetch, Page } from '@/lib/admin'
import {
  ACTION_LABEL,
  boardLabel,
  COLLECTION_LABEL,
  diffRows,
  RevisionFull,
  RevisionRow,
  when,
} from '@/lib/admin-extra'
import './history.css'

/**
 * 변경 이력. 누가 · 언제 · 무엇을 바꿨나 → 한 줄을 누르면 칸별 전후 비교와 되돌리기.
 * 되돌리기는 그 변경 「전」 상태로 돌린다. 되돌리기도 이력 한 줄로 남는다.
 */
export default function HistoryPage() {
  const [collection, setCollection] = useState('')
  const [actor, setActor] = useState('')
  const [actorInput, setActorInput] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<Page<RevisionRow> | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<RevisionFull | null>(null)
  const [openErr, setOpenErr] = useState('')

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page) })
    if (collection) qs.set('collection', collection)
    if (actor) qs.set('actor', actor)
    try {
      setRows(await adminFetch<Page<RevisionRow>>(`/api/admin/revisions?${qs}`))
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [page, collection, actor])

  useEffect(() => {
    load()
  }, [load])

  async function pick(id: number) {
    if (open?.id === id) {
      setOpen(null)
      return
    }
    try {
      const r = await adminFetch<{ data: RevisionFull }>(`/api/admin/revisions/${id}`)
      setOpen(r.data)
      setOpenErr('')
    } catch (e) {
      setOpenErr((e as Error).message)
    }
  }

  const pages = rows ? Math.max(1, Math.ceil(rows.total / rows.pageSize)) : 1

  return (
    <>
      <div className="dva_head">
        <h1>변경 이력</h1>
      </div>
      <p className="dvh_lead">누가 언제 무엇을 바꿨는지. 한 줄을 누르면 바뀐 칸과 되돌리기가 나온다.</p>
      <div className="dva_tools">
        <select
          value={collection}
          onChange={(e) => {
            setCollection(e.target.value)
            setPage(1)
            setOpen(null)
          }}
          aria-label="대상으로 거르기"
          style={{ width: 'auto' }}
        >
          <option value="">전체 대상</option>
          {Object.entries(COLLECTION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <form
          className="dvh_actor"
          onSubmit={(e) => {
            e.preventDefault()
            setActor(actorInput.trim())
            setPage(1)
            setOpen(null)
          }}
        >
          <input
            id="h-actor"
            type="search"
            placeholder="바꾼 사람 이메일"
            value={actorInput}
            onChange={(e) => setActorInput(e.target.value)}
            aria-label="바꾼 사람으로 거르기"
          />
          <button type="submit" className="dva_btn is-small">거르기</button>
        </form>
      </div>
      {error && <div className="dva_error">{error}</div>}
      <div className="dva_tw">
        <table className="dva_table dvh_table">
          <thead>
            <tr><th>시각</th><th>누가</th><th>무엇</th><th>동작</th></tr>
          </thead>
          <tbody>
            {rows && rows.data.length === 0 && (
              <tr><td colSpan={4} className="dva_empty">이력이 없다</td></tr>
            )}
            {rows?.data.map((r) => (
              <HistoryRow key={r.id} r={r} open={open?.id === r.id ? open : null} onPick={() => pick(r.id)} onRestored={() => { setOpen(null); load() }} />
            ))}
          </tbody>
        </table>
      </div>
      {openErr && <div className="dva_error">{openErr}</div>}
      <div className="dva_pager">
        <button type="button" className="dva_btn is-small" disabled={page <= 1} onClick={() => setPage(page - 1)}>이전</button>
        <span>{page} / {pages} · {rows?.total ?? 0}건</span>
        <button type="button" className="dva_btn is-small" disabled={page >= pages} onClick={() => setPage(page + 1)}>다음</button>
      </div>
    </>
  )
}

function HistoryRow({
  r,
  open,
  onPick,
  onRestored,
}: {
  r: RevisionRow
  open: RevisionFull | null
  onPick: () => void
  onRestored: () => void
}) {
  const what = r.collection === 'posts' ? `${boardLabel(r.board)} · ${r.label}` : `${COLLECTION_LABEL[r.collection] ?? r.collection} · ${r.label}`
  return (
    <>
      <tr className={`dvh_row${open ? ' is-open' : ''}`}>
        <td className="is-num">{when(r.created_on)}</td>
        <td className="dvh_actor_cell">{r.actor}</td>
        <td className="is-title">
          <button type="button" className="dvh_pick" aria-expanded={Boolean(open)} onClick={onPick}>
            {what}
          </button>
        </td>
        <td><span className={`dva_pill dvh_act is-${r.action}`}>{ACTION_LABEL[r.action] ?? r.action}</span></td>
      </tr>
      {open && (
        <tr className="dvh_detail">
          <td colSpan={4}>
            <Detail rev={open} onRestored={onRestored} />
          </td>
        </tr>
      )}
    </>
  )
}

function Detail({ rev, onRestored }: { rev: RevisionFull; onRestored: () => void }) {
  const [all, setAll] = useState(false)
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const rows = diffRows(rev.before, rev.after)
  const shown = all ? rows : rows.filter((x) => x.changed)

  async function restore() {
    setBusy(true)
    setErr('')
    try {
      const r = await adminFetch<{ warnings?: string[] }>(`/api/admin/revisions/${rev.id}/restore`, { method: 'POST' })
      const w = r.warnings?.length ? ` (${r.warnings.join(' · ')})` : ''
      setMsg(`이 변경 전으로 되돌렸다${w}`)
      setAsking(false)
      setTimeout(onRestored, 900)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dvh_box">
      <div className="dvh_box_head">
        <span>{rows.filter((x) => x.changed).length}칸 바뀜</span>
        <label className="dva_check">
          <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> 안 바뀐 칸도 보기
        </label>
      </div>
      <div className="dvh_diff" role="table" aria-label="변경 전후">
        <div className="dvh_diff_head" role="row">
          <span role="columnheader">칸</span>
          <span role="columnheader">바꾸기 전</span>
          <span role="columnheader">바꾼 뒤</span>
        </div>
        {shown.length === 0 && <div className="dva_empty">바뀐 칸이 없다</div>}
        {shown.map((x) => (
          <div key={x.key} className={`dvh_diff_row${x.changed ? ' is-changed' : ''}`} role="row">
            <span role="cell" className="dvh_k">{x.label}</span>
            <span role="cell" className="dvh_v is-before">{x.before || <em>비어 있음</em>}</span>
            <span role="cell" className="dvh_v is-after">{x.after || <em>비어 있음</em>}</span>
          </div>
        ))}
      </div>
      <div className="dvh_box_foot">
        {msg ? (
          <span className="dva_notice">{msg}</span>
        ) : rev.restorable ? (
          asking ? (
            <span className="dva_confirm">
              이 변경 전 상태로 되돌린다?
              <button type="button" className="dva_btn is-small is-danger" disabled={busy} onClick={restore}>예</button>
              <button type="button" className="dva_btn is-small" onClick={() => setAsking(false)}>아니오</button>
            </span>
          ) : (
            <button type="button" className="dva_btn is-small" onClick={() => setAsking(true)}>이 버전으로 되돌리기</button>
          )
        ) : (
          <span className="dvh_muted">
            {rev.collection === 'files'
              ? '파일은 되돌릴 수 없다 — 다시 올린다'
              : rev.action === 'create'
                ? '만들기 이전 상태는 없다'
                : '되돌리기를 지원하지 않는 대상'}
          </span>
        )}
        {err && <span className="dva_error dvh_inline_err">{err}</span>}
      </div>
    </div>
  )
}
