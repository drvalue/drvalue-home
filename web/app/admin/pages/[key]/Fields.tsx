'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { uploadFile } from '@/lib/admin'
import { emptyOf, type PageContent, type PageField, type PageImageValue, type PageLinkValue } from '@/lib/admin-pages'
import HtmlEditor from '../../posts/[board]/HtmlEditor'
import FileDrop from '../../ui/FileDrop'

/**
 * 스키마 한 칸을 그린다(재귀). 칸을 여기 적지 않는다 — api 가 준 구조대로 그릴 뿐이다.
 * `id` 는 라벨과 입력을 잇는 접두어(같은 장 안에서 겹치지 않게 경로로 짓는다).
 *
 * 긴 장(PCB MES 는 칸 162개 · 화면 25,000px)을 한 벽으로 펼치지 않는다 — 맨 위 묶음·목록은 접히는
 * 구역이고(첫째만 열림), 목록 항목은 한 줄 요약으로 접힌다(Directus 의 접는 묶음과 같은 방식).
 * 「모두 펼치기·접기」와 구역 바로 가기는 `CollapseProvider` 가 나눠 준다. 저장이 실패하면 편집기가 모두 편다.
 */
type Props = {
  field: PageField
  value: unknown
  onChange: (v: unknown) => void
  id: string
  onError: (message: string) => void
  depth?: number
  index?: number
}

const IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/gif'

/** 접힘 신호. `rev` 가 바뀔 때마다 모든 접는 칸이 `open` 을 따른다. `focus` 는 그 구역 하나만 연다. */
type CollapseSignal = { rev: number; open: boolean; focus: { key: string; rev: number } | null }
const CollapseCtx = createContext<CollapseSignal>({ rev: 0, open: false, focus: null })
export const CollapseProvider = CollapseCtx.Provider

function useCollapsible(defaultOpen: boolean, key?: string) {
  const sig = useContext(CollapseCtx)
  const [open, setOpen] = useState(defaultOpen)
  useEffect(() => {
    if (sig.rev > 0) setOpen(sig.open)
  }, [sig.rev, sig.open])
  useEffect(() => {
    if (key && sig.focus?.key === key) setOpen(true)
  }, [key, sig.focus])
  return [open, setOpen] as const
}

/** 편집기 맨 위 구역 목록(바로 가기). 묶음·목록만 — 낱칸은 구역이 아니다. */
export function sectionsOf(fields: PageField[]): { key: string; label: string }[] {
  return fields.filter((f) => f.type === 'group' || f.type === 'list').map((f) => ({ key: f.key, label: f.label }))
}

export function Fields({ fields, value, onChange, id, onError, depth = 0 }: {
  fields: PageField[]
  value: PageContent
  onChange: (v: PageContent) => void
  id: string
  onError: (message: string) => void
  depth?: number
}) {
  let section = 0
  return (
    <>
      {fields.map((f) => (
        <Field
          key={f.key}
          field={f}
          value={value?.[f.key]}
          onChange={(v) => onChange({ ...value, [f.key]: v })}
          id={`${id}-${f.key}`}
          onError={onError}
          depth={depth}
          index={f.type === 'group' || f.type === 'list' ? section++ : -1}
        />
      ))}
    </>
  )
}

