'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

/**
 * 목록의 검색어·거르기·쪽을 주소(?q=&status=&page=)에 둔다. 새로 고침·뒤로 가기·주소 공유에도
 * 같은 목록이 뜬다. 바꿀 때는 기록을 쌓지 않는다(replace) — 뒤로 가기가 글자마다 멈추면 안 된다.
 * useSearchParams 를 쓰므로 AdminShell 이 화면을 Suspense 로 감싼다.
 */
export function useQuery() {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const get = useCallback((k: string) => sp.get(k) ?? '', [sp])
  const set = useCallback(
    (patch: Record<string, string | number | null | undefined>) => {
      const next = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === '' || (k === 'page' && Number(v) === 1)) next.delete(k)
        else next.set(k, String(v))
      }
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [sp, router, pathname],
  )
  return { get, set }
}

export const pageOf = (v: string) => Math.max(1, Number(v) || 1)
