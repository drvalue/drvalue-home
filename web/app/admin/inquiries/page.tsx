'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { adminFetch, adminJson, INQUIRY_STATUS, Page } from '@/lib/admin'
import { useMe } from '../ui/me'
import { pageOf, useQuery } from '../ui/query'
import SearchBox from '../ui/SearchBox'
import { useToast } from '../ui/toast'
import { Assignee, InquiryDetail, replyHref, when } from './types'
import './inquiries.css'

/**
 * 문의. 왼쪽 목록 · 오른쪽 상세(좁으면 아래). 상태·담당자는 고르면 바로 저장되고,
 * 메모는 「저장」을 눌러야 저장된다. 답장은 메일 앱으로 — 제목·원문 인용이 채워진다.
 * 거르기·검색·쪽·고른 문의(?id=)는 주소에 남는다 — 주소를 건네면 같은 문의가 열린다.
 */
export default function InquiriesPage() {
  const query = useQuery()
  const status = query.get('status')
  const assignee = query.get('assignee')
  const q = query.get('q')
  const page = pageOf(query.get('page'))
  const selId = Number(query.get('id')) || null
  const { refreshCounts } = useMe()
  const [rows, setRows] = useState<Page<InquiryDetail> | null>(null)
  const [people, setPeople] = useState<Assignee[]>([])
  const [error, setError] = useState('')
  const detail = useRef<HTMLElement>(null)

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page) })
    if (status) qs.set('status', status)
    if (assignee) qs.set('assignee', assignee)
    if (q) qs.set('q', q)
    try {
      setRows(await adminFetch<Page<InquiryDetail>>(`/api/admin/inquiries?${qs}`))
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [page, status, assignee, q])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    adminFetch<{ data: Assignee[] }>('/api/admin/inquiries/assignees')
      .then((r) => setPeople(r.data))
      .catch(() => {})
  }, [])

  const sel = rows?.data.find((x) => x.id === selId) ?? null
  const pages = rows ? Math.max(1, Math.ceil(rows.total / rows.pageSize)) : 1

  function pick(id: number) {
    query.set({ id })
    // 좁은 화면에서는 상세가 목록 아래에 있다 — 거기로 내려 준다.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 960px)').matches) {
      requestAnimationFrame(() => detail.current?.scrollIntoView({ block: 'start' }))
    }
  }

  function replace(next: InquiryDetail) {
    setRows((r) => (r ? { ...r, data: r.data.map((x) => (x.id === next.id ? next : x)) } : r))
    refreshCounts()
  }

  const nameOf = (email: string | null) => {
    if (!email) return ''
    const p = people.find((x) => x.email === email)
    return p?.name || email
  }

  return (
    <div className="dvi">
      <div className="dva_head">
        <h1>문의</h1>
        <span className="dvi_count">{rows ? `${rows.total}건` : ''}</span>
      </div>

      <div className="dva_tools">
        <select id="dvi-status" value={status} onChange={(e) => query.set({ status: e.target.value, page: null, id: null })} aria-label="상태로 거르기">
          <option value="">전체 상태</option>
          {Object.entries(INQUIRY_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select id="dvi-assignee" value={assignee} onChange={(e) => query.set({ assignee: e.target.value, page: null, id: null })} aria-label="담당자로 거르기">
          <option value="">모든 담당자</option>
          <option value="me">내 담당</option>
          <option value="none">미지정</option>
        </select>
        <SearchBox id="dvi-q" value={q} onSearch={(v) => query.set({ q: v, page: null, id: null })} placeholder="이름·회사·연락처·내용" label="문의 찾기" />
      </div>
      {error && (
        <div className="dva_error" role="alert">
          {error}
        </div>
      )}

      <div className="dvi_split">
        <div className="dvi_listwrap">
          {rows && rows.data.length === 0 && (
            <div className="dva_empty">
              <p>{status || assignee || q ? '조건에 맞는 문의가 없습니다.' : '문의가 없습니다.'}</p>
              {(status || assignee || q) && (
                <button type="button" className="dva_btn" onClick={() => query.set({ status: null, assignee: null, q: null, page: null, id: null })}>
                  조건 지우기
                </button>
              )}
            </div>
          )}
          <ul className="dvi_list">
            {rows?.data.map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  className={`dvi_item${x.id === selId ? ' is-on' : ''}`}
                  onClick={() => pick(x.id)}
                  aria-current={x.id === selId ? 'true' : undefined}
                >
                  <span className="dvi_item_top">
                    <b>{x.name}</b>
                    <span className={`dvi_status is-${x.status}`}>{INQUIRY_STATUS[x.status] ?? x.status}</span>
                  </span>
                  <span className="dvi_item_mid">
                    {x.type}
                    {x.company ? ` · ${x.company}` : ''}
                  </span>
                  <span className="dvi_item_msg">{x.message}</span>
                  <span className="dvi_item_bot">
                    <time dateTime={x.created_on}>{when(x.created_on)}</time>
                    {x.assignee_email ? <em>담당 {nameOf(x.assignee_email)}</em> : <em className="is-none">미지정</em>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="dva_pager">
            <button type="button" className="dva_btn is-small" disabled={page <= 1} onClick={() => query.set({ page: page - 1, id: null })}>
              이전
            </button>
            <span>
              {page} / {pages}
            </span>
            <button type="button" className="dva_btn is-small" disabled={page >= pages} onClick={() => query.set({ page: page + 1, id: null })}>
              다음
            </button>
          </div>
        </div>

        <aside ref={detail} className="dvi_detail" aria-label="문의 상세">
          {sel ? (
            <Detail key={sel.id} item={sel} people={people} onSaved={replace} />
          ) : selId && rows ? (
            <div className="dva_empty">이 쪽 목록에 없는 문의입니다. 거르기나 쪽을 바꿔 보세요.</div>
          ) : (
            <div className="dva_empty">목록에서 문의를 고르면 내용이 여기에 나옵니다.</div>
          )}
        </aside>
      </div>
    </div>
  )
}

function Detail({
  item,
  people,
  onSaved,
}: {
  item: InquiryDetail
  people: Assignee[]
  onSaved: (next: InquiryDetail) => void
}) {
  const toast = useToast()
  const [note, setNote] = useState(item.note ?? '')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function patch(body: Record<string, unknown>, done: string) {
    setBusy(true)
    setErr('')
    try {
      const r = await adminJson<{ data: InquiryDetail }>(`/api/admin/inquiries/${item.id}`, 'PATCH', body)
      onSaved(r.data)
      toast(done)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dvi_card">
      <div className="dvi_card_head">
        <div>
          <h2>{item.name}</h2>
          {item.company && <p>{item.company}</p>}
        </div>
        {item.email ? (
          <a className="dva_btn is-primary" href={replyHref(item)}>
            메일로 답장
          </a>
        ) : (
          <span className="dvi_noemail">이메일 없음</span>
        )}
      </div>

      <dl className="dvi_facts">
        <dt>유형</dt>
        <dd>{item.type}</dd>
        <dt>연락처</dt>
        <dd>{item.phone ? <a href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}>{item.phone}</a> : '—'}</dd>
        <dt>이메일</dt>
        <dd>{item.email ? <a href={`mailto:${item.email}`}>{item.email}</a> : '—'}</dd>
        <dt>접수</dt>
        <dd>
          <time dateTime={item.created_on}>{when(item.created_on)}</time>
        </dd>
        {item.source_path && (
          <>
            <dt>들어온 곳</dt>
            <dd>{item.source_path}</dd>
          </>
        )}
      </dl>

      <div className="dvi_message">{item.message}</div>

      <div className="dvi_controls">
        <div className="dva_field">
          <label htmlFor="dvi-d-status">상태</label>
          <select
            id="dvi-d-status"
            value={item.status}
            disabled={busy}
            onChange={(e) => patch({ status: e.target.value }, '상태를 바꿨습니다.')}
          >
            {Object.entries(INQUIRY_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="dva_field">
          <label htmlFor="dvi-d-assignee">담당자</label>
          <select
            id="dvi-d-assignee"
            value={item.assignee_email ?? ''}
            disabled={busy}
            onChange={(e) => patch({ assignee_email: e.target.value || null }, '담당자를 바꿨습니다.')}
          >
            <option value="">미지정</option>
            {people.map((p) => (
              <option key={p.email} value={p.email}>
                {p.name ? `${p.name} (${p.email})` : p.email}
              </option>
            ))}
            {item.assignee_email && !people.some((p) => p.email === item.assignee_email) && (
              <option value={item.assignee_email}>{item.assignee_email} (권한 없음)</option>
            )}
          </select>
          {people.length === 0 && <small>담당자로 고를 사람이 없습니다. IAM 관리자가 한 번 로그인하면 권한 목록에 나타납니다.</small>}
        </div>
      </div>

      <div className="dva_field">
        <label htmlFor="dvi-d-note">내부 메모</label>
        <textarea
          id="dvi-d-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={5000}
          placeholder="문의한 분에게는 보이지 않습니다."
        />
        <div className="dvi_note_actions">
          <button
            type="button"
            className="dva_btn"
            disabled={busy || note === (item.note ?? '')}
            onClick={() => patch({ note: note.trim() ? note : null }, '메모를 저장했습니다.')}
          >
            메모 저장
          </button>
        </div>
      </div>

      {err && (
        <div className="dva_error" role="alert">
          {err}
        </div>
      )}
    </div>
  )
}
