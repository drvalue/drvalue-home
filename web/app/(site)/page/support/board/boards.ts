/**
 * 글 게시판 셋(공지·보도·뉴스). 목록·상세 장이 이 설정 하나를 나눠 쓴다 —
 * 장마다 스크립트를 복제하던 때는 세 벌이 한 글자씩 어긋났다.
 */
export type BoardKey = 'notice' | 'press' | 'news'

export type BoardConf = {
  key: BoardKey
  /** 목록 주소. 상세는 `${path}/${slug}`. */
  path: string
  label: string
  /** 머리글 아래 한 줄(화면에 보인다). */
  description: string
  /**
   * 검색 결과 설명. 화면의 한 줄은 짧아서(21~34자) 검색 결과에 쓰기에 모자라다 — 사이트에 이미 적힌
   * 사실로 늘린다. 새 주장을 지어내지 않는다.
   */
  seoDescription: string
  headLead: string
  headStrong: string
  emptyTitle: string
  emptyDesc: string
}

export const BOARDS: Record<BoardKey, BoardConf> = {
  notice: {
    key: 'notice',
    path: '/page/support/notice',
    label: '공지사항',
    description: '디알밸류의 서비스 오픈, 시스템 점검, 안내 사항을 전합니다.',
    // 뒤 문장은 지금 올라와 있는 공지(CUTON·GrowChat 오픈)에서 왔다.
    seoDescription:
      '디알밸류의 서비스 오픈, 시스템 점검, 안내 사항을 전합니다. CUTON·GrowChat 같은 서비스의 오픈 소식과 운영 안내를 확인하세요.',
    headLead: '디알밸류의 소식과 ',
    headStrong: '공지사항을 안내드립니다.',
    emptyTitle: '아직 등록된 공지가 없습니다',
    emptyDesc: '새 공지가 올라오면 이곳에 바로 보입니다.',
  },
  press: {
    key: 'press',
    path: '/page/support/press',
    label: '보도자료',
    description: '디알밸류가 언론에 소개된 소식과 보도자료를 모았습니다.',
    // 「MES/ERP 구축 · 제조 AI 자동화」는 사이트 기본 설명(layout.tsx)의 말이다.
    seoDescription:
      '디알밸류가 언론에 소개된 소식과 보도자료를 모았습니다. MES/ERP 구축과 제조 AI 자동화를 하는 디알밸류의 기사를 매체명·날짜와 함께 봅니다.',
    headLead: '디알밸류의 보도자료와 ',
    headStrong: '언론 보도를 확인하세요.',
    emptyTitle: '아직 등록된 보도자료가 없습니다',
    emptyDesc: '새 소식이 올라오면 이곳에 바로 보입니다.',
  },
  news: {
    key: 'news',
    path: '/page/support/news',
    label: '뉴스',
    description: '디알밸류의 새 소식과 활동을 전합니다.',
    seoDescription:
      '디알밸류의 새 소식과 활동을 전합니다. 제조 현장의 언어를 데이터로 통일하는 디알밸류의 사업·제품 소식을 모읍니다.',
    headLead: '디알밸류의 ',
    headStrong: '새 소식을 전합니다.',
    emptyTitle: '아직 등록된 뉴스가 없습니다',
    emptyDesc: '새 소식이 올라오면 이곳에 바로 보입니다.',
  },
}

export const isBoardKey = (v: unknown): v is BoardKey => v === 'notice' || v === 'press' || v === 'news'

export const detailPath = (conf: BoardConf, slug: string) => `${conf.path}/${encodeURIComponent(slug)}`
