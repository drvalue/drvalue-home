'use client'

import { useEffect, useRef, useState } from 'react'
import { uploadFile } from '@/lib/admin'
import {
  type Banner,
  emptyBannerText,
  emptyPopupText,
  fromLocal,
  type Lang,
  LIVE_LABEL,
  type LiveState,
  listBanners,
  listPopups,
  newBanner,
  newPopup,
  type Popup,
  saveBanners,
  savePopups,
  textFor,
  toLocal,
} from '@/lib/admin-home'
import PageEditorView from '../pages/PageEditorView'
import HtmlEditor from '../posts/[board]/HtmlEditor'
import FileDrop from '../ui/FileDrop'
import InlineConfirm from '../ui/InlineConfirm'
import { LeaveGroup, LeaveScope, useLeaveGroupDirty, useLeaveGuard } from '../ui/leave'
import { useQuery } from '../ui/query'
import { useToast } from '../ui/toast'
import './home.css'

type Tab = 'copy' | 'banners' | 'popups'
const TABS: { key: Tab; label: string }[] = [
  { key: 'copy', label: '문구 · 구역 차례' },
  { key: 'banners', label: '배너' },
  { key: 'popups', label: '팝업' },
]
const LANGS = [
  { code: 'ko-KR', label: '한국어' },
  { code: 'en-US', label: 'English' },
] as const
const IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/gif'

/** 서버 state 와 같은 규칙(api 의 liveState). 저장 전 항목의 배지를 그린다. */
function stateOf(x: { visible: boolean; starts_at: string | null; ends_at: string | null }): LiveState {
  const now = Date.now()
  if (!x.visible) return 'off'
  if (x.starts_at && new Date(x.starts_at).getTime() > now) return 'scheduled'
  if (x.ends_at && new Date(x.ends_at).getTime() <= now) return 'ended'
  return 'live'
}

function moved<T>(xs: T[], i: number, d: -1 | 1): T[] {
  const j = i + d
  if (j < 0 || j >= xs.length) return xs
  const out = [...xs]
  ;[out[i], out[j]] = [out[j], out[i]]
  return out
}

/**
 * 메인 화면(/) — 문구·구역 차례(페이지 글 엔진 'home'), 기간 배너, 팝업. 탭마다 저장이 따로다.
 * 세 탭을 다 그려 두고 안 보이는 탭은 숨긴다 — 탭을 옮겨도 쓰던 글이 안 사라진다. 저장 안 한 탭에는 점.
 */
export default function AdminHomePage() {
  return (
    <LeaveGroup>
      <HomeTabs />
    </LeaveGroup>
  )
}

function HomeTabs() {
  const q = useQuery()
  const tab = (TABS.some((t) => t.key === q.get('tab')) ? q.get('tab') : 'copy') as Tab
  const dirty = useLeaveGroupDirty()
  return (
    <>
      <div className="dva_head">
        <h1>메인 화면</h1>
        <div className="dva_actions">
          <a href="/" target="_blank" rel="noreferrer" className="dva_btn">
            사이트에서 보기
          </a>
        </div>
      </div>
      <div className="dva_tabs dvhm_tabs" role="tablist" aria-label="메인 화면 설정">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`dvhm-tab-${t.key}`}
            aria-controls={`dvhm-panel-${t.key}`}
            aria-selected={tab === t.key}
            className={`dva_tab${tab === t.key ? ' is-on' : ''}`}
            onClick={() => q.set({ tab: t.key === 'copy' ? null : t.key })}
          >
            {t.label}
            {dirty.includes(t.key) && <span className="dvp_tab_dot" aria-label="저장하지 않음"> ●</span>}
          </button>
        ))}
      </div>
      <section id="dvhm-panel-copy" role="tabpanel" aria-labelledby="dvhm-tab-copy" hidden={tab !== 'copy'}>
        <LeaveScope name="copy">
          <PageEditorView pageKey="home" embedded />
        </LeaveScope>
      </section>
      <section id="dvhm-panel-banners" role="tabpanel" aria-labelledby="dvhm-tab-banners" hidden={tab !== 'banners'}>
        <LeaveScope name="banners">
          <BannersPanel />
        </LeaveScope>
      </section>
      <section id="dvhm-panel-popups" role="tabpanel" aria-labelledby="dvhm-tab-popups" hidden={tab !== 'popups'}>
        <LeaveScope name="popups">
          <PopupsPanel />
        </LeaveScope>
      </section>
    </>
  )
}

