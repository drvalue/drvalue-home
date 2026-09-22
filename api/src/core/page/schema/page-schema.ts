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
 *   list              같은 모양 항목의 목록(min·max, item 칸)
 *   group             칸 묶음(fields)
 *
 * key 는 저장 JSON 의 이름이고 label 은 화면과 검사 문구에 쓰는 이름이다.
 */
interface Base {
  key: string;
  label: string;
  /** 폼의 칸 아래 도움말. */
  help?: string;
  required?: boolean;
}

export interface TextField extends Base {
  type: 'text' | 'textarea';
  max: number;
  /** 정규식 문자열. 화면도 같은 값을 쓴다. */
  pattern?: string;
  /** pattern 이 틀렸을 때 문구(합니다체). */
  patternMessage?: string;
}

export interface RichtextField extends Base {
  type: 'richtext';
  max: number;
}

export interface ImageField extends Base {
  type: 'image';
}

export interface LinkField extends Base {
  type: 'link';
}

export interface ListField extends Base {
  type: 'list';
  min?: number;
  max: number;
  /** 항목 하나를 부를 이름(「주소 줄」). 없으면 label. */
  itemLabel?: string;
  item: PageField[];
}

export interface GroupField extends Base {
  type: 'group';
  fields: PageField[];
}

export type PageField =
  TextField | RichtextField | ImageField | LinkField | ListField | GroupField;

export interface PageSchema {
  key: string;
  /** 관리 화면 목록의 이름. */
  label: string;
  /** 공개 주소. 관리 화면의 「사이트에서 보기」. */
  path: string;
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
