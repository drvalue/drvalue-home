'use client'

import { useEffect, useRef } from 'react'
import type Quill from 'quill'
import { uploadFile } from '@/lib/admin'
import 'quill/dist/quill.snow.css'
import './HtmlEditor.css'

/**
 * 본문 편집기(Quill). 값은 HTML 문자열 하나 — 저장은 폼이 한다.
 *
 * 그림은 Quill 기본(base64 내장)을 쓰지 않는다. 파일을 올려 공개 주소
 * (/api/content/assets/<id>)를 넣는다 — 본문에 그림이 박히면 글 한 건이 MB 가 된다.
 * 밖에서 값이 바뀔 때(글 불러오기)만 편집기 내용을 맞춘다. 치는 중에는 손대지
 * 않는다 — 커서가 맨 앞으로 튄다.
 */
export default function HtmlEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const quill = useRef<Quill | null>(null)
  const latest = useRef(onChange)
  latest.current = onChange

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { default: Q } = await import('quill')
      if (!alive || !box.current || quill.current) return
      const q = new Q(box.current, {
        theme: 'snow',
        modules: {
          toolbar: {
            container: [
              [{ header: [2, 3, false] }],
              ['bold', 'italic', 'underline'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              [{ align: [] }],
              ['blockquote', 'link', 'image'],
              ['clean'],
            ],
            handlers: {
              image: () => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/png,image/jpeg,image/webp,image/gif'
                input.onchange = async () => {
                  const file = input.files?.[0]
                  if (!file) return
                  try {
                    const f = await uploadFile(file, file.name.replace(/\.[^.]+$/, ''))
                    const range = q.getSelection(true)
                    q.insertEmbed(range.index, 'image', f.url, 'user')
                    q.setSelection(range.index + 1, 0)
                  } catch (e) {
                    // 폼의 오류 줄이 아니라 편집기 안이라, 여기서는 콘솔에만.
                    console.error('그림 올리기 실패', e)
                  }
                }
                input.click()
              },
            },
          },
        },
      })
      q.clipboard.dangerouslyPasteHTML(value ?? '', 'silent')
      q.on('text-change', () => latest.current(q.root.innerHTML))
      quill.current = q
    })()
    return () => {
      alive = false
    }
    // 처음 한 번만 만든다. value 변화는 아래 effect 가 본다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const q = quill.current
    if (!q) return
    if (q.root.innerHTML !== (value ?? '') && !q.hasFocus()) {
      q.clipboard.dangerouslyPasteHTML(value ?? '', 'silent')
    }
  }, [value])

  return (
    <div className="dva_editor">
      <div ref={box} />
    </div>
  )
}
