import { Fragment } from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import Script from 'next/script'

/**
 * /page/tech/patent_old.php 를 옮긴 것.
 *
 * 주소에서 `.php` 를 뺐다. 옛 주소는 lib/phpRoutes.mjs 의 목록대로 308 로
 * 넘어오므로 검색에 쌓인 것을 잃지 않는다.
 *
 * 페이지 전용 CSS 는 원본의 <style> 블록을 문자열로 들고 있다. 파일로 빼면
 * 로드 순서가 바뀌어 우선순위가 달라진다. 이관 판정이 끝난 뒤에 정리한다.
 */

const PATH = '/page/tech/patent_old'

const FEATURE_LIST = [
  { 'title': 'SaaS · 마이크로서비스', 'badge': '특허 3건', 'desc': '마이크로서비스 아키텍처를 활용한 SaaS 서비스 제공·제공방법·통합관리 시스템 특허로, 클라우드 네이티브 웹 플랫폼을 안정적으로 구축·확장합니다.', 'icon': '<svg width="46" height="46" viewBox="0 0 46 46" fill="none"><rect x="7" y="8" width="32" height="9" rx="2.8" stroke="#191f28" stroke-width="2.5"/><rect x="7" y="18.5" width="32" height="9" rx="2.8" stroke="#F26F21" stroke-width="2.5"/><rect x="7" y="29" width="32" height="9" rx="2.8" stroke="#191f28" stroke-width="2.5"/><circle cx="12.5" cy="12.5" r="1.6" fill="#F26F21"/><circle cx="12.5" cy="23" r="1.6" fill="#191f28"/><circle cx="12.5" cy="33.5" r="1.6" fill="#F26F21"/></svg>' },
  { 'title': 'AI 에이전트', 'badge': '특허', 'desc': 'AI 에이전트를 활용한 도면인식 기반 BOM·공정 자동매칭 특허로, 사람이 하던 제조 관리 업무를 OCR·LLM 기반으로 자동화합니다.', 'icon': '<svg width="46" height="46" viewBox="0 0 46 46" fill="none"><line x1="23" y1="16" x2="23" y2="10" stroke="#191f28" stroke-width="2.5"/><circle cx="23" cy="8.5" r="2.6" fill="#F26F21"/><rect x="10" y="16" width="26" height="20" rx="6" stroke="#191f28" stroke-width="2.5"/><line x1="10" y1="25" x2="6.5" y2="25" stroke="#191f28" stroke-width="2.5" stroke-linecap="round"/><line x1="36" y1="25" x2="39.5" y2="25" stroke="#191f28" stroke-width="2.5" stroke-linecap="round"/><circle cx="18" cy="24.5" r="2" fill="#F26F21"/><circle cx="28" cy="24.5" r="2" fill="#F26F21"/><path d="M19 30.5 q4 2.6 8 0" stroke="#191f28" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>' },
  { 'title': 'AI 온톨로지', 'badge': '특허 2건', 'desc': '인공지능 모델 기반 건축 분야 온톨로지 구축과 도면인식 결과 검증 특허로, AI 답변의 근거와 정확도를 높입니다.', 'icon': '<svg width="46" height="46" viewBox="0 0 46 46" fill="none"><line x1="23" y1="23" x2="23" y2="11.3" stroke="#191f28" stroke-width="2.5"/><line x1="23" y1="23" x2="13" y2="29" stroke="#191f28" stroke-width="2.5"/><line x1="23" y1="23" x2="33" y2="29" stroke="#191f28" stroke-width="2.5"/><circle cx="23" cy="23" r="2.6" fill="#fff" stroke="#191f28" stroke-width="2.2"/><circle cx="23" cy="11.3" r="3.8" fill="#fff" stroke="#F26F21" stroke-width="2.5"/><circle cx="13" cy="29" r="3.8" fill="#fff" stroke="#191f28" stroke-width="2.5"/><circle cx="33" cy="29" r="3.8" fill="#fff" stroke="#191f28" stroke-width="2.5"/></svg>' },
  { 'title': '하이브리드 LLM', 'badge': '저작권·운영', 'desc': 'AI 하이브리드 LLM 기반 클라우드 MES 등 프로그램 저작권을 보유하고, LLM·RAG 기반 한건(한국건축) Chat 서비스를 상용 운영합니다.', 'icon': '<svg width="46" height="46" viewBox="0 0 46 46" fill="none"><path d="M11.5 8H34.5a3.5 3.5 0 0 1 3.5 3.5V24.5a3.5 3.5 0 0 1-3.5 3.5H21l-6 6v-6h-3.5a3.5 3.5 0 0 1-3.5-3.5V11.5A3.5 3.5 0 0 1 11.5 8z" stroke="#191f28" stroke-width="2.5" stroke-linejoin="round"/><line x1="15" y1="15.5" x2="27" y2="15.5" stroke="#F26F21" stroke-width="2.5" stroke-linecap="round"/><line x1="15" y1="21.5" x2="24" y2="21.5" stroke="#F26F21" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="18.5" r="1.9" fill="#F26F21"/></svg>' },
] as const

