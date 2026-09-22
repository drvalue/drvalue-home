"""검증용 가짜 게이트웨이 + 가짜 IAM.

진짜 route.drvalue.co.kr 은 사내망이고 자격증명이 필요하다. 그것을 기다리면
이 코드는 배포 직전까지 한 번도 안 돌아 본 채로 남는다. 그래서 업스트림이
주고받는 모양만 똑같이 흉내 내는 서버를 세운다.

**받은 요청을 전부 기록한다.** 검증이 보려는 것은 "응답이 왔나" 가 아니라
"우리가 무엇을 보냈나" 다 — type 과 showYn 을 서버가 강제하는지,
thumbnailImage 를 빼고 보내는지는 요청을 봐야 알 수 있다.

실행: python3 fake_gateway.py <port>
"""

from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

SERVICE_TOKEN = "service-token-aaa"
APP_TOKEN = "app-token-bbb"
TENANT_TOKEN = "tenant-token-ccc"
IAM_TOKEN = "iam-token-ddd"

# 마지막으로 받은 요청들. 검사 쪽에서 GET /_log 로 읽는다.
LOG: list[dict] = []

# 항목과 봉투 모양은 운영(drvalue.co.kr)의 공개 게시판 API 를 실제로 불러
# 확인한 것이다. 추측한 모양으로 검증하면 "우리끼리만 맞는" 검사가 된다.
#   봉투: {"data": [...], "total": n, "take": n, "skip": n}
def _post(pid, title, show):
    return {
        "id": pid, "type": "NOTICE", "title": title, "content": "본문",
        "showYn": show, "isPinned": False,
        "writer": "관리자", "thumbnailImage": None, "attachmentFiles": [],
        "startDate": None, "endDate": None,
        "createdAt": "2026-06-18T04:48:12.794Z",
        "updatedAt": "2026-06-18T04:48:12.794Z",
    }


POSTS = {
    "open-1": _post("open-1", "공개 글", True),
    "hidden-1": _post("hidden-1", "비공개 글", False),
}

# by-root 를 거부할지. 권한 없는 사람이 로그인할 때를 흉내 낸다.
DENY_TENANT = False


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):  # 조용히
        pass

    def _send(self, code: int, body: dict | list):
        raw = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _record(self, method: str):
        u = urlparse(self.path)
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b""
        try:
            body = json.loads(raw) if raw else None
        except Exception:
            body = raw.decode("utf-8", "replace")
        entry = {
            "method": method,
            "path": u.path,
            "query": {k: v[0] for k, v in parse_qs(u.query).items()},
            "auth": self.headers.get("Authorization", ""),
            "tenant": self.headers.get("X-Tenant-Code", ""),
            "body": body,
        }
        LOG.append(entry)
        return entry

    # 업스트림은 전송 코드를 늘 200 으로 주고 본문 status 로 결과를 알린다.
    def _env(self, status: int, data=None, message=None):
        out: dict = {"status": status}
        if data is not None:
            out["data"] = data
        if message is not None:
            out["message"] = message
        self._send(200, out)

    def do_GET(self):
        e = self._record("GET")
        p = e["path"]
        if p == "/_log":
            return self._send(200, LOG)
        if p == "/_reset":
            LOG.clear()
            return self._send(200, {"ok": True})
        if p == "/auth/login":
            # 가짜 IAM 로그인 화면. 코드 하나 붙여서 콜백으로 돌려보낸다.
            back = e["query"].get("redirect_url", "/")
            sep = "&" if "?" in back else "?"
            self.send_response(302)
            self.send_header("Location", f"{back}{sep}code=test-code")
            self.end_headers()
            return
        if p.startswith("/baseinfo/v1/default-notify/one/"):
            if e["auth"] != f"Bearer {SERVICE_TOKEN}":
                return self._env(401)
            pid = p.rsplit("/", 1)[-1]
            row = POSTS.get(pid)
            return self._env(200, row) if row else self._env(404)
        if p in ("/baseinfo/v1/default-notify/many", "/baseinfo/v1/default-notify/search"):
            if e["auth"] != f"Bearer {SERVICE_TOKEN}":
                return self._env(401)
            # 화면(_board.php)이 기대하는 모양이다: data.data 가 목록,
            # data.total 이 전체 건수. 여기가 틀리면 화면은 "등록된 게시글이
            # 없습니다" 만 띄우고 아무도 이유를 모른다.
            rows = [r for r in POSTS.values() if r["showYn"]]
            q = e["query"]
            take = int(q.get("take", 10))
            skip = int(q.get("skip", 0))
            return self._env(200, {
                "data": rows[skip:skip + take], "total": len(rows),
                "take": take, "skip": skip,
            })
        return self._send(404, {"error": "no route"})

    def do_POST(self):
        global DENY_TENANT
        e = self._record("POST")
        p, b = e["path"], e["body"] or {}
        if p == "/auth/v1/login/root/basic":
            if b.get("userId") == "svc" and b.get("password") == "svc-pw":
                return self._env(200, {"accessToken": SERVICE_TOKEN})
            return self._env(401)
        if p == "/auth/token/exchange":
            # IAM 직접 호출이라 봉투가 없다. access_token 을 바로 준다.
            if b.get("code") == "test-code":
                return self._send(200, {"access_token": IAM_TOKEN})
            return self._send(400, {"error": "bad code"})
        if p == "/auth/v1/login/root/iam":
            if e["auth"] == f"Bearer {IAM_TOKEN}":
                return self._env(200, {"accessToken": APP_TOKEN})
            return self._env(401)
        if p == "/auth/v1/login/tenant/by-root":
            if DENY_TENANT:
                return self._env(403, message="no permission")
            if e["auth"] == f"Bearer {APP_TOKEN}":
                return self._env(200, {"accessToken": TENANT_TOKEN})
            return self._env(401)
        if p in ("/baseinfo/v1/default-notify/create", "/baseinfo/v1/default-notify/update"):
            if e["auth"] != f"Bearer {APP_TOKEN}":
                return self._env(401)
            if not b.get("title"):
                return self._env(400, message="title required")
            return self._env(200, {"id": b.get("id", "new-1")})
        if p == "/_deny_tenant":
            DENY_TENANT = bool(b.get("on"))
            return self._send(200, {"ok": True, "deny": DENY_TENANT})
        return self._send(404, {"error": "no route"})

    def do_DELETE(self):
        e = self._record("DELETE")
        if e["path"].startswith("/baseinfo/v1/default-notify/delete/"):
            if e["auth"] != f"Bearer {APP_TOKEN}":
                return self._env(401)
            return self._env(200, {"ok": True})
        return self._send(404, {"error": "no route"})


if __name__ == "__main__":
    HTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
