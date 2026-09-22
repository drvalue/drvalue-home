'use client'

import { useParams } from 'next/navigation'
import PostForm from '../PostForm'

export default function EditPostPage() {
  const { board, id } = useParams<{ board: string; id: string }>()
  const n = Number(id)
  if (!Number.isInteger(n) || n <= 0) return <div className="dva_error">잘못된 글 번호다: {id}</div>
  return <PostForm boardKey={board} id={n} />
}
