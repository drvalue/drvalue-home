import { HttpStatus } from '@nestjs/common'
import { ICommonErrorCode } from '../error/common-error'

export const DirectusError = {
  NOT_CONFIGURED: {
    code: 'DIRECTUS_NOT_CONFIGURED',
    message: 'DIRECTUS_URL / DIRECTUS_TOKEN 이 비어 있다',
    status: HttpStatus.SERVICE_UNAVAILABLE,
  } as ICommonErrorCode,

  UPSTREAM_ERROR: {
    code: 'DIRECTUS_UPSTREAM_ERROR',
    message: 'CMS 가 응답하지 않는다',
    status: HttpStatus.BAD_GATEWAY,
  } as ICommonErrorCode,
}
