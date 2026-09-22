// CommonJS 모듈(module.exports = 함수)이고 esModuleInterop 이 꺼져 있다 — default import 는 undefined 가 된다.
import sanitizeHtml = require('sanitize-html');

/**
 * 사이트에 이미 있는 그림(web/public 아래). 폴더를 좁혀 두고 `..` 를 막는다.
 * 개인정보가 찍힌 증서 원본(patent2·patent3)은 가리키지 못한다.
 */
export const SITE_IMAGE_PATH_RE =
  /^\/(screens|photo|brand|img|icon|images)\/[A-Za-z0-9._\-/]+\.(png|jpe?g|webp|gif|svg)$/i;
export const BLOCKED_SITE_IMAGE_RE = /(^|\/)patent[23]\.png$/i;

const ASSET_SRC_RE =
  /^\/api\/content\/assets\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 본문 그림으로 받는 주소: 우리 파일(관문을 거친다)과 사이트에 이미 있는 그림. 바깥 주소는 안 받는다. */
export function isAllowedImageSrc(src: string): boolean {
  if (ASSET_SRC_RE.test(src)) return true;
  return (
    SITE_IMAGE_PATH_RE.test(src) &&
    !src.includes('..') &&
    !BLOCKED_SITE_IMAGE_RE.test(src)
  );
}

/**
 * 편집기(Quill) 가 만드는 HTML 만 남긴다. 스크립트·이벤트 속성·style·iframe 은 버린다.
 * 링크는 http(s)·mailto·tel·상대 주소만, 새 창 링크는 opener 를 끊는다.
 *
 * 엔티티는 풀어서 본다(decodeEntities 기본값). 끄면 `jav&#x61;script:` 같은 링크가 주소 검사를
 * 지나간다 — 실측으로 확인했다. 대신 편집기 글이 바이트 그대로 돌아오도록 두 가지만 되돌린다:
 * 풀린 NBSP 를 `&nbsp;` 로(글자 칸에서만, 이스케이프 뒤라 안전), `<br />`·`<img … />` 를 편집기 모양으로.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'h2',
    'h3',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'ol',
    'ul',
    'li',
    'blockquote',
    'a',
    'img',
    'span',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    li: ['data-list'],
    '*': ['class'],
  },
  // 정렬(ql-align-*)과 목록 들여쓰기(ql-indent-*)만. 다른 class 는 버린다.
  allowedClasses: {
    '*': [
      'ql-align-center',
      'ql-align-right',
      'ql-align-justify',
      /^ql-indent-\d$/,
    ],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  // 그림 주소는 아래 exclusiveFilter 가 경로로만 거른다(스킴이 붙은 주소는 받지 않는다).
  allowedSchemesByTag: { img: [] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs:
        attribs.target === '_blank'
          ? { ...attribs, rel: 'noopener noreferrer' }
          : attribs,
    }),
  },
  exclusiveFilter: (frame) =>
    frame.tag === 'img' && !isAllowedImageSrc(frame.attribs.src ?? ''),
  textFilter: (text) => text.replace(/ /g, '&nbsp;'),
};

/** 편집기 HTML 하나를 다듬는다(페이지 글의 richtext 칸 · 게시판 본문 공용). */
export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS).replace(
    /<(br|img)([^>]*?) \/>/g,
    '<$1$2>',
  );
}

/** `<` 뒤에 글자·!·/·? 가 오면 태그로 읽힐 수 있다. 없으면 맨 글자다. */
const LOOKS_LIKE_HTML = /<[a-z!/?]/i;

/**
 * 게시판 본문. 옛 글은 태그 없는 맨 글자도 있다 — 그대로 둔다(화면이 이스케이프하고 줄바꿈을 살린다).
 * 태그가 섞이면 편집기 규칙으로 다듬는다. 저장할 때와 공개로 낼 때 둘 다 부른다.
 */
export function sanitizeBody(body: string | null | undefined): string | null {
  if (body === null || body === undefined) return null;
  if (!LOOKS_LIKE_HTML.test(body)) return body;
  return sanitizeRichHtml(body);
}
