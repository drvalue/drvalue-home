'use client'

/**
 * PHP 쪽 <img onerror="this.src=..."> 를 옮긴 것. JSX 는 문자열 핸들러를
 * 못 받아서 이 한 조각만 클라이언트 컴포넌트로 뺀다. 마크업은 같다.
 */
export default function FallbackImage(
  props: React.ImgHTMLAttributes<HTMLImageElement> & { fallback: string },
) {
  const { fallback, ...rest } = props
  return (
    <img
      {...rest}
      onError={(e) => {
        const el = e.currentTarget
        if (el.src !== fallback) el.src = fallback
      }}
    />
  )
}
