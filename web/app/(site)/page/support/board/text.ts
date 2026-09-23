/** 게시판 본문을 서버에서 다듬는 함수들. 예전에는 브라우저 스크립트가 하던 일이다. */

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c])

const URL_RE = /https?:\/\/[^\s<]+/g

/** 이스케이프된 글 안의 http(s) 주소를 새 창 링크로. 끝 문장부호는 링크에서 뺀다. */
function linkifyText(escaped: string): string {
  return escaped.replace(URL_RE, (m) => {
    const trail = /[)\].,;!?]+$/.exec(m)?.[0] ?? ''
    const url = trail ? m.slice(0, -trail.length) : m
    // 주소에 든 따옴표만 막는다. 소독기는 텍스트의 &<> 만 되돌리고 " 는 날것으로 두며,
    // URL_RE 도 " 를 안 거른다 — 그대로 꽂으면 href 가 일찍 닫혀 뒤가 속성이 된다(실측: onfocus 가 붙었다).
    // escapeHtml 로 넓히면 안 된다: 두 갈래 다 이미 & 가 엔티티라 &amp; 가 &amp;amp; 가 된다.
    const attr = url.replace(/"/g, '&quot;')
    return `<a href="${attr}" target="_blank" rel="noopener noreferrer" class="dv_art_link">${url}</a>${trail}`
  })
}

/**
 * 본문을 화면에 넣을 HTML 로. 관리 화면 편집기가 만든 글은 이미 HTML 이다 — 그 안에서
 * 태그 밖 글자에 남은 맨 주소만 눌리게 만든다(<a> 안과 태그 속성은 안 건드린다).
 * 옛 글처럼 맨 글자면 이스케이프하고 줄바꿈을 살린다.
 */
export function bodyHtml(body: string | null | undefined): string {
  const s = body ?? ''
  if (!/<[a-z][\s\S]*>/i.test(s)) return s.trim() ? `<p>${linkifyText(escapeHtml(s)).replace(/\n/g, '<br>')}</p>` : ''
  let inAnchor = 0
  return s
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith('<')) {
        if (/^<a[\s>]/i.test(part)) inAnchor++
        else if (/^<\/a>/i.test(part)) inAnchor = Math.max(0, inAnchor - 1)
        return part
      }
      return inAnchor ? part : linkifyText(part)
    })
    .join('')
}

/** HTML 을 한 줄 글로 — 검색 설명·공유 카드용. 넘치면 말줄임. */
export function plainText(html: string | null | undefined, max = 160): string {
  const t = (html ?? '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/p>|<\/li>|<\/h\d>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + '…'
}

/** '2025-06-10…' → '2025.06.10'. */
export const dotDate = (iso: string | null | undefined) => (iso ?? '').slice(0, 10).replace(/-/g, '.')
