import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import CertGrid from '../CertGrid'
import { seoMeta } from '@/lib/seo'
import { cmsBoard, dots, type CmsPost } from '@/lib/cms'

/** CMS 에서 고친 것이 바로 보이게 요청마다 그린다(lib/cms.ts). */
export const dynamic = 'force-dynamic'


/** 증서 그림의 원본 치수. 칸(.cert_img)이 이미 자리를 잡아 주지만, 치수를
 *  안 적으면 그림이 늦게 올 때 브라우저가 높이를 0 으로 잡아 한 번 흔들린다.
 *  실측값이다 — 793×1089. */
const CERT_W = 793
const CERT_H = 1089

/**
 * /page/tech/copyright.php 를 옮긴 것. 2026-09-18 옛 꾸밈(사진 머리 + AOS +
 * jQuery 라이트박스)에서 M.AX 계열과 같은 틀(SolutionShell)로 옮겼다.
 * 글·날짜·종류는 그대로다. 새로 지은 문장은 없다.
 *
 * 주소에서 `.php` 를 뺐다. 옛 주소는 lib/phpRoutes.mjs 의 목록대로 308 로
 * 넘어오므로 검색에 쌓인 것을 잃지 않는다.
 */

const PATH = '/page/tech/copyright'

export const generateMetadata = seoMeta({
  title: '프로그램 저작권',
  description:
    '클라우드 네이티브 SaaS 생산관리시스템, AI 하이브리드 LLM 기반 클라우드 MES 등 디알밸류가 등록한 프로그램 저작권 5건입니다.',
  path: PATH,
})

/**
 * 등록증 원본에서 읽은 값이다. 지어낸 것이 없다.
 *
 * 예전 날짜는 **등록일이 아니었다.** 1·5번은 증명서 발급일(2024.04.07),
 * 2·3·4번은 창작일이 적혀 있었다. 등록증에 적힌 등록연월일로 바로잡고,
 * 창작일은 따로 적는다 — 둘은 다른 날이고 둘 다 뜻이 있다.
 *
 * 종류(분류)도 등록증에 적힌 그대로 옮겼다. 무슨 소프트웨어인지 한 줄로
 * 말해 주는 자리인데 지금까지 화면에 없었다.
 */
const COPYRIGHT_LIST = [
  {
    img: '/img/copyright1.png',
    title: '클라우드 네이티브(CloudNative) 환경의 마이크로 서비스 아키텍처(MSA) 기반 사스(SaaS) 생산관리시스템(MES)',
    kind: '응용프로그램 · 산업용 S/W',
    made: '2024.01.25', reg: '2024.04.04',
  },
  {
    img: '/img/copyright2.png',
    title: '그로우톡',
    kind: '응용프로그램 · 고객관계관리(CRM) S/W',
    made: '2025.09.25', reg: '2025.10.20',
  },
  {
    img: '/img/copyright3.png',
    title: 'AI 하이브리드 LLM 기반 클라우드 MES 와 탄소절감형 제조매칭플랫폼 통합 연계 시스템',
    kind: '응용프로그램 · 사무관리',
    made: '2025.12.31', reg: '2026.03.04',
  },
  {
    img: '/img/copyright4.png',
    title: '차량관제 및 관리 시스템',
    kind: '응용프로그램 · 지리정보시스템(GIS) S/W',
    made: '2024.04.01', reg: '2024.05.02',
  },
  {
    img: '/img/copyright5.png',
    title: '마이크로 서비스 아키텍처(MSA) 기반 제조 입찰 플랫폼',
    kind: '응용프로그램 · 산업용 S/W',
    made: '2024.01.25', reg: '2024.04.04',
  },
] as const

/**
 * 이 장만의 CSS. 특허 장의 CERT_CSS 와 같은 골조다 — 카드 껍데기는 공용
 * .mx_navcard, 증서 칸만 여기서 그린다(.mx_navshot 은 16:9 로 잘라 세로
 * 증서에 못 쓴다). .mx_navcard 의 span 규칙이 #dvmax 없이 걸려 있어 전부
 * #dvmax 를 앞에 붙인다. 템플릿 문자열이다 — 안에 역따옴표를 넣지 않는다.
 */
