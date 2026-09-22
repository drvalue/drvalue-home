'use client'

import { useId, useState } from 'react'

/**
 * 파일 고르기. 브라우저 기본 「파일 선택」 대신 누르거나 끌어다 놓는 칸 하나.
 * 입력은 화면에서만 감추고(키보드로는 닿는다) 칸 전체가 라벨이다.
 */
export default function FileDrop({
  label,
  hint,
  accept,
  multiple,
  disabled,
  onFiles,
}: {
  label: string
  hint?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
  onFiles: (files: File[]) => void
}) {
  const id = useId()
  const [over, setOver] = useState(false)
  return (
    <label
      htmlFor={id}
      className={`dva_drop${over ? ' is-over' : ''}${disabled ? ' is-disabled' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        if (!disabled && e.dataTransfer.files?.length) onFiles(Array.from(e.dataTransfer.files))
      }}
    >
      <input
        id={id}
        type="file"
        className="dva_sr"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(Array.from(e.target.files))
          e.target.value = ''
        }}
      />
      <b>{label}</b>
      {hint && <small>{hint}</small>}
    </label>
  )
}
