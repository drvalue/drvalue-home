'use client'

import { useParams } from 'next/navigation'
import PageEditorView from '../PageEditorView'

/** 페이지 한 장 편집(메인은 /admin/home 이 같은 편집기를 탭에 넣어 연다). */
export default function PageEditor() {
  const { key } = useParams<{ key: string }>()
  return <PageEditorView pageKey={key} />
}
