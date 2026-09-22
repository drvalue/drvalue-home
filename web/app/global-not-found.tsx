import type { Metadata } from 'next'
import SiteLayout, { metadata as siteMetadata, viewport as siteViewport } from './(site)/layout'
import NotFound from './(site)/not-found'
import { SITE_NAME } from '@/lib/seo'

/**
 * 어느 주소에도 안 맞는 요청(예: /없는-주소)의 404. 공개 화면과 관리 화면의 루트 레이아웃이 따로라
 * 둘 다에 속하지 않는 주소는 레이아웃이 없다 — 그래서 여기서 공개 화면의 루트 레이아웃과
 * 한국어 404 몸통을 그대로 조립한다(next.config 의 experimental.globalNotFound).
 * 있는 장 안에서 notFound() 로 떨어진 404 는 app/(site)/not-found.tsx 가 그린다.
 */
// 레이아웃을 건너뛰는 자리라 공개 레이아웃의 메타(아이콘·설명·테마 색)를 직접 가져온다.
export const viewport = siteViewport
export const metadata: Metadata = {
  ...siteMetadata,
  title: `페이지를 찾을 수 없습니다 | ${SITE_NAME}`,
}

export default function GlobalNotFound() {
  return (
    <SiteLayout>
      <NotFound />
    </SiteLayout>
  )
}
