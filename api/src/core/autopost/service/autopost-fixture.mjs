// 자동 글 테스트의 고정 자료. today = 2026-11-12 기준으로 통과하는 글 한 편과, 한 군데씩 바꾸는 도우미.
export const good = {
  title: '지멘스, 공장 설비 고장을 미리 잡는 AI 를 내놨습니다',
  summary:
    '지멘스가 설비 센서 데이터를 읽어 고장을 미리 알려 주는 AI 를 공개했습니다. 시범 공장에서 멈춤 시간이 30% 줄었습니다.',
  seo_description:
    '지멘스가 공개한 설비 예지보전 AI 의 성능과 이전 방식과의 차이, 현장에서 어떻게 쓰이는지를 출처와 함께 정리했습니다.',
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
      url: 'https://press.siemens.com/global/en/pressrelease/predictive-ai',
      publisher: 'Siemens',
      published: '2026-11-10',
    },
    {
      title: 'Factory pilot results',
      url: 'https://example.org/reports/factory-pilot',
      publisher: 'Example Research',
      published: '2026-11-05',
    },
  ],
  claims: [
    {
      sentence: '시범 공장에서 설비 멈춤 시간이 30% 줄었습니다.',
      value: '30%',
      source_url:
        'https://press.siemens.com/global/en/pressrelease/predictive-ai',
      quote: 'reduced downtime by 30%',
    },
    {
      sentence: '투자 규모는 1,200억 원입니다.',
      value: '1,200억 원',
      source_url: 'https://example.org/reports/factory-pilot',
      quote: 'KRW 120 billion',
    },
  ],
};
export const allTrue = (a) =>
  Object.fromEntries(a.claims.map((c) => [c.value, true]));
export const withHook = (a, text) => ({ ...a, hook: [...a.hook, text] });
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
