// 자동 생성 — 손대지 않는다. 원본: api/openapi.json (Nest 의 DTO · @ApiProperty)
// 다시 만들기: (cd api && npm run build && node scripts/openapi.js) && (cd web && node scripts/gen-types.mjs)
// 낡았는지 검사: python3 web/scripts/check-types.py
/* eslint-disable */

export interface ControllerAdminAuthDefaultMeResponseDto {
  /** 이 범위로 만질 수 있는 게시판 키 */
  boards: string[]
  email: string
  name: string | null
  /** 고칠 수 있는 범위 */
  role: ("admin" | "marketing" | "hr") | null
}

export interface ControllerAdminDashboardBoardCountResponseDto {
  board: string
  count: number
}

export interface ControllerAdminDashboardDefaultResponseDto {
  drafts: ControllerAdminDashboardBoardCountResponseDto[]
  inquiries: ControllerAdminDashboardInquiryResponseDto | null
  recent: ControllerAdminDashboardRevisionResponseDto[] | null
  /** 예약 공개 대기(publish_at 이 아직 안 왔다) */
  scheduled: ControllerAdminDashboardBoardCountResponseDto[]
}

export interface ControllerAdminDashboardInquiryResponseDto {
  /** 내가 맡아 아직 끝나지 않은(접수·진행중) 문의 */
  mine_open: number
  /** 「접수」 상태 그대로인 문의 */
  new: number
}

export interface ControllerAdminDashboardRevisionResponseDto {
  action: "create" | "update" | "delete" | "restore"
  actor: string
  board: string | null
  collection: string
  created_on: string
  id: number
  item_id: string
  label: string
}

export interface ControllerAdminFileDefaultResponseDto {
  created_on: string
  /** 원본 파일 이름 */
  filename_download: string
  /** 바이트 */
  filesize: number | null
  height: number | null
  id: string
  /** 관리 화면 미리보기 — 가리키는 곳과 상관없이 열린다 */
  preview_url: string
  title: string | null
  type: string | null
  /** 공개 주소 — 공개된 곳이 가리켜야 열린다(/api/content/assets 관문) */
  url: string
  /** 쓰는 곳의 수(글·페이지·SEO·메인 배너·팝업) */
  used: number
  width: number | null
}

export interface ControllerAdminFileDefaultUpdateDto {
  /** 보이는 이름 */
  title: string
}

export interface ControllerAdminInquiryAssigneeResponseDto {
  email: string
  name: string | null
  role: "admin" | "marketing" | "hr"
}

export interface ControllerAdminInquiryDefaultResponseDto {
  assignee_email: string | null
  company: string | null
  consent: boolean
  created_on: string
  email: string | null
  id: number
  message: string
  name: string
  note: string | null
  phone: string | null
  source_path: string | null
  status: "new" | "in_progress" | "answered" | "closed" | "spam"
  type: string
  updated_on: string
}

export interface ControllerAdminInquiryDefaultUpdateDto {
  /** 담당자 이메일(권한 목록에 있는 켜진 계정). null 이면 비운다 */
  assignee_email?: string | null
  /** 담당자 메모(문의한 분에게는 안 보인다). null 이면 비운다 */
  note?: string | null
  /** 처리 상태 */
  status?: "new" | "in_progress" | "answered" | "closed" | "spam"
}

export interface ControllerAdminPostDefaultDetailResponseDto {
  board: string
  cert_date: string | null
  cert_kind: string | null
  cert_made_date: string | null
  cert_no: string | null
  cert_state: ("registered" | "applied") | null
  deadline: string | null
  employment_type: string | null
  files: ControllerAdminPostFileResponseDto[]
  history_year: string | null
  id: number
  is_featured: boolean
  is_open_ended: boolean
  is_pinned: boolean
  /** 검색에서 제외 */
  no_index: boolean
  /** 공유 그림 파일 id */
  og_image: string | null
  /** 공유 그림 관리 미리보기 주소 */
  og_image_url: string | null
  period_end: string | null
  period_start: string | null
  press_media: string | null
  publish_at: string | null
  published_date: string
  slug: string
  sort: number | null
  status: "published" | "draft"
  /** 파일 id */
  thumbnail: string | null
  /** 관리 미리보기 주소 */
  thumbnail_url: string | null
  translations: ControllerAdminPostTranslationResponseDto[]
  unpublish_at: string | null
}

export interface ControllerAdminPostDefaultPageResponseDto {
  data: ControllerAdminPostDefaultRowResponseDto[]
  page: number
  pageSize: number
  total: number
}

