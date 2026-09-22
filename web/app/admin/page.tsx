'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { adminFetch, BOARDS, Page } from '@/lib/admin'
import { ACTION_LABEL, boardLabel, COLLECTION_LABEL, RevisionRow, when } from '@/lib/admin-extra'
import { useMe } from './ui/me'
import './dashboard.css'

/** 새 글 바로 가기에 올리는 게시판. 자주 쓰는 순 — 다 올리면 고르는 데 오래 걸린다. */
const QUICK = ['notice', 'press', 'news', 'recruit']

/**
 * 첫 화면. 사이트의 목적은 문의를 받는 것이라 새 문의가 맨 위다.
 * 수는 기존 목록 API 의 total 로 센다(요약 전용 API 없음).
 */
export default function AdminHome() {
  const { me, newInquiries } = useMe()
  const [mine, setMine] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<{ key: string; label: string; n: number }[] | null>(null)
  const [recent, setRecent] = useState<RevisionRow[] | null>(null)
  const boards = BOARDS.filter((b) => me.boards.includes(b.key))

  useEffect(() => {
    if (me.role === 'hr') return
    adminFetch<Page<unknown>>('/api/admin/inquiries?assignee=me&status=in_progress')
      .then((r) => setMine(r.total))
      .catch(() => setMine(null))
  }, [me.role])

  useEffect(() => {
    Promise.all(
      boards.map((b) =>
        adminFetch<Page<unknown>>(`/api/admin/posts?board=${b.key}&status=draft`)
          .then((r) => ({ key: b.key, label: b.label, n: r.total }))
          .catch(() => ({ key: b.key, label: b.label, n: 0 })),
      ),
    ).then((xs) => setDrafts(xs.filter((x) => x.n > 0)))
    // boards 는 me.boards 에서 온다 — 그것이 바뀔 때만 다시 센다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.boards.join(',')])

  useEffect(() => {
    if (me.role !== 'admin') return
    adminFetch<Page<RevisionRow>>('/api/admin/revisions')
      .then((r) => setRecent(r.data.slice(0, 6)))
      .catch(() => setRecent(null))
  }, [me.role])

  const quick = boards.filter((b) => QUICK.includes(b.key))

  return (
    <div className="dvd">
      <div className="dva_head">
        <h1>홈</h1>
      </div>

      <div className="dvd_grid">
        {me.role !== 'hr' && (
          <section className="dvd_card is-inquiry" aria-labelledby="dvd-inq">
            <h2 id="dvd-inq">새 문의</h2>
            <p className="dvd_big">
              {newInquiries === null ? '—' : newInquiries}
              <small>건</small>
            </p>
            <p className="dvd_sub">{mine ? `내가 맡아 진행 중인 문의 ${mine}건` : '접수 상태로 남은 문의입니다.'}</p>
            <div className="dvd_actions">
              <Link href="/admin/inquiries?status=new" className="dva_btn is-primary">
                새 문의 보기
              </Link>
              {mine ? (
                <Link href="/admin/inquiries?assignee=me&status=in_progress" className="dva_btn">
                  내 담당 보기
                </Link>
              ) : null}
            </div>
          </section>
        )}

        <section className="dvd_card" aria-labelledby="dvd-draft">
          <h2 id="dvd-draft">초안</h2>
          {drafts === null ? (
            <p className="dvd_sub">세는 중…</p>
          ) : drafts.length === 0 ? (
            <p className="dvd_sub">사이트에 올리지 않은 초안이 없습니다.</p>
          ) : (
            <ul className="dvd_list">
              {drafts.map((d) => (
                <li key={d.key}>
                  <Link href={`/admin/posts/${d.key}?status=draft`}>
                    <span>{d.label}</span>
                    <b>{d.n}건</b>
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
            {recent === null ? (
              <p className="dvd_sub">불러오는 중…</p>
            ) : recent.length === 0 ? (
              <p className="dvd_sub">아직 바뀐 것이 없습니다.</p>
            ) : (
              <ul className="dvd_recent">
                {recent.map((r) => (
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
