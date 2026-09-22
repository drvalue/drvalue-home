'use client'

import { useEffect, useState } from 'react'

/**
 * 「링크 복사」. 스크립트가 없으면 단추를 안 그린다 — 눌러도 아무 일 없는 단추가
 * 남는 것보다 낫다. 주소는 주소창에 있다.
 */
export default function CopyLink() {
  const [mounted, setMounted] = useState(false)
  const [label, setLabel] = useState('링크 복사')
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return (
    <button
      type="button"
      className="dv_art_copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(location.href)
          setLabel('복사됨')
        } catch {
          setLabel('주소창의 주소를 복사해 주세요')
        }
        setTimeout(() => setLabel('링크 복사'), 2000)
      }}
    >
      {label}
    </button>
  )
}
