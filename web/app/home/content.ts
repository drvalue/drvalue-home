/**
 * 메인(/) 의 글 — CMS(page_contents · key 'home') 의 씨앗이자 api 가 안 닿을 때의 예비.
 *
 * 칸 모양은 api 의 core/page/schema/home.schema.ts 와 같다. 한쪽만 고치면 저장이 400 이 되거나
 * 화면이 빈칸을 그린다. 글은 **2026-09-22 에 화면에 있던 것 그대로** 옮겼다(새로 지은 말 없음).
 * 머리 그림의 숫자 셋은 여기 없다 — 게시판 글 수를 센다(page.tsx).
 *
 * 이 파일은 web/scripts/page-seed.mjs 가 node 로 바로 읽는다 — `@/` 별칭을 쓰지 않는다.
 */
import { PROOFS, type Proof } from './proofData'

export const HOME_PAGE_KEY = 'home'

export type HomeSectionKey = 'proof' | 'biz' | 'news' | 'cta'
type Link = { label: string; href: string }
type Image = { id: string | null; alt: string; width?: number | null; height?: number | null } | null

export type HomeProofCard = { year: string; kind: Proof['kind']; title: string; detail: string; icon: string }
export type HomeBizCard = { href: string; kicker: string; title: string; lead: string; points: { text: string }[]; icon: string }

export type HomeContent = {
  hero: {
    kicker: string
    titleLead: string
    titleStrong: string
    desc: string
    primary: Link
    secondaryLabel: string
    background: Image
  }
  sections: { section: HomeSectionKey; visible: boolean }[]
  proof: { kicker: string; title: string; more: Link; cards: HomeProofCard[] }
  biz: { kicker: string; title: string; cards: HomeBizCard[] }
  news: { kicker: string; title: string; more: Link }
  cta: { title: string; desc: string; buttonLabel: string }
}

export const HOME_DEFAULT: HomeContent = {
  hero: {
    kicker: 'MANUFACTURING AI · DX',
    titleLead: 'AI로 실현하는',
    titleStrong: '지능형 제조의 미래',
    desc: 'MES/ERP 구축, 제조 AI 자동화, LLM·RAG 기반 AI Chat, 상담 솔루션. 실제 현장에서 사용하는 시스템을 만듭니다.',
    primary: { label: 'M.AX 살펴보기', href: '/page/business/max' },
    secondaryLabel: '문의하기',
    background: null,
  },
  sections: [
    { section: 'proof', visible: true },
    { section: 'biz', visible: true },
    { section: 'news', visible: true },
    { section: 'cta', visible: true },
  ],
  proof: {
    kicker: 'CREDENTIALS',
    title: '말보다 먼저 쌓아 온 것들',
    more: { label: '연혁 전체 보기', href: '/page/company/history' },
    cards: PROOFS.map((p) => ({ year: p.year, kind: p.kind, title: p.title, detail: p.detail, icon: p.icon })),
  },
  biz: {
    kicker: 'BUSINESS',
    title: '무엇을 만드는가',
    cards: [
      {
        href: '/page/business/max',
        kicker: 'MANUFACTURING AI',
        title: '제조AI(M.AX)',
        lead: '견적부터 출고까지 하나의 흐름으로 연결된 업종 특화 MES 와 제조 AI.',
        points: [{ text: 'PCB · 화장품 업종 특화' }, { text: 'MES 공통 프로세스 6단계' }, { text: '제조 특화 AI 5대 기능' }],
        icon: 'fa-cogs',
      },
      {
        href: '/page/business/ai_sol',
        kicker: 'AI SOLUTION DEVELOPMENT',
        title: 'AI 솔루션 개발',
        lead: '최신 LLM 부터 보안이 강조된 온프레미스 로컬 AI 까지 맞춤형으로 제안합니다.',
        points: [{ text: 'Global LLM 최적화' }, { text: '보안 특화 로컬 LLM' }, { text: 'RAG 기반 지식 서비스' }],
        icon: 'fa-comments-o',
      },
      {
        href: '/page/business/smart_fac',
        kicker: 'NEXT-GEN MANUFACTURING',
        title: '스마트 팩토리 사업',
        lead: '현장의 모든 설비와 공정을 디지털로 연결해 실시간 최적화를 실현합니다.',
        points: [{ text: 'AI 자동 견적 (Costing)' }, { text: 'IoT 통합 모니터링' }, { text: 'MES/ERP 실시간 연계' }],
        icon: 'fa-industry',
      },
    ],
  },
  news: {
    kicker: 'NEWS',
    title: '디알밸류의 최근 소식',
    more: { label: '전체 보기', href: '/page/support/notice' },
  },
  cta: {
    title: '우리 공장에, 우리 업무에 맞는 구성이 궁금하신가요?',
    desc: '현장 상황을 알려주시면 맞는 방식을 제안해 드립니다.',
    buttonLabel: '문의하기',
  },
}

/** 저장된 구역 차례에서 빠진 구역이 있으면 기본 차례로 뒤에 붙인다(스키마가 4개를 강제하지만 예비 글에도 쓴다). */
export function sectionOrder(c: HomeContent): { section: HomeSectionKey; visible: boolean }[] {
  const seen = new Set(c.sections.map((s) => s.section))
  return [...c.sections, ...HOME_DEFAULT.sections.filter((s) => !seen.has(s.section))]
}

/** 카드의 연도를 겹치지 않게, 새 해부터. 연도 고르개가 이것으로 만들어진다. */
export function proofYears(cards: HomeProofCard[]): string[] {
  return [...new Set(cards.map((c) => c.year))].sort((a, b) => b.localeCompare(a))
}