export interface ControllerAdminPostDefaultReorderDto {
  /** 글 id 를 보일 순서대로 */
  ids: number[]
}

export interface ControllerAdminPostDefaultRowResponseDto {
  board: string
  cert_no: string | null
  deadline: string | null
  employment_type: string | null
  faq_category: string | null
  history_year: string | null
  id: number
  is_open_ended: boolean
  is_pinned: boolean
  /** 검색에서 제외 */
  no_index: boolean
  period_end: string | null
  period_start: string | null
  press_media: string | null
  publish_at: string | null
  published_date: string
  slug: string
  sort: number | null
  status: "published" | "draft"
  /** 관리 미리보기 주소 */
  thumbnail: string | null
  /** 한국어 제목(없으면 첫 번역) */
  title: string
  unpublish_at: string | null
}

export interface ControllerAdminPostDefaultSaveDto {
  /** 게시판 키 */
  board: "notice" | "press" | "news" | "recruit" | "faq" | "patent" | "copyright" | "case" | "history"
  /** 등록·출원일 */
  cert_date?: string | null
  /** 등록증 그대로 */
  cert_kind?: string | null
  /** 저작권 창작일 */
  cert_made_date?: string | null
  /** 등록·출원 번호 */
  cert_no?: string | null
  /** 특허 등록 · 출원 */
  cert_state?: ("registered" | "applied") | null
  /** 채용 마감일 */
  deadline?: string | null
  /** 채용 */
  employment_type?: ("fulltime" | "contract" | "intern") | null
  /** 첨부 파일 id. 이 순서대로 보인다 */
  file_ids?: string[]
  /** 연혁 연도 */
  history_year?: string | null
  /** 홈 소식에 먼저 */
  is_featured?: boolean
  /** 마감일 없음 */
  is_open_ended?: boolean
  /** 공지·보도·뉴스 목록 맨 위 */
  is_pinned?: boolean
  /** 공개 장에 noindex, 사이트맵에서 뺀다. 사이트에는 그대로 보인다 */
  no_index?: boolean
  /** 공유 카드(og:image) 파일 id. 비우면 대표 이미지 → 사이트 기본 그림 */
  og_image?: string | null
  /** 수행실적 기간 끝(월의 1일) */
  period_end?: string | null
  /** 수행실적 기간 시작(월의 1일) */
  period_start?: string | null
  /** 보도·뉴스의 매체 */
  press_media?: string | null
  /** 이 시각에 사이트에 나온다 */
  publish_at?: string | null
  /** 목록에 보이는 날짜 */
  published_date: string
  /** 사이트 주소 끝부분. 비우면 자동 */
  slug?: string
  /** 공개 · 초안 */
  status?: "published" | "draft"
  /** 증서(특허·저작권) 그림 파일 id. 공지·보도·뉴스는 보내도 무시한다 — 본문 첫 그림이 대표 이미지다 */
  thumbnail?: string | null
  /** 언어별 제목·본문. 한국어는 꼭 */
  translations: ControllerAdminPostTranslationDto[]
  /** 이 시각에 초안으로 돌아간다 */
  unpublish_at?: string | null
}

export interface ControllerAdminPostFileResponseDto {
  /** 파일 id */
  id: string
  /** 보이는 이름 */
  name: string
  /** 관리 미리보기 주소 */
  url: string
}

export interface ControllerAdminPostTranslationDto {
  /** 편집기 HTML. 그림은 /api/content/assets/<id> */
  body?: string
  /** 수행실적 구분(발주·사업 유형) */
  case_category_label?: string
  /** FAQ 분류 */
  faq_category?: string
  /** 언어 코드 */
  languages_code: "ko-KR" | "en-US"
  /** 검색 결과 설명(비우면 요약) */
  seo_description?: string
  /** 검색 결과 제목(비우면 글 제목) */
  seo_title?: string
  /** 목록에 나오는 한두 줄(연혁은 부연) */
  summary?: string
  /** 제목(FAQ 는 질문). 한국어는 저장할 때 필수 */
  title?: string
}

export interface ControllerAdminPostTranslationResponseDto {
  body: string | null
  case_category_label: string | null
  faq_category: string | null
  languages_code: "ko-KR" | "en-US"
  seo_description: string | null
  seo_title: string | null
  summary: string | null
  title: string | null
}

