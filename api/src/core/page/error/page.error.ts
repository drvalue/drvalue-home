import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const PageError = {
  NOT_FOUND: {
    code: 'PAGE_NOT_FOUND',
    message: '페이지를 찾을 수 없습니다.',
    detail: 'core/page/schema 에 없는 key',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  /** 검사 문구는 칸마다 다르다 — 서비스가 createByErrorCode(INVALID, 문구) 로 바꿔 싣는다. */
  INVALID: {
    code: 'PAGE_INVALID',
    message: '입력한 내용을 다시 확인해 주세요.',
    detail: '스키마 검사 실패(page-content.ts)',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  FILE_GONE: {
    code: 'PAGE_FILE_GONE',
    message:
      '페이지에 넣은 그림 파일을 찾을 수 없습니다. 그림을 다시 올려 주세요.',
    detail: 'content 의 image.id 가 directus_files 에 없다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  CONTENT_NOT_FOUND: {
    code: 'PAGE_CONTENT_NOT_FOUND',
    message: '페이지 내용을 찾을 수 없습니다.',
    detail: 'pages 에 그 key 의 행이 없다(요청 언어·기본 언어 둘 다)',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  // ── 예상 못 한 실패(@ServiceException 이 바꾼다). 원인은 로그의 스택을 본다.
  LIST_UNKNOWN: {
    code: 'PAGE_LIST_UNKNOWN',
    message: '페이지 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  GET_UNKNOWN: {
    code: 'PAGE_GET_UNKNOWN',
    message: '페이지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  SAVE_UNKNOWN: {
    code: 'PAGE_SAVE_UNKNOWN',
    message: '페이지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,
};
