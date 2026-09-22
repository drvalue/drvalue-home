import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const HomeError = {
  NEED_BANNER_IMAGE: {
    code: 'HOME_NEED_BANNER_IMAGE',
    message: '배너마다 그림을 넣어 주세요.',
    detail: 'home_banners.image 가 비었다 — 배너는 머리 그림 사진이다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  NEED_POPUP_CONTENT: {
    code: 'HOME_NEED_POPUP_CONTENT',
    message: '팝업마다 그림이나 한국어 제목·내용 중 하나는 넣어 주세요.',
    detail: '그림도 ko-KR title·body 도 없다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  BAD_PERIOD: {
    code: 'HOME_BAD_PERIOD',
    message: '끝나는 때는 시작하는 때보다 뒤여야 합니다.',
    detail: 'ends_at <= starts_at',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  DUPLICATE_LANGUAGE: {
    code: 'HOME_DUPLICATE_LANGUAGE',
    message: '한 항목에 같은 언어의 글을 두 번 넣을 수 없습니다.',
    detail: 'translations 의 languages_code 중복',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  BODY_TOO_LONG: {
    code: 'HOME_BODY_TOO_LONG',
    message: '팝업 내용은 2000자까지 입력할 수 있습니다.',
    detail: '허용 태그만 남긴 뒤의 body 길이 > 2000',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  IMAGE_GONE: {
    code: 'HOME_IMAGE_GONE',
    message: '그림 파일이 미디어에서 지워졌습니다. 그림을 다시 골라 주세요.',
    detail: 'image 가 directus_files 에 없다',
    status: HttpStatus.CONFLICT,
  } as ICommonErrorCode,

  // ── 예상 못 한 실패(@ServiceException 이 바꾼다). 원인은 로그의 스택을 본다.
  GET_UNKNOWN: {
    code: 'HOME_GET_UNKNOWN',
    message:
      '메인 화면 설정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  SAVE_UNKNOWN: {
    code: 'HOME_SAVE_UNKNOWN',
    message:
      '메인 화면 설정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,
};
