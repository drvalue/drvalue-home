"""IAM 로그인 다리가 쓸 계정 비밀번호를 맞춘다.

왜 필요한가
-----------
Directus Core 는 로컬 로그인 창을 끌 수 없다. 다리를 켜도 `/admin/login` 에서
이메일·비밀번호로 그냥 들어올 수 있다 — **IAM 은 문을 하나 더 만든 것이지
기존 문을 잠근 것이 아니다.**

사람이 아는 비밀번호를 없애는 것이 유일한 방법이다. 이 스크립트가 대상 계정의
비밀번호를 SECRET 에서 파생한 64자 16진수로 바꾼다. 다리는 로그인할 때 같은
값을 다시 계산한다. 어디에도 적혀 있지 않고, 사람이 칠 수도 없다.

    파생값 = HMAC-SHA256(SECRET, "iam-bridge:<directus 이메일 소문자>")

로그인 화면에 IAM 진입점도 만든다. Directus 는 라이선스가 있는 제공자만 SSO
버튼을 그려 주므로, 확장이 만든 `/iam-bridge/login` 으로 가는 길이 화면 어디에도
없다. `public_note` 가 마크다운 링크를 실제 `<a>` 로 렌더하는 것을 확인했고
(로그인 화면 하단), 거기에 링크를 넣는다.

되돌리려면 관리 화면에서 비밀번호를 다시 정하면 된다.

주의: 돌리고 나면 이 저장소의 다른 스크립트(스모크·프로비저닝)가 쓰는
`ADMIN_PASSWORD` 로는 더 이상 로그인되지 않는다. 운영에 올릴 때 마지막으로
돌리는 것을 전제로 한다.

실행: python3 scripts/iam_bridge_sync.py
"""

from __future__ import annotations

import hashlib
import hmac
import os
import sys

sys.path.insert(0, "scripts")
from directus import Directus  # noqa: E402


def derive(secret: str, email: str) -> str:
    return hmac.new(
        secret.encode(),
        f"iam-bridge:{email.strip().lower()}".encode(),
        hashlib.sha256,
    ).hexdigest()


def parse_accounts(raw: str) -> list[str]:
    """IAM_BRIDGE_ACCOUNTS 에서 Directus 쪽 이메일만 뽑는다."""
    out = []
    for entry in (raw or "").split(","):
        parts = [x.strip() for x in entry.split(":")]
        if len(parts) >= 2 and parts[0] and parts[1]:
            out.append(parts[1])
    return out


def target_accounts() -> list[str]:
    """매핑된 계정 + 기본 계정(IAM_BRIDGE_DEFAULT_ACCOUNT). 중복 제거, 순서 유지."""
    out = parse_accounts(os.environ.get("IAM_BRIDGE_ACCOUNTS", ""))
    default = (os.environ.get("IAM_BRIDGE_DEFAULT_ACCOUNT") or "").strip()
    if default:
        out.append(default)
    return list(dict.fromkeys(e.lower() for e in out))


def main() -> None:
    secret = os.environ.get("DIRECTUS_SECRET") or os.environ.get("SECRET") or ""
    accounts = target_accounts()
    if not secret:
        raise SystemExit("DIRECTUS_SECRET 이 필요하다 (.env 의 값과 같아야 한다)")
    if not accounts:
        raise SystemExit("IAM_BRIDGE_DEFAULT_ACCOUNT 도 IAM_BRIDGE_ACCOUNTS 도 비어 있다")

    d = Directus()
    d.login()

    made, failed = [], []
    for email in accounts:
        st, body = d.request(
            "GET", f"/users?limit=1&fields=id&filter[email][_eq]={email}"
        )
        rows = body.get("data") or []
        if st != 200 or not rows:
            failed.append(f"{email}: Directus 계정이 없다 (seat 3명 안에 미리 만들어 둬라)")
            continue
        st2, res = d.request(
            "PATCH", f"/users/{rows[0]['id']}", {"password": derive(secret, email)}
        )
        if st2 == 200:
            made.append(email)
        else:
            failed.append(f"{email}: HTTP {st2} {res}")

    # 로그인 화면 진입점. 없으면 사람이 다리를 쓸 방법이 없다.
    note = "사내 IAM 으로 로그인하려면 [여기](/iam-bridge/login)를 누르세요."
    st, body = d.request("GET", "/settings?fields=public_note")
    if st == 200 and (body.get("data") or {}).get("public_note") == note:
        pass
    else:
        st2, res = d.request("PATCH", "/settings", {"public_note": note})
        if st2 == 200:
            made.append("로그인 화면에 IAM 링크")
        else:
            failed.append(f"로그인 화면 링크: HTTP {st2} {res}")

    print(f"맞춘 계정 {len(made)}개, 실패 {len(failed)}개")
    for line in made:
        if "@" in line:
            print(f"  + {line} — 사람이 아는 비밀번호가 사라졌다")
        else:
            print(f"  + {line}")
    for line in failed:
        print(f"  ! {line}")
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
