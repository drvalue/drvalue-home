'use client'

import { useParams } from 'next/navigation'
import PostForm from '../PostForm'

export default function NewPostPage() {
  const { board } = useParams<{ board: string }>()
  return <PostForm boardKey={board} />
}