/** 맨 위 묶음·목록 하나. 머리 단추로 접고 편다. 첫 구역만 열린 채 시작한다. */
function Section({ field: f, id, first, children }: { field: PageField; id: string; first: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useCollapsible(first, f.key)
  const box = useRef<HTMLElement>(null)
  const sig = useContext(CollapseCtx)
  useEffect(() => {
    if (sig.focus?.key === f.key) box.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [sig.focus, f.key])
  return (
    <section ref={box} id={id} className={`dvp_section${open ? ' is-open' : ''}`} aria-labelledby={`${id}-head`}>
      <h3 className="dvp_section_head">
        <button type="button" id={`${id}-head`} aria-expanded={open} aria-controls={`${id}-body`} onClick={() => setOpen(!open)}>
          <span>{f.label}</span>
          <span className="dvp_section_state">{open ? '접기' : '펼치기'}</span>
        </button>
      </h3>
      <div id={`${id}-body`} className="dvp_section_body" hidden={!open}>
        {children}
      </div>
    </section>
  )
}

function Label({ field, htmlFor }: { field: PageField; htmlFor?: string }) {
  const text = (
    <>
      {field.label}
      {field.required && <span className="dvp_req"> (필수)</span>}
    </>
  )
  return htmlFor ? <label htmlFor={htmlFor}>{text}</label> : <span className="dva_label">{text}</span>
}

function Field(props: Props) {
  const { field: f, id, depth = 0, index = -1 } = props
  // 맨 위 묶음·목록만 접는 구역이 된다. 그 안의 묶음은 테두리만(접는 단추가 겹겹이면 길을 잃는다).
  if (depth === 0 && (f.type === 'group' || f.type === 'list')) {
    return (
      <Section field={f} id={id} first={index === 0}>
        <FieldBody {...props} />
      </Section>
    )
  }
  return <FieldBody {...props} />
}

function FieldBody({ field: f, value, onChange, id, onError, depth = 0 }: Props) {
  const help = f.help ? <small id={`${id}-help`}>{f.help}</small> : null
  const described = f.help ? `${id}-help` : undefined

  switch (f.type) {
    case 'text':
    case 'textarea': {
      const s = typeof value === 'string' ? value : ''
      const common = {
        id,
        value: s,
        maxLength: f.max,
        required: f.required,
        'aria-describedby': described,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
      }
      return (
        <div className="dva_field">
          <Label field={f} htmlFor={id} />
          {f.type === 'text' ? <input type="text" {...common} /> : <textarea {...common} />}
          <div className="dvp_meta">
            {help}
            <span className={`dvp_count${s.length >= f.max ? ' is-full' : ''}`} aria-hidden="true">
              {s.length}/{f.max}
            </span>
          </div>
        </div>
      )
    }
    case 'richtext':
      return (
        <div className="dva_field">
          <Label field={f} />
          <HtmlEditor value={typeof value === 'string' ? value : ''} onChange={onChange} onError={onError} />
          {help}
        </div>
      )
    case 'image':
      return <ImageField field={f} value={(value ?? null) as PageImageValue} onChange={onChange} id={id} onError={onError} />
    case 'link': {
      const v = (value ?? { label: '', href: '' }) as PageLinkValue
      return (
        <fieldset className="dvp_link">
          <legend>
            {f.label}
            {f.required && <span className="dvp_req"> (필수)</span>}
          </legend>
          <div className="dva_row2">
            <div className="dva_field">
              <label htmlFor={`${id}-label`}>버튼 글자</label>
              <input id={`${id}-label`} type="text" maxLength={80} value={v.label} onChange={(e) => onChange({ ...v, label: e.target.value })} />
            </div>
            <div className="dva_field">
              <label htmlFor={`${id}-href`}>주소</label>
              <input
                id={`${id}-href`}
                type="text"
                inputMode="url"
                placeholder="/page/… 또는 https://…"
                value={v.href}
                onChange={(e) => onChange({ ...v, href: e.target.value })}
              />
            </div>
          </div>
          {help}
        </fieldset>
      )
    }
    case 'boolean':
      return (
        <div className="dva_field">
          <label className="dva_check" htmlFor={id}>
            <input id={id} type="checkbox" checked={value === true} aria-describedby={described} onChange={(e) => onChange(e.target.checked)} />{' '}
            {f.label}
          </label>
          {help}
        </div>
      )
    case 'select':
      return (
        <div className="dva_field">
          <Label field={f} htmlFor={id} />
          <select id={id} value={typeof value === 'string' ? value : ''} required={f.required} aria-describedby={described} onChange={(e) => onChange(e.target.value)}>
            {(!f.required || !value) && <option value="">고르세요</option>}
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {help}
        </div>
      )
    case 'list':
      return (
        <ListField
          field={f}
          value={Array.isArray(value) ? (value as PageContent[]) : []}
          onChange={onChange}
          id={id}
          onError={onError}
          depth={depth}
        />
      )
    case 'group':
      // 맨 위 묶음은 구역 머리가 이름을 달므로 테두리 제목을 또 달지 않는다.
      return depth === 0 ? (
        <div className="dvp_group is-top">
          {help}
          <Fields fields={f.fields} value={(value ?? {}) as PageContent} onChange={onChange} id={id} onError={onError} depth={depth + 1} />
        </div>
      ) : (
        <fieldset className="dvp_group">
          <legend>{f.label}</legend>
          {help}
          <Fields fields={f.fields} value={(value ?? {}) as PageContent} onChange={onChange} id={id} onError={onError} depth={depth + 1} />
        </fieldset>
      )
  }
}

function ImageField({
  field: f,
  value,
  onChange,
  id,
  onError,
}: {
  field: Extract<PageField, { type: 'image' }>
  value: PageImageValue
  onChange: (v: unknown) => void
  id: string
  onError: (message: string) => void
}) {
  const [busy, setBusy] = useState(false)
  async function onFiles(files: File[]) {
    const file = files[0]
    if (!file) return
    setBusy(true)
    try {
      const up = await uploadFile(file, file.name.replace(/\.[^.]+$/, ''))
      onChange({ id: up.id, alt: value?.alt ?? '' })
    } catch (e) {
      onError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="dva_field dvp_image">
      <Label field={f} />
      {value?.id || value?.src ? (
        <div className="dvp_image_row">
          <img
            src={value.id ? `/api/admin/files/${value.id}` : value.src}
            alt=""
            width={value.width ?? 160}
            height={value.height ?? 120}
            className="dvp_image_preview"
          />
          <div className="dvp_image_side">
            <div className="dva_field">
              <label htmlFor={`${id}-alt`}>대체 글 (그림을 못 보는 분에게 읽어 줍니다)</label>
              <input id={`${id}-alt`} type="text" maxLength={200} value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
            </div>
            <button type="button" className="dva_btn is-small" onClick={() => onChange(null)}>
              그림 빼기
            </button>
          </div>
        </div>
      ) : null}
      <FileDrop
        label={value?.id || value?.src ? '다른 그림으로 바꾸기' : '그림 올리기'}
        hint="png · jpg · webp · gif, 20MB 까지"
        accept={IMAGE_TYPES}
        disabled={busy}
        onFiles={onFiles}
      />
      {f.help && <small>{f.help}</small>}
    </div>
  )
}

/** 항목 머리에 붙일 이름 — 항목 안 첫 고르기 칸의 고른 값(메인 「구역 1 · 신뢰의 근거」). */
function pickLabel(item: PageField[], value: PageContent): string {
  const sel = item.find((f): f is Extract<PageField, { type: 'select' }> => f.type === 'select')
  if (!sel) return ''
  return sel.options.find((o) => o.value === value?.[sel.key])?.label ?? ''
}

/** 요약에 쓸 만한 글인가 — 번호(「1」 「01」)나 한두 글자는 항목을 구별해 주지 못한다. */
const meaningful = (s: string) => s.length > 2 && !/^[\d\s.·-]+$/.test(s)
/** 제목처럼 쓰이는 칸 이름 — 이 칸이 있으면 먼저 본다(「기능 1 · 1」 대신 「기능 1 · 원판 수율 최적화」). */
const TITLE_KEYS = ['t', 'title', 'name', 'label', 'head', 'heading', 'kicker']

/** 접힌 항목의 한 줄 요약 — 고르기 칸의 값, 없으면 제목 같은 칸, 없으면 처음으로 채워진 글 칸(그림은 대체 글). */
function summaryOf(item: PageField[], value: PageContent): string {
  const pick = pickLabel(item, value)
  if (pick) return pick
  const plain = (v: unknown) => (typeof v === 'string' ? v.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '')
  const clip = (t: string) => (t.length > 48 ? t.slice(0, 47) + '…' : t)
  const titled = item.find((f) => TITLE_KEYS.includes(f.key) && meaningful(plain(value?.[f.key])))
  if (titled) return clip(plain(value?.[titled.key]))
  for (const f of item) {
    const v = value?.[f.key]
    if ((f.type === 'text' || f.type === 'textarea' || f.type === 'richtext') && meaningful(plain(v))) {
      return clip(plain(v))
    }
    if (f.type === 'link' && v && typeof v === 'object' && (v as PageLinkValue).label) return (v as PageLinkValue).label
    if (f.type === 'image' && v && typeof v === 'object' && (v as { alt?: string }).alt) return (v as { alt: string }).alt
    if (f.type === 'group' && v && typeof v === 'object') {
      const inner = summaryOf(f.fields, v as PageContent)
      if (inner) return inner
    }
  }
  return ''
}

function ListField({
  field: f,
  value,
  onChange,
  id,
  onError,
  depth,
}: {
  field: Extract<PageField, { type: 'list' }>
  value: PageContent[]
  onChange: (v: unknown) => void
  id: string
  onError: (message: string) => void
  depth: number
}) {
  const name = f.itemLabel ?? f.label
  const min = f.min ?? 0
  // 항목마다 열림 표시. 순서를 바꾸고·지우고·더할 때 같이 옮긴다(자리 번호로 매기면 옮긴 뒤 엉뚱한 항목이 열린다).
  const [opens, setOpens] = useState<boolean[]>(() => value.map(() => false))
  const sig = useContext(CollapseCtx)
  useEffect(() => {
    if (sig.rev > 0) setOpens(value.map(() => sig.open))
    // 신호가 올 때만 모두 맞춘다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig.rev, sig.open])
  const openAt = (i: number) => opens[i] ?? false
  const setOpenAt = (i: number, o: boolean) => setOpens(value.map((_, j) => (j === i ? o : openAt(j))))
  const move = (i: number, d: -1 | 1) => {
    const next = [...value]
    const [x] = next.splice(i, 1)
    next.splice(i + d, 0, x)
    const flags = value.map((_, j) => openAt(j))
    const [fl] = flags.splice(i, 1)
    flags.splice(i + d, 0, fl)
    setOpens(flags)
    onChange(next)
  }
  const remove = (i: number) => {
    setOpens(value.map((_, j) => openAt(j)).filter((_, j) => j !== i))
    onChange(value.filter((_, j) => j !== i))
  }
  const add = () => {
    setOpens([...value.map((_, j) => openAt(j)), true])
    onChange([...value, emptyOf(f.item)])
  }
  return (
    <fieldset className="dvp_list">
      <legend className={depth === 0 ? 'dva_sr' : undefined}>
        {f.label}
        {min > 0 && <span className="dvp_req"> (최소 {min}개)</span>}
      </legend>
      {depth === 0 && min > 0 && <small>최소 {min}개가 있어야 합니다.</small>}
      {f.help && <small>{f.help}</small>}
      <ol className="dvp_items">
        {value.map((item, i) => (
          <li key={i} className={`dvp_item${openAt(i) ? ' is-open' : ''}`}>
            <div className="dvp_item_head">
              <button
                type="button"
                className="dvp_item_toggle"
                aria-expanded={openAt(i)}
                aria-controls={`${id}-${i}-body`}
                onClick={() => setOpenAt(i, !openAt(i))}
              >
                <b>
                  {name} {i + 1}
                </b>
                {summaryOf(f.item, item) && <span className="dvp_item_pick"> · {summaryOf(f.item, item)}</span>}
              </button>
              <div className="dvp_item_btns">
                <button type="button" className="dva_btn is-small" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`${name} ${i + 1} 위로`}>
                  ↑
                </button>
                <button
                  type="button"
                  className="dva_btn is-small"
                  disabled={i === value.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`${name} ${i + 1} 아래로`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="dva_btn is-small is-danger"
                  disabled={value.length <= min}
                  onClick={() => remove(i)}
                  aria-label={`${name} ${i + 1} 삭제`}
                >
                  삭제
                </button>
              </div>
            </div>
            <div id={`${id}-${i}-body`} className="dvp_item_body" hidden={!openAt(i)}>
              <Fields
                fields={f.item}
                value={item}
                onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))}
                id={`${id}-${i}`}
                onError={onError}
                depth={depth + 1}
              />
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="dva_btn is-small" disabled={value.length >= f.max} onClick={add}>
        {name} 추가
      </button>
      {value.length >= f.max && <small>{f.max}개까지 넣을 수 있습니다.</small>}
    </fieldset>
  )
}
