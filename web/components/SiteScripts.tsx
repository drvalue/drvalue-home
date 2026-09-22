'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { HEADER_JS } from '@/components/headerAssets'

const GTM_ID = 'GTM-NLL3QGRF'

/**
 * 공개 화면에만 싣는 스크립트 — GTM · 헤더 동작 · 등장/슬라이더 · growchat 위젯.
 * /admin 아래에서는 아무것도 싣지 않는다. 관리 화면에 방문자 통계와 채팅 위젯이
 * 붙으면 안 되고, 헤더 스크립트는 거기 없는 마크업을 찾는다.
 * jQuery·Swiper 는 beforeInteractive 라 루트 레이아웃에 남아 있다.
 */
export default function SiteScripts() {
  const pathname = usePathname()
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return null
  return (
    <>
      <Script id="gtm" strategy="afterInteractive">{`
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
      `}</Script>
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

    if($('.main_slider').length > 0) {
        new Swiper(".main_slider", {
            effect: "fade",
            loop: true,
            autoplay: { delay: 5000 },
            speed: 1500
        });
    }
});
      `}</Script>
      <Script
        src="https://workspace.growchat.co.kr/widget.js"
        data-tenant="drvalue"
        strategy="afterInteractive"
      />
    </>
  )
}
