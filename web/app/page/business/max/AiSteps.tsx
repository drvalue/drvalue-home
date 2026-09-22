'use client'

import { mark, plain } from './FeatureBlocks'
import { Shots } from './ShotViewer'
import type { AiFeature } from './maxContent'

/**
 * AI 기능 한 덩어리를 차례 목록으로 그린다.
 *
 * 탭으로 묶여 있을 때 쓰던 모양 그대로다. 기능이 각자 페이지로 나오면서 탭
 * 밖에서도 필요해졌다. 업종 쪽 FeatureBlock 과 달리 이쪽은 **순서가 뜻을
 * 가진다** — 문서가 들어와 값이 뽑히고 대조되어 들어가는 흐름이라 번호가
 * 장식이 아니다.
 */
export default function AiSteps({ a }: { a: AiFeature }) {
  return (
    <div className="mx_aipanel">
      <h3>{mark(a.title)}</h3>
      <ol className="mx_steps" data-rv>
        {a.steps.map((s, i) => (
          <li key={s}><i>{i + 1}</i>{mark(s)}</li>
        ))}
      </ol>
      {a.shots && <div data-rv="shot"><Shots shots={a.shots} label={plain(a.title)} /></div>}
    </div>
  )
}
