import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const SearchSettingsError = {
  // ── 예상 못 한 실패(@ServiceException 이 바꾼다).
  GET_UNKNOWN: {
    code: 'SEARCH_SETTINGS_GET_UNKNOWN',
    message: '검색엔진 설정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  SAVE_UNKNOWN: {
    code: 'SEARCH_SETTINGS_SAVE_UNKNOWN',
    message: '검색엔진 설정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  RESTORE_UNKNOWN: {
    code: 'SEARCH_SETTINGS_RESTORE_UNKNOWN',
    message: '검색엔진 설정을 되돌리지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,
};
