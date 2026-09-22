import ClientAction from '@/components/ClientAction'

/**
 * 홈 머리 그림.
 *
 * 글은 **원본 홈에 이미 있던 것**이다 — `index.php` 의 히어로가 주석으로
 * 꺼져 있었을 뿐 문구는 그대로 남아 있었다. 밑줄 문장은 바로 아래
 * 「검증된 제조 AI·DX 구축 역량」 칸의 첫 문장을 줄인 것이고, 숫자 셋도
 * 그 칸에서 세는 것과 같은 값이다. 여기서 새로 지어낸 말은 없다.
 *
 * 그림은 `/opt/main_bg_01.jpg` — 저장소에 이미 있는 것이다. 아래 장들이
 * 쓰는 `main_bg_03` 과 일부러 다른 것을 골랐다. 같은 그림이 머리마다
 * 반복되면 장이 바뀐 줄 모른다.
 */
export default function HomeHero() {
  return (
    <section className="dv_hero">
      <div className="dv_hero_bg" aria-hidden="true" />
      <div className="t_inner">
        <span className="dv_hero_kicker">MANUFACTURING AI · DX</span>
        <h2>
          <span>AI로 실현하는</span>
          <br />
          <span>
            <strong>지능형 제조의 미래</strong>
          </span>
        </h2>
        <p>
          MES/ERP 구축, 제조 AI 자동화, LLM·RAG 기반 AI Chat, 상담 솔루션. 실제 현장에서 사용하는
          시스템을 만듭니다.
        </p>
        <div className="dv_hero_btns">
          <a className="dv_hero_prim" href="/page/business/max">
            M.AX 살펴보기<i aria-hidden="true">→</i>
          </a>
          <ClientAction type="button" className="dv_hero_sec" calls={[{ fn: 'openContactModal' }]}>
            문의하기
          </ClientAction>
        </div>
        <div className="dv_hero_proof">
          <span>
            특허·출원 <b>6개</b>
          </span>
          <span>
            프로그램 저작권 <b>5개</b>
          </span>
          <span>
            수행·진행 실적 <b>9건</b>
          </span>
        </div>
      </div>
      <span className="dv_hero_cue" aria-hidden="true">
        <i />
        SCROLL
      </span>
    </section>
  )
}
