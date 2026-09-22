import Link from 'next/link'
import { MENU_ITEMS, isActive, isSubActive } from '@/lib/menu'
import { SITE_ORIGIN } from '@/lib/seo'
import JsonLd from './JsonLd'

/**
 * breadcrumb.php 를 그대로 옮긴 것. 판정 규칙(첫 일치 대분류, 없으면 첫 하위)
 * 까지 같게 둔다. 규칙을 "고치면" 기존 페이지의 표시가 달라진다.
 */
export default function Breadcrumb({ currentPath }: { currentPath: string }) {
  const curMenu = MENU_ITEMS.find((m) => m.match && isActive(currentPath, m.match))
  if (!curMenu) return null

  // **이름 찾기는 `hidden` 까지 포함해서 본다.** 메뉴에서 내린 장도 자기 이름으로
  // 찍혀야 한다 — 안 그러면 첫 하위로 떨어져서 GrowTalk 을 열었는데
  // 「AI솔루션 › 오토폼」 이라고 적힌다(실제로 그랬다).
  const visible = (curMenu.sub ?? []).filter((s) => !s.hidden)
  const curSub = curMenu.sub
    ? curMenu.sub.find((s) => isSubActive(currentPath, s.l)) ?? visible[0] ?? curMenu.sub[0]
    : null

  // 줄에 찍힌 것 그대로(홈 › 대분류 › 하위)를 검색엔진에도 준다. 링크가 같은 곳을 두 번 가리키면 하나만.
  const trail = [
    { name: '홈', url: '/' },
    { name: curMenu.title, url: curMenu.link },
    ...(curSub && curSub.l !== curMenu.link ? [{ name: curSub.t, url: curSub.l }] : []),
  ]

  return (
    <nav className="dv_breadcrumb" aria-label="현재 위치">
      <div className="dv_bc_inner">
        <Link className="dv_bc_home" href="/" aria-label="홈으로">
          <i className="fa fa-home" />
        </Link>

        <div className="dv_bc_item">
          <button type="button" className="dv_bc_cur">
            <span>{curMenu.title}</span><i className="fa fa-angle-down" />
          </button>
          <ul className="dv_bc_drop">
            {MENU_ITEMS.map((m) => (
              <li key={m.title} className={m.title === curMenu.title ? 'on' : ''}>
                <Link href={m.link}>{m.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        {curSub && curMenu.sub && (
          <div className="dv_bc_item">
            <button type="button" className="dv_bc_cur">
              <span>{curSub.t}</span><i className="fa fa-angle-down" />
            </button>
            <ul className="dv_bc_drop">
              {/* 펼침 목록에는 보이는 것만. 현재 위치가 숨긴 장이면 그 이름은
                  위 단추에 찍히고, 목록에는 안 들어간다. */}
              {visible.map((s) => (
                <li key={s.l} className={isSubActive(currentPath, s.l) ? 'on' : ''}>
                  <Link href={s.l}>{s.t}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <JsonLd
        data={{
          '@type': 'BreadcrumbList',
          itemListElement: trail.map((t, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: t.name,
            item: `${SITE_ORIGIN}${t.url}`,
          })),
        }}
      />
    </nav>
  )
}