export interface ControllerAdminRevisionDefaultDetailResponseDto {
  action: "create" | "update" | "delete" | "restore"
  /** 바꾼 사람(예약 게시는 schedule@system) */
  actor: string
  /** 바꾼 뒤(지우기는 null) */
  after: (Record<string, unknown> | Record<string, unknown>[]) | null
  /** 바꾸기 전(만들기는 null) */
  before: (Record<string, unknown> | Record<string, unknown>[]) | null
  /** 게시판 글이면 게시판 키 */
  board: string | null
  collection: string
  created_on: string
  id: number
  /** 항목 id(글 번호 · 장 key/언어 · 주소 · list …) */
  item_id: string
  /** 사람이 읽는 이름(제목·문의한 분·장 이름 …) */
  label: string
  /** 이 이력의 「바꾸기 전」으로 되돌릴 수 있나 */
  restorable: boolean
  /** 되돌릴 수 없을 때 화면에 보일 까닭(되돌리기를 누르면 나갈 문구와 같다) */
  restore_note: string | null
}

export interface ControllerAdminRevisionDefaultRestoreResponseDto {
  data: (Record<string, unknown> | Record<string, unknown>[]) | null
  /** 되돌리며 뺀 것(지워진 파일 등) — 화면이 알림 옆에 보여 준다 */
  warnings: string[]
}

export interface ControllerAdminRevisionDefaultRowResponseDto {
  action: "create" | "update" | "delete" | "restore"
  /** 바꾼 사람(예약 게시는 schedule@system) */
  actor: string
  /** 게시판 글이면 게시판 키 */
  board: string | null
  collection: string
  created_on: string
  id: number
  /** 항목 id(글 번호 · 장 key/언어 · 주소 · list …) */
  item_id: string
  /** 사람이 읽는 이름(제목·문의한 분·장 이름 …) */
  label: string
}

export interface ControllerAdminUserDefaultResponseDto {
  email: string
  /** IAM 이 관리자라고 한 동안 true */
  enabled: boolean
  last_login_on: string | null
  name: string | null
  /** 고칠 수 있는 범위 */
  role: "admin" | "marketing" | "hr"
}

export interface ControllerAdminUserDefaultUpdateDto {
  /** admin(전체 권한) · marketing(채용 빼고) · hr(채용만) */
  role: "admin" | "marketing" | "hr"
}

export interface ControllerContentAttachmentResponseDto {
  /** 파일 id */
  id: string
  /** 보이는 이름(제목 → 원래 파일 이름) */
  name: string
  /** 공개 주소 */
  url: string
}

export interface ControllerContentDefaultPostDetailEnvelopeDto {
  data: ControllerContentDefaultPostDetailResponseDto
  /** 실제로 쓰인 언어 */
  language: string
}

export interface ControllerContentDefaultPostDetailResponseDto {
  attachments: ControllerContentAttachmentResponseDto[]
  board: string
  /** 본문 HTML — 글 하나와 FAQ 목록에만 싣는다 */
  body?: string | null
  case_category_label: string | null
  cert_date: string | null
  cert_kind: string | null
  cert_made_date: string | null
  cert_no: string | null
  cert_state: ("registered" | "applied") | null
  deadline: string | null
  employment_type: string | null
  faq_category: string | null
  history_year: string | null
  id: number
  is_open_ended: boolean
  is_pinned: boolean
  /** 검색에서 제외 */
  no_index: boolean
  /** 공유 카드 그림 공개 주소(없으면 화면이 대표 이미지 → 사이트 기본 그림) */
  og_image: string | null
  period_end: string | null
  period_start: string | null
  press_media: string | null
  publish_at: string | null
  published_date: string
  seo_description: string | null
  seo_title: string | null
  slug: string
  sort: number | null
  summary: string | null
  /** 공개 주소 /api/content/assets/<id> */
  thumbnail: string | null
  thumbnail_size: ControllerContentThumbnailSizeDto | null
  title: string | null
  unpublish_at: string | null
  /** 사이트맵 lastmod */
  updated_on: string | null
}

export interface ControllerContentDefaultPostListResponseDto {
  data: ControllerContentDefaultPostResponseDto[]
  /** 실제로 쓰인 언어 */
  language: string
  pageSize: number
  total: number
}

export interface ControllerContentDefaultPostResponseDto {
  board: string
  /** 본문 HTML — 글 하나와 FAQ 목록에만 싣는다 */
  body?: string | null
  case_category_label: string | null
  cert_date: string | null
  cert_kind: string | null
  cert_made_date: string | null
  cert_no: string | null
  cert_state: ("registered" | "applied") | null
  deadline: string | null
  employment_type: string | null
  faq_category: string | null
  history_year: string | null
  id: number
  is_open_ended: boolean
  is_pinned: boolean
  /** 검색에서 제외 */
  no_index: boolean
  /** 공유 카드 그림 공개 주소(없으면 화면이 대표 이미지 → 사이트 기본 그림) */
  og_image: string | null
  period_end: string | null
  period_start: string | null
  press_media: string | null
  publish_at: string | null
  published_date: string
  seo_description: string | null
  seo_title: string | null
  slug: string
  sort: number | null
  summary: string | null
  /** 공개 주소 /api/content/assets/<id> */
  thumbnail: string | null
  thumbnail_size: ControllerContentThumbnailSizeDto | null
  title: string | null
  unpublish_at: string | null
  /** 사이트맵 lastmod */
  updated_on: string | null
}

