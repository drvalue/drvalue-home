import type { Metadata } from 'next'
import './admin.css'
import AdminShell from './AdminShell'

/**
 * 관리 화면. 루트 레이아웃(공개 화면의 css·스크립트)을 그대로 물려받으므로 꾸밈은
 * admin.css 가 .dva 아래에 가둔다. 검색에 걸리면 안 된다.
 */
export const metadata: Metadata = {
  title: '디알밸류 관리',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
