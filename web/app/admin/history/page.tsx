'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { adminFetch, Page } from '@/lib/admin'
import { refreshSiteMenu } from '@/lib/admin-menu'
import InlineConfirm from '../ui/InlineConfirm'
import { pageOf, useQuery } from '../ui/query'
import SearchBox from '../ui/SearchBox'
import { useToast } from '../ui/toast'
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
 * 대상·바꾼 사람·쪽은 주소에 남는다.
 */
export default function HistoryPage() {
  const query = useQuery()
  const collection = query.get('collection')
  const actor = query.get('actor')
  const page = pageOf(query.get('page'))
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
      <p className="dvh_lead">누가 언제 무엇을 바꿨는지 보여 줍니다. 줄을 누르면 바뀐 칸과 되돌리기 버튼이 나옵니다.</p>
      <div className="dva_tools">
        <select
          value={collection}
          onChange={(e) => {
            query.set({ collection: e.target.value, page: null })
            setOpen(null)
          }}
          aria-label="대상으로 거르기"
        >
          <option value="">전체 대상</option>
          {Object.entries(COLLECTION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <SearchBox
          id="h-actor"
          value={actor}
          onSearch={(v) => {
            query.set({ actor: v, page: null })
            setOpen(null)
          }}
          placeholder="바꾼 사람 이메일"
          label="바꾼 사람으로 거르기"
        />
      </div>
      {error && <div className="dva_error">{error}</div>}
      <div className="dva_tw">
        <table className="dva_table dvh_table">
          <thead>
            <tr><th>시각</th><th>누가</th><th>무엇</th><th>동작</th></tr>
          </thead>
          <tbody>
            {rows && rows.data.length === 0 && (
              <tr><td colSpan={4} className="dva_empty">변경 이력이 없습니다.</td></tr>
            )}
            {rows?.data.map((r) => (
              <HistoryRow key={r.id} r={r} open={open?.id === r.id ? open : null} onPick={() => pick(r.id)} onRestored={() => { setOpen(null); load() }} />
            ))}
          </tbody>
        </table>
      </div>
      {openErr && <div className="dva_error">{openErr}</div>}
      <div className="dva_pager">
        <button type="button" className="dva_btn is-small" disabled={page <= 1} onClick={() => query.set({ page: page - 1 })}>이전</button>
        <span>{page} / {pages} · {rows?.total ?? 0}건</span>
        <button type="button" className="dva_btn is-small" disabled={page >= pages} onClick={() => query.set({ page: page + 1 })}>다음</button>
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
      {/* 줄 어디를 눌러도 열린다. 키보드는 가운데 칸의 버튼으로 연다. */}
      <tr className={`dvh_row${open ? ' is-open' : ''}`} onClick={onPick}>
        <td className="is-num">{when(r.created_on)}</td>
        <td className="dvh_actor_cell">{r.actor}</td>
        <td className="is-title">
          <button
            type="button"
            className="dvh_pick"
            aria-expanded={Boolean(open)}
            onClick={(e) => {
              e.stopPropagation()
              onPick()
            }}
          >
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
  const toast = useToast()
  const trigger = useRef<HTMLButtonElement>(null)
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
      // 사이트 머리글은 메뉴를 60초 캐시한다 — 메뉴 저장 화면처럼 바로 비운다(실패해도 1분 안에 바뀐다).
      if (rev.collection === 'menu') await refreshSiteMenu()
      const w = r.warnings?.length ? ' ' + r.warnings.join(' ') : ''
      setMsg(`이 변경 전 상태로 되돌렸습니다.${w}`)
      toast(`되돌렸습니다.${w}`)
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
        {shown.length === 0 && <div className="dva_empty">바뀐 칸이 없습니다.</div>}
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
            <InlineConfirm
              message="이 변경 전 상태로 되돌릴까요?"
              confirmLabel="되돌리기"
              busy={busy}
              onConfirm={restore}
              onCancel={() => {
                setAsking(false)
                requestAnimationFrame(() => trigger.current?.focus())
              }}
            />
          ) : (
            <button ref={trigger} type="button" className="dva_btn is-small" onClick={() => setAsking(true)}>
              이 버전으로 되돌리기
            </button>
          )
        ) : (
          <span className="dvh_muted">{rev.restore_note ?? '되돌릴 수 없는 항목입니다.'}</span>
        )}
        {err && <span className="dva_error dvh_inline_err">{err}</span>}
      </div>
    </div>
  )
}
