import Breadcrumb from '@/components/Breadcrumb'
import ClientAction from '@/components/ClientAction'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import SideNav from '@/components/SideNav'
import type { CSSProperties, ReactNode } from 'react'
import ProofBand from './ProofBand'
import FlowBand from './FlowBand'
import { V3Provider } from './V3Context'
import MotionFx from './MotionFx'
import { Plate, Statement } from './V4'
import { HeroCycle } from './Patterns'

/** 머리말 밑 판에 올리는 실제 제품 화면. 그 장의 기능 칸에 **안 나오는** 화면을 고른다 — 같은 그림이 두 번 보이면 화면이 하나뿐인 제품으로 읽힌다. */
export type HeroShot = { src: string; alt: string; w: number; h: number; tag: string; url?: string; phone?: boolean }

/** 머리말과 본문 사이에 들어가는 요약 칸. 「이게 뭔데?」 에 먼저 답한다. */
export type Lead = {
  title: string
  desc?: string
  /** 있으면 칸으로 나눠 그린다. 방식이 둘 이상일 때 쓴다. */
  items?: { t: string; d: string }[]
  /**
   * 있으면 items 를 카드 셋이 아니라 「큰 숫자 하나 + 한 줄 셋」으로 그린다.
   * 카드 셋은 셋이 다 같은 무게라 눈 둘 곳이 없었다(사용자: 「슴슴하다」).
   * 숫자는 본문에 이미 있는 값만 쓴다 — 없으면 짧은 낱말 하나로 대신한다.
   */
  hero?: { n: string; label: string }
}

