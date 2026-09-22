'use client'

import { PostFull, Translation, uploadFile } from '@/lib/admin'
import FileDrop from '../../ui/FileDrop'

/** 공개 사이트의 게시판 이름(검색 제목 뒤에 붙는 말). 관리 화면 이름(「채용공고」)과 다르다. */
const PUBLIC_LABEL: Record<string, string> = { notice: '공지사항', press: '보도자료', news: '뉴스', recruit: '채용' }
/** 검색 결과에서 잘리지 않는 대략의 길이. 넘어도 저장은 된다 — 뒤가 「…」로 잘릴 뿐이다. */
const TITLE_MAX = 60
const DESC_MAX = 160
const BODY_IMAGES_RE = /\/api\/content\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi

const plain = (html: string | null | undefined) =>
  (html ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
const cut = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…')

/**
 * 글의 「검색 노출」 — 검색 제목·설명(언어별), 공유 그림, 검색에서 제외. 글마다 사이트 주소가 있는
 * 게시판(공지·보도·뉴스·채용)에만 나온다. 비운 칸은 사이트가 제목·요약·본문 첫 그림으로 채운다.
 */
export default function SeoPanel({
  post,
  t,
  setT,
  set,
  busy,
  onError,
}: {
  post: PostFull
  t: Translation
  setT: (patch: Partial<Translation>) => void
  set: (patch: Partial<PostFull>) => void
  busy: boolean
  onError: (message: string) => void
}) {
  const label = PUBLIC_LABEL[post.board] ?? ''
  const fallbackTitle = `${t.title?.trim() || '제목'} | ${label}`
  const shownTitle = `${t.seo_title?.trim() || fallbackTitle} | 디알밸류`
  const fallbackDesc = t.summary?.trim() || cut(plain(t.body), DESC_MAX)
  const shownDesc = t.seo_description?.trim() || fallbackDesc
  const slug = post.slug || '(저장하면 정해집니다)'
  const bodyImages = [
    ...new Set(post.translations.flatMap((x) => [...(x.body ?? '').matchAll(BODY_IMAGES_RE)].map((m) => m[1].toLowerCase()))),
  ]
  const cover = bodyImages[0] ?? null
  const shareUrl = post.og_image_url ?? (post.og_image ? `/api/admin/files/${post.og_image}` : null)

  async function upload(file: File | undefined) {
    if (!file) return
    try {
      const f = await uploadFile(file, file.name.replace(/\.[^.]+$/, ''))
      set({ og_image: f.id, og_image_url: `/api/admin/files/${f.id}` })
    } catch (e) {
      onError((e as Error).message)
    }
  }

  return (
    <div className="dva_card dva_seo">
      <h2>검색 노출</h2>

      <div className="dva_serp" aria-label="검색 결과 미리 보기">
        <span className="dva_serp_url">drvalue.co.kr › page › support › {post.board} › {slug}</span>
        <span className="dva_serp_title">{cut(shownTitle, TITLE_MAX + 12)}</span>
        <span className="dva_serp_desc">{shownDesc ? cut(shownDesc, DESC_MAX) : '설명이 비어 있습니다. 요약을 쓰거나 아래 검색 설명을 채워 주세요.'}</span>
      </div>

      <div className="dva_field">
        <label htmlFor="f-seo-title">검색 제목</label>
        <input
          id="f-seo-title"
          type="text"
          value={t.seo_title ?? ''}
          placeholder={fallbackTitle}
          aria-describedby="f-seo-title-hint"
          onChange={(e) => setT({ seo_title: e.target.value })}
        />
        <small id="f-seo-title-hint" className={(t.seo_title ?? '').length > TITLE_MAX ? 'dva_counter is-over' : 'dva_counter'}>
          {(t.seo_title ?? '').length}/{TITLE_MAX}자 · 비워 두면 「글 제목 | {label}」. 뒤의 「| 디알밸류」는 자동으로 붙습니다.
        </small>
      </div>

      <div className="dva_field">
        <label htmlFor="f-seo-desc">검색 설명</label>
        <textarea
          id="f-seo-desc"
          value={t.seo_description ?? ''}
          placeholder={fallbackDesc || '요약이나 본문 앞부분이 쓰입니다.'}
          aria-describedby="f-seo-desc-hint"
          onChange={(e) => setT({ seo_description: e.target.value })}
        />
        <small id="f-seo-desc-hint" className={(t.seo_description ?? '').length > DESC_MAX ? 'dva_counter is-over' : 'dva_counter'}>
          {(t.seo_description ?? '').length}/{DESC_MAX}자 · 비워 두면 요약, 요약도 없으면 본문 앞부분이 쓰입니다.
        </small>
      </div>

      <div className="dva_field">
        <span className="dva_label">공유 그림</span>
        {shareUrl ? (
          <div className="dva_thumb_row">
            <img className="dva_cover" src={shareUrl} width={96} height={72} alt="" />
            <small>메신저·SNS 에 주소를 붙이면 이 그림이 카드로 나옵니다.</small>
          </div>
        ) : (
          <small>
            {cover ? '비워 두면 본문의 첫 그림이 공유 카드에 나옵니다.' : '비워 두면 사이트 기본 그림이 공유 카드에 나옵니다.'}
          </small>
        )}
        {bodyImages.length > 0 && (
          <div className="dva_pick" role="group" aria-label="본문 그림에서 고르기">
            {bodyImages.map((id) => (
              <button
                key={id}
                type="button"
                className={`dva_pick_item${post.og_image === id ? ' is-on' : ''}`}
                aria-pressed={post.og_image === id}
                aria-label="이 그림을 공유 그림으로"
                onClick={() => set({ og_image: id, og_image_url: `/api/admin/files/${id}` })}
              >
                <img src={`/api/admin/files/${id}`} width={64} height={48} alt="" />
              </button>
            ))}
          </div>
        )}
        <FileDrop label="공유 그림 올리기" hint="1200×630 그림이 가장 잘 맞습니다." accept="image/png,image/jpeg,image/webp" disabled={busy} onFiles={(fs) => upload(fs[0])} />
        {post.og_image && (
          <button type="button" className="dva_btn is-small" onClick={() => set({ og_image: null, og_image_url: null })}>
            기본값으로
          </button>
        )}
      </div>

      <label className="dva_check">
        <input type="checkbox" checked={post.no_index} onChange={(e) => set({ no_index: e.target.checked })} /> 검색에서 제외
      </label>
      <small className="dva_hint">사이트에는 그대로 보입니다. 검색 결과와 사이트맵에서만 빠집니다.</small>
    </div>
  )
}