const CERT_CSS = `
#dvmax .cert_grid { list-style: none; margin: 26px 0 0; padding: 0; }
#dvmax .cert_card { padding-top: 22px; }
#dvmax .cert_open {
  display: block; width: 100%; position: relative; padding: 0; margin: 0; border: 0;
  background: none; font: inherit; cursor: zoom-in; border-radius: 12px; }
#dvmax .cert_open:focus-visible { outline: 3px solid #d71920; outline-offset: 3px; }
#dvmax .cert_img {
  display: flex; align-items: center; justify-content: center; overflow: hidden;
  aspect-ratio: 1 / 1.35; background: #fff; border: 1px solid #e5e8eb; border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0,0,0,.05); }
#dvmax .cert_img img { width: 100%; height: 100%; object-fit: contain; padding: 10px; box-sizing: border-box;
  transition: transform .3s ease; }
#dvmax .cert_card:hover .cert_img img { transform: scale(1.03); }
#dvmax .cert_zoom {
  position: absolute; right: 10px; bottom: 10px; display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 10px; border-radius: 8px; background: rgba(21,34,56,.82); color: #fff;
  font-size: 12.5px; font-weight: 700; opacity: 0; transition: opacity .18s ease; }
#dvmax .cert_open:hover .cert_zoom, #dvmax .cert_open:focus-visible .cert_zoom { opacity: 1; }
#dvmax .cert_title { margin: 0; font-size: 17px; font-weight: 700; color: #191f28; line-height: 1.5; word-break: keep-all; }

/* 무슨 소프트웨어인지. 등록증의 「저작물의 종류」 를 그대로 옮긴 것이다. */
#dvmax .cert_kind {
  display: inline-block; align-self: flex-start; margin-top: 16px; font-size: 12px; font-weight: 700;
  letter-spacing: .02em; color: #3d5a80; background: #eef3f8; border: 1px solid #cfdfe8;
  padding: 3px 9px; border-radius: 4px; line-height: 1.5; }

/* 그림 안 글자는 검색엔진이 못 읽는다. 날짜를 밖으로 뺀다. */
#dvmax .cert_meta {
  display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 3px 14px;
  margin: 10px 0 0; font-size: 13.5px; line-height: 1.5; }
#dvmax .cert_meta dt { color: #8b95a1; font-weight: 600; white-space: nowrap; }
#dvmax .cert_meta dd { margin: 0; color: #4e5968; font-weight: 600; font-variant-numeric: tabular-nums; }

/* 크게 보는 창은 body 로 옮겨 그려서 #dvmax 밖이다. 공용 규칙은 1600 폭
   가로 화면용이라 793 폭 세로 증서를 두 배로 늘린다 — 원래 크기에서 화면
   높이에 맞춘다. */
.dvshot_view .dvshot_body { width: auto; max-width: 100%; }
.dvshot_view .dvshot_body img { width: auto; max-width: 100%; max-height: calc(100vh - 150px); }
/* 좌우 화살표는 공용 규칙에서 float 인데, 칸이 그림 폭으로 줄면 오른쪽 것이
   그림 아래로 떨어져 안 보인다(실측). 그림 양옆 가운데에 고정한다. */
.dvshot_view .dvshot_prev, .dvshot_view .dvshot_next {
  float: none; position: absolute; top: 50%; transform: translateY(-50%); margin: 0; }
.dvshot_view .dvshot_prev { left: 10px; }
.dvshot_view .dvshot_next { right: 10px; }
@media (prefers-reduced-motion: reduce) {
  #dvmax .cert_img img, #dvmax .cert_zoom { transition: none; }
  #dvmax .cert_card:hover .cert_img img { transform: none; }
}
`

/** CMS(게시판 「저작권」)가 우선. COPYRIGHT_LIST 는 CMS 가 안 될 때의 예비. */
type CopyrightCert = { img: string; title: string; kind: string; made: string; reg: string; w: number; h: number }

function fromCms(rows: CmsPost[]): CopyrightCert[] {
  return rows
    .filter((r) => r.thumbnail && r.title)
    .map((r) => ({
      img: r.thumbnail as string,
      title: r.title,
      kind: r.cert_kind ?? '',
      made: dots(r.cert_made_date),
      reg: dots(r.cert_date),
      w: r.thumbnail_size?.w ?? CERT_W,
      h: r.thumbnail_size?.h ?? CERT_H,
    }))
}

function fallback(): CopyrightCert[] {
  return COPYRIGHT_LIST.map((c) => ({ ...c, w: CERT_W, h: CERT_H }))
}

export default async function Page() {
  const rows = await cmsBoard('copyright')
  const list = rows ? fromCms(rows) : fallback()
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: CERT_CSS }} />
      <SolutionShell
        path={PATH}
        kicker="저작권"
        kickerSub="기술력"
        headLead="디알밸류의 프로그램 저작권, "
        headStrong="디알밸류의 기술력입니다."
        desc={`클라우드 네이티브 SaaS 생산관리시스템, AI 하이브리드 LLM 기반 클라우드 MES 등 디알밸류가 등록한 프로그램 저작권 ${list.length}건입니다.`}
        ctaTitle="문의사항이 있으신가요?"
        ctaDesc="프로젝트 문의는 문의하기에서 남길 수 있습니다."
      >
        <h2 className="mx_sec_title">프로그램 저작권</h2>
        <CertGrid
          certs={list.map((cr) => ({
            src: cr.img,
            alt: `${cr.title} 저작권 등록증`,
            w: cr.w,
            h: cr.h,
            open: `${cr.title} 저작권 등록증 크게 보기`,
            body: (
              <>
                {cr.kind && <span className="cert_kind">{cr.kind}</span>}
                <h3 className="cert_title">{cr.title}</h3>
                <dl className="cert_meta">
                  <dt>등록일</dt><dd>{cr.reg}</dd>
                  {cr.made && (<><dt>창작일</dt><dd>{cr.made}</dd></>)}
                </dl>
              </>
            ),
          }))}
        />
      </SolutionShell>
    </>
  )
}
