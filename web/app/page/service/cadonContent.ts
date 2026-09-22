/**
 * CADON(AutoCAD 안의 CutON 전개) 장의 자료.
 *
 * 화면은 web/public/screens/cuton-autocad-0{1,3,4}-*.jpg 와 cadon-02-unfold.jpg(원본 02 에서
 * 콘솔의 Windows 계정 경로 한 줄만 덮은 사본). 아래 숫자·문구는 전부 그 네 화면에 **찍혀 있는 값**을
 * 옮긴 것이다 — unistrut.STEP 한 부품을 열어 전개·시뮬레이션·되접기까지 간 한 번의 실행.
 * 여기서 값을 짓지 않는다. 그날 화면에 없는 수치(시간 절약, 고객 수)는 안 쓴다.
 *
 * 우리가 쓴 문장(사용자 확인 대상):
 *  - CD_STEPS 의 t(단계 이름)·sub(한 줄 설명). 1단계 cmd 「3D 미리보기」는 명령이 아니라 창 이름(다른 셋은 화면 명령줄 그대로)
 *  - CD_BEFORE 의 title · bubbles 셋 · points 셋
 *  - CD_AFTER 의 title · points 셋 (내용은 화면 값·프로토타입 문장에서, 문장은 우리 것)
 *  - CD_CASES 의 v(탭 이름)·d(탭 설명)
 *  - page.tsx 의 큰 문장 넷(시연·전후·검토·「AutoCAD 명령 셋으로 끝납니다」)과 그 밑 설명 넷,
 *    맺음 문구 둘(ctaTitle·ctaDesc), 명령 3열의 설명 셋, metadata.description
 *  - CadonDemo 의 캡션 「실제 실행 화면 · unistrut.STEP 한 부품」, CadonCases 의 「도면」 쪽지 라벨 셋
 *  히어로 제목·설명·CADON_LEAD 는 옛 장 문장 그대로(우리가 쓴 것 아님).
 */

/** 시연 네 단계 — 화면 한 장씩. facts 는 화면에 찍힌 값 그대로. */
export const CD_STEPS = [
  {
    t: 'STEP 을 열어 부품을 봅니다',
    sub: '3D 미리보기에서 돌려 보고 「이 파일로 전개」',
    cmd: '3D 미리보기',
    facts: ['unistrut.STEP', '42 × 250 × 22 mm · 엣지 132'],
    shot: { src: '/screens/cuton-autocad-01-3d-preview.jpg', alt: 'CutON 3D 미리보기 — unistrut.STEP, 42 × 250 × 22 mm, 엣지 132', w: 1600, h: 1347 },
  },
  {
    t: '전개하고 절단선·절곡선을 작도합니다',
    sub: 'AutoCAD 도면 위에 레이어로 바로 그려지고, DFM 경고가 함께 뜹니다',
    cmd: 'PEDAREINSERT',
    facts: ['PASS 1 · REVIEW 0 · 실패 0 · 3.5초', 'A1100 · t 2 · 절곡 6 · DFM 경고 4', '절단장 1,088.7 mm · 크기 114.5 × 250.0 mm'],
    shot: { src: '/screens/cadon-02-unfold.jpg', alt: 'CutON 전개 결과 — PASS 1, A1100 t2 절곡 6 DFM 경고 4, 절단장 1,088.7 mm', w: 1600, h: 993 },
  },
  {
    t: '절곡 순서를 단계별로 돌려 봅니다',
    sub: '스텝마다 각도·반경·V다이와 DFM 위반이 같이 보입니다',
    cmd: 'PEDABENDSIM',
    facts: ['절곡 6스텝 · 순서 #0 → #5 → #4 → #1 → #2 → #3', '스텝 1 — 절곡 #0 DOWN 86° · V다이 16mm · 펀치 88° R1.6', 'DFM 위반 · min_flange — 플랜지 연장 필요 ≥ 11.2 mm'],
    shot: { src: '/screens/cuton-autocad-03-bend-simulation.jpg', alt: 'CutON 절곡 시뮬레이션 — 절곡 6스텝, 스텝 1 절곡 #0 DOWN 86°, DFM 위반 min_flange', w: 1600, h: 880 },
  },
  {
    t: '전개를 다시 3D 로 되접어 확인합니다',
    sub: '패널·절곡 수와 접힌 외형이 맞는지 보고 STEP 으로 저장',
    cmd: 'PEDAREFOLD',
    facts: ['패널 7 · 절곡 6', '접힌 외형 41.4 × 250.0 × 23.2 mm', '#0 DOWN 86° R1.2 · #1 DOWN 90° R2 · … · #5 DOWN 86° R1.2'],
    shot: { src: '/screens/cuton-autocad-04-3d-refold.jpg', alt: 'CutON 3D 되접기 — 패널 7 절곡 6, 접힌 외형 41.4 × 250.0 × 23.2 mm', w: 1600, h: 873 },
  },
]

