import type { PageSchema } from './page-schema';

/** 찾아오시는 길(/page/company/location). 처음 글은 web 의 location/content.ts 에서 씨앗으로 넣었다. */
export const COMPANY_LOCATION_SCHEMA: PageSchema = {
  key: 'company-location',
  label: '찾아오시는 길',
  path: '/page/company/location',
  fields: [
    {
      type: 'group',
      key: 'shell',
      label: '머리말',
      fields: [
        {
          type: 'text',
          key: 'kicker',
          label: '장 이름',
          max: 40,
          required: true,
        },
        { type: 'text', key: 'kickerSub', label: '상위 메뉴 이름', max: 40 },
        {
          type: 'text',
          key: 'headLead',
          label: '제목 앞부분',
          max: 80,
          required: true,
        },
        { type: 'text', key: 'headStrong', label: '제목 강조 부분', max: 80 },
        { type: 'textarea', key: 'desc', label: '소개 문장', max: 300 },
        { type: 'text', key: 'leadTitle', label: '본문 제목', max: 80 },
        { type: 'text', key: 'ctaTitle', label: '문의 띠 제목', max: 80 },
        { type: 'textarea', key: 'ctaDesc', label: '문의 띠 설명', max: 200 },
      ],
    },
    {
      type: 'group',
      key: 'place',
      label: '위치',
      fields: [
        {
          type: 'text',
          key: 'company',
          label: '회사 이름',
          max: 80,
          required: true,
        },
        {
          type: 'list',
          key: 'address',
          label: '주소',
          itemLabel: '주소 줄',
          min: 1,
          max: 3,
          item: [
            {
              type: 'text',
              key: 'line',
              label: '주소 줄',
              max: 120,
              required: true,
            },
          ],
        },
        {
          type: 'text',
          key: 'tel',
          label: '대표전화',
          max: 20,
          required: true,
          pattern: '^[0-9-]{7,20}$',
          patternMessage: '대표전화는 숫자와 하이픈(-)만 입력해 주세요.',
        },
        {
          type: 'text',
          key: 'email',
          label: '이메일',
          max: 120,
          required: true,
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
          patternMessage: '이메일 주소 형식을 확인해 주세요.',
        },
        {
          type: 'text',
          key: 'mapQuery',
          label: '지도에서 찾을 장소 이름',
          help: '구글 지도가 이 이름으로 장소를 찾아 핀을 꽂습니다. 좌표 대신 건물 이름을 적어 주세요.',
          max: 100,
          required: true,
        },
      ],
    },
    {
      type: 'group',
      key: 'guide',
      label: '방문 안내',
      fields: [
        {
          type: 'text',
          key: 'title',
          label: '안내 제목',
          max: 40,
          required: true,
        },
        { type: 'textarea', key: 'desc', label: '안내 문장', max: 400 },
        {
          type: 'image',
          key: 'photo',
          label: '건물 사진',
          help: '넣으면 방문 안내 아래에 보입니다. 비워 두면 사진 칸이 없습니다.',
        },
      ],
    },
  ],
};
