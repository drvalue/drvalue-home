import { CUTON_LEAD,  CUTON_SHOT } from '../solutionContent'
import { CT_AFTER, CT_BEFORE, CT_SHOW } from '../cutonContent'
import CutonDemo from '../CutonDemo'
import CutonShow from './CutonShow'
import { CUTON_CSS } from '../cutonStyles'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { Statement } from '../../business/max/V4'
import { pageMeta } from '@/lib/seo'

/**
 * 컷온(CutOn) — 디알밸류가 만들어 운영하는 레이저 절단 자동 견적 플랫폼(cuton.co.kr).
 *
 * 2026-09-22 한건 장과 같은 짜임(channel.io/kr/cos)으로 다시 세웠다:
 *  1) 시연 판 — 체험 가이드 「예상견적산출」이 순서대로 다시 돈다(CutonDemo)
 *  2) 전/후 — 도면 보내고 기다리던 대화 / 보관함 실제 화면 + ✕ 셋 · ✓ 셋
 *  3) 세 화면 — 예상견적산출 · 보관함 · 입찰마켓, 폭 전체 판 + 자동 넘김 탭(CutonShow)
 *
 * 화면·값은 전부 cuton.co.kr 공개 체험 가이드에서 로그인 없이 받은 것(cutonContent.ts). 가이드 값은
 * 컷온이 만든 예시 값이라 장에도 그렇게 적는다. 우리가 쓴 문장은 cutonContent.ts 머리말에 적었다.
 * 옛 기능 블록(FeatureBlocks)은 뺐다 — 한건 장에서 사용자가 뺀 것과 같은 결정.
 */
const PATH = '/page/service/cuton'

export const metadata = pageMeta({
  title: '컷온(CutOn) AI 자동 견적',
  description: '도면(DXF)을 올리면 AI 가 형상을 분석해 재질·두께·수량 기준 레이저 절단 견적을 즉시 산출합니다. 보관함에 저장하고 입찰마켓에 올려 파트너 업체의 제안을 받습니다. 디알밸류가 만들어 운영합니다.',
  path: PATH,
})

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: CUTON_CSS }} />
      <SolutionShell
        path={PATH}
        look="v4"
        kicker="컷온"
        kickerSub="AI솔루션"
        headLead="도면 업로드 한 번으로 끝나는 "
        headStrong="AI 레이저 절삭 자동 견적, 컷온"
        desc="도면(CAD) 데이터를 AI가 즉시 분석하여 최적의 절삭 비용을 산출하는 자동 견적 플랫폼입니다."
        lead={CUTON_LEAD}
        heroShot={{ ...CUTON_SHOT, tag: '컷온 · 자동 견적', url: 'cuton.co.kr' }}
        ctaTitle="도면을 올리면 견적까지, 컷온으로 먼저 받아 보세요"
        ctaDesc="cuton.co.kr 체험 가이드는 로그인 없이 바로 열립니다. 도입·연동 상담은 아래로."
      >
        {/* 시연 — 체험 가이드를 순서대로 */}
        <section className="mx_sec4 hk_sec">
          <p className="mx_kicker hk_center">예상견적산출</p>
          <Statement desc="DXF 도면을 올리면 형상을 분석해 절단 길이·구멍·면적을 읽고, 재질그룹별 예상가를 같은 화면에서 냅니다. 아래는 컷온이 사이트에 열어 둔 체험 가이드를 그대로 따라간 것입니다 — 가이드의 예시 도면·값으로, 실제 화면과 같은 흐름입니다.">
            도면 한 장 올리면 재질그룹별 예상가까지
          </Statement>
          <div className="hk_plate">
            <CutonDemo />
          </div>
        </section>

        {/* 전/후 */}
        <section className="mx_sec4 hk_sec">
          <Statement desc="도면을 보내고 회신을 기다리던 일을, 올리고 고르는 일로 바꿉니다.">
            기다리는 시간이 아니라 고르는 시간
          </Statement>
          <div className="hk_pair" data-rv>
            <figure className="hk_card hk_dark">
              <div className="hk_bubbles">
                {CT_BEFORE.bubbles.map((b, i) => (
                  <p key={i} className={`hk_bb ${b.who}`} style={{ ['--i' as string]: i }}>{b.t}</p>
                ))}
              </div>
            </figure>
            <figure className="hk_card hk_light ct_light">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/screens/cuton-result.jpg" alt="컷온 예상견적산출 결과 화면 — 항목별 분석값과 재질그룹별 가격, 최저 합계가 한 화면에" width={1290} height={810} loading="lazy" />
            </figure>
          </div>
          <div className="hk_lists" data-rv>
            <div>
              <h3><i className="hk_x" aria-hidden="true">✕</i>{CT_BEFORE.title}</h3>
              <ul>{CT_BEFORE.points.map((p) => <li key={p} className="hk_no">{p}</li>)}</ul>
            </div>
            <div>
              <h3><i className="hk_ok" aria-hidden="true">✓</i>{CT_AFTER.title}</h3>
              <ul>{CT_AFTER.points.map((p) => <li key={p} className="hk_yes">{p}</li>)}</ul>
            </div>
          </div>
        </section>

        {/* 세 화면 — 폭 전체 판 + 자동 넘김 탭 */}
        <section className="mx_sec4 hk_sec">
          <p className="mx_kicker hk_center">견적 · 보관 · 입찰</p>
          <Statement desc={CT_SHOW.desc}>
            {CT_SHOW.head}
          </Statement>
          <CutonShow />
        </section>
      </SolutionShell>
    </>
  )
}
