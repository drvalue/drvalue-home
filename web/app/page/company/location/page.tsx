import { Fragment } from 'react'
import { COMPANY_CSS } from '../companyContent'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { seoMeta } from '@/lib/seo'
import { cmsPageContent, pageImageSrc } from '@/lib/cms'
import { LOCATION_DEFAULT, LOCATION_PAGE_KEY, mapEmbedSrc, telHref, type LocationContent } from './content'

/**
 * /page/company/location.php 를 옮긴 것. 글은 관리 화면(페이지 → 찾아오시는 길)에서 고친다 —
 * 요청마다 api 의 페이지 글을 읽고, 못 읽으면 content.ts 의 기본 글로 그린다(api 가 죽어도 장이 안 빈다).
 * 꾸밈(SolutionShell + 지도·주소 칸)은 그대로다.
 */
const PATH = '/page/company/location'

export const dynamic = 'force-dynamic'

export const generateMetadata = seoMeta({
  title: '찾아오시는 길',
  description:
    '디알밸류는 한양대학교 ERICA 창업보육센터에 있습니다. 주소·전화·이메일과 방문 안내를 확인하세요. 경기도 안산시 상록구 한양대학로 55.',
  path: PATH,
})

export default async function Page() {
  const c = (await cmsPageContent<LocationContent>(LOCATION_PAGE_KEY)) ?? LOCATION_DEFAULT
  const { shell, place, guide } = c
  const photo = pageImageSrc(guide.photo)
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: COMPANY_CSS }} />
      <SolutionShell
        path={PATH}
        kicker={shell.kicker}
        kickerSub={shell.kickerSub}
        headLead={shell.headLead}
        headStrong={shell.headStrong}
        desc={shell.desc}
        lead={shell.leadTitle ? { title: shell.leadTitle } : undefined}
        // 비우면 틀의 기본 문구를 쓴다.
        ctaTitle={shell.ctaTitle || undefined}
        ctaDesc={shell.ctaDesc || undefined}
      >
        <div className="location_box">
          <div className="map_box" data-rv="shot">
            <iframe
              src={mapEmbedSrc(place.mapQuery)}
              title={`${place.company} 위치 지도`}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="info_box" data-rv>
            <h3>{place.company}</h3>
            <dl className="info_list">
              <div className="info_item">
                <dt>주소</dt>
                <dd>
                  {place.address.map((a, i) => (
                    <Fragment key={i}>
                      {i > 0 && <br />}
                      {a.line}
                    </Fragment>
                  ))}
                </dd>
              </div>
              <div className="info_item">
                <dt>대표전화</dt>
                <dd><a href={telHref(place.tel)}>{place.tel}</a></dd>
              </div>
              <div className="info_item">
                <dt>이메일</dt>
                <dd>{place.email}</dd>
              </div>
            </dl>
            <div className="guide_box">
              <h4>{guide.title}</h4>
              {guide.desc && <p>{guide.desc}</p>}
              {photo && guide.photo && (
                <img
                  className="guide_photo"
                  src={photo}
                  alt={guide.photo.alt}
                  width={guide.photo.width ?? 1200}
                  height={guide.photo.height ?? 800}
                  loading="lazy"
                />
              )}
            </div>
          </div>
        </div>
      </SolutionShell>
    </>
  )
}
