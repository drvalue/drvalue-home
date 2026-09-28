import { cache } from 'react'
import type { ApiResponse } from './api-types.gen'

/**
 * 관리 화면 「SEO › 검색엔진 설정」 값(서버 전용) — robots.txt 의 AI 스위치와 머리 정보의 소유 확인 코드.
 *
 * 한 요청 안에서는 React `cache` 로 한 번, 요청 사이에는 fetch 데이터 캐시(60초, 태그 `search-settings`)를 쓴다 —
 * 레이아웃의 머리 정보가 모든 장에서 부르므로 no-store 면 모든 장이 요청마다 api 를 한 번 더 부른다(메뉴·page-meta 와 같은
 * 이유). 저장하면 1분 안에 반영된다. 못 읽으면(api 가 없거나 느리거나 — 빌드 때 포함) null: 부르는 쪽이 예전 동작
 * (AI 둘 다 허용 · 확인 코드는 실행 환경값)으로 간다.
 */

const ORIGIN = process.env.API_ORIGIN || 'http://localhost:3500'

export type SearchSettings = ApiResponse<'GET /api/content/search-settings'>['data']

export const getSearchSettings = cache(async (): Promise<SearchSettings | null> => {
  try {
    const res = await fetch(`${ORIGIN}/api/content/search-settings`, {
      next: { revalidate: 60, tags: ['search-settings'] },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const body = (await res.json()) as Partial<ApiResponse<'GET /api/content/search-settings'>>
    const d = body.data
    return d && typeof d.ai_search_allowed === 'boolean' && typeof d.ai_training_allowed === 'boolean' ? d : null
  } catch {
    return null
  }
})
