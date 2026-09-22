'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { adminFetch } from '@/lib/admin'
import InlineConfirm from '../ui/InlineConfirm'
import { pageOf, useQuery } from '../ui/query'
import SearchBox from '../ui/SearchBox'
import { useToast } from '../ui/toast'
import {
  ACCEPT,
  AdminFile,
  bytes,
  FilePage,
  deleteMedia,
  KIND_LABEL,
  kindOf,
  renameMedia,
  tooLarge,
  uploadMedia,
} from '@/lib/admin-media'
import './media.css'

type Filter = '' | 'image' | 'pdf' | 'video'
type Job = { name: string; state: 'up' | 'ok' | 'err'; message?: string }

const FILTERS: { key: Filter; label: string }[] = [
  { key: '', label: '전체' },
  { key: 'image', label: '그림' },
  { key: 'pdf', label: 'PDF' },
  { key: 'video', label: '영상' },
]

/**
 * 미디어. 올리기(여러 개 · 끌어다 놓기) · 형식 · 검색 · 이름 · 주소 복사 · 삭제.
 * 글에서 쓰는 파일은 바로 안 지워진다 — 경고를 보고 한 번 더 눌러야 한다.
 * 형식·검색·쪽은 주소에 남는다. 좁은 화면에서는 상세가 목록 아래에 열려서 그리로 내려 준다.
 */
