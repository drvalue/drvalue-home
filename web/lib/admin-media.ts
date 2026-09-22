import { adminFetch, adminJson } from '@/lib/admin'
import type * as Api from './api-types.gen'
import type { ApiResponse } from './api-types.gen'

/** /api/admin/files 목록의 한 줄 — 모양은 api 문서의 것. */
export type AdminFile = Api.ControllerAdminFileDefaultResponseDto
export type FilePage = ApiResponse<'GET /api/admin/files'>

export type FileKind = 'image' | 'pdf' | 'video' | 'other'

export function kindOf(type: string | null): FileKind {
  if (!type) return 'other'
  if (type.startsWith('image/')) return 'image'
  if (type === 'application/pdf') return 'pdf'
  if (type.startsWith('video/')) return 'video'
  return 'other'
}

export const KIND_LABEL: Record<FileKind, string> = {
  image: '그림',
  pdf: 'PDF',
  video: '영상',
  other: '기타',
}

/** 올릴 수 있는 형식 — api 의 ALLOWED 와 같다. input accept 에 쓴다. */
export const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,video/mp4,video/webm'

/** 형식별 상한 — api 와 같다. 올리기 전에 먼저 걸러 기다리지 않게 한다. */
export function tooLarge(file: File): boolean {
  const mb = 1024 * 1024
  return file.size > (file.type.startsWith('video/') ? 200 * mb : 20 * mb)
}

export function bytes(n: number | null): string {
  if (n === null || Number.isNaN(n)) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export async function uploadMedia(file: File): Promise<AdminFile> {
  const form = new FormData()
  form.append('file', file)
  const res = await adminFetch<ApiResponse<'POST /api/admin/files'>>('/api/admin/files', { method: 'POST', body: form })
  return res.data
}

export function renameMedia(id: string, title: string) {
  return adminJson<ApiResponse<'PATCH /api/admin/files/{id}'>>(`/api/admin/files/${id}`, 'PATCH', { title })
}

export function deleteMedia(id: string, force: boolean) {
  return adminFetch<ApiResponse<'DELETE /api/admin/files/{id}'>>(`/api/admin/files/${id}${force ? '?force=1' : ''}`, { method: 'DELETE' })
}
