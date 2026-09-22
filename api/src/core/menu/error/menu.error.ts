import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const MenuError = {
  NEED_KO_LABEL: {
    code: 'MENU_NEED_KO_LABEL',
    message: '메뉴마다 한국어 이름을 입력해 주세요.',
    detail: 'translations 에 ko-KR label 이 없거나 비었다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  DUPLICATE_LANGUAGE: {
    code: 'MENU_DUPLICATE_LANGUAGE',
    message: '한 메뉴에 같은 언어의 이름을 두 번 넣을 수 없습니다.',
    detail: 'translations 의 languages_code 중복',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  BAD_MATCH: {
    code: 'MENU_BAD_MATCH',
    message: '「켜지는 주소」는 /로 시작하는 사이트 안 주소로 적어 주세요.',
    detail: 'match 항목이 / 로 시작하지 않거나 200자를 넘는다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  // ── 예상 못 한 실패(@ServiceException 이 바꾼다). 원인은 로그의 스택을 본다.
  GET_UNKNOWN: {
    code: 'MENU_GET_UNKNOWN',
    message: '메뉴를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  SAVE_UNKNOWN: {
    code: 'MENU_SAVE_UNKNOWN',
    message: '메뉴를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,
};
