import { PAGE_CSS as MAX_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { cmsBoard, type CmsPostFull } from '@/lib/cms'
import JsonLd from '@/components/JsonLd'
import { DEFAULT_OG_IMAGE, ORG, SITE_ORIGIN } from '@/lib/seo'
import { PAGE_CSS } from './boardStyles'
import { detailPath, type BoardConf } from './boards'
import CopyLink from './CopyLink'
import { bodyHtml, dotDate, plainText } from './text'

/** 화면에 보이는 글 그대로 — 제목·요약·게시일·고친 날·그림. 글쓴이는 회사(바이라인 「디알밸류」). */
function newsArticle(conf: BoardConf, post: CmsPostFull): Record<string, unknown> {
  const url = `${SITE_ORIGIN}${detailPath(conf, post.slug)}`
  const image = post.og_image || post.thumbnail || DEFAULT_OG_IMAGE.url
  const org = { '@type': 'Organization', '@id': `${SITE_ORIGIN}/#organization`, name: ORG.name, url: SITE_ORIGIN }
  return {
    '@type': conf.key === 'notice' ? 'Article' : 'NewsArticle',
    headline: (post.title ?? '').slice(0, 110),
    description: post.summary || plainText(post.body),
    // 게시 날짜는 날짜만 있다 — 한국 자정으로 적는다. 날짜만 두면 UTC 자정으로 읽혀 updated_on(같은 한국 자정을
    // UTC 로 적은 값)보다 늦어 보인다(dateModified < datePublished).
    ...(post.published_date ? { datePublished: `${post.published_date.slice(0, 10)}T00:00:00+09:00` } : {}),
    ...(post.updated_on ? { dateModified: post.updated_on } : {}),
    image: [image.startsWith('http') ? image : `${SITE_ORIGIN}${image}`],
    author: org,
    publisher: { ...org, logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/opt/logo.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: 'ko-KR',
  }
}

/**
 * 공지·보도·뉴스 글 한 건. 서버가 다 그린다 — 예전에는 목록 장이 `?id=` 를 보고 스크립트로
 * 그렸고, 그 주소의 제목·대표주소는 목록 것이었다. 이제 글마다 제 주소·제 제목이 있다.
 * 본문은 관리 화면 편집기가 만든 HTML 이다(관리자만 쓴다) — 채용 글과 같은 방식으로 넣는다.
 */
export default async function BoardArticle({ conf, post }: { conf: BoardConf; post: CmsPostFull | null }) {
  // 이전·다음 글은 목록과 같은 순서(api 가 정한다)에서 옆 칸이다. 한 쪽 100건이면 게시판 전부다.
  const siblings = post ? await cmsBoard(conf.key, 100) : null
  const at = siblings ? siblings.findIndex((x) => x.slug === post?.slug) : -1
  const newer = at > 0 ? siblings![at - 1] : null
  const older = at >= 0 && siblings && at < siblings.length - 1 ? siblings[at + 1] : null
  // 대표 이미지는 본문의 첫 그림이다(글 게시판). 본문에 이미 있으면 위에 또 싣지 않는다.
  const thumbId = post?.thumbnail?.split('/').pop() ?? ''
  const showThumb = Boolean(post?.thumbnail && !(post.body ?? '').includes(thumbId))
  const date = post?.published_date ?? ''

  return (
    <>
      {post && <JsonLd data={newsArticle(conf, post)} />}
      <style dangerouslySetInnerHTML={{ __html: MAX_CSS + PAGE_CSS }} />
      <SolutionShell
        path={conf.path}
        kicker={conf.label}
        kickerSub="고객센터"
        headLead={conf.headLead}
        headStrong={conf.headStrong}
        desc={conf.description}
        heroTag="h2"
        ctaTitle="문의사항이 있으신가요?"
        ctaDesc="프로젝트 문의는 문의하기에서 남길 수 있습니다."
      >
        <div className="sp_board" data-rv>
          {post === null ? (
            <div className="dv_empty">게시글을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</div>
          ) : (
            <article className="dv_art">
              <header className="dv_art_head">
                <p className="dv_art_kicker">
                  {conf.label}
                  {post.press_media && (
                    <>
                      {' '}<i aria-hidden="true">·</i> {post.press_media}
                    </>
                  )}
                </p>
                <h1 className="dv_art_title">{post.title}</h1>
                {post.summary && <p className="dv_art_deck">{post.summary}</p>}
                <div className="dv_art_byline">
                  <span>
                    <b>디알밸류</b> <time dateTime={date.slice(0, 10)}>{dotDate(date)}</time>
                  </span>
                  <CopyLink />
                </div>
              </header>
              {showThumb && post.thumbnail && (
                <img
                  className="dv_art_thumb"
                  src={post.thumbnail}
                  alt=""
                  width={post.thumbnail_size?.w ?? 1200}
                  height={post.thumbnail_size?.h ?? 675}
                />
              )}
              <div className="dv_art_body" dangerouslySetInnerHTML={{ __html: bodyHtml(post.body) }} />
              {post.attachments.length > 0 && (
                <ul className="dv_art_files" aria-label="첨부 파일">
                  {post.attachments.map((f) => (
                    <li key={f.id}>
                      <a href={f.url} target="_blank" rel="noopener">
                        <span aria-hidden="true">📎 </span>
                        {f.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {(newer || older) && (
                <nav className="dv_art_nav" aria-label="다른 글">
                  {newer && (
                    <a href={detailPath(conf, newer.slug)}>
                      <b>이전 글</b>
                      <span>{newer.title}</span>
                    </a>
                  )}
                  {older && (
                    <a href={detailPath(conf, older.slug)}>
                      <b>다음 글</b>
                      <span>{older.title}</span>
                    </a>
                  )}
                </nav>
              )}
              <footer className="dv_art_foot">
                <a className="dv_art_back" href={conf.path}>← {conf.label} 목록</a>
              </footer>
            </article>
          )}
        </div>
      </SolutionShell>
    </>
  )
}
