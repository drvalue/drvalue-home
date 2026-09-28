'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminFetch, adminJson } from '@/lib/admin'
import { when } from '@/lib/admin-extra'
import { useLeaveGuard } from '../ui/leave'
import { useToast } from '../ui/toast'
import type * as Api from '@/lib/api-types.gen'
import type { ApiBody, ApiResponse } from '@/lib/api-types.gen'

/** 설정 + IndexNow 상태 — 모양은 api 문서의 것(lib/api-types.gen.ts). */
type Settings = Api.ControllerSearchSettingsDefaultResponseDto
type Form = ApiBody<'PUT /api/admin/search-settings'> & {
  naver_site_verification: string
  google_site_verification: string
  bing_site_verification: string
}
type CodeKey = 'naver_site_verification' | 'google_site_verification' | 'bing_site_verification'

/** api 의 VERIFICATION_CODE_RE 와 같다. 보내기 전에 칸을 짚으려고 여기서도 본다(규칙의 정본은 api). */
const CODE_RE = /^(?:[A-Za-z0-9_=:.-]{1,120})?$/

const CODES: { key: CodeKey; label: string; help: string; placeholder: string }[] = [
  {
    key: 'naver_site_verification',
    label: '네이버 확인 코드',
    help: '네이버 서치어드바이저 › 사이트 등록 › HTML 태그에서 content 따옴표 안의 값을 붙여 넣습니다.',
    placeholder: '예: 0123456789abcdef0123456789abcdef01234567',
  },
  {
    key: 'google_site_verification',
    label: '구글 확인 코드',
    help: '구글 서치 콘솔 › 속성 추가(URL 접두어) › 다른 확인 방법 › HTML 태그에서 content 값을 붙여 넣습니다.',
    placeholder: '예: AbCdEf-0123456789_AbCdEf0123456789AbCdEf012',
  },
  {
    key: 'bing_site_verification',
    label: '빙 확인 코드',
    help: '빙 웹마스터 도구 › 사이트 추가 › HTML 메타 태그(msvalidate.01)에서 content 값을 붙여 넣습니다.',
    placeholder: '예: 0123456789ABCDEF0123456789ABCDEF',
  },
]

const LINKS: { href: string; name: string; what: string }[] = [
  { href: '/robots.txt', name: 'robots.txt', what: '검색엔진·AI 봇에게 읽어도 되는 곳을 알립니다. 위 스위치가 여기에 반영됩니다.' },
  { href: '/sitemap.xml', name: 'sitemap.xml', what: '검색엔진에 제출하는 사이트 주소 목록입니다.' },
  { href: '/rss.xml', name: 'rss.xml', what: '새 글 목록입니다. 네이버 서치어드바이저에 RSS 로 제출합니다.' },
  { href: '/llms.txt', name: 'llms.txt', what: 'AI 답변 엔진용 사이트 요약입니다.' },
]

/** 태그째 붙여 넣으면 content 값만 남긴다. 앞뒤 공백도 걷는다. */
function cleanCode(v: string): string {
  const m = /content\s*=\s*["']([^"']*)["']/i.exec(v)
  return (m ? m[1] : v).trim()
}

function toForm(s: Settings): Form {
  return {
    naver_site_verification: s.naver_site_verification ?? '',
    google_site_verification: s.google_site_verification ?? '',
    bing_site_verification: s.bing_site_verification ?? '',
    ai_search_allowed: s.ai_search_allowed,
    ai_training_allowed: s.ai_training_allowed,
  }
}

/**
 * 「SEO」 아래 구역 — 검색엔진 소유 확인 코드 · AI 봇 스위치 둘 · IndexNow 상태 · 공개 파일 링크.
 * 장별 검색 정보와 저장이 따로다(이탈 경고는 page.tsx 의 LeaveGroup 이 둘을 모은다).
 */
