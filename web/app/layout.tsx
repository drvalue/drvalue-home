import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { HEADER_CSS, HEADER_JS } from '@/components/headerAssets'
// 새 디자인(머리·발·메인)이 쓰는 꾸밈 도구. 전역 초기화는 빼 두었다 —
// 그 이유는 styles/tw.css 주석에 적었다.
import '@/styles/tw.css'
// 스크롤 등장 효과. 표시(data-rv·data-count)가 없는 장에는 아무 영향이 없다.
import '@/styles/motion.css'
import Reveal from '@/components/Reveal'
import HomeCountUp from '@/app/home/HomeCountUp'
import { SITE_ORIGIN } from '@/lib/seo'
import OrgJsonLd from '@/components/OrgJsonLd'

/**
 * header.php 의 <head> 와 footer.php 의 꼬리 스크립트를 옮긴 것.
 *
 * 외부 의존(jQuery·Swiper·FontAwesome·Pretendard)을 npm 으로 바꾸지 않았다.
 * 지금 CSS 가 그 버전의 클래스에 맞춰져 있어서, 버전을 올리면 눈에 안 띄는
 * 곳부터 어긋난다. 이관이 끝나고 한 번에 정리할 일이다.
 *
 * PHP 의 asset_url() 은 파일 mtime 을 붙여 캐시를 무효화했다. Next 는 자기
 * 번들에만 해시를 붙이고 public/ 은 그대로 내보내므로, css 를 고칠 때는
 * 캐시가 남을 수 있다. 원본을 지울 때 CSS 를 번들로 들여오면 없어지는 문제다.
 */
// theme-color 는 metadata 가 아니라 viewport 로 내보내야 한다(Next 16).
export const viewport: Viewport = {
  themeColor: '#d71920',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  // 페이지마다 제목을 따로 쓴다(lib/seo.ts). 여기 것은 그것이 없을 때만 쓰인다.
  title: '디알밸류 - AI 제조 솔루션',
  description:
    '제조 현장의 언어를 데이터로 통일합니다. MES/ERP 구축, 제조 AI 자동화, LLM/RAG 기반 AI Chat 을 실제 현장에서 운영해 온 디알밸류.',
  metadataBase: new URL(SITE_ORIGIN),
  icons: {
    icon: [
      { url: '/icon/favicon.ico', sizes: 'any' },
      { url: '/icon/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: { url: '/icon/apple-touch-icon.png', sizes: '180x180' },
  },
  manifest: '/icon/site.webmanifest',
}

const GTM_ID = 'GTM-NLL3QGRF'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="/css/style.css" />
        <link rel="stylesheet" href="/css/header.css" />
        <link rel="stylesheet" href="/css/footer.css" />
        {/* header.php 의 인라인 <style>. 원본이 "우선순위 강제를 위해 상단 배치"
            라고 적어 둔 것이라 링크들 뒤에 그대로 둔다. */}
        <style dangerouslySetInnerHTML={{ __html: HEADER_CSS }} />
        <OrgJsonLd />
        {/* 숨김 장 patent_old 의 AOS 등장 효과는 스크립트가 없으면 내용을 숨긴 채 둔다. 여기서 켠다. */}
        <noscript>
          <style>{`[data-aos]{opacity:1!important;transform:none!important;pointer-events:auto!important}`}</style>
        </noscript>
      </head>
      {/* 확장 프로그램이 <body> 에 속성을 심어 놓고(예: ColorZilla 의
          cz-shortcut-listen) React 가 그것을 "서버와 다르다" 고 경고한다.
          우리 마크업이 아니고 고칠 수도 없다. 여기서만 그 경고를 끈다 —
          안쪽 내용의 불일치는 그대로 잡힌다. */}
      <body suppressHydrationWarning>
        {/* Google Tag Manager (noscript) — PHP 와 같은 자리에 둔다. */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {children}
        <HomeCountUp />
        <Reveal />

        {/* PHP 는 <head> 에서 동기 로드했다. beforeInteractive 로 순서를 맞춘다 —
            푸터 스크립트가 $ 와 Swiper 를 쓰기 때문이다. */}
        <Script
          src="https://code.jquery.com/jquery-3.6.0.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js"
          strategy="beforeInteractive"
        />
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
      </body>
    </html>
  )
}
