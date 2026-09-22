import { INDUSTRIES } from '../maxContent'
import { PAGE_CSS } from '../maxStyles'
import IndustryPage from '../IndustryPage'
import { seoMeta } from '@/lib/seo'

/** 원본 PHP 에 없는 새 페이지다. M.AX 페이지의 「화장품 업종」 탭을 떼어 냈다. */
const PATH = '/page/business/max/cosmetics-mes'

export const generateMetadata = seoMeta({
  title: '화장품 MES',
  description:
    '화장품 제조를 위한 MES. 배합과 LOT 이력, 원료·부자재 입출고, 공정과 품질 기록을 이어 붙여 출하까지의 근거를 남깁니다.',
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
            kicker: '연구 → 품질',
            title: '연구노트부터 클레임까지 한 시스템',
            desc: '처방 기준으로 원료 단가가 자동 산출되고, cGMP 양식은 시스템에서 바로 출력되며, 클레임은 원인 LOT 역추적까지 한곳에서 이어집니다.',
            nos: [1, 2, 3],
          },
          {
            kicker: '모니터링',
            title: '공정과 환경을 실시간으로 기록합니다',
            desc: '공정별 진행·이상 상태를 실시간으로 확인하고, 온·습도 등 제조 환경 데이터를 자동으로 쌓아 품질에 미친 영향까지 연계해 봅니다.',
            nos: [4, 5],
          },
        ]}
      />
    </>
  )
}
