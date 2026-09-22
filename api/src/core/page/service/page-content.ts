import type { ImageValue, LinkValue, PageField } from '../schema/page-schema';
import { sanitizeRichtext } from './richtext';

/**
 * 페이지 글을 스키마로 검사하고 정리한다. 순수 함수 — 테스트가 붙어 있다(page-content.test.mjs).
 *
 * - 스키마에 없는 칸이 있으면 거부한다(오타로 만든 칸이 조용히 쌓이지 않게).
 * - 빠진 칸은 빈 값으로 채운다(text '' · image null · boolean false · select '' · list [] · group {…}).
 * - list 에 uniqueBy 가 있으면 그 칸 값이 항목끼리 겹치면 거부한다.
 * - richtext 는 허용 태그만 남긴다. link 의 href 는 / · https:// · mailto: · tel: 만.
 * - 문구는 화면에 뜬다(합니다체). 칸 이름(label)과 항목 번호로 어디가 틀렸는지 알린다.
 */
export class PageContentError extends Error {
  constructor(
    message: string,
    /** 개발자용 위치(shell.kicker · place.address[1].line). 로그에만. */
    readonly path: string,
  ) {
    super(message);
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HREF_RE = /^(\/(?!\/)|https:\/\/|mailto:|tel:)[^\s]*$/i;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** 스키마의 빈 글. 영어 탭을 처음 열 때와 빠진 칸을 채울 때 쓴다. */
export function emptyContent(fields: PageField[]): Obj {
  const out: Obj = {};
  for (const f of fields) out[f.key] = emptyValue(f);
  return out;
}

function emptyValue(f: PageField): unknown {
  switch (f.type) {
    case 'text':
    case 'textarea':
    case 'richtext':
      return '';
    case 'image':
      return null;
    case 'link':
      return { label: '', href: '' };
    case 'boolean':
      return false;
    case 'select':
      return '';
    case 'list':
      return [];
    case 'group':
      return emptyContent(f.fields);
  }
}

/**
 * 검사한 글의 그림 칸에 치수를 적는다(공개 화면의 <img> 가 width·height 를 가져야 한다).
 * 치수는 미디어 파일의 것이라 저장할 때마다 새로 적는다 — 보낸 값은 검사에서 이미 버렸다.
 */
export function withImageSizes(
  content: Obj,
  sizes: Map<string, { width: number | null; height: number | null }>,
): Obj {
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (!isObj(v)) return v;
    const keys = Object.keys(v);
    if (
      keys.length === 2 &&
      keys.includes('id') &&
      keys.includes('alt') &&
      typeof v.id === 'string' &&
      sizes.has(v.id)
    )
      return { ...v, ...sizes.get(v.id) };
    const out: Obj = {};
    for (const k of keys) out[k] = walk(v[k]);
    return out;
  };
  return walk(content) as Obj;
}

/** 검사 결과. `fileIds` 는 글이 가리키는 그림 — 서비스가 실제로 있는 파일인지 본다. */
export interface CheckedContent {
  content: Obj;
  fileIds: string[];
}

export function checkContent(
  fields: PageField[],
  value: unknown,
): CheckedContent {
  const fileIds: string[] = [];
  const content = checkObject(fields, value, '', '', fileIds);
  return { content, fileIds };
}

function checkObject(
  fields: PageField[],
  value: unknown,
  path: string,
  where: string,
  fileIds: string[],
): Obj {
  if (value !== undefined && value !== null && !isObj(value))
    throw new PageContentError(
      '페이지 내용의 모양이 올바르지 않습니다.',
      path || '(root)',
    );
  const input = (value ?? {}) as Obj;
  const known = new Set(fields.map((f) => f.key));
  for (const k of Object.keys(input))
    if (!known.has(k))
      throw new PageContentError(
        '페이지 내용에 알 수 없는 칸이 있습니다. 화면을 새로 고친 뒤 다시 저장해 주세요.',
        `${path}${path ? '.' : ''}${k}`,
      );
  const out: Obj = {};
  for (const f of fields)
    out[f.key] = checkField(
      f,
      input[f.key],
      `${path}${path ? '.' : ''}${f.key}`,
      where,
      fileIds,
    );
  return out;
}

/** 문구 앞에 붙는 위치 — 「주소」 2번째 항목의 */
const at = (where: string) => (where ? `${where} ` : '');

function checkField(
  f: PageField,
  value: unknown,
  path: string,
  where: string,
  fileIds: string[],
): unknown {
  const name = `${at(where)}「${f.label}」`;
  switch (f.type) {
    case 'text':
    case 'textarea':
    case 'richtext': {
      if (value !== undefined && value !== null && typeof value !== 'string')
        throw new PageContentError(
          `${name} 칸의 값이 올바르지 않습니다.`,
          path,
        );
      let s = typeof value === 'string' ? value : '';
      if (f.type === 'richtext') s = sanitizeRichtext(s);
      else s = s.replace(/\r\n/g, '\n');
      if (f.required && !s.trim())
        throw new PageContentError(`${name} 칸을 입력해 주세요.`, path);
      if (s.length > f.max)
        throw new PageContentError(
          `${name} 칸은 ${f.max}자까지 입력할 수 있습니다.`,
          path,
        );
      if (
        f.type !== 'richtext' &&
        f.pattern &&
        s &&
        !new RegExp(f.pattern).test(s)
      )
        throw new PageContentError(
          f.patternMessage ?? `${name} 칸의 형식이 올바르지 않습니다.`,
          path,
        );
      return s;
    }
    case 'image': {
      if (value === undefined || value === null) {
        if (f.required)
          throw new PageContentError(`${name} 그림을 넣어 주세요.`, path);
        return null;
      }
      if (!isObj(value))
        throw new PageContentError(
          `${name} 그림 값이 올바르지 않습니다.`,
          path,
        );
      const img = value as Partial<ImageValue>;
      const id = img.id ?? null;
      if (id !== null && (typeof id !== 'string' || !UUID_RE.test(id)))
        throw new PageContentError(
          `${name} 그림 값이 올바르지 않습니다.`,
          path,
        );
      const alt = typeof img.alt === 'string' ? img.alt.trim() : '';
      if (alt.length > 200)
        throw new PageContentError(
          `${name}의 대체 글은 200자까지 입력할 수 있습니다.`,
          path,
        );
      if (id === null) {
        if (f.required)
          throw new PageContentError(`${name} 그림을 넣어 주세요.`, path);
        return null;
      }
      fileIds.push(id.toLowerCase());
      return { id: id.toLowerCase(), alt };
    }
    case 'link': {
      const v = (isObj(value) ? value : {}) as Partial<LinkValue>;
      const label = typeof v.label === 'string' ? v.label.trim() : '';
      const href = typeof v.href === 'string' ? v.href.trim() : '';
      if (f.required && (!label || !href))
        throw new PageContentError(
          `${name} 링크의 글자와 주소를 입력해 주세요.`,
          path,
        );
      if (label.length > 80)
        throw new PageContentError(
          `${name} 링크 글자는 80자까지 입력할 수 있습니다.`,
          path,
        );
      if (href && (href.length > 500 || !HREF_RE.test(href)))
        throw new PageContentError(
          `${name} 링크 주소는 /로 시작하는 사이트 주소나 https:// 주소로 적어 주세요.`,
          path,
        );
      return { label, href };
    }
    case 'boolean': {
      if (value === undefined || value === null) return false;
      if (typeof value !== 'boolean')
        throw new PageContentError(
          `${name} 칸의 값이 올바르지 않습니다.`,
          path,
        );
      return value;
    }
    case 'select': {
      const s = typeof value === 'string' ? value : '';
      if (value !== undefined && value !== null && typeof value !== 'string')
        throw new PageContentError(
          `${name} 칸의 값이 올바르지 않습니다.`,
          path,
        );
      if (!s) {
        if (f.required)
          throw new PageContentError(`${name} 칸을 골라 주세요.`, path);
        return '';
      }
      if (!f.options.some((o) => o.value === s))
        throw new PageContentError(
          `${name} 칸은 목록에 있는 값만 고를 수 있습니다.`,
          path,
        );
      return s;
    }
    case 'list': {
      if (value !== undefined && value !== null && !Array.isArray(value))
        throw new PageContentError(
          `${name} 목록 값이 올바르지 않습니다.`,
          path,
        );
      const items = (value ?? []) as unknown[];
      const min = f.min ?? 0;
      if (items.length < min)
        throw new PageContentError(
          `${name} 항목을 ${min}개 이상 넣어 주세요.`,
          path,
        );
      if (items.length > f.max)
        throw new PageContentError(
          `${name} 항목은 ${f.max}개까지 넣을 수 있습니다.`,
          path,
        );
      const checked = items.map((item, i) =>
        checkObject(
          f.item,
          item,
          `${path}[${i}]`,
          `${at(where)}「${f.label}」 ${i + 1}번째 항목의`,
          fileIds,
        ),
      );
      if (f.uniqueBy) {
        const seen = new Set<unknown>();
        for (const [i, item] of checked.entries()) {
          const v = item[f.uniqueBy];
          if (v === '' || v === undefined) continue;
          if (seen.has(v))
            throw new PageContentError(
              `${name} ${i + 1}번째 항목이 앞의 항목과 겹칩니다. 한 번씩만 넣어 주세요.`,
              `${path}[${i}].${f.uniqueBy}`,
            );
          seen.add(v);
        }
      }
      return checked;
    }
    case 'group':
      return checkObject(f.fields, value, path, where, fileIds);
  }
}
