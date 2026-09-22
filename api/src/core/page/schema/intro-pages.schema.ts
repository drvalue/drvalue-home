import type { ListField, PageField, PageSchema } from './page-schema';
import {
  cardsList,
  compareGroup,
  featuresList,
  heroShotsList,
  leadGroup,
  linesList,
  shellGroup,
  showTabsList,
  statementGroup,
} from './parts';

/**
 * 소개 장(회사·사업·서비스) 15장의 칸 구조. 장마다 따로 짓지 않고 틀 네 갈래를 조립한다 —
 * 회사(안내·비전) · 기능 덩어리(스마트 팩토리·GrowTalk·GrowXD) · 업종(PCB·화장품) · 서비스 시연
 * (오토폼·CADON·컷온·한건) + 모양이 하나뿐인 장(M.AX 소개·MES AI·AI 솔루션 개발·채팅).
 * 처음 글은 web 의 각 장 content.ts 에서 씨앗으로 넣었다(db/migrations/0008).
 * 움직이는 시연(…Demo)·기록 그대로의 응답(한건 「모르면 모른다」)·흐름도(FlowBand)는 코드다.
 */

const text = (key: string, label: string, max: number, extra: object = {}) =>
  ({ type: 'text', key, label, max, ...extra }) as PageField;
const area = (key: string, label: string, max: number, extra: object = {}) =>
  ({ type: 'textarea', key, label, max, ...extra }) as PageField;
const image = (key: string, label: string, extra: object = {}) =>
  ({ type: 'image', key, label, ...extra }) as PageField;

/* ── 회사소개 ─────────────────────────────────────────────── */

export const COMPANY_INTRO_SCHEMA: PageSchema = {
  key: 'company-intro',
  label: '회사소개 · 안내',
  path: '/page/company/intro',
  fields: [
    shellGroup(),
    leadGroup(),
    image('shot', '제품 화면', {
      help: '요약 아래 폭 가득 보이는 화면 한 장입니다.',
    }),
    {
      type: 'group',
      key: 'film',
      label: '브랜드 필름',
      fields: [
        text('title', '제목', 60, { required: true }),
        area('desc', '설명', 200),
        text('youtubeId', '유튜브 영상 번호', 11, {
          required: true,
          pattern: '^[A-Za-z0-9_-]{11}$',
          patternMessage: '유튜브 주소의 v= 뒤 11글자를 적어 주세요.',
          help: 'youtube.com/watch?v= 뒤의 11글자입니다.',
        }),
        text('videoTitle', '영상 이름(화면 읽기 프로그램용)', 80, {
          required: true,
        }),
      ],
    },
  ],
};

export const COMPANY_VISION_SCHEMA: PageSchema = {
  key: 'company-vision',
  label: '회사소개 · 비전',
  path: '/page/company/vision',
  fields: [
    shellGroup(),
    leadGroup(),
    {
      type: 'group',
      key: 'strategy',
      label: '전략',
      fields: [
        text('title', '제목', 80, { required: true }),
        cardsList('items', '카드', { max: 6 }),
      ],
    },
  ],
};

/* ── 기능 덩어리 장 ───────────────────────────────────────── */

const featurePage = (key: string, label: string, path: string): PageSchema => ({
  key,
  label,
  path,
  fields: [shellGroup(), leadGroup(), featuresList()],
});

export const SMART_FAC_SCHEMA = featurePage(
  'business-smart-fac',
  '스마트 팩토리 사업',
  '/page/business/smart_fac',
);
export const GROWTOK_SCHEMA = featurePage(
  'service-growtok',
  'GrowTalk',
  '/page/service/growtok',
);
export const GROWXD_SCHEMA = featurePage(
  'service-growxd',
  'GrowXD',
  '/page/service/growxd',
);

/* ── 업종 장 ──────────────────────────────────────────────── */

const groupsList: ListField = {
  type: 'list',
  key: 'groups',
  label: '구역',
  itemLabel: '구역',
  help: '구역마다 기능 번호로 화면 탭(화면이 있는 기능)이나 카드(없는 기능)를 고릅니다.',
  min: 1,
  max: 6,
  item: [
    text('kicker', '알약 글자', 40, { required: true }),
    text('title', '큰 문장', 160, { required: true }),
    area('desc', '설명', 600),
    text('nos', '기능 번호', 40, {
      required: true,
      pattern: '^\\s*[0-9]{1,2}(\\s*,\\s*[0-9]{1,2})*\\s*$',
      patternMessage:
        '기능 번호는 쉼표로 나눈 숫자로 적어 주세요(예: 1, 2, 3).',
    }),
    text('cols', '카드 종류', 3, {
      pattern: '^(|kpi)$',
      patternMessage: '카드 종류는 비워 두거나 kpi 로 적어 주세요.',
      help: 'kpi 로 적으면 기능 대신 아래 「KPI 카드」가 보입니다.',
    }),
  ],
};

const industry = (
  key: string,
  label: string,
  path: string,
  withKpi: boolean,
): PageSchema => ({
  key,
  label,
  path,
  fields: [
    shellGroup(),
    leadGroup(),
    heroShotsList(),
    featuresList(),
    groupsList,
    ...(withKpi ? [cardsList('kpi', 'KPI 카드', { max: 6 })] : []),
  ],
});

export const PCB_MES_SCHEMA = industry(
  'business-pcb-mes',
  'PCB MES',
  '/page/business/max/pcb-mes',
  true,
);
export const COSMETICS_MES_SCHEMA = industry(
  'business-cosmetics-mes',
  '화장품 MES',
  '/page/business/max/cosmetics-mes',
  false,
);

