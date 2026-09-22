'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

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

// 알리기(mark)와 읽기(dirtyNames)를 나눈다 — 알리는 쪽 함수가 매번 바뀌면 폼의 effect 가 매번 다시 돈다.
const GroupMark = createContext<((name: string, dirty: boolean) => void) | null>(null)
const GroupDirty = createContext<string[]>([])

/**
 * 한 화면에 폼이 여럿일 때(탭마다 저장 버튼이 따로 있는 /admin/home). 폼마다 알린 「저장 안 함」을
 * 모아 하나라도 있으면 위(LeaveGuardProvider)에 알린다. 폼 하나가 false 를 알려도 다른 폼의 입력이
 * 지켜진다. `useLeaveGroupDirty` 로 어느 폼이 저장 안 됐는지(탭 점) 읽는다.
 */
export function LeaveGroup({ children }: { children: React.ReactNode }) {
  // 위의 setDirty 는 useCallback 이라 그대로다(Provider 의 value 객체는 매번 새것이라 통째로 의존하지 않는다).
  const parentSet = useContext(Ctx).setDirty
  const [dirty, setDirtyMap] = useState<Record<string, boolean>>({})
  const mark = useCallback(
    (name: string, d: boolean) =>
      setDirtyMap((m) => {
        if (Boolean(m[name]) === d) return m
        const next = { ...m, [name]: d }
        parentSet(Object.values(next).some(Boolean))
        return next
      }),
    [parentSet],
  )
  useEffect(() => () => parentSet(false), [parentSet])
  const dirtyNames = Object.keys(dirty).filter((k) => dirty[k])
  return (
    <GroupMark.Provider value={mark}>
      <GroupDirty.Provider value={dirtyNames}>{children}</GroupDirty.Provider>
    </GroupMark.Provider>
  )
}

/** LeaveGroup 안의 폼 하나. 안쪽의 useLeaveGuard().setDirty 가 이 이름으로 모인다. */
export function LeaveScope({ name, children }: { name: string; children: React.ReactNode }) {
  const leave = useContext(Ctx).leave
  const mark = useContext(GroupMark)
  const setDirty = useCallback((d: boolean) => mark?.(name, d), [mark, name])
  const value = useMemo(() => ({ setDirty, leave }), [setDirty, leave])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useLeaveGroupDirty = () => useContext(GroupDirty)