export default function MediaPage() {
  const query = useQuery()
  const filter = query.get('type') as Filter
  const q = query.get('q')
  const page = pageOf(query.get('page'))
  const toast = useToast()
  const [rows, setRows] = useState<FilePage | null>(null)
  const [error, setError] = useState('')
  const [sel, setSel] = useState<AdminFile | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [drag, setDrag] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const detailBox = useRef<HTMLDivElement>(null)

  function open(f: AdminFile) {
    setSel(f)
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 960px)').matches) {
      requestAnimationFrame(() => {
        detailBox.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        detailBox.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
      })
    }
  }

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page) })
    if (filter) qs.set('type', filter)
    if (q) qs.set('q', q)
    try {
      const r = await adminFetch<FilePage>(`/api/admin/files?${qs}`)
      setRows(r)
      setError('')
      // 고른 것이 목록에 있으면 새 값으로 바꿔 둔다(이름·쓰이는 곳이 바뀌었을 수 있다).
      setSel((s) => (s ? (r.data.find((x) => x.id === s.id) ?? s) : s))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [page, filter, q])

  useEffect(() => {
    load()
  }, [load])

  async function upload(files: FileList | File[]) {
    const list = Array.from(files)
    if (list.length === 0) return
    setJobs(list.map((f) => ({ name: f.name, state: 'up' })))
    let ok = 0
    for (const [i, f] of list.entries()) {
      const set = (j: Partial<Job>) => setJobs((js) => js.map((x, k) => (k === i ? { ...x, ...j } : x)))
      if (tooLarge(f)) {
        set({ state: 'err', message: '파일이 너무 큽니다. 그림·PDF 는 20MB, 영상은 200MB 까지 올릴 수 있습니다.' })
        continue
      }
      try {
        await uploadMedia(f)
        ok += 1
        set({ state: 'ok' })
      } catch (e) {
        set({ state: 'err', message: (e as Error).message })
      }
    }
    if (page !== 1) query.set({ page: null })
    else await load()
    if (ok > 0) toast(`${ok}개 파일을 올렸습니다.`)
    if (ok < list.length) toast(`${list.length - ok}개는 올리지 못했습니다. 아래 목록에서 이유를 확인해 주세요.`, 'err')
  }

  const pages = rows ? Math.max(1, Math.ceil(rows.total / rows.pageSize)) : 1

  return (
    <div className="dvm">
      <div className="dva_head">
        <h1>미디어</h1>
        <div className="dva_actions">
          <input
            ref={input}
            id="dvm-upload"
            type="file"
            multiple
            accept={ACCEPT}
            className="dva_sr"
            onChange={(e) => {
              if (e.target.files) upload(e.target.files)
              e.target.value = ''
            }}
          />
          <button type="button" className="dva_btn is-primary" onClick={() => input.current?.click()}>
            파일 올리기
          </button>
        </div>
      </div>

      <div className="dva_tools">
        <div className="dva_tabs" role="tablist" aria-label="형식">
          {FILTERS.map((f) => (
            <button
              key={f.key || 'all'}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={`dva_tab${filter === f.key ? ' is-on' : ''}`}
              onClick={() => query.set({ type: f.key, page: null })}
            >
              {f.label}
            </button>
          ))}
        </div>
        <SearchBox id="dvm-q" value={q} onSearch={(v) => query.set({ q: v, page: null })} placeholder="이름으로 찾기" label="이름으로 찾기" />
      </div>

      {jobs.length > 0 && (
        <ul className="dvm_jobs" aria-live="polite">
          {jobs.map((j, i) => (
            <li key={i} className={`is-${j.state}`}>
              <span>{j.name}</span>
              <b>{j.state === 'up' ? '올리는 중…' : j.state === 'ok' ? '올림' : j.message}</b>
            </li>
          ))}
          <li className="dvm_jobs_close">
            <button type="button" className="dva_btn is-small" onClick={() => setJobs([])}>
              닫기
            </button>
          </li>
        </ul>
      )}
      {error && <div className="dva_error">{error}</div>}

      <div className="dvm_split">
        <div
          className={`dvm_drop${drag ? ' is-drag' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            if (e.dataTransfer.files?.length) upload(e.dataTransfer.files)
          }}
        >
          {drag && <div className="dvm_drop_hint">여기에 놓으면 올라갑니다.</div>}
          {rows && rows.data.length === 0 && (
            <div className="dva_empty">
              <p>{q || filter ? '찾는 파일이 없습니다.' : '아직 올린 파일이 없습니다. 파일을 끌어다 놓거나 「파일 올리기」를 눌러 주세요.'}</p>
              {q || filter ? (
                <button type="button" className="dva_btn" onClick={() => query.set({ q: null, type: null, page: null })}>
                  조건 지우기
                </button>
              ) : (
                <button type="button" className="dva_btn is-primary" onClick={() => input.current?.click()}>
                  파일 올리기
                </button>
              )}
            </div>
          )}
          <ul className="dvm_grid">
            {rows?.data.map((f) => {
              const kind = kindOf(f.type)
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    className={`dvm_card${sel?.id === f.id ? ' is-on' : ''}`}
                    onClick={() => open(f)}
                    aria-label={`${f.title ?? f.filename_download} 열기`}
                  >
                    <span className="dvm_thumb">
                      {kind === 'image' ? (
                        <img src={f.preview_url} width={f.width ?? 160} height={f.height ?? 120} alt="" loading="lazy" />
                      ) : (
                        <span className={`dvm_badge is-${kind}`}>{KIND_LABEL[kind]}</span>
                      )}
                    </span>
                    <span className="dvm_name">{f.title || f.filename_download}</span>
                    <span className="dvm_meta">
                      {KIND_LABEL[kind]} · {bytes(f.filesize)}
                      {f.used > 0 && <em>{f.used}곳에서 씀</em>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="dva_pager">
            <button type="button" className="dva_btn is-small" disabled={page <= 1} onClick={() => query.set({ page: page - 1 })}>
              이전
            </button>
            <span>
              {page} / {pages} · {rows?.total ?? 0}개
            </span>
            <button type="button" className="dva_btn is-small" disabled={page >= pages} onClick={() => query.set({ page: page + 1 })}>
              다음
            </button>
          </div>
        </div>

        {sel && (
          <div ref={detailBox} className="dvm_detail_wrap">
            <Detail key={sel.id} file={sel} onClose={() => setSel(null)} onChanged={load} />
          </div>
        )}
      </div>
    </div>
  )
}

function Detail({ file, onClose, onChanged }: { file: AdminFile; onClose: () => void; onChanged: () => Promise<void> }) {
  const kind = kindOf(file.type)
  const toast = useToast()
  const trigger = useRef<HTMLButtonElement>(null)
  const [title, setTitle] = useState(file.title ?? '')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const publicUrl = typeof window === 'undefined' ? file.url : `${window.location.origin}${file.url}`

  async function save() {
    if (!title.trim()) return
    setBusy(true)
    setErr('')
    try {
      await renameMedia(file.id, title.trim())
      toast('이름을 바꿨습니다.')
      await onChanged()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(publicUrl)
      toast('주소를 복사했습니다.')
    } catch {
      // 클립보드를 못 쓰는 창 — 칸을 골라 둬서 손으로 복사하게 한다.
      const el = document.getElementById('dvm-url') as HTMLInputElement | null
      el?.select()
      setMsg('자동 복사가 막혀 있습니다. 주소 칸을 선택해 두었으니 직접 복사해 주세요.')
    }
  }

  async function remove() {
    setBusy(true)
    setErr('')
    try {
      await deleteMedia(file.id, file.used > 0)
      toast(`「${file.title || file.filename_download}」 파일을 삭제했습니다.`)
      onClose()
      await onChanged()
    } catch (e) {
      setErr((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <aside className="dvm_detail" aria-label="파일 상세">
      <div className="dvm_detail_head">
        <h2 tabIndex={-1}>{file.title || file.filename_download}</h2>
        <button type="button" className="dva_btn is-small" onClick={onClose}>
          닫기
        </button>
      </div>

      <div className="dvm_preview">
        {kind === 'image' && (
          <img src={file.preview_url} width={file.width ?? 320} height={file.height ?? 240} alt={file.title ?? ''} />
        )}
        {kind === 'video' && <video src={file.preview_url} controls preload="metadata" />}
        {(kind === 'pdf' || kind === 'other') && (
          <a href={file.preview_url} target="_blank" rel="noreferrer" className="dva_btn">
            {KIND_LABEL[kind]} 열어 보기
          </a>
        )}
      </div>

      <dl className="dvm_facts">
        <dt>원본 이름</dt>
        <dd>{file.filename_download}</dd>
        <dt>형식 · 크기</dt>
        <dd>
          {file.type} · {bytes(file.filesize)}
          {file.width && file.height ? ` · ${file.width}×${file.height}` : ''}
        </dd>
        <dt>올린 날</dt>
        <dd>{new Date(file.created_on).toLocaleString('ko-KR')}</dd>
        <dt>쓰는 곳</dt>
        <dd>{file.used > 0 ? `글 ${file.used}곳 (대표 이미지·첨부)` : '없음'}</dd>
      </dl>

      <div className="dva_field">
        <label htmlFor="dvm-title">이름</label>
        <div className="dvm_row">
          <input id="dvm-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
          <button type="button" className="dva_btn" disabled={busy || !title.trim() || title === file.title} onClick={save}>
            저장
          </button>
        </div>
      </div>

      <div className="dva_field">
        <label htmlFor="dvm-url">공개 주소</label>
        <div className="dvm_row">
          <input id="dvm-url" type="text" readOnly value={publicUrl} onFocus={(e) => e.target.select()} />
          <button type="button" className="dva_btn" onClick={copy}>
            복사
          </button>
        </div>
        <small>게시된 글에서 쓰는 파일만 사이트에서 열립니다.</small>
      </div>

      {msg && <div className="dva_notice">{msg}</div>}
      {err && <div className="dva_error">{err}</div>}

      <div className="dvm_danger">
        {!confirm ? (
          <button ref={trigger} type="button" className="dva_btn is-danger" onClick={() => setConfirm(true)}>
            삭제
          </button>
        ) : (
          <div className="dvm_confirm">
            <p>
              {file.used > 0
                ? `글 ${file.used}곳에서 쓰는 파일입니다. 삭제하면 그 글의 본문 그림·대표 이미지·첨부에서도 빠집니다. 되돌릴 수 없습니다.`
                : '삭제하면 되돌릴 수 없습니다.'}
            </p>
            <InlineConfirm
              message="이 파일을 삭제할까요?"
              confirmLabel={file.used > 0 ? '그래도 삭제' : '삭제'}
              busy={busy}
              onConfirm={remove}
              onCancel={() => {
                setConfirm(false)
                requestAnimationFrame(() => trigger.current?.focus())
              }}
            />
          </div>
        )}
      </div>
    </aside>
  )
}
