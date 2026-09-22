'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

type Kind = 'ok' | 'err'
type Item = { id: number; text: string; kind: Kind }
type Toast = (text: string, kind?: Kind) => void

const Ctx = createContext<Toast>(() => {})

/** 저장·삭제·되돌리기 뒤의 짧은 알림. 화면을 옮겨도 남도록 껍데기(AdminShell)에 한 번 건다. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const seq = useRef(0)
  const toast = useCallback<Toast>((text, kind = 'ok') => {
    const id = ++seq.current
    setItems((xs) => [...xs.slice(-2), { id, text, kind }])
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), kind === 'err' ? 6000 : 3500)
  }, [])
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="dva_layer dva_toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`dva_toast is-${t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
