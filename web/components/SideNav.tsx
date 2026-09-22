import { isActive, isSubActive } from '@/lib/menu'
import { getMenu } from '@/lib/menu-cms'

/**
 * 왼쪽에 붙어 따라다니는 옆 차례표.
 *
 * 왜 만들었나: 낱장에 들어가면 **형제 장으로 가는 길이 위쪽 탭 막대밖에**
 * 없었다. PCB MES 를 보다가 화장품 MES 로 넘어가려면 마우스를 맨 위까지
 * 올려 메뉴를 펼쳐야 한다. 긴 장일수록 그 거리가 멀어진다.
 *
 * 자료는 getMenu(관리 화면 값, 예비는 lib/menu.ts) 하나만 읽는다 — 위 탭 막대·현재 위치 줄과
 * 같은 것이다. 여기에 목록을 따로 적어 두면 한쪽만 고쳐져 어긋난다.
 *
 * 움직임은 아이파킹을 재면서 가져온 규칙을 따른다:
 *  - 들어올 때 위에서 차례로 올라온다(계단 지연). 저쪽 text-active-animation
 *    과 같은 생각인데 흐림(blur)은 안 쓴다 — 한글은 뭉개져 보인다.
 *  - 지금 보고 있는 줄은 왼쪽 막대가 **자라서** 표시된다. 켜졌다 꺼지는 것이
 *    아니라 길이가 변한다.
 *  - 움직임을 줄여 달라고 한 사람에게는 전부 끈다(css/sidenav 규칙).
 *
 * 화면이 좁으면 통째로 안 그린다. 그 자리는 현재 위치 줄의 펼침 목록이 맡는다.
 */
export default async function SideNav({ currentPath }: { currentPath: string }) {
  const { top } = await getMenu()
  const menu = top.find((m) => isActive(currentPath, m.match))
  const subs = (menu?.sub ?? []).filter((s) => !s.hidden)
  // 형제가 없으면 차례표가 할 말이 없다.
  if (!menu || subs.length < 2) return null

  return (
    <aside className="mx_side" aria-label={`${menu.title} 하위 차례`}>
      <div className="mx_side_in">
        <a className="mx_side_tab" href={menu.link}>
          {menu.title}
        </a>
        <ul>
          {subs.map((s, i) => {
            const on = isSubActive(currentPath, s.l)
            return (
              <li key={s.l} style={{ ['--i' as string]: i }}>
                <a href={s.l} aria-current={on ? 'page' : undefined} className={on ? 'on' : ''}>
                  <b>{s.t}</b>
                  <em>{s.d}</em>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
