/** @type {import('next').NextConfig} */
const nextConfig = {
  // 도커 이미지는 standalone 산출물(server.js + 필요한 node_modules 만)을 담는다.
  // 로컬 next dev·next start 에는 영향 없다. (옛 PHP 자산 심볼릭 링크는 회사 저장소로
  // 옮기며 실제 파일이 됐으므로 outputFileTracingRoot 를 위로 올릴 이유가 없어졌다.)
  output: 'standalone',

  // 디자이너가 설계한 주소를 지금 있는 페이지로 넘긴다. 주소를 바꾸는
  // 것이라 rewrite 가 아니라 redirect 다 — 주소창이 실제 페이지를 가리켜야
  // 나중에 그 주소가 사라질 때 무엇이 깨지는지 보인다.
  async redirects() {
    // `.ts` 가 아니라 `.mjs` 인 이유는 그 파일 주석에 적었다.
    const { DV_ROUTE_MAP } = await import('./lib/dvRoutes.mjs')
    const { PHP_REDIRECTS } = await import('./lib/phpRoutes.mjs')
    return [
      // 옛 `.php` 주소 → 확장자 없는 새 주소. 영구(308)다 — 되돌릴 계획이
      // 없고, 임시로 두면 검색엔진이 `.php` 를 계속 색인한다.
      ...PHP_REDIRECTS,
      ...DV_ROUTE_MAP.map(({ from, to, permanent }) => ({
        source: from,
        destination: to,
        // 기본은 임시(307)다. IA 가 아직 확정이 아니라서 308 을 주면
        // 색인이 굳어 버린다. 확정된 것만 그 파일에서 permanent 를 켠다.
        permanent: permanent === true,
      })),
    ]
  },

  // 브라우저는 /api 만 안다. 어느 주소의 Nest 인지는 서버만 안다.
  // 운영에서 Nest 를 다른 장비에 두면 API_ORIGIN 만 바꾸면 된다.
  // 미리보기로 올린 사본이 검색에 잡히면 진짜 사이트와 경쟁한다.
  // NOINDEX=1 일 때만 막는다 — 운영 배포에는 이 값을 넣지 않는다.
  async headers() {
    if (process.env.NOINDEX !== '1') return []
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },

  async rewrites() {
    const origin = process.env.API_ORIGIN || 'http://localhost:3500'
    return [
      { source: '/api/:path*', destination: `${origin}/api/:path*` },
    ]
  },
}
export default nextConfig
