import type { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';

/**
 * 변경 이력 스냅샷 ↔ 엔티티. 순수 함수.
 *
 * 스냅샷은 글 화면이 돌려주는 모양(칸 + translations[] + files[])이고 칸 이름은 DB 이름이다.
 * 칸을 하나하나 적지 않고 엔티티 메타데이터로 맞춘다 — 새 칸이 생겨도(채용·예약·검색 정보 등)
 * 이 파일을 고치지 않아도 따라온다. 스냅샷에 없는 칸은 건드리지 않는다.
 */
export type Snap = Record<string, unknown>;

/** 엔티티 → 스냅샷(칸 이름 = DB 이름). 시각은 ISO 문자열. */
export function toSnap(cols: ColumnMetadata[], entity: object): Snap {
  const out: Snap = {};
  for (const c of cols) {
    if (c.relationMetadata) continue;
    const v: unknown = c.getEntityValue(entity);
    out[c.databaseName] = v instanceof Date ? v.toISOString() : (v ?? null);
  }
  return out;
}

/** 스냅샷 → 엔티티 속성. 스냅샷에 없는 칸과 `skip` 은 싣지 않는다. 시각 칸은 Date 로. */
export function fromSnap(
  cols: ColumnMetadata[],
  snap: Snap,
  skip: string[],
): Snap {
  const out: Snap = {};
  for (const c of cols) {
    if (c.relationMetadata || skip.includes(c.databaseName)) continue;
    if (!(c.databaseName in snap)) continue;
    let v = snap[c.databaseName];
    const t = String(c.type).toLowerCase();
    if (v != null && (t.includes('timestamp') || c.type === Date))
      v = new Date(String(v));
    out[c.propertyName] = v;
  }
  return out;
}

/**
 * 지금 모양을 되돌릴 스냅샷(ref)의 칸만 남긴다 — 글 화면이 만든 스냅샷과 칸이 같아야
 * 이력 비교(전·후)가 헛돌지 않는다.
 */
export function pickLike(current: Snap, ref: Snap): Snap {
  const keep = new Set([...Object.keys(ref), 'id', 'translations', 'files']);
  const picked: Snap = {};
  for (const k of Object.keys(current)) if (keep.has(k)) picked[k] = current[k];
  const refT = (ref.translations as Snap[] | undefined)?.[0];
  if (refT) {
    const tk = new Set(Object.keys(refT));
    picked.translations = ((current.translations as Snap[]) ?? []).map((t) =>
      Object.fromEntries(Object.entries(t).filter(([k]) => tk.has(k))),
    );
  }
  return picked;
}
