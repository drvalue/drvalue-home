'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { when } from '@/lib/admin-extra'
import { listPages, type PageRow } from '@/lib/admin-pages'
import './pages.css'

/**
 * 페이지 — 게시판이 아닌 장(회사소개·오시는 길 …)의 글. 어떤 장을 고칠 수 있는지는 api 가 정한다
 * (core/page/schema). 저장하면 사이트에 바로 나온다.
 */
export default function PagesPage() {
  const [rows, setRows] = useState<PageRow[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listPages()
      .then(setRows)
      .catch((e) => setError((e as Error).message))
  }, [])

  return (
    <>
      <div className="dva_head">
        <h1>페이지</h1>
      </div>
      <p className="dvp_lead">게시판이 아닌 장의 글을 고칩니다. 저장하면 사이트에 바로 반영됩니다.</p>
      {error && (
        <div className="dva_error" role="alert">
          {error}
        </div>
      )}
      {!rows && !error && <div className="dva_empty">불러오는 중…</div>}
      {rows && (
        <div className="dva_tw">
          <table className="dva_table is-cards">
            <thead>
              <tr>
                <th>장</th>
                <th>사이트 주소</th>
                <th>마지막 수정</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td data-label="장">
                    <Link href={`/admin/pages/${r.key}`} className="dvp_name">
                      {r.label}
                    </Link>
                  </td>
                  <td data-label="사이트 주소">
                    <a href={r.path} target="_blank" rel="noreferrer">
                      {r.path}
                    </a>
                  </td>
                  <td data-label="마지막 수정" className="is-num">
                    {r.updated_on ? `${when(r.updated_on)} · ${r.updated_by === 'seed' || !r.updated_by ? '처음 글' : r.updated_by}` : '아직 없음'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
