'use client'

import { useEffect, useState } from 'react'
import { CONSENT_KEY } from '@/lib/analytics'

/**
 * 방문 통계 동의. GTM 이 실릴 때만 뜨고, 한 번 고르면 다시 안 뜬다(localStorage).
 * 스크립트가 꺼진 사람에게는 안 뜬다 — 그때는 통계 태그도 안 실린다.
 * 기본은 거부(SiteScripts 의 consent default). 「허용」하면 analytics_storage 만 허용한다 — 광고용 저장은 계속 거부.
 */
// 2026-09-28 사용자: 가운데 아래 검은 띠가 글을 가려 불편하다 — 왼쪽 아래 작은 흰 카드로 옮긴다
// (오른쪽 아래는 채팅 위젯과 맨 위·아래 단추 자리). 폰에서는 아래 한 줄로 붙인다.
// z-index: growchat 위젯(2147483646)이 폰에서 오른쪽 「허용·거부」 단추를 덮어 못 끄던 것 — 위젯보다 위(최댓값)에 둔다.
const CSS = `
.dv_consent { position: fixed; left: 24px; bottom: 24px; z-index: 2147483647; width: 340px; max-width: calc(100vw - 48px);
  padding: 16px 16px 14px; border: 1px solid #e5e8eb; border-radius: 12px; background: #fff; color: #333d4b;
  box-shadow: 0 8px 24px rgba(21,34,56,.12); font-size: 13.5px; line-height: 1.6; word-break: keep-all; }
.dv_consent p { margin: 0 0 12px; }
.dv_consent_act { display: flex; justify-content: flex-end; gap: 8px; }
.dv_consent button { min-height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid #d1d6db; background: #fff;
  color: #333d4b; font-weight: 600; font-size: 13.5px; cursor: pointer; }
.dv_consent button:hover { background: #f2f4f6; }
.dv_consent button.is-main { background: #191f28; border-color: #191f28; color: #fff; }
.dv_consent button:focus-visible { outline: 2px solid #191f28; outline-offset: 2px; }
@media (max-width: 640px) {
  .dv_consent { left: 12px; right: 12px; bottom: 12px; width: auto; max-width: none; display: flex; align-items: center; gap: 12px; padding: 12px 12px 12px 14px; }
  .dv_consent p { flex: 1; margin: 0; font-size: 12.5px; }
  .dv_consent_act { flex-direction: column; gap: 6px; }
}
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
      <p>사이트 이용 통계를 위해 쿠키를 사용합니다. 광고 목적으로는 쓰지 않습니다.</p>
      <div className="dv_consent_act">
        <button type="button" onClick={() => choose(false)}>거부</button>
        <button type="button" className="is-main" onClick={() => choose(true)}>허용</button>
      </div>
    </div>
  )
}
