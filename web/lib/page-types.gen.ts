// 자동 생성 — 손대지 않는다. 원본: api/src/core/page/schema/page-schema.ts · api/page-schemas.json
// 다시 만들기: (cd api && npm run build && node scripts/openapi.js) && (cd web && node scripts/gen-types.mjs)
// 낡았는지 검사: python3 web/scripts/check-types.py
/* eslint-disable */

/**
 * 페이지 글의 칸 구조. 한 곳(api)에만 있다 — 관리 화면은 GET /api/admin/pages/:key 로 이 구조를 받아
 * 폼을 그리고, 저장은 이 구조로 검사한다. 칸 종류:
 *
 *   text · textarea   글자(max 필수). pattern 을 주면 그 모양만
 *   richtext          편집기 HTML. 허용 태그만 남기고 저장한다(max 는 정리한 뒤 길이)
 *   image             { id: 파일 uuid | null, alt: 대체 글 } — 그림은 미디어에 올린 파일.
 *                     기본 글(씨앗)은 사이트에 이미 있는 그림을 { id: null, src: '/screens/…', width, height } 로
 *                     가리킬 수 있다. 관리 화면에서 새로 올리면 id 로 바뀐다(src 는 버린다).
 *   link              { label, href } — href 는 / 로 시작하거나 https:// · mailto: · tel:
 *   boolean           켜고 끄기(true · false)
 *   select            정해 둔 값 중 하나(options). required 가 아니면 '' 도 된다
 *   list              같은 모양 항목의 목록(min·max, item 칸). uniqueBy 를 주면 그 칸 값이 겹치면 안 된다
 *   group             칸 묶음(fields)
 *
 * key 는 저장 JSON 의 이름이고 label 은 화면과 검사 문구에 쓰는 이름이다.
 */
export interface PageFieldBase {
  key: string;
  label: string;
  /** 폼의 칸 아래 도움말. */
  help?: string;
  required?: boolean;
}

export interface TextField extends PageFieldBase {
  type: 'text' | 'textarea';
  max: number;
  /** 정규식 문자열. 화면도 같은 값을 쓴다. */
  pattern?: string;
  /** pattern 이 틀렸을 때 문구(합니다체). */
  patternMessage?: string;
}

export interface RichtextField extends PageFieldBase {
  type: 'richtext';
  max: number;
}

export interface ImageField extends PageFieldBase {
  type: 'image';
}

export interface LinkField extends PageFieldBase {
  type: 'link';
}

export interface BooleanField extends PageFieldBase {
  type: 'boolean';
}

export interface SelectField extends PageFieldBase {
  type: 'select';
  options: { value: string; label: string }[];
}

export interface ListField extends PageFieldBase {
  type: 'list';
  min?: number;
  max: number;
  /** 항목 하나를 부를 이름(「주소 줄」). 없으면 label. */
  itemLabel?: string;
  /** 항목 안의 이 칸(select·text) 값이 서로 겹치면 거부한다(메인 구역 차례처럼 한 번씩만 오는 목록). */
  uniqueBy?: string;
  item: PageField[];
}

export interface GroupField extends PageFieldBase {
  type: 'group';
  fields: PageField[];
}

export type PageField =
  | TextField
  | RichtextField
  | ImageField
  | LinkField
  | BooleanField
  | SelectField
  | ListField
  | GroupField;

export interface PageSchema {
  key: string;
  /** 관리 화면 목록의 이름. */
  label: string;
  /** 공개 주소. 관리 화면의 「사이트에서 보기」. */
  path: string;
  /** 관리 화면에서 이 장을 고치는 주소. 없으면 /admin/pages/<key>(메인은 /admin/home 이 배너·팝업과 같이 연다). */
  adminPath?: string;
  fields: PageField[];
}

export interface ImageValue {
  id: string | null;
  alt: string;
  /** 사이트에 이미 있는 그림(web/public). id 가 없을 때만. 치수는 보낸 값을 그대로 쓴다. */
  src?: string;
  /** 저장할 때 api 가 미디어 파일의 치수로 적는다(보낸 값은 버린다). */
  width?: number | null;
  height?: number | null;
}