export interface ControllerContentThumbnailSizeDto {
  h: number
  w: number
}

export interface ControllerHomeDefaultBannerDto {
  /** 이때부터 안 나온다. 비우면 계속 */
  ends_at?: string | null
  /** 고칠 배너의 id. 새 배너는 비운다 */
  id?: number | null
  /** 미디어 파일 id(directus_files) */
  image?: string | null
  /** 첫째 버튼이 가는 곳. 비우면 메인 화면 글의 첫째 버튼 */
  link_href?: string | null
  /** 이때부터 나온다. 비우면 바로 */
  starts_at?: string | null
  /** ko-KR · en-US */
  translations: ControllerHomeDefaultBannerTextDto[]
  /** 끄면 기간 안이어도 안 나온다 */
  visible: boolean
}

export interface ControllerHomeDefaultBannerResponseDto {
  ends_at: string | null
  id: number
  image: ControllerHomeDefaultImageResponseDto | null
  link_href: string | null
  sort: number
  starts_at: string | null
  state: "live" | "scheduled" | "ended" | "off"
  translations: ControllerHomeDefaultBannerTextResponseDto[]
  updated_by: string | null
  updated_on: string | null
  visible: boolean
}

export interface ControllerHomeDefaultBannerSaveDto {
  /** 위에서부터의 차례. 살아 있는 것 중 첫째가 머리 그림에 나온다 */
  items: ControllerHomeDefaultBannerDto[]
}

export interface ControllerHomeDefaultBannerTextDto {
  /** 그림을 못 보는 사람에게 읽어 주는 글 */
  alt?: string | null
  /** 비우면 메인 화면 글의 소개 문장이 나온다 */
  description?: string | null
  /** 언어 코드 */
  languages_code: "ko-KR" | "en-US"
  /** 링크가 있으면 첫째 버튼 글자. 비우면 「자세히 보기」 */
  link_label?: string | null
  /** 비우면 메인 화면 글의 제목이 나온다 */
  title?: string | null
}

export interface ControllerHomeDefaultBannerTextResponseDto {
  alt: string | null
  description: string | null
  languages_code: "ko-KR" | "en-US"
  link_label: string | null
  title: string | null
}

export interface ControllerHomeDefaultImageResponseDto {
  height: number | null
  id: string
  /** 관리 미리보기 주소(초안이어도 보인다) */
  url: string
  width: number | null
}

export interface ControllerHomeDefaultPopupDto {
  /** 「N일 동안 보지 않기」의 N. 0 이면 닫기만 */
  dismiss_days: number
  /** 이때부터 안 뜬다. 비우면 계속 */
  ends_at?: string | null
  /** 고칠 팝업의 id. 새 팝업은 비운다 */
  id?: number | null
  /** 미디어 파일 id(directus_files) */
  image?: string | null
  /** 창 아래 버튼·그림이 가는 곳 */
  link_href?: string | null
  /** 이때부터 뜬다. 비우면 바로 */
  starts_at?: string | null
  /** ko-KR · en-US */
  translations: ControllerHomeDefaultPopupTextDto[]
  /** 끄면 기간 안이어도 안 뜬다 */
  visible: boolean
  /** 픽셀. 좁은 화면에서는 화면 폭에 맞춘다 */
  width: number
}

export interface ControllerHomeDefaultPopupResponseDto {
  dismiss_days: number
  ends_at: string | null
  id: number
  image: ControllerHomeDefaultImageResponseDto | null
  link_href: string | null
  sort: number
  starts_at: string | null
  state: "live" | "scheduled" | "ended" | "off"
  translations: ControllerHomeDefaultPopupTextResponseDto[]
  updated_by: string | null
  updated_on: string | null
  visible: boolean
  width: number
}

export interface ControllerHomeDefaultPopupSaveDto {
  /** 위에서부터 뜨는 차례. 한 번에 하나씩 뜬다 */
  items: ControllerHomeDefaultPopupDto[]
}