/** 요약 칸 한 덩어리. SolutionShell 과 IndustryPage 가 같이 쓴다 — 두 곳에 두면 어긋난다. */
export function LeadBlock({ lead }: { lead: Lead }) {
  // 「숫자 + 단위」꼴만 세어 올린다(「10초」「90%」「3가지」). 낱말(「RAG」)과
  // 「3D → 2D」같은 것은 그대로 — 세면 「0D → 2D」가 지나간다.
  const counts = lead.hero ? /^\d+[%가-힣]*$/.test(lead.hero.n) : false
  return (
    <>
      <h2 className="mx_sec_title">{lead.title}</h2>
      {lead.desc && <p className="mx_sec_desc">{lead.desc}</p>}
      {lead.items && lead.hero ? (
        <div className="mx_leadhero" data-rv>
          <p className="mx_leadhero_n">
            <b {...(counts ? { 'data-count': true } : {})}>{lead.hero.n}</b>
            <span>{lead.hero.label}</span>
          </p>
          <ul className="mx_leadhero_pts">
            {lead.items.map((it) => (
              <li key={it.t}>
                <b>{it.t}</b>
                <span>{it.d}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : lead.items ? (
        <div className="mx_keygrid">
          {lead.items.map((it) => (
            <div className="mx_key" key={it.t}>
              <b>{it.t}</b>
              <span>{it.d}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mx_gap" />
    </>
  )
}

/**
 * M.AX 계열 낱장이 같이 쓰는 껍데기. 머리말 · 현재 위치 줄 · 본문 · 상담 칸.
 *
 * 업종 페이지(IndustryPage)와 AI 기능 페이지가 같은 모양이어야 해서 빼냈다.
 * 본문만 페이지마다 다르다.
 */
export default function SolutionShell({
  path,
  kicker,
  kickerSub,
  headLead,
  headStrong,
  desc,
  lead,
  ctaTitle = '우리 공장에 맞는 구성이 궁금하신가요?',
  ctaDesc = '업종과 현장 상황을 알려주시면 최적의 구축 방안을 제안해 드립니다.',
  look,
  ctaBg: ctaBgProp,
  heroShot,
  heroArt,
  heroLink,
  heroHref,
  proof,
  heroTag = 'h1',
  children,
}: {
  path: string
  kicker: string
  kickerSub: string
  headLead: string
  headStrong: string
  desc: string
  lead?: Lead
  ctaTitle?: string
  ctaDesc?: string
  /** 「인증·선정」 띠. 허브 장에만(사용자 2026-09-22). true = 머리말 바로 밑, 'end' = 문의 띠 바로 앞(M.AX 허브, 2026-09-28). */
  proof?: boolean | 'end'
  /**
   * 「v4」 — 2026-09-22 사용자가 지정한 레퍼런스(channel.io/kr/works·alf-customer)대로.
   * 가운데 큰 제목 + 판 위 제품 화면(움직이는 배경·패럴랙스) + 인증 띠 + 큰 문장·3열 +
   * 판에 담은 기능 줄 + 가운데 문의. (v3 = 09-21 승인 목업, 이것으로 대체.)
   * M.AX·AI솔루션 장만 켠다(사용자 결정). 안 켜면 옛 모양 그대로다.
   */
  look?: 'v4'
  /** 문의 띠 뒤에 까는 그림. v4 장(M.AX · AI솔루션)은 기본이 데이터→양식 선 그림(bg/cta-art.webp). null 이면 흰 띠. */
  ctaBg?: string | null
  /** 하나면 판 한 장, 여럿이면 몇 초마다 넘어간다(HeroCycle). */
  heroShot?: HeroShot | HeroShot[]
  /** 화면 대신 머리말 글 밑에 두는 그림 한 장(꾸밈 — 읽는 이에게 새 정보가 없으면 alt 를 비운다). */
  heroArt?: { src: string; w: number; h: number; alt: string }
  /** 머리말 둘째 단추 글. 기본 「기능 보기」. */
  heroLink?: string
  heroHref?: string
  /**
   * 머리말 큰 제목의 태그. 한 장에 h1 은 하나 — 장의 제목이다. 게시판 글 한 건처럼
   * 글 제목이 따로 h1 인 장만 'h2' 로 내린다(모양은 같다 — CSS 가 둘 다 본다).
   */
  heroTag?: 'h1' | 'h2'
  children: ReactNode
}) {
  const HeroTitle = heroTag
  // M.AX · AI솔루션(v4) 장의 문의 띠는 같은 선 그림을 깐다(2026-09-29 사용자: 「max 쪽하고 AI 솔루션 쪽」).
  const ctaBg = ctaBgProp === undefined ? (look === 'v4' ? '/bg/cta-art.webp' : null) : ctaBgProp
  // M.AX 네 장만(2026-09-28 사용자 「이거 4페이지」): 머리말 띠 · 구역 줄 · 왼쪽 차례표 · 머리 화면 꽉 채움.
  // 같은 껍데기를 쓰는 AI솔루션 장들은 그대로 둔다.
  const fam = path === '/page/business/max' || path.startsWith('/page/business/max/')
  if (look === 'v4') {
    return (
      <>
        <SiteHeader currentPath={path} />

        {/* 이름을 mx_hero 로 두지 않는다 — header.css 가 html:has(.mx_hero) 를 보고
            헤더를 투명(흰 글씨)으로 만든다. 여기는 바탕이 밝아서 흰 글씨가 사라진다. */}
        <div id="dvmax" className={fam ? 'mx_v4 mx_fam' : 'mx_v4'}>
          <MotionFx />
          <div className="mx_v4_top"><Breadcrumb currentPath={path} /></div>

          <section className="mx_hero4">
            <i className="mx_glow" aria-hidden="true" />
            <div className="mx_wrap">
              <p className="mx_kicker">{kickerSub} · {kicker}</p>
              <HeroTitle data-words>{headLead}<b>{headStrong}</b></HeroTitle>
              <p>{desc}</p>
              <div className="mx_hero4_act">
                <ClientAction type="button" className="mx_pill red" calls={[{ fn: 'openContactModal' }]}>
                  도입 상담 신청
                </ClientAction>
                <a className="mx_pill o" href={heroHref ?? '#mx_body'}>{heroLink ?? '기능 보기'}</a>
              </div>
              {Array.isArray(heroShot) ? <HeroCycle shots={heroShot} fill={fam} /> : heroShot && <Plate shot={heroShot} tag={heroShot.tag} url={heroShot.url} phone={heroShot.phone} eager />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {!heroShot && heroArt && <figure className="mx_hero_art" aria-hidden={heroArt.alt ? undefined : true}><img src={heroArt.src} alt={heroArt.alt} width={heroArt.w} height={heroArt.h} fetchPriority="high" /></figure>}
            </div>
          </section>

          {proof === true && <ProofBand />}

          {/* 공통 흐름은 **허브(M.AX 소개)에만**, 머리말 밑 전체 폭에 — 차례표 옆에 끼우면 6칸이 딱 붙었다.
              하위 장(PCB·화장품·MES AI)에는 넣지 않는다(2026-09-29 사용자: 「모든 곳에 넣으란 말이 아니다」). */}
          {path === '/page/business/max' && <FlowBand />}

          {/* 왼쪽 차례표 — 2026-09-28 사용자: 「왼쪽에 사이더도 둬주고」. v4 로 넘어오며 빠졌던 것을 되살린다(옛 모양과 같은 SideNav). */}
          <section className="mx_sec mx_sec_body" id="mx_body">
            <div className={fam ? 'mx_wrap mx_split' : 'mx_wrap'}>
              {fam && <SideNav currentPath={path} />}
              <div className="mx_main">
                {/* 요약 = 큰 문장 + 낮은 테두리 카드(2026-09-28). 글만 있는 3열은 사용자가 싫다 했고, 문장만 두니 「덩그러니」였다.
                    레퍼런스(업스테이지 제조 장)는 큰 문장 바로 밑에 테두리 1px 카드를 붙인다 — 그 짜임. */}
                {lead?.items && (
                  <div className="mx_sec4 big mx_keys">
                    <Statement desc={lead.desc}>{lead.title}</Statement>
                    <ul className="mx_keycards">
                      {lead.items.map((it) => <li key={it.t}><b>{it.t}</b><span>{it.d}</span></li>)}
                    </ul>
                  </div>
                )}
                <V3Provider>{children}</V3Provider>
              </div>
            </div>
          </section>

          {/* 인증 띠를 문의 바로 앞에 — 믿을 근거를 본 뒤에 문의 단추(2026-09-28 사용자: 「어디에 배치할지」). */}
          {proof === 'end' && <ProofBand />}

          <section
            className={ctaBg ? 'mx_cta has-bg' : 'mx_cta'}
            style={ctaBg ? ({ ['--cta-bg' as string]: `url(${ctaBg})` } as CSSProperties) : undefined}
          >
            <div className="mx_wrap">
              <h3 data-rv="pop" data-words>{ctaTitle}</h3>
              <p>{ctaDesc}</p>
              <ClientAction type="button" className="mx_pill red" calls={[{ fn: 'openContactModal' }]}>
                도입 상담 신청
              </ClientAction>
            </div>
          </section>
        </div>

        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <SiteHeader currentPath={path} />

      <div id="dvmax">
        <section className="mx_hero">
          <div className="mx_wrap">
            <p className="mx_kicker">{kicker} <span>| {kickerSub}</span></p>
            <HeroTitle>{headLead}<b>{headStrong}</b></HeroTitle>
            <p>{desc}</p>
          </div>
        </section>

        <Breadcrumb currentPath={path} />

        {/* 번호 붙은 단계로 바로 들어가기 전에 **무엇인지 한 번 말한다.**
            단계부터 시작하면 읽는 사람이 「지금 뭘 읽고 있는 거지」 를 안고
            내려간다. 없는 장은 이 칸을 통째로 안 그린다. */}
        {/* 요약 칸과 본문을 한 덩어리로 묶는다. 왼쪽 차례표가 둘 옆에 같이
            붙어 따라와야 하는데 구역을 나눠 두면 각자 따로 붙는다. */}
        <section className="mx_sec mx_sec_body">
          <div className="mx_wrap mx_split">
            <SideNav currentPath={path} />
            <div className="mx_main">
              {lead && <LeadBlock lead={lead} />}
              {children}
            </div>
          </div>
        </section>

        <section className="mx_cta">
          <div className="mx_wrap">
            <h3>{ctaTitle}</h3>
            <p>{ctaDesc}</p>
            {/* 사이트에 이미 있는 문의 모달을 연다 — 새 접수 경로를 만들지 않는다. */}
            <ClientAction type="button" calls={[{ fn: 'openContactModal' }]}>
              도입 상담 신청
            </ClientAction>
          </div>
        </section>
      </div>

      <SiteFooter />
    </>
  )
}
