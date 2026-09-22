'use client'

import { createContext, useContext } from 'react'
import type { AdminMe } from '@/lib/admin'

type MeState = {
  me: AdminMe
  /** 「접수」 상태 문의 수. hr 은 문의를 못 보므로 null. */
  newInquiries: number | null
  /** 문의 상태를 바꾼 화면이 배지를 바로 맞춘다. */
  refreshCounts: () => void
}

export const MeContext = createContext<MeState | null>(null)

/** AdminShell 안에서만 쓴다 — 껍데기가 /me 를 받은 뒤에 화면을 그린다. */
export function useMe(): MeState {
  const v = useContext(MeContext)
  if (!v) throw new Error('useMe must be used inside AdminShell')
  return v
}
