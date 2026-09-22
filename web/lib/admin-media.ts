import { adminFetch, adminJson } from '@/lib/admin'

/** /api/admin/files 목록의 한 줄. */
export type AdminFile = {
  id: string
  title: string | null
  filename_download: string
  type: string | null
  filesize: number | null
  width: number | null
  height: number | null
  created_on: string
  /** 공개 주소 — 게시된 글이 참조해야 열린다. 본문·그림 칸에 넣는 값. */
  url: string
  /** 관리 화면 미리보기 — 참조와 무관하게 열린다. */
  preview_url: string
  /** 대표 이미지 · 공유 이미지 · 첨부로 쓰는 글 수. 본문 안 그림은 세지 않는다. */
  used: number
}

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
  const res = await adminFetch<{ data: AdminFile }>('/api/admin/files', { method: 'POST', body: form })
  return res.data
}

export function renameMedia(id: string, title: string) {
  return adminJson<{ data: AdminFile }>(`/api/admin/files/${id}`, 'PATCH', { title })
}

export function deleteMedia(id: string, force: boolean) {
  return adminFetch<{ ok: true }>(`/api/admin/files/${id}${force ? '?force=1' : ''}`, { method: 'DELETE' })
}
