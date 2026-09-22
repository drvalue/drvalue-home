'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

type Kind = 'ok' | 'err'
/** 알림에 붙는 단추 하나(예: 삭제 뒤 「되돌리기」). 누르면 알림이 닫힌다. */
type Action = { label: string; onClick: () => void }
type Item = { id: number; text: string; kind: Kind; action?: Action }
type Toast = (text: string, kind?: Kind, action?: Action) => void

const Ctx = createContext<Toast>(() => {})

/**
 * 저장·삭제·되돌리기 뒤의 짧은 알림. 화면을 옮겨도 남도록 껍데기(AdminShell)에 한 번 건다.
 * 단추가 있는 알림은 오래(10초) 남는다 — 읽고 누를 시간을 준다.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const seq = useRef(0)
  const close = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), [])
  const toast = useCallback<Toast>(
    (text, kind = 'ok', action) => {
      const id = ++seq.current
      setItems((xs) => [...xs.slice(-2), { id, text, kind, action }])
      setTimeout(() => close(id), action ? 10000 : kind === 'err' ? 6000 : 3500)
    },
    [close],
  )
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="dva_layer dva_toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`dva_toast is-${t.kind}`}>
            <span>{t.text}</span>
            {t.action && (
              <button
                type="button"
                className="dva_toast_act"
                onClick={() => {
                  close(t.id)
                  t.action?.onClick()
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
