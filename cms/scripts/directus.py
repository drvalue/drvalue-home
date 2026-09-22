"""Directus REST 래퍼.

스키마를 손으로 클릭해 만들면 재현이 안 된다. 코드로 만들고 여러 번 돌려도
같은 결과가 나오게 한다(이미 있으면 건너뛴다).
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request

BASE = os.environ.get("DIRECTUS_BASE", "http://localhost:3350")
EMAIL = os.environ.get("ADMIN_EMAIL", "admin@drvalue.co.kr")
PASSWORD = os.environ.get("ADMIN_PASSWORD", "drvalue1234!")


class Directus:
    def __init__(self, base: str = BASE) -> None:
        self.base = base.rstrip("/")
        self.token: str | None = None

    # ------------------------------------------------------------------
    def request(
        self, method: str, path: str, body: dict | list | None = None, auth: bool = True
    ) -> tuple[int, dict]:
        # 필터 값에 한글이 들어오면 urllib 이 'ascii' codec can't encode 로 죽는다.
        # ASCII 구조 문자는 그대로 두고 그 밖의 문자만 퍼센트 인코딩한다.
        url = f"{self.base}{urllib.parse.quote(path, safe='/?&=[]:,-_.~@+*$!()')}"
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Content-Type", "application/json")
        if auth and self.token:
            req.add_header("Authorization", f"Bearer {self.token}")
        try:
            with urllib.request.urlopen(req, timeout=90) as res:
                raw = res.read()
                return res.status, (json.loads(raw) if raw else {})
        except urllib.error.HTTPError as err:
            raw = err.read()
            try:
                return err.code, json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return err.code, {"raw": raw.decode("utf-8", "replace")[:300]}

    def login(self) -> None:
        status, body = self.request(
            "POST", "/auth/login", {"email": EMAIL, "password": PASSWORD}, auth=False
        )
        if status != 200:
            raise SystemExit(f"로그인 실패 HTTP {status}: {body}")
        self.token = body["data"]["access_token"]

    # ------------------------------------------------------------------
    def user_collections(self) -> set[str]:
        """사용자가 만든 컬렉션 이름. directus_* 시스템 테이블은 뺀다.

        없는 컬렉션을 GET 하면 Directus 는 404 가 아니라 403 을 준다.
        개별 조회로 존재를 판정하면 권한 문제와 구분이 안 되므로 목록으로 본다.
        """
        _, body = self.request("GET", "/collections")
        return {
            c["collection"]
            for c in body.get("data", [])
            if not c["collection"].startswith("directus_")
        }

    def fields_of(self, collection: str) -> set[str]:
        status, body = self.request("GET", f"/fields/{collection}")
        if status != 200:
            return set()
        return {f["field"] for f in body.get("data", [])}

    def relations_of(self) -> set[tuple[str, str]]:
        _, body = self.request("GET", "/relations")
        return {(r["collection"], r["field"]) for r in body.get("data", [])}
