import { HttpStatus } from '@nestjs/common';
import { ICommonErrorCode } from '../../../common/error/common-error-code';

export const AdminPostError = {
  NOT_FOUND: {
    code: 'ADMIN_POST_NOT_FOUND',
    message: '글을 찾을 수 없습니다. 이미 지워졌을 수 있습니다.',
    status: HttpStatus.NOT_FOUND,
  } as ICommonErrorCode,

  SLUG_TAKEN: {
    code: 'ADMIN_POST_SLUG_TAKEN',
    message: '같은 주소를 쓰는 글이 이미 있습니다. 주소를 바꿔 주세요.',
    detail: 'posts.slug 중복',
    status: HttpStatus.CONFLICT,
  } as ICommonErrorCode,

  NEED_KO: {
    code: 'ADMIN_POST_NEED_KO',
    message: '한국어 제목을 입력해 주세요.',
    detail: 'posts_translations 에 ko-KR 제목이 없다',
    status: HttpStatus.BAD_REQUEST,
  } as ICommonErrorCode,

  FILE_GONE: {
    code: 'ADMIN_POST_FILE_GONE',
    message: '첨부 파일 중 지워진 것이 있습니다. 첨부 목록을 확인해 주세요.',
    detail:
      'file_ids 에 directus_files 에 없는 id — 미디어에서 지운 뒤 저장했다',
    status: HttpStatus.CONFLICT,
  } as ICommonErrorCode,

  THUMB_GONE: {
    code: 'ADMIN_POST_THUMB_GONE',
    message: '그림 파일이 지워졌습니다. 그림을 다시 올려 주세요.',
    detail: 'thumbnail 이 directus_files 에 없는 id',
    status: HttpStatus.CONFLICT,
  } as ICommonErrorCode,

  OG_IMAGE_NOT_FOUND: {
    code: 'ADMIN_POST_OG_IMAGE_NOT_FOUND',
    message: '공유 그림 파일을 찾을 수 없습니다. 다시 골라 주세요.',
    detail: 'og_image 가 directus_files 에 없다(미디어에서 지웠다)',
    status: HttpStatus.CONFLICT,
  } as ICommonErrorCode,

  // ── 예상 못 한 실패(@ServiceException 이 바꾼다). 원인은 로그의 스택을 본다.
  LIST_UNKNOWN: {
    code: 'ADMIN_POST_LIST_UNKNOWN',
    message: '글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  GET_UNKNOWN: {
    code: 'ADMIN_POST_GET_UNKNOWN',
    message: '글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  SAVE_UNKNOWN: {
    code: 'ADMIN_POST_SAVE_UNKNOWN',
    message: '글을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  DELETE_UNKNOWN: {
    code: 'ADMIN_POST_DELETE_UNKNOWN',
    message: '글을 지우지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  REORDER_UNKNOWN: {
    code: 'ADMIN_POST_REORDER_UNKNOWN',
    message: '순서를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,

  LABELS_UNKNOWN: {
    code: 'ADMIN_POST_LABELS_UNKNOWN',
    message: '분류 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  } as ICommonErrorCode,
};
