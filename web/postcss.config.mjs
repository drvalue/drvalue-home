/**
 * Tailwind 4 를 PostCSS 로 돌린다.
 *
 * 이 설정만으로는 기존 화면이 안 바뀐다 — 실제로 무엇을 불러올지는
 * `styles/tw.css` 가 정한다. 거기서 **전역 초기화(preflight)를 뺐다.**
 */
const config = { plugins: { '@tailwindcss/postcss': {} } }
export default config
