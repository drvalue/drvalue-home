#!/usr/bin/env python3
"""api 모듈이 기준 모듈(admin-post)의 모양을 따르는가 — api/AGENTS.md 「코드 모양」의 표를 잰다.

    python3 api/scripts/check-pattern.py          # 표 + 문제 목록, 문제가 있으면 종료코드 1
    python3 api/scripts/check-pattern.py --table  # 표만(문제가 있어도 0)

재는 것(모듈마다):
  서비스   공개 메서드 중 @ServiceException · JSDoc 이 붙은 수 / 서비스 안 질의 조립(createQueryBuilder·
           DataSource·.query(·getRepository·@InjectRepository) 수
  컨트롤러 핸들러 중 @ApiOperation · 응답 문서(@ApiOkResponse 류 · @ApiData* ) 가 붙은 수 / @ApiTags 유무
  저장소   BaseRepository 를 상속한 파일 / 전체 저장소 파일
  전체     common/config/app-config.ts 밖의 process.env
"""
import glob
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src'))
CORE = os.path.join(ROOT, 'core')

HANDLER = re.compile(r'^\s*@(Get|Post|Put|Patch|Delete)\(')
RESP_DOC = re.compile(r'^\s*@(ApiOkResponse|ApiCreatedResponse|ApiResponse|ApiData\w*|ApiPage\w*|ApiOkFlag\w*|ApiProduces|ApiFound\w*)\(')
METHOD = re.compile(r'^  (?:async\s+)?([a-zA-Z_]\w*)\s*(?:<[^>]*>)?\(')
SKIP_NAMES = {'constructor', 'if', 'for', 'while', 'switch', 'return', 'catch'}
QUERY_IN_SERVICE = re.compile(r'createQueryBuilder|\bDataSource\b|\.query\(|getRepository\(|@InjectRepository|\bIn\(|\bBrackets\b')


def read(p):
    return open(p, encoding='utf-8').read()


def decorators_above(lines, i):
    """i 번째 줄(메서드 선언) 바로 위의 데코레이터·JSDoc 줄들."""
    out = []
    j = i - 1
    depth = 0
    while j >= 0:
        s = lines[j].strip()
        if s == '' and depth == 0:
            break
        out.append(lines[j])
        # 여러 줄 데코레이터(괄호) 안이면 계속 거슬러 올라간다
        depth += lines[j].count(')') - lines[j].count('(')
        if depth <= 0 and not (s.startswith('@') or s.startswith('*') or s.startswith('/**') or s.startswith('//')
                               or s.endswith(',') or s.endswith('{') or s.endswith('}),') or s.endswith('})') or s.startswith('}') or s.startswith(')') or depth < 0):
            out.pop()
            break
        j -= 1
    return '\n'.join(reversed(out))


def service_methods(path):
    src = read(path)
    lines = src.split('\n')
    res = []
    for i, line in enumerate(lines):
        m = METHOD.match(line)
        if not m or m.group(1) in SKIP_NAMES:
            continue
        name = m.group(1)
        if line.lstrip().startswith(('private', 'protected', 'get ', 'set ', 'static', 'readonly')):
            continue
        above = decorators_above(lines, i)
        # cron 입구는 서비스 API 가 아니다 — 문맥을 만들어 공개 메서드를 부르고 로그만 남긴다.
        # @ServiceException 을 겹치면 순서에 따라 @Cron 이 단 표시가 사라진다(틱이 조용히 멈춘다).
        if '@Cron(' in above:
            continue
        res.append((name, '@ServiceException' in above, '/**' in above))
    return res


def controller_handlers(path):
    lines = read(path).split('\n')
    res = []
    for i, line in enumerate(lines):
        if not HANDLER.match(line):
            continue
        # 핸들러 데코레이터 묶음: 이 줄부터 메서드 선언까지
        j = i
        block = []
        while j < len(lines) and not METHOD.match(lines[j]):
            block.append(lines[j])
            j += 1
        # 위로도 데코레이터가 있을 수 있다
        k = i - 1
        while k >= 0 and lines[k].strip().startswith('@'):
            block.insert(0, lines[k])
            k -= 1
        text = '\n'.join(block)
        name = METHOD.match(lines[j]).group(1) if j < len(lines) else '?'
        res.append((name, '@ApiOperation(' in text, bool(RESP_DOC.search('\n'.join(l for l in block if l.strip().startswith('@'))))
                    or any(RESP_DOC.match(l) for l in block)))
    return res


