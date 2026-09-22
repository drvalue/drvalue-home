import { redirect } from 'next/navigation'

/** 관리 화면의 첫 장은 공지사항 목록이다. */
export default function AdminIndex() {
  redirect('/admin/posts/notice')
}
