'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

type Guard = {
  /** 폼이 「저장 안 한 입력이 있다」를 알린다. 저장·취소 뒤에는 false 로. */
  setDirty: (dirty: boolean) => void
  /** 떠나는 동작(로그아웃 등)을 막아 두고 확인받은 뒤에 돌린다. */
  leave: (go: () => void) => void
}

const Ctx = createContext<Guard>({ setDirty: () => {}, leave: (go) => go() })

/**
 * 저장하지 않은 입력을 지킨다. 관리 화면 안의 링크를 누르면 브라우저 창 대신 화면 아래
 * 확인 막대를 띄우고, 탭을 닫거나 새로 고칠 때만 브라우저 기본 경고(beforeunload)를 쓴다.
 * 링크 가로채기는 문서의 capture 단계에서 한다 — Next Link 의 이동보다 먼저 돈다.
 */
export function LeaveGuardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const dirty = useRef(false)
  const [pending, setPending] = useState<(() => void) | null>(null)
  const stay = useRef<HTMLButtonElement>(null)

  const setDirty = useCallback((d: boolean) => {
    dirty.current = d
  }, [])
  const leave = useCallback((go: () => void) => {
    if (!dirty.current) return go()
    setPending(() => go)
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!dirty.current || e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin) return
      if (url.pathname === location.pathname && url.search === location.search) return
      e.preventDefault()
      e.stopPropagation()
      setPending(() => () => router.push(url.pathname + url.search + url.hash))
    }
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    document.addEventListener('click', onClick, true)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [router])

  useEffect(() => {
    if (!pending) return
    stay.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPending(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending])

  return (
    <Ctx.Provider value={{ setDirty, leave }}>
      {children}
      {pending && (
        <div className="dva_layer dva_leave" role="alertdialog" aria-labelledby="dva-leave-text">
          <p id="dva-leave-text">저장하지 않은 내용이 있습니다. 이 화면을 나가면 입력한 내용이 사라집니다.</p>
          <div className="dva_leave_btns">
            <button ref={stay} type="button" className="dva_btn" onClick={() => setPending(null)}>
              계속 쓰기
            </button>
            <button
              type="button"
              className="dva_btn is-danger"
              onClick={() => {
                const go = pending
                dirty.current = false
                setPending(null)
                go()
              }}
            >
              저장하지 않고 나가기
            </button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}

export const useLeaveGuard = () => useContext(Ctx)
