import FlowBand from './FlowBand'
import SolutionShell from './SolutionShell'
import { Statement } from './V4'
import { Showcase } from './Patterns'
import { AI_HEAD, INDUSTRIES } from './maxContent'
import { PAGE_CSS } from './maxStyles'
import { MENU_ITEMS } from '@/lib/menu'
import { seoMeta } from '@/lib/seo'

/**
 * 제조AI(M.AX) 소개 — 허브. 옮긴 페이지가 아니라 새로 만든 장이라 대조(compare.py) 대상이 아니다.
 *
 * 2026-09-22 저녁, 사용자가 지정한 두 레퍼런스(channel.io/kr/marketing · /documents)의 느낌만 쓴다 —
 * 큰 제목(64/600) · 알약 kicker · 한 색(강철빛) 틴트 판 · 흰/틴트/어두운 구역 번갈아. 골격:
 * 머리말(화면이 몇 초마다 넘어감) → 인증 띠 → 큰 문장 + 제품군 Showcase(알약 탭 + 큰 카드 + ‹ ›, alf-customer)
 * → 제조 흐름(어두운 판, meet/call IVR 구역) → 문의.
 *
 * 글은 전부 하위 장의 자료(maxContent.ts)·메뉴(lib/menu.ts)에서 온다. 옛 「판 + 정지 3열 + 과제 카드」 제품군
 * 구역(Tabbed/Group/CaseCard)은 뺐다 — 게이지 탭은 하위 장이 맡는다. KPI 대시보드 화면은 안 쓴다(사용자:
 * 「우리 KPI 아니잖아」 — 시연 값이라 대표 화면으로 못 세운다).
 */
const PATH = '/page/business/max'

const SUB = (MENU_ITEMS.find((m) => m.title === 'M.AX')?.sub ?? []).filter((s) => !s.hidden && s.l !== PATH)
const pcb = INDUSTRIES.find((i) => i.id === 'pcb')!
const cos = INDUSTRIES.find((i) => i.id === 'cos')!

export const generateMetadata = seoMeta({
  title: '제조AI(M.AX)',
  description:
    '견적부터 출고까지 하나의 흐름으로 연결된 업종 특화 MES 와 제조 AI. PCB·화장품 업종 특화 기능과 5대 제조 AI 를 제공합니다.',
  path: PATH,
})

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <SolutionShell
        path={PATH}
        look="v4"
        proof
        kicker="제조서비스플랫폼"
        kickerSub="제조AI(M.AX)"
        headLead="현장의 흐르는 데이터를 자동으로 축적·처리하는 M.AX, "
        headStrong="견적부터 출고·정산까지 번호 하나로 이어집니다"
        desc="견적부터 출고까지 하나의 흐름으로 연결된 업종 특화 기능과 제조 AI를 더해 데이터 입력 부담 없이 스스로 기록되고 자동 처리되는 시스템을 만들어 가고 있습니다."
        heroLink="어디부터 볼까"
        // 몇 초마다 넘어가는 넷 — 아래 Showcase 카드 셋(재고 현황·GMP 양식·AI 비서)과 안 겹치는 화면으로.
        heroShot={[
          { src: '/screens/pcb-dash.jpg', alt: '전사 현황 화면 — 당일 수주량·투입량·불량 수와 사양·지시서·출고 대기', w: 1600, h: 1000, tag: 'PCB MES · 전사 현황', url: 'max.drvalue.co.kr / 현황' },
          { src: '/screens/pcb-spec.jpg', alt: '사양 등록 화면 — 모델·필름 소요량·표면처리·적층구조·납품량이 한 장에', w: 1600, h: 563, tag: 'PCB MES · 사양 등록', url: 'max.drvalue.co.kr / 사양' },
          { src: '/screens/cos-material.jpg', alt: '원료 관리 화면 — 원료코드·단가·재고와 최근 입고 이력', w: 1600, h: 463, tag: '화장품 MES · 원료 관리', url: 'max.drvalue.co.kr / 원료' },
          { src: '/screens/form-mapping.jpg', alt: 'AI 가 양식 구조를 읽고 MES 필드에 맞추는 화면', w: 1600, h: 799, tag: 'MES AI · 양식 자동 매핑', url: 'max.drvalue.co.kr / 양식' },
        ]}
        ctaTitle="우리 공장에 맞는 M.AX 구성이 궁금하신가요?"
      >
        <section className="mx_sec4 big" id="mx_body">
          <p className="mx_kicker hk_center">제품군</p>
          <Statement desc="업종 특화 MES 둘과 그 위에서 도는 제조 AI. 탭을 누르거나 화살표로 넘겨 보세요.">
            업종별 기능과 그 위에서 도는 제조 AI 를 나눠 두었습니다
          </Statement>
          <Showcase items={[
            { tab: SUB[0].t, id: 'pcb-mes', kicker: 'PCB MES', headLead: pcb.headLead, headStrong: pcb.headStrong, desc: pcb.desc, href: SUB[0].l,
              shot: { src: '/screens/pcb-stock.jpg', alt: '재고 현황 화면 — 모델별 재고수량·최고/최저 재고·금액·최종 출고일', w: 1600, h: 1000 }, url: 'max.drvalue.co.kr / 재고 현황' },
            { tab: SUB[1].t, id: 'cosmetics-mes', kicker: '화장품 MES', headLead: cos.headLead, headStrong: cos.headStrong, desc: cos.desc, href: SUB[1].l,
              shot: { src: '/screens/form-generate.jpg', alt: 'GMP 양식 출력 화면 — 품질관리기록서를 시스템 값으로 채워 생성', w: 1600, h: 1025 }, url: 'max.drvalue.co.kr / GMP 양식' },
            { tab: SUB[2].t, id: 'mes-ai', kicker: 'MES AI', headLead: AI_HEAD.headLead, headStrong: AI_HEAD.headStrong, desc: AI_HEAD.desc, href: SUB[2].l,
              shot: { src: '/screens/knowledge-ai.jpg', alt: '제조지식 AI 비서 화면 — LOT 이력·유사 클레임 사례·MES 실시간 조회', w: 1600, h: 900 }, url: 'max.drvalue.co.kr / AI 비서' },
          ]} />
        </section>

        <FlowBand />
      </SolutionShell>
    </>
  )
}
