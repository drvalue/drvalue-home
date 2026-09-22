'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { when } from '@/lib/admin-extra'
import { getPage, savePage, type PageContent, type PageDetail } from '@/lib/admin-pages'
import { useLeaveGuard } from '../ui/leave'
import { useToast } from '../ui/toast'
import { CollapseProvider, Fields, sectionsOf } from './[key]/Fields'
import './pages.css'

const LANGS = [
  { code: 'ko-KR', label: '한국어' },
  { code: 'en-US', label: 'English' },
] as const
type Lang = (typeof LANGS)[number]['code']

/**
 * 페이지 한 장 편집. 폼은 api 가 준 칸 구조(schema)로 그린다. 언어마다 따로 저장한다.
 * 영어 글이 없으면 사이트의 영어 화면에도 한국어 글이 나온다(api 가 기본 언어로 내 준다).
 *
 * `/admin/pages/[key]` 가 한 장으로 열고, `/admin/home` 이 「문구·순서」 탭에 넣는다(embedded — 머리 제목과
 * 「목록」 버튼이 바뀐다).
 */
export default function PageEditorView({ pageKey: key, embedded = false }: { pageKey: string; embedded?: boolean }) {
  const [detail, setDetail] = useState<PageDetail | null>(null)
  const [drafts, setDrafts] = useState<Record<string, PageContent>>({})
  const saved = useRef<Record<string, string>>({})
  const [lang, setLang] = useState<Lang>('ko-KR')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const errorBox = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const { setDirty } = useLeaveGuard()
  // 접는 구역 신호(모두 펼치기·접기 · 구역 바로 가기). 저장이 실패하면 모두 편다 — 틀린 칸이 접혀 있으면 못 찾는다.
  const [collapse, setCollapse] = useState<{ rev: number; open: boolean; focus: { key: string; rev: number } | null }>({
    rev: 0,
    open: false,
    focus: null,
  })
  const expandAll = (open: boolean) => setCollapse((c) => ({ rev: c.rev + 1, open, focus: null }))

  useEffect(() => {
    getPage(key)
      .then((d) => {
        setDetail(d)
        const next: Record<string, PageContent> = {}
        for (const l of LANGS) {
          next[l.code] = d.languages[l.code]?.content ?? {}
          saved.current[l.code] = JSON.stringify(next[l.code])
        }
        setDrafts(next)
      })
      .catch((e) => setError((e as Error).message))
  }, [key])

  const dirtyLangs = LANGS.filter((l) => drafts[l.code] && JSON.stringify(drafts[l.code]) !== saved.current[l.code]).map((l) => l.code)
  const dirty = dirtyLangs.length > 0
  useEffect(() => setDirty(dirty), [dirty, setDirty])
  useEffect(() => () => setDirty(false), [setDirty])

  useEffect(() => {
    if (!error) return
    errorBox.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    errorBox.current?.focus({ preventScroll: true })
  }, [error])

  if (!detail) {
    return error ? (
      <div className="dva_error" role="alert">
        {error}
      </div>
    ) : (
      <div className="dva_empty">불러오는 중…</div>
    )
  }

  const { schema } = detail
  const info = detail.languages[lang]
  const hasRow = Boolean(info?.updated_on)

  async function save() {
    setBusy(true)
    setError('')
    try {
      const r = await savePage(key, lang, drafts[lang])
      saved.current[lang] = JSON.stringify(r.content)
      setDrafts((d) => ({ ...d, [lang]: r.content }))
      setDetail((d) => (d ? { ...d, languages: { ...d.languages, [lang]: r } } : d))
      toast(`${schema.label}(${LANGS.find((l) => l.code === lang)?.label}) 글을 저장했습니다. 사이트에 바로 반영됩니다.`)
    } catch (e) {
      expandAll(true)
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const sections = sectionsOf(schema.fields)

  return (
    <>
      <div className="dva_head is-sticky">
        {embedded ? <h2 className="dvp_embedded_title">문구 · 구역 차례</h2> : <h1>페이지 · {schema.label}</h1>}
        <div className="dva_actions">
          {dirty && <span className="dva_dirty">저장하지 않은 변경이 있습니다</span>}
          {!embedded && (
            <a href={schema.path} target="_blank" rel="noreferrer" className="dva_btn">
              사이트에서 보기
            </a>
          )}
          {!embedded && (
            <Link href="/admin/pages" className="dva_btn">
              목록
            </Link>
          )}
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

      <div className="dva_card dvp_card">
        <div className="dva_tabs" role="tablist" aria-label="언어">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="tab"
              aria-selected={lang === l.code}
              className={`dva_tab${lang === l.code ? ' is-on' : ''}`}
              onClick={() => setLang(l.code)}
            >
              {l.label}
              {dirtyLangs.includes(l.code) && <span className="dvp_tab_dot" aria-label="저장하지 않음"> ●</span>}
            </button>
          ))}
        </div>
        <p className="dvp_stamp">
          {hasRow
            ? `마지막 수정 ${when(info.updated_on)} · ${info.updated_by === 'seed' || !info.updated_by ? '처음 글' : info.updated_by}`
            : lang === 'ko-KR'
              ? '아직 저장한 글이 없습니다.'
              : '영어 글이 아직 없습니다. 비워 두면 영어 화면에도 한국어 글이 나옵니다.'}
        </p>
        {lang !== 'ko-KR' && !hasRow && (
          <button
            type="button"
            className="dva_btn is-small"
            onClick={() => setDrafts((d) => ({ ...d, [lang]: JSON.parse(JSON.stringify(d['ko-KR'] ?? {})) }))}
          >
            한국어 글을 복사해서 시작하기
          </button>
        )}
        {sections.length > 1 && (
          <nav className="dvp_toc" aria-label="구역 바로 가기">
            <ul>
              {sections.map((s) => (
                <li key={s.key}>
                  <button
                    type="button"
                    className="dvp_toc_link"
                    onClick={() => setCollapse((c) => ({ ...c, focus: { key: s.key, rev: (c.focus?.rev ?? 0) + 1 } }))}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="dvp_toc_all">
              <button type="button" className="dva_btn is-small" onClick={() => expandAll(true)}>
                모두 펼치기
              </button>
              <button type="button" className="dva_btn is-small" onClick={() => expandAll(false)}>
                모두 접기
              </button>
            </div>
          </nav>
        )}
        <CollapseProvider value={collapse}>
          <Fields
            fields={schema.fields}
            value={drafts[lang] ?? {}}
            onChange={(v) => setDrafts((d) => ({ ...d, [lang]: v }))}
            id={`pg-${lang}`}
            onError={setError}
          />
        </CollapseProvider>
      </div>
    </>
  )
}