export interface ControllerHomeDefaultPopupTextDto {
  /** 그림을 못 보는 사람에게 읽어 주는 글 */
  alt?: string | null
  /** 편집기 HTML. 저장할 때 허용 태그만 남기고, 남긴 뒤 2000자까지 */
  body?: string | null
  /** 언어 코드 */
  languages_code: "ko-KR" | "en-US"
  /** 링크가 있으면 창 아래 버튼 글자. 비우면 「자세히 보기」 */
  link_label?: string | null
  /** 창 머리. 화면 읽기 프로그램이 창 이름으로 읽는다 */
  title?: string | null
}

export interface ControllerHomeDefaultPopupTextResponseDto {
  alt: string | null
  body: string | null
  languages_code: "ko-KR" | "en-US"
  link_label: string | null
  title: string | null
}

export interface ControllerHomeDefaultPublicBannerDto {
  description: string | null
  id: number
  image: ControllerHomeDefaultPublicImageDto
  link: ControllerHomeDefaultPublicLinkDto | null
  title: string | null
}

export interface ControllerHomeDefaultPublicImageDto {
  alt: string
  height: number | null
  url: string
  width: number | null
}

export interface ControllerHomeDefaultPublicLinkDto {
  href: string
  label: string
}

export interface ControllerHomeDefaultPublicPopupDto {
  /** 허용 태그만 남긴 HTML */
  body: string | null
  dismiss_days: number
  id: number
  image: ControllerHomeDefaultPublicImageDto | null
  link: ControllerHomeDefaultPublicLinkDto | null
  title: string | null
  width: number
}

export interface ControllerHomeDefaultPublicResponseDto {
  banner: ControllerHomeDefaultPublicBannerDto | null
  popups: ControllerHomeDefaultPublicPopupDto[]
}

export interface ControllerInquiryDefaultCreateDto {
  /** 답장 받을 이메일 */
  user_email: string
  /** 문의 내용 */
  user_msg: string
  /** 회사명 / 성함 */
  user_name: string
  /** 연락처 */
  user_tel: string
  /** 문의 유형 */
  user_type: "지원사업" | "CutON(레이저 견적)" | "growchat(채팅 솔루션)" | "솔루션 도입 문의" | "기타"
}

export interface ControllerMenuDefaultAdminChildResponseDto {
  hidden_in_dropdown: boolean
  href: string
  id: number
  translations: ControllerMenuDefaultLabelResponseDto[]
  visible: boolean
}

export interface ControllerMenuDefaultAdminNodeResponseDto {
  children: ControllerMenuDefaultAdminChildResponseDto[]
  hidden_in_dropdown: boolean
  href: string
  id: number
  match: string[] | null
  translations: ControllerMenuDefaultLabelResponseDto[]
  visible: boolean
}

export interface ControllerMenuDefaultAdminTreeResponseDto {
  footer: ControllerMenuDefaultAdminChildResponseDto[]
  top: ControllerMenuDefaultAdminNodeResponseDto[]
  updated_on: string | null
}

export interface ControllerMenuDefaultChildDto {
  /** 비워 둔다(깊이 2까지) */
  children?: string[]
  /** 하위만: 드롭다운에는 안 띄우고 현재 위치 줄에만 이름을 쓴다 */
  hidden_in_dropdown?: boolean
  /** 사이트 안 주소(/page/...) 또는 http(s) 주소 */
  href: string
  /** 언어별 이름(한국어는 꼭) */
  translations: ControllerMenuDefaultLabelDto[]
  /** 끄면 공개 메뉴에서 빠진다 */
  visible: boolean
}

export interface ControllerMenuDefaultLabelDto {
  /** 큰 메뉴판·옆 차례표에서 이름 밑에 깔리는 한 줄(하위만 쓴다) */
  description?: string | null
  /** 탭·하위 항목에 보이는 글자 */
  label: string
  /** 언어 코드 */
  languages_code: "ko-KR" | "en-US"
}

export interface ControllerMenuDefaultLabelResponseDto {
  description: string | null
  label: string
  languages_code: "ko-KR" | "en-US"
}

export interface ControllerMenuDefaultNodeDto {
  /** 드롭다운에 뜨는 항목(12개까지) */
  children?: ControllerMenuDefaultChildDto[]
  /** 탭을 누르면 가는 주소 */
  href: string
  /** 이 주소 앞부분으로 시작하는 장에서 이 탭이 「지금 여기」로 켜진다. 비우면 링크 주소 */
  match?: string[] | null
  /** 언어별 이름(한국어는 꼭) */
  translations: ControllerMenuDefaultLabelDto[]
  /** 끄면 공개 메뉴에서 빠진다 */
  visible: boolean
}

