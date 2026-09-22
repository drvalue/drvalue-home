import type { PageField, PageSchema } from './page-schema';

const HREF = '^/(?!/)[^\\s]*$';
const HREF_MESSAGE =
  '사이트 안 주소는 /로 시작하게 적어 주세요(예: /page/business/max).';
const ICON = '^fa-[a-z0-9-]+$';
const ICON_MESSAGE =
  '아이콘 이름은 fa- 로 시작하는 영문 소문자로 적어 주세요(예: fa-cogs).';
const ICON_HELP =
  '사이트가 쓰는 Font Awesome 4.7 아이콘 이름입니다(예: fa-cogs · fa-industry).';

/** 구역 머리(작은 영문 · 제목). 신뢰의 근거 · 사업 · 소식이 같은 모양을 쓴다. */
const head = (title: string): PageField[] => [
  { type: 'text', key: 'kicker', label: '작은 영문 머리', max: 40 },
  {
    type: 'text',
    key: 'title',
    label: `${title} 제목`,
    max: 60,
    required: true,
  },
];

/**
 * 메인(/). 처음 글은 web 의 app/home/content.ts 에서 씨앗으로 넣었다.
 *
 * 머리 그림의 숫자 셋(특허·저작권·수행실적)은 여기 없다 — 게시판 글 수를 세서 그린다
 * (화면에 적는 숫자는 자료에서 센다). 머리 그림 사진은 기간 배너(home_banners)가 있으면 그것이 이긴다.
 */
export const HOME_SCHEMA: PageSchema = {
  key: 'home',
  label: '메인 화면',
  path: '/',
  adminPath: '/admin/home',
  fields: [
    {
      type: 'group',
      key: 'hero',
      label: '머리 그림',
      fields: [
        { type: 'text', key: 'kicker', label: '작은 영문 머리', max: 60 },
        {
          type: 'text',
          key: 'titleLead',
          label: '제목 첫 줄',
          max: 40,
          required: true,
        },
        {
          type: 'text',
          key: 'titleStrong',
          label: '제목 둘째 줄',
          max: 40,
        },
        { type: 'textarea', key: 'desc', label: '소개 문장', max: 300 },
        {
          type: 'link',
          key: 'primary',
          label: '첫째 버튼',
          required: true,
          help: '진행 중인 배너에 링크가 있으면 그 링크가 대신 나옵니다.',
        },
        {
          type: 'text',
          key: 'secondaryLabel',
          label: '문의 버튼 글자',
          max: 20,
          required: true,
          help: '누르면 문의 창이 열립니다.',
        },
        {
          type: 'image',
          key: 'background',
          label: '배경 사진',
          help: '비워 두면 기본 사진이 나옵니다. 진행 중인 배너가 있으면 배너 사진이 이깁니다.',
        },
      ],
    },
    {
      type: 'list',
      key: 'sections',
      label: '구역 차례',
      itemLabel: '구역',
      help: '위에서부터 이 차례로 보입니다. 머리 그림은 늘 맨 위입니다. 「보이기」를 끄면 그 구역이 빠집니다.',
      min: 4,
      max: 4,
      uniqueBy: 'section',
      item: [
        {
          type: 'select',
          key: 'section',
          label: '구역',
          required: true,
          options: [
            { value: 'proof', label: '신뢰의 근거' },
            { value: 'biz', label: '사업영역' },
            { value: 'news', label: '최근 소식' },
            { value: 'cta', label: '문의 띠' },
          ],
        },
        { type: 'boolean', key: 'visible', label: '보이기' },
      ],
    },
    {
      type: 'group',
      key: 'proof',
      label: '신뢰의 근거',
      fields: [
        ...head('구역'),
        { type: 'link', key: 'more', label: '더 보기 링크' },
        {
          type: 'list',
          key: 'cards',
          label: '카드',
          itemLabel: '카드',
          help: '연혁에 화면으로 보이는 항목만 적어 주세요. 연도 고르개는 카드의 연도로 만들어집니다.',
          min: 1,
          max: 30,
          item: [
            {
              type: 'text',
              key: 'year',
              label: '연도',
              max: 4,
              required: true,
              pattern: '^20[0-9]{2}$',
              patternMessage: '연도는 2025처럼 네 자리 숫자로 적어 주세요.',
            },
            {
              type: 'select',
              key: 'kind',
              label: '분류',
              required: true,
              options: [
                { value: '인증', label: '인증' },
                { value: '선정', label: '선정' },
                { value: '협력', label: '협력' },
              ],
            },
            {
              type: 'text',
              key: 'title',
              label: '카드 제목',
              max: 120,
              required: true,
            },
            { type: 'textarea', key: 'detail', label: '설명', max: 200 },
            {
              type: 'text',
              key: 'icon',
              label: '아이콘',
              max: 40,
              required: true,
              pattern: ICON,
              patternMessage: ICON_MESSAGE,
              help: ICON_HELP,
            },
          ],
        },
      ],
    },
    {
      type: 'group',
      key: 'biz',
      label: '사업영역',
      fields: [
        ...head('구역'),
        {
          type: 'list',
          key: 'cards',
          label: '카드',
          itemLabel: '카드',
          min: 1,
          max: 6,
          item: [
            {
              type: 'text',
              key: 'href',
              label: '가는 곳',
              max: 200,
              required: true,
              pattern: HREF,
              patternMessage: HREF_MESSAGE,
            },
            { type: 'text', key: 'kicker', label: '작은 영문 머리', max: 60 },
            {
              type: 'text',
              key: 'title',
              label: '카드 제목',
              max: 40,
              required: true,
            },
            { type: 'textarea', key: 'lead', label: '설명', max: 200 },
            {
              type: 'list',
              key: 'points',
              label: '요점',
              itemLabel: '요점',
              max: 5,
              item: [
                {
                  type: 'text',
                  key: 'text',
                  label: '요점',
                  max: 60,
                  required: true,
                },
              ],
            },
            {
              type: 'text',
              key: 'icon',
              label: '아이콘',
              max: 40,
              required: true,
              pattern: ICON,
              patternMessage: ICON_MESSAGE,
              help: ICON_HELP,
            },
          ],
        },
      ],
    },
    {
      type: 'group',
      key: 'news',
      label: '최근 소식',
      help: '글은 공지사항·보도자료에서 자동으로 옵니다. 여기서는 머리와 링크만 고칩니다.',
      fields: [
        ...head('구역'),
        { type: 'link', key: 'more', label: '전체 보기 링크' },
      ],
    },
    {
      type: 'group',
      key: 'cta',
      label: '문의 띠',
      fields: [
        {
          type: 'text',
          key: 'title',
          label: '띠 제목',
          max: 80,
          required: true,
        },
        { type: 'textarea', key: 'desc', label: '띠 설명', max: 200 },
        {
          type: 'text',
          key: 'buttonLabel',
          label: '버튼 글자',
          max: 20,
          required: true,
          help: '누르면 문의 창이 열립니다.',
        },
      ],
    },
  ],
};
