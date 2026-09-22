import { COMPANY_LOCATION_SCHEMA } from './company-location.schema';
import { HOME_SCHEMA } from './home.schema';
import type { PageSchema } from './page-schema';

/** 편집할 수 있는 페이지. 새 장은 스키마 파일을 만들고 여기에 더한다(순서 = 관리 화면 목록 순서). */
export const PAGE_SCHEMAS: PageSchema[] = [
  HOME_SCHEMA,
  COMPANY_LOCATION_SCHEMA,
];

export function pageSchemaOf(key: string): PageSchema | undefined {
  return PAGE_SCHEMAS.find((s) => s.key === key);
}
