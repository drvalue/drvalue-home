'use client'

import { type Feature } from './maxContent'
import { Shots } from './ShotViewer'
import { useV3 } from './V3Context'
import { Plate, TONES } from './V4'

/**
 * 기능 한 덩어리를 그리는 부분.
 *
 * 탭 안에서만 쓰던 것을 빼냈다. 업종별 화면이 각자 페이지가 되면서 탭 밖에서도
 * 같은 모양이 필요해졌기 때문이다. 그리는 규칙은 하나도 안 바꿨다 — 바꾸면
 * 쪼개기와 모양 변경이 한 커밋에 섞여서 무엇이 무엇을 깨뜨렸는지 못 가린다.
 */

export { mark, plain } from './text'
import { mark, plain } from './text'

export function FeatureBlock({ f, flip, tone = 0 }: { f: Feature; flip: boolean; tone?: number }) {
  // v3 꾸밈(SolutionShell look="v3") 안에서는 번호 원과 해시태그를 안 그린다 —
  // 번호는 순서가 아닌데 순서처럼 읽혔고(「구조는 정보다」), 칩은 눌리지도 않는
  // 장식이었다(블라인드 비평). 얕은 화면(가로가 세로의 2.5배 넘음)은 옆에 두면
  // 우표만 해지므로 글 밑에 폭 가득 깐다.
  const v3 = useV3()
  const one = f.shots?.length === 1 ? f.shots[0] : null
  const stack = v3 && one ? one.w / one.h > 2.5 : false
  const H = v3 ? 'h3' : 'h4'
  return (
    <article className={`mx_feat${flip ? ' mx_rev' : ''}${stack ? ' mx_stack' : ''}`}>
      <div className="mx_feat_txt" data-rv>
        <div className="mx_feat_no">{!v3 && <i>{f.no}</i>}{f.kicker}</div>
        {/* 제목의 핵심어 하나만 색으로(v3 — 바 사이트 flex 의 방식). 옛 꾸밈에서는 굵기가 같아 티가 안 난다. */}
        <H>{mark(f.title)}</H>
        <ul>
          {f.points.map((p) => <li key={p}>{mark(p)}</li>)}
        </ul>
        {/* 설명 한 줄, 결과 한 줄. 결과가 더 크고 굵다. */}
        {f.callout && (
          <div className="mx_callout">
            <p className="mx_callout_lead">{f.callout.lead}</p>
            <p className="mx_callout_res">{f.callout.result}</p>
          </div>
        )}
        {/* 시안대로 해시태그다. 흐름(→)은 위 설명 문장에만 둔다 —
            칩에까지 넣으면 줄이 접힐 때 화살표가 줄 끝에 혼자 남는다. */}
        {!v3 && (
          <div className="mx_chips">
            {f.chips.map((c) => <span className="mx_chip" key={c}>#{c}</span>)}
          </div>
        )}
      </div>
      {/* 오른쪽은 실제 제품 화면이다. 시안은 여기에 점선 자리표시를 뒀었다.
          캡처가 아직 없는 기능은 상자를 띄우지 않는다 — 빈 상자는 미완성으로 읽힌다. */}
      {f.shots && (
        <aside className="mx_feat_side" aria-label={`${plain(f.title)} 화면`} data-rv="shot">
          {/* v4: 판(움직이는 배경 + 브라우저 프레임)에 담는다. 화면 여럿이면 여는 창은 그대로. */}
          {v3 ? (
            <Plate tone={TONES[tone % TONES.length]} url={f.kicker}>
              <Shots shots={f.shots} label={plain(f.title)} />
            </Plate>
          ) : (
            <Shots shots={f.shots} label={plain(f.title)} />
          )}
        </aside>
      )}
    </article>
  )
}

