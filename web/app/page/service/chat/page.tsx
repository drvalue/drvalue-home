import { CHAT_LEAD } from '../solutionContent'
import { GC_AFTER, GC_BEFORE, GC_DEMO, GC_UI } from '../growchatContent'
import GrowchatDemo from '../GrowchatDemo'
import { GROWCHAT_CSS } from '../growchatStyles'
import { PAGE_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { Statement } from '../../business/max/V4'
import { seoMeta } from '@/lib/seo'

/**
 * 채팅(GrowChat) — 디알밸류가 만들어 홈페이지 오른쪽 아래 상담 버블로 실제 쓰는 채팅 솔루션.
 *
 * 2026-09-22 한건 장과 같은 골격(channel.io/kr/cos)으로 옮겼다:
 *  0) 선언 — alf-customer 의 빛 위 큰 문장(사용자가 09-22 alf-customer 를 지목)
 *  1) 대화 시연 — 왼쪽 창 + 오른쪽 제목·문의 예시(alf-customer 짜임). 문의 예시는 실제로 넣어 본 두 문장.
 *  2) 전/후 — 전화·메일로 받던 대화(우리 문장) / 상담원 관리자센터 실제 화면 + ✕ 셋 · ✓ 셋
 *  (상담원 한 화면 구역은 전/후의 ✓ 셋과 겹쳐 뺐다)
 * 화면·문구는 그날 로컬 GrowChat 에서 받은 것(growchatContent.ts). 우리가 쓴 문장은 그 파일 머리에.
 */
const PATH = '/page/service/chat'

export const generateMetadata = seoMeta({
  title: '채팅',
  description: '고객이 홈페이지 상담 버블로 문의하면 상담원이 한 화면에서 배정받아 답하는 채팅 솔루션. 실시간 상담과 게시판형 문의, 고객 이력과 진행 상태를 같이 봅니다. 디알밸류가 만들어 홈페이지에 쓰고 있습니다.',
  path: PATH,
})

const CUSTOMER_SHOT = { src: '/screens/growchat-customer.jpg', alt: '고객 상담 창의 대화 — PCB MES 도입 문의 두 건, 「상담이 시작되었습니다」, 상담사의 LOT 추적 답', w: 924, h: 676 }
const AGENT_SHOT = { src: '/screens/growchat-agent.jpg', alt: '상담원 관리자센터 — 왼쪽 대기중·진행중 방 목록, 가운데 대화와 상담전송·내부전송, 오른쪽 현재 상담 정보', w: 1600, h: 1000 }

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <style dangerouslySetInnerHTML={{ __html: GROWCHAT_CSS }} />
      <SolutionShell
        path={PATH}
        look="v4"
        kicker="채팅"
        kickerSub="AI솔루션"
        headLead="고객과 상담원을 "
        headStrong="곧바로 잇습니다"
        desc="홈페이지 오른쪽 아래 버블을 누르면 문의가 열리고, 상담원은 한 화면에서 배정받아 답합니다. 디알밸류 홈페이지가 지금 쓰는 그 창입니다."
        ctaTitle="고객과 상담원을 곧바로 잇는 채팅, 지금 이 홈페이지에서 써 보세요"
        ctaDesc="오른쪽 아래 상담 버블이 바로 그 창입니다. 도입 상담은 아래에서."
      >
        {/* 머리말 그림 — 상담원 화면(뒤) + 고객 대화(앞). 사용자가 원래의 폰 프레임 한 장을 반려(09-22). */}
        <div className="gc_hero" data-rv>
          <span className="gc_hero_tag">GrowChat · 고객 창 ↔ 상담원 화면</span>
          <div className="gc_frame gc_hero_agent">
            <div className="gc_frame_bar"><i /><i /><i /><span>growchat · 관리자센터</span></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={AGENT_SHOT.src} alt={AGENT_SHOT.alt} width={AGENT_SHOT.w} height={AGENT_SHOT.h} />
          </div>
          <div className="gc_frame gc_hero_cust">
            <div className="gc_frame_bar"><i /><i /><i /><span>홈페이지 상담 창</span></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CUSTOMER_SHOT.src} alt={CUSTOMER_SHOT.alt} width={CUSTOMER_SHOT.w} height={CUSTOMER_SHOT.h} />
          </div>
        </div>

        {/* 선언 — channel.io/kr/alf-customer 의 「ALF는 … AI 에이전트입니다」 구역(사용자 지목 09-22).
            부드러운 빛 위에 큰 문장 둘. 문장은 CHAT_LEAD(프로토타입) 것. */}
        <section className="gc_manifesto" data-rv="pop">
          <p className="gc_mani_l1"><b>채팅</b>은 {CHAT_LEAD.items![0].t}과 {CHAT_LEAD.items![1].t}, <b>두 가지 방식</b>으로 문의를 받습니다.</p>
          <p className="gc_mani_l2">{CHAT_LEAD.desc}</p>
        </section>

        {/* 대화 시연 — ALF 장처럼 왼쪽 창, 오른쪽 제목·설명·「이런 문의를 할 수 있어요」 */}
        <section className="mx_sec4 hk_sec">
          <div className="gc_demo2">
            <div className="hk_plate gc_plate gc_demo2_win">
              <GrowchatDemo />
            </div>
            <div className="gc_demo2_txt">
              <p className="mx_kicker">실시간 상담</p>
              <h2 data-rv="pop" data-words>문의 한 줄에<br />상담원이 <b>바로 붙습니다</b></h2>
              <p className="gc_demo2_d">문의를 치면 「{GC_UI.opened}」, 상담원이 배정되면 「{GC_UI.started}」. 왼쪽은 홈페이지 상담 창에 시연으로 넣어 본 대화를 그 순서대로 다시 보여 주는 것입니다.</p>
              <p className="gc_demo2_lab">이런 문의가 그대로 상담원에게 갑니다</p>
              <ul className="gc_chips" data-rv="pop">
                {GC_DEMO.customer.map((m) => <li key={m}>“{m}”</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* 전/후 */}
        <section className="mx_sec4 hk_sec">
          <Statement desc="전화 한 통, 메일 한 줄로 흩어지던 문의가 방 하나에 상태와 함께 모입니다.">
            받는 곳이 하나면 놓치는 문의가 없습니다
          </Statement>
          <div className="hk_pair gc_pair" data-rv>
            <figure className="hk_card hk_dark">
              <div className="hk_bubbles">
                {GC_BEFORE.bubbles.map((b, i) => (
                  <p key={i} className={`hk_bb ${b.who}`} style={{ ['--i' as string]: i }}>{b.t}</p>
                ))}
              </div>
            </figure>
            <figure className="hk_card hk_light">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={AGENT_SHOT.src} alt={AGENT_SHOT.alt} width={AGENT_SHOT.w} height={AGENT_SHOT.h} loading="lazy" />
            </figure>
          </div>
          <div className="hk_lists" data-rv>
            <div>
              <h3><i className="hk_x" aria-hidden="true">✕</i>{GC_BEFORE.title}</h3>
              <ul>{GC_BEFORE.points.map((p) => <li key={p} className="hk_no">{p}</li>)}</ul>
            </div>
            <div>
              <h3><i className="hk_ok" aria-hidden="true">✓</i>{GC_AFTER.title}</h3>
              <ul>{GC_AFTER.points.map((p) => <li key={p} className="hk_yes">{p}</li>)}</ul>
            </div>
          </div>
        </section>

      </SolutionShell>
    </>
  )
}
