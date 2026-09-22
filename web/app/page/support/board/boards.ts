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
  /** 목록 장 머리 정보·머리글. */
  description: string
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
    headLead: '디알밸류의 ',
    headStrong: '새 소식을 전합니다.',
    emptyTitle: '아직 등록된 뉴스가 없습니다',
    emptyDesc: '새 소식이 올라오면 이곳에 바로 보입니다.',
  },
}

export const isBoardKey = (v: unknown): v is BoardKey => v === 'notice' || v === 'press' || v === 'news'

export const detailPath = (conf: BoardConf, slug: string) => `${conf.path}/${encodeURIComponent(slug)}`