/** 전/후 — 왼쪽은 도면을 밖으로 보내 전개하던 방식(우리가 쓴 말), 오른쪽은 화면에서 확인되는 것. */
export const CD_BEFORE = {
  title: '전개 한 번에 도면이 밖으로 나갑니다',
  bubbles: [
    { who: 'me', t: 'unistrut 전개도 언제 오나요? 절곡 6개짜리인데' },
    { who: 'them', t: '외주 전개 서비스에 올려 뒀어요. 내일 오후요' },
    { who: 'me', t: '플랜지 짧은 데 있는 것 같은데, 그건 받아 봐야 아나요?' },
  ],
  points: ['STEP 을 외부 서비스에 올려야 전개가 된다', '전개도가 와야 절단선·절곡선을 다시 그린다', '만들 수 있는 형상인지는 받아 본 뒤에 안다'],
}
export const CD_AFTER = {
  title: 'AutoCAD 안에서 열고, 펴고, 되접습니다',
  points: [
    'STEP 을 열어 그 자리에서 전개 — 도면이 밖으로 나가지 않는다',
    '절단선·절곡선이 레이어로 자동 작도 · A1100 t 2 · 절곡 6',
    '「플랜지 길이 6.32mm 가 최소 성형 길이 8.00mm 미만」 — DFM 경고가 같이 뜬다',
  ],
}

/** 판정 카드 셋 — 전개 결과 · DFM 위반 · 되접기. 화면의 패널을 그대로 옮긴 값. badge 가 비면 배지 없음(되접기 패널엔 판정 배지가 없다). */
export const CD_CASES = [
  {
    k: 'pass', v: '전개 결과', d: 'PASS · REVIEW · 실패로 한 번에 판정. 절단장·크기·중량까지 같은 패널에.',
    card: { head: '전개 결과', file: 'unistrut', badge: 'PASS', chips: ['PASS 1', 'REVIEW 0', '실패 0', '3.5초'], line: 'A1100 · t 2 · 절곡 6 · DFM 경고 4', rows: ['절단장 1,088.7 mm', '크기 114.5 × 250.0 mm', '중량 130 g (ρ2.71)'] },
  },
  {
    k: 'dfm', v: 'DFM 위반', d: '스텝마다 어느 플랜지가 얼마나 짧은지 — 만들 수 없는 곳을 먼저 짚어 줍니다.',
    card: { head: '절곡 시뮬레이션', file: '(1)VESA LED BOX R-2 (1)-선택전개', badge: '검토 필요', chips: ['절곡 6스텝', '스텝 1 — 절곡 #0 ▼ DOWN 86°'], line: 'V다이 16mm · 펀치 88° R1.6', rows: ['min_flange — 플랜지 연장 필요 ≥ 11.2 mm (×4)', '직선 펀치·평판 프레스 근사 — 간섭은 검토 신호(과탐 가능)'] },
  },
  {
    k: 'fold', v: '3D 되접기', d: '전개도를 다시 접어 원래 형상과 맞는지 확인하고 STEP 으로 저장합니다.',
    card: { head: '3D 되접기', file: '(1)VESA LED BOX R-2 (1)-선택전개', badge: '', chips: ['패널 7', '절곡 6'], line: '접힌 외형 41.4 × 250.0 × 23.2 mm', rows: ['#0 DOWN 86° R1.2', '#1 DOWN 90° R2', '#2 DOWN 90° R2.5 · #3 DOWN 90° R2.5', '#4 DOWN 90° R2 · #5 DOWN 86° R1.2'] },
  },
]
