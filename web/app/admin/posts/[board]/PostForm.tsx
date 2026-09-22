'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { adminFetch, adminJson, boardOf, PostFull, today, Translation, uploadFile } from '@/lib/admin'
import HtmlEditor from './HtmlEditor'

type Lang = 'ko-KR' | 'en-US'
const LANGS: { code: Lang; label: string }[] = [
  { code: 'ko-KR', label: '한국어' },
  { code: 'en-US', label: 'English' },
]

function blankTranslation(code: Lang): Translation {
  return { languages_code: code, title: '', summary: '', body: '', case_category_label: '', seo_title: '', seo_description: '' }
}

/** '2025-10-01' ↔ month input 값 '2025-10'. 수행실적 기간은 월까지만 있다. */
const toMonth = (d: string | null) => (d ? d.slice(0, 7) : '')
const fromMonth = (m: string) => (m ? `${m}-01` : null)

/**
 * 만들기와 고치기가 같은 폼. 본문은 편집기(Quill)로 쓰고 HTML 로도 볼 수 있다.
 * 저장 성공이면 목록으로. 오류는 서버 문장을 그대로 위에 띄운다.
 */
export default function PostForm({ boardKey, id }: { boardKey: string; id?: number }) {
  const board = boardOf(boardKey)
  const router = useRouter()
  const [post, setPost] = useState<PostFull | null>(null)
  const [lang, setLang] = useState<Lang>('ko-KR')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // 수행실적 「구분」에 지금까지 쓴 값. 입력하면서 고르게 해 같은 말을 다르게 적지 않는다.
  const [labels, setLabels] = useState<string[]>([])
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!board) return
    if (id === undefined) {
      setPost({
        id: 0, board: board.key, slug: '', status: 'draft', published_date: today(), sort: null,
        is_pinned: false, is_featured: false, thumbnail: null, thumbnail_url: null, press_media: null,
        period_start: null, period_end: null, cert_state: board.key === 'patent' ? 'applied' : null,
        cert_no: null, cert_date: null, cert_made_date: null, cert_kind: null, history_year: null,
        translations: [blankTranslation('ko-KR'), blankTranslation('en-US')], files: [],
      })
      return
    }
    adminFetch<{ data: PostFull }>(`/api/admin/posts/${id}`)
      .then((r) => {
        const p = r.data
        for (const l of LANGS) if (!p.translations.some((t) => t.languages_code === l.code)) p.translations.push(blankTranslation(l.code))
        setPost(p)
        setThumbPreview(p.thumbnail_url)
      })
      .catch((e) => setError((e as Error).message))
  }, [board, id])
  useEffect(() => {
    if (board?.key !== 'case') return
    adminFetch<{ data: string[] }>('/api/admin/posts/category-labels').then((r) => setLabels(r.data)).catch(() => {})
  }, [board])

  if (!board) return <div className="dva_error">없는 게시판이다: {boardKey}</div>
  if (!post) return error ? <div className="dva_error">{error}</div> : <div className="dva_empty">불러오는 중…</div>

  const t = post.translations.find((x) => x.languages_code === lang) ?? blankTranslation(lang)
  const set = (patch: Partial<PostFull>) => setPost({ ...post, ...patch })
  const setT = (patch: Partial<Translation>) =>
    setPost({ ...post, translations: post.translations.map((x) => (x.languages_code === lang ? { ...x, ...patch } : x)) })

  async function onThumb(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      const f = await uploadFile(file, file.name.replace(/\.[^.]+$/, ''))
      set({ thumbnail: f.id })
      setThumbPreview(`/api/admin/files/${f.id}`)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function onFiles(list: FileList | null) {
    if (!list || !list.length) return
    setBusy(true)
    try {
      const added = []
      for (const file of Array.from(list)) {
        const f = await uploadFile(file)
        added.push({ id: f.id, name: f.title || f.filename_download, url: `/api/admin/files/${f.id}` })
      }
      set({ files: [...post!.files, ...added] })
      setError('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!post) return
    setBusy(true)
    setError('')
    const body = {
      board: post.board,
      slug: post.slug || undefined,
      status: post.status,
      published_date: post.published_date,
      is_pinned: post.is_pinned,
      thumbnail: post.thumbnail,
      press_media: post.press_media,
      period_start: post.period_start,
      period_end: post.period_end,
      cert_state: post.cert_state,
      cert_no: post.cert_no,
      cert_date: post.cert_date,
      cert_made_date: post.cert_made_date,
      cert_kind: post.cert_kind,
      history_year: post.history_year,
      translations: post.translations
        // 영어 칸을 하나도 안 채웠으면 보내지 않는다 — 빈 번역 행을 남기지 않는다.
        .filter((x) => x.languages_code === 'ko-KR' || [x.title, x.summary, x.body, x.case_category_label].some((v) => v && v.trim()))
        .map((x) => ({
          languages_code: x.languages_code,
          title: x.title ?? '',
          summary: x.summary ?? '',
          body: x.body ?? '',
          case_category_label: x.case_category_label ?? '',
          seo_title: x.seo_title ?? '',
          seo_description: x.seo_description ?? '',
        })),
      file_ids: post.files.map((f) => f.id),
    }
    try {
      if (id === undefined) await adminJson('/api/admin/posts', 'POST', body)
      else await adminJson(`/api/admin/posts/${id}`, 'PUT', body)
      router.push(`/admin/posts/${board!.key}`)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  const k = board.key
  const val = (v: string | null) => v ?? ''

  return (
    <>
      <div className="dva_head">
        <h1>{board.label} · {id === undefined ? '새 글' : '고치기'}</h1>
        <div className="dva_actions">
          <Link href={`/admin/posts/${k}`} className="dva_btn">목록</Link>
          <button type="button" className="dva_btn is-primary" disabled={busy} onClick={save}>저장</button>
        </div>
      </div>
      {error && <div className="dva_error">{error}</div>}

      <div className="dva_form">
        <div className="dva_card">
          <div className="dva_tabs" role="tablist">
            {LANGS.map((l) => (
              <button key={l.code} type="button" role="tab" aria-selected={lang === l.code} className={`dva_tab${lang === l.code ? ' is-on' : ''}`} onClick={() => setLang(l.code)}>
                {l.label}
              </button>
            ))}
          </div>
          <div className="dva_field">
            <label htmlFor="f-title">제목{lang === 'ko-KR' ? ' (필수)' : ''}</label>
            <input id="f-title" type="text" value={val(t.title)} onChange={(e) => setT({ title: e.target.value })} />
          </div>
          {k === 'case' && (
            <div className="dva_field">
              <label htmlFor="f-cat">구분 (발주·사업 유형)</label>
              <input id="f-cat" type="text" list="f-cat-list" placeholder="예: 안산스마트공장 보급" value={val(t.case_category_label)} onChange={(e) => setT({ case_category_label: e.target.value })} />
              <datalist id="f-cat-list">
                {labels.map((l) => <option key={l} value={l} />)}
              </datalist>
              <small>쓰던 값이 목록에 뜬다. 없으면 그대로 적으면 새 구분이 된다.</small>
            </div>
          )}
          <div className="dva_field">
            <label htmlFor="f-summary">{k === 'history' ? '부연 (한 줄)' : '요약'}</label>
            <textarea id="f-summary" value={val(t.summary)} onChange={(e) => setT({ summary: e.target.value })} />
          </div>
          {(k === 'notice' || k === 'press') && (
            <div className="dva_field">
              <label htmlFor="f-body">본문</label>
              <HtmlEditor value={val(t.body)} onChange={(html) => setT({ body: html })} />
              <details className="dva_editor_raw">
                <summary>HTML 로 보기</summary>
                <textarea id="f-body" className="is-body" value={val(t.body)} onChange={(e) => setT({ body: e.target.value })} />
              </details>
            </div>
          )}
        </div>

        <div className="dva_card">
          <h2>설정</h2>
          <div className="dva_field">
            <label htmlFor="f-status">상태</label>
            <select id="f-status" value={post.status} onChange={(e) => set({ status: e.target.value })}>
              <option value="draft">초안 (사이트에 안 보임)</option>
              <option value="published">공개</option>
            </select>
          </div>
          <div className="dva_field">
            <label htmlFor="f-date">표시 날짜</label>
            <input id="f-date" type="date" value={post.published_date} onChange={(e) => set({ published_date: e.target.value })} />
          </div>
          {(k === 'notice' || k === 'press') && (
            <label className="dva_check">
              <input type="checkbox" checked={post.is_pinned} onChange={(e) => set({ is_pinned: e.target.checked })} /> 상단 고정
            </label>
          )}
          {k === 'press' && (
            <div className="dva_field">
              <label htmlFor="f-media">매체명</label>
              <input id="f-media" type="text" value={val(post.press_media)} onChange={(e) => set({ press_media: e.target.value })} />
            </div>
          )}
          {k === 'patent' && (
            <>
              <div className="dva_field">
                <label htmlFor="f-state">등록 / 출원</label>
                <select id="f-state" value={post.cert_state ?? 'applied'} onChange={(e) => set({ cert_state: e.target.value as 'registered' | 'applied' })}>
                  <option value="registered">등록</option>
                  <option value="applied">출원</option>
                </select>
              </div>
              <div className="dva_field">
                <label htmlFor="f-no">{post.cert_state === 'registered' ? '등록번호' : '출원번호'}</label>
                <input id="f-no" type="text" value={val(post.cert_no)} onChange={(e) => set({ cert_no: e.target.value })} />
              </div>
              <div className="dva_field">
                <label htmlFor="f-cdate">{post.cert_state === 'registered' ? '등록일' : '출원일'}</label>
                <input id="f-cdate" type="date" value={val(post.cert_date)} onChange={(e) => set({ cert_date: e.target.value || null })} />
              </div>
            </>
          )}
          {k === 'copyright' && (
            <>
              <div className="dva_field">
                <label htmlFor="f-kind">저작물 종류 (등록증 그대로)</label>
                <input id="f-kind" type="text" value={val(post.cert_kind)} onChange={(e) => set({ cert_kind: e.target.value })} />
              </div>
              <div className="dva_field">
                <label htmlFor="f-no">등록번호</label>
                <input id="f-no" type="text" value={val(post.cert_no)} onChange={(e) => set({ cert_no: e.target.value })} />
              </div>
              <div className="dva_row2">
                <div className="dva_field">
                  <label htmlFor="f-made">창작일</label>
                  <input id="f-made" type="date" value={val(post.cert_made_date)} onChange={(e) => set({ cert_made_date: e.target.value || null })} />
                </div>
                <div className="dva_field">
                  <label htmlFor="f-cdate">등록일</label>
                  <input id="f-cdate" type="date" value={val(post.cert_date)} onChange={(e) => set({ cert_date: e.target.value || null })} />
                </div>
              </div>
            </>
          )}
          {k === 'case' && (
            <div className="dva_row2">
              <div className="dva_field">
                <label htmlFor="f-ps">시작 (월)</label>
                <input id="f-ps" type="month" value={toMonth(post.period_start)} onChange={(e) => set({ period_start: fromMonth(e.target.value) })} />
              </div>
              <div className="dva_field">
                <label htmlFor="f-pe">종료 (월)</label>
                <input id="f-pe" type="month" value={toMonth(post.period_end)} onChange={(e) => set({ period_end: fromMonth(e.target.value) })} />
              </div>
            </div>
          )}
          {k === 'history' && (
            <div className="dva_field">
              <label htmlFor="f-year">연도</label>
              <input id="f-year" type="text" inputMode="numeric" maxLength={4} placeholder="2025" value={val(post.history_year)} onChange={(e) => set({ history_year: e.target.value })} />
            </div>
          )}
          <div className="dva_field">
            <label htmlFor="f-slug">주소 (slug)</label>
            <small>비우면 자동. 소문자·숫자·하이픈.</small>
            <input id="f-slug" type="text" value={post.slug} onChange={(e) => set({ slug: e.target.value })} />
          </div>

          {k !== 'history' && k !== 'case' && (
            <div className="dva_field">
              <span className="dva_label">{k === 'patent' || k === 'copyright' ? '증서 그림' : '대표 이미지'}</span>
              {thumbPreview && <img className="dva_preview" src={thumbPreview} width={260} height={340} alt="" />}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy} onChange={(e) => onThumb(e.target.files?.[0])} />
              {post.thumbnail && (
                <button type="button" className="dva_btn is-small" onClick={() => { set({ thumbnail: null }); setThumbPreview(null) }}>그림 제거</button>
              )}
            </div>
          )}
          {(k === 'notice' || k === 'press') && (
            <div className="dva_field">
              <span className="dva_label">첨부 파일</span>
              <ul className="dva_files">
                {post.files.map((f) => (
                  <li key={f.id}>
                    <a href={f.url} target="_blank" rel="noreferrer">{f.name}</a>
                    <button type="button" className="dva_btn is-small" onClick={() => set({ files: post.files.filter((x) => x.id !== f.id) })}>제거</button>
                  </li>
                ))}
              </ul>
              <input type="file" multiple disabled={busy} onChange={(e) => onFiles(e.target.files)} />
              <small>png · jpg · webp · gif · pdf · txt, 20MB 까지.</small>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
