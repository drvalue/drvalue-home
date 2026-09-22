/**
 * 「디알밸류가 받은 인증과 선정」 구역. 머리말 바로 밑, 본문 앞.
 *
 * 왜 있나: 블라인드 비평(design/DESIGN.md 「요즘 웹」 게이트)에서 세 바 사이트
 * (채널톡·업스테이지·flex)가 전부 머리말 밑에 「누가 쓰나」 띠를 두고 있었다.
 * 고객 로고와 도입 수치는 자료가 없어 못 넣는다 — **지어내지 않는다.** 대신
 * 실제로 있는 것 넷을 놓는다. 넷은 전부 회사소개 연혁(companyContent.ts HISTORY)
 * 에 있는 항목이다. 거기 없는 것은 여기 못 들어온다.
 *
 * 꾸밈(2026-09-22, 사용자가 channel.io/kr/documents 의 어두운 구역을 지목): 네 칸이 세로선으로
 * 나뉜 표가 아니라, 남색 판 위에 알약 머리말 · 큰 제목 · 아이콘 카드 넷. 카드는 차례로 떠오르고
 * (data-rv="pop"), 「100선」 은 data-count 로 0 에서 세어 올라간다(app/home/HomeCountUp.tsx).
 * 스크립트가 죽으면 전부 그냥 보인다.
 */
const ICON = {
  shield: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>,
  medal: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="14" r="5" /><path d="M8.5 9.5L6 3h4l2 4 2-4h4l-2.5 6.5" /></svg>,
  ticket: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8a2 2 0 002-2V5h14v1a2 2 0 002 2v3a2 2 0 00-2 2v1a2 2 0 002 2v3H5v-3a2 2 0 002-2v-1a2 2 0 00-2-2V8z" /><path d="M12 5v14" strokeDasharray="2 2" /></svg>,
  campus: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10l9-5 9 5-9 5-9-5z" /><path d="M6 12v5c2 2 10 2 12 0v-5" /><path d="M21 10v6" /></svg>,
}

const STAMPS: { icon: keyof typeof ICON; n: React.ReactNode; count?: boolean; d: string }[] = [
  { icon: 'shield', n: <>ISO 9001<i>·</i>14001</>, d: '품질·환경경영시스템 국제 인증' },
  { icon: 'medal', n: '100선', count: true, d: '제조 AI 솔루션 100선 선정' },
  { icon: 'ticket', n: 'AI·S 바우처', d: '공급기업 선정 · 재선정' },
  { icon: 'campus', n: 'ERICA MOU', d: '한양대학교 ERICA 스마트융합공학부 산학 협력' },
]

export default function ProofBand() {
  return (
    <section className="mx_proof" aria-label="인증과 선정">
      <i className="mx_blob mx_b1" aria-hidden="true" /><i className="mx_blob mx_b2" aria-hidden="true" />
      <div className="mx_wrap">
        <p className="mx_proof_pill">인증 · 선정</p>
        <h2 className="mx_proof_h" data-rv="pop" data-words>디알밸류가 받은 인증과 선정</h2>
        <ul data-rv="pop">
          {STAMPS.map((s) => (
            <li key={s.d}>
              <span className="mx_proof_ic">{ICON[s.icon]}</span>
              <b {...(s.count ? { 'data-count': true } : {})}>{s.n}</b>
              <span>{s.d}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
