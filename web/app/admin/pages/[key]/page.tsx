'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { when } from '@/lib/admin-extra'
import { getPage, savePage, type PageContent, type PageDetail } from '@/lib/admin-pages'
import { useLeaveGuard } from '../../ui/leave'
import { useToast } from '../../ui/toast'
import { Fields } from './Fields'
import '../pages.css'

const LANGS = [
  { code: 'ko-KR', label: '한국어' },
  { code: 'en-US', label: 'English' },
] as const

/**
 * 페이지 한 장 편집. 폼은 api 가 준 칸 구조(schema)로 그린다. 언어마다 따로 저장한다.
 * 영어 글이 없으면 사이트의 영어 화면에도 한국어 글이 나온다(api 가 기본 언어로 내 준다).
 */
export default function PageEditor() {
  const { key } = useParams<{ key: string }>()
  const [detail, setDetail] = useState<PageDetail | null>(null)
  const [drafts, setDrafts] = useState<Record<string, PageContent>>({})
  const saved = useRef<Record<string, string>>({})
  const [lang, setLang] = useState<string>('ko-KR')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const errorBox = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const { setDirty } = useLeaveGuard()

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
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="dva_head is-sticky">
        <h1>페이지 · {schema.label}</h1>
        <div className="dva_actions">
          {dirty && <span className="dva_dirty">저장하지 않은 변경이 있습니다</span>}
          <a href={schema.path} target="_blank" rel="noreferrer" className="dva_btn">
            사이트에서 보기
          </a>
          <Link href="/admin/pages" className="dva_btn">
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
        <Fields
          fields={schema.fields}
          value={drafts[lang] ?? {}}
          onChange={(v) => setDrafts((d) => ({ ...d, [lang]: v }))}
          id={`pg-${lang}`}
          onError={setError}
        />
      </div>
    </>
  )
}
