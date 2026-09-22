'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import ShotViewer from '../business/max/ShotViewer'

/** 증서 한 장. 그림과, 그림 밖에 적는 글(번호·날짜 등)은 각 장이 채운다. */
export type Cert = {
  src: string
  /** 그림의 실제 내용. 크게 보는 창의 제목으로도 쓴다. */
  alt: string
  w: number
  h: number
  /** 「크게 보기」 단추의 이름. 무엇을 크게 보는지가 이름에 들어간다. */
  open: string
  body: ReactNode
}

/**
 * 증서 카드 격자. 특허 장과 저작권 장이 같이 쓴다.
 *
 * 제품 화면은 기능마다 한 장만 보이지만 증서는 전부 건다 — 몇 건인지가
 * 곧 내용이다. 눌러서 크게 보는 창은 M.AX 장의 ShotViewer 를 그대로 쓴다
 * (열 때 닫기에 초점, Tab 가둠, Esc, 닫으면 열었던 자리로 복원). 예전의
 * jQuery 라이트박스는 초점을 옮기지 않아 키보드로는 닫기에 못 갔다.
 *
 * 그림만 단추에 넣는다 — 단추 안에 제목·표를 넣으면 그 글이 전부 단추
 * 이름으로 읽힌다. 스크립트가 없으면 단추는 아무 일도 못 하지만 글과
 * 그림은 다 보인다.
 */
export default function CertGrid({ certs }: { certs: readonly Cert[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const shots = certs.map((c) => ({ src: c.src, alt: c.alt, w: c.w, h: c.h }))

  return (
    <>
      <ul className="mx_navgrid cert_grid" data-rv>
        {certs.map((c, i) => (
          <li className="mx_navcard cert_card" key={c.src}>
            <button type="button" className="cert_open" onClick={() => setOpen(i)} aria-label={c.open}>
              <span className="cert_img">
                <img src={c.src} width={c.w} height={c.h} alt={c.alt} loading="lazy" decoding="async" />
              </span>
              <span className="cert_zoom" aria-hidden="true">
                <i className="fa fa-search-plus" /> 크게 보기
              </span>
            </button>
            {c.body}
          </li>
        ))}
      </ul>
      {open !== null && (
        <ShotViewer shots={shots} index={open} onClose={() => setOpen(null)} onMove={setOpen} />
      )}
    </>
  )
}
