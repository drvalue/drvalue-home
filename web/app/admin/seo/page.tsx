'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminFetch, adminJson, uploadFile } from '@/lib/admin'
import { when } from '@/lib/admin-extra'
import { MENU_ITEMS } from '@/lib/menu'
import FileDrop from '../ui/FileDrop'
import InlineConfirm from '../ui/InlineConfirm'
import { useLeaveGuard } from '../ui/leave'
import { useQuery } from '../ui/query'
import { useToast } from '../ui/toast'
import './seo.css'

type Lang = 'ko-KR' | 'en-US'
type Override = {
  path: string
  no_index: boolean
  og_image: string | null
  og_image_url: string | null
  updated_on: string | null
  updated_by: string | null
  translations: { languages_code: Lang; title: string | null; description: string | null }[]
}
type Live = { title: string; description: string; image: string | null; robots: string } | 'error' | null

const TITLE_MAX = 60
const DESC_MAX = 160

/**
 * 고칠 수 있는 장 = 사이트 메뉴의 장 + 홈. 게시판 목록 장도 1쪽은 여기서 덮을 수 있다.
 * 글 한 편의 검색 정보는 그 글의 「검색 노출」에서 고친다. 글 작성 안내는 코드가 색인을 막아 둔 장이라 뺀다.
 */
function routes(): { path: string; group: string; name: string; hidden: boolean }[] {
  const out = [{ path: '/', group: '홈', name: '홈', hidden: false }]
  for (const m of MENU_ITEMS) {
    for (const s of m.sub ?? []) out.push({ path: s.l, group: m.title, name: s.t, hidden: Boolean(s.hidden) })
  }
  return out.filter((r, i, all) => all.findIndex((x) => x.path === r.path) === i)
}

/** 지금 사이트가 내는 머리 정보. 같은 출처의 장 HTML 을 읽어 온다(관리 화면은 사이트와 같은 주소에 있다). */
async function readLive(path: string): Promise<Live> {
  try {
    const res = await fetch(path, { cache: 'no-store' })
    if (!res.ok) return 'error'
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
    const meta = (sel: string) => doc.querySelector(sel)?.getAttribute('content') ?? ''
    return {
      title: doc.title,
      description: meta('meta[name="description"]'),
      image: meta('meta[property="og:image"]') || null,
      robots: [...doc.querySelectorAll('meta[name="robots"]')].map((m) => m.getAttribute('content')).join(' · '),
    }
  } catch {
    return 'error'
  }
}

const cut = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…')