export interface LinkValue {
  label: string;
  href: string;
}

/** 페이지마다 저장되는 글(GET /api/content/pages/:key 의 data, 관리 화면이 저장하는 content). */
export interface PageContentMap {
  /** 메인 화면 — / */
  home: {
    /** 머리 그림 */
    hero: {
      /** 작은 영문 머리 */
      kicker: string
      /** 제목 첫 줄 */
      titleLead: string
      /** 제목 둘째 줄 */
      titleStrong: string
      /** 소개 문장 */
      desc: string
      /** 첫째 버튼 */
      primary: LinkValue
      /** 문의 버튼 글자 */
      secondaryLabel: string
      /** 배경 사진 */
      background: ImageValue | null
    }
    /** 구역 차례 */
    sections: {
      /** 구역 */
      section: "proof" | "biz" | "news" | "cta"
      /** 보이기 */
      visible: boolean
    }[]
    /** 신뢰의 근거 */
    proof: {
      /** 작은 영문 머리 */
      kicker: string
      /** 구역 제목 */
      title: string
      /** 더 보기 링크 */
      more: LinkValue
      /** 카드 */
      cards: {
        /** 연도 */
        year: string
        /** 분류 */
        kind: "인증" | "선정" | "협력"
        /** 카드 제목 */
        title: string
        /** 설명 */
        detail: string
        /** 아이콘 */
        icon: string
      }[]
    }
    /** 사업영역 */
    biz: {
      /** 작은 영문 머리 */
      kicker: string
      /** 구역 제목 */
      title: string
      /** 카드 */
      cards: {
        /** 가는 곳 */
        href: string
        /** 작은 영문 머리 */
        kicker: string
        /** 카드 제목 */
        title: string
        /** 설명 */
        lead: string
        /** 요점 */
        points: {
          /** 요점 */
          text: string
        }[]
        /** 아이콘 */
        icon: string
      }[]
    }
    /** 최근 소식 */
    news: {
      /** 작은 영문 머리 */
      kicker: string
      /** 구역 제목 */
      title: string
      /** 전체 보기 링크 */
      more: LinkValue
    }
    /** 문의 띠 */
    cta: {
      /** 띠 제목 */
      title: string
      /** 띠 설명 */
      desc: string
      /** 버튼 글자 */
      buttonLabel: string
    }
  }
  /** 회사소개 · 안내 — /page/company/intro */
  "company-intro": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 요약 */
    lead: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 큰 값 */
      heroN: string
      /** 큰 값 설명 */
      heroLabel: string
      /** 항목 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 제품 화면 */
    shot: ImageValue | null
    /** 브랜드 필름 */
    film: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 유튜브 영상 번호 */
      youtubeId: string
      /** 영상 이름(화면 읽기 프로그램용) */
      videoTitle: string
    }
  }
  /** 회사소개 · 비전 — /page/company/vision */
  "company-vision": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 요약 */
    lead: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 큰 값 */
      heroN: string
      /** 큰 값 설명 */
      heroLabel: string
      /** 항목 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 전략 */
    strategy: {
      /** 제목 */
      title: string
      /** 카드 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
  }
  /** 찾아오시는 길 — /page/company/location */
  "company-location": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 본문 제목 */
      leadTitle: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 위치 */
    place: {
      /** 회사 이름 */
      company: string
      /** 주소 */
      address: {
        /** 주소 줄 */
        line: string
      }[]
      /** 대표전화 */
      tel: string
      /** 이메일 */
      email: string
      /** 지도에서 찾을 장소 이름 */
      mapQuery: string
    }
    /** 방문 안내 */
    guide: {
      /** 안내 제목 */
      title: string
      /** 안내 문장 */
      desc: string
      /** 건물 사진 */
      photo: ImageValue | null
    }
  }
  /** 제조AI(M.AX) 소개 — /page/business/max */
  "business-max": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 머리말 둘째 단추 글 */
      heroLink: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 머리말 화면 */
    heroShots: {
      /** 화면 */
      image: ImageValue
      /** 판 위 이름 */
      tag: string
      /** 주소 막대 글자 */
      url: string
    }[]
    /** 제품군 문장 */
    statement: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
    /** PCB MES 카드 */
    pcbCard: {
      /** 작은 제목 */
      kicker: string
      /** 화면 */
      shot: ImageValue
      /** 주소 막대 글자 */
      url: string
    }
    /** 화장품 MES 카드 */
    cosCard: {
      /** 작은 제목 */
      kicker: string
      /** 화면 */
      shot: ImageValue
      /** 주소 막대 글자 */
      url: string
    }
    /** MES AI 카드 */
    aiCard: {
      /** 작은 제목 */
      kicker: string
      /** 화면 */
      shot: ImageValue
      /** 주소 막대 글자 */
      url: string
    }
  }
  /** PCB MES — /page/business/max/pcb-mes */
  "business-pcb-mes": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 요약 */
    lead: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 큰 값 */
      heroN: string
      /** 큰 값 설명 */
      heroLabel: string
      /** 항목 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 머리말 화면 */
    heroShots: {
      /** 화면 */
      image: ImageValue
      /** 판 위 이름 */
      tag: string
      /** 주소 막대 글자 */
      url: string
    }[]
    /** 기능 */
    features: {
      /** 번호 */
      no: string
      /** 작은 제목 */
      kicker: string
      /** 제목 */
      title: string
      /** 요점 */
      points: {
        /** 글 */
        text: string
      }[]
      /** 해시태그 */
      chips: {
        /** 글 */
        text: string
      }[]
      /** 강조 칸 설명 */
      calloutLead: string
      /** 강조 칸 결과 */
      calloutResult: string
      /** 화면 */
      shots: {
        /** 화면 */
        image: ImageValue
      }[]
    }[]
    /** 구역 */
    groups: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
      /** 기능 번호 */
      nos: string
      /** 카드 종류 */
      cols: string
    }[]
    /** KPI 카드 */
    kpi: {
      /** 제목 */
      t: string
      /** 설명 */
      d: string
    }[]
  }
  /** 화장품 MES — /page/business/max/cosmetics-mes */
  "business-cosmetics-mes": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 요약 */
    lead: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 큰 값 */
      heroN: string
      /** 큰 값 설명 */
      heroLabel: string
      /** 항목 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 머리말 화면 */
    heroShots: {
      /** 화면 */
      image: ImageValue
      /** 판 위 이름 */
      tag: string
      /** 주소 막대 글자 */
      url: string
    }[]
    /** 기능 */
    features: {
      /** 번호 */
      no: string
      /** 작은 제목 */
      kicker: string
      /** 제목 */
      title: string
      /** 요점 */
      points: {
        /** 글 */
        text: string
      }[]
      /** 해시태그 */
      chips: {
        /** 글 */
        text: string
      }[]
      /** 강조 칸 설명 */
      calloutLead: string
      /** 강조 칸 결과 */
      calloutResult: string
      /** 화면 */
      shots: {
        /** 화면 */
        image: ImageValue
      }[]
    }[]
    /** 구역 */
    groups: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
      /** 기능 번호 */
      nos: string
      /** 카드 종류 */
      cols: string
    }[]
  }
  /** MES AI — /page/business/max/mes-ai */
  "business-mes-ai": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 요약 */
    lead: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 큰 값 */
      heroN: string
      /** 큰 값 설명 */
      heroLabel: string
      /** 항목 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 머리말 화면 */
    heroShots: {
      /** 화면 */
      image: ImageValue
      /** 판 위 이름 */
      tag: string
      /** 주소 막대 글자 */
      url: string
    }[]
    /** 「실제 화면」 구역 */
    bento: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
    /** AI 기능 */
    ais: {
      /** 알약 글자 */
      label: string
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 단계 */
      steps: {
        /** 글 */
        text: string
      }[]
      /** 화면 */
      shot: ImageValue
      /** 주소 막대 글자 */
      url: string
      /** 카드 색 */
      tone: string
    }[]
  }
  /** 스마트 팩토리 사업 — /page/business/smart_fac */
  "business-smart-fac": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 요약 */
    lead: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 큰 값 */
      heroN: string
      /** 큰 값 설명 */
      heroLabel: string
      /** 항목 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 기능 */
    features: {
      /** 번호 */
      no: string
      /** 작은 제목 */
      kicker: string
      /** 제목 */
      title: string
      /** 요점 */
      points: {
        /** 글 */
        text: string
      }[]
      /** 해시태그 */
      chips: {
        /** 글 */
        text: string
      }[]
      /** 강조 칸 설명 */
      calloutLead: string
      /** 강조 칸 결과 */
      calloutResult: string
      /** 화면 */
      shots: {
        /** 화면 */
        image: ImageValue
      }[]
    }[]
  }
  /** AI 솔루션 개발 — /page/business/ai_sol */
  "business-ai-sol": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 머리말 둘째 단추 글 */
      heroLink: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 요약 */
    lead: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 큰 값 */
      heroN: string
      /** 큰 값 설명 */
      heroLabel: string
      /** 항목 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 머리말 화면 */
    heroShots: {
      /** 화면 */
      image: ImageValue
      /** 판 위 이름 */
      tag: string
      /** 주소 막대 글자 */
      url: string
    }[]
    /** 로드맵 */
    road: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 단계 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 오토폼 구역 탭 */
    autoformTabs: {
      /** 화면 */
      image: ImageValue
      /** 판 위 이름 */
      tag: string
      /** 주소 막대 글자 */
      url: string
      /** 탭 제목 */
      t: string
      /** 탭 설명 */
      d: string
      /** 판 색 */
      tone: string
    }[]
    /** 컷온 구역 탭 */
    cutonTabs: {
      /** 화면 */
      image: ImageValue
      /** 판 위 이름 */
      tag: string
      /** 주소 막대 글자 */
      url: string
      /** 탭 제목 */
      t: string
      /** 탭 설명 */
      d: string
      /** 판 색 */
      tone: string
    }[]
    /** CADON 구역 탭 */
    cadonTabs: {
      /** 화면 */
      image: ImageValue
      /** 판 위 이름 */
      tag: string
      /** 주소 막대 글자 */
      url: string
      /** 탭 제목 */
      t: string
      /** 탭 설명 */
      d: string
      /** 판 색 */
      tone: string
    }[]
    /** 채팅 구역 탭 */
    chatTabs: {
      /** 화면 */
      image: ImageValue
      /** 판 위 이름 */
      tag: string
      /** 주소 막대 글자 */
      url: string
      /** 탭 제목 */
      t: string
      /** 탭 설명 */
      d: string
      /** 판 색 */
      tone: string
    }[]
    /** 한건 구역 탭 */
    hangeonTabs: {
      /** 화면 */
      image: ImageValue
      /** 판 위 이름 */
      tag: string
      /** 주소 막대 글자 */
      url: string
      /** 탭 제목 */
      t: string
      /** 탭 설명 */
      d: string
      /** 판 색 */
      tone: string
    }[]
  }
  /** 오토폼 — /page/service/autoform */
  "service-autoform": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 요약 (AI 솔루션 개발 장의 이 구역도 이 글을 씁니다) */
    lead: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 큰 값 */
      heroN: string
      /** 큰 값 설명 */
      heroLabel: string
      /** 항목 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 머리말 화면 */
    heroShots: {
      /** 화면 */
      image: ImageValue
      /** 판 위 이름 */
      tag: string
      /** 주소 막대 글자 */
      url: string
    }[]
    /** 시연 구역 문장 */
    demo: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
    /** 전 · 후 구역 문장 */
    compareStatement: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
    /** 전 · 후 */
    compare: {
      /** 전 */
      before: {
        /** 제목 */
        title: string
        /** 요점 */
        points: {
          /** 글 */
          text: string
        }[]
        /** 말풍선 */
        bubbles: {
          /** 말한 쪽 */
          who: string
          /** 말 */
          t: string
        }[]
      }
      /** 후 */
      after: {
        /** 제목 */
        title: string
        /** 요점 */
        points: {
          /** 글 */
          text: string
        }[]
      }
      /** 「후」 쪽 화면 */
      shot: ImageValue | null
    }
    /** 양식 구역 문장 */
    extra: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
  }
  /** 컷온 — /page/service/cuton */
  "service-cuton": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 요약 (AI 솔루션 개발 장의 이 구역도 이 글을 씁니다) */
    lead: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 큰 값 */
      heroN: string
      /** 큰 값 설명 */
      heroLabel: string
      /** 항목 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 머리말 화면 */
    heroShots: {
      /** 화면 */
      image: ImageValue
      /** 판 위 이름 */
      tag: string
      /** 주소 막대 글자 */
      url: string
    }[]
    /** 시연 구역 문장 */
    demo: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
    /** 전 · 후 구역 문장 */
    compareStatement: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
    /** 전 · 후 */
    compare: {
      /** 전 */
      before: {
        /** 제목 */
        title: string
        /** 요점 */
        points: {
          /** 글 */
          text: string
        }[]
        /** 말풍선 */
        bubbles: {
          /** 말한 쪽 */
          who: string
          /** 말 */
          t: string
        }[]
      }
      /** 후 */
      after: {
        /** 제목 */
        title: string
        /** 요점 */
        points: {
          /** 글 */
          text: string
        }[]
      }
      /** 「후」 쪽 화면 */
      shot: ImageValue | null
    }
    /** 견적·보관·입찰 구역 문장 */
    extra: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
  }
  /** CADON — /page/service/cadon */
  "service-cadon": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 요약 (AI 솔루션 개발 장의 이 구역도 이 글을 씁니다) */
    lead: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 큰 값 */
      heroN: string
      /** 큰 값 설명 */
      heroLabel: string
      /** 항목 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 머리말 화면 */
    heroShots: {
      /** 화면 */
      image: ImageValue
      /** 판 위 이름 */
      tag: string
      /** 주소 막대 글자 */
      url: string
    }[]
    /** 시연 구역 문장 */
    demo: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
    /** 전 · 후 구역 문장 */
    compareStatement: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
    /** 전 · 후 */
    compare: {
      /** 전 */
      before: {
        /** 제목 */
        title: string
        /** 요점 */
        points: {
          /** 글 */
          text: string
        }[]
        /** 말풍선 */
        bubbles: {
          /** 말한 쪽 */
          who: string
          /** 말 */
          t: string
        }[]
      }
      /** 후 */
      after: {
        /** 제목 */
        title: string
        /** 요점 */
        points: {
          /** 글 */
          text: string
        }[]
      }
      /** 「후」 쪽 화면 */
      shot: ImageValue | null
    }
    /** 검토 구역 문장 */
    extra: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
  }
  /** 채팅 — /page/service/chat */
  "service-chat": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 요약 (선언 문장과 AI 솔루션 개발 장의 채팅 구역이 씁니다) */
    lead: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 큰 값 */
      heroN: string
      /** 큰 값 설명 */
      heroLabel: string
      /** 항목 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 머리 그림 — 상담원 화면 */
    agentShot: ImageValue
    /** 머리 그림 — 고객 창 */
    customerShot: ImageValue
    /** 전 · 후 구역 문장 */
    compareStatement: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
    /** 전 · 후 */
    compare: {
      /** 전 */
      before: {
        /** 제목 */
        title: string
        /** 요점 */
        points: {
          /** 글 */
          text: string
        }[]
        /** 말풍선 */
        bubbles: {
          /** 말한 쪽 */
          who: string
          /** 말 */
          t: string
        }[]
      }
      /** 후 */
      after: {
        /** 제목 */
        title: string
        /** 요점 */
        points: {
          /** 글 */
          text: string
        }[]
      }
      /** 「후」 쪽 화면 */
      shot: ImageValue | null
    }
  }
  /** 한건 — /page/service/hangeon */
  "service-hangeon": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 요약 (AI 솔루션 개발 장의 이 구역도 이 글을 씁니다) */
    lead: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 큰 값 */
      heroN: string
      /** 큰 값 설명 */
      heroLabel: string
      /** 항목 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 머리말 화면 */
    heroShots: {
      /** 화면 */
      image: ImageValue
      /** 판 위 이름 */
      tag: string
      /** 주소 막대 글자 */
      url: string
    }[]
    /** Chat 시연 구역 문장 */
    demo: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
    /** 전 · 후 구역 문장 */
    compareStatement: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
    /** 전 · 후 */
    compare: {
      /** 전 */
      before: {
        /** 제목 */
        title: string
        /** 요점 */
        points: {
          /** 글 */
          text: string
        }[]
        /** 말풍선 */
        bubbles: {
          /** 말한 쪽 */
          who: string
          /** 말 */
          t: string
        }[]
      }
      /** 후 */
      after: {
        /** 제목 */
        title: string
        /** 요점 */
        points: {
          /** 글 */
          text: string
        }[]
      }
      /** 「후」 쪽 화면 */
      shot: ImageValue | null
    }
    /** Biz 구역 문장 */
    extra: {
      /** 알약 글자 */
      kicker: string
      /** 큰 문장 */
      title: string
      /** 설명 */
      desc: string
    }
  }
  /** GrowTalk — /page/service/growtok */
  "service-growtok": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 요약 */
    lead: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 큰 값 */
      heroN: string
      /** 큰 값 설명 */
      heroLabel: string
      /** 항목 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 기능 */
    features: {
      /** 번호 */
      no: string
      /** 작은 제목 */
      kicker: string
      /** 제목 */
      title: string
      /** 요점 */
      points: {
        /** 글 */
        text: string
      }[]
      /** 해시태그 */
      chips: {
        /** 글 */
        text: string
      }[]
      /** 강조 칸 설명 */
      calloutLead: string
      /** 강조 칸 결과 */
      calloutResult: string
      /** 화면 */
      shots: {
        /** 화면 */
        image: ImageValue
      }[]
    }[]
  }
  /** GrowXD — /page/service/growxd */
  "service-growxd": {
    /** 머리말 */
    shell: {
      /** 장 이름 */
      kicker: string
      /** 상위 메뉴 이름 */
      kickerSub: string
      /** 제목 앞부분 */
      headLead: string
      /** 제목 강조 부분 */
      headStrong: string
      /** 소개 문장 */
      desc: string
      /** 문의 띠 제목 */
      ctaTitle: string
      /** 문의 띠 설명 */
      ctaDesc: string
    }
    /** 요약 */
    lead: {
      /** 제목 */
      title: string
      /** 설명 */
      desc: string
      /** 큰 값 */
      heroN: string
      /** 큰 값 설명 */
      heroLabel: string
      /** 항목 */
      items: {
        /** 제목 */
        t: string
        /** 설명 */
        d: string
      }[]
    }
    /** 기능 */
    features: {
      /** 번호 */
      no: string
      /** 작은 제목 */
      kicker: string
      /** 제목 */
      title: string
      /** 요점 */
      points: {
        /** 글 */
        text: string
      }[]
      /** 해시태그 */
      chips: {
        /** 글 */
        text: string
      }[]
      /** 강조 칸 설명 */
      calloutLead: string
      /** 강조 칸 결과 */
      calloutResult: string
      /** 화면 */
      shots: {
        /** 화면 */
        image: ImageValue
      }[]
    }[]
  }
}

export type PageKey = keyof PageContentMap
export type PageContentOf<K extends PageKey> = PageContentMap[K]
