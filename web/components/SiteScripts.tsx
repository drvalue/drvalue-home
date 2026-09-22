'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HEADER_JS } from '@/components/headerAssets'
import ConsentBanner from '@/components/ConsentBanner'
import { JQUERY_SRC } from '@/lib/analytics'

/**
 * 공개 화면에만 싣는 스크립트 — GTM(+동의) · 헤더 동작 · 등장/슬라이더 · growchat 위젯.
 * /admin 아래에서는 아무것도 싣지 않는다. 관리 화면에 방문자 통계와 채팅 위젯이
 * 붙으면 안 되고, 헤더 스크립트는 거기 없는 마크업을 찾는다.
 *
 * jQuery·Swiper 는 루트 레이아웃이 beforeInteractive 로 싣는다. 그런데 없는 주소(notFound)로
 * 그린 장에는 Next 가 beforeInteractive 를 넣지 않는다(실측: 404 HTML 의 __next_s 0건) — 그러면
 * 아래 인라인 스크립트가 `$ is not defined` 를 두 번 냈다. 그래서 jQuery 가 없으면 여기서 싣고,
 * jQuery 를 쓰는 스크립트는 jQuery 가 준비된 뒤에만 건다.
 *
 * `gtmId` 는 루트 레이아웃(서버)이 정한다 — 없으면(빌드에 값이 없거나 미리보기) 통계 태그·동의 창 모두 없다.
 */
export default function SiteScripts({ gtmId }: { gtmId: string | null }) {
  const pathname = usePathname()
  const [jq, setJq] = useState(false)
  useEffect(() => {
    if ((window as unknown as { jQuery?: unknown }).jQuery) setJq(true)
  }, [])
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return null
  return (
    <>
      {gtmId && (
        <>
          {/* 동의 모드 v2: 기본은 거부. 방문자가 「동의」하면 ConsentBanner 가 analytics 만 허용으로 바꾼다.
              이 줄이 GTM 보다 먼저 dataLayer 에 들어가야 한다. */}
          <Script id="consent-default" strategy="afterInteractive">{`
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
try{if(localStorage.getItem('dv_consent')==='granted'){gtag('consent','update',{analytics_storage:'granted'});}}catch(e){}
          `}</Script>
          <Script id="gtm" strategy="afterInteractive">{`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');
          `}</Script>
          <ConsentBanner />
        </>
      )}
      {!jq && <Script src={JQUERY_SRC} strategy="afterInteractive" onLoad={() => setJq(true)} />}
      {jq && (
        <>
          {/* 마크업의 onclick 이 부르는 전역 함수들. jQuery 뒤에 와야 한다. */}
          <Script id="header-behaviour" strategy="afterInteractive">{HEADER_JS}</Script>
          <Script id="reveal-and-slider" strategy="afterInteractive">{`
$(document).ready(function() {
    function reveal() {
        var winBottom = $(window).scrollTop() + $(window).height();
        $('.reveal, .hero_reveal').each(function() {
            if (winBottom > $(this).offset().top + 50) $(this).addClass('active');
        });
    }
    $(window).scroll(reveal);
    reveal();

    if($('.main_slider').length > 0 && typeof Swiper !== 'undefined') {
        new Swiper(".main_slider", {
            effect: "fade",
            loop: true,
            autoplay: { delay: 5000 },
            speed: 1500
        });
    }
});
          `}</Script>
        </>
      )}
      <Script
        src="https://workspace.growchat.co.kr/widget.js"
        data-tenant="drvalue"
        strategy="afterInteractive"
      />
    </>
  )
}
