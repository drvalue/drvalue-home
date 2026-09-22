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
        // 국가별 규제 검증. 이 장의 탭(원료·GMP 양식·클레임)엔 없는 화면이라 겹치지 않는다. 안 겹치는 화면이 하나뿐이라 한 장.
        heroShot={{ src: '/screens/cos-regulation.jpg', alt: '국가별 규제 기준으로 성분을 검증하는 화면 — 성분·기준·허용 한도 표', w: 1600, h: 836, tag: '국가별 규제 검증', url: 'max.drvalue.co.kr / 규제 검증' }}
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
