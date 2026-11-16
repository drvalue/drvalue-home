// 자동 글 테스트의 고정 자료. today = 2026-11-12 기준으로 통과하는 글 한 편과, 한 군데씩 바꾸는 도우미.
const SIEMENS =
  'https://press.siemens.com/global/en/pressrelease/predictive-ai';
const PILOT = 'https://example.org/reports/factory-pilot';

export const good = {
  title: '지멘스, 공장 설비 고장을 미리 잡는 AI 를 내놨습니다',
  summary:
    '지멘스가 설비 센서 데이터를 읽어 고장을 미리 알려 주는 AI 를 공개했습니다. 시범 공장에서 멈춤 시간이 30% 줄었습니다.',
  seo_description:
    '지멘스가 공개한 설비 예지보전 AI 의 성능과 이전 방식과의 차이, 현장에서 어떻게 쓰이는지를 출처와 함께 정리했습니다.',
  key_points: [
    '지멘스가 설비 고장을 미리 알려 주는 AI 를 내놨습니다.',
    '정해진 주기 점검에서 상태를 보고 하는 점검으로 바뀝니다.',
    '정비 일정을 생산 계획에 맞춰 잡을 수 있습니다.',
  ],
  figures: [],
  hook: [
    '지멘스가 공장 설비의 고장을 미리 알려 주는 AI 를 내놨습니다.',
    '시범 공장에서 설비 멈춤 시간이 30% 줄었고, 투자 규모는 1,200억 원입니다.',
  ],
  sections: [
    {
      heading: '무엇이 나왔나',
      paragraphs: ['설비에 붙은 센서 값을 읽어 이상 징후를 찾는 모델입니다.'],
    },
    {
      heading: '핵심 수치',
      paragraphs: ['시범 공장에서 멈춤 시간이 30% 줄었습니다.'],
    },
    {
      heading: '이전 방식과의 차이',
      paragraphs: [
        '정해진 주기로 점검하던 것을 상태를 보고 점검하는 방식으로 바꿉니다.',
      ],
    },
    {
      heading: '현장에서의 쓰임새',
      paragraphs: ['정비 일정을 생산 계획에 맞춰 잡을 수 있습니다.'],
    },
  ],
  sources: [
    {
      title: 'Siemens launches predictive AI',
      url: SIEMENS,
      publisher: 'Siemens',
      published: '2026-11-10',
    },
    {
      title: 'Factory pilot results',
      url: PILOT,
      publisher: 'Example Research',
      published: '2026-11-05',
    },
  ],
  // 주장의 문장은 본문에 그대로 있는 구절이다. 숫자가 든 문단마다 그 숫자의 주장이 있다.
  claims: [
    {
      sentence: '시범 공장에서 설비 멈춤 시간이 30% 줄었고',
      value: '30%',
      source_url: SIEMENS,
      quote: 'reduced downtime by 30%',
    },
    {
      sentence: '투자 규모는 1,200억 원입니다.',
      value: '1,200억 원',
      source_url: PILOT,
      quote: 'KRW 120 billion',
    },
    {
      sentence: '시범 공장에서 멈춤 시간이 30% 줄었습니다.',
      value: '30%',
      source_url: SIEMENS,
      quote: 'reduced downtime by 30%',
    },
  ],
};

/** 모델이 쓴 덩어리 전부(판정의 문단 열쇠 — 숫자가 없는 덩어리가 섞여도 된다). */
const units = (a) =>
  [
    a.title,
    a.summary,
    a.seo_description,
    ...(a.key_points ?? []),
    ...(a.figures ?? []).map((f) => `${f.label} ${f.value}`),
    ...(a.hook ?? []),
    ...(a.sections ?? []).flatMap((s) => [s.heading, ...(s.paragraphs ?? [])]),
  ].filter((u) => typeof u === 'string');

/** 전부 확인된 판정. 주장은 문장으로, 출처는 주소로 찾는다. */
export const allTrue = (a) => ({
  claims: Object.fromEntries((a.claims ?? []).map((c) => [c.sentence, true])),
  sources: Object.fromEntries((a.sources ?? []).map((s) => [s.url, true])),
  units: Object.fromEntries(units(a).map((u) => [u, true])),
  unopened: [],
  usedSources: (a.sources ?? []).map((s) => s.url),
  unanswered: [],
  datesOk: true,
});
export const withHook = (a, text) => ({ ...a, hook: [...a.hook, text] });
/** 본문 문단 하나와 그 문단의 주장을 같이 더한다. */
export const withClaim = (a, text, value) => ({
  ...a,
  hook: [...a.hook, text],
  claims: [
    ...a.claims,
    { sentence: text, value, source_url: SIEMENS, quote: 'q' },
  ],
});
export const withSourceDate = (a, d) => ({
  ...a,
  sources: a.sources.map((s) => ({ ...s, published: d })),
});
export const withSourceTitle = (a, t) => ({
  ...a,
  sources: [{ ...a.sources[0], title: t }, ...a.sources.slice(1)],
});
export const withSourceUrl = (a, u) => ({
  ...a,
  sources: [...a.sources, { ...a.sources[0], url: u }],
});
