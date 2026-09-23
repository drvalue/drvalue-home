/**
 * bodyHtml 이 만든 <a> 의 href 에 날 따옴표가 살아남지 않는가.
 *
 * 2026-09-23 보안 검토에서 잡혔다: 소독기(sanitize-html)는 텍스트의 &<> 만 엔티티로 되돌리고
 * " 는 날것으로 둔다(decodeEntities 가 켜져 있어 &quot; 도 " 로 푼다). URL_RE 도 " 를 안 거른다.
 * 그래서 본문에 맨 글자로 적은 주소 뒤에 "onfocus=... 를 붙이면 href 가 일찍 닫히고 뒤가 속성이
 * 됐다 — 브라우저에서 실제로 실행됐다(클릭 없이도).
 *
 * 실행: node --test web/app/\(site\)/page/support/board/text.test.mjs
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { bodyHtml, escapeHtml, plainText } from './text.ts'

/**
 * 여는 <a ...> 태그의 속성 이름들. 따옴표 안은 값이라 세지 않는다 —
 * 날 따옴표가 href 를 닫고 나와야 여기 새 이름으로 잡힌다(그게 이 검사가 보는 것이다).
 */
const attrsOf = (html) => {
  const tag = /<a\s([^>]*)>/i.exec(html)?.[1] ?? ''
  return [...tag.matchAll(/([a-zA-Z-]+)\s*=\s*"[^"]*"/g)].map((m) => m[1].toLowerCase())
}
const OURS = ['href', 'target', 'rel', 'class']

test('주소에 든 따옴표가 href 를 닫지 못한다 — 마우스 올림', () => {
  const out = bodyHtml('<p>https://a.b"onmouseover="alert(1)//</p>')
  assert.equal(attrsOf(out).filter((a) => !OURS.includes(a)).length, 0)
  assert.ok(!/onmouseover/i.test(attrsOf(out).join(' ')))
  assert.ok(out.includes('&quot;'), '따옴표는 엔티티로 들어간다')
})

test('클릭 없이 도는 변종도 막힌다 — autofocus · onfocus', () => {
  const out = bodyHtml('<p>https://a.b"onfocus="alert(1)"autofocus="</p>')
  assert.deepEqual(attrsOf(out).filter((a) => !OURS.includes(a)), [])
})

test('맨 글자 본문(옛 글)도 같다', () => {
  const out = bodyHtml('https://a.b"onfocus="alert(1)"autofocus="')
  assert.deepEqual(attrsOf(out).filter((a) => !OURS.includes(a)), [])
})

test('평범한 주소는 그대로 링크가 된다', () => {
  const out = bodyHtml('<p>https://drvalue.co.kr/page/company/intro 입니다.</p>')
  assert.ok(out.includes('href="https://drvalue.co.kr/page/company/intro"'))
  assert.ok(out.includes('target="_blank"'))
  assert.ok(out.includes('rel="noopener noreferrer"'))
})

test('& 가 두 번 이스케이프되지 않는다', () => {
  // 맨 글자 갈래: escapeHtml 이 & 를 &amp; 로 한 번만 바꾼다.
  assert.ok(bodyHtml('a & b').includes('a &amp; b'))
  // HTML 갈래: 소독기가 이미 엔티티로 준 글을 다시 건드리지 않는다.
  const out = bodyHtml('<p>https://a.b/?x=1&amp;y=2</p>')
  assert.ok(out.includes('?x=1&amp;y=2'))
  assert.ok(!out.includes('&amp;amp;'))
})

test('<a> 안의 글자는 건드리지 않는다', () => {
  const out = bodyHtml('<p><a href="https://a.b">https://a.b</a></p>')
  assert.equal((out.match(/<a\s/gi) ?? []).length, 1)
})

test('escapeHtml · plainText 는 그대로', () => {
  assert.equal(escapeHtml('<b>"x"</b>'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;')
  assert.equal(plainText('<p>가 나</p><p>다</p>'), '가 나 다')
})
