#!/usr/bin/env python3
"""web 의 생성 형이 api 와 맞나 — 낡으면 실패한다.

web 은 api 의 응답·요청·페이지 글 모양을 손으로 옮겨 적지 않고 생성한다:

    api/openapi.json · api/page-schemas.json   ← api/scripts/openapi.js (빌드한 api 에서, 서버·DB 없이)
    web/lib/api-types.gen.ts · page-types.gen.ts ← web/scripts/gen-types.mjs

이 검사는 api 를 빌드하고 네 파일을 임시 폴더에 새로 만든 뒤, 저장소에 있는 것과 한 글자라도 다르면
어느 파일이 낡았는지 적고 종료코드 1 로 끝난다. 고치는 법(맨 아래 출력과 같다):

    (cd api && npm run build && node scripts/openapi.js) && (cd web && node scripts/gen-types.mjs)

    python3 web/scripts/check-types.py              # api 를 빌드하고 본다
    python3 web/scripts/check-types.py --no-build   # 방금 빌드했으면(dist 가 최신일 때만)
"""
import filecmp
import os
import subprocess
import sys
import tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
API = os.path.join(ROOT, 'api')
WEB = os.path.join(ROOT, 'web')

FILES = [
    (os.path.join(API, 'openapi.json'), 'api'),
    (os.path.join(API, 'page-schemas.json'), 'api'),
    (os.path.join(WEB, 'lib', 'api-types.gen.ts'), 'web'),
    (os.path.join(WEB, 'lib', 'page-types.gen.ts'), 'web'),
]
FIX = '(cd api && npm run build && node scripts/openapi.js) && (cd web && node scripts/gen-types.mjs)'


def run(cmd, cwd):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stdout.write(r.stdout[-2000:] + r.stderr[-2000:])
        print(f'실패: {" ".join(cmd)} (cwd={os.path.relpath(cwd, ROOT)})')
        sys.exit(2)
    return r.stdout


def main():
    if '--no-build' not in sys.argv:
        run(['npm', 'run', '-s', 'build'], API)
    with tempfile.TemporaryDirectory() as tmp:
        api_tmp = os.path.join(tmp, 'api')
        web_tmp = os.path.join(tmp, 'web')
        os.makedirs(api_tmp)
        run(['node', 'scripts/openapi.js', api_tmp], API)
        run(['node', 'scripts/gen-types.mjs', web_tmp, api_tmp], WEB)
        stale = []
        for path, side in FILES:
            fresh = os.path.join(api_tmp if side == 'api' else web_tmp, os.path.basename(path))
            ok = os.path.exists(path) and filecmp.cmp(path, fresh, shallow=False)
            print(f'  {"PASS" if ok else "FAIL"}  {os.path.relpath(path, ROOT)}')
            if not ok:
                stale.append(path)
    print(f'생성 형 {len(FILES)}개 확인, 낡은 것 {len(stale)}개')
    if stale:
        print(f'다시 만들기: {FIX}')
        sys.exit(1)


if __name__ == '__main__':
    main()
