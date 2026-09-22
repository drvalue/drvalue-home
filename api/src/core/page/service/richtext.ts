import { sanitizeRichHtml } from '../../../common/html/sanitize-body';

/** 페이지 글의 richtext 칸. 규칙은 게시판 본문과 같다(common/html/sanitize-body). */
export function sanitizeRichtext(html: string): string {
  return sanitizeRichHtml(html).trim();
}
