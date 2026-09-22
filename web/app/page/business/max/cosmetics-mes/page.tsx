import { INDUSTRIES } from '../maxContent'
import { PAGE_CSS } from '../maxStyles'
import IndustryPage from '../IndustryPage'
import { pageMeta } from '@/lib/seo'

/** 원본 PHP 에 없는 새 페이지다. M.AX 페이지의 「화장품 업종」 탭을 떼어 냈다. */
const PATH = '/page/business/max/cosmetics-mes'

export const metadata = pageMeta({
  title: '화장품 MES',
  description:
    '화장품 제조를 위한 MES. 연구노트·처방, 견적·수주·출하·수금, 원료 발주·입고, 생산계획·작업지시, 단계별 품질검사, cGMP 양식·감사, 클레임·CAPA, 국가별 규제·MSDS, 공정·설비 모니터링까지 한 시스템입니다.',
  path: PATH,
})

const IND = INDUSTRIES.find((i) => i.id === 'cos')!

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <IndustryPage
        path={PATH}
        kicker="화장품 MES"
        ind={IND}
        // 2026-09-22 workspace.growxd.com(디마인 테넌트) 실제 화면. 아래 기능 판에 안 쓰는 둘이 번갈아 뜬다. 업체·제품·담당자는 가렸다.
        heroShot={[
          { src: '/screens/cos-cash.jpg', alt: '수금 현황 화면 — 수주번호·명세서번호·수금액·최종수금일·출고일·출고금액·수주금액', w: 1600, h: 1000, tag: '영업 · 수금 현황', url: 'max.drvalue.co.kr / 수금' },
          { src: '/screens/cos-audit.jpg', alt: '감사 현황 화면 — 내부/외부 감사 항목과 감사 결과', w: 1600, h: 1000, tag: '품질 · 감사 현황', url: 'max.drvalue.co.kr / 감사' },
        ]}
        groups={[
          {
            kicker: '연구 → 영업',
            title: '처방에서 수금까지, 다시 입력하지 않습니다',
            desc: '연구노트의 처방이 제조 BOM 이 되고, 견적·수주·출하·세금계산서·수금이 한 줄로 이어집니다.',
            nos: [1, 2],
          },
          {
            kicker: '구매 → 생산',
            title: '원료 발주부터 작업지시까지 한 흐름으로',
            desc: '발주·입고·재고·단가와 원료별 성분을 관리하고, 수주 기반 생산계획이 작업지시와 칭량·공정 전환으로 이어집니다.',
            nos: [3, 4],
            layout: 'flow',
          },
          {
            kicker: '품질 → 규제',
            title: '단계별 검사부터 cGMP·클레임·규제까지',
            desc: '원료부터 완제품까지 일곱 단계 검사, GMP 양식 출력과 감사 추적, 클레임·CAPA, 국가별 규제·성분·MSDS 대조를 한 시스템에서 합니다.',
            nos: [6, 7, 8, 5],
            layout: 'bento',
          },
          {
            kicker: '모니터링',
            title: '공정·설비·환경을 실시간으로 기록합니다',
            desc: '공정 이상은 즉시 알리고, 설비의 환경 데이터와 SCADA·유지보수 이력을 같은 화면에서 봅니다.',
            nos: [9],
            layout: 'cols',
          },
        ]}
      />
    </>
  )
}
