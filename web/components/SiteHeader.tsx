import ContactModal from '@/components/ContactModal'
import ClientAction from '@/components/ClientAction'
import HeaderScroll from './HeaderScroll'
import { isActive, isSubActive } from '@/lib/menu'
import type { MenuItem } from '@/lib/menu'
import { getMenu } from '@/lib/menu-cms'

/** 드롭다운에 실제로 그릴 하위. `hidden` 은 이름만 쓰고 안 그린다 — 왜 그런지는
 *  lib/menu.ts 의 SubMenu 머리말 참고. */
const shown = (m: MenuItem) => (m.sub ?? []).filter((sm) => !sm.hidden)

/**
 * header.php 의 <header> 부분을 그대로 옮긴 것.
 *
 * **id·class·속성을 하나도 바꾸지 않는다.** css/header.css 를 그대로 쓰기
 * 때문에, 이름을 "정리" 하는 순간 스타일이 조용히 깨진다. 이관이 끝나고
 * 원본을 지운 뒤에 정리할 일이다.
 *
 * PHP 는 $_SERVER['REQUEST_URI'] 로 활성 메뉴를 정했다. 서버 컴포넌트에는
 * 그런 전역이 없어 호출하는 쪽이 경로를 넘긴다.
 *
 * 링크는 <a> 로 둔다. next/link 는 prefetch 를 붙이는데, 이관 중에는 아직
 * PHP 가 서비스하는 주소가 섞여 있어 존재하지 않는 경로를 미리 긁는다.
 *
 * 메뉴는 관리 화면 값(getMenu)이다. api 가 안 닿으면 lib/menu.ts 예비.
 */
export default async function SiteHeader({ currentPath }: { currentPath: string }) {
  const { top } = await getMenu()
  return (
    <>
    <header id="toss_header">
      {/* 맨 위에서만 투명해진다. 자세한 건 그 파일 머리말 참고. */}
      <HeaderScroll />
      <div className="header_container">
        {/* 로고는 h1 이 아니다 — 모든 장의 h1 이 로고(「디알밸류」)였다(SEO 감사). 장의 h1 은
            그 장의 제목이다(SolutionShell 머리말). id 는 그대로 — CSS·검사가 본다. */}
        <div id="toss_logo">
          <a href="/">
            {/* 로고 두 장을 겹쳐 두고 바꿔 보인다. 흰 것은 히어로 위(맨 위),
                빨간 것은 흰 막대일 때. 받은 참조 코드가 같은 방식이고 두 파일 다
                저장소 `brand/` 에 이미 있다 — 밖에서 안 받는다.

                옛 `/opt/logo.png` 는 빨간 **상자** 안에 흰 글자였다. 배경이
                투명해지면 상자만 혼자 떠 보인다.

                대조 검사가 옛 그림 두 개를 같은 것으로 짝지어 두고 있었다
                (compare.py 의 SAME_IMAGE). 그림이 바뀌었으므로 그 짝을 풀었다.
                헤더 자체는 이제 REDESIGNED 로 통째로 떼고 비교한다. */}
            <span className="hdr_logo_wrap">
              <img
                className="hdr_logo_red"
                src="/brand/logo-drvalue-red.png"
                alt="디알밸류"
                width={138}
                height={32}
                decoding="async"
              />
              <img
                className="hdr_logo_white"
                src="/brand/logo-drvalue-white.png"
                alt=""
                aria-hidden="true"
                width={138}
                height={32}
                decoding="async"
              />
            </span>
          </a>
        </div>

        <nav id="toss_gnb" className="desktop_only">
          <ul className="gnb_list">
            {top.map((menu) => (
              <li
                key={menu.link + menu.title}
                className={`gnb_li ${isActive(currentPath, menu.match) ? 'is-active' : ''}`}
              >
                {/* 글자를 <span> 으로 감싼다. 밑줄을 칸 폭이 아니라 **글자 폭**에
                    맞춰야 해서다 — 칸(140px) 전체에 그으면 참조 시안보다 훨씬
                    길고, 옆 탭 밑줄과 이어져 한 줄로 보인다. */}
                <a href={menu.link} className="main_a"><span>{menu.title}</span></a>
                {menu.sub && (
                  /* 하위가 전부 새로 넣은 것이면 껍데기까지 새것이다.
                     대조 검사가 통째로 떼어낼 수 있게 여기에도 표시한다.

                     **이 상자 안에 <div> 를 더 넣지 마라.** compare.py 의
                     strip_new_menu 가 첫 </div> 까지를 한 덩어리로 잘라내서,
                     안에 div 가 있으면 닫는 태그가 하나 남아 대조가 깨진다.
                     폭을 가운데로 모으는 일은 <ul> 이 한다. */
                  <div
                    className="sub_menu_box"
                    data-next-only={shown(menu).every((sm) => sm.neu) ? '' : undefined}
                  >
                    <ul className="sub_menu_list">
                      {shown(menu).map((sm) => (
                        <li
                          key={sm.l}
                          data-next-only={sm.neu ? '' : undefined}
                          className={isSubActive(currentPath, sm.l) ? 'is-sub-active' : ''}
                        >
                          <a href={sm.l}>
                            <b>{sm.t}</b>
                            <span>{sm.d}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="toss_hd_right">
          <ClientAction type="button"
            className="btn_header_cta desktop_only"
            data-tooltip="문의하기의 경우에는 관리자의 이메일로 전송됩니다."
            calls={[{ fn: 'openContactModal' }]}
          >
            문의하기
          </ClientAction>
          {/* 원본에 type 이 없다. 붙이면 마크업이 달라진다 — 폼 안에 들어가면
              동작도 달라지는 자리다. */}
          <ClientAction
            className="m_menu_btn mobile_only"
            aria-label="모바일 메뉴 열기"
            aria-expanded="false"
            aria-controls="mobile_menu_layer"
            calls={[{ fn: 'toggleMobileMenu' }]}
          >
            <span /><span /><span />
          </ClientAction>
        </div>
      </div>

      <div id="mobile_menu_layer" className="mobile_only" aria-hidden="true">
        <div className="m_menu_content">
          <ul className="m_gnb_list">
            {top.map((menu) => (
              <li key={menu.link + menu.title} className="m_gnb_li">
                {/* 손으로 쓰는 화면에는 호버가 없다. 하위가 하나뿐이면 펼침으로
                    만들지 않고 바로 가는 링크로 둔다 — 한 번 더 누르게 할 이유가 없고,
                    원본 마크업과도 어긋나지 않는다. */}
                {shown(menu).length > 1 ? (
                  <>
                    <ClientAction as="a" calls={[{ fn: 'toggleSubMenu', self: true }]} className="m_main_a" aria-expanded="false">
                      {menu.title}
                    </ClientAction>
                    <ul className="m_sub_list">
                      {shown(menu).map((sm) => (
                        <li key={sm.l}><a href={sm.l}>{sm.t}</a></li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <a href={menu.link} className="m_main_a">{menu.title}</a>
                )}
              </li>
            ))}
          </ul>
          <div className="m_menu_bottom">
            <ClientAction type="button"
              className="m_btn_contact"
              calls={[{ fn: 'toggleMobileMenu' }, { fn: 'openContactModal' }]}
            >
              문의하기
            </ClientAction>
          </div>
        </div>
      </div>
    </header>
    <ContactModal />
    </>
  )
}
