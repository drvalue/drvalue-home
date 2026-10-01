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
  const desc = banner?.description || hero.desc
  const p = PRESS_SLIDE
  // 두 장이 같은 단추 줄을 쓴다 — 장이 넘어가도 단추가 움직여 보이지 않게(2026-10-01 사용자).
  const actions = (
    <div className="dv_hero_btns">
      <a className="dv_hero_prim" href={p.primary.href}>
        {p.primary.label}
        <i aria-hidden="true">→</i>
      </a>
      <a className="dv_hero_sec" href={p.secondary.href}>
        {p.secondary.label}
      </a>
      <a className="dv_hero_sec" href={p.system.href} target="_blank" rel="noopener noreferrer">
        {p.system.label}
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
        <div className="dv_hero_text">
        {hero.kicker && <span className="dv_hero_kicker">{hero.kicker}</span>}
        <h1>
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
        </h1>
        {desc && <p>{desc}</p>}
        </div>
        {actions}
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
      </div>
      <span className="dv_hero_cue" aria-hidden="true">
        <i />
        SCROLL
      </span>
    </section>
    <section className="dv_hero">
      {/* 둘째 장의 그림은 늦게 불러온다 — 첫 장 그림이 먼저다. 글은 그림 없이도 읽힌다(왼쪽이 어둡다). */}
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
      <div className="t_inner">
        <div className="dv_hero_text">
          <span className="dv_hero_kicker">{p.kicker}</span>
          <h2 className="dv_hero_h">
            <span>{p.titleLead}</span>
            <br />
            <span>
              <strong>{p.titleStrong}</strong>
            </span>
          </h2>
          <p>{p.desc}</p>
        </div>
        {actions}
        <div className="dv_hero_proof">
          {p.facts.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      </div>
    </section>
    </HeroCarousel>
  )
}