export interface ControllerMenuDefaultPublicChildResponseDto {
  description: string | null
  /** 드롭다운에는 안 띄우고 현재 위치 줄에만 이름을 쓴다 */
  hidden_in_dropdown: boolean
  href: string
  label: string
}

export interface ControllerMenuDefaultPublicLinkResponseDto {
  href: string
  label: string
}

export interface ControllerMenuDefaultPublicNodeResponseDto {
  children: ControllerMenuDefaultPublicChildResponseDto[]
  href: string
  label: string
  match: string[]
}

export interface ControllerMenuDefaultPublicTreeResponseDto {
  footer: ControllerMenuDefaultPublicLinkResponseDto[]
  top: ControllerMenuDefaultPublicNodeResponseDto[]
}

export interface ControllerMenuDefaultSaveDto {
  /** 바닥글의 링크 줄(12개까지). 비우면 바닥글에 링크 줄이 없다 */
  footer: ControllerMenuDefaultChildDto[]
  /** 탭 막대(8개까지) */
  top: ControllerMenuDefaultNodeDto[]
}

export interface ControllerPageDefaultDetailResponseDto {
  languages: Record<string, ControllerPageDefaultLangResponseDto>
  schema: Record<string, unknown>
}

export interface ControllerPageDefaultLangResponseDto {
  content: Record<string, unknown>
  updated_by: string | null
  updated_on: string | null
}

export interface ControllerPageDefaultPublicResponseDto {
  data: Record<string, unknown>
  language: string
}

export interface ControllerPageDefaultRowResponseDto {
  /** 관리 화면에서 이 장을 고치는 주소 */
  admin_path: string
  key: string
  label: string
  path: string
  updated_by: string | null
  updated_on: string | null
}

export interface ControllerPageDefaultSaveDto {
  /** 스키마 모양 그대로의 글(JSON) */
  content: Record<string, unknown>
  /** 저장할 언어 */
  languages_code: "ko-KR" | "en-US"
}

export interface ControllerSeoDefaultPageResponseDto {
  no_index: boolean
  /** 파일 id */
  og_image: string | null
  og_image_url: string | null
  path: string
  translations: ControllerSeoPageTranslationResponseDto[]
  updated_by: string | null
  updated_on: string | null
}

export interface ControllerSeoDefaultSaveDto {
  /** noindex. 사이트맵에서도 뺀다 */
  no_index?: boolean
  /** 공유 카드(og:image) 파일 id. 비우면 사이트 기본 그림 */
  og_image?: string | null
  /** 장 주소(쿼리 없이). 홈은 / */
  path: string
  /** 언어마다 한 줄 */
  translations: ControllerSeoPageTranslationDto[]
}

export interface ControllerSeoPageTranslationDto {
  /** 비우면 코드의 설명 */
  description?: string | null
  /** 언어 코드 */
  languages_code: "ko-KR" | "en-US"
  /** 비우면 코드의 제목. 뒤의 「| 디알밸류」는 화면이 붙인다 */
  title?: string | null
}

export interface ControllerSeoPageTranslationResponseDto {
  description: string | null
  languages_code: "ko-KR" | "en-US"
  title: string | null
}

export interface ControllerSeoPublicPageResponseDto {
  description: string | null
  no_index: boolean
  /** 공개 주소 */
  og_image: string | null
  path: string
  title: string | null
}

