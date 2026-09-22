import type { Metadata, Viewport } from 'next'
import './admin.css'
import AdminShell from './AdminShell'

/**
 * 관리 화면의 루트 레이아웃. 공개 화면(app/(site)/layout.tsx)과 따로 선다 — 공개 화면의
 * css(style·header·footer·swiper·font-awesome)·스크립트(jQuery·Swiper·GTM·채팅 위젯)를 싣지 않는다.
 * 글꼴(Pretendard)만 같이 쓴다. 꾸밈은 admin.css 하나, 전부 .dva 아래. 검색에 걸리면 안 된다.
 *
 * 공개 화면과 루트가 다르므로 둘 사이를 오가면 전체를 다시 읽는다(「사이트에서 보기」 등).
 */
export const viewport: Viewport = {
  themeColor: '#172033',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: '디알밸류 관리',
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/icon/favicon.ico', sizes: 'any' },
      { url: '/icon/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: { url: '/icon/apple-touch-icon.png', sizes: '180x180' },
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css"
          crossOrigin="anonymous"
        />
      </head>
      {/* 확장 프로그램이 <body> 에 심는 속성 경고만 끈다(공개 레이아웃과 같은 이유). */}
      <body className="dva_body" suppressHydrationWarning>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  )
}
