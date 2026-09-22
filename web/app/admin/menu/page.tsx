'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  blankChild,
  blankNode,
  EditChild,
  EditMenu,
  EditNode,
  formProblems,
  LIMITS,
  linkProblems,
  loadMenu,
  refreshSiteMenu,
  saveMenu,
} from '@/lib/admin-menu'
import InlineConfirm from '../ui/InlineConfirm'
import { useLeaveGuard } from '../ui/leave'
import { useToast } from '../ui/toast'
import './menu.css'

type Tab = 'top' | 'footer'

/** 배열에서 i 번째를 d(−1 위 · +1 아래)만큼 옮긴다. 끝이면 그대로. */
function moved<T>(xs: T[], i: number, d: -1 | 1): T[] {
  const j = i + d
  if (j < 0 || j >= xs.length) return xs
  const out = [...xs]
  ;[out[i], out[j]] = [out[j], out[i]]
  return out
}

/**
 * 메뉴 — 사이트 머리글의 탭 막대·드롭다운과 바닥글 링크 줄.
 * 저장하면 메뉴 전체를 한 번에 바꾸고, 사이트 캐시를 비워 다음 요청부터 보인다.
 * 사이트 안 주소는 저장 전에 실제로 열리는지 확인한다(없는 장으로 가는 메뉴를 막는다).
 */
