import type { GroupField, ListField, PageField } from './page-schema';

/**
 * 소개 장(회사·사업·서비스)이 같이 쓰는 칸 묶음. 장마다 스키마를 따로 지으면 같은 틀(SolutionShell)의
 * 칸 이름·길이가 장마다 어긋난다 — 여기서 한 번 정하고 장은 조립만 한다.
 * 웹의 `app/page/pageContentParts.ts` 가 같은 모양의 형과 변환을 갖는다(칸을 바꾸면 둘 다 고친다).
 */

const text = (
  key: string,
  label: string,
  max: number,
  extra: Partial<PageField> = {},
): PageField => ({ type: 'text', key, label, max, ...extra }) as PageField;
const area = (
  key: string,
  label: string,
  max: number,
  extra: Partial<PageField> = {},
): PageField => ({ type: 'textarea', key, label, max, ...extra }) as PageField;

const MARK_HELP = '**두 별표**로 감싼 말은 강조 색으로 보입니다.';

/** 머리말과 문의 띠(SolutionShell). */
export function shellGroup(opts: { heroLink?: boolean } = {}): GroupField {
  const fields: PageField[] = [
    text('kicker', '장 이름', 40, { required: true }),
    text('kickerSub', '상위 메뉴 이름', 40),
    text('headLead', '제목 앞부분', 120, { required: true }),
    text('headStrong', '제목 강조 부분', 120),
    area('desc', '소개 문장', 400),
  ];
  if (opts.heroLink)
    fields.push(
      text('heroLink', '머리말 둘째 단추 글', 30, {
        help: '비워 두면 「기능 보기」로 나옵니다.',
      }),
    );
  fields.push(
    text('ctaTitle', '문의 띠 제목', 120, {
      help: '비워 두면 기본 문구가 나옵니다.',
    }),
    area('ctaDesc', '문의 띠 설명', 300, {
      help: '비워 두면 기본 문구가 나옵니다.',
    }),
  );
  return { type: 'group', key: 'shell', label: '머리말', fields };
}

/** 제목·설명 한 쌍의 목록(요약 칸·카드 줄). */
export function cardsList(
  key: string,
  label: string,
  opts: { min?: number; max?: number; itemLabel?: string } = {},
): ListField {
  return {
    type: 'list',
    key,
    label,
    itemLabel: opts.itemLabel ?? '항목',
    min: opts.min ?? 0,
    max: opts.max ?? 8,
    item: [text('t', '제목', 80, { required: true }), area('d', '설명', 300)],
  };
}

/** 머리말 밑 요약 칸(Lead). */
export function leadGroup(label = '요약'): GroupField {
  return {
    type: 'group',
    key: 'lead',
    label,
    fields: [
      text('title', '제목', 120, { required: true }),
      area('desc', '설명', 600),
      text('heroN', '큰 값', 20, {
        help: '채우면 항목이 「큰 값 하나 + 한 줄 셋」으로 보입니다. 본문에 있는 숫자만 쓰세요.',
      }),
      text('heroLabel', '큰 값 설명', 120),
      cardsList('items', '항목', { max: 6 }),
    ],
  };
}

/** 그림 한 장 + 판 위 글자(머리말 판 · 탭 화면). */
function shotItem(extra: PageField[] = []): PageField[] {
  return [
    { type: 'image', key: 'image', label: '화면', required: true },
    text('tag', '판 위 이름', 60),
    text('url', '주소 막대 글자', 80),
    ...extra,
  ];
}

/** 머리말 밑 판에 올리는 제품 화면. 여럿이면 몇 초마다 넘어간다. */
export function heroShotsList(): ListField {
  return {
    type: 'list',
    key: 'heroShots',
    label: '머리말 화면',
    itemLabel: '화면',
    help: '둘 이상이면 몇 초마다 넘어갑니다. 아래 본문에 나오는 화면과 겹치지 않게 고르세요.',
    min: 0,
    max: 6,
    item: shotItem(),
  };
}

