import { AI_HEAD, AI_LEAD, AI_SHOWN } from '../maxContent'
import { PAGE_CSS } from '../maxStyles'
import SolutionShell from '../SolutionShell'
import { Bento, FlowCard } from '../Patterns'
import { seoMeta } from '@/lib/seo'

/**
 * 원본 PHP 에 없는 새 페이지다. M.AX 의 「제조 특화 AI」 탭에서 세 기능을 떼어 냈다.
 *
 * 2026-09-22 저녁 — channel.io/kr/marketing · /documents 의 느낌으로 다시 그렸다: 알약 kicker ·
 * 큰 가운데 제목 · 강철빛 틴트 한 색 · 흰/틴트 구역 번갈아.
 *  1) Bento(틴트 구역): 세 기능의 실제 화면 — 넓은 카드 하나 + 반 카드 둘
 *  2) FlowCard × 3(흰 구역): 기능마다 단계가 ↓ 로 이어진다. 문서가 들어와 값이 뽑히고 대조되어
 *     들어가는 순서라 번호가 장식이 아니다(옛 AiSteps 의 주석 그대로).
 * 글은 전부 maxContent.ts 의 AI_FEATURES·AI_LEAD 그대로.
 */
const PATH = '/page/business/max/mes-ai'

export const generateMetadata = seoMeta({
  title: 'MES AI',
  description:
    '거래명세서·성적서를 OCR 로 읽어 MES 에 자동 입고하고, 국가별 규제를 자동 대조해 검증하며, 쌓인 제조 지식을 대화로 꺼내 씁니다.',
  path: PATH,
})

/* 양식 자동생성(a2)과 고객 응대 챗봇(a5)은 각자 페이지가 따로 있다.
   여기는 MES 안에서 도는 셋만 모은다 — 읽기·대조하기·물어보기. */
const LIST = AI_SHOWN
const URLS = ['max.drvalue.co.kr / 자재 입출고', 'max.drvalue.co.kr / 규제 검증', 'max.drvalue.co.kr / AI 비서']
const TONES = ['', 'sand', 'steel'] as const

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <SolutionShell
        path={PATH}
        look="v4"
        kicker="MES AI"
        kickerSub="제조AI(M.AX)"
        headLead={AI_HEAD.headLead}
        headStrong={AI_HEAD.headStrong}
        desc={AI_HEAD.desc}
        lead={AI_LEAD}
        // 몇 초마다 넘어가는 셋 — 양식 자동생성(a2, 오토폼 장이 맡는 기능)의 화면이라 아래 Bento 의 셋과 안 겹친다.
        heroShot={[
          { src: '/screens/form-mapping.jpg', alt: 'AI 가 양식 구조를 읽고 MES 필드에 맞추는 화면', w: 1600, h: 799, tag: '양식 자동 매핑', url: 'max.drvalue.co.kr / 양식' },
          { src: '/screens/solution-form-automation-upload.jpg', alt: '양식 업로드 화면 — 데이터베이스 연결 상태와 분석된 hwp·hwpx 양식 목록', w: 1600, h: 1121, tag: '양식 업로드', url: 'max.drvalue.co.kr / 양식 업로드' },
          { src: '/screens/solution-form-automation-generate.jpg', alt: '문서 생성 화면 — 레코드를 고르면 품질관리기록서 양식을 값으로 채운다', w: 1600, h: 1024, tag: '문서 생성', url: 'max.drvalue.co.kr / 문서 생성' },
        ]}
      >
        <Bento
          // 제목을 「읽고, 대조하고, 물어봅니다」로 두면 바로 위 요약 칸(AI_LEAD.title)과 같은 문장이 두 번 보인다.
          kicker="실제 화면"
          title="MES 안에서 도는 AI 셋"
          desc="문서에서 값을 뽑아 MES 와 맞춰 보고, 국가별 규제를 대조하고, 흩어진 제조 지식을 대화로 꺼냅니다."
          items={LIST.map((a, i) => ({
            t: a.title,
            d: AI_LEAD.items![i].d,
            shot: a.shots![0],
            url: URLS[i],
          }))}
        />

        {LIST.map((a, i) => (
          <section className="mx_sec4" key={a.id}>
            <div className="mx_wrap">
              <p className="mx_kicker hk_center">{a.label.replace(/^[①-⑤]\s*/, '')}</p>
              <FlowCard title={a.title} desc={AI_LEAD.items![i].d} steps={a.steps} tone={TONES[i]} />
            </div>
          </section>
        ))}
      </SolutionShell>
    </>
  )
}