export default function EngineSettings() {
  const toast = useToast()
  const { setDirty } = useLeaveGuard()
  const [saved, setSaved] = useState<Settings | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const apply = useCallback((s: Settings) => {
    setSaved(s)
    setForm(toForm(s))
  }, [])

  useEffect(() => {
    adminFetch<ApiResponse<'GET /api/admin/search-settings'>>('/api/admin/search-settings')
      .then((r) => {
        apply(r.data)
        setLoadErr('')
      })
      .catch((e) => setLoadErr((e as Error).message))
  }, [apply])

  const dirty = Boolean(form && saved && JSON.stringify(form) !== JSON.stringify(toForm(saved)))
  useEffect(() => {
    setDirty(dirty)
  }, [dirty, setDirty])
  useEffect(() => () => setDirty(false), [setDirty])

  const bad = (k: CodeKey) => Boolean(form && !CODE_RE.test(form[k]))

  async function save() {
    if (!form) return
    const wrong = CODES.find((c) => bad(c.key))
    if (wrong) {
      setErr(`${wrong.label}는 영문·숫자와 _ - = : . 만 쓸 수 있습니다. content 값만 붙여 넣어 주세요.`)
      document.getElementById(`se-${wrong.key}`)?.focus()
      return
    }
    setBusy(true)
    setErr('')
    try {
      const r = await adminJson<ApiResponse<'PUT /api/admin/search-settings'>>('/api/admin/search-settings', 'PUT', form)
      apply(r.data)
      setDirty(false)
      toast('저장했습니다. 1분 안에 사이트에 반영됩니다.')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const idx = saved?.index_now

  return (
    <section className="dvs_engines" id="engines" aria-labelledby="engines-title">
      <div className="dvs_engines_head">
        <h2 id="engines-title">검색엔진 설정</h2>
        {saved?.updated_on && (
          <p className="dvs_meta">
            마지막 저장 {when(saved.updated_on)}
            {saved.updated_by ? ` · ${saved.updated_by}` : ''}
          </p>
        )}
      </div>
      <p className="dvs_lead">
        검색엔진 소유 확인 코드와 AI 봇의 수집 허용을 정합니다. 사이트 전체에 한 번에 걸리고, 저장하면 1분 안에 반영됩니다.
      </p>
      {loadErr && (
        <div className="dva_error" role="alert">
          {loadErr}
        </div>
      )}
      {!form ? (
        !loadErr && <div className="dva_empty">불러오는 중…</div>
      ) : (
        <div className="dvs_engine_grid">
          <div className="dva_card">
            <h3 className="dvs_card_title">소유 확인 코드</h3>
            {CODES.map((c) => (
              <div key={c.key} className={`dva_field${bad(c.key) ? ' is-invalid' : ''}`}>
                <label htmlFor={`se-${c.key}`} className="dva_label">
                  {c.label}
                </label>
                <input
                  id={`se-${c.key}`}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={400}
                  value={form[c.key]}
                  placeholder={c.placeholder}
                  aria-describedby={`se-${c.key}-help`}
                  aria-invalid={bad(c.key) || undefined}
                  onChange={(e) => setForm({ ...form, [c.key]: cleanCode(e.target.value) })}
                />
                <small id={`se-${c.key}-help`}>{c.help}</small>
              </div>
            ))}
            <small className="dva_hint">
              meta 태그를 통째로 붙여 넣어도 content 값만 남깁니다. 비워 두면 서버에 따로 넣어 둔 값이 있을 때 그 값이 나갑니다.
            </small>
          </div>

          <div className="dva_card">
            <h3 className="dvs_card_title">AI 봇 수집</h3>
            <label className="dvs_switch">
              <input
                type="checkbox"
                role="switch"
                checked={form.ai_search_allowed}
                aria-describedby="se-ai-search-help"
                onChange={(e) => setForm({ ...form, ai_search_allowed: e.target.checked })}
              />
              <span className="dvs_switch_track" aria-hidden="true" />
              <span className="dvs_switch_text">
                AI 검색 답변 허용 <b>{form.ai_search_allowed ? '켜짐' : '꺼짐'}</b>
              </span>
            </label>
            <small id="se-ai-search-help" className="dvs_switch_help">
              ChatGPT·Claude·Perplexity 가 질문에 답할 때 이 사이트를 읽고 인용하게 둡니다. 끄면 ChatGPT·Claude·Perplexity 검색
              답변에서 빠집니다. 네이버·다음·빙·구글 검색 노출에는 영향이 없습니다.
            </small>
            <label className="dvs_switch">
              <input
                type="checkbox"
                role="switch"
                checked={form.ai_training_allowed}
                aria-describedby="se-ai-train-help"
                onChange={(e) => setForm({ ...form, ai_training_allowed: e.target.checked })}
              />
              <span className="dvs_switch_track" aria-hidden="true" />
              <span className="dvs_switch_text">
                AI 학습 수집 허용 <b>{form.ai_training_allowed ? '켜짐' : '꺼짐'}</b>
              </span>
            </label>
            <small id="se-ai-train-help" className="dvs_switch_help">
              AI 회사가 모델 학습용으로 사이트 글을 모으는 것을 허용합니다. 끄면 AI 학습용 수집을 막습니다. 검색 노출에는 영향이
              없습니다.
            </small>
          </div>

          <div className="dva_card">
            <div className="dvs_card_row">
              <h3 className="dvs_card_title">IndexNow</h3>
              <span className={`dva_pill ${idx?.enabled ? 'is-published' : 'is-draft'}`}>{idx?.enabled ? '켜짐' : '꺼짐'}</span>
            </div>
            <small className="dva_hint">
              글·페이지·검색 정보를 저장하면 바뀐 주소를 빙·네이버에 바로 알려 더 빨리 다시 읽어 가게 합니다.
            </small>
            {!idx?.enabled && <p className="dvs_warn">서버 .env 에 INDEXNOW_KEY 가 필요합니다.</p>}
            <div className="dvs_table_wrap">
              <table className="dva_table">
                <caption className="dva_sr">최근 IndexNow 보내기</caption>
                <thead>
                  <tr>
                    <th scope="col">보낸 시각</th>
                    <th scope="col">주소 수</th>
                    <th scope="col">결과</th>
                  </tr>
                </thead>
                <tbody>
                  {(idx?.recent ?? []).map((r, i) => (
                    <tr key={`${r.at}-${i}`}>
                      <td>{when(r.at)}</td>
                      <td className="is-num">{r.url_count}</td>
                      <td>
                        <span className={`dva_pill ${r.status === 'ok' ? 'is-published' : 'is-gone'}`}>
                          {r.status === 'ok' ? '보냄' : '실패'}
                        </span>{' '}
                        {r.http_status ?? '응답 없음'}
                      </td>
                    </tr>
                  ))}
                  {!idx?.recent.length && (
                    <tr>
                      <td colSpan={3} className="dvs_table_empty">
                        서버를 띄운 뒤로 보낸 기록이 없습니다. 기록은 최근 20건까지 서버 메모리에만 남습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dva_card">
            <h3 className="dvs_card_title">공개 파일</h3>
            <ul className="dvs_links">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noreferrer">
                    {l.name}
                    <span className="dva_sr"> (새 탭에서 열림)</span>
                  </a>
                  <small>{l.what}</small>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {err && (
        <div className="dva_error" role="alert">
          {err}
        </div>
      )}
      {form && (
        <div className="dvs_actions">
          <button type="button" className="dva_btn is-primary" disabled={busy || !dirty} onClick={save}>
            {busy ? '저장하는 중…' : '검색엔진 설정 저장'}
          </button>
          {dirty && !busy && <span className="dva_hint">저장하지 않은 변경이 있습니다.</span>}
        </div>
      )}
    </section>
  )
}
