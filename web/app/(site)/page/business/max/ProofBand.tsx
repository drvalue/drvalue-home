/**
 * 「디알밸류가 받은 인증과 선정」 구역. 머리말 바로 밑, 본문 앞.
 *
 * 왜 있나: 블라인드 비평(design/DESIGN.md 「요즘 웹」 게이트)에서 세 바 사이트
 * (채널톡·업스테이지·flex)가 전부 머리말 밑에 「누가 쓰나」 띠를 두고 있었다.
 * 고객 로고와 도입 수치는 자료가 없어 못 넣는다 — **지어내지 않는다.** 대신
 * 실제로 있는 것 넷을 놓는다. 넷은 전부 회사소개 연혁(companyContent.ts HISTORY)
 * 에 있는 항목이다. 거기 없는 것은 여기 못 들어온다.
 *
 * 꾸밈: 2026-09-22 에는 남색 판 위 알약 머리말 · 큰 제목 · 아이콘 카드 넷(channel.io/kr/documents)이었다.
 * 2026-09-28 사용자가 그라데이션·겹 카드를 「AI 느낌」이라 해서 옅은 회색 한 줄 · 세로선으로 나눈 네 칸으로 바꿨다
 * (블라인드 비평 두 명이 이 띠를 첫째로 짚었다). 「100선」 은 data-count 로 세어 올라간다(app/home/HomeCountUp.tsx).
 */
const STAMPS: { n: React.ReactNode; count?: boolean; d: string }[] = [
  { n: <>ISO 9001<i>·</i>14001</>, d: '품질·환경경영시스템 국제 인증' },
  { n: '100선', count: true, d: '제조 AI 솔루션 100선 선정' },
  { n: 'AI·S 바우처', d: '공급기업 선정 · 재선정' },
  { n: 'ERICA MOU', d: '한양대학교 ERICA 스마트융합공학부 산학 협력' },
]

export default function ProofBand() {
  return (
    <section className="mx_proof" aria-label="인증과 선정">
      <div className="mx_wrap">
        <h2 className="mx_proof_h">디알밸류가 받은 인증과 선정</h2>
        <ul>
          {STAMPS.map((s) => (
            <li key={s.d}>
              <b {...(s.count ? { 'data-count': true } : {})}>{s.n}</b>
              <span>{s.d}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
