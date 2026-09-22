import { HANGEON_LEAD } from '../solutionContent'
import { HK_AFTER, HK_BEFORE, HK_BIZ, HK_HONEST } from '../hankeonContent'
import HankeonDemo from '../HankeonDemo'
import BizShowcase from '../BizShowcase'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { Statement } from '../../business/max/V4'
import { seoMeta } from '@/lib/seo'

/**
 * 한건(hankeon.com) — 디알밸류가 만들어 상용 운영 중인 건설 AI.
 *
 * 2026-09-22 사용자 지시로 channel.io/kr/cos 의 두 구역을 옮겼다:
 *  1) 대화 시연 판 — 실제 질문이 타이핑되고 진행 단계·답·인용 조문이 순서대로 뜬다(HankeonDemo)
 *  2) 전/후 대비 — 어두운 카드(자료 뒤지던 대화) / 밝은 카드(실제 화면) + ✕ 셋 · ✓ 셋
 * 그리고 Biz(맞춤 입찰 검색)를 부산 소재 건축공사업 프로필로 실제 조회한 결과.
 *
 * 화면·답·건수는 전부 그날 서비스에 로그인해 받은 것(hankeonContent.ts). 우리가 쓴 문장은
 * 히어로 제목·설명, 큰 문장 넷과 그 설명, 전/후 카드 제목·말풍선·✕·✓, 「모르면 모른다」 본문.
 * 사용자가 2026-09-22 「알아서 맞추라」고 했다. 같은 날 맨 아래 기능 블록 둘(「무엇인가」·
 * 「같은 구조, 다른 현장」)은 빼라고 해서 뺐다 — 시연·전후·Biz 가 이미 그 말을 한다.
 */
const PATH = '/page/service/hangeon'

export const generateMetadata = seoMeta({
  title: '한건 AI Chat',
  description:
    'LLM·RAG 기반 건설 AI. KCS·KDS·표준품셈과 법령을 근거로 답하고, 나라장터 공고를 면허 기준으로 가려 줍니다. 디알밸류가 만들어 상용으로 운영 중입니다.',
  path: PATH,
})

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <SolutionShell
        path={PATH}
        look="v4"
        kicker="한건 AI Chat"
        kickerSub="AI솔루션"
        headLead="건설 법령·기준을 "
        headStrong="근거와 함께 답합니다"
        desc="LLM 과 RAG 를 함께 써서 KCS·KDS·표준품셈과 법령 조문을 근거로 답하는 건설 AI 입니다. 디알밸류가 만들어 상용으로 운영하고 있습니다."
        lead={HANGEON_LEAD}
        heroShot={{ src: '/screens/hankeon-chat.jpg', alt: '한건 Chat 화면 — 지하층 직통계단·특별피난계단 질문에 건축법 시행령 34조·35조, 피난·방화규칙 9조를 인용해 답한다', w: 1600, h: 1000, tag: 'Chat · 근거 기반 질의응답', url: 'hankeon.com / chat' }}
        ctaTitle="건설 법령을 근거와 함께, 한건을 먼저 써 보세요"
        ctaDesc="hankeon.com 에서 바로 쓸 수 있습니다. 우리 회사 자료로 같은 구조를 만들려면 도입 상담으로."
      >
        {/* 대화 시연 — 실제 질문·단계·답을 순서대로 */}
        <section className="mx_sec4 hk_sec">
          <p className="mx_kicker hk_center">Chat</p>
          <Statement desc="질문 한 줄을 넣으면 질문을 분류하고, 자료를 찾고, 어느 법령이 걸리는지 판정한 뒤 조문을 인용해 답합니다. 아래는 실제 응답을 순서대로 다시 보여 주는 것입니다.">
            “지하 2층 직통계단, 특별피난계단으로 해야 합니까?” 조문을 짚어 답합니다
          </Statement>
          <div className="hk_plate">
            <HankeonDemo />
          </div>
        </section>

        {/* 전/후 */}
        <section className="mx_sec4 hk_sec">
          <Statement desc="법령·시행령·규칙 세 곳을 오가며 조문을 대조하던 일을, 질문 한 줄로 끝냅니다.">
            찾는 시간이 아니라 판단에 쓰는 시간
          </Statement>
          <div className="hk_pair" data-rv>
            <figure className="hk_card hk_dark">
              <div className="hk_bubbles">
                {HK_BEFORE.bubbles.map((b, i) => (
                  <p key={i} className={`hk_bb ${b.who}`} style={{ ['--i' as string]: i }}>{b.t}</p>
                ))}
              </div>
            </figure>
            <figure className="hk_card hk_light">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/screens/hankeon-chat.jpg" alt="한건 Chat 답변 화면 — 조문 인용과 판단 요약" width={1600} height={1000} loading="lazy" />
            </figure>
          </div>
          <div className="hk_lists" data-rv>
            <div>
              <h3><i className="hk_x" aria-hidden="true">✕</i>{HK_BEFORE.title}</h3>
              <ul>{HK_BEFORE.points.map((p) => <li key={p} className="hk_no">{p}</li>)}</ul>
            </div>
            <div>
              <h3><i className="hk_ok" aria-hidden="true">✓</i>{HK_AFTER.title}</h3>
              <ul>{HK_AFTER.points.map((p) => <li key={p} className="hk_yes">{p}</li>)}</ul>
            </div>
          </div>
        </section>

        {/* 모르면 모른다 — 실제 응답 */}
        <section className="mx_sec4 hk_sec">
          <div className="hk_honest" data-rv>
            <div>
              <p className="mx_kicker">모르면 모른다고 답합니다</p>
              <h3>근거가 없으면 확정하지 않습니다</h3>
              <p>같은 날 던진 다른 질문 — 자료에 없는 것은 없다고 답하고, 무엇을 더 확인해야 하는지 적어 줍니다. 근거 {HK_HONEST.evidence}건을 찾고도 그렇게 답했습니다.</p>
            </div>
            <blockquote>
              <p className="hk_hq">{HK_HONEST.q}</p>
              <p className="hk_ha">{HK_HONEST.a}</p>
              <p className="hk_hn">{HK_HONEST.note}</p>
            </blockquote>
          </div>
        </section>

        {/* Biz */}
        <section className="mx_sec4 hk_sec">
          <p className="mx_kicker hk_center">Biz</p>
          <Statement desc={`내 정보·면허를 한 번 적어 두면 나라장터·지자체 공고를 면허와 지역 기준으로 가려 줍니다. 아래는 「${HK_BIZ.profile}」 프로필로 2026-09-22 실제 조회한 결과입니다.`}>
            공고 100건 중 우리가 낼 수 있는 건 2건 — 이유까지 붙여서
          </Statement>
          {/* 판정 셋 — 채널톡 온사이트 장의 짜임(09-22 사용자 지목): 왼쪽 사진 판 위에 제품 카드가 떠 있고,
              오른쪽에 제목·설명·「판정 예시」 목록. 목록을 누르면 왼쪽 카드가 바뀐다. 카드 값은 실제 화면 그대로. */}
          <BizShowcase />
        </section>

      </SolutionShell>
    </>
  )
}
