import { COMPANY_LOCATION_SCHEMA } from './company-location.schema';
import {
  AI_SOL_SCHEMA,
  AUTOFORM_SCHEMA,
  CADON_SCHEMA,
  CHAT_SCHEMA,
  COMPANY_INTRO_SCHEMA,
  COMPANY_VISION_SCHEMA,
  COSMETICS_MES_SCHEMA,
  CUTON_SCHEMA,
  GROWTOK_SCHEMA,
  GROWXD_SCHEMA,
  HANGEON_SCHEMA,
  MAX_HUB_SCHEMA,
  MES_AI_SCHEMA,
  PCB_MES_SCHEMA,
  SMART_FAC_SCHEMA,
} from './intro-pages.schema';
import { HOME_SCHEMA } from './home.schema';
import type { PageSchema } from './page-schema';

/** 편집할 수 있는 페이지. 새 장은 스키마 파일을 만들고 여기에 더한다(순서 = 관리 화면 목록 순서 = 사이트 메뉴 순서, 메인이 맨 앞). */
export const PAGE_SCHEMAS: PageSchema[] = [
  HOME_SCHEMA,
  COMPANY_INTRO_SCHEMA,
  COMPANY_VISION_SCHEMA,
  COMPANY_LOCATION_SCHEMA,
  MAX_HUB_SCHEMA,
  PCB_MES_SCHEMA,
  COSMETICS_MES_SCHEMA,
  MES_AI_SCHEMA,
  SMART_FAC_SCHEMA,
  AI_SOL_SCHEMA,
  AUTOFORM_SCHEMA,
  CUTON_SCHEMA,
  CADON_SCHEMA,
  CHAT_SCHEMA,
  HANGEON_SCHEMA,
  GROWTOK_SCHEMA,
  GROWXD_SCHEMA,
];

export function pageSchemaOf(key: string): PageSchema | undefined {
  return PAGE_SCHEMAS.find((s) => s.key === key);
}
