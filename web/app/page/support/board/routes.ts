import type { Metadata } from 'next'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import { cmsBoardPage, cmsPost, type CmsPostFull } from '@/lib/cms'
import { pageMeta, seoMeta } from '@/lib/seo'
import { BOARDS, detailPath, isBoardKey, type BoardConf } from './boards'
import { plainText } from './text'

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

/**
 * 옛 상세 주소 `목록?id=…` 를 글 주소로 308. 두 가지가 들어온다.
 *   - 이 사이트가 쓰던 `?id=<slug>` (홈 소식·목록 링크)
 *   - 옛 PHP 의 `notice.php?id=<원본 id>` → .php 308 이 쿼리째 넘겨 여기로 온다.
 *     옮길 때 주소를 `legacy-` + 원본 id 앞 8자로 만들었다(옛 cms/scripts/import_board.py 의 slug_of).
 * 글이 다른 게시판이면 그 게시판 주소로 보낸다. 없으면 404. api 가 안 닿으면 영구 이동이
 * 아니라 임시 이동으로 글 주소에 보낸다 — 틀린 308 은 검색엔진이 오래 기억한다.
 */
export async function redirectLegacy(conf: BoardConf, sp: SP): Promise<void> {
  const id = one(sp.id) || one(sp.idx)
  if (!id) return
  const candidates = id.startsWith('legacy-') ? [id] : [id, `legacy-${id.slice(0, 8)}`]
  let unreachable = false
  for (const slug of candidates) {
    const p = await cmsPost(slug)
    if (p === null) {
      unreachable = true
      continue
    }
    if (p === 'missing') continue
    const home = isBoardKey(p.board) ? BOARDS[p.board] : conf
    permanentRedirect(detailPath(home, p.slug))
  }
  if (unreachable) redirect(detailPath(conf, candidates[0]))
  notFound()
}

/** 글 한 건을 이 게시판 주소에서 읽는다. 다른 게시판 글이면 제 주소로 308, 없으면 404. */
export async function loadPost(conf: BoardConf, slug: string): Promise<CmsPostFull | null> {
  const p = await cmsPost(slug)
  if (p === 'missing') notFound()
  if (p && p.board && p.board !== conf.key) {
    if (isBoardKey(p.board)) permanentRedirect(detailPath(BOARDS[p.board], p.slug))
    notFound()
  }
  return p
}

/**
 * 목록 장의 머리 정보. 2쪽부터는 그 쪽이 대표주소다. 검색 결과(검색어·기간)는 색인하지
 * 않는다 — 같은 글이 조건마다 다른 주소로 잡힌다. 글이 하나도 없는 동안도 색인하지 않는다
 * (빈 장이 「아직 등록된 … 없습니다」로 검색 결과에 잡힌다). 1쪽은 관리 화면 「SEO」의 덮어쓰기를 얹는다.
 */
export async function boardListMetadata(conf: BoardConf, sp: SP): Promise<Metadata> {
  const page = Math.max(1, parseInt(one(sp.page), 10) || 1)
  const searching = Boolean(one(sp.q) || one(sp.startDate) || one(sp.endDate))
  // 목록 장이 그리는 요청과 같은 주소라 한 번만 나간다(요청 안의 fetch 는 합쳐진다).
  const first = await cmsBoardPage(conf.key)
  const empty = first !== null && first.total === 0
  const input = {
    title: page > 1 ? `${conf.label} ${page}쪽` : conf.label,
    description: conf.seoDescription,
    path: page > 1 ? `${conf.path}?page=${page}` : conf.path,
    noIndex: searching || empty,
  }
  return page > 1 ? pageMeta(input) : seoMeta(input)()
}

/**
 * 글 한 건의 머리 정보. 관리 화면의 검색 제목·설명이 있으면 그것, 없으면 제목·요약·본문 앞부분.
 * 공유 그림은 글의 공유 그림 → 대표 이미지(본문 첫 그림) → 사이트 기본 그림. 없는 글은 여기서 404 —
 * 안 그러면 404 장이 목록 제목(「공지사항」)을 달고 나간다.
 */
export async function boardPostMetadata(conf: BoardConf, slug: string): Promise<Metadata> {
  const p = await cmsPost(slug)
  if (p === 'missing') notFound()
  const path = detailPath(conf, slug)
  if (!p) return pageMeta({ title: conf.label, description: conf.seoDescription, path })
  return pageMeta({
    title: p.seo_title?.trim() || `${p.title} | ${conf.label}`,
    description: p.seo_description?.trim() || p.summary?.trim() || plainText(p.body) || conf.seoDescription,
    path: detailPath(isBoardKey(p.board) ? BOARDS[p.board] : conf, p.slug),
    article: { publishedTime: p.published_date, modifiedTime: p.updated_on },
    image: p.og_image || p.thumbnail,
    noIndex: Boolean(p.no_index),
  })
}
