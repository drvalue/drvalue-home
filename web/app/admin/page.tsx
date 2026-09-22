'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { adminFetch, BOARDS } from '@/lib/admin'
import { ACTION_LABEL, boardLabel, COLLECTION_LABEL, DashboardSummary, when } from '@/lib/admin-extra'
import { useMe } from './ui/me'
import './dashboard.css'

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
    adminFetch<{ data: DashboardSummary }>('/api/admin/dashboard')
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

      <div className="dvd_grid">
        {me.role !== 'hr' && (
          <section className="dvd_card is-inquiry" aria-labelledby="dvd-inq">
            <h2 id="dvd-inq">새 문의</h2>
            <p className="dvd_big">
              {inq === null ? '—' : inq.new}
              <small>건</small>
            </p>
            <p className="dvd_sub">{inq && inq.mine_open > 0 ? `내가 맡아 아직 끝나지 않은 문의 ${inq.mine_open}건` : '접수 상태로 남은 문의입니다.'}</p>
            <div className="dvd_actions">
              <Link href="/admin/inquiries?status=new" className="dva_btn is-primary">
                새 문의 보기
              </Link>
              {inq && inq.mine_open > 0 ? (
                <Link href="/admin/inquiries?assignee=me" className="dva_btn">
                  내 담당 보기
                </Link>
              ) : null}
            </div>
          </section>
        )}

        <section className="dvd_card" aria-labelledby="dvd-draft">
          <h2 id="dvd-draft">초안</h2>
          {summary === null ? (
            counting
          ) : summary.drafts.length === 0 ? (
            <p className="dvd_sub">사이트에 올리지 않은 초안이 없습니다.</p>
          ) : (
            <ul className="dvd_list">
              {summary.drafts.map((d) => (
                <li key={d.board}>
                  <Link href={`/admin/posts/${d.board}?status=draft`}>
                    <span>{boardLabel(d.board)}</span>
                    <b>{d.count}건</b>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dvd_card" aria-labelledby="dvd-sched">
          <h2 id="dvd-sched">예약 게시</h2>
          {summary === null ? (
            counting
          ) : summary.scheduled.length === 0 ? (
            <p className="dvd_sub">예약해 둔 글이 없습니다.</p>
          ) : (
            <ul className="dvd_list">
              {summary.scheduled.map((d) => (
                <li key={d.board}>
                  <Link href={`/admin/posts/${d.board}?schedule=scheduled`}>
                    <span>{boardLabel(d.board)}</span>
                    <b>{d.count}건</b>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {quick.length > 0 && (
          <section className="dvd_card" aria-labelledby="dvd-quick">
            <h2 id="dvd-quick">바로 쓰기</h2>
            <div className="dvd_quick">
              {quick.map((b) => (
                <Link key={b.key} href={`/admin/posts/${b.key}/new`} className="dva_btn">
                  새 {b.label}
                </Link>
              ))}
              {me.role !== 'hr' && (
                <Link href="/admin/media" className="dva_btn">
                  파일 올리기
                </Link>
              )}
            </div>
          </section>
        )}

        {me.role === 'admin' && (
          <section className="dvd_card is-wide" aria-labelledby="dvd-recent">
            <h2 id="dvd-recent">최근 변경</h2>
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
            <div className="dvd_actions">
              <Link href="/admin/history" className="dva_btn">
                변경 이력 전체
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