/** 목록 편집의 공통 — 불러오기 · 저장 안 함 · 오류 칸으로 옮기기 · 저장. */
function useListEditor<T>(load: () => Promise<T[]>, save: (items: T[]) => Promise<T[]>, saved: string) {
  const [items, setItems] = useState<T[] | null>(null)
  const snapshot = useRef('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const errorBox = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const { setDirty } = useLeaveGuard()

  useEffect(() => {
    load()
      .then((xs) => {
        snapshot.current = JSON.stringify(xs)
        setItems(xs)
      })
      .catch((e) => setError((e as Error).message))
  }, [load])
  const dirty = items !== null && JSON.stringify(items) !== snapshot.current
  useEffect(() => setDirty(dirty), [dirty, setDirty])
  useEffect(() => {
    if (!error) return
    errorBox.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    errorBox.current?.focus({ preventScroll: true })
  }, [error])

  async function submit(check: (xs: T[]) => string) {
    if (!items) return
    const problem = check(items)
    if (problem) return setError(problem)
    setBusy(true)
    setError('')
    try {
      const next = await save(items)
      snapshot.current = JSON.stringify(next)
      setItems(next)
      toast(saved)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return { items, setItems, error, setError, busy, dirty, errorBox, submit }
}

/** 한 언어의 글 칸을 고친다(없으면 만든다). */
function withText<X extends { languages_code: Lang }>(rows: X[], lang: Lang, empty: (l: Lang) => X, patch: Partial<X>): X[] {
  const has = rows.some((t) => t.languages_code === lang)
  return has ? rows.map((t) => (t.languages_code === lang ? { ...t, ...patch } : t)) : [...rows, { ...empty(lang), ...patch }]
}

function ImagePick({
  id,
  image,
  onChange,
  onError,
  required,
}: {
  id: string
  image: Banner['image']
  onChange: (img: Banner['image']) => void
  onError: (m: string) => void
  required?: boolean
}) {
  const [busy, setBusy] = useState(false)
  async function onFiles(files: File[]) {
    const f = files[0]
    if (!f) return
    setBusy(true)
    try {
      const up = await uploadFile(f, f.name.replace(/\.[^.]+$/, ''))
      onChange({ id: up.id, url: `/api/admin/files/${up.id}`, width: up.width, height: up.height })
    } catch (e) {
      onError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="dva_field" id={id}>
      <span className="dva_label">
        그림{required && <span className="dvp_req"> (필수)</span>}
      </span>
      {image && (
        <div className="dvhm_image">
          <img src={image.url} alt="" width={image.width ?? 240} height={image.height ?? 135} />
          <button type="button" className="dva_btn is-small" onClick={() => onChange(null)}>
            그림 빼기
          </button>
        </div>
      )}
      <FileDrop label={image ? '다른 그림으로 바꾸기' : '그림 올리기'} hint="png · jpg · webp · gif, 20MB 까지" accept={IMAGE_TYPES} disabled={busy} onFiles={onFiles} />
    </div>
  )
}

function Period({ id, item, onChange }: { id: string; item: { starts_at: string | null; ends_at: string | null }; onChange: (p: { starts_at?: string | null; ends_at?: string | null }) => void }) {
  return (
    <div className="dva_row2">
      <div className="dva_field">
        <label htmlFor={`${id}-start`}>시작</label>
        <input id={`${id}-start`} type="datetime-local" value={toLocal(item.starts_at)} onChange={(e) => onChange({ starts_at: fromLocal(e.target.value) })} />
        <small>비워 두면 저장하자마자 나옵니다.</small>
      </div>
      <div className="dva_field">
        <label htmlFor={`${id}-end`}>끝</label>
        <input id={`${id}-end`} type="datetime-local" value={toLocal(item.ends_at)} onChange={(e) => onChange({ ends_at: fromLocal(e.target.value) })} />
        <small>비워 두면 끌 때까지 나옵니다.</small>
      </div>
    </div>
  )
}

function LangTabs({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="dva_tabs dvhm_lang" role="tablist" aria-label="글 언어">
      {LANGS.map((l) => (
        <button key={l.code} type="button" role="tab" aria-selected={lang === l.code} className={`dva_tab${lang === l.code ? ' is-on' : ''}`} onClick={() => onChange(l.code)}>
          {l.label}
        </button>
      ))}
    </div>
  )
}

function ItemHead({
  name,
  index,
  count,
  state,
  onMove,
  asking,
  setAsking,
  onRemove,
}: {
  name: string
  index: number
  count: number
  state: LiveState
  onMove: (d: -1 | 1) => void
  asking: boolean
  setAsking: (on: boolean) => void
  onRemove: () => void
}) {
  return (
    <div className="dvp_item_head">
      <b>
        {name} {index + 1} <span className={`dva_pill dvhm_state is-${state}`}>{LIVE_LABEL[state]}</span>
      </b>
      <div className="dvp_item_btns">
        <button type="button" className="dva_btn is-small" disabled={index === 0} aria-label={`${name} ${index + 1} 위로`} onClick={() => onMove(-1)}>
          ↑
        </button>
        <button type="button" className="dva_btn is-small" disabled={index === count - 1} aria-label={`${name} ${index + 1} 아래로`} onClick={() => onMove(1)}>
          ↓
        </button>
        {asking ? (
          <InlineConfirm message={`${name} ${index + 1}을 목록에서 뺄까요? 저장해야 사이트에 반영됩니다.`} confirmLabel="삭제" onConfirm={onRemove} onCancel={() => setAsking(false)} />
        ) : (
          <button type="button" className="dva_btn is-small is-danger" onClick={() => setAsking(true)}>
            삭제
          </button>
        )}
      </div>
    </div>
  )
}

function BannersPanel() {
  const ed = useListEditor<Banner>(listBanners, saveBanners, '배너를 저장했습니다. 사이트에 바로 반영됩니다.')
  const [lang, setLang] = useState<Lang>('ko-KR')
  const [asking, setAsking] = useState<number | null>(null)
  const { items, setItems } = ed
  if (!items) return ed.error ? <div className="dva_error" role="alert">{ed.error}</div> : <div className="dva_empty">불러오는 중…</div>

  const patch = (i: number, p: Partial<Banner>) => setItems(items.map((x, j) => (j === i ? { ...x, ...p } : x)))
  const check = (xs: Banner[]) => {
    const i = xs.findIndex((x) => !x.image)
    if (i >= 0) {
      document.getElementById(`dvhm-b${i}-img`)?.scrollIntoView({ block: 'center' })
      return `배너 ${i + 1}에 그림을 넣어 주세요.`
    }
    const k = xs.findIndex((x) => x.starts_at && x.ends_at && new Date(x.ends_at) <= new Date(x.starts_at))
    return k >= 0 ? `배너 ${k + 1}의 끝나는 때는 시작하는 때보다 뒤여야 합니다.` : ''
  }

  return (
    <>
      <div className="dva_head is-sticky dvhm_bar">
        <h2 className="dvp_embedded_title">배너</h2>
        <div className="dva_actions">
          {ed.dirty && <span className="dva_dirty">저장하지 않은 변경이 있습니다</span>}
          <button type="button" className="dva_btn is-primary" disabled={ed.busy} onClick={() => ed.submit(check)}>
            {ed.busy ? '저장하는 중…' : '저장'}
          </button>
        </div>
      </div>
      {ed.error && (
        <div ref={ed.errorBox} className="dva_error" role="alert" tabIndex={-1}>
          {ed.error}
        </div>
      )}
      <div className="dva_card">
        <p className="dvhm_note">
          배너는 메인 머리 그림의 사진을 기간 동안 바꿉니다. 진행 중인 배너 가운데 <b>맨 위 하나</b>만 나옵니다(돌아가는 슬라이드는 없습니다).
          제목·설명·링크를 비워 두면 「문구」 탭의 머리 그림 글이 그대로 나옵니다.
        </p>
        <LangTabs lang={lang} onChange={setLang} />
        {items.length === 0 && <div className="dva_empty">배너가 없습니다. 머리 그림에는 기본 사진이 나옵니다.</div>}
        <ol className="dvp_items">
          {items.map((b, i) => {
            const t = textFor(b.translations, lang, emptyBannerText)
            const setT = (p: Partial<Banner['translations'][number]>) => patch(i, { translations: withText(b.translations, lang, emptyBannerText, p) })
            const id = `dvhm-b${i}`
            return (
              <li key={b.id ?? `new-${i}`} className="dvp_item">
                <ItemHead
                  name="배너"
                  index={i}
                  count={items.length}
                  state={stateOf(b)}
                  onMove={(d) => setItems(moved(items, i, d))}
                  asking={asking === i}
                  setAsking={(on) => setAsking(on ? i : null)}
                  onRemove={() => {
                    setItems(items.filter((_, j) => j !== i))
                    setAsking(null)
                  }}
                />
                <label className="dva_check">
                  <input type="checkbox" checked={b.visible} onChange={(e) => patch(i, { visible: e.target.checked })} /> 사이트에 보이기
                </label>
                <ImagePick id={`${id}-img`} image={b.image} required onChange={(image) => patch(i, { image })} onError={ed.setError} />
                <div className="dva_field">
                  <label htmlFor={`${id}-alt`}>대체 글 (그림을 못 보는 분에게 읽어 줍니다)</label>
                  <input id={`${id}-alt`} type="text" maxLength={200} value={t.alt ?? ''} onChange={(e) => setT({ alt: e.target.value })} />
                </div>
                <div className="dva_field">
                  <label htmlFor={`${id}-title`}>제목</label>
                  <input id={`${id}-title`} type="text" maxLength={120} value={t.title ?? ''} onChange={(e) => setT({ title: e.target.value })} />
                  <small>비워 두면 「문구」 탭의 제목이 나옵니다.</small>
                </div>
                <div className="dva_field">
                  <label htmlFor={`${id}-desc`}>설명</label>
                  <textarea id={`${id}-desc`} maxLength={300} value={t.description ?? ''} onChange={(e) => setT({ description: e.target.value })} />
                </div>
                <div className="dva_row2">
                  <div className="dva_field">
                    <label htmlFor={`${id}-href`}>링크 주소</label>
                    <input id={`${id}-href`} type="text" inputMode="url" placeholder="/page/… 또는 https://…" value={b.link_href ?? ''} onChange={(e) => patch(i, { link_href: e.target.value })} />
                    <small>첫째 버튼이 이 주소로 갑니다. 비워 두면 「문구」 탭의 첫째 버튼.</small>
                  </div>
                  <div className="dva_field">
                    <label htmlFor={`${id}-label`}>버튼 글자</label>
                    <input id={`${id}-label`} type="text" maxLength={40} placeholder="자세히 보기" value={t.link_label ?? ''} onChange={(e) => setT({ link_label: e.target.value })} />
                  </div>
                </div>
                <Period id={id} item={b} onChange={(p) => patch(i, p)} />
              </li>
            )
          })}
        </ol>
        <button type="button" className="dva_btn is-small" disabled={items.length >= 20} onClick={() => setItems([...items, newBanner()])}>
          배너 추가
        </button>
      </div>
    </>
  )
}

function PopupsPanel() {
  const ed = useListEditor<Popup>(listPopups, savePopups, '팝업을 저장했습니다. 사이트에 바로 반영됩니다.')
  const [lang, setLang] = useState<Lang>('ko-KR')
  const [asking, setAsking] = useState<number | null>(null)
  const [preview, setPreview] = useState<number | null>(null)
  const { items, setItems } = ed
  if (!items) return ed.error ? <div className="dva_error" role="alert">{ed.error}</div> : <div className="dva_empty">불러오는 중…</div>

  const patch = (i: number, p: Partial<Popup>) => setItems(items.map((x, j) => (j === i ? { ...x, ...p } : x)))
  const check = (xs: Popup[]) => {
    const i = xs.findIndex((x) => {
      const ko = x.translations.find((t) => t.languages_code === 'ko-KR')
      const body = (ko?.body ?? '').replace(/<[^>]+>/g, '').trim()
      return !x.image && !ko?.title?.trim() && !body
    })
    if (i >= 0) return `팝업 ${i + 1}에 그림이나 한국어 제목·내용 중 하나는 넣어 주세요.`
    const k = xs.findIndex((x) => x.starts_at && x.ends_at && new Date(x.ends_at) <= new Date(x.starts_at))
    return k >= 0 ? `팝업 ${k + 1}의 끝나는 때는 시작하는 때보다 뒤여야 합니다.` : ''
  }

  return (
    <>
      <div className="dva_head is-sticky dvhm_bar">
        <h2 className="dvp_embedded_title">팝업</h2>
        <div className="dva_actions">
          {ed.dirty && <span className="dva_dirty">저장하지 않은 변경이 있습니다</span>}
          <button type="button" className="dva_btn is-primary" disabled={ed.busy} onClick={() => ed.submit(check)}>
            {ed.busy ? '저장하는 중…' : '저장'}
          </button>
        </div>
      </div>
      {ed.error && (
        <div ref={ed.errorBox} className="dva_error" role="alert" tabIndex={-1}>
          {ed.error}
        </div>
      )}
      <div className="dva_card">
        <p className="dvhm_note">
          팝업은 메인에서만 뜹니다. 진행 중인 팝업을 위에서부터 <b>하나씩</b> 띄우고, 닫으면 다음 것이 뜹니다.
          「N일 동안 보지 않기」를 누른 방문자에게는 그 기간 동안 다시 뜨지 않습니다. 자바스크립트가 꺼진 화면에는 뜨지 않습니다.
        </p>
        <LangTabs lang={lang} onChange={setLang} />
        {items.length === 0 && <div className="dva_empty">팝업이 없습니다.</div>}
        <ol className="dvp_items">
          {items.map((p, i) => {
            const t = textFor(p.translations, lang, emptyPopupText)
            const setT = (x: Partial<Popup['translations'][number]>) => patch(i, { translations: withText(p.translations, lang, emptyPopupText, x) })
            const id = `dvhm-p${i}`
            return (
              <li key={p.id ?? `new-${i}`} className="dvp_item">
                <ItemHead
                  name="팝업"
                  index={i}
                  count={items.length}
                  state={stateOf(p)}
                  onMove={(d) => setItems(moved(items, i, d))}
                  asking={asking === i}
                  setAsking={(on) => setAsking(on ? i : null)}
                  onRemove={() => {
                    setItems(items.filter((_, j) => j !== i))
                    setAsking(null)
                  }}
                />
                <label className="dva_check">
                  <input type="checkbox" checked={p.visible} onChange={(e) => patch(i, { visible: e.target.checked })} /> 사이트에 보이기
                </label>
                <div className="dva_field">
                  <label htmlFor={`${id}-title`}>제목</label>
                  <input id={`${id}-title`} type="text" maxLength={120} value={t.title ?? ''} onChange={(e) => setT({ title: e.target.value })} />
                  <small>창 이름으로도 읽힙니다.</small>
                </div>
                <div className="dva_field">
                  <span className="dva_label">내용</span>
                  <HtmlEditor key={`${id}-${lang}`} value={t.body ?? ''} onChange={(html) => setT({ body: html })} onError={ed.setError} />
                </div>
                <ImagePick id={`${id}-img`} image={p.image} onChange={(image) => patch(i, { image })} onError={ed.setError} />
                {p.image && (
                  <div className="dva_field">
                    <label htmlFor={`${id}-alt`}>대체 글</label>
                    <input id={`${id}-alt`} type="text" maxLength={200} value={t.alt ?? ''} onChange={(e) => setT({ alt: e.target.value })} />
                  </div>
                )}
                <div className="dva_row2">
                  <div className="dva_field">
                    <label htmlFor={`${id}-href`}>링크 주소</label>
                    <input id={`${id}-href`} type="text" inputMode="url" placeholder="/page/… 또는 https://…" value={p.link_href ?? ''} onChange={(e) => patch(i, { link_href: e.target.value })} />
                  </div>
                  <div className="dva_field">
                    <label htmlFor={`${id}-label`}>버튼 글자</label>
                    <input id={`${id}-label`} type="text" maxLength={40} placeholder="자세히 보기" value={t.link_label ?? ''} onChange={(e) => setT({ link_label: e.target.value })} />
                  </div>
                </div>
                <Period id={id} item={p} onChange={(x) => patch(i, x)} />
                <div className="dva_row2">
                  <div className="dva_field">
                    <label htmlFor={`${id}-w`}>창 폭 (px)</label>
                    <input id={`${id}-w`} type="number" min={280} max={720} step={10} value={p.width} onChange={(e) => patch(i, { width: Number(e.target.value) || 480 })} />
                    <small>280~720. 휴대폰에서는 화면 폭에 맞춥니다.</small>
                  </div>
                  <div className="dva_field">
                    <label htmlFor={`${id}-d`}>「보지 않기」 버튼</label>
                    <select id={`${id}-d`} value={String(p.dismiss_days)} onChange={(e) => patch(i, { dismiss_days: Number(e.target.value) })}>
                      <option value="0">없음 (닫기만)</option>
                      <option value="1">오늘 하루 보지 않기</option>
                      <option value="3">3일 동안 보지 않기</option>
                      <option value="7">7일 동안 보지 않기</option>
                      <option value="30">30일 동안 보지 않기</option>
                    </select>
                  </div>
                </div>
                <button type="button" className="dva_btn is-small" aria-expanded={preview === i} onClick={() => setPreview(preview === i ? null : i)}>
                  {preview === i ? '미리 보기 닫기' : '미리 보기'}
                </button>
                {preview === i && (
                  <div className="dvhm_preview" aria-label={`팝업 ${i + 1} 미리 보기`}>
                    <div className="dvhm_pop" style={{ width: p.width }}>
                      {p.image && <img src={p.image.url} alt="" width={p.image.width ?? p.width} height={p.image.height ?? 200} />}
                      {t.title && <strong>{t.title}</strong>}
                      {t.body && <div className="dvhm_pop_body" dangerouslySetInnerHTML={{ __html: t.body }} />}
                      <div className="dvhm_pop_btns">
                        {p.link_href && <span className="dva_btn is-small is-primary">{t.link_label || '자세히 보기'}</span>}
                        {p.dismiss_days > 0 && <span className="dva_btn is-small">{p.dismiss_days === 1 ? '오늘 하루 보지 않기' : `${p.dismiss_days}일 동안 보지 않기`}</span>}
                        <span className="dva_btn is-small">닫기</span>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        <button type="button" className="dva_btn is-small" disabled={items.length >= 10} onClick={() => setItems([...items, newPopup()])}>
          팝업 추가
        </button>
      </div>
    </>
  )
}
