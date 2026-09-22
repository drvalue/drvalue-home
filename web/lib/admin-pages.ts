/**
 * 관리 화면의 페이지 글(/api/admin/pages). 칸 구조는 api 가 준다 — 화면은 그 구조로 폼을 그릴 뿐
 * 칸을 따로 적지 않는다. 아래 형은 api 의 core/page/schema/page-schema.ts 와 같은 모양이다.
 */
import { adminFetch, adminJson } from './admin'

interface Base {
  key: string
  label: string
  help?: string
  required?: boolean
}
export type PageField =
  | (Base & { type: 'text' | 'textarea'; max: number; pattern?: string; patternMessage?: string })
  | (Base & { type: 'richtext'; max: number })
  | (Base & { type: 'image' })
  | (Base & { type: 'link' })
  | (Base & { type: 'list'; min?: number; max: number; itemLabel?: string; item: PageField[] })
  | (Base & { type: 'group'; fields: PageField[] })

export type PageSchema = { key: string; label: string; path: string; fields: PageField[] }
export type PageImageValue = { id: string | null; alt: string; width?: number | null; height?: number | null } | null
export type PageLinkValue = { label: string; href: string }
export type PageContent = Record<string, unknown>

export type PageRow = { key: string; label: string; path: string; updated_on: string | null; updated_by: string | null }
export type PageLang = { content: PageContent; updated_on: string | null; updated_by: string | null }
export type PageDetail = { schema: PageSchema; languages: Record<string, PageLang> }

export const listPages = async () => (await adminFetch<{ data: PageRow[] }>('/api/admin/pages')).data
export const getPage = async (key: string) =>
  (await adminFetch<{ data: PageDetail }>(`/api/admin/pages/${encodeURIComponent(key)}`)).data
export const savePage = async (key: string, languages_code: string, content: PageContent) =>
  (await adminJson<{ data: PageLang }>(`/api/admin/pages/${encodeURIComponent(key)}`, 'PUT', { languages_code, content })).data

/** 스키마의 빈 값. 목록에 항목을 더할 때 쓴다(api 의 emptyContent 와 같다). */
export function emptyOf(fields: PageField[]): PageContent {
  const out: PageContent = {}
  for (const f of fields) out[f.key] = emptyValue(f)
  return out
}
function emptyValue(f: PageField): unknown {
  switch (f.type) {
    case 'text':
    case 'textarea':
    case 'richtext':
      return ''
    case 'image':
      return null
    case 'link':
      return { label: '', href: '' }
    case 'list':
      return []
    case 'group':
      return emptyOf(f.fields)
  }
}
