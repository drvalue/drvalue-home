import CadonDemo from '../CadonDemo'
import CadonCases from './CadonCases'
import { CADON_CSS } from '../cadonStyles'
import CutonDemo from '../CutonDemo'
import CutonShow from '../cuton/CutonShow'
import { CUTON_CSS } from '../cutonStyles'
import { CUTON_DEFAULT, CUTON_KEY } from '../cuton/content'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { Cols, Plate, Statement } from '../../business/max/V4'
import { seoMeta } from '@/lib/seo'
import { cmsPageContent } from '@/lib/cms'
import CompareBlock from '../CompareBlock'
import { orUndefined, toHeroShots, toLead } from '../../pageContentParts'
import { CADON_DEFAULT, CADON_KEY } from './content'

/**
 * CADON — AutoCAD 안에서 판금을 펴고 되접는 CutON 플러그인.
 *
 * 2026-09-22 한건 장과 같은 골격(channel.io/kr/cos)으로 옮겼다:
 *  1) 시연 판 — 실제 실행 화면 네 장이 STEP 열기 → 전개·작도 → 절곡 시뮬레이션 → 3D 되접기 순서로
 *     넘어가고, 그 화면에 찍힌 값이 함께 뜬다(CadonDemo)
 *  2) 전/후 — 어두운 카드(도면을 밖으로 보내 전개하던 대화) / 밝은 카드(실제 화면) + ✕ 셋 · ✓ 셋
 *  3) 판정 판 — 「도면」 쪽지와 CutON 패널을 잇고, 3열 탭(전개 결과 · DFM 위반 · 3D 되접기)이
 *     진행 막대와 함께 자동으로 넘어간다(CadonCases)
 *
 * 화면·숫자는 전부 실제 실행 캡처에 찍힌 것(cadonContent.ts). 우리가 쓴 문장은 그 파일 머리말에
 * 적어 두었다 — 사용자 확인 대상. 맨 아래 기능 블록은 한건 장과 같이 뺐다(시연·전후·판정이 그 말을 한다).
 *
 * 2026-09-28 사용자: 컷온을 CADON 안으로 합친다 — CADON 구역 뒤에 옛 컷온 장의 구역(머리말 · 대표 화면 ·
 * 요약 · 시연 · 전/후 · 화면 셋)을 빠짐없이 잇는다. 컷온 글은 여전히 관리 화면 「컷온」 페이지 글이다.
 * 옛 주소 /page/service/cuton 은 여기 #cuton 으로 넘긴다.
 */
const PATH = '/page/service/cadon'

export const dynamic = 'force-dynamic'

export const generateMetadata = seoMeta({
  title: 'CADON · 컷온',
  description: 'AutoCAD 안에서 판금을 전개·작도·검토하고(CADON), 도면을 올리면 AI 가 레이저 절단 견적을 즉시 산출합니다(컷온). 도면은 외부 서버로 나가지 않습니다.',
  path: PATH,
})

export default async function Page() {
  const [c, ct] = await Promise.all([
    cmsPageContent(CADON_KEY).then((x) => x ?? CADON_DEFAULT),
    cmsPageContent(CUTON_KEY).then((x) => x ?? CUTON_DEFAULT),
  ])
  const { shell, demo, compareStatement, extra } = c
  const ctLead = toLead(ct.lead)
  const ctShot = [toHeroShots(ct.heroShots) ?? []].flat()[0]
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS + CADON_CSS + CUTON_CSS }} />
      <SolutionShell
        path={PATH}
        look="v4"
        kicker={shell.kicker}
        kickerSub={shell.kickerSub}
        headLead={shell.headLead}
        headStrong={shell.headStrong}
        desc={shell.desc}
        lead={toLead(c.lead)}
        heroShot={toHeroShots(c.heroShots)}
        ctaTitle={orUndefined(shell.ctaTitle)}
        ctaDesc={orUndefined(shell.ctaDesc)}
      >
        {/* 시연 — 실제 실행 화면 네 장을 순서대로 */}
        <section className="mx_sec4 hk_sec">
          {demo.kicker && <p className="mx_kicker hk_center">{demo.kicker}</p>}
          <Statement desc={orUndefined(demo.desc)}>
            {demo.title}
          </Statement>
          <div className="hk_plate">
            <CadonDemo />
          </div>
        </section>

        {/* 전/후 */}
        <section className="mx_sec4 hk_sec">
          {compareStatement.kicker && <p className="mx_kicker hk_center">{compareStatement.kicker}</p>}
          <Statement desc={orUndefined(compareStatement.desc)}>
            {compareStatement.title}
          </Statement>
          <CompareBlock c={c.compare} />
        </section>

        {/* 판정 — 전개 결과 · DFM 위반 · 되접기 */}
        <section className="mx_sec4 hk_sec">
          {extra.kicker && <p className="mx_kicker hk_center">{extra.kicker}</p>}
          <Statement desc={orUndefined(extra.desc)}>
            {extra.title}
          </Statement>
          <CadonCases />
        </section>

        {/* 컷온 — 옛 컷온 장의 구역을 빠짐없이 잇는다 */}
        <section className="mx_sec4 hk_sec" id="cuton">
          {ct.shell.kicker && <p className="mx_kicker hk_center">{ct.shell.kicker}</p>}
          <Statement desc={orUndefined(ct.shell.desc)}>
            {ct.shell.headLead + ct.shell.headStrong}
          </Statement>
          {ctShot && <Plate shot={ctShot} tag={ctShot.tag} url={ctShot.url} phone={ctShot.phone} />}
        </section>

        {ctLead.items && (
          <section className="mx_sec4 big mx_keys">
            <Statement desc={ctLead.desc}>{ctLead.title}</Statement>
            <Cols items={ctLead.items} />
          </section>
        )}

        <section className="mx_sec4 hk_sec">
          {ct.demo.kicker && <p className="mx_kicker hk_center">{ct.demo.kicker}</p>}
          <Statement desc={orUndefined(ct.demo.desc)}>
            {ct.demo.title}
          </Statement>
          <div className="hk_plate">
            <CutonDemo />
          </div>
        </section>

        <section className="mx_sec4 hk_sec">
          {ct.compareStatement.kicker && <p className="mx_kicker hk_center">{ct.compareStatement.kicker}</p>}
          <Statement desc={orUndefined(ct.compareStatement.desc)}>
            {ct.compareStatement.title}
          </Statement>
          <CompareBlock c={ct.compare} lightClass=" ct_light" />
        </section>

        <section className="mx_sec4 hk_sec">
          {ct.extra.kicker && <p className="mx_kicker hk_center">{ct.extra.kicker}</p>}
          <Statement desc={orUndefined(ct.extra.desc)}>
            {ct.extra.title}
          </Statement>
          <CutonShow />
        </section>

      </SolutionShell>
    </>
  )
}
