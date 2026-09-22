'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminFetch, adminJson } from '@/lib/admin'
import { AdminUserRow, ROLE_HINT, ROLE_LABEL, when } from '@/lib/admin-extra'
import './users.css'

const ROLES: AdminUserRow['role'][] = ['admin', 'marketing', 'hr']

/**
 * 권한. 사람은 IAM 이 정한다 — IAM 관리자(PLATFORM_ADMIN)가 한 번 로그인하면 여기 생기고,
 * IAM 에서 관리자가 아니게 되면 다음 로그인·재검에서 「IAM 에서 해제됨」이 된다.
 * 여기서는 각자 고칠 수 있는 범위만 바꾼다. 추가·삭제는 없다.
 */
export default function UsersPage() {
  const [rows, setRows] = useState<AdminUserRow[] | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setRows((await adminFetch<{ data: AdminUserRow[] }>('/api/admin/users')).data)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function change(email: string, role: AdminUserRow['role']) {
    setSaving(email)
    setError('')
    try {
      const r = await adminJson<{ data: AdminUserRow }>(`/api/admin/users/${encodeURIComponent(email)}`, 'PATCH', { role })
      setRows((xs) => (xs ? xs.map((x) => (x.email === email ? r.data : x)) : xs))
      setDone(email)
      setTimeout(() => setDone((d) => (d === email ? null : d)), 1500)
    } catch (e) {
      setError((e as Error).message)
      load()
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <div className="dva_head">
        <h1>권한</h1>
      </div>
      <div className="dvu_intro">
        <p>
          관리자 여부는 사내 IAM 이 정한다(<b>PLATFORM_ADMIN</b>). IAM 관리자가 한 번 로그인하면 여기
          나타난다. 여기서는 각자 고칠 수 있는 범위만 정한다 — 전부 / 마케팅(채용 빼고) / 인사(채용만).
        </p>
        <ul className="dvu_roles">
          {ROLES.map((r) => (
            <li key={r}>
              <span className={`dva_pill dvu_role is-${r}`}>{ROLE_LABEL[r]}</span>
              <span>{ROLE_HINT[r]}</span>
            </li>
          ))}
        </ul>
      </div>
      {error && <div className="dva_error">{error}</div>}
      <div className="dva_tw">
        <table className="dva_table dvu_table">
          <thead>
            <tr><th>이메일</th><th>이름</th><th>고칠 수 있는 범위</th><th>IAM 동기화</th><th>마지막 로그인</th></tr>
          </thead>
          <tbody>
            {rows && rows.length === 0 && (
              <tr><td colSpan={5} className="dva_empty">아직 아무도 로그인하지 않았다</td></tr>
            )}
            {rows?.map((u) => (
              <tr key={u.email} className={u.enabled ? '' : 'is-off'}>
                <td className="dvu_email">{u.email}</td>
                <td>{u.name ?? ''}</td>
                <td>
                  <label className="dvu_sel">
                    <span className="dvu_sr">{u.email} 의 범위</span>
                    <select
                      value={u.role}
                      disabled={saving === u.email}
                      onChange={(e) => change(u.email, e.target.value as AdminUserRow['role'])}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                      ))}
                    </select>
                    {done === u.email && <span className="dvu_saved">저장됨</span>}
                  </label>
                </td>
                <td>
                  {u.enabled ? (
                    <span className="dva_pill is-published">사용 중</span>
                  ) : (
                    <span className="dva_pill dvu_off">IAM 에서 해제됨</span>
                  )}
                </td>
                <td className="is-num">{when(u.last_login_on) || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
