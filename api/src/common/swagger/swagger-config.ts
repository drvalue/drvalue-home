import { DocumentBuilder } from '@nestjs/swagger';

/** API 문서 머리. /api/docs(운영 끔)와 scripts/openapi.js(web 형 생성)가 같은 것을 쓴다. */
export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('디알밸류 홈페이지 API')
    .setDescription('공개 API(content·inquiry)와 관리 API(/api/admin/*)')
    .addCookieAuth('dv_admin')
    .build();
}
