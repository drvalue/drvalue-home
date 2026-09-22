/**
 * 관리 화면의 페이지 글(/api/admin/pages). 칸 구조는 api 가 준다 — 화면은 그 구조로 폼을 그릴 뿐
 * 칸을 따로 적지 않는다. 아래 형은 api 의 core/page/schema/page-schema.ts 와 같은 모양이다.
 */
import { adminFetch, adminJson } from './admin'
import type * as Api from './api-types.gen'
import type { ApiResponse } from './api-types.gen'
import type { ImageValue, LinkValue, PageField as SchemaField, PageSchema as SchemaOf } from './page-types.gen'

// 칸 구조의 형은 api 의 core/page/schema/page-schema.ts 에서 만든 것(lib/page-types.gen.ts),
// 응답의 형은 api 문서에서 만든 것(lib/api-types.gen.ts). 여기서 옮겨 적지 않는다.
export type PageField = SchemaField
export type PageSchema = SchemaOf
/** 미디어 파일(id) 이거나, 기본 글처럼 사이트에 이미 있는 그림(src — 새로 올리면 id 로 바뀐다). */
export type PageImageValue = ImageValue | null
export type PageLinkValue = LinkValue
/** 폼이 다루는 글 — 칸 구조에 따라 모양이 달라 여기서는 열어 둔다(장마다의 형은 PageContentMap). */
export type PageContent = Record<string, unknown>

export type PageRow = Api.ControllerPageDefaultRowResponseDto
export type PageLang = Api.ControllerPageDefaultLangResponseDto
/** api 문서에는 schema 가 객체로만 적혀 있어 칸 구조의 형으로 좁힌다. */
export type PageDetail = Omit<Api.ControllerPageDefaultDetailResponseDto, 'schema'> & { schema: PageSchema }

export const listPages = async () => (await adminFetch<ApiResponse<'GET /api/admin/pages'>>('/api/admin/pages')).data
export const getPage = async (key: string) =>
  (await adminFetch<{ data: PageDetail }>(`/api/admin/pages/${encodeURIComponent(key)}`)).data
export const savePage = async (key: string, languages_code: Api.ControllerPageDefaultSaveDto['languages_code'], content: PageContent) =>
  (await adminJson<ApiResponse<'PUT /api/admin/pages/{key}'>>(`/api/admin/pages/${encodeURIComponent(key)}`, 'PUT', { languages_code, content })).data

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
    case 'boolean':
      return false
    case 'select':
      return ''
    case 'list':
      return []
    case 'group':
      return emptyOf(f.fields)
  }
}
