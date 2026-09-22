import { AUTOFORM_LEAD } from '../solutionContent'
import { AF_AFTER, AF_BEFORE } from '../autoformContent'
import AutoformDemo from '../AutoformDemo'
import AutoformShow from '../AutoformShow'
import { AUTOFORM_CSS } from '../autoformStyles'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { Statement } from '../../business/max/V4'
import { seoMeta } from '@/lib/seo'

/**
 * 오토폼 — 쓰던 한글 양식 그대로 업무 데이터를 채우는 문서 자동화.
 *
 * 2026-09-22 한건 장과 같은 짜임(channel.io/kr/cos)으로 옮겼다:
 *  1) 시연 판 — 실제 화면 세 장이 단계대로 넘어가며 화면에 찍힌 값이 라벨로 뜬다(AutoformDemo)
 *  2) 전/후 — 어두운 카드(문서 만들던 대화) / 밝은 카드(매핑 화면) + ✕ 셋 · ✓ 셋
 *  3) 양식 셋 — 폭 전체 판에 데이터베이스↔양식 카드, 아래 3열 탭이 자동으로 넘어간다(AutoformShow)
 *  (3열 요약은 머리말 요약과 겹쳐 뺐다 — 사용자 지적 09-22)
 *
 * 화면·숫자는 전부 제품 화면(2026년 7월 캡처)에 찍힌 것. 우리가 쓴 문장은 autoformContent.ts
 * 머리말에 적어 두었다 — 사용자 확인 대상. 기능 블록 셋은 뺐다(한건 장에서 사용자가 뺀 것과 같이).
 */
const PATH = '/page/service/autoform'

export const generateMetadata = seoMeta({
  title: '오토폼',
  description: '쓰던 한글(HWP·HWPX) 양식을 그대로 등록하고 문서 칸과 업무 데이터를 한 번 맺어 두면, 레코드를 고르는 것만으로 서식 그대로 문서가 나옵니다.',
  path: PATH,
})

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: AUTOFORM_CSS }} />
      <SolutionShell
        path={PATH}
        look="v4"
        kicker="오토폼"
        kickerSub="AI솔루션"
        headLead="쓰던 한글 양식 그대로, "
        headStrong="데이터만 채웁니다"
        desc="기존 문서 양식과 제조 데이터를 연결해 반복적으로 작성하는 문서 업무를 지원합니다. 사용 중인 한글 양식을 바탕으로 데이터 연동 환경을 만듭니다."
        lead={AUTOFORM_LEAD}
        heroShot={{ src: '/screens/solution-form-automation-upload.jpg', alt: '오토폼 양식 등록 화면 — 데이터베이스 연결 상태와 분석된 양식 9개 목록', w: 1600, h: 1121, tag: '오토폼 · 양식 등록', url: 'form automation / 양식' }}
        ctaTitle="쓰던 한글 양식 그대로, 오토폼으로 문서를 뽑아 보세요"
        ctaDesc="양식 파일 하나와 채울 데이터가 어디 있는지만 알려주시면 됩니다."
      >
        {/* 시연 — 실제 화면 세 장을 단계대로 */}
        <section className="mx_sec4 hk_sec">
          <p className="mx_kicker hk_center">세 단계</p>
          <Statement desc="양식을 올리고, 칸마다 어느 데이터가 들어갈지 한 번 정하고, 그다음부터는 레코드를 고르기만 합니다. 아래는 실제 화면을 순서대로 다시 보여 주는 것입니다.">
            양식 한 번, 연결 한 번, 그다음은 고르기만
          </Statement>
          <div className="hk_plate">
            <AutoformDemo />
          </div>
        </section>

        {/* 전/후 */}
        <section className="mx_sec4 hk_sec">
          <Statement desc="지난 문서를 복사해 값을 찾아 넣고 서식이 깨지지 않게 손보던 일을, 레코드 하나 고르는 것으로 끝냅니다.">
            복사해 채우는 문서가 아니라 골라서 나오는 문서
          </Statement>
          <div className="hk_pair" data-rv>
            <figure className="hk_card hk_dark">
              <div className="hk_bubbles">
                {AF_BEFORE.bubbles.map((b, i) => (
                  <p key={i} className={`hk_bb ${b.who}`} style={{ ['--i' as string]: i }}>{b.t}</p>
                ))}
              </div>
            </figure>
            <figure className="hk_card hk_light af_light">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/screens/solution-form-automation-mapping.jpg" alt="오토폼 매핑 화면 — 한글 원본 위에 제품명·제조번호 같은 칸과 데이터 항목의 대응이 표시된다" width={1600} height={799} loading="lazy" />
            </figure>
          </div>
          <div className="hk_lists" data-rv="pop">
            <div>
              <h3><i className="hk_x" aria-hidden="true">✕</i>{AF_BEFORE.title}</h3>
              <ul>{AF_BEFORE.points.map((p) => <li key={p} className="hk_no">{p}</li>)}</ul>
            </div>
            <div>
              <h3><i className="hk_ok" aria-hidden="true">✓</i>{AF_AFTER.title}</h3>
              <ul>{AF_AFTER.points.map((p) => <li key={p} className="hk_yes">{p}</li>)}</ul>
            </div>
          </div>
        </section>

        {/* 양식 셋 — 등록 화면 목록에 있는 것 */}
        <section className="mx_sec4 hk_sec">
          <p className="mx_kicker hk_center">양식</p>
          <Statement desc="등록 화면의 목록에 있는 양식 셋입니다. 파일마다 쪽·표·스칼라·리스트 수를 읽어 두고, 같은 데이터베이스에서 채웁니다.">
            견적서도, 두 쪽짜리 기록서도, 빈 서식도 같은 방식으로
          </Statement>
          <AutoformShow />
        </section>

      </SolutionShell>
    </>
  )
}
