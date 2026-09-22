'use client'

import { useState } from 'react'
import { uploadFile } from '@/lib/admin'
import { emptyOf, type PageContent, type PageField, type PageImageValue, type PageLinkValue } from '@/lib/admin-pages'
import HtmlEditor from '../../posts/[board]/HtmlEditor'
import FileDrop from '../../ui/FileDrop'

/**
 * 스키마 한 칸을 그린다(재귀). 칸을 여기 적지 않는다 — api 가 준 구조대로 그릴 뿐이다.
 * `id` 는 라벨과 입력을 잇는 접두어(같은 장 안에서 겹치지 않게 경로로 짓는다).
 */
type Props = {
  field: PageField
  value: unknown
  onChange: (v: unknown) => void
  id: string
  onError: (message: string) => void
}

const IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/gif'

export function Fields({ fields, value, onChange, id, onError }: {
  fields: PageField[]
  value: PageContent
  onChange: (v: PageContent) => void
  id: string
  onError: (message: string) => void
}) {
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
        />
      ))}
    </>
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

function Field({ field: f, value, onChange, id, onError }: Props) {
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
    case 'list':
      return <ListField field={f} value={Array.isArray(value) ? (value as PageContent[]) : []} onChange={onChange} id={id} onError={onError} />
    case 'group':
      return (
        <fieldset className="dvp_group">
          <legend>{f.label}</legend>
          {help}
          <Fields fields={f.fields} value={(value ?? {}) as PageContent} onChange={onChange} id={id} onError={onError} />
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

function ListField({
  field: f,
  value,
  onChange,
  id,
  onError,
}: {
  field: Extract<PageField, { type: 'list' }>
  value: PageContent[]
  onChange: (v: unknown) => void
  id: string
  onError: (message: string) => void
}) {
  const name = f.itemLabel ?? f.label
  const min = f.min ?? 0
  const move = (i: number, d: -1 | 1) => {
    const next = [...value]
    const [x] = next.splice(i, 1)
    next.splice(i + d, 0, x)
    onChange(next)
  }
  return (
    <fieldset className="dvp_list">
      <legend>
        {f.label}
        {min > 0 && <span className="dvp_req"> (최소 {min}개)</span>}
      </legend>
      {f.help && <small>{f.help}</small>}
      <ol className="dvp_items">
        {value.map((item, i) => (
          <li key={i} className="dvp_item">
            <div className="dvp_item_head">
              <b>
                {name} {i + 1}
              </b>
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
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                >
                  삭제
                </button>
              </div>
            </div>
            <Fields
              fields={f.item}
              value={item}
              onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))}
              id={`${id}-${i}`}
              onError={onError}
            />
          </li>
        ))}
      </ol>
      <button type="button" className="dva_btn is-small" disabled={value.length >= f.max} onClick={() => onChange([...value, emptyOf(f.item)])}>
        {name} 추가
      </button>
      {value.length >= f.max && <small>{f.max}개까지 넣을 수 있습니다.</small>}
    </fieldset>
  )
}
