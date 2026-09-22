'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminFetch, adminJson, Inquiry, INQUIRY_STATUS, Page } from '@/lib/admin'

export default function InquiriesPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<Page<Inquiry> | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page) })
    if (status) qs.set('status', status)
    try {
      setRows(await adminFetch<Page<Inquiry>>(`/api/admin/inquiries?${qs}`))
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [page, status])

  useEffect(() => {
    load()
  }, [load])

  async function change(id: number, next: string) {
    try {
      await adminJson(`/api/admin/inquiries/${id}`, 'PATCH', { status: next })
      setRows((r) => (r ? { ...r, data: r.data.map((x) => (x.id === id ? { ...x, status: next } : x)) } : r))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const pages = rows ? Math.max(1, Math.ceil(rows.total / rows.pageSize)) : 1

  return (
    <>
      <div className="dva_head">
        <h1>문의</h1>
      </div>
      <div className="dva_tools">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} aria-label="상태로 거르기" style={{ width: 'auto' }}>
          <option value="">전체 상태</option>
          {Object.entries(INQUIRY_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {error && <div className="dva_error">{error}</div>}
      <div className="dva_tw">
        <table className="dva_table">
          <thead>
            <tr><th>이름</th><th>유형</th><th>연락처</th><th>내용</th><th>상태</th></tr>
          </thead>
          <tbody>
            {rows && rows.data.length === 0 && (
              <tr><td colSpan={5} className="dva_empty">문의가 없다</td></tr>
            )}
            {rows?.data.map((q) => (
              <tr key={q.id}>
                <td>{q.name}{q.company ? <small style={{ display: 'block', color: 'var(--dva-muted)' }}>{q.company}</small> : null}</td>
                <td>{q.type}</td>
                <td className="is-num">{q.phone ?? ''}{q.email ? <small style={{ display: 'block' }}>{q.email}</small> : null}</td>
                <td title={q.message}>{q.message.length > 60 ? q.message.slice(0, 60) + '…' : q.message}</td>
                <td>
                  <select value={q.status} onChange={(e) => change(q.id, e.target.value)} aria-label={`${q.name} 문의 상태`} style={{ width: 'auto' }}>
                    {Object.entries(INQUIRY_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
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
