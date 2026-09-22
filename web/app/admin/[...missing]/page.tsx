import { notFound } from 'next/navigation'

/**
 * /admin 아래의 없는 주소(오래된 링크 · 잘못 친 주소). 전역 404(공개 사이트 껍데기)로 떨어지지 않고
 * 관리 화면 껍데기 안의 404(app/admin/not-found.tsx)로 보낸다 — 메뉴가 그대로 있어 바로 돌아갈 수 있다.
 * 있는 화면이 이 catch-all 보다 먼저 맞는다.
 */
export default function AdminMissing() {
  notFound()
}
