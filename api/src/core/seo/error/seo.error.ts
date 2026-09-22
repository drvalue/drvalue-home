import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const SeoError = {
  NOT_FOUND: {
    code: 'SEO_PAGE_NOT_FOUND',
    message:
      '이 장의 검색 설정이 없습니다. 이미 기본값으로 돌아갔을 수 있습니다.',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  OG_IMAGE_NOT_FOUND: {
    code: 'SEO_OG_IMAGE_NOT_FOUND',
    message: '공유 그림 파일을 찾을 수 없습니다. 다시 골라 주세요.',
    detail: 'og_image 가 directus_files 에 없다(미디어에서 지웠다)',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  // ── 예상 못 한 실패(@ServiceException 이 바꾼다).
  LIST_UNKNOWN: {
    code: 'SEO_LIST_UNKNOWN',
    message: '검색 설정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  SAVE_UNKNOWN: {
    code: 'SEO_SAVE_UNKNOWN',
    message: '검색 설정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  DELETE_UNKNOWN: {
    code: 'SEO_DELETE_UNKNOWN',
    message: '검색 설정을 되돌리지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  RESTORE_UNKNOWN: {
    code: 'SEO_RESTORE_UNKNOWN',
    message: '검색 설정을 되돌리지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,
};
