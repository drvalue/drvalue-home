'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { adminFetch, AdminMe, BOARDS } from '@/lib/admin'
import { ROLE_LABEL } from '@/lib/admin-extra'

/**
 * 사이드바 + 세션 확인. /admin/login 은 껍데기 없이 그대로 보여 준다.
 * /me 가 401 이면 adminFetch 가 로그인으로 보낸다 — 여기서는 그동안 빈 화면.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [me, setMe] = useState<AdminMe | null>(null)
  const isLogin = pathname.startsWith('/admin/login')

  useEffect(() => {
    if (isLogin) return
    adminFetch<{ data: AdminMe }>('/api/admin/auth/me')
      .then((r) => setMe(r.data))
      .catch(() => {})
  }, [isLogin, pathname])

  if (isLogin) return <>{children}</>
  if (!me) return <div className="dva"><div /><div className="dva_main"><div className="dva_empty">확인 중…</div></div></div>

  async function logout() {
    try {
      await adminFetch('/api/admin/auth/logout', { method: 'POST' })
    } catch {}
    router.replace('/admin/login?signed_out=1')
  }

  return (
    <div className="dva">
      <aside className="dva_side" aria-label="관리 메뉴">
        <div className="dva_brand">디알밸류 관리</div>
        <div className="dva_group">게시판</div>
        {BOARDS.filter((b) => me.boards.includes(b.key)).map((b) => {
          const href = `/admin/posts/${b.key}`
          const on = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={b.key} href={href} className={`dva_nav${on ? ' is-on' : ''}`} aria-current={on ? 'page' : undefined}>
              {b.label}
            </Link>
          )
        })}
        {me.role !== 'hr' && (
          <>
            <div className="dva_group">운영</div>
            <Link href="/admin/inquiries" className={`dva_nav${pathname.startsWith('/admin/inquiries') ? ' is-on' : ''}`}>
              문의
            </Link>
            <Link href="/admin/media" className={`dva_nav${pathname.startsWith('/admin/media') ? ' is-on' : ''}`}>
              미디어
            </Link>
          </>
        )}
        {me.role === 'admin' && (
          <>
            <div className="dva_group">관리</div>
            <Link href="/admin/history" className={`dva_nav${pathname.startsWith('/admin/history') ? ' is-on' : ''}`}>
              변경 이력
            </Link>
            <Link href="/admin/users" className={`dva_nav${pathname.startsWith('/admin/users') ? ' is-on' : ''}`}>
              권한
            </Link>
          </>
        )}
        <div className="dva_me">
          <div>{me.name ? `${me.name} · ` : ''}{me.email}</div>
          <small>{me.role ? ROLE_LABEL[me.role] : ''}</small>
          <button type="button" className="dva_btn is-small" onClick={logout}>로그아웃</button>
        </div>
      </aside>
      <main className="dva_main">{children}</main>
    </div>
  )
}
