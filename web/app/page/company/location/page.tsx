import { LOCATION, LOCATION_LEAD, COMPANY_CSS } from '../companyContent'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { pageMeta } from '@/lib/seo'

/**
 * /page/company/location.php 를 옮긴 것. 2026-09-18 옛 꾸밈(사진 머리 + t_inner + AOS)
 * 에서 M.AX 계열과 같은 틀로 옮겼다 — 메뉴를 옮겨 다닐 때 두 꾸밈이 섞여 난잡했다.
 * 지도·주소·교통 안내는 companyContent.ts 에 그대로 옮겨 두었다. 새로 지은 문장은 없다.
 */
const PATH = '/page/company/location'

export const metadata = pageMeta({
  title: '찾아오시는 길',
  description:
    '디알밸류는 한양대학교 ERICA 창업보육센터에 있습니다. 주소·전화·이메일과 방문 안내를 확인하세요. 경기도 안산시 상록구 한양대학로 55.',
  path: PATH,
})

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: COMPANY_CSS }} />
      <SolutionShell
        path={PATH}
        kicker="찾아오시는 길"
        kickerSub="회사소개"
        headLead="디알밸류로 찾아오시는 길을 "
        headStrong="상세히 안내해 드립니다."
        desc={LOCATION.intro}
        lead={LOCATION_LEAD}
        ctaTitle="방문 전에 미리 연락 주세요."
        ctaDesc="방문 전 일정을 협의하시면 보다 원활한 상담이 가능합니다."
      >
        <div className="location_box">
          <div className="map_box" data-rv="shot">
            <iframe
              src={LOCATION.mapSrc}
              title={`${LOCATION.company} 위치 지도`}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="info_box" data-rv>
            <h3>{LOCATION.company}</h3>
            <dl className="info_list">
              <div className="info_item">
                <dt>주소</dt>
                <dd>{LOCATION.address[0]}<br />{LOCATION.address[1]}</dd>
              </div>
              <div className="info_item">
                <dt>대표전화</dt>
                <dd><a href={LOCATION.tel.href}>{LOCATION.tel.text}</a></dd>
              </div>
              <div className="info_item">
                <dt>이메일</dt>
                <dd>{LOCATION.email}</dd>
              </div>
            </dl>
            <div className="guide_box">
              <h4>{LOCATION.guide.title}</h4>
              <p>{LOCATION.guide.desc}</p>
            </div>
          </div>
        </div>
      </SolutionShell>
    </>
  )
}
