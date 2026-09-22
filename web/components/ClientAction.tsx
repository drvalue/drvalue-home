'use client'

/**
 * PHP 의 `onclick="fn()"` 을 옮기는 단 하나의 방법.
 *
 * 두 가지가 그대로 못 넘어온다.
 *
 * 1. onclick 문자열은 JSX 속성이 될 수 없다. 함수는 headerAssets.ts 나
 *    페이지 인라인 스크립트가 window 에 심으므로 이름으로 찾아 부른다 —
 *    PHP 와 같은 함수다.
 * 2. `<a href="javascript:void(0);">` 을 React 는 막는다. 무시하는 게
 *    아니라 href 를 `javascript:throw new Error(...)` 로 바꿔 버려서,
 *    눌러도 아무 일 없던 링크가 예외를 던지는 링크가 된다.
 *    `#` + preventDefault 로 같은 결과를 만든다.
 *
 * 같은 일을 하는 컴포넌트가 여럿이면 다음 사람이 어느 쪽을 쓸지 고민한다.
 * 버튼·링크·div 를 `as` 하나로 받는다.
 */
export type Call = {
  /** window 에 심긴 함수 이름. `history.back` 처럼 점이 들어가도 된다. */
  fn: string
  /** 넘길 인자. PHP 가 `fn('/img/a.png')` 하던 자리 */
  args?: unknown[]
  /** PHP 가 `fn(this)` 로 자기 자신을 넘기던 자리 */
  self?: boolean
  /** PHP 가 `fn(event)` 로 이벤트를 넘기던 자리.
   *  원본이 `e.target.id` 를 보므로 합성 이벤트가 아니라 네이티브를 준다. */
  event?: boolean
}

export default function ClientAction({
  as: Tag = 'button',
  calls,
  on = 'click',
  prevent,
  children,
  ...props
}: {
  as?: 'a' | 'button' | 'div' | 'span' | 'li' | 'form'
  calls: Call[]
  /** 어떤 사건에 걸 것인가. PHP 의 onclick / onsubmit 에 대응한다. */
  on?: 'click' | 'submit'
  /** 기본 동작을 막는다. PHP 의 `onsubmit="return false;"` 자리. */
  prevent?: boolean
  children?: React.ReactNode
  // 버튼의 type, 링크의 rel 처럼 태그마다 다른 속성을 다 받아야 한다.
  // HTMLAttributes 만 받으면 type="button" 에서 막힌다.
} & Omit<React.AllHTMLAttributes<HTMLElement>, 'as' | 'onClick' | 'href'>) {
  const extra = Tag === 'a' ? { href: '#' } : {}
  return (
    <Tag
      {...(props as Record<string, unknown>)}
      {...extra}
      {...{
        [on === 'submit' ? 'onSubmit' : 'onClick']: (e: React.SyntheticEvent<HTMLElement>) => {
        if (prevent || Tag === 'a') e.preventDefault()
        const el = e.currentTarget
        for (const c of calls) {
          // `history.back` 처럼 점으로 파고든다. 중간이 없으면 넘어간다.
          const path = c.fn.split('.')
          let owner: unknown = window
          for (const seg of path.slice(0, -1)) {
            owner = (owner as Record<string, unknown> | undefined)?.[seg]
          }
          const fn = (owner as Record<string, unknown> | undefined)?.[path[path.length - 1]]
          if (typeof fn !== 'function') continue
          const args = c.self ? [el] : c.event ? [e.nativeEvent] : (c.args ?? [])
          ;(fn as (...a: unknown[]) => void).apply(owner, args)
        }
        },
      }}
    >
      {children}
    </Tag>
  )
}
