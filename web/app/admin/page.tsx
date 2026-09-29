'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { adminFetch, BOARDS } from '@/lib/admin'
import { ACTION_LABEL, boardLabel, COLLECTION_LABEL, DashboardSummary, when } from '@/lib/admin-extra'
import { useMe } from './ui/me'
import './dashboard.css'
import type { ApiResponse } from '@/lib/api-types.gen'

/** 새 글 바로 가기에 올리는 게시판. 자주 쓰는 순 — 다 올리면 고르는 데 오래 걸린다. */
const QUICK = ['notice', 'press', 'news', 'recruit']

/**
 * 첫 화면. 사이트의 목적은 문의를 받는 것이라 새 문의가 맨 위다.
 * 수는 홈 요약 API(`/api/admin/dashboard`) 한 번으로 받는다 — 범위가 못 보는 칸은 api 가 비워 준다.
 */
export default function AdminHome() {
  const { me } = useMe()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState('')
  const boards = BOARDS.filter((b) => me.boards.includes(b.key))

  useEffect(() => {
    adminFetch<ApiResponse<'GET /api/admin/dashboard'>>('/api/admin/dashboard')
      .then((r) => {
        setSummary(r.data)
        setError('')
      })
      .catch((e) => setError((e as Error).message))
    // 범위가 바뀌면(60초 재검) 보이는 칸이 달라진다.
  }, [me.role])

  const quick = boards.filter((b) => QUICK.includes(b.key))
  const inq = summary?.inquiries ?? null
  const counting = <p className="dvd_sub">세는 중…</p>
  const draftTotal = summary ? summary.drafts.reduce((n, d) => n + d.count, 0) : null
  const schedTotal = summary ? summary.scheduled.reduce((n, d) => n + d.count, 0) : null
  const seeInquiries = me.role !== 'hr'

  // 2026-09-29 사용자 「UI 가 제각각」: 높이·폭이 다른 카드 넷 + 끝까지 뻗은 한 장 → 같은 크기 숫자 칸 한 줄 + 아래 두 칸.
  // 숫자 칸은 전부 「이름 · 큰 수 · 한 줄 · 바로 가기」 같은 모양이다.
  const stat = (label: string, n: number | null, sub: string, href: string, go: string) => (
    <Link href={href} className="dvd_stat">
      <span className="dvd_stat_k">{label}</span>
      <b className="dvd_stat_n">
        {n === null ? '—' : n}
        <small>건</small>
      </b>
      <span className="dvd_stat_sub">{sub}</span>
      <span className="dvd_stat_go">{go} ›</span>
    </Link>
  )

  return (
    <div className="dvd">
      <div className="dva_head">
        <h1>홈</h1>
      </div>
      {error && (
        <div className="dva_error" role="alert">
          {error}
        </div>
      )}

      <section className="dvd_stats" aria-label="지금 할 일">
        {seeInquiries && stat('새 문의', inq ? inq.new : null, '접수 상태로 남은 문의', '/admin/inquiries?status=new', '새 문의 보기')}
        {seeInquiries && stat('내 담당', inq ? inq.mine_open : null, '내가 맡아 아직 끝나지 않은 문의', '/admin/inquiries?assignee=me', '내 담당 보기')}
        {stat('초안', draftTotal, '사이트에 올리지 않은 글', boards[0] ? `/admin/posts/${summary?.drafts[0]?.board ?? boards[0].key}?status=draft` : '/admin', '초안 보기')}
        {stat('예약 게시', schedTotal, '올라갈 날을 정해 둔 글', boards[0] ? `/admin/posts/${summary?.scheduled[0]?.board ?? boards[0].key}?schedule=scheduled` : '/admin', '예약 보기')}
      </section>

      <div className="dvd_cols">
        {me.role === 'admin' ? (
          <section className="dvd_card" aria-labelledby="dvd-recent">
            <div className="dvd_card_head">
              <h2 id="dvd-recent">최근 변경</h2>
              <Link href="/admin/history" className="dvd_more">
                변경 이력 전체 ›
              </Link>
            </div>
            {summary === null ? (
              <p className="dvd_sub">불러오는 중…</p>
            ) : !summary.recent || summary.recent.length === 0 ? (
              <p className="dvd_sub">아직 바뀐 것이 없습니다.</p>
            ) : (
              <ul className="dvd_recent">
                {summary.recent.map((r) => (
                  <li key={r.id}>
                    <span className={`dva_pill dvh_act is-${r.action}`}>{ACTION_LABEL[r.action] ?? r.action}</span>
                    <span className="dvd_what">
                      {r.collection === 'posts' ? `${boardLabel(r.board)} · ${r.label}` : `${COLLECTION_LABEL[r.collection] ?? r.collection} · ${r.label}`}
                    </span>
                    <span className="dvd_who">
                      {r.actor} · {when(r.created_on)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="dvd_card" aria-labelledby="dvd-boards">
            <div className="dvd_card_head">
              <h2 id="dvd-boards">게시판</h2>
            </div>
            <ul className="dvd_list">
              {boards.map((b) => (
                <li key={b.key}>
                  <Link href={`/admin/posts/${b.key}`}>
                    <span>{b.label}</span>
                    <b>목록 ›</b>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="dvd_side">
          <section className="dvd_card" aria-labelledby="dvd-pending">
            <div className="dvd_card_head">
              <h2 id="dvd-pending">게시판별 초안 · 예약</h2>
            </div>
            {summary === null ? (
              counting
            ) : summary.drafts.length === 0 && summary.scheduled.length === 0 ? (
              <p className="dvd_sub">남은 초안도, 예약해 둔 글도 없습니다.</p>
            ) : (
              <ul className="dvd_list">
                {summary.drafts.map((d) => (
                  <li key={`d-${d.board}`}>
                    <Link href={`/admin/posts/${d.board}?status=draft`}>
                      <span>{boardLabel(d.board)} · 초안</span>
                      <b>{d.count}건</b>
                    </Link>
                  </li>
                ))}
                {summary.scheduled.map((d) => (
                  <li key={`s-${d.board}`}>
                    <Link href={`/admin/posts/${d.board}?schedule=scheduled`}>
                      <span>{boardLabel(d.board)} · 예약</span>
                      <b>{d.count}건</b>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {quick.length > 0 && (
            <section className="dvd_card" aria-labelledby="dvd-quick">
              <div className="dvd_card_head">
                <h2 id="dvd-quick">바로 쓰기</h2>
              </div>
              <div className="dvd_quick">
                {quick.map((b) => (
                  <Link key={b.key} href={`/admin/posts/${b.key}/new`} className="dva_btn">
                    새 {b.label}
                  </Link>
                ))}
                {seeInquiries && (
                  <Link href="/admin/media" className="dva_btn">
                    파일 올리기
                  </Link>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
