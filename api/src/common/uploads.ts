import { resolve } from 'node:path';

/**
 * 업로드 파일이 놓이는 곳. 컨테이너는 compose 가 UPLOADS_DIR=/data/uploads 를 준다.
 * 로컬은 저장소 루트의 data/uploads — 이 파일(dist/common/uploads.js)에서 세 칸 위다.
 * cwd 기준으로 잡지 않는다. api/ 에서 띄우면 api/data/uploads 가 돼서 빈 폴더를 본다.
 */
export function uploadsDir(): string {
  return process.env.UPLOADS_DIR || resolve(__dirname, '../../../data/uploads');
}
