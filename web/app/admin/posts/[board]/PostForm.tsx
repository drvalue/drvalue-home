'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { AdminError, adminFetch, adminJson, boardOf, EMPLOYMENT_LABEL, PostFull, today, Translation, uploadFile } from '@/lib/admin'
import FileDrop from '../../ui/FileDrop'
import { useLeaveGuard } from '../../ui/leave'
import { useToast } from '../../ui/toast'
import HtmlEditor from './HtmlEditor'
import SeoPanel from './SeoPanel'

type Lang = 'ko-KR' | 'en-US'
const LANGS: { code: Lang; label: string }[] = [
  { code: 'ko-KR', label: '한국어' },
  { code: 'en-US', label: 'English' },
]

function blankTranslation(code: Lang): Translation {
  return { languages_code: code, title: '', summary: '', body: '', case_category_label: '', faq_category: '', seo_title: '', seo_description: '' }
}

/** '2025-10-01' ↔ month input 값 '2025-10'. 수행실적 기간은 월까지만 있다. */
const toMonth = (d: string | null) => (d ? d.slice(0, 7) : '')
const fromMonth = (m: string) => (m ? `${m}-01` : null)

/** ISO ↔ datetime-local 값('2026-09-30T10:00'). 화면은 이 컴퓨터 시간대로 보여 준다. */
function toLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null)

/** 본문 편집기를 쓰는 게시판. 증서·수행실적·연혁은 칸만 있다. */
const WITH_BODY = ['notice', 'press', 'news', 'recruit', 'faq']
/** 첨부를 받는 게시판. */
const WITH_FILES = ['notice', 'press', 'news', 'recruit']
/** 증서 그림을 받는 게시판. 이 그림이 곧 글이라 본문 칸 자리에 둔다. */
const WITH_CERT = ['patent', 'copyright']
/**
 * 목록 썸네일이 본문의 첫 그림인 게시판. 정하는 것은 api 다(저장할 때) — 여기서는 미리 보여 줄 뿐이다.
 */
const THUMB_FROM_BODY = ['notice', 'press', 'news']
const BODY_IMAGE_RE = /\/api\/content\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
/**
 * 사이트에 글 한 장씩 주소가 있는 게시판 — 주소(slug)·표시 날짜·예약이 사이트에서 보인다.
 * 나머지(순서로 세우는 증서·수행실적·FAQ·연혁)는 그 칸들을 「고급 설정」 안에 접어 둔다.
 */
const DATED = ['notice', 'press', 'news', 'recruit']

/**
 * 만들기와 고치기가 같은 폼. 본문은 편집기(Quill)로 쓰고 HTML 로도 볼 수 있다.
 * 저장 막대는 화면 위에 붙어 따라온다. 저장 안 한 입력이 있으면 떠날 때 묻는다.
 * 저장하면 목록으로 가서 「저장했습니다」를 띄운다. 오류는 그 줄로 스크롤하고 포커스를 옮긴다.
 */
