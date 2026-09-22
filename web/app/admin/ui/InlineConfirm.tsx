'use client'

import { useEffect, useRef } from 'react'

/**
 * 삭제·되돌리기처럼 되돌리기 어려운 일의 확인. 브라우저 창 대신 그 자리에 뜬다.
 * 열리면 「취소」에 포커스가 간다(실수로 Enter 를 눌러도 안전한 쪽). Escape 도 취소다.
 */
export default function InlineConfirm({
  message,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  message: string
  confirmLabel: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const cancel = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    cancel.current?.focus()
  }, [])
  return (
    <span
      className="dva_confirm"
      role="group"
      aria-label={message}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onCancel()
        }
      }}
    >
      <span>{message}</span>
      <button type="button" className="dva_btn is-small is-danger" disabled={busy} onClick={onConfirm}>
        {confirmLabel}
      </button>
      <button ref={cancel} type="button" className="dva_btn is-small" onClick={onCancel}>
        취소
      </button>
    </span>
  )
}