const PAGE_CSS = `
#toss_tech_patent { margin-top: 80px; color: #191f28; font-family: 'Pretendard', sans-serif; overflow-x: hidden; }
    .t_inner { max-width: 1280px; margin: 0 auto; padding: 0 20px; width: 100%; }
    .section_padding { padding: 120px 0; background: #f4f6f8; }

    /* 1. 메인 히어로 섹션 (location.php와 동일한 골조) */
    .hero_sub_banner {
        position: relative;
        height: 320px;
        background: url('/opt/main_bg_02.jpg') no-repeat center center / cover;
        display: flex;
        align-items: center;
        background-color: #191f28;
    }
    .hero_sub_banner::before {
        content:''; position:absolute; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.5); z-index: 1;
    }
    .hero_sub_banner .hero_text { position: relative; z-index: 2; color: #fff; }
    .hero_sub_banner h2 { font-size: 42px; font-weight: 800; line-height: 1.2; letter-spacing: -1.5px; margin: 0; }

    /* 2. 개요 */
    .cert_head { text-align: center; margin-bottom: 70px; }
    .cert_head span { color: #d71920; font-weight: 800; font-size: 16px; display: block; margin-bottom: 20px; }
    .cert_head h3 { font-size: 42px; font-weight: 800; letter-spacing: -1px; }

    /* 3. 기술 카테고리 카드 그리드 (2 x 2) */
    .feat_grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
    .feat_card {
        background: #fff; border-radius: 20px; padding: 44px 40px;
        box-shadow: 0 6px 24px rgba(0,0,0,0.05); transition: 0.3s;
        border: 1px solid #eef0f3; display: flex; flex-direction: column;
    }
    .feat_card:hover { transform: translateY(-8px); box-shadow: 0 22px 44px rgba(0,0,0,0.09); }
    .feat_ico { margin-bottom: 28px; line-height: 0; }
    .feat_titlebox { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
    .feat_title { font-size: 24px; font-weight: 800; color: #191f28; letter-spacing: -0.5px; }
    .feat_badge {
        display: inline-block; background: #ffe7d9; color: #f26f21;
        font-size: 13px; font-weight: 700; padding: 5px 13px; border-radius: 8px; white-space: nowrap;
    }
    .feat_desc { font-size: 16px; color: #6b7280; line-height: 1.75; word-break: keep-all; margin: 0; }

    /* 반응형 */
    @media (max-width: 900px) {
        .hero_sub_banner h2 { font-size: 24px; }
        .cert_head h3 { font-size: 30px; }
        .feat_grid { grid-template-columns: 1fr; gap: 20px; }
        .feat_card { padding: 34px 28px; }
        .feat_title { font-size: 21px; }
    }
`

export default function Page() {
  return (
    <>
      <SiteHeader currentPath={PATH} />

<link rel="stylesheet" href="https://unpkg.com/aos@next/dist/aos.css" />

<style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

<div id="toss_tech_patent">
    <section className="hero_sub_banner">
        <div className="t_inner">
            <div className="hero_text" data-aos="fade-up">
                <h1>디알밸류의 특허 등록 및 출원,<br />디알밸류의 기술력입니다.</h1>
            </div>
        </div>
    </section>

    <Breadcrumb currentPath={PATH} />

    <section className="section_padding">
        <div className="t_inner">
            <div className="cert_head" data-aos="fade-up">
                <span>PATENT</span>
                <h3>특허 등록 및 출원</h3>
            </div>

            <div className="feat_grid">
                {FEATURE_LIST.map((ft, i) => (<Fragment key={i}>
                <div className="feat_card" data-aos="fade-up" data-aos-delay={(i % 2) * 100}>
                    <div className="feat_ico" dangerouslySetInnerHTML={{ __html: ft['icon'] }} />
                    <div className="feat_titlebox">
                        <span className="feat_title">{ft['title']}</span>
                        <span className="feat_badge">{ft['badge']}</span>
                    </div>
                    <p className="feat_desc">{ft['desc']}</p>
                </div>
                </Fragment>))}
            </div>
        </div>
    </section>
</div>

      <Script src="https://unpkg.com/aos@next/dist/aos.js" strategy="afterInteractive" />
      <Script id="page-script-1" strategy="afterInteractive">{`
$(function(){
        AOS.init({ duration: 1000, once: true });
    });
      `}</Script>

      <SiteFooter />
    </>
  )
}