export default function SeoPage() {
  const q = useQuery()
  const toast = useToast()
  const { setDirty } = useLeaveGuard()
  const all = useMemo(routes, [])
  const [overrides, setOverrides] = useState<Override[] | null>(null)
  const [error, setError] = useState('')
  const selected = all.find((r) => r.path === q.get('path')) ?? null

  const load = useCallback(async () => {
    try {
      setOverrides((await adminFetch<{ data: Override[] }>('/api/admin/seo/pages')).data)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])
  useEffect(() => () => setDirty(false), [setDirty])

  const byPath = new Map((overrides ?? []).map((o) => [o.path, o]))

  return (
    <>
      <div className="dva_head">
        <h1>SEO</h1>
      </div>
      <p className="dvs_lead">
        사이트 장의 검색 제목·설명·공유 그림을 바꿉니다. 비운 칸은 코드에 적힌 값이 그대로 나갑니다. 저장하면 1분 안에
        사이트에 반영됩니다. 글 한 편의 검색 정보는 그 글의 「검색 노출」에서 바꿉니다.
      </p>
      {error && (
        <div className="dva_error" role="alert">
          {error}
        </div>
      )}
      <div className="dvs_split">
        <ul className="dvs_list" aria-label="장 목록">
          {all.map((r) => {
            const o = byPath.get(r.path)
            return (
              <li key={r.path}>
                <button
                  type="button"
                  className={`dvs_row${selected?.path === r.path ? ' is-on' : ''}`}
                  aria-current={selected?.path === r.path ? 'true' : undefined}
                  onClick={() => q.set({ path: r.path })}
                >
                  <span className="dvs_row_name">
                    {r.group === r.name ? r.name : `${r.group} › ${r.name}`}
                    {r.hidden && <em> (메뉴에서 내림)</em>}
                  </span>
                  <span className="dvs_row_path">{r.path}</span>
                  <span className="dvs_row_tags">
                    {o && <span className="dva_pill is-published">바꿈</span>}
                    {o?.no_index && <span className="dva_pill is-draft">검색 제외</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="dvs_detail">
          {selected ? (
            <Editor
              key={selected.path}
              path={selected.path}
              name={selected.group === selected.name ? selected.name : `${selected.group} › ${selected.name}`}
              override={overrides ? (byPath.get(selected.path) ?? null) : undefined}
              onSaved={async (msg) => {
                toast(msg)
                await load()
              }}
            />
          ) : (
            <div className="dva_empty">왼쪽 목록에서 장을 고르면 지금 나가는 검색 정보와 바꿀 칸이 나옵니다.</div>
          )}
        </div>
      </div>
    </>
  )
}

function Editor({
  path,
  name,
  override,
  onSaved,
}: {
  path: string
  name: string
  /** undefined = 아직 못 읽음 · null = 덮어쓰기 없음 */
  override: Override | null | undefined
  onSaved: (message: string) => Promise<void>
}) {
  const { setDirty } = useLeaveGuard()
  const [live, setLive] = useState<Live>(null)
  const [lang, setLang] = useState<Lang>('ko-KR')
  const [form, setForm] = useState<{
    no_index: boolean
    og_image: string | null
    og_image_url: string | null
    tr: Record<Lang, { title: string; description: string }>
  } | null>(null)
  const [initial, setInitial] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    let alive = true
    readLive(path).then((v) => alive && setLive(v))
    return () => {
      alive = false
    }
  }, [path])

  useEffect(() => {
    if (override === undefined) return
    const tr = (l: Lang) => {
      const x = override?.translations.find((t) => t.languages_code === l)
      return { title: x?.title ?? '', description: x?.description ?? '' }
    }
    const f = {
      no_index: override?.no_index ?? false,
      og_image: override?.og_image ?? null,
      og_image_url: override?.og_image_url ?? null,
      tr: { 'ko-KR': tr('ko-KR'), 'en-US': tr('en-US') },
    }
    setForm(f)
    setInitial(JSON.stringify(f))
  }, [override])

  const dirty = Boolean(form && JSON.stringify(form) !== initial)
  useEffect(() => {
    setDirty(dirty)
  }, [dirty, setDirty])

  if (!form) return <div className="dva_empty">불러오는 중…</div>
  const cur = form.tr[lang]
  const setCur = (patch: Partial<{ title: string; description: string }>) =>
    setForm({ ...form, tr: { ...form.tr, [lang]: { ...cur, ...patch } } })
  const liveOk = live && live !== 'error' ? live : null
  const liveTitle = liveOk?.title.replace(/ \| 디알밸류$/, '') ?? ''
  const previewTitle = `${cur.title.trim() || liveTitle || name} | 디알밸류`
  const previewDesc = cur.description.trim() || liveOk?.description || ''

  async function upload(file: File | undefined) {
    if (!file || !form) return
    try {
      const f = await uploadFile(file, file.name.replace(/\.[^.]+$/, ''))
      setForm({ ...form, og_image: f.id, og_image_url: `/api/admin/files/${f.id}` })
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  async function save() {
    if (!form) return
    setBusy(true)
    setErr('')
    try {
      await adminJson('/api/admin/seo/pages', 'PUT', {
        path,
        no_index: form.no_index,
        og_image: form.og_image,
        translations: (['ko-KR', 'en-US'] as Lang[]).map((l) => ({
          languages_code: l,
          title: form.tr[l].title,
          description: form.tr[l].description,
        })),
      })
      setInitial(JSON.stringify(form))
      setDirty(false)
      await onSaved('저장했습니다. 1분 안에 사이트에 반영됩니다.')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function reset() {
    setBusy(true)
    setErr('')
    try {
      await adminFetch(`/api/admin/seo/pages?path=${encodeURIComponent(path)}`, { method: 'DELETE' })
      setAsking(false)
      setDirty(false)
      await onSaved('코드에 적힌 값으로 되돌렸습니다. 1분 안에 사이트에 반영됩니다.')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dva_card dvs_editor">
      <div className="dvs_editor_head">
        <h2>{name}</h2>
        <a className="dva_btn is-small" href={path} target="_blank" rel="noreferrer">
          사이트에서 보기
        </a>
      </div>
      <p className="dvs_path">{path}</p>
      {override?.updated_on && (
        <p className="dvs_meta">
          마지막 저장 {when(override.updated_on)}
          {override.updated_by ? ` · ${override.updated_by}` : ''}
        </p>
      )}

      <section className="dvs_live" aria-label="지금 사이트에 나가는 값">
        <h3>지금 사이트</h3>
        {live === null ? (
          <p>읽는 중…</p>
        ) : live === 'error' ? (
          <p>장을 읽지 못했습니다. 잠시 후 다시 열어 주세요.</p>
        ) : (
          <dl>
            <dt>제목</dt>
            <dd>{live.title || '없음'}</dd>
            <dt>설명</dt>
            <dd>{live.description || '없음'}</dd>
            <dt>색인</dt>
            <dd>{live.robots.includes('noindex') ? '검색에서 제외됨' : '검색에 나옴'}</dd>
          </dl>
        )}
      </section>

      <div className="dva_serp" aria-label="바꾼 뒤 검색 결과 미리 보기">
        <span className="dva_serp_url">drvalue.co.kr{path === '/' ? '' : ` › ${path.split('/').filter(Boolean).join(' › ')}`}</span>
        <span className="dva_serp_title">{cut(previewTitle, TITLE_MAX + 12)}</span>
        <span className="dva_serp_desc">{previewDesc ? cut(previewDesc, DESC_MAX) : '설명이 비어 있습니다.'}</span>
      </div>

      <div className="dva_tabs" role="tablist" aria-label="언어">
        {(['ko-KR', 'en-US'] as Lang[]).map((l) => (
          <button key={l} type="button" role="tab" aria-selected={lang === l} className={`dva_tab${lang === l ? ' is-on' : ''}`} onClick={() => setLang(l)}>
            {l === 'ko-KR' ? '한국어' : 'English'}
          </button>
        ))}
      </div>
      <div className="dva_field">
        <label htmlFor="s-title">검색 제목</label>
        <input id="s-title" type="text" value={cur.title} placeholder={liveTitle || name} aria-describedby="s-title-hint" onChange={(e) => setCur({ title: e.target.value })} />
        <small id="s-title-hint" className={cur.title.length > TITLE_MAX ? 'dva_counter is-over' : 'dva_counter'}>
          {cur.title.length}/{TITLE_MAX}자 · 비워 두면 코드의 제목. 뒤의 「| 디알밸류」는 자동으로 붙습니다.
        </small>
      </div>
      <div className="dva_field">
        <label htmlFor="s-desc">검색 설명</label>
        <textarea id="s-desc" value={cur.description} placeholder={liveOk?.description || ''} aria-describedby="s-desc-hint" onChange={(e) => setCur({ description: e.target.value })} />
        <small id="s-desc-hint" className={cur.description.length > DESC_MAX ? 'dva_counter is-over' : 'dva_counter'}>
          {cur.description.length}/{DESC_MAX}자 · 비워 두면 코드의 설명. 장에 실제로 적힌 내용을 줄여 쓰는 것이 좋습니다.
        </small>
      </div>
      {lang === 'en-US' && <small className="dva_hint">영어 장은 아직 사이트에 없습니다. 영어 주소가 생기면 이 값이 쓰입니다.</small>}

      <div className="dva_field">
        <span className="dva_label">공유 그림</span>
        {form.og_image_url ? (
          <div className="dva_thumb_row">
            <img className="dva_cover" src={form.og_image_url} width={96} height={72} alt="" />
            <small>메신저·SNS 에 이 장 주소를 붙이면 이 그림이 카드로 나옵니다.</small>
          </div>
        ) : (
          <small>비워 두면 사이트 기본 그림이 나옵니다.</small>
        )}
        <FileDrop label="공유 그림 올리기" hint="1200×630 그림이 가장 잘 맞습니다." accept="image/png,image/jpeg,image/webp" disabled={busy} onFiles={(fs) => upload(fs[0])} />
        {form.og_image && (
          <button type="button" className="dva_btn is-small" onClick={() => setForm({ ...form, og_image: null, og_image_url: null })}>
            기본 그림으로
          </button>
        )}
      </div>

      <label className="dva_check">
        <input type="checkbox" checked={form.no_index} onChange={(e) => setForm({ ...form, no_index: e.target.checked })} /> 검색에서 제외
      </label>
      <small className="dva_hint">사이트에는 그대로 보입니다. 검색 결과와 사이트맵에서만 빠집니다.</small>

      {err && (
        <div className="dva_error" role="alert">
          {err}
        </div>
      )}
      <div className="dvs_actions">
        <button type="button" className="dva_btn is-primary" disabled={busy || !dirty} onClick={save}>
          {busy ? '저장하는 중…' : '저장'}
        </button>
        {override &&
          (asking ? (
            <InlineConfirm
              message="덮어쓴 값을 지우고 코드에 적힌 값으로 되돌릴까요?"
              confirmLabel="되돌리기"
              busy={busy}
              onConfirm={reset}
              onCancel={() => setAsking(false)}
            />
          ) : (
            <button type="button" className="dva_btn" onClick={() => setAsking(true)}>
              기본값으로 되돌리기
            </button>
          ))}
      </div>
    </div>
  )
}
