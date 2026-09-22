import type { Metadata } from 'next'
import BoardList, { readQuery } from '../board/BoardList'
import { BOARDS } from '../board/boards'
import { boardListMetadata, redirectLegacy } from '../board/routes'

/**
 * /page/support/press.php 를 옮긴 것. 주소에서 `.php` 를 뺐다 — 옛 주소는 lib/phpRoutes.mjs 의
 * 목록대로 308 로 넘어온다.
 *
 * 목록·검색·쪽 넘김을 서버가 그린다(스크립트 없이 보인다). 글 한 건은 `/page/support/press/<slug>`.
 * 옛 상세 주소 `?id=` 는 여기서 글 주소로 308 한다(board/routes.ts).
 */
export const dynamic = 'force-dynamic'

const conf = BOARDS.press

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return boardListMetadata(conf, await searchParams)
}

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams
  await redirectLegacy(conf, sp)
  return <BoardList conf={conf} query={readQuery(sp)} />
}