export default function MenuPage() {
  const [menu, setMenu] = useState<EditMenu | null>(null)
  const [tab, setTab] = useState<Tab>('top')
  const [open, setOpen] = useState<string | null>(null)
  const [asking, setAsking] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const initial = useRef<string | null>(null)
  const errorBox = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const { setDirty } = useLeaveGuard()

  const start = useCallback((m: EditMenu) => {
    setMenu(m)
    initial.current = JSON.stringify({ top: m.top, footer: m.footer })
  }, [])

  useEffect(() => {
    loadMenu()
      .then(start)
      .catch((e) => setErrors([(e as Error).message]))
  }, [start])

  const dirty = Boolean(menu && initial.current !== null && JSON.stringify({ top: menu.top, footer: menu.footer }) !== initial.current)
  useEffect(() => setDirty(dirty), [dirty, setDirty])
  useEffect(() => () => setDirty(false), [setDirty])
  useEffect(() => {
    if (errors.length) errorBox.current?.focus()
  }, [errors])

  if (!menu) {
    return errors.length ? (
      <div className="dva_error" role="alert">
        {errors[0]}
      </div>
    ) : (
      <div className="dva_empty">불러오는 중…</div>
    )
  }

  const setTop = (top: EditNode[]) => setMenu({ ...menu, top })
  const setFooter = (footer: EditChild[]) => setMenu({ ...menu, footer })
  const patchNode = (i: number, patch: Partial<EditNode>) => setTop(menu.top.map((n, k) => (k === i ? { ...n, ...patch } : n)))
  const patchChild = (i: number, j: number, patch: Partial<EditChild>) =>
    patchNode(i, { children: menu.top[i].children.map((c, k) => (k === j ? { ...c, ...patch } : c)) })

  async function save() {
    if (!menu) return
    const local = formProblems(menu)
    if (local.length) {
      setErrors(local)
      return
    }
    setBusy(true)
    setErrors([])
    try {
      const missing = await linkProblems(menu)
      if (missing.length) {
        setErrors(missing)
        return
      }
      const saved = await saveMenu(menu)
      start(saved)
      setDirty(false)
      const live = await refreshSiteMenu()
      toast(live ? '메뉴를 저장했습니다. 사이트에 바로 반영됩니다.' : '메뉴를 저장했습니다. 사이트에는 1분 안에 반영됩니다.')
    } catch (e) {
      setErrors([(e as Error).message])
    } finally {
      setBusy(false)
    }
  }

  /** Alt + 위/아래 화살표로도 옮긴다(버튼과 같은 동작). */
  const moveKeys = (onMove: (d: -1 | 1) => void) => (e: React.KeyboardEvent) => {
    if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
    e.preventDefault()
    onMove(e.key === 'ArrowUp' ? -1 : 1)
  }

  function labelFields(c: EditChild, set: (p: Partial<EditChild>) => void, withDesc: boolean, id: string) {
    return (
      <div className="dvmn_fields">
        <div className="dva_field">
          <label htmlFor={`${id}-ko`}>이름 (한국어, 필수)</label>
          <input id={`${id}-ko`} type="text" maxLength={LIMITS.label} value={c.ko} onChange={(e) => set({ ko: e.target.value })} />
        </div>
        <div className="dva_field">
          <label htmlFor={`${id}-en`}>이름 (English)</label>
          <input id={`${id}-en`} type="text" maxLength={LIMITS.label} value={c.en} onChange={(e) => set({ en: e.target.value })} />
        </div>
        <div className="dva_field dvmn_wide">
          <label htmlFor={`${id}-href`}>링크</label>
          <input
            id={`${id}-href`}
            type="text"
            inputMode="url"
            value={c.href}
            placeholder="/page/support/notice"
            onChange={(e) => set({ href: e.target.value })}
          />
          <small>사이트 안 주소(/page/…)나 http(s):// 로 시작하는 바깥 주소를 적습니다. 바깥 주소는 새 창으로 열립니다.</small>
        </div>
        {withDesc && (
          <>
            <div className="dva_field">
              <label htmlFor={`${id}-kod`}>한 줄 설명 (한국어)</label>
              <input
                id={`${id}-kod`}
                type="text"
                maxLength={LIMITS.desc}
                value={c.koDesc}
                aria-describedby={`${id}-kod-help`}
                onChange={(e) => set({ koDesc: e.target.value })}
              />
              <small id={`${id}-kod-help`}>
                글 수는 손으로 적지 말고 자리표시로 적습니다. 사이트가 공개된 글 수로 바꿉니다 — {'{patent.registered}'} 특허 등록 ·{' '}
                {'{patent.applied}'} 특허 출원 · {'{patent}'} 특허 전체 · {'{copyright}'} 저작권 · {'{case}'} 수행실적.
              </small>
            </div>
            <div className="dva_field">
              <label htmlFor={`${id}-end`}>한 줄 설명 (English)</label>
              <input id={`${id}-end`} type="text" maxLength={LIMITS.desc} value={c.enDesc} onChange={(e) => set({ enDesc: e.target.value })} />
            </div>
          </>
        )}
      </div>
    )
  }

  function rowTools(opts: {
    label: string
    first: boolean
    last: boolean
    onMove: (d: -1 | 1) => void
    askKey: string
    onRemove: () => void
    removeLabel: string
  }) {
    return (
      <span className="dvmn_tools">
        <button type="button" className="dva_btn is-small" aria-label={`${opts.label} 위로`} disabled={opts.first} onClick={() => opts.onMove(-1)}>
          ↑
        </button>
        <button type="button" className="dva_btn is-small" aria-label={`${opts.label} 아래로`} disabled={opts.last} onClick={() => opts.onMove(1)}>
          ↓
        </button>
        {asking === opts.askKey ? (
          <InlineConfirm
            message={opts.removeLabel}
            confirmLabel="삭제"
            onConfirm={() => {
              opts.onRemove()
              setAsking(null)
            }}
            onCancel={() => setAsking(null)}
          />
        ) : (
          <button type="button" className="dva_btn is-small is-danger" onClick={() => setAsking(opts.askKey)}>
            삭제
          </button>
        )}
      </span>
    )
  }

  const visibleTop = menu.top.filter((n) => n.visible)

  return (
    <>
      <div className="dva_head is-sticky">
        <h1>메뉴</h1>
        <div className="dva_actions">
          {dirty && <span className="dva_dirty">저장하지 않은 변경이 있습니다</span>}
          <a className="dva_btn" href="/" target="_blank" rel="noreferrer">
            사이트에서 보기
          </a>
          <button type="button" className="dva_btn is-primary" disabled={busy || !dirty} onClick={save}>
            {busy ? '저장하는 중…' : '저장'}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div ref={errorBox} className="dva_error" role="alert" tabIndex={-1}>
          {errors.length === 1 ? (
            errors[0]
          ) : (
            <ul className="dvmn_errs">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="dvmn_lead">
        사이트 머리글의 탭 막대와 드롭다운, 바닥글의 링크 줄을 고칩니다. 순서는 ↑↓ 버튼이나 Alt + 화살표로 바꿉니다. 저장하면
        사이트에 바로 반영됩니다.
      </p>

      <div className="dva_tabs" role="tablist" aria-label="메뉴 위치">
        <button type="button" role="tab" aria-selected={tab === 'top'} className={`dva_tab${tab === 'top' ? ' is-on' : ''}`} onClick={() => setTab('top')}>
          상단 메뉴 ({menu.top.length})
        </button>
        <button type="button" role="tab" aria-selected={tab === 'footer'} className={`dva_tab${tab === 'footer' ? ' is-on' : ''}`} onClick={() => setTab('footer')}>
          하단 링크 ({menu.footer.length})
        </button>
      </div>

      {tab === 'top' ? (
        <div className="dvmn_layout">
          <ol className="dvmn_list">
            {menu.top.map((n, i) => {
              const id = `n-${n.key}`
              const expanded = open === n.key
              return (
                <li key={n.key} className={`dva_card dvmn_node${n.visible ? '' : ' is-off'}`}>
                  <div className="dvmn_row" onKeyDown={moveKeys((d) => setTop(moved(menu.top, i, d)))}>
                    <button
                      type="button"
                      className="dvmn_title"
                      aria-expanded={expanded}
                      aria-controls={`${id}-body`}
                      onClick={() => setOpen(expanded ? null : n.key)}
                    >
                      <span className="dvmn_no">{i + 1}</span>
                      <b>{n.ko || '(이름 없음)'}</b>
                      <small>{n.href}</small>
                      <small>하위 {n.children.length}</small>
                      {!n.visible && <span className="dva_pill is-draft">숨김</span>}
                    </button>
                    {rowTools({
                      label: n.ko || `${i + 1}번째`,
                      first: i === 0,
                      last: i === menu.top.length - 1,
                      onMove: (d) => setTop(moved(menu.top, i, d)),
                      askKey: n.key,
                      onRemove: () => setTop(menu.top.filter((_, k) => k !== i)),
                      removeLabel: `「${n.ko || '이 메뉴'}」와 하위 ${n.children.length}개를 지울까요?`,
                    })}
                  </div>

                  {expanded && (
                    <div id={`${id}-body`} className="dvmn_body">
                      {labelFields(n, (p) => patchNode(i, p), false, id)}
                      <label className="dva_check">
                        <input type="checkbox" checked={n.visible} onChange={(e) => patchNode(i, { visible: e.target.checked })} /> 사이트에 보이기
                      </label>
                      <details className="dvmn_adv">
                        <summary>고급: 켜지는 주소</summary>
                        <div className="dva_field">
                          <label htmlFor={`${id}-match`}>이 주소로 시작하는 장에서 이 탭이 「지금 여기」로 켜집니다 (한 줄에 하나)</label>
                          <textarea id={`${id}-match`} rows={2} value={n.match} placeholder={n.href} onChange={(e) => patchNode(i, { match: e.target.value })} />
                          <small>비워 두면 링크 주소로 켜집니다.</small>
                        </div>
                      </details>

                      <h3 className="dvmn_sub">하위 메뉴 · 드롭다운</h3>
                      <ol className="dvmn_children">
                        {n.children.map((c, j) => {
                          const cid = `${id}-c-${c.key}`
                          return (
                            <li key={c.key} className={`dvmn_child${c.visible ? '' : ' is-off'}`}>
                              <div className="dvmn_row" onKeyDown={moveKeys((d) => patchNode(i, { children: moved(n.children, j, d) }))}>
                                <span className="dvmn_title is-static">
                                  <span className="dvmn_no">{j + 1}</span>
                                  <b>{c.ko || '(이름 없음)'}</b>
                                  {c.hidden_in_dropdown && <span className="dva_pill">드롭다운 숨김</span>}
                                  {!c.visible && <span className="dva_pill is-draft">숨김</span>}
                                </span>
                                {rowTools({
                                  label: c.ko || `하위 ${j + 1}번째`,
                                  first: j === 0,
                                  last: j === n.children.length - 1,
                                  onMove: (d) => patchNode(i, { children: moved(n.children, j, d) }),
                                  askKey: c.key,
                                  onRemove: () => patchNode(i, { children: n.children.filter((_, k) => k !== j) }),
                                  removeLabel: `「${c.ko || '이 항목'}」을 지울까요?`,
                                })}
                              </div>
                              {labelFields(c, (p) => patchChild(i, j, p), true, cid)}
                              <div className="dvmn_checks">
                                <label className="dva_check">
                                  <input type="checkbox" checked={c.visible} onChange={(e) => patchChild(i, j, { visible: e.target.checked })} /> 사이트에 보이기
                                </label>
                                <label className="dva_check">
                                  <input
                                    type="checkbox"
                                    checked={c.hidden_in_dropdown}
                                    onChange={(e) => patchChild(i, j, { hidden_in_dropdown: e.target.checked })}
                                  />{' '}
                                  드롭다운에서는 숨기기 (주소로 들어오면 현재 위치에 이름이 나옵니다)
                                </label>
                              </div>
                            </li>
                          )
                        })}
                      </ol>
                      <button
                        type="button"
                        className="dva_btn is-small"
                        disabled={n.children.length >= LIMITS.children}
                        onClick={() => patchNode(i, { children: [...n.children, blankChild()] })}
                      >
                        하위 메뉴 추가
                      </button>
                      {n.children.length >= LIMITS.children && <small className="dvmn_limit">하위 메뉴는 {LIMITS.children}개까지 넣을 수 있습니다.</small>}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
          <div className="dvmn_after">
            <button
              type="button"
              className="dva_btn"
              disabled={menu.top.length >= LIMITS.top}
              onClick={() => {
                const n = blankNode()
                setTop([...menu.top, n])
                setOpen(n.key)
              }}
            >
              대분류 추가
            </button>
            {menu.top.length >= LIMITS.top && <small className="dvmn_limit">대분류는 {LIMITS.top}개까지 넣을 수 있습니다.</small>}
          </div>

          <aside className="dva_card dvmn_preview" aria-label="머리글 미리 보기">
            <h2>머리글 미리 보기</h2>
            <p className="dvmn_hint">사이트에 보이는 것만 나옵니다. 저장 전 모습입니다.</p>
            <ul className="dvmn_pv_bar">
              {visibleTop.map((n) => (
                <li key={n.key}>
                  <b>{n.ko || '(이름 없음)'}</b>
                  <ul>
                    {n.children
                      .filter((c) => c.visible && !c.hidden_in_dropdown)
                      .map((c) => (
                        <li key={c.key}>{c.ko || '(이름 없음)'}</li>
                      ))}
                  </ul>
                </li>
              ))}
            </ul>
            {visibleTop.length === 0 && <p className="dvmn_hint">보이는 대분류가 없으면 사이트는 기본 메뉴를 씁니다.</p>}
          </aside>
        </div>
      ) : (
        <div className="dvmn_layout is-single">
          {menu.footer.length === 0 && (
            <div className="dva_empty">
              <p>바닥글에 링크 줄이 없습니다. 링크를 추가하면 회사 정보 위에 한 줄로 나옵니다.</p>
            </div>
          )}
          <ol className="dvmn_list">
            {menu.footer.map((c, i) => {
              const id = `f-${c.key}`
              return (
                <li key={c.key} className={`dva_card dvmn_node${c.visible ? '' : ' is-off'}`}>
                  <div className="dvmn_row" onKeyDown={moveKeys((d) => setFooter(moved(menu.footer, i, d)))}>
                    <span className="dvmn_title is-static">
                      <span className="dvmn_no">{i + 1}</span>
                      <b>{c.ko || '(이름 없음)'}</b>
                      {!c.visible && <span className="dva_pill is-draft">숨김</span>}
                    </span>
                    {rowTools({
                      label: c.ko || `${i + 1}번째`,
                      first: i === 0,
                      last: i === menu.footer.length - 1,
                      onMove: (d) => setFooter(moved(menu.footer, i, d)),
                      askKey: c.key,
                      onRemove: () => setFooter(menu.footer.filter((_, k) => k !== i)),
                      removeLabel: `「${c.ko || '이 링크'}」를 지울까요?`,
                    })}
                  </div>
                  {labelFields(c, (p) => setFooter(menu.footer.map((x, k) => (k === i ? { ...x, ...p } : x))), false, id)}
                  <label className="dva_check">
                    <input
                      type="checkbox"
                      checked={c.visible}
                      onChange={(e) => setFooter(menu.footer.map((x, k) => (k === i ? { ...x, visible: e.target.checked } : x)))}
                    />{' '}
                    사이트에 보이기
                  </label>
                </li>
              )
            })}
          </ol>
          <div className="dvmn_after">
            <button type="button" className="dva_btn" disabled={menu.footer.length >= LIMITS.footer} onClick={() => setFooter([...menu.footer, blankChild()])}>
              링크 추가
            </button>
            {menu.footer.length >= LIMITS.footer && <small className="dvmn_limit">하단 링크는 {LIMITS.footer}개까지 넣을 수 있습니다.</small>}
          </div>
        </div>
      )}
    </>
  )
}
