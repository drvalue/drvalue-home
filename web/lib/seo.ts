/**
 * 검색엔진과 공유 미리보기가 읽는 것들.
 *
 * 왜 생겼나: 옮기기 전 PHP 사이트는 17장이 전부 같은 제목(`디알밸류 - AI 제조
 * 솔루션`)을 썼고 설명문·공유카드·대표주소가 하나도 없었다. 검색 결과에서
 * 서로 구분이 안 됐다는 뜻이다. 운영본을 직접 받아서 확인한 값이라 이관하며
 * 잃은 게 아니라 원래 없던 것이다.
 *
 * 그래서 **원본과 글자 단위로 같지 않게 된다.** 대조 검사(scripts/compare.py)가
 * 이것을 고의로 바꾼 것으로 알고 지나가게 해 뒀다. 검사를 끈 게 아니다.
 */

import type { Metadata } from 'next'

/** 운영 주소. 미리보기에 올려도 대표주소는 운영 쪽을 가리켜야 한다. */
export const SITE_ORIGIN = 'https://drvalue.co.kr'

export const SITE_NAME = '디알밸류'

/** 푸터에 이미 적혀 있는 값이다. 여기서 새로 지어내지 않는다. */
export const ORG = {
  name: '주식회사 디알밸류',
  alt: 'drvalue',
  ceo: '용미숙',
  bizNo: '491-87-02850',
  tel: '031-400-3880',
  email: 'hi@drvalue.co.kr',
  addr: '경기도 안산시 상록구 한양대학로 55, 창업보육센터 318호',
  locality: '안산시',
  region: '경기도',
} as const

/**
 * 사이트 기본 공유 그림(1200×630, `scripts/make-og-default.py` 가 만든다). 장·글이 따로 정하지 않으면
 * 이것이 나간다 — 하위 장의 openGraph 는 부모 것을 통째로 덮으므로(Next 의 얕은 합치기)
 * 레이아웃에 한 번 두는 것으로는 안 되고, 머리 정보를 만들 때마다 넣는다.
 */
export const DEFAULT_OG_IMAGE = {
  url: '/og/default.png',
  width: 1200,
  height: 630,
  alt: '디알밸류 — 제조 현장의 언어를 데이터로 통일합니다.',
}

/** 사이트 기본 설명(layout.tsx 와 같다). llms.txt·Organization 이 같이 쓴다. */
export const SITE_DESCRIPTION =
  '제조 현장의 언어를 데이터로 통일합니다. MES/ERP 구축, 제조 AI 자동화, LLM/RAG 기반 AI Chat 을 실제 현장에서 운영해 온 디알밸류.'

/**
 * 페이지 한 장의 머리 정보.
 *
 * `title` 은 페이지 고유 부분만 넘긴다 — 뒤의 ` | 디알밸류` 는 여기서 붙인다.
 * `description` 은 **그 페이지에 실제로 적혀 있는 내용**을 줄여 쓴다.
 * 없는 말을 넣으면 검색 결과와 실제 화면이 어긋나 되레 손해다.
 * `image` 는 공유 카드 그림 주소(없으면 사이트 기본 그림).
 */
export function pageMeta({
  title,
  description,
  path,
  noIndex = false,
  article,
  image,
}: {
  title: string
  description: string
  path: string
  noIndex?: boolean
  /** 게시판 글 한 건. 공유 카드가 「기사」로 읽고 게시일·고친 날을 붙인다. */
  article?: { publishedTime?: string | null; modifiedTime?: string | null }
  image?: string | null
}): Metadata {
  const full = `${title} | ${SITE_NAME}`
  const url = `${SITE_ORIGIN}${path}`
  const images = image ? [{ url: image }] : [DEFAULT_OG_IMAGE]
  return {
    title: full,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: full,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'ko_KR',
      images,
      ...(article
        ? {
            type: 'article' as const,
            ...(article.publishedTime ? { publishedTime: article.publishedTime } : {}),
            ...(article.modifiedTime ? { modifiedTime: article.modifiedTime } : {}),
          }
        : { type: 'website' as const }),
    },
    twitter: { card: 'summary_large_image', title: full, description, images: images.map((i) => i.url) },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  }
}

/** 관리 화면 「SEO」가 장 하나에 덮어쓴 값. 비운 칸은 null — 코드의 값을 쓴다. */
export type PageOverride = {
  path: string
  no_index: boolean
  og_image: string | null
  title: string | null
  description: string | null
}

const API = process.env.API_ORIGIN || 'http://localhost:3500'

/**
 * 덮어쓴 장 전부. 1분 캐시 — 정적 장이 요청마다 api 를 부르지 않게(저장 뒤 1분 안에 반영).
 * 못 읽으면 빈 목록: 코드의 값이 그대로 나간다. 빌드 때(docker 빌드에는 api 가 없다)도 그렇다 —
 * 그 장은 1분 뒤 첫 요청에 다시 그려지며 덮어쓰기를 싣는다.
 */
export async function pageOverrides(): Promise<PageOverride[]> {
  try {
    const res = await fetch(`${API}/api/content/page-meta`, {
      next: { revalidate: 60, tags: ['page-meta'] },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return []
    const body = (await res.json()) as { data?: PageOverride[] }
    return Array.isArray(body.data) ? body.data : []
  } catch {
    return []
  }
}

/**
 * 정적 장의 `generateMetadata`. 코드에 적은 값에 관리 화면의 덮어쓰기를 얹는다.
 *
 *   export const generateMetadata = seoMeta({ title, description, path })
 *
 * 코드의 noIndex 는 덮어쓰기가 풀 수 없다(글 작성 안내처럼 일부러 막은 장).
 */
export function seoMeta(input: Parameters<typeof pageMeta>[0]): () => Promise<Metadata> {
  return async () => {
    const o = (await pageOverrides()).find((x) => x.path === input.path)
    if (!o) return pageMeta(input)
    return pageMeta({
      ...input,
      title: o.title || input.title,
      description: o.description || input.description,
      image: o.og_image || input.image,
      noIndex: input.noIndex || o.no_index,
    })
  }
}