/** 가운데 큰 문장 한 덩어리(알약 kicker + 제목 + 설명). */
export function statementGroup(
  key: string,
  label: string,
  opts: { kicker?: boolean } = {},
): GroupField {
  const fields: PageField[] = [];
  if (opts.kicker !== false) fields.push(text('kicker', '알약 글자', 40));
  fields.push(
    text('title', '큰 문장', 160, { required: true }),
    area('desc', '설명', 600),
  );
  return { type: 'group', key, label, fields };
}

/** 한 줄 글 목록(요점·칩). 목록 항목은 객체라 `text` 칸 하나로 싼다. */
export function linesList(
  key: string,
  label: string,
  opts: { max?: number; lineMax?: number; help?: string; min?: number } = {},
): ListField {
  return {
    type: 'list',
    key,
    label,
    itemLabel: '줄',
    help: opts.help,
    min: opts.min ?? 0,
    max: opts.max ?? 10,
    item: [text('text', '글', opts.lineMax ?? 300, { required: true })],
  };
}

/** 기능 덩어리(FeatureBlock · 업종 장의 기능). */
export function featuresList(label = '기능'): ListField {
  return {
    type: 'list',
    key: 'features',
    label,
    itemLabel: '기능',
    min: 0,
    max: 12,
    item: [
      text('no', '번호', 2, {
        required: true,
        pattern: '^[0-9]{1,2}$',
        patternMessage: '번호는 숫자로 입력해 주세요.',
        help: '업종 장의 묶음이 이 번호로 기능을 고릅니다.',
      }),
      text('kicker', '작은 제목', 80, { required: true }),
      text('title', '제목', 160, { required: true, help: MARK_HELP }),
      linesList('points', '요점', { max: 8, help: MARK_HELP }),
      linesList('chips', '해시태그', { max: 8, lineMax: 40 }),
      text('calloutLead', '강조 칸 설명', 200),
      text('calloutResult', '강조 칸 결과', 200),
      {
        type: 'list',
        key: 'shots',
        label: '화면',
        itemLabel: '화면',
        min: 0,
        max: 6,
        item: [{ type: 'image', key: 'image', label: '화면', required: true }],
      },
    ],
  };
}

/** 게이지 탭(ShowTabs) 한 줄. */
export function showTabsList(key: string, label: string, max = 6): ListField {
  return {
    type: 'list',
    key,
    label,
    itemLabel: '탭',
    min: 1,
    max,
    item: shotItem([
      text('t', '탭 제목', 80, { required: true }),
      area('d', '탭 설명', 300),
      text('tone', '판 색', 5, {
        pattern: '^(|sand|steel)$',
        patternMessage:
          '판 색은 비워 두거나 sand · steel 중 하나로 적어 주세요.',
      }),
    ]),
  };
}

/** 전/후 비교(서비스 시연 장의 「전 — 후」 칸). */
export function compareGroup(): GroupField {
  const side = (key: string, label: string, bubbles: boolean): GroupField => ({
    type: 'group',
    key,
    label,
    fields: [
      text('title', '제목', 80, { required: true }),
      linesList('points', '요점', { max: 8 }),
      ...(bubbles
        ? [
            {
              type: 'list',
              key: 'bubbles',
              label: '말풍선',
              itemLabel: '말풍선',
              min: 0,
              max: 10,
              item: [
                text('who', '말한 쪽', 4, {
                  required: true,
                  pattern: '^(me|them)$',
                  patternMessage:
                    '말한 쪽은 me(우리 쪽) 또는 them(상대 쪽)으로 적어 주세요.',
                  help: 'me 는 우리 쪽, them 은 상대 쪽 말풍선입니다(원래 값 그대로).',
                }),
                text('t', '말', 200, { required: true }),
              ],
            } as ListField,
          ]
        : []),
    ],
  });
  return {
    type: 'group',
    key: 'compare',
    label: '전 · 후',
    fields: [
      side('before', '전', true),
      side('after', '후', false),
      { type: 'image', key: 'shot', label: '「후」 쪽 화면' },
    ],
  };
}
