import type { Metadata } from 'next'
import BoardArticle from '../../board/BoardArticle'
import { BOARDS } from '../../board/boards'
import { boardPostMetadata, loadPost } from '../../board/routes'

/** 보도자료 글 한 건. 없는 글·초안·예약 전은 api 가 404 → notFound. */
export const dynamic = 'force-dynamic'

const conf = BOARDS.press

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return boardPostMetadata(conf, slug)
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const post = await loadPost(conf, slug)
  return <BoardArticle conf={conf} post={post} />
}