/* ── M.AX 소개 · MES AI ───────────────────────────────────── */

const showcaseCard = (key: string, label: string): PageField => ({
  type: 'group',
  key,
  label,
  help: '카드의 제목·설명은 그 장(머리말)의 글을 그대로 씁니다.',
  fields: [
    text('kicker', '작은 제목', 40, { required: true }),
    image('shot', '화면', { required: true }),
    text('url', '주소 막대 글자', 80),
  ],
});

export const MAX_HUB_SCHEMA: PageSchema = {
  key: 'business-max',
  label: '제조AI(M.AX) 소개',
  path: '/page/business/max',
  fields: [
    shellGroup({ heroLink: true }),
    heroShotsList(),
    statementGroup('statement', '제품군 문장'),
    showcaseCard('pcbCard', 'PCB MES 카드'),
    showcaseCard('cosCard', '화장품 MES 카드'),
    showcaseCard('aiCard', 'MES AI 카드'),
  ],
};

export const MES_AI_SCHEMA: PageSchema = {
  key: 'business-mes-ai',
  label: 'MES AI',
  path: '/page/business/max/mes-ai',
  fields: [
    shellGroup(),
    leadGroup(),
    heroShotsList(),
    statementGroup('bento', '「실제 화면」 구역'),
    {
      type: 'list',
      key: 'ais',
      label: 'AI 기능',
      itemLabel: 'AI 기능',
      help: '위 「실제 화면」 카드와 아래 단계 카드가 같은 항목을 씁니다.',
      min: 1,
      max: 6,
      item: [
        text('label', '알약 글자', 60, { required: true }),
        text('title', '제목', 120, {
          required: true,
          help: '**두 별표**로 감싼 말은 강조 색으로 보입니다.',
        }),
        area('desc', '설명', 300),
        linesList('steps', '단계', { min: 1, max: 8 }),
        image('shot', '화면', { required: true }),
        text('url', '주소 막대 글자', 80),
        text('tone', '카드 색', 5, {
          pattern: '^(|sand|steel)$',
          patternMessage:
            '카드 색은 비워 두거나 sand · steel 중 하나로 적어 주세요.',
        }),
      ],
    },
  ],
};

/* ── AI 솔루션 개발 ──────────────────────────────────────── */

export const AI_SOL_SCHEMA: PageSchema = {
  key: 'business-ai-sol',
  label: 'AI 솔루션 개발',
  path: '/page/business/ai_sol',
  fields: [
    shellGroup({ heroLink: true }),
    leadGroup(),
    heroShotsList(),
    {
      type: 'group',
      key: 'road',
      label: '로드맵',
      fields: [
        text('kicker', '알약 글자', 40, { required: true }),
        text('title', '큰 문장', 160, { required: true }),
        cardsList('items', '단계', { min: 1, max: 6, itemLabel: '단계' }),
      ],
    },
    // 제품군 구역의 제목·설명은 각 서비스 장의 요약 칸을 쓴다 — 여기는 구역마다 화면 탭만.
    showTabsList('autoformTabs', '오토폼 구역 탭'),
    showTabsList('cutonTabs', '컷온 구역 탭'),
    showTabsList('cadonTabs', 'CADON 구역 탭'),
    showTabsList('chatTabs', '채팅 구역 탭'),
    showTabsList('hangeonTabs', '한건 구역 탭'),
  ],
};

/* ── 서비스 시연 장 · 채팅 ────────────────────────────────── */

const serviceDemo = (
  key: string,
  label: string,
  path: string,
  demoLabel: string,
  extraLabel: string,
): PageSchema => ({
  key,
  label,
  path,
  fields: [
    shellGroup(),
    leadGroup('요약 (AI 솔루션 개발 장의 이 구역도 이 글을 씁니다)'),
    heroShotsList(),
    statementGroup('demo', demoLabel),
    statementGroup('compareStatement', '전 · 후 구역 문장'),
    compareGroup(),
    statementGroup('extra', extraLabel),
  ],
});

export const AUTOFORM_SCHEMA = serviceDemo(
  'service-autoform',
  '오토폼',
  '/page/service/autoform',
  '시연 구역 문장',
  '양식 구역 문장',
);
export const CUTON_SCHEMA = serviceDemo(
  'service-cuton',
  '컷온',
  '/page/service/cuton',
  '시연 구역 문장',
  '견적·보관·입찰 구역 문장',
);
export const CADON_SCHEMA = serviceDemo(
  'service-cadon',
  'CADON',
  '/page/service/cadon',
  '시연 구역 문장',
  '검토 구역 문장',
);
export const HANGEON_SCHEMA = serviceDemo(
  'service-hangeon',
  '한건',
  '/page/service/hangeon',
  'Chat 시연 구역 문장',
  'Biz 구역 문장',
);

export const CHAT_SCHEMA: PageSchema = {
  key: 'service-chat',
  label: '채팅',
  path: '/page/service/chat',
  fields: [
    shellGroup(),
    leadGroup('요약 (선언 문장과 AI 솔루션 개발 장의 채팅 구역이 씁니다)'),
    image('agentShot', '머리 그림 — 상담원 화면', { required: true }),
    image('customerShot', '머리 그림 — 고객 창', { required: true }),
    statementGroup('compareStatement', '전 · 후 구역 문장'),
    compareGroup(),
  ],
};