/** 「METHOD /api/…」 → 성공 응답(response)과 요청 본문(body). 본문이 없으면 never. */
export interface ApiOperations {
  /** IAM 이 돌려보낸 code 로 세션을 만들고 /admin 으로 */
  "GET /api/admin/auth/callback": {
    response: unknown
    body: never
  }
  /** 사내 IAM 로그인으로 보낸다(state 쿠키를 싣는다) */
  "GET /api/admin/auth/login": {
    response: unknown
    body: never
  }
  /** 관리 세션 쿠키를 지운다(IAM 세션은 그대로) */
  "POST /api/admin/auth/logout": {
    response: {
      ok: true
    }
    body: never
  }
  /** 지금 로그인한 사람과 만질 수 있는 게시판 */
  "GET /api/admin/auth/me": {
    response: {
      data: ControllerAdminAuthDefaultMeResponseDto
    }
    body: never
  }
  /** 홈 요약(새 문의·내 담당·초안·예약·최근 변경) */
  "GET /api/admin/dashboard": {
    response: {
      data: ControllerAdminDashboardDefaultResponseDto
    }
    body: never
  }
  /** 파일 목록(최신순, 한 쪽 40개, 쓰는 곳의 수) */
  "GET /api/admin/files": {
    response: {
      data: ControllerAdminFileDefaultResponseDto[]
      page: number
      pageSize: number
      total: number
    }
    body: never
  }
  /** 파일 올리기(그림·PDF 20MB · 영상 200MB) */
  "POST /api/admin/files": {
    response: {
      data: ControllerAdminFileDefaultResponseDto
    }
    body: {
      file: string
      title?: string
    }
  }
  /** 지우기(쓰는 중이면 409, force=1 이면 빼고 지움) */
  "DELETE /api/admin/files/{id}": {
    response: {
      ok: true
    }
    body: never
  }
  /** 관리 화면 미리보기(원본) */
  "GET /api/admin/files/{id}": {
    response: unknown
    body: never
  }
  /** 보이는 이름 바꾸기 */
  "PATCH /api/admin/files/{id}": {
    response: {
      data: ControllerAdminFileDefaultResponseDto
    }
    body: ControllerAdminFileDefaultUpdateDto
  }
  /** 배너 전부(꺼진 것·기간 밖 포함) */
  "GET /api/admin/home/banners": {
    response: {
      data: ControllerHomeDefaultBannerResponseDto[]
    }
    body: never
  }
  /** 배너 전체 저장 */
  "PUT /api/admin/home/banners": {
    response: {
      data: ControllerHomeDefaultBannerResponseDto[]
    }
    body: ControllerHomeDefaultBannerSaveDto
  }
  /** 팝업 전부(꺼진 것·기간 밖 포함) */
  "GET /api/admin/home/popups": {
    response: {
      data: ControllerHomeDefaultPopupResponseDto[]
    }
    body: never
  }
  /** 팝업 전체 저장 */
  "PUT /api/admin/home/popups": {
    response: {
      data: ControllerHomeDefaultPopupResponseDto[]
    }
    body: ControllerHomeDefaultPopupSaveDto
  }
  /** 문의 목록(최신순, 한 쪽 30개) */
  "GET /api/admin/inquiries": {
    response: {
      data: ControllerAdminInquiryDefaultResponseDto[]
      page: number
      pageSize: number
      total: number
    }
    body: never
  }
  /** 담당자로 고를 수 있는 사람 */
  "GET /api/admin/inquiries/assignees": {
    response: {
      data: ControllerAdminInquiryAssigneeResponseDto[]
    }
    body: never
  }
  /** 문의 지우기 */
  "DELETE /api/admin/inquiries/{id}": {
    response: {
      ok: true
    }
    body: never
  }
  /** 문의 하나 */
  "GET /api/admin/inquiries/{id}": {
    response: {
      data: ControllerAdminInquiryDefaultResponseDto
    }
    body: never
  }
  /** 상태·담당자·메모 고치기(보낸 칸만) */
  "PATCH /api/admin/inquiries/{id}": {
    response: {
      data: ControllerAdminInquiryDefaultResponseDto
    }
    body: ControllerAdminInquiryDefaultUpdateDto
  }
  /** 메뉴 전체(꺼진 칸 포함) */
  "GET /api/admin/menu": {
    response: {
      data: ControllerMenuDefaultAdminTreeResponseDto
    }
    body: never
  }
  /** 메뉴 전체 저장 */
  "PUT /api/admin/menu": {
    response: {
      data: ControllerMenuDefaultAdminTreeResponseDto
    }
    body: ControllerMenuDefaultSaveDto
  }
  /** 편집할 수 있는 페이지 목록 */
  "GET /api/admin/pages": {
    response: {
      data: ControllerPageDefaultRowResponseDto[]
    }
    body: never
  }
  /** 페이지 한 장 — 칸 구조와 언어별 글 */
  "GET /api/admin/pages/{key}": {
    response: {
      data: ControllerPageDefaultDetailResponseDto
    }
    body: never
  }
  /** 한 언어의 페이지 글 저장 */
  "PUT /api/admin/pages/{key}": {
    response: {
      data: ControllerPageDefaultLangResponseDto
    }
    body: ControllerPageDefaultSaveDto
  }
  /** 글 목록(한 쪽 30개) */
  "GET /api/admin/posts": {
    response: ControllerAdminPostDefaultPageResponseDto
    body: never
  }
  /** 글 만들기 */
  "POST /api/admin/posts": {
    response: {
      data: ControllerAdminPostDefaultDetailResponseDto
    }
    body: ControllerAdminPostDefaultSaveDto
  }
  /** 수행실적 「구분」에 쓴 값 */
  "GET /api/admin/posts/category-labels": {
    response: {
      data: string[]
    }
    body: never
  }
  /** FAQ 「분류」에 쓴 값 */
  "GET /api/admin/posts/faq-categories": {
    response: {
      data: string[]
    }
    body: never
  }
  /** 순서 바꾸기(sort = 1..n) */
  "POST /api/admin/posts/reorder": {
    response: {
      ok: true
    }
    body: ControllerAdminPostDefaultReorderDto
  }
  /** 글 지우기 */
  "DELETE /api/admin/posts/{id}": {
    response: {
      ok: true
    }
    body: never
  }
  /** 글 하나 */
  "GET /api/admin/posts/{id}": {
    response: {
      data: ControllerAdminPostDefaultDetailResponseDto
    }
    body: never
  }
  /** 글 고치기 */
  "PUT /api/admin/posts/{id}": {
    response: {
      data: ControllerAdminPostDefaultDetailResponseDto
    }
    body: ControllerAdminPostDefaultSaveDto
  }
  /** 전체 변경 이력(한 쪽 50줄) */
  "GET /api/admin/revisions": {
    response: {
      data: ControllerAdminRevisionDefaultRowResponseDto[]
      page: number
      pageSize: number
      total: number
    }
    body: never
  }
  /** 한 항목의 이력(최신순 100줄까지) */
  "GET /api/admin/revisions/item/{collection}/{id}": {
    response: {
      data: ControllerAdminRevisionDefaultRowResponseDto[]
    }
    body: never
  }
  /** 이력 한 건(바꾸기 전·뒤) */
  "GET /api/admin/revisions/{id}": {
    response: {
      data: ControllerAdminRevisionDefaultDetailResponseDto
    }
    body: never
  }
  /** 이 이력의 「바꾸기 전」으로 되돌리기 */
  "POST /api/admin/revisions/{id}/restore": {
    response: ControllerAdminRevisionDefaultRestoreResponseDto
    body: never
  }
  /** 덮어쓰기 지우기(코드의 값으로 돌아간다) */
  "DELETE /api/admin/seo/pages": {
    response: {
      ok: true
    }
    body: never
  }
  /** 덮어쓴 장 전부 */
  "GET /api/admin/seo/pages": {
    response: {
      data: ControllerSeoDefaultPageResponseDto[]
    }
    body: never
  }
  /** 한 장의 검색 설정 저장(없으면 만든다) */
  "PUT /api/admin/seo/pages": {
    response: {
      data: ControllerSeoDefaultPageResponseDto
    }
    body: ControllerSeoDefaultSaveDto
  }
  /** 권한 목록 */
  "GET /api/admin/users": {
    response: {
      data: ControllerAdminUserDefaultResponseDto[]
    }
    body: never
  }
  /** 고칠 수 있는 범위 바꾸기 */
  "PATCH /api/admin/users/{email}": {
    response: {
      data: ControllerAdminUserDefaultResponseDto
    }
    body: ControllerAdminUserDefaultUpdateDto
  }
  /** 공개 파일 원본(공개된 곳이 가리키는 파일만) */
  "GET /api/content/assets/{id}": {
    response: unknown
    body: never
  }
  /** 지금 살아 있는 배너 하나와 팝업들 */
  "GET /api/content/home": {
    response: {
      data: ControllerHomeDefaultPublicResponseDto
      language: string
    }
    body: never
  }
  /** 공개 메뉴(상단·하단) */
  "GET /api/content/menu": {
    response: {
      data: ControllerMenuDefaultPublicTreeResponseDto
      language: string
    }
    body: never
  }
  /** 덮어쓴 장 전부(언어 하나로) */
  "GET /api/content/page-meta": {
    response: {
      data: ControllerSeoPublicPageResponseDto[]
    }
    body: never
  }
  /** 페이지 글(요청 언어, 없으면 기본 언어) */
  "GET /api/content/pages/{key}": {
    response: ControllerPageDefaultPublicResponseDto
    body: never
  }
  /** 공개 게시판 한 쪽(틀린 쿼리 값은 자르거나 무시) */
  "GET /api/content/posts": {
    response: ControllerContentDefaultPostListResponseDto
    body: never
  }
  /** 공개 글 하나(본문·첨부) */
  "GET /api/content/posts/{slug}": {
    response: ControllerContentDefaultPostDetailEnvelopeDto
    body: never
  }
  /** 문의 접수(메일 + DB, IP 당 분 5회 · 시 30회) */
  "POST /api/inquiry": {
    response: {
      ok: true
    }
    body: ControllerInquiryDefaultCreateDto
  }
}

export type ApiOperation = keyof ApiOperations
export type ApiResponse<K extends ApiOperation> = ApiOperations[K]['response']
export type ApiBody<K extends ApiOperation> = ApiOperations[K]['body']
