import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import CertGrid from '../CertGrid'
import { seoMeta } from '@/lib/seo'
import { cmsBoard, dots, type CmsPost } from '@/lib/cms'

/** CMS 에서 고친 것이 바로 보이게 요청마다 그린다(lib/cms.ts). */
export const dynamic = 'force-dynamic'


/** 증서 그림의 원본 치수. 칸(.cert_img)이 이미 자리를 잡아 주지만, 치수를
 *  안 적으면 그림이 늦게 올 때 브라우저가 높이를 0 으로 잡아 한 번 흔들린다.
 *  장마다 다르다(실측): 1번 581×788, 2·3번(출원사실증명원) 793×1120, 4~6번 793×1087.
 *  한 값으로 두면 세 장이 어긋나 흔들린다. 항목의 w·h 를 쓴다. */
const DIMS: Record<string, { w: number; h: number }> = {
  '/img/patent1.png': { w: 581, h: 788 },
  '/img/patent2.png': { w: 793, h: 1120 },
  '/img/patent3.png': { w: 793, h: 1120 },
  '/img/patent4.png': { w: 793, h: 1087 },
  '/img/patent5.png': { w: 793, h: 1087 },
  '/img/patent6.png': { w: 793, h: 1087 },
}

/**
 * /page/tech/patent.php 를 옮긴 것. 2026-09-18 옛 꾸밈(사진 머리 + AOS +
 * jQuery 라이트박스)에서 M.AX 계열과 같은 틀(SolutionShell)로 옮겼다.
 * 글·번호·날짜는 그대로다. 새로 지은 문장은 없다.
 *
 * 주소에서 `.php` 를 뺐다. 옛 주소는 lib/phpRoutes.mjs 의 목록대로 308 로
 * 넘어오므로 검색에 쌓인 것을 잃지 않는다.
 */

const PATH = '/page/tech/patent'

export const generateMetadata = seoMeta({
  title: '특허 등록 및 출원',
  description:
    '마이크로서비스 아키텍처 기반 SaaS, AI 에이전트 도면인식 BOM·공정 자동 매칭 등 디알밸류의 특허 등록 1건·출원 5건을 공개합니다.',
  path: PATH,
})

/**
 * 번호와 날짜는 증서 원본에서 읽은 값이다. 지어낸 것이 없다.
 *
 * **등록과 출원을 나눠 적는다.** 예전에는 여섯 장에 PATENT 01~06 만 매겨서
 * 여섯 건 다 등록된 것처럼 읽혔다. 실제로는 등록 1건, 출원 5건이다.
 *
 * 그림 안의 글자는 검색엔진이 못 읽는다. 그래서 번호·날짜를 그림 밖
 * 글자로 뺀다 — 화면에서도 읽히고 검색에도 잡힌다.
 *
 * 2·3번(출원사실증명원)은 특허청 양식에 발명자 주민번호 앞자리·자택
 * 주소·휴대전화·발급번호·바코드가 들어 있다. `public/img/` 의 사본은 그
 * 칸을 단색으로 덮은 것이다(블러가 아니라 덮기 — 블러는 되돌릴 수 있다).
 * 원본(`img/patent2.png`·`patent3.png`)을 그대로 복사하면 안 된다.
 */
const PATENT_LIST = [
  {
    img: '/img/patent1.png',
    title: '마이크로서비스 아키텍처를 활용한 SaaS 서비스 제공 서버 및 방법',
    state: '등록', no: '10-2820498', date: '2025.06.10', dateLabel: '등록일',
  },
  {
    img: '/img/patent2.png',
    title: 'SaaS 서비스를 제공하는 방법 및 그 시스템',
    state: '출원', no: '10-2024-0130375', date: '2024.09.26', dateLabel: '출원일',
  },
  {
    img: '/img/patent3.png',
    title: 'SaaS 어플리케이션 통합 관리 시스템 및 방법',
    state: '출원', no: '10-2024-0130376', date: '2024.09.26', dateLabel: '출원일',
  },
  {
    img: '/img/patent4.png',
    title: 'AI 에이전트를 활용한 도면인식 기반의 BOM 및 공정 자동 매칭 서버 및 방법',
    state: '출원', no: '10-2025-0152877', date: '2025.10.21', dateLabel: '출원일',
  },
  {
    img: '/img/patent5.png',
    title: '인공지능 모델 기반의 건축 분야 온톨로지 구축 방법 및 그 전자 장치',
    state: '출원', no: '10-2026-0088448', date: '2026.05.15', dateLabel: '출원일',
  },
  {
    img: '/img/patent6.png',
    title: '도면 인식 결과 검증을 위해 온톨로지를 이용하는 방법 및 그 전자 장치',
    state: '출원', no: '10-2026-0088465', date: '2026.05.15', dateLabel: '출원일',
  },
] as const