export default function PostForm({ boardKey, id }: { boardKey: string; id?: number }) {
  const board = boardOf(boardKey)
  const router = useRouter()
  const toast = useToast()
  const { setDirty } = useLeaveGuard()
  const [post, setPost] = useState<PostFull | null>(null)
  const [lang, setLang] = useState<Lang>('ko-KR')
  const [error, setError] = useState('')
  const [titleError, setTitleError] = useState(false)
  // 저장했더니 api 가 「지워진 파일」이라고 했다 — 첨부 칸(또는 증서 그림 칸)을 짚고, 첨부는 어느 것인지 표시한다.
  const [fileError, setFileError] = useState<'files' | 'thumb' | null>(null)
  const [goneIds, setGoneIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  // 수행실적 「구분」 · FAQ 「분류」에 지금까지 쓴 값. 입력하면서 고르게 해 같은 말을 다르게 적지 않는다.
  const [labels, setLabels] = useState<string[]>([])
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)
  const initial = useRef<string | null>(null)
  const errorBox = useRef<HTMLDivElement>(null)
  const titleInput = useRef<HTMLInputElement>(null)

  function start(p: PostFull) {
    initial.current = JSON.stringify(p)
    setPost(p)
  }

  useEffect(() => {
    if (!board) return
    if (id === undefined) {
      start({
        id: 0, board: board.key, slug: '', status: 'draft', published_date: today(), sort: null,
        is_pinned: false, is_featured: false, thumbnail: null, thumbnail_url: null,
        og_image: null, og_image_url: null, no_index: false, press_media: null,
        period_start: null, period_end: null, cert_state: board.key === 'patent' ? 'applied' : null,
        cert_no: null, cert_date: null, cert_made_date: null, cert_kind: null, history_year: null,
        employment_type: board.key === 'recruit' ? 'fulltime' : null, is_open_ended: false, deadline: null,
        publish_at: null, unpublish_at: null,
        translations: [blankTranslation('ko-KR'), blankTranslation('en-US')], files: [],
      })
      return
    }
    adminFetch<{ data: PostFull }>(`/api/admin/posts/${id}`)
      .then((r) => {
        const p = r.data
        for (const l of LANGS) if (!p.translations.some((t) => t.languages_code === l.code)) p.translations.push(blankTranslation(l.code))
        start(p)
        setThumbPreview(p.thumbnail_url)
      })
      .catch((e) => setError((e as Error).message))
  }, [board, id])
  useEffect(() => {
    const src = board?.key === 'case' ? 'category-labels' : board?.key === 'faq' ? 'faq-categories' : null
    if (!src) return
    adminFetch<{ data: string[] }>(`/api/admin/posts/${src}`).then((r) => setLabels(r.data)).catch(() => {})
  }, [board])

  const dirty = Boolean(post && initial.current !== null && JSON.stringify(post) !== initial.current)
  useEffect(() => {
    setDirty(dirty)
  }, [dirty, setDirty])
  useEffect(() => () => setDirty(false), [setDirty])

  // 오류가 뜨면 그 줄로 스크롤하고 읽히게 포커스를 준다 — 아래를 보고 있어도 놓치지 않게.
  useEffect(() => {
    if (!error) return
    errorBox.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    errorBox.current?.focus({ preventScroll: true })
  }, [error])

  if (!board) return <div className="dva_error">게시판을 찾을 수 없습니다.</div>
  if (!post) return error ? <div className="dva_error">{error}</div> : <div className="dva_empty">불러오는 중…</div>

  const t = post.translations.find((x) => x.languages_code === lang) ?? blankTranslation(lang)
  // 한국어 본문의 첫 그림, 없으면 영어 본문의 첫 그림 — api 가 저장할 때 고르는 순서와 같다.
  const coverId =
    [...post.translations.filter((x) => x.languages_code === 'ko-KR'), ...post.translations.filter((x) => x.languages_code !== 'ko-KR')]
      .map((x) => BODY_IMAGE_RE.exec(x.body ?? '')?.[1])
      .find(Boolean) ?? null
  const set = (patch: Partial<PostFull>) => setPost({ ...post, ...patch })
  const setT = (patch: Partial<Translation>) => {
    if ('title' in patch && lang === 'ko-KR' && patch.title?.trim()) setTitleError(false)
    setPost({ ...post, translations: post.translations.map((x) => (x.languages_code === lang ? { ...x, ...patch } : x)) })
  }

  async function onThumb(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      const f = await uploadFile(file, file.name.replace(/\.[^.]+$/, ''))
      set({ thumbnail: f.id })
      setThumbPreview(`/api/admin/files/${f.id}`)
      setError('')
      if (fileError === 'thumb') setFileError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function onFiles(list: File[]) {
    if (!list.length) return
    setBusy(true)
    try {
      const added = []
      for (const file of list) {
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

  /** 한국어 제목이 비었으면 보내기 전에 막는다 — api 도 막지만 칸을 짚어 주는 것은 여기다. */
  function titleMissing(): boolean {
    const ko = post!.translations.find((x) => x.languages_code === 'ko-KR')
    if (ko?.title?.trim()) return false
    setLang('ko-KR')
    setTitleError(true)
    setError('한국어 제목을 입력해 주세요.')
    requestAnimationFrame(() => titleInput.current?.focus())
    return true
  }

  async function save() {
    if (!post || titleMissing()) return
    setBusy(true)
    setError('')
    const body = {
      board: post.board,
      slug: post.slug || undefined,
      status: post.status,
      published_date: post.published_date,
      is_pinned: post.is_pinned,
      thumbnail: post.thumbnail,
      og_image: post.og_image,
      no_index: post.no_index,
      press_media: post.press_media,
      period_start: post.period_start,
      period_end: post.period_end,
      cert_state: post.cert_state,
      cert_no: post.cert_no,
      cert_date: post.cert_date,
      cert_made_date: post.cert_made_date,
      cert_kind: post.cert_kind,
      history_year: post.history_year,
      employment_type: post.employment_type,
      is_open_ended: post.is_open_ended,
      deadline: post.is_open_ended ? null : post.deadline,
      publish_at: post.publish_at,
      unpublish_at: post.unpublish_at,
      translations: post.translations
        // 영어 칸을 하나도 안 채웠으면 보내지 않는다 — 빈 번역 행을 남기지 않는다.
        .filter(
          (x) =>
            x.languages_code === 'ko-KR' ||
            [x.title, x.summary, x.body, x.case_category_label, x.faq_category, x.seo_title, x.seo_description].some((v) => v && v.trim()),
        )
        .map((x) => ({
          languages_code: x.languages_code,
          title: x.title ?? '',
          summary: x.summary ?? '',
          body: x.body ?? '',
          case_category_label: x.case_category_label ?? '',
          faq_category: x.faq_category ?? '',
          seo_title: x.seo_title ?? '',
          seo_description: x.seo_description ?? '',
        })),
      file_ids: post.files.map((f) => f.id),
    }
    try {
      // 저장하고 그 자리에 남는다(Strapi·Payload·WordPress 와 같다) — 쓰던 곳을 안 잃고 사이트에서 바로 확인한다.
      // 새 글은 저장된 글의 주소로 바꿔 앉는다(다시 저장하면 새 글이 또 생기지 않게). 목록은 머리의 「목록」 단추.
      const saved =
        id === undefined
          ? await adminJson<{ data?: PostFull }>('/api/admin/posts', 'POST', body)
          : await adminJson<{ data?: PostFull }>(`/api/admin/posts/${id}`, 'PUT', body)
      initial.current = JSON.stringify(post)
      setDirty(false)
      const scheduled = post.publish_at && new Date(post.publish_at) > new Date()
      toast(
        scheduled
          ? '저장했습니다. 예약한 시각에 사이트에 나옵니다.'
          : post.status === 'published'
            ? '저장했습니다. 사이트에 반영됐습니다.'
            : '초안으로 저장했습니다. 사이트에는 아직 보이지 않습니다.',
      )
      const newId = saved?.data?.id
      if (id === undefined) {
        router.replace(newId ? `/admin/posts/${board!.key}/${newId}` : `/admin/posts/${board!.key}`)
      } else {
        // api 가 정한 값(주소·대표 그림·고친 날)을 다시 받아 기준을 맞춘다.
        const fresh = await adminFetch<{ data: PostFull }>(`/api/admin/posts/${id}`)
        const p = fresh.data
        for (const l of LANGS) if (!p.translations.some((x) => x.languages_code === l.code)) p.translations.push(blankTranslation(l.code))
        start(p)
        setThumbPreview(p.thumbnail_url)
        setBusy(false)
      }
    } catch (e) {
      const code = e instanceof AdminError ? e.code : null
      if (code === 'ADMIN_POST_NEED_KO') {
        setLang('ko-KR')
        setTitleError(true)
      }
      if (code === 'ADMIN_POST_THUMB_GONE') setFileError('thumb')
      if (code === 'ADMIN_POST_FILE_GONE') {
        setFileError('files')
        // 어느 첨부가 지워졌는지 api 는 안 알려 준다 — 미리보기 주소가 404 인 것을 짚는다.
        const gone = await Promise.all(
          post.files.map((f) =>
            fetch(f.url, { method: 'HEAD', credentials: 'include' })
              .then((r) => (r.status === 404 ? f.id : null))
              .catch(() => null),
          ),
        )
        setGoneIds(gone.filter((x): x is string => x !== null))
      }
      setError((e as Error).message)
      setBusy(false)
    }
  }

  const k = board.key
  const val = (v: string | null) => v ?? ''
  const dated = DATED.includes(k)

  const dateField = (
    <div className="dva_field">
      <label htmlFor="f-date">표시 날짜</label>
      <input id="f-date" type="date" value={post.published_date} onChange={(e) => set({ published_date: e.target.value })} />
      {!dated && <small>사이트에는 나오지 않습니다. 순서가 같을 때 정렬에만 씁니다.</small>}
    </div>
  )
  const scheduleFields = (
    <>
      <div className="dva_field">
        <label htmlFor="f-pub">예약 공개</label>
        <input id="f-pub" type="datetime-local" value={toLocal(post.publish_at)} onChange={(e) => set({ publish_at: fromLocal(e.target.value) })} />
        <small>비워 두면 바로 반영됩니다. 시각을 정하면 상태와 관계없이 그 시각에 사이트에 나옵니다.</small>
      </div>
      <div className="dva_field">
        <label htmlFor="f-unpub">자동 내림</label>
        <input id="f-unpub" type="datetime-local" value={toLocal(post.unpublish_at)} onChange={(e) => set({ unpublish_at: fromLocal(e.target.value) })} />
        <small>비워 두면 계속 보입니다. 시각을 정하면 그 시각에 초안으로 돌아갑니다.</small>
      </div>
    </>
  )
  const slugField = (
    <div className="dva_field">
      <label htmlFor="f-slug">주소 (slug)</label>
      <input id="f-slug" type="text" value={post.slug} onChange={(e) => set({ slug: e.target.value })} aria-describedby="f-slug-hint" />
      <small id="f-slug-hint">비워 두면 자동으로 정합니다. 영문 소문자·숫자·하이픈(-)만 쓸 수 있습니다.</small>
    </div>
  )

  return (
    <>
      <div className="dva_head is-sticky">
        <h1>
          {board.label} · {id === undefined ? '새 글' : '수정'}
        </h1>
        <div className="dva_actions">
          {dirty && <span className="dva_dirty">저장하지 않은 변경이 있습니다</span>}
          {id !== undefined && dated && post.status === 'published' && post.slug && (
            <a className="dva_btn" href={`/page/support/${k}/${encodeURIComponent(post.slug)}`} target="_blank" rel="noreferrer">
              사이트에서 보기
            </a>
          )}
          <Link href={`/admin/posts/${k}`} className="dva_btn">
            목록
          </Link>
          <button type="button" className="dva_btn is-primary" disabled={busy} onClick={save}>
            {busy ? '저장하는 중…' : '저장'}
          </button>
        </div>
      </div>
      {error && (
        <div ref={errorBox} className="dva_error" role="alert" tabIndex={-1}>
          {error}
        </div>
      )}

      <div className="dva_form">
        <div className="dva_card">
          <div className="dva_tabs" role="tablist" aria-label="언어">
            {LANGS.map((l) => (
              <button key={l.code} type="button" role="tab" aria-selected={lang === l.code} className={`dva_tab${lang === l.code ? ' is-on' : ''}`} onClick={() => setLang(l.code)}>
                {l.label}
              </button>
            ))}
          </div>
          <div className="dva_field">
            <label htmlFor="f-title">
              {k === 'faq' ? '질문' : '제목'}
              {lang === 'ko-KR' ? ' (필수)' : ''}
            </label>
            <input
              ref={titleInput}
              id="f-title"
              type="text"
              value={val(t.title)}
              aria-invalid={titleError && lang === 'ko-KR' ? true : undefined}
              aria-describedby={titleError && lang === 'ko-KR' ? 'f-title-err' : undefined}
              className={titleError && lang === 'ko-KR' ? 'is-invalid' : undefined}
              onChange={(e) => setT({ title: e.target.value })}
            />
            {titleError && lang === 'ko-KR' && (
              <small id="f-title-err" className="dva_field_err">
                한국어 제목을 입력해 주세요.
              </small>
            )}
          </div>
          {k === 'case' && (
            <div className="dva_field">
              <label htmlFor="f-cat">구분 (발주·사업 유형)</label>
              <input id="f-cat" type="text" list="f-cat-list" placeholder="예: 안산스마트공장 보급" value={val(t.case_category_label)} onChange={(e) => setT({ case_category_label: e.target.value })} />
              <datalist id="f-cat-list">
                {labels.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
              <small>전에 쓴 구분이 목록에 나옵니다. 목록에 없으면 새로 적으면 됩니다.</small>
            </div>
          )}
          {k === 'faq' && (
            <div className="dva_field">
              <label htmlFor="f-faqcat">분류</label>
              <input id="f-faqcat" type="text" list="f-faqcat-list" placeholder="예: 도입·견적" value={val(t.faq_category)} onChange={(e) => setT({ faq_category: e.target.value })} />
              <datalist id="f-faqcat-list">
                {labels.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
              <small>전에 쓴 분류가 목록에 나옵니다. 목록에 없으면 새로 적으면 됩니다.</small>
            </div>
          )}
          {k !== 'faq' && (
            <div className="dva_field">
              <label htmlFor="f-summary">{k === 'history' ? '부연 (한 줄)' : '요약'}</label>
              <textarea id="f-summary" value={val(t.summary)} onChange={(e) => setT({ summary: e.target.value })} />
            </div>
          )}

          {k === 'history' && (
            <div className="dva_field">
              <label htmlFor="f-year">연도</label>
              <input id="f-year" type="text" inputMode="numeric" maxLength={4} placeholder="2025" value={val(post.history_year)} onChange={(e) => set({ history_year: e.target.value })} />
              <small>사이트는 연도별로 묶어 최근 연도부터 보여 줍니다.</small>
            </div>
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
          {k === 'patent' && (
            <>
              <div className="dva_field">
                <label htmlFor="f-state">등록 / 출원</label>
                <select id="f-state" value={post.cert_state ?? 'applied'} onChange={(e) => set({ cert_state: e.target.value as 'registered' | 'applied' })}>
                  <option value="registered">등록</option>
                  <option value="applied">출원</option>
                </select>
              </div>
              <div className="dva_row2">
                <div className="dva_field">
                  <label htmlFor="f-no">{post.cert_state === 'registered' ? '등록번호' : '출원번호'}</label>
                  <input id="f-no" type="text" value={val(post.cert_no)} onChange={(e) => set({ cert_no: e.target.value })} />
                </div>
                <div className="dva_field">
                  <label htmlFor="f-cdate">{post.cert_state === 'registered' ? '등록일' : '출원일'}</label>
                  <input id="f-cdate" type="date" value={val(post.cert_date)} onChange={(e) => set({ cert_date: e.target.value || null })} />
                </div>
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
          {WITH_CERT.includes(k) && (
            <div className={`dva_field${fileError === 'thumb' ? ' is-invalid' : ''}`}>
              <span className="dva_label">증서 그림</span>
              {fileError === 'thumb' && (
                <small className="dva_field_err" role="status">
                  그림 파일이 지워졌습니다. 그림을 다시 올려 주세요.
                </small>
              )}
              {thumbPreview && <img className="dva_preview" src={thumbPreview} width={260} height={340} alt="" />}
              <FileDrop
                label={post.thumbnail ? '다른 그림으로 바꾸기' : '증서 그림 올리기'}
                hint="누르거나 끌어다 놓으세요. 그림(png·jpg·webp·gif) 20MB 까지."
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={busy}
                onFiles={(fs) => onThumb(fs[0])}
              />
              {post.thumbnail && (
                <button
                  type="button"
                  className="dva_btn is-small"
                  onClick={() => {
                    set({ thumbnail: null })
                    setThumbPreview(null)
                    if (fileError === 'thumb') setFileError(null)
                  }}
                >
                  그림 빼기
                </button>
              )}
              <small>사이트 목록에 이 그림이 나옵니다.</small>
            </div>
          )}
          {WITH_BODY.includes(k) && (
            <div className="dva_field">
              <label htmlFor="f-body">{k === 'faq' ? '답' : '본문'}</label>
              <HtmlEditor value={val(t.body)} onChange={(html) => setT({ body: html })} onError={setError} />
              <small>그림은 도구 막대의 그림 버튼을 누르거나, 본문에 붙여넣거나 끌어다 놓으면 들어갑니다.</small>
              <details className="dva_editor_raw">
                <summary>HTML 로 보기</summary>
                <textarea id="f-body" className="is-body" value={val(t.body)} onChange={(e) => setT({ body: e.target.value })} />
              </details>
            </div>
          )}
          {THUMB_FROM_BODY.includes(k) && (
            <div className="dva_field dva_thumb_hint">
              <span className="dva_label">목록 썸네일</span>
              {coverId ? (
                <div className="dva_thumb_row">
                  <img className="dva_cover" src={`/api/admin/files/${coverId}`} width={96} height={72} alt="" />
                  <small>본문의 첫 그림이 사이트 목록의 썸네일로 쓰입니다.</small>
                </div>
              ) : (
                <small>본문에 그림을 넣으면 첫 그림이 사이트 목록의 썸네일이 됩니다.</small>
              )}
            </div>
          )}
          {WITH_FILES.includes(k) && (
            <div className={`dva_field${fileError === 'files' ? ' is-invalid' : ''}`}>
              <span className="dva_label">첨부 파일</span>
              {fileError === 'files' && (
                <small className="dva_field_err" role="status">
                  {goneIds.length > 0
                    ? `지워진 첨부 ${goneIds.length}개를 빼고 다시 저장해 주세요.`
                    : '첨부 파일 중 지워진 것이 있습니다. 첨부 목록을 확인해 주세요.'}
                </small>
              )}
              {post.files.length > 0 && (
                <ul className="dva_files">
                  {post.files.map((f) => {
                    const gone = goneIds.includes(f.id)
                    return (
                      <li key={f.id} className={gone ? 'is-gone' : undefined}>
                        {gone ? (
                          <span>
                            {f.name} <span className="dva_pill is-gone">지워진 파일</span>
                          </span>
                        ) : (
                          <a href={f.url} target="_blank" rel="noreferrer">
                            {f.name}
                          </a>
                        )}
                        <button
                          type="button"
                          className="dva_btn is-small"
                          onClick={() => {
                            const rest = post.files.filter((x) => x.id !== f.id)
                            set({ files: rest })
                            const left = goneIds.filter((x) => x !== f.id)
                            setGoneIds(left)
                            if (left.length === 0 && fileError === 'files') setFileError(null)
                          }}
                        >
                          빼기
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
              <FileDrop label="첨부 파일 올리기" hint="누르거나 끌어다 놓으세요. 그림·PDF·텍스트 파일을 20MB 까지 올릴 수 있습니다." multiple disabled={busy} onFiles={onFiles} />
              <small>글 아래에 내려받기로 붙습니다.</small>
            </div>
          )}
        </div>

        <div className="dva_aside">
        <div className="dva_card">
          <h2>설정</h2>
          <div className="dva_field">
            <label htmlFor="f-status">상태</label>
            <select id="f-status" value={post.status} onChange={(e) => set({ status: e.target.value })}>
              <option value="draft">초안 (사이트에 안 보임)</option>
              <option value="published">공개</option>
            </select>
          </div>
          {dated && dateField}
          {dated && scheduleFields}
          {(k === 'notice' || k === 'press' || k === 'news') && (
            <label className="dva_check">
              <input type="checkbox" checked={post.is_pinned} onChange={(e) => set({ is_pinned: e.target.checked })} /> 상단 고정
            </label>
          )}
          {k === 'recruit' && (
            <>
              <div className="dva_field">
                <label htmlFor="f-emp">고용 형태</label>
                <select id="f-emp" value={post.employment_type ?? 'fulltime'} onChange={(e) => set({ employment_type: e.target.value })}>
                  {Object.entries(EMPLOYMENT_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <label className="dva_check">
                <input type="checkbox" checked={post.is_open_ended} onChange={(e) => set({ is_open_ended: e.target.checked })} /> 상시 채용
              </label>
              <div className="dva_field">
                <label htmlFor="f-deadline">마감일</label>
                <input id="f-deadline" type="date" disabled={post.is_open_ended} value={post.is_open_ended ? '' : val(post.deadline)} onChange={(e) => set({ deadline: e.target.value || null })} />
                {post.is_open_ended && <small>상시 채용이라 마감일이 없습니다.</small>}
              </div>
            </>
          )}
          {(k === 'press' || k === 'news') && (
            <div className="dva_field">
              <label htmlFor="f-media">매체명</label>
              <input id="f-media" type="text" value={val(post.press_media)} onChange={(e) => set({ press_media: e.target.value })} />
            </div>
          )}
          {dated ? (
            slugField
          ) : (
            <details className="dva_more">
              <summary>고급 설정</summary>
              <div className="dva_more_body">
                {dateField}
                {scheduleFields}
                {slugField}
              </div>
            </details>
          )}
        </div>
        {dated && <SeoPanel post={post} t={t} setT={setT} set={set} busy={busy} onError={setError} />}
        </div>
      </div>
    </>
  )
}
