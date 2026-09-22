#!/usr/bin/env python3
"""사용자에게 보이는 문구가 합니다체인가.

api 가 화면으로 보내는 말(에러 코드의 message, DTO 검증 message, 되돌리기 경고)과
관리 화면(web/app/admin, web/lib/admin*)의 문자열·JSX 글에서 「~다」로 끝나는 반말 문장을 찾는다.
주석은 보지 않는다 — 문서와 주석은 한다체가 규칙이다.

    python3 web/scripts/check-copy.py      # 저장소 어디서 돌려도 된다

api 쪽 message 는 마침표까지 요구한다(「…습니다.」 「…주세요.」).
"""
import glob
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

# 합니다체·해요체로 끝나면 통과. 명사형 꼬리표(「저장됨」 「비어 있음」)는 문장이 아니라 본다.
POLITE_END = re.compile(r'(니다|세요|까요|어요|아요|해요|예요|이에요|네요|죠)[.?!]$')
# 「…다.」「…다?」, 또는 따옴표·태그·줄 끝·줄표 앞의 「…다」 = 반말 문장 끝. 「니다」는 뺀다.
# 「끌어다 놓거나」처럼 문장 안의 「다」는 잡지 않는다.
PLAIN = re.compile(r'[가-힣](?<!니)다(?:[.?!]|(?=\s*(?:[\'"`<}]|$|[—–])))')


def strip_comments(src: str) -> str:
    """주석을 같은 길이의 공백으로 — 줄 번호를 지킨다."""
    blank = lambda m: re.sub(r'[^\n]', ' ', m.group(0))
    src = re.sub(r'\{/\*[\s\S]*?\*/\}', blank, src)
    src = re.sub(r'/\*[\s\S]*?\*/', blank, src)
    return re.sub(r'(?<![:\'"`])//[^\n]*', blank, src)


def line_of(src: str, pos: int) -> int:
    return src.count('\n', 0, pos) + 1


def rel(path: str) -> str:
    return os.path.relpath(path, ROOT)


problems: list[str] = []
checked = 0

# 1) api → 화면: 에러 코드 message · DTO 검증 message · 되돌리기 경고
API_MESSAGE = re.compile(r"message:\s*(['`])((?:\\.|(?!\1).)*)\1", re.S)
API_WARN = re.compile(r"warnings\.push\(\s*(['`])((?:\\.|(?!\1).)*)\1", re.S)
for path in sorted(glob.glob(os.path.join(ROOT, 'api/src/**/*.ts'), recursive=True)):
    is_error = path.endswith('.error.ts')
    is_dto = '/dto/' in path
    src = strip_comments(open(path, encoding='utf-8').read())
    patterns = []
    if is_error or is_dto:
        patterns.append(API_MESSAGE)
    patterns.append(API_WARN)
    for pat in patterns:
        for m in pat.finditer(src):
            text = m.group(2).strip()
            if not re.search('[가-힣]', text):
                if is_error:
                    problems.append(f'{rel(path)}:{line_of(src, m.start())}: 한국어가 아니다 — {text[:60]}')
                continue
            checked += 1
            if not POLITE_END.search(text):
                problems.append(f'{rel(path)}:{line_of(src, m.start())}: 합니다체+마침표가 아니다 — {text[:80]}')

# 2) 관리 화면: 문자열과 JSX 글
ADMIN = (
    glob.glob(os.path.join(ROOT, 'web/app/admin/**/*.tsx'), recursive=True)
    + glob.glob(os.path.join(ROOT, 'web/app/admin/**/*.ts'), recursive=True)
    + glob.glob(os.path.join(ROOT, 'web/lib/admin*.ts'))
)
for path in sorted(ADMIN):
    src = strip_comments(open(path, encoding='utf-8').read())
    for i, line in enumerate(src.split('\n'), 1):
        if 'console.' in line or not re.search('[가-힣]', line):
            continue
        checked += 1
        for m in PLAIN.finditer(line):
            problems.append(f'{rel(path)}:{i}: 반말 — {line.strip()[:100]}')
            break

for p in problems:
    print(p)
print(f'문구 {checked}곳 확인, 문제 {len(problems)}개')
sys.exit(1 if problems else 0)