rows = []
problems = []
for mod in sorted(os.listdir(CORE)):
    d = os.path.join(CORE, mod)
    if not os.path.isdir(d):
        continue
    services = glob.glob(os.path.join(d, 'service', '*.ts'))
    services = [s for s in services if not s.endswith('.test.ts')]
    controllers = glob.glob(os.path.join(d, 'controller', '*.ts'))
    repos = glob.glob(os.path.join(d, 'repository', '*.ts'))

    sm = []
    q = 0
    for s in services:
        # 순수 함수 파일(클래스 없음)은 서비스 규칙 대상이 아니다
        src = read(s)
        if '@Injectable()' not in src:
            continue
        sm += [(os.path.basename(s),) + t for t in service_methods(s)]
        for i, line in enumerate(src.split('\n'), 1):
            if QUERY_IN_SERVICE.search(line) and not line.strip().startswith(('*', '//', 'import')):
                q += 1
                problems.append(f'{mod}: 서비스 안 질의 조립 {os.path.basename(s)}:{i}: {line.strip()[:90]}')
    ch = []
    tags = 0
    for c in controllers:
        src = read(c)
        tags += src.count('@ApiTags(')
        ch += [(os.path.basename(c),) + t for t in controller_handlers(c)]
        if '@ApiTags(' not in src:
            problems.append(f'{mod}: @ApiTags 없음 {os.path.basename(c)}')
    base = sum(1 for r in repos if 'extends BaseRepository' in read(r))
    for (f, n, se, jd) in sm:
        if not se:
            problems.append(f'{mod}: @ServiceException 없음 {f} {n}()')
        if not jd:
            problems.append(f'{mod}: JSDoc 없음 {f} {n}()')
    for (f, n, op, rd) in ch:
        if not op:
            problems.append(f'{mod}: @ApiOperation 없음 {f} {n}()')
        if not rd:
            problems.append(f'{mod}: 응답 문서 없음 {f} {n}()')
    for r in repos:
        if 'extends BaseRepository' not in read(r):
            problems.append(f'{mod}: BaseRepository 상속 아님 {os.path.basename(r)}')
    rows.append((mod,
                 f"{sum(1 for x in sm if x[2])}/{len(sm)}",
                 f"{sum(1 for x in sm if x[3])}/{len(sm)}",
                 q,
                 f"{sum(1 for x in ch if x[2])}/{len(ch)}",
                 f"{sum(1 for x in ch if x[3])}/{len(ch)}",
                 f"{base}/{len(repos)}"))

env = []
for p in glob.glob(os.path.join(ROOT, '**', '*.ts'), recursive=True):
    if p.endswith(os.path.join('config', 'app-config.ts')):
        continue
    for i, line in enumerate(read(p).split('\n'), 1):
        if 'process.env' in line and not line.strip().startswith(('*', '//')):
            env.append(f'{os.path.relpath(p, ROOT)}:{i}')
            problems.append(f'process.env 밖에서 읽음 {os.path.relpath(p, ROOT)}:{i}')

hdr = ('모듈', '@ServiceException', 'JSDoc', '서비스 질의', '@ApiOperation', '응답 문서', 'BaseRepository')
w = [max(len(str(r[k])) for r in rows + [hdr]) for k in range(len(hdr))]
print(' | '.join(h.ljust(w[k]) for k, h in enumerate(hdr)))
for r in rows:
    print(' | '.join(str(v).ljust(w[k]) for k, v in enumerate(r)))
print(f'process.env(app-config 밖): {len(env)}')
if '--table' in sys.argv:
    sys.exit(0)
for p in problems:
    print('  -', p)
print(f'문제 {len(problems)}개')
sys.exit(1 if problems else 0)
