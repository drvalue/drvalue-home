"""PHP 원본과 Next 이관본을 같은 자에 대고 잰다.

"똑같아 보인다" 는 증거가 아니다. 눈으로 보는 것은 화면에 그려진 결과이고,
어긋나는 것은 대개 마크업 한 글자다 — class 하나가 빠지면 CSS 가 안 붙고,
그 CSS 가 반응형에만 쓰이면 데스크톱 스크린샷으로는 안 보인다.

세 가지를 따로 잰다. 하나로 합치면 어디가 틀렸는지 알 수 없다.
  1. 뼈대   태그 이름만 남긴 순서열
  2. class  화면을 결정하는 것은 사실상 이것이다
  3. 속성   src·href·alt·id 등 눈에 안 보이는 것

React 가 어쩔 수 없이 바꾸는 것은 미리 정규화한다. 그걸 차이로 세면
진짜 차이가 잡음에 묻힌다.

실행: python3 scripts/compare.py /page/company/intro.php
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.request
from html.parser import HTMLParser

# 원본은 보통 로컬 도커(:3300)다. 도커가 안 뜨는 날에는 운영 사이트를
# 그대로 원본으로 쓸 수 있다 — 같은 코드가 도는 곳이다. 읽기만 한다.
#   PHP_ORIGIN=https://drvalue.co.kr bash scripts/compare-all.sh
PHP = os.environ.get("PHP_ORIGIN", "http://localhost:3300").rstrip("/")
NEXT = os.environ.get("NEXT_ORIGIN", "http://localhost:3400").rstrip("/")

# 파이썬 3.9 의 urllib 은 308 을 안 따라간다(3.11 에서 들어왔다). `.php` 주소가
# 확장자 없는 주소로 308 넘어가므로, 그냥 두면 대조가 통째로 예외로 죽는다.
# 301 과 똑같이 다루면 된다 — 방식이 유지되는 것만 다르고 목적지는 같다.
class _Follow308(urllib.request.HTTPRedirectHandler):
    # http_error_308 을 301 에 붙이는 것만으로는 안 된다. redirect_request 가
    # 코드 목록을 따로 들고 있어서 308 이면 그대로 예외를 던진다. 번호만
    # 301 로 바꿔 넘긴다 — 다루는 방식은 같다.
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return super().redirect_request(
            req, fp, 301 if code == 308 else code, msg, headers, newurl
        )

    def http_error_308(self, req, fp, code, msg, headers):
        return self.http_error_301(req, fp, code, msg, headers)


_OPENER = urllib.request.build_opener(_Follow308())

# Next 에만 있는 메뉴 항목. PHP 원본 header.php 에는 있을 수가 없다 — 새로
# 만든 페이지라서다. 이관이 한 날짜에 통째로 넘어가므로 PHP 쪽에 넣을 일도
# 없다. 이걸 안 빼면 옮긴 페이지 전부가 헤더 한 줄 때문에 "다름" 이 된다.
# 화면 주소의 `.php`. 쿼리·조각 앞까지만 떼어낸다 — `notice_api.php` 처럼
# Nest 로 가는 주소는 링크로 안 쓰이므로 여기 걸릴 일이 없다.
PHP_EXT = re.compile(r"^(/[^?#]*)\.php([?#].*)?$")


def _sub_ext(m: "re.Match[str]") -> str:
    return m.group(1) + (m.group(2) or "")


# Next 쪽이 쓰는 줄인 그림 → 원본. 보이는 그림이 같은 것만 여기 넣는다.
SAME_IMAGE = {
    "/opt/deshboard_pc.jpg": "/img/deshboard_pc.jpg",
    "/opt/growtok.jpg": "/img/growtok.jpg",
    "/opt/lazer.jpg": "/img/lazer.jpg",
    # /opt/logo.png 짝은 뺐다. 헤더가 `brand/logo-drvalue-red.png` 로 바뀌었고
    # 헤더는 위 REDESIGNED 로 통째로 떼기 때문에 여기서 짝지을 것이 없다.
    # 푸터·JSON-LD 가 쓰는 자리는 그대로 /opt/logo.png 다.
    "/opt/main_bg_01.jpg": "/img/main_bg_01.jpg",
    "/opt/main_bg_02.jpg": "/img/main_bg_02.jpg",
    "/opt/main_bg_03.jpg": "/img/main_bg_03.jpg",
    "/opt/main_bg_04.jpg": "/img/main_bg_04.jpg",
}

# 주소로 <li> 를 찾아 떼던 목록. **지금은 비어 있다.**
#
# 원래는 헤더 메뉴의 M.AX 항목을 떼려고 있었는데, 그 뒤 헤더 전체가 아래
# REDESIGNED 로 먼저 떨어지게 되면서 할 일이 없어졌다. 그런데 남아 있는
# 동안 실제로 사고를 냈다: 규칙이 "<li> 로 시작해서 그 주소가 나오고 </li>
# 로 끝나는 덩어리" 를 찾는데, **본문 어디에든** 그 주소가 있으면 한참
# 앞의 <li> 부터 한참 뒤의 </li> 까지 통째로 먹는다. 홈에 M.AX 로 가는
# 단추를 둘 더 놓았더니 45,000자가 사라졌고 그 안에 </head> 가 있었다 —
# 그 뒤로 대조기가 본문을 통째로 <head> 로 세서 홈 검사 3개가 깨졌다.
#
# 다시 채울 일이 생기면 주소만 보지 말고 **메뉴 안이라는 것까지** 확인해라.
NEXT_ONLY_MENU: list[tuple[str, str]] = []

# 검색엔진용으로 새로 넣은 것. 원본 PHP 에는 없다(운영본을 받아서 확인했다 —
# 17장이 전부 같은 제목이었고 설명문·공유카드·대표주소가 하나도 없었다).
# 이것을 차이로 세면 모든 페이지가 뒤집힌다. 무엇을 새로 넣었는지는 아래에
# 목록으로 남긴다 — 검사를 끈 게 아니라 "고의" 라고 적어 두는 것이다.
SEO_META_NAME = {"description"}
SEO_META_PROP_PREFIX = ("og:", "twitter:")
SEO_LINK_REL = {"canonical"}

# 원본에는 있는데 Next 에서 **일부러 뺀** 것.
# 헤더의 관리자 로그인 단추. 로그인은 CMS 관리 화면으로 옮겼다.
PHP_ONLY_CLASS = [
    ("dv_authbtn", "헤더 로그인 단추 — 로그인을 CMS 관리 화면으로 옮겼다"),
]

# ── 이식이 아니라 **새로 그린** 구역 ───────────────────────────────
# 여기 적힌 것은 양쪽에서 통째로 떼고 비교한다. 원본과 닮을 이유가 없어진
# 곳이라 글자 단위 대조가 뜻을 잃기 때문이다. **검사를 끄는 게 아니다** —
# 뗀 자리는 그 구역 전용 검사가 대신 본다. 짝을 안 만들면 그냥 구멍이다.
REDESIGNED = [
    ("contact-form", r'<form[^>]*\sid="dvContactForm"[\s\S]*?</form>',
     "문의 모달의 입력 칸 — 원본은 <label> 과 <input> 이 **묶여 있지 않았다.** "
     "라벨을 눌러도 칸이 안 잡히고 화면 읽개가 칸 이름을 못 읽는다. htmlFor/id 로 "
     "묶고 연락처에 tel·autocomplete 를 줬다. 글은 한 자도 안 바꿨다. "
     "대신 scripts/check-a11y.py 가 19장 전부에서 이 묶임을 본다"),
    ("header", r'<header[^>]*\sid="toss_header"[\s\S]*?</header>',
     "위쪽 탭 막대 — 대분류를 「서비스·비즈니스」에서 「MAX·AI솔루션」 으로 바꾸고 "
     "작은 드롭다운을 폭 전체 메뉴판으로 새로 그렸다. 대신 scripts/check-header.py 가 본다"),
    ("breadcrumb-drop", r'<ul class="dv_bc_drop">[\s\S]*?</ul>',
     "현재 위치 줄의 펼침 목록 — 위 탭 막대와 **같은 자료**(lib/menu.ts)를 읽는다. "
     "탭을 바꾸면 여기 주소도 같이 바뀐다. 같은 검사가 본다"),
]

# 원본에만 있는 <section>. 통째로 뺀 구역이다.
PHP_ONLY_SECTION = [
    ("t_service",
     "홈의 AI Service / Smart Factory 두 칸 — 같은 내용이 위쪽 「신뢰의 근거」 에 "
     "이미 있어 한 화면에서 두 번 말하고 있었다"),
]

# Next 가 심는 것. PHP 에는 있을 수가 없다.
NEXT_ONLY_ID = re.compile(r"^__(next|NEXT)")
NEXT_ONLY_ATTR = {"data-next-hide-fouc", "data-nscript"}
# Next 가 성능용으로 넣는 힌트. 화면에도 동작에도 영향이 없다.
HINT_REL = {"preload", "prefetch", "modulepreload", "dns-prefetch", "preconnect"}
# 닫는 태그가 없는 원소. PHP 는 <img>, JSX 는 <img/> 로 내보내는데
# 파서가 뒤쪽만 끝 태그로 세면 없는 차이가 잔뜩 생긴다.
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr"}
# SVG 안의 잎 원소. PHP 는 `<rect/>` 로 닫고 React 는 `<rect></rect>` 로
# 닫는다. 같은 그림인데 끝 태그를 세면 전부 차이로 뜬다.
# 일부러 다르게 옮긴 스크립트. 이유를 적지 않으면 다음 사람이 "깨졌다" 고
# 읽는다. 여기 없는 차이는 전부 사고다.
DELIBERATE = [
    ("url: \"/mail_send.php\"",
     "문의 모달 전송 — mail_send.php 가 없으므로 Nest 의 /api/inquiry 로 보낸다"),
    ("dvHdrAuthClick",
     "헤더 로그인·문의 JS — **로그인은 통째로 뺐다.** 관리자 로그인이 CMS 관리 "
     "화면으로 갔고, 공개 사이트가 notice_api.php 로 세션을 묻던 요청은 매번 "
     "404 가 났다(실측). 문의 전송은 /api/inquiry 로 돌리고, 실패 시 토큰을 "
     "띄우던 [임시 진단]을 뺐다. 브라우저 기본 대화상자도 전부 화면 알림으로 "
     "바꿨다 — 그것은 페이지를 멈춰서 모달이 닫히는 것도 뒤로 밀리고 "
     "자동 확인이 통째로 멎는다"),
    ("window.BOARD",
     "게시판 JS — 내용이 CMS 로 옮겨졌다. 옛 게시판 API 대신 /api/content/posts 를 "
     "읽고, 항목 이름을 CMS 것으로 맞췄다. 쓰기·삭제·관리자 판별은 관리 화면으로 "
     "갔으므로 뺐다"),
    ("window.FORM",
     "글쓰기 폼 JS — 옛 게시판 백엔드로 저장하던 것이다. 그대로 두면 글을 써도 "
     "사이트에 안 나오므로 저장을 끊고 관리 화면으로 안내한다"),
]

SVG_LEAF = {"rect", "circle", "ellipse", "line", "path", "polygon", "polyline",
            "stop", "use", "animate", "animateTransform".lower()}


class Skeleton(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.tags: list[str] = []
        self.classes: list[str] = []
        self.attrs: list[str] = []
        self.handlers: list[str] = []
        # <head> 안은 순서가 달라도 화면이 같다. next/script 가 실행 시점을
        # 정하느라 태그를 옮기기 때문에 순서까지 맞추려 들면 영원히 안 맞는다.
        # <body> 안은 순서가 곧 화면이라 엄격하게 본다.
        self.in_head = False
        self.head_tags: list[str] = []
        self.head_attrs: list[str] = []
        self._drop_div = 0
        self.scripts: list[str] = []
        self.inline_scripts: list[str] = []
        # 검색엔진용으로 새로 넣은 머리말. 차이로 세지 않고 모아만 둔다 —
        # 무엇을 왜 넣었는지 사람이 볼 수 있게.
        self.seo_added: list[str] = []
        self.payload_forms: list[str] = []
        self.removed_menu: list[str] = []
        self._in_script = False
        self._script_body: list[str] = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        if tag == "head":
            self.in_head = True
        elif tag == "body":
            self.in_head = False
        d = dict(attrs)
        # <script> 와 <style> 의 내용·위치는 이관에서 반드시 움직인다.
        # next/script 가 실행 시점을 정하기 때문이다. 태그 자체는 센다.
        if tag in ("script", "style"):
            # 스크립트는 자리를 옮긴다 — next/script 가 실행 시점을 정하기
            # 때문이다. 순서열에서 빼고 "무엇이 실렸나" 만 따로 센다.
            # 빠지거나 늘어난 스크립트는 그쪽에서 잡힌다.
            if tag == "script":
                src = d.get("src", "")
                if src:
                    # 번들 조각은 Next 가 만드는 것이라 PHP 에 있을 수 없다.
                    if not src.startswith("/_next/"):
                        self.scripts.append(src)
                else:
                    self.scripts.append("(인라인)")
                    self._in_script = True
                    self._script_body = []
            else:
                (self.head_tags if self.in_head else self.tags).append(tag)
            return
        if NEXT_ONLY_ID.match(d.get("id", "")):
            return
        # 검색엔진용 머리말. 새로 넣은 것이라 원본에 없다(위 메모 참고).
        if tag == "meta":
            if d.get("name") in SEO_META_NAME:
                self.seo_added.append(f'meta name={d["name"]}')
                return
            prop = d.get("property") or d.get("name") or ""
            if prop.startswith(SEO_META_PROP_PREFIX):
                self.seo_added.append(f"meta {prop}")
                return
        if tag == "link" and d.get("rel") in SEO_LINK_REL:
            self.seo_added.append(f'link rel={d["rel"]}')
            return
        # Next 가 묶어 내보내는 스타일시트. PHP 에는 있을 수가 없다.
        # (스크립트 번들을 위에서 빼는 것과 같은 이유다.) 이걸 세면 새 꾸밈을
        # 하나 들일 때마다 옮긴 페이지가 전부 "다름"으로 뒤집힌다.
        if tag == "link" and d.get("href", "").startswith("/_next/"):
            return
        if tag == "link" and d.get("rel", "") in HINT_REL:
            # Next 는 외부 스크립트를 HTML 에 <script> 로 넣지 않고
            # preload 해 두었다가 수화 때 심는다. PHP 는 <script> 로 바로
            # 넣는다. 표기가 다를 뿐 "무엇을 싣는가" 는 같아야 하므로
            # 스크립트 preload 는 스크립트로 친다.
            if d.get("as") == "script" and not d.get("href", "").startswith("/_next/"):
                self.scripts.append(d["href"])
            return
        # React 가 <body> 첫머리에 넣는 Suspense 표식
        # (<div hidden><!--$--><!--/$--></div>). 화면에도 DOM 동작에도
        # 영향이 없다. 원본에는 <div hidden> 이 하나도 없다(확인함).
        if tag == "div" and list(d) == ["hidden"]:
            self._drop_div += 1
            return
        (self.head_tags if self.in_head else self.tags).append(tag)
        cls = d.get("class", "")
        if cls:
            # 순서는 화면에 영향이 없다. 집합으로 본다.
            self.classes.append(f"{tag}:{' '.join(sorted(cls.split()))}")
        # PHP 의 onclick 은 HTML 에 남고 React 의 onClick 은 안 남는다.
        # 그래서 "양쪽 HTML 이 같다" 로는 동작이 붙었는지 알 수 없다.
        # 여기서는 세어만 두고, 실제로 눌리는지는 브라우저에서 확인한다.
        if "onclick" in d:
            cls = d.get("class", "")
            self.handlers.append(f"{tag}.{cls}: {d['onclick']}")
        # 한 원소 안에서 속성 차례는 화면에 아무 영향이 없다. 정렬해서
        # 본다 — 안 그러면 컴포넌트가 href 를 뒤에 붙였다는 이유로
        # 페이지 전체가 "다름" 으로 뜬다.
        for k in sorted(("id", "src", "href", "alt", "name", "type", "value", "for",
                         "role", "aria-label", "aria-hidden", "data-tooltip", "data-aos")):
            v = d.get(k)
            if v is None or k in NEXT_ONLY_ATTR:
                continue
            # asset_url() 이 붙이는 ?v=파일수정시각. Next 에는 없다.
            # React 는 빈 src/href 를 아예 안 그린다(빈 주소로 요청이 나가는
            # 것을 막으려는 동작이다). PHP 는 src="" 를 그대로 찍는다.
            # 자바스크립트가 나중에 채우는 자리라 결과는 같다.
            if v == "" and k in ("src", "href"):
                continue
            v = re.sub(r"\?v=\d+$", "", v)
            # React 가 막는 주소. 같은 결과를 내는 `#` + preventDefault 로
            # 옮겼으므로 차이로 세지 않는다. SubMenuToggle.tsx 참고.
            if k == "href" and v == "javascript:void(0);":
                v = "#"
            # 화면 주소에서 `.php` 를 뺐다(lib/phpRoutes.mjs). PHP 는 `.php` 가
            # 붙은 채로 링크를 찍고 Next 는 뺀 채로 찍는데, **가리키는 곳은
            # 같다** — 옛 주소는 308 로 새 주소에 닿는다. 글자 그대로 세면
            # 헤더 링크 때문에 모든 페이지가 뒤집힌다. 양쪽을 같은 모습으로
            # 맞춰 놓고 비교한다. `/index.php` 는 `/` 로 간다.
            if k in ("href", "src"):
                v = PHP_EXT.sub(_sub_ext, v)
                if v in ("/index", ""):
                    v = "/"
                # 같은 그림의 줄인 판. 운영 파일을 못 건드려서 주소만 다르다
                # (2.25MB → 23KB). 글자가 달라도 화면은 같으므로 차이로 안 센다.
                v = SAME_IMAGE.get(v, v)
            (self.head_attrs if self.in_head else self.attrs).append(f"{tag}[{k}]={v}")

    def handle_startendtag(self, tag, attrs):
        # <img/> 같은 자기닫음. 시작 태그로만 센다.
        self.handle_starttag(tag, attrs)

    def handle_data(self, data):
        # 인라인 스크립트 본문을 모은다. 이게 있어야 "같은 글자가 실렸나" 를
        # 볼 수 있다 — 태그 개수만 세면 내용이 깨져도 통과한다.
        if self._in_script:
            self._script_body.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self._in_script:
            self.inline_scripts.append("".join(self._script_body))
            self._in_script = False
            return
        if tag == "head":
            self.in_head = False
        if tag == "div" and self._drop_div:
            self._drop_div -= 1
            return
        if tag in VOID or tag in SVG_LEAF or tag in ("script", "style"):
            return
        (self.head_tags if self.in_head else self.tags).append(f"/{tag}")


def flight_payload(html: str) -> str:
    """Next 의 수화 payload.

    afterInteractive 스크립트 본문은 HTML 에 <script> 로 안 들어가고
    `self.__next_f.push([1,"...."])` 안에 JSON 문자열로 실린다. 이어 붙이면
    원문이 나온다 — 이 방법 말고는 서버가 준 응답만으로 확인할 수가 없다.
    """
    out = []
    for m in re.finditer(r'self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)', html):
        try:
            out.append(json.loads(m.group(1)))
        except Exception:
            pass
    return "".join(out)


_ESC = {"n": "\n", "t": "\t", "r": "\r", "b": "\b", "f": "\f",
        '"': '"', "\\": "\\", "/": "/", "'": "'"}


def unescape_json_body(text: str) -> str:
    def one(m: re.Match) -> str:
        tok = m.group(0)
        if tok[1] == "u":
            return chr(int(tok[2:], 16))
        return _ESC.get(tok[1], tok)
    return re.sub(r"\\(?:u[0-9a-fA-F]{4}|.)", one, text)


def strip_new_menu(html: str) -> tuple[str, list[str]]:
    """Next 에만 있는 메뉴 <li> 를 떼어낸다. 어느 것을 뗐는지 같이 돌려준다.

    <li> 안에 <li> 가 없는 자리라서(하위 메뉴의 잎) 닫는 태그까지 한 덩어리로
    잘라도 안전하다. 안 걸리면 조용히 지나간다 — 메뉴에서 뺐다는 뜻이다.
    """
    removed = []
    # 표시가 달린 <li> 는 주소와 상관없이 떼어낸다. 부모 메뉴와 주소가 같은
    # 하위 항목(수행실적 > 주요 수행실적)은 주소로는 구분할 수가 없다.
    # 껍데기부터 뗀다. 안의 <li> 만 떼면 빈 상자가 남아서 그게 다시 차이가 된다.
    marked_box = re.compile(r"<div[^>]*\sdata-next-only[^>]*>(?:(?!</div>)[\s\S])*?</div>")
    html, nb = marked_box.subn("", html)
    marked = re.compile(r"<li[^>]*\sdata-next-only[^>]*>(?:(?!</li>)[\s\S])*?</li>")
    html, n = marked.subn("", html)
    if nb or n:
        removed.append(
            f"data-next-only 표시가 달린 메뉴 상자 {nb}개·항목 {n}개 — 원본에 없던 것"
        )

    for href, why in NEXT_ONLY_MENU:
        pat = re.compile(
            r"<li[^>]*>(?:(?!</li>)[\s\S])*?"
            + re.escape(f'href="{href}"')
            + r"(?:(?!</li>)[\s\S])*?</li>"
        )
        html, n = pat.subn("", html)
        if n:
            removed.append(f"{why} ({n}곳)")
    return html, removed


def strip_php_only(html: str) -> tuple[str, list[str]]:
    """원본에만 있고 Next 에서 **일부러 뺀** 것을 떼어낸다.

    새 메뉴를 Next 쪽에서 떼는 것(strip_new_menu)과 짝이다. 안 떼면 우리가
    없앤 것이 매번 "PHP 에만 있음" 으로 잡혀서 진짜 차이가 안 보인다.
    """
    removed = []
    for cls, why in PHP_ONLY_SECTION:
        pat = re.compile(
            r"<section[^>]*\sclass=\"[^\"]*" + re.escape(cls) + r"[^\"]*\"[\s\S]*?</section>"
        )
        html, n = pat.subn("", html)
        if n:
            removed.append(f"{why} ({n}곳)")
    for cls, why in PHP_ONLY_CLASS:
        pat = re.compile(
            r"<button[^>]*\sclass=\"[^\"]*" + re.escape(cls) + r"[^\"]*\"[\s\S]*?</button>"
        )
        html, n = pat.subn("", html)
        if n:
            removed.append(f"{why} ({n}곳)")
    return html, removed


def strip_redesigned(html: str) -> tuple[str, list[str]]:
    """양쪽에서 똑같이 떼어낸다. 원본이든 Next 든 상관없이 같은 자리를 뗀다."""
    removed = []
    for _name, pat, why in REDESIGNED:
        html, n = re.subn(pat, "", html)
        if n:
            removed.append(f"{why} ({n}곳)")
    return html, removed


def grab(url: str, next_side: bool = False) -> Skeleton:
    with _OPENER.open(url, timeout=30) as r:
        html = r.read().decode("utf-8", "replace")
    html, removed = strip_redesigned(html)
    if next_side:
        html, more = strip_new_menu(html)
    else:
        html, more = strip_php_only(html)
    removed += more
    s = Skeleton()
    s.removed_menu = removed
    s.feed(html)
    # 이스케이프 깊이가 자리마다 다르다. RSC 흐름 형식은 문자열 안에 또
    # JSON 을 넣어서, 한 번만 풀린 곳과 두 번 풀려야 하는 곳이 섞인다.
    # 어느 쪽이 맞는지 따지는 대신 **세 가지 모습을 다 만들어 두고** 그중
    # 하나에라도 원문이 있으면 같다고 본다.
    # 이렇게 해도 "백슬래시가 통째로 사라진" 경우는 어느 모습에도 안 나온다.
    once = flight_payload(html)
    s.payload_forms = [html, once, unescape_json_body(once)]
    return s


def report(name: str, a: list[str], b: list[str], ordered: bool = True) -> int:
    """ordered=False 면 순서 차이를 세지 않는다(<head> 전용)."""
    only_php = [x for x in a if x not in b]
    only_next = [x for x in b if x not in a]
    if not only_php and not only_next:
        if a == b or not ordered:
            print(f"  같음  {name:10} {len(a)}개")
            return 0
        print(f"  순서  {name:10} {len(a)}개 — 내용은 같고 순서가 다르다")
        for i, (x, y) in enumerate(zip(a, b)):
            if x != y:
                print(f"          첫 어긋남 {i}: PHP={x} Next={y}")
                break
        return 1
    print(f"  다름  {name:10} PHP {len(a)}개 / Next {len(b)}개")
    for x in only_php[:12]:
        print(f"          PHP 에만  {x}")
    for x in only_next[:12]:
        print(f"          Next 에만 {x}")
    more = max(len(only_php), len(only_next)) - 12
    if more > 0:
        print(f"          ... 외 {more}개")
    return len(only_php) + len(only_next)


def main() -> None:
    path = sys.argv[1] if len(sys.argv) > 1 else "/page/company/intro.php"
    print(f"== {path}")
    php, nxt = grab(PHP + path), grab(NEXT + path, next_side=True)
    for line in nxt.removed_menu:
        print(f"  일부러 메뉴  {line}")
    total = 0
    total += report("head 태그", php.head_tags, nxt.head_tags, ordered=False)
    total += report("head 속성", php.head_attrs, nxt.head_attrs, ordered=False)
    total += report("body 뼈대", php.tags, nxt.tags)
    total += report("body class", php.classes, nxt.classes)
    total += report("body 속성", php.attrs, nxt.attrs)
    # 인라인 스크립트는 셀 수가 없다. Next 는 수화 데이터를 인라인으로
    # 잔뜩 심는다(실측 PHP 5개 vs Next 22개). 밖에서 불러오는 것만 센다 —
    # 빠뜨리면 기능이 죽는 것은 이쪽이다.
    ext = lambda s: sorted(x for x in s if x != "(인라인)")
    total += report("외부 스크립트", ext(php.scripts), ext(nxt.scripts))

    # 인라인 스크립트는 개수로 못 센다. 대신 **원본 본문이 그대로 실렸는지**
    # 를 본다. 여기서 한 글자만 달라져도 화면은 멀쩡하고 기능만 죽는다 —
    # 실제로 템플릿 문자열이 백슬래시를 먹어 게시판 스크립트가 통째로
    # 문법 오류로 죽은 적이 있다.
    flat = lambda t: " ".join(t.split())
    forms = [flat(t) for t in nxt.payload_forms]
    def carried(core: str) -> bool:
        return any(core in f for f in forms)
    payload = forms[-1]
    missing, on_purpose = [], []
    for body in php.inline_scripts:
        core = flat(body)
        if len(core) < 40:
            continue  # 한두 줄짜리는 Next 쪽 구조와 섞여 판정이 흔들린다
        if carried(core):
            continue
        why = next((r for mark, r in DELIBERATE if mark in core), None)
        (on_purpose if why else missing).append((core, why))
    for core, why in on_purpose:
        print(f"  일부러 인라인 스크립트  {why}")
    if missing:
        total += len(missing)
        print(f"  다름  인라인 스크립트  원본 본문 {len(missing)}개가 Next 에 그대로 없다")
        for core, _ in missing:
            print(f"          {core[:90]}")
            for cut in range(len(core), 0, -20):   # 어디서부터 갈라지는지
                if carried(core[:cut]):
                    print(f"          └ {cut}자까지 같다 … {core[max(0, cut - 60):cut + 20]!r}")
                    break
    elif not on_purpose:
        print(f"  같음  인라인 스크립트  {len(php.inline_scripts)}개")
    if php.handlers:
        print(f"  동작  PHP 에 onclick {len(php.handlers)}개 — HTML 비교로는 안 잡힌다.")
        for h in php.handlers:
            print(f"          {h}")
    print(f"  차이 {total}건")
    raise SystemExit(1 if total else 0)


if __name__ == "__main__":
    main()
