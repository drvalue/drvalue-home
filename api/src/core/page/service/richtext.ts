// CommonJS 모듈(module.exports = 함수)이고 esModuleInterop 이 꺼져 있다 — default import 는 undefined 가 된다.
import sanitizeHtml = require('sanitize-html');

/**
 * 편집기(Quill) 가 만드는 HTML 만 남긴다. 스크립트·이벤트 속성·style·iframe 은 버린다.
 * 그림은 우리 파일(/api/content/assets/<uuid>)과 https 만, 링크는 http(s)·mailto·tel·상대 주소만.
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
  // 정렬(ql-align-*)과 목록 표시(ql-indent-*)만. 다른 class 는 버린다.
  allowedClasses: {
    '*': [
      'ql-align-center',
      'ql-align-right',
      'ql-align-justify',
      /^ql-indent-\d$/,
    ],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['https'] },
  allowProtocolRelative: false,
  transformTags: {
    // 새 창 링크는 opener 를 끊는다.
    a: (tagName, attribs) => ({
      tagName,
      attribs:
        attribs.target === '_blank'
          ? { ...attribs, rel: 'noopener noreferrer' }
          : attribs,
    }),
  },
  exclusiveFilter: (frame) =>
    frame.tag === 'img' &&
    !/^(https:\/\/|\/api\/content\/assets\/[0-9a-f-]{36}$)/i.test(
      frame.attribs.src ?? '',
    ),
};

export function sanitizeRichtext(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim();
}
