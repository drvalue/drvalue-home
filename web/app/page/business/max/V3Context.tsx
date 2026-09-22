'use client'

import { createContext, useContext, type ReactNode } from 'react'

/**
 * 「v3 꾸밈」 안에 있는지 알려 주는 표시.
 *
 * SolutionShell 은 서버 컴포넌트고 FeatureBlock 은 클라이언트라 prop 을
 * 장마다 손으로 넘겨야 했다 — 13장 × 기능 여럿이면 한 곳을 빠뜨리기 쉽다.
 * 껍데기가 한 번 켜 두면 안쪽이 전부 안다.
 */
const V3 = createContext(false)

export function V3Provider({ children }: { children: ReactNode }) {
  return <V3.Provider value={true}>{children}</V3.Provider>
}

export function useV3() {
  return useContext(V3)
}
