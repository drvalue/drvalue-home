'use client'

import { useEffect, useRef } from 'react'
import type Quill from 'quill'
import { uploadFile } from '@/lib/admin'
import 'quill/dist/quill.snow.css'
import './HtmlEditor.css'

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const PUBLIC = '/api/content/assets/'
const PREVIEW = '/api/admin/files/'
/**
 * 저장되는 본문은 공개 주소를 품고, 편집기 안에서는 관리 미리보기 주소로 보여 준다.
 * 공개 주소는 게시된 글의 그림만 내 준다 — 초안에 넣은 그림이 편집기에서 깨진다.
 */
const toEditor = (html: string) => html.split(PUBLIC).join(PREVIEW)

/**
 * Quill 도구 막대에는 영어 이름(aria-label)만 있거나 이름이 없다. 한국어 이름과 풍선 도움말을 단다 —
 * 화면 낭독기와 마우스를 올린 사람 모두 무엇을 하는 단추인지 안다. 머리 고르기의 「Normal」 같은 글자는 CSS 가 바꾼다.
 */
const TOOL_NAMES: [string, string][] = [
  ['.ql-bold', '굵게'],
  ['.ql-italic', '기울임'],
  ['.ql-underline', '밑줄'],
  ['.ql-list[value="ordered"]', '번호 목록'],
  ['.ql-list[value="bullet"]', '점 목록'],
  ['.ql-blockquote', '인용'],
  ['.ql-link', '링크'],
  ['.ql-image', '그림 넣기'],
  ['.ql-clean', '서식 지우기'],
  ['.ql-header .ql-picker-label', '글자 크기(제목·본문)'],
  ['.ql-align .ql-picker-label', '정렬'],
]
function nameToolbar(root: HTMLElement | null) {
  const bar = root?.querySelector('.ql-toolbar')
  if (!bar) return
  for (const [sel, name] of TOOL_NAMES) {
    bar.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      el.setAttribute('aria-label', name)
      el.setAttribute('title', name)
    })
  }
}
const toStored = (html: string) => html.split(PREVIEW).join(PUBLIC)

/**
 * 본문 편집기(Quill). 값은 HTML 문자열 하나 — 저장은 폼이 한다.
 *
 * 그림은 도구 막대의 그림 버튼 · 붙여넣기 · 끌어다 놓기 셋 다 파일을 올려 주소를 넣는다.
 * Quill 기본(base64 내장)은 쓰지 않는다 — 본문에 그림이 박히면 글 한 건이 MB 가 된다.
 * 다른 곳에서 복사해 온 base64 그림도 붙여넣을 때 뺀다.
 * 밖에서 값이 바뀔 때(글 불러오기)만 편집기 내용을 맞춘다. 치는 중에는 손대지
 * 않는다 — 커서가 맨 앞으로 튄다.
 */
export default function HtmlEditor({
  value,
  onChange,
  onError,
}: {
  value: string
  onChange: (html: string) => void
  /** 그림 올리기 실패. 폼이 오류 줄에 띄운다. */
  onError: (message: string) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const quill = useRef<Quill | null>(null)
  const latest = useRef(onChange)
  latest.current = onChange
  const latestError = useRef(onError)
  latestError.current = onError

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { default: Q } = await import('quill')
      if (!alive || !box.current || quill.current) return
      const Delta = Q.import('delta') as typeof import('quill').Delta

      async function insertImages(q: Quill, index: number, files: File[]) {
        let at = index
        for (const file of files) {
          try {
            const f = await uploadFile(file, file.name.replace(/\.[^.]+$/, ''))
            q.insertEmbed(at, 'image', PREVIEW + f.id, 'user')
            at += 1
            q.setSelection(at, 0)
          } catch (e) {
            latestError.current((e as Error).message)
            return
          }
        }
      }

      const q = new Q(box.current, {
        theme: 'snow',
        modules: {
          // 붙여넣기·끌어다 놓기로 들어온 그림 파일. 기본 처리기는 base64 로 박는다.
          uploader: {
            mimetypes: IMAGE_TYPES,
            handler: (range: { index: number }, files: File[]) => void insertImages(q, range.index, files),
          },
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
                input.accept = IMAGE_TYPES.join(',')
                input.multiple = true
                input.onchange = () => {
                  const files = Array.from(input.files ?? [])
                  if (files.length) void insertImages(q, q.getSelection(true).index, files)
                }
                input.click()
              },
            },
          },
        },
      })
      // 다른 문서에서 복사해 온 base64 그림은 버린다(글 한 건이 MB 가 된다). 파일로 다시 넣게 한다.
      q.clipboard.addMatcher('IMG', (node, delta) =>
        (node as HTMLImageElement).getAttribute('src')?.startsWith('data:') ? new Delta() : delta,
      )
      q.clipboard.dangerouslyPasteHTML(toEditor(value ?? ''), 'silent')
      q.on('text-change', () => latest.current(toStored(q.root.innerHTML)))
      nameToolbar(box.current.parentElement)
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
    if (toStored(q.root.innerHTML) !== (value ?? '') && !q.hasFocus()) {
      q.clipboard.dangerouslyPasteHTML(toEditor(value ?? ''), 'silent')
    }
  }, [value])

  return (
    <div className="dva_editor">
      <div ref={box} />
    </div>
  )
}
