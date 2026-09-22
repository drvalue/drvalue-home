'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { adminFetch, AdminMe, BOARDS, Page } from '@/lib/admin'
import { ROLE_LABEL } from '@/lib/admin-extra'
import { LeaveGuardProvider, useLeaveGuard } from './ui/leave'
import { MeContext } from './ui/me'
import { ToastProvider } from './ui/toast'

/**
 * 껍데기: 세션 확인 · 메뉴 · 알림 · 이탈 경고. /admin/login 은 껍데기 없이 그대로 보여 준다.
 * /me 가 401 이면 adminFetch 가 로그인으로 보낸다 — 여기서는 그동안 「확인 중」.
 *
 * 넓은 화면은 왼쪽 사이드바, 860px 이하는 위 막대 + 메뉴 버튼(서랍)이다. 서랍이 열리면
 * 포커스가 메뉴 안에 갇히고 Escape 로 닫힌다. 화면을 옮기면 닫힌다.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname.startsWith('/admin/login')) return <>{children}</>
  return (
    <ToastProvider>
      <LeaveGuardProvider>
        <Shell>{children}</Shell>
      </LeaveGuardProvider>
    </ToastProvider>
  )
}

type NavItem = { href: string; label: string; exact?: boolean; badge?: number | null }

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { leave } = useLeaveGuard()
  const [me, setMe] = useState<AdminMe | null>(null)
  const [newInquiries, setNewInquiries] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const side = useRef<HTMLElement>(null)
  const menuBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    adminFetch<{ data: AdminMe }>('/api/admin/auth/me')
      .then((r) => setMe(r.data))
      .catch(() => {})
  }, [pathname])

  // /me 는 화면을 옮길 때마다 다시 받는다(범위가 바뀌었을 수 있다). 수는 범위가 바뀔 때와
  // 화면을 옮길 때만 다시 센다 — me 객체가 새로 와도 한 번만.
  const role = me?.role ?? null
  const refreshCounts = useCallback(() => {
    if (!role || role === 'hr') return setNewInquiries(null)
    adminFetch<Page<unknown>>('/api/admin/inquiries?status=new')
      .then((r) => setNewInquiries(r.total))
      .catch(() => {})
  }, [role])

  useEffect(() => {
    refreshCounts()
  }, [refreshCounts, pathname])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // 서랍: 첫 링크에 포커스 · Tab 을 안에 가둔다 · Escape 로 닫고 메뉴 버튼으로 돌아간다.
  useEffect(() => {
    if (!open) return
    const box = side.current
    const items = () => Array.from(box?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
    items()[0]?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        menuBtn.current?.focus()
        return
      }
      if (e.key !== 'Tab') return
      const xs = items()
      if (xs.length === 0) return
      const first = xs[0]
      const last = xs[xs.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!me) {
    return (
      <div className="dva">
        <div />
        <main className="dva_main">
          <div className="dva_empty">확인 중…</div>
        </main>
      </div>
    )
  }

  function logout() {
    leave(async () => {
      try {
        await adminFetch('/api/admin/auth/logout', { method: 'POST' })
      } catch {}
      router.replace('/admin/login?signed_out=1')
    })
  }

  const on = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/')
  const groups: { title: string | null; items: NavItem[] }[] = [
    { title: null, items: [{ href: '/admin', label: '홈', exact: true }] },
    {
      title: '게시판',
      items: BOARDS.filter((b) => me.boards.includes(b.key)).map((b) => ({ href: `/admin/posts/${b.key}`, label: b.label })),
    },
  ]
  if (me.role !== 'hr') {
    groups.push({
      title: '운영',
      items: [
        { href: '/admin/inquiries', label: '문의', badge: newInquiries },
        { href: '/admin/media', label: '미디어' },
        // 정적 장의 검색 제목·설명·공유 그림(api 가 전체 권한·마케팅만 받는다).
        { href: '/admin/seo', label: 'SEO' },
      ],
    })
  }
  if (me.role === 'admin') {
    groups.push({
      title: '관리',
      items: [
        { href: '/admin/history', label: '변경 이력' },
        { href: '/admin/users', label: '권한' },
      ],
    })
  }

  return (
    <MeContext.Provider value={{ me, newInquiries, refreshCounts }}>
      <div className="dva" data-drawer={open ? 'open' : undefined}>
        <a href="#dva-main" className="dva_skip">
          본문으로 건너뛰기
        </a>
        <header className="dva_top">
          <button
            ref={menuBtn}
            type="button"
            className="dva_menu_btn"
            aria-expanded={open}
            aria-controls="dva-side"
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            메뉴
          </button>
          <Link href="/admin" className="dva_top_brand">
            디알밸류 관리
          </Link>
          {newInquiries ? (
            <Link href="/admin/inquiries?status=new" className="dva_top_badge">
              새 문의 {newInquiries}
            </Link>
          ) : null}
        </header>
        <aside id="dva-side" ref={side} className="dva_side" aria-label="관리 메뉴">
          <Link href="/admin" className="dva_brand">
            디알밸류 관리
          </Link>
          {groups.map((g) => (
            <div key={g.title ?? 'home'} className="dva_navgroup">
              {g.title && <div className="dva_group">{g.title}</div>}
              {g.items.map((item) => {
                const active = on(item)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`dva_nav${active ? ' is-on' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="dva_badge" aria-label={`새 문의 ${item.badge}건`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          ))}
          <div className="dva_me">
            <div>
              {me.name ? `${me.name} · ` : ''}
              {me.email}
            </div>
            <small>{me.role ? ROLE_LABEL[me.role] : ''}</small>
            <button type="button" className="dva_btn is-small" onClick={logout}>
              로그아웃
            </button>
          </div>
        </aside>
        {open && <div className="dva_scrim" aria-hidden="true" onClick={() => setOpen(false)} />}
        <main id="dva-main" className="dva_main" tabIndex={-1}>
          <Suspense fallback={<div className="dva_empty">불러오는 중…</div>}>{children}</Suspense>
        </main>
      </div>
    </MeContext.Provider>
  )
}