/**
 * 이 장만의 CSS. 카드 껍데기는 공용 .mx_navcard 를 쓰고 증서 칸만 여기서
 * 그린다 — .mx_navshot 은 16:9 로 잘라 써서 세로 증서를 머리만 남긴다.
 * .mx_navcard 의 span·b 규칙이 #dvmax 없이 걸려 있어 여기서는 전부 #dvmax
 * 를 앞에 붙인다(안 붙이면 등록 표의 흰 글자가 회색으로 덮인다).
 * 템플릿 문자열이다 — 안에 역따옴표를 넣지 않는다.
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

/* 등록인지 출원인지. 색으로도 구분한다 — 여섯이 다 등록으로 읽히면 안 된다. */
#dvmax .cert_state {
  display: inline-block; align-self: flex-start; margin-top: 16px; font-size: 12px; font-weight: 800;
  letter-spacing: .04em; padding: 3px 9px; border-radius: 4px; line-height: 1.5; }
#dvmax .cert_state_reg { color: #fff; background: #d71920; }
#dvmax .cert_state_app { color: #3d5a80; background: #eef3f8; border: 1px solid #cfdfe8; }

/* 번호·날짜를 그림 밖 글자로 둔다. 그림 안 글자는 검색엔진이 못 읽는다. */
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

/**
 * CMS(게시판 「특허」)가 우선이다. 위 PATENT_LIST 는 CMS 가 안 될 때의 예비 —
 * 관리 화면에서 고친 것은 5분 안에 여기 반영된다(lib/cms.ts).
 */
type PatentCert = { img: string; title: string; state: '등록' | '출원'; no: string; date: string; w: number; h: number }

function fromCms(rows: CmsPost[]): PatentCert[] {
  return rows
    .filter((r) => r.thumbnail && r.title)
    .map((r) => ({
      img: r.thumbnail as string,
      title: r.title,
      state: r.cert_state === 'registered' ? '등록' : '출원',
      no: r.cert_no ?? '',
      date: dots(r.cert_date),
      w: r.thumbnail_size?.w ?? 793,
      h: r.thumbnail_size?.h ?? 1087,
    }))
}

function fallback(): PatentCert[] {
  return PATENT_LIST.map((p) => ({ img: p.img, title: p.title, state: p.state, no: p.no, date: p.date, w: DIMS[p.img].w, h: DIMS[p.img].h }))
}

export default async function Page() {
  const rows = await cmsBoard('patent')
  const list = rows ? fromCms(rows) : fallback()
  const reg = list.filter((p) => p.state === '등록').length
  const app = list.length - reg
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: CERT_CSS }} />
      <SolutionShell
        path={PATH}
        kicker="특허"
        kickerSub="기술력"
        headLead="디알밸류의 특허 등록 및 출원, "
        headStrong="디알밸류의 기술력입니다."
        desc={`마이크로서비스 아키텍처 기반 SaaS, AI 에이전트 도면인식 BOM·공정 자동 매칭 등 디알밸류의 특허 등록 ${reg}건·출원 ${app}건을 공개합니다.`}
        ctaTitle="문의사항이 있으신가요?"
        ctaDesc="프로젝트 문의는 문의하기에서 남길 수 있습니다."
      >
        <h2 className="mx_sec_title">특허 등록 및 출원</h2>
        <CertGrid
          certs={list.map((pt) => ({
            src: pt.img,
            alt: `${pt.title} ${pt.state}증`,
            w: pt.w,
            h: pt.h,
            open: `${pt.title} ${pt.state}증 크게 보기`,
            body: (
              <>
                <span className={`cert_state cert_state_${pt.state === '등록' ? 'reg' : 'app'}`}>{pt.state}</span>
                <h3 className="cert_title">{pt.title}</h3>
                <dl className="cert_meta">
                  <dt>{pt.state === '등록' ? '등록번호' : '출원번호'}</dt><dd>{pt.no}</dd>
                  <dt>{pt.state === '등록' ? '등록일' : '출원일'}</dt><dd>{pt.date}</dd>
                </dl>
              </>
            ),
          }))}
        />
      </SolutionShell>
    </>
  )
}
