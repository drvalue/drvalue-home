import { CADON_LEAD } from '../solutionContent'
import { CD_AFTER, CD_BEFORE } from '../cadonContent'
import CadonDemo from '../CadonDemo'
import CadonCases from './CadonCases'
import { CADON_CSS } from '../cadonStyles'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { Statement } from '../../business/max/V4'
import { seoMeta } from '@/lib/seo'

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
 */
const PATH = '/page/service/cadon'

export const generateMetadata = seoMeta({
  title: 'CADON',
  description: 'AutoCAD 안에서 판금 STEP 을 열어 전개하고, 절단선·절곡선을 레이어로 작도하고, 절곡 시뮬레이션과 3D 되접기로 검토합니다. 도면은 외부 서버로 나가지 않습니다.',
  path: PATH,
})

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS + CADON_CSS }} />
      <SolutionShell
        path={PATH}
        look="v4"
        kicker="CADON in AutoCAD"
        kickerSub="AI솔루션"
        headLead="AutoCAD 안에서 판금을 "
        headStrong="펴고 되짚습니다"
        desc="3D STEP 또는 2D DXF 도면을 바탕으로 전개 결과를 확인하고, 절단선·절곡선 작도와 DFM 검토, 절곡 시뮬레이션까지 AutoCAD 작업 환경에서 끝냅니다."
        lead={CADON_LEAD}
        heroShot={{ src: '/screens/cadon-02-unfold.jpg', alt: 'CutON 전개 결과 — AutoCAD 도면 위에 절단선·절곡선이 작도되고, PASS 1 · A1100 t 2 · 절곡 6 · DFM 경고 4 패널이 뜬다', w: 1600, h: 993, tag: 'CADON · 전개 결과', url: 'AutoCAD / CADON' }}
        ctaTitle="도면은 밖으로 나가지 않습니다 — CADON 으로 AutoCAD 안에서 전개하세요"
        ctaDesc="쓰시는 AutoCAD 버전과 판금 자재를 알려주시면 적용 방안을 검토해 드립니다."
      >
        {/* 시연 — 실제 실행 화면 네 장을 순서대로 */}
        <section className="mx_sec4 hk_sec">
          <p className="mx_kicker hk_center">전개 한 번</p>
          <Statement desc="STEP 을 열고 「이 파일로 전개」를 누르면 전개도가 도면 위에 그려지고, 절곡 순서를 돌려 본 뒤 다시 3D 로 되접어 확인합니다. 아래는 부품 하나를 실제로 돌린 화면을 순서대로 다시 보여 주는 것입니다.">
            STEP 을 열어 전개하고, 돌려 보고, 되접기까지 AutoCAD 안에서
          </Statement>
          <div className="hk_plate">
            <CadonDemo />
          </div>
        </section>

        {/* 전/후 */}
        <section className="mx_sec4 hk_sec">
          <Statement desc="외부 전개 서비스에 올리고 기다리던 일을, AutoCAD 명령 하나로 그 자리에서 끝냅니다.">
            기다리는 시간이 아니라 검토하는 시간
          </Statement>
          <div className="hk_pair" data-rv>
            <figure className="hk_card hk_dark">
              <div className="hk_bubbles">
                {CD_BEFORE.bubbles.map((b, i) => (
                  <p key={i} className={`hk_bb ${b.who}`} style={{ ['--i' as string]: i }}>{b.t}</p>
                ))}
              </div>
            </figure>
            <figure className="hk_card hk_light">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/screens/cuton-autocad-03-bend-simulation.jpg" alt="CutON 절곡 시뮬레이션 화면 — 스텝별 형상과 DFM 위반" width={1600} height={880} loading="lazy" />
            </figure>
          </div>
          <div className="hk_lists" data-rv>
            <div>
              <h3><i className="hk_x" aria-hidden="true">✕</i>{CD_BEFORE.title}</h3>
              <ul>{CD_BEFORE.points.map((p) => <li key={p} className="hk_no">{p}</li>)}</ul>
            </div>
            <div>
              <h3><i className="hk_ok" aria-hidden="true">✓</i>{CD_AFTER.title}</h3>
              <ul>{CD_AFTER.points.map((p) => <li key={p} className="hk_yes">{p}</li>)}</ul>
            </div>
          </div>
        </section>

        {/* 판정 — 전개 결과 · DFM 위반 · 되접기 */}
        <section className="mx_sec4 hk_sec">
          <p className="mx_kicker hk_center">검토</p>
          <Statement desc="전개가 끝나면 PASS · REVIEW · 실패로 판정하고, 만들 수 없는 플랜지는 어느 스텝에서 얼마나 짧은지 짚어 줍니다. 아래는 같은 부품의 실제 패널입니다.">
            만들 수 있는 형상인지 그 자리에서 봅니다
          </Statement>
          <CadonCases />
        </section>

      </SolutionShell>
    </>
  )
}
