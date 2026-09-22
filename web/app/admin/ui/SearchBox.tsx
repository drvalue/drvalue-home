'use client'

import { useEffect, useRef, useState } from 'react'

/** 치는 동안 0.3초 쉬면 찾는다. Enter 는 바로 찾는다. 주소의 값이 바뀌면(뒤로 가기) 칸도 따라간다. */
export default function SearchBox({
  value,
  onSearch,
  placeholder,
  label,
  id,
}: {
  value: string
  onSearch: (q: string) => void
  placeholder: string
  label: string
  id?: string
}) {
  const [text, setText] = useState(value)
  const last = useRef(value)
  useEffect(() => {
    if (value !== last.current) {
      last.current = value
      setText(value)
    }
  }, [value])
  useEffect(() => {
    const q = text.trim()
    if (q === last.current) return
    const t = setTimeout(() => {
      last.current = q
      onSearch(q)
    }, 300)
    return () => clearTimeout(t)
    // onSearch 는 매 렌더 새로 만들어진다 — 글자가 바뀔 때만 다시 건다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  return (
    <input
      id={id}
      type="search"
      className="dva_search"
      placeholder={placeholder}
      aria-label={label}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const q = text.trim()
          last.current = q
          onSearch(q)
        }
      }}
    />
  )
}
