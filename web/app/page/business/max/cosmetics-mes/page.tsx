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
        // 머리말 화면 없음 — 넷 있는 캡처가 전부 아래 기능 판에 쓰인다(머리말 ≠ 본문 화면 규칙). workspace 캡처 뒤 채운다.
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
          },
          {
            kicker: '품질 → 규제',
            title: '단계별 검사부터 cGMP·클레임·규제까지',
            desc: '원료부터 완제품까지 일곱 단계 검사, GMP 양식 출력과 감사 추적, 클레임·CAPA, 국가별 규제·성분·MSDS 대조를 한 시스템에서 합니다.',
            nos: [5, 6, 7, 8],
          },
          {
            kicker: '모니터링',
            title: '공정·설비·환경을 실시간으로 기록합니다',
            desc: '공정 이상은 즉시 알리고, 설비의 환경 데이터와 SCADA·유지보수 이력을 같은 화면에서 봅니다.',
            nos: [9],
          },
        ]}
      />
    </>
  )
}
