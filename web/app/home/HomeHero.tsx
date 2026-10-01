import type { ReactNode } from 'react'
import ClientAction from '@/components/ClientAction'
import type { CmsHomeBanner } from '@/lib/cms'
import type { HomeContent } from './content'
import HeroCarousel from './HeroCarousel'
import { PRESS_SLIDE } from './heroSlides'

export type HeroCounts = { patent: number; copyright: number; cases: number }

/**
 * 홈 머리 그림. 글은 관리 화면 「메인 화면 › 문구」(page_contents 'home' · hero), 사진은 그 칸의 배경 사진
 * 또는 진행 중인 기간 배너가 정한다. 배너에 제목·설명·링크가 있으면 그것이 기본 글을 대신한다.
 *
 * 처음 글은 **원본 홈에 이미 있던 것**이다 — `index.php` 의 히어로가 주석으로 꺼져 있었을 뿐
 * 문구는 그대로 남아 있었다(app/home/content.ts 가 그 글을 옮긴 씨앗이다).
 * 숫자 셋은 손으로 적지 않는다 — 특허·저작권·수행실적 게시판의 공개 글 수를 센다(page.tsx).
 *
 * 2026-10-01: 장이 둘이다 — 첫 장(위 글)과 보도자료 한 장(heroSlides.ts). 자동으로 넘어간다(HeroCarousel).
 * 슬라이드를 뺀 이전 결정을 사용자가 되돌렸다(docs/tracking/decisions/0019). 기간 배너는 **첫 장**의 글·사진을 바꾼다.
 * 단추 줄은 두 장 공통이고 셋이다 — 첫 단추(`hero.primary`·배너 링크, 기본 「M.AX 살펴보기」) · 화장품 특화 AI 보기(heroSlides.ts, 새 탭) ·
 * 문의하기. 첫 단추는 두 장 어디서나 같다(장마다 다르면 넘길 때 단추가 움직여 보인다).
 *
 * 기본 사진은 `/opt/main_bg_01.jpg`(homeStyles 의 CSS). 아래 장들이 쓰는 `main_bg_03` 과 일부러
 * 다른 것을 골랐다. 같은 그림이 머리마다 반복되면 장이 바뀐 줄 모른다.
 */
export default function HomeHero({
  hero,
  banner,
  counts,
}: {
  hero: HomeContent['hero']
  banner: CmsHomeBanner | null
  counts: HeroCounts
}) {
  const bgUrl = banner?.image.url ?? (hero.background?.id ? `/api/content/assets/${hero.background.id}` : null)
  const primary = banner?.link ?? hero.primary
  const desc = banner?.description || hero.desc
  const p = PRESS_SLIDE
  // 장마다 글 덩어리·숫자 줄의 높이를 같게 — 각 칸에 **다른 장의 글을 보이지 않게 겹쳐** 둔다(ghost). 칸 높이가 둘 중 큰 쪽이 되어
  // 서버가 그린 첫 틀부터 단추 줄이 장마다 같은 자리다(스크립트로 재면 첫 장이 한 번 튄다 — 폰에서 실측).
  // 제목은 ghost 일 때 div 로 그린다 — h1 은 하나여야 한다.
  const text1 = (ghost: boolean) => {
    const Title = ghost ? 'div' : 'h1'
    return (
      <>
        {hero.kicker && <span className="dv_hero_kicker">{hero.kicker}</span>}
        <Title className={ghost ? 'dv_hero_h' : undefined}>
          {banner?.title ? (
            <span>{banner.title}</span>
          ) : (
            <>
              <span>{hero.titleLead}</span>
              {hero.titleStrong && (
                <>
                  <br />
                  <span>
                    <strong>{hero.titleStrong}</strong>
                  </span>
                </>
              )}
            </>
          )}
        </Title>
        {desc && <p>{desc}</p>}
      </>
    )
  }
  const text2 = (ghost: boolean) => {
    const Title = ghost ? 'div' : 'h2'
    return (
      <>
        <span className="dv_hero_kicker">{p.kicker}</span>
        <Title className="dv_hero_h dv_hero_h2">
          <span>{p.titleLead}</span>
          <br />
          <span>
            <strong>{p.titleStrong}</strong>
          </span>
        </Title>
        <p>{p.desc}</p>
      </>
    )
  }
  const proof1 = (
    <div className="dv_hero_proof">
      <span>
        특허·출원 <b>{`${counts.patent}개`}</b>
      </span>
      <span>
        프로그램 저작권 <b>{`${counts.copyright}개`}</b>
      </span>
      <span>
        수행·진행 실적 <b>{`${counts.cases}건`}</b>
      </span>
    </div>
  )
  const proof2 = (
    <div className="dv_hero_proof">
      {p.facts.map((f) => (
        <span key={f}>{f}</span>
      ))}
    </div>
  )
  const stack = (cls: string, own: ReactNode, ghost: ReactNode) => (
    <div className={cls}>
      <div className="dv_hero_own">{own}</div>
      <div className="dv_hero_ghost" aria-hidden="true">
        {ghost}
      </div>
    </div>
  )
  // 두 장이 같은 단추 줄을 쓴다 — 장이 넘어가도 단추가 움직여 보이지 않게(2026-10-01 사용자).
  const actions = (
    <div className="dv_hero_btns">
      {primary.href && (
        <a className="dv_hero_prim" href={primary.href}>
          {primary.label}
          <i aria-hidden="true">→</i>
        </a>
      )}
      <a className="dv_hero_sec" href={p.action.href} target="_blank" rel="noopener noreferrer">
        {p.action.label}
      </a>
      <ClientAction type="button" className="dv_hero_sec" calls={[{ fn: 'openContactModal' }]}>
        {hero.secondaryLabel}
      </ClientAction>
    </div>
  )
  return (
    <HeroCarousel>
      <section className="dv_hero">
        <div className="dv_hero_bg" aria-hidden="true" style={bgUrl ? { backgroundImage: `url(${JSON.stringify(bgUrl)})` } : undefined} />
        <div className="t_inner">
          {stack('dv_hero_text', text1(false), text2(true))}
          {actions}
          {stack('dv_hero_stack', proof1, proof2)}
        </div>
        <span className="dv_hero_cue" aria-hidden="true">
          <i />
          SCROLL
        </span>
      </section>
      <section className="dv_hero">
        {/* 둘째 장의 그림이 아직 없으면 어두운 바탕만 깐다. 있으면 늦게 불러온다 — 첫 장 그림이 먼저다. */}
        {p.image && (
          <img
            className="dv_hero_bg dv_hero_bg_img"
            src={p.image.src}
            width={p.image.width}
            height={p.image.height}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        )}
        <div className="t_inner">
          {stack('dv_hero_text', text2(false), text1(true))}
          {actions}
          {stack('dv_hero_stack', proof2, proof1)}
        </div>
      </section>
    </HeroCarousel>
  )
}
