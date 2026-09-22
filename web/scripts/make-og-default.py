#!/usr/bin/env python3
"""사이트 기본 공유 그림(1200×630) public/og/default.png 를 만든다.

글은 사이트에 이미 적힌 문장만 쓴다(layout.tsx 의 기본 설명). 한글 글꼴이 필요해서
macOS 의 AppleSDGothicNeo 를 쓴다 — 다른 기계에서는 FONT 를 한글 TTF/TTC 로 바꾼다.
그림을 바꾸면 이 스크립트를 다시 돌리고 PNG 를 커밋한다.

    python3 web/scripts/make-og-default.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'public', 'og', 'default.png')
LOGO = os.path.join(HERE, '..', 'public', 'brand', 'logo-drvalue-white.png')
FONT = '/System/Library/Fonts/AppleSDGothicNeo.ttc'
W, H = 1200, 630

img = Image.new('RGB', (W, H), '#141a24')
# 오른쪽 위로 번지는 슬레이트 빛 — 로그인 화면과 같은 결.
glow = Image.new('L', (W, H), 0)
gd = ImageDraw.Draw(glow)
for r in range(520, 0, -8):
    gd.ellipse((W - 260 - r, -220 - r, W - 260 + r, -220 + r), fill=int(90 * (1 - r / 520)))
img.paste(Image.new('RGB', (W, H), '#3d5a80'), (0, 0), glow)
d = ImageDraw.Draw(img)
d.rectangle((0, 0, 14, H), fill='#d71920')

logo = Image.open(LOGO).convert('RGBA')
lw = 300
logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
img.paste(logo, (88, 96), logo)

bold = ImageFont.truetype(FONT, 58, index=6)
mid = ImageFont.truetype(FONT, 30, index=2)
small = ImageFont.truetype(FONT, 26, index=2)
d.text((88, 270), '제조 현장의 언어를', font=bold, fill='#ffffff')
d.text((88, 346), '데이터로 통일합니다.', font=bold, fill='#ffffff')
d.text((88, 452), 'MES/ERP 구축 · 제조 AI 자동화 · LLM/RAG 기반 AI Chat', font=mid, fill='#c7d0dd')
d.text((88, 540), 'drvalue.co.kr', font=small, fill='#9aa5b3')

os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.save(OUT, optimize=True)
print(OUT, os.path.getsize(OUT), 'bytes')
