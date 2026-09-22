import { INDUSTRIES } from '../maxContent'
import { PAGE_CSS } from '../maxStyles'
import IndustryPage from '../IndustryPage'
import { seoMeta } from '@/lib/seo'

/** 원본 PHP 에 없는 새 페이지다. M.AX 페이지의 「PCB 업종」 탭을 떼어 냈다. */
const PATH = '/page/business/max/pcb-mes'

export const generateMetadata = seoMeta({
  title: 'PCB MES',
  description:
    '소량 다품종 샘플 PCB 를 위한 MES. 수십 항목의 사양 검증, 수율을 높이는 원판 배치, 내·외주 공정 진척과 거래 명세를 하나의 흐름으로 관리합니다.',
  path: PATH,
})

const IND = INDUSTRIES.find((i) => i.id === 'pcb')!

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <IndustryPage
        path={PATH}
        kicker="PCB MES"
        ind={IND}
        // 아래 탭의 첫 화면(전사 현황·사양 등록·배열·공정·불량·출고)과 안 겹치는 셋이 번갈아 뜬다.
        heroShot={[
          { src: '/screens/pcb-lamination.jpg', alt: '적층구조 라이브러리 화면 — 층별 CF·PP·CCL 구성과 두께를 조합해 저장', w: 1600, h: 1000, tag: '적층구조 라이브러리', url: 'max.drvalue.co.kr / 적층구조' },
          { src: '/screens/pcb-inspect.jpg', alt: '검사기준서 관리 화면 — 기준서 버전·검사등급과 업체별 기준서 지정', w: 1600, h: 1000, tag: '검사기준서 관리', url: 'max.drvalue.co.kr / 검사기준서' },
          { src: '/screens/pcb-collect.jpg', alt: '수금 현황 화면 — 수주번호별 수주금액·출고금액·수금액·최종 수금일', w: 1600, h: 1000, tag: '수금 현황', url: 'max.drvalue.co.kr / 수금' },
        ]}
        groups={[
          {
            kicker: '수주 → 배치',
            title: '수주부터 원판 배치까지 번호 하나로',
            desc: '사양·모델을 한 번 등록하면 다음 공정에서 재입력 없이 호출되고, 사양 상충은 등록 단계에서 차단되며, 배치 도면은 수율과 함께 제시됩니다.',
            nos: [1, 2, 3],
          },
          {
            kicker: '생산 → 정산',
            title: '생산부터 출고·수금까지 한 흐름으로',
            desc: '진척율·체류시간과 납기 예상일을 실시간으로 보고, 검사 단계·항목·알림을 공정마다 따로 두며, 출고 한 건이 제품 재고·세금계산서·수금 현황까지 함께 갱신합니다.',
            nos: [4, 5, 6],
          },
          {
            kicker: 'KPI',
            title: '쌓인 기록이 곧 지표가 됩니다',
            desc: '수주·사양·생산·출고 기록에서 별도 집계 없이 지표가 나오고, 납기·이익·품질에 영향을 준 요인까지 분리해 봅니다.',
            nos: [7],
            cols: 'kpi',
          },
        ]}
      />
    </>
  )
}
