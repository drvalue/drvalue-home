'use client'

import { useParams } from 'next/navigation'
import PostForm from '../PostForm'

export default function EditPostPage() {
  const { board, id } = useParams<{ board: string; id: string }>()
  const n = Number(id)
  if (!Number.isInteger(n) || n <= 0) return <div className="dva_error">글 번호가 올바르지 않습니다.</div>
  return <PostForm boardKey={board} id={n} />
}
