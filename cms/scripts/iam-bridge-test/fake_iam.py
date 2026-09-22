"""사내 IAM 과 게이트웨이 흉내.

verify-iam-bridge.sh 가 띄운다. 운영 IAM 자격증명 없이도 확장의 4단계를
끝까지 통과시켜 보기 위한 것이다. 운영에는 쓰지 않는다.

code 값으로 시나리오를 고른다.
  ok        정상 — 4단계 전부 통과
  denied    테넌트 인가 거부 (4단계에서 403)
  unmapped  IAM 은 통과하지만 Directus 계정에 매핑이 없는 사람
"""
import base64, json, re
from http.server import BaseHTTPRequestHandler, HTTPServer

def b64(o):
    return base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip("=")

def jwt(email):
    return f"{b64({'alg':'none'})}.{b64({'email':email,'sub':'u-1'})}.x"

# 시나리오 제어: code 값으로 분기한다.
#   ok        정상
#   denied    테넌트 인가 거부(4단계 실패)
#   unmapped  매핑 안 된 사람
class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _read(self):
        n = int(self.headers.get('Content-Length') or 0)
        try: return json.loads(self.rfile.read(n) or b'{}')
        except Exception: return {}

    def _send(self, status, obj):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        p = self.path.split('?')[0]
        body = self._read()
        auth = self.headers.get('Authorization', '')
        if p == '/auth/token/exchange':
            code = body.get('code', '')
            email = {'ok': 'dev@drvalue.co.kr',
                     'denied': 'dev@drvalue.co.kr',
                     'unmapped': 'stranger@elsewhere.kr'}.get(code)
            if email is None:
                return self._send(400, {'error': 'bad code'})
            return self._send(200, {'access_token': jwt(email) + '#' + code})
        if p == '/auth/v1/login/root/iam':
            if not auth.startswith('Bearer '):
                return self._send(401, {'errors': [{'message': 'no bearer'}]})
            return self._send(200, {'data': {'accessToken': 'app-' + auth.split('#')[-1]}})
        if p == '/auth/v1/login/tenant/by-root':
            if self.headers.get('X-Tenant-Code') != 'drvalue':
                return self._send(403, {'errors': [{'message': 'bad tenant'}]})
            if auth.endswith('denied'):
                return self._send(403, {'errors': [{'message': 'no root'}]})
            return self._send(200, {'data': {'accessToken': 'tenant-token'}})
        return self._send(404, {'error': 'nope'})

    def do_GET(self):
        if self.path.startswith('/auth/me'):
            return self._send(200, {'email': 'dev@drvalue.co.kr'})
        if self.path.startswith('/auth/login'):
            return self._send(200, {'ok': True})
        return self._send(404, {'error': 'nope'})

HTTPServer(('0.0.0.0', 3360), H).serve_forever()
