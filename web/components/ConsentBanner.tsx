'use client'

import { useEffect, useState } from 'react'
import { CONSENT_KEY } from '@/lib/analytics'

/**
 * 방문 통계 동의. GTM 이 실릴 때만 뜨고, 한 번 고르면 다시 안 뜬다(localStorage).
 * 스크립트가 꺼진 사람에게는 안 뜬다 — 그때는 통계 태그도 안 실린다.
 * 기본은 거부(SiteScripts 의 consent default). 「동의」하면 analytics_storage 만 허용한다 — 광고용 저장은 계속 거부.
 */
const CSS = `
.dv_consent { position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 9000; max-width: 560px; margin: 0 auto;
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; padding: 16px 18px; border-radius: 14px;
  background: #191f28; color: #e8ecf1; box-shadow: 0 12px 32px rgba(0,0,0,.25); font-size: 14px; line-height: 1.6; word-break: keep-all; }
.dv_consent p { margin: 0; flex: 1 1 260px; }
.dv_consent_act { display: flex; gap: 8px; }
.dv_consent button { min-height: 44px; padding: 0 18px; border-radius: 999px; border: 1px solid #4e5968; background: transparent;
  color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; }
.dv_consent button.is-main { background: #d71920; border-color: #d71920; }
.dv_consent button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
`

type Gtag = (...args: unknown[]) => void

export default function ConsentBanner() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setOpen(true)
    } catch {
      // 저장소를 못 쓰는 창(사생활 보호 등) — 묻지 않고 기본(거부)으로 둔다.
    }
  }, [])
  if (!open) return null

  const choose = (granted: boolean) => {
    try {
      localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied')
    } catch {}
    const gtag = (window as unknown as { gtag?: Gtag }).gtag
    if (granted && gtag) gtag('consent', 'update', { analytics_storage: 'granted' })
    setOpen(false)
  }

  return (
    <div className="dv_consent" role="region" aria-label="방문 통계 동의">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <p>이 사이트는 방문 통계를 위해 쿠키를 씁니다. 동의하시면 Google 애널리틱스가 방문 기록을 모읍니다. 광고에는 쓰지 않습니다.</p>
      <div className="dv_consent_act">
        <button type="button" onClick={() => choose(false)}>거부</button>
        <button type="button" className="is-main" onClick={() => choose(true)}>동의</button>
      </div>
    </div>
  )
}
