"""PHP 페이지를 Next 페이지로 옮긴다.

손으로 옮기면 반드시 흘린다. 실제로 `onclick="toggleSubMenu(this)"` 하나가
조용히 빠져서 모바일 서브메뉴가 죽어 있었고, 화면은 100% 똑같았기 때문에
눈으로는 찾을 수 없었다. 그래서 기계가 옮기고, 기계가 못 하는 것은
`TODO` 로 남겨서 반드시 눈에 띄게 한다.

옮긴 뒤에는 scripts/compare.py 로 원본과 대 본다. 이 스크립트를 믿는 것이
아니라 결과를 재는 것이다.

실행: python3 scripts/port.py /page/company/vision.php
"""

from __future__ import annotations

import base64
import json
import pathlib
import re
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[2]

UNRESOLVED: set[str] = set()
LOOP_VARS: set[str] = set()

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr"}

# JSX 가 다른 이름을 쓰는 속성. 빠뜨리면 React 가 속성을 그냥 버린다.
RENAME = {
    "class": "className", "for": "htmlFor", "tabindex": "tabIndex",
    "colspan": "colSpan", "rowspan": "rowSpan", "maxlength": "maxLength",
    "minlength": "minLength", "readonly": "readOnly", "autocomplete": "autoComplete",
    "autofocus": "autoFocus", "srcset": "srcSet", "enctype": "encType",
    "charset": "charSet", "http-equiv": "httpEquiv", "accept-charset": "acceptCharset",
    "novalidate": "noValidate", "contenteditable": "contentEditable",
    "spellcheck": "spellCheck", "crossorigin": "crossOrigin",
    "datetime": "dateTime", "usemap": "useMap", "frameborder": "frameBorder",
    "allowfullscreen": "allowFullScreen", "referrerpolicy": "referrerPolicy",
}
# SVG 속성은 대소문자가 섞여 있는데 HTML 파서가 전부 소문자로 내린다.
# `viewbox` 로 두면 React 가 못 알아본다 — 그림이 통째로 안 나온다.
SVG_RENAME = {k.lower(): k for k in (
    "viewBox", "preserveAspectRatio", "baseProfile", "clipPath", "clipRule",
    "fillOpacity", "fillRule", "gradientTransform", "gradientUnits",
    "markerEnd", "markerMid", "markerStart", "patternContentUnits",
    "patternTransform", "patternUnits", "shapeRendering", "spreadMethod",
    "stopColor", "stopOpacity", "strokeDasharray", "strokeDashoffset",
    "strokeLinecap", "strokeLinejoin", "strokeMiterlimit", "strokeOpacity",
    "strokeWidth", "textAnchor", "vectorEffect", "dominantBaseline",
    "alignmentBaseline", "paintOrder", "xlinkHref", "fontFamily", "fontSize",
    "fontWeight", "letterSpacing", "clipPathUnits", "maskUnits",
    "maskContentUnits", "filterUnits", "primitiveUnits", "stdDeviation",
    "floodColor", "floodOpacity",
)}

# 값 없이 쓰는 속성. JSX 에서는 명시적으로 true 를 준다.
BOOLEAN = {"required", "disabled", "checked", "selected", "readonly", "multiple",
           "autofocus", "novalidate", "allowfullscreen", "async", "defer", "hidden"}
# 문자열 핸들러. JSX 로 못 넘어간다 — 컴포넌트가 필요하다.
HANDLER = re.compile(r"^on[a-z]+$")


def css_prop(name: str) -> str:
    if name.startswith("--"):
        return f"'{name}'"
    head, *rest = name.strip().split("-")
    return head + "".join(p.capitalize() for p in rest)


def style_object(value: str) -> str:
    parts = []
    for decl in value.split(";"):
        if ":" not in decl:
            continue
        k, v = decl.split(":", 1)
        parts.append(f"{css_prop(k)}: {v.strip()!r}")
    return "{{ " + ", ".join(parts) + " }}"


def php_expr(expr: str, variables: dict[str, str] | None = None) -> str:
    """PHP 식을 JS 식으로. 못 바꾸는 것은 그대로 두고 TODO 로 잡힌다."""
    e = expr.strip().rstrip(";")
    # 값을 아는 변수는 먼저 리터럴로 바꾼다. json_encode($board) 같은 식은
    # 변수가 리터럴이 되어야 결과를 계산할 수 있다.
    for name, val in sorted((variables or {}).items(), key=lambda kv: -len(kv[0])):
        e = re.sub(r"\$" + name + r"\b", "'" + val.replace("'", "\\'") + "'", e)
    # 값을 못 찾은 변수가 남으면 JSX 에 정의되지 않은 이름이 생긴다.
    # 조용히 흘리면 타입 오류로만 나타나거나, 운 나쁘면 그냥 지나간다.
    for name in re.findall(r"\$(\w+)", e):
        if name not in (LOOP_VARS or set()):
            UNRESOLVED.add(name)
    # htmlspecialchars 는 필요 없다 — React 가 알아서 이스케이프한다.
    e = re.sub(r"htmlspecialchars\s*\(\s*'([^']*)'\s*\)", r"'\1'", e)
    e = re.sub(r"htmlspecialchars\s*\(", "(", e)
    # json_encode('notice') → "notice". 값이 이미 리터럴이라 따옴표만 바꾼다.
    # PHP 의 json_encode 는 기본으로 비ASCII 를 \uXXXX 로 쓴다. 결과 문자열은
    # 같지만 소스가 달라지고, 그러면 원본과 글자 단위로 대 볼 수가 없다.
    e = re.sub(r"json_encode\s*\(\s*'([^']*)'\s*\)",
               lambda m: json.dumps(m.group(1), ensure_ascii=True), e)
    # str_pad($i+1, 2, '0', STR_PAD_LEFT) → String($i+1).padStart(2, '0')
    e = re.sub(r"str_pad\s*\(\s*(.+?)\s*,\s*(\d+)\s*,\s*'([^']*)'\s*,\s*STR_PAD_LEFT\s*\)",
               r"String(\1).padStart(\2, '\3')", e)
    # $x['key'] → x['key'] (한글 키가 있어 점 표기로 못 바꾼다)
    e = re.sub(r"\$(\w+)", r"\1", e)
    return e


def php_array(src: str, name: str) -> str | None:
    """$name = [ ['k' => 'v', ...], ... ]; 를 TS 리터럴로.

    이 모양만 읽는다. 다른 모양이면 None 을 주고 TODO 로 넘어간다 —
    반쯤 읽어서 조용히 틀린 배열을 만드는 것보다 낫다.
    """
    m = re.search(r"\$" + name + r"\s*=\s*\[(.*?)\n\s*\];", src, flags=re.S)
    if not m:
        return None
    rows = []
    for row in re.finditer(r"\[(.*?)\]", m.group(1), flags=re.S):
        pairs = re.findall(r"'([^']*)'\s*=>\s*'((?:[^'\\]|\\.)*)'", row.group(1))
        if not pairs:
            return None
        rows.append("  { " + ", ".join(f"{k!r}: '{v}'" for k, v in pairs) + " },")
    return "[\n" + "\n".join(rows) + "\n]" if rows else None


def raw_keys(src: str, name: str) -> set[str]:
    """값 안에 HTML 이 들어 있는 키.

    PHP 의 `echo` 는 원문을 그대로 뱉는다. React 는 이스케이프한다.
    그래서 배열에 <svg> 를 넣어 두고 echo 하던 자리는 그냥 옮기면
    아이콘이 글자로 찍힌다 — 화면이 확 달라지는데 문법 오류는 안 난다.
    """
    m = re.search(r"\$" + name + r"\s*=\s*\[(.*?)\n\s*\];", src, flags=re.S)
    if not m:
        return set()
    return {k for k, v in re.findall(r"'([^']*)'\s*=>\s*'((?:[^'\\]|\\.)*)'", m.group(1))
            if "<" in v and ">" in v}


def parse_calls(onclick: str) -> list[str]:
    """`fn(); g(this); h('/a.png')` → ClientAction 의 calls 항목들.

    하나라도 못 읽으면 전부 포기한다. 반쯤 옮기면 그게 제일 나쁘다 —
    빠진 쪽은 TODO 로도 안 남는다.
    """
    out = []
    for call in [c.strip() for c in onclick.split(";") if c.strip()]:
        m = re.match(r"([\w.]+)\s*\(\s*(.*?)\s*\)$", call)
        if not m:
            return []
        name, arg = m.group(1), m.group(2)
        if not arg:
            out.append(f"{{ fn: '{name}' }}")
        elif arg == "this":
            out.append(f"{{ fn: '{name}', self: true }}")
        elif arg == "event":
            out.append(f"{{ fn: '{name}', event: true }}")
        else:
            a = php_expr(arg)
            # '<?php echo $x ?>' 는 자리표가 따옴표 안에 들어간 모양이다.
            # 그대로 두면 JS 문자열 리터럴 "{x}" 가 되어 버린다.
            # 여기는 이미 JS 식 자리다. 자리표를 그대로 두면 나중에
            # 중괄호가 한 번 더 붙어 `[{pt['img']}]` 가 된다.
            m2 = re.fullmatch(r"'@@X:([A-Za-z0-9+/=]+)@@'", a)
            if m2:
                a = base64.b64decode(m2.group(1)).decode()
            out.append(f"{{ fn: '{name}', args: [{a}] }}")
    return out


class ToJsx(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.out: list[str] = []
        self.todo: list[str] = []
        self.scripts: list[tuple[str, str]] = []   # (src, inline)
        self.depth = 0
        self._script: str | None = None
        self._style: bool = False
        self.page_css: list[str] = []
        self.used_fallback = False
        self.used_action = False
        self._action: list[list] = []

    # -- 태그 -------------------------------------------------------
    def handle_starttag(self, tag, attrs):
        if tag == "script":
            d = dict(attrs)
            self._script = d.get("src", "")
            self._script_buf = []
            return
        if tag == "style":
            # 자리를 기억해 둔다. 고정 위치에 넣으면 <link> 와 순서가 뒤집혀
            # CSS 우선순위가 달라진다 — 화면이 조용히 어긋나는 자리다.
            self._style = True
            self.out.append("@@STYLE@@")
            return
        d0 = dict(attrs)
        # PHP 의 `onsubmit="return false;"` — 폼 전송만 막는다.
        if (d0.get("onsubmit", "") or "").replace(" ", "") in ("returnfalse;", "returnfalse"):
            rest = [(k, v) for k, v in attrs if k != "onsubmit"]
            self.used_action = True
            self.out.append('<ClientAction as="form" on="submit" prevent calls={[]}'
                            + self._attrs(tag, rest) + ">")
            self._action.append([tag, 0])
            return
        on = d0.get("onclick", "") or ""
        if on:
            calls = parse_calls(on)
            if calls:
                rest = [(k, v) for k, v in attrs
                        if k != "onclick" and not (k == "href" and v.startswith("javascript:"))]
                self.used_action = True
                as_attr = f' as="{tag}"' if tag != "button" else ""
                self.out.append("<ClientAction" + as_attr + " calls={[" + ", ".join(calls) + "]}"
                                + self._attrs(tag, rest) + ">")
                self._action.append([tag, 0])
                return
        if tag == "img":
            d = dict(attrs)
            m = re.match(r"this\.src\s*=\s*['\"](.+?)['\"]", d.get("onerror", "") or "")
            if m:
                # onerror 문자열은 JSX 로 못 넘어간다. 같은 동작을 하는
                # 클라이언트 컴포넌트로 바꾼다.
                rest = [(k, v) for k, v in attrs if k != "onerror"]
                self.used_fallback = True
                self.out.append("<FallbackImage" + self._attrs(tag, rest)
                                + f' fallback="{m.group(1)}" />')
                return
        if self._action and tag == self._action[-1][0] and tag not in VOID:
            self._action[-1][1] += 1
        self.out.append("<" + tag + self._attrs(tag, attrs) + (" />" if tag in VOID else ">"))

    def handle_startendtag(self, tag, attrs):
        self.out.append("<" + tag + self._attrs(tag, attrs) + " />")

    def handle_endtag(self, tag):
        if tag == "script":
            self.scripts.append((self._script or "", "".join(getattr(self, "_script_buf", []))))
            self._script = None
            return
        if tag == "style":
            self._style = False
            return
        if tag in VOID:
            return
        if self._action and self._action[-1][0] == tag:
            if self._action[-1][1] == 0:
                self._action.pop()
                self.out.append("</ClientAction>")
                return
            self._action[-1][1] -= 1
        self.out.append(f"</{tag}>")

    def _attrs(self, tag: str, attrs) -> str:
        bits = []
        for k, v in attrs:
            if HANDLER.match(k):
                # onclick="fn()" 은 JSX 속성이 될 수 없다. 버리지 않고
                # 눈에 띄게 남긴다 — 이게 조용히 사라지면 화면은 같고
                # 기능만 죽는다.
                self.todo.append(f"<{tag}> {k}=\"{v}\" → 클라이언트 컴포넌트로 옮길 것")
                bits.append(f'/* TODO {k}="{v}" */')
                continue
            name = RENAME.get(k, SVG_RENAME.get(k, k))
            if v is None:
                bits.append(f"{name}={{true}}" if k in BOOLEAN else f'{name}=""')
                continue
            if k == "style":
                bits.append(f"style={style_object(v)}")
                continue
            if k in BOOLEAN:
                bits.append(f"{name}={{true}}")
                continue
            if "{" in v or "}" in v or '"' in v:
                bits.append(f"{name}={{{v!r}}}")
                continue
            bits.append(f'{name}="{v}"')
        return (" " + " ".join(bits)) if bits else ""

    # -- 내용 -------------------------------------------------------
    def handle_data(self, data):
        if self._script is not None:
            self._script_buf.append(data)
            return
        if self._style:
            self.page_css.append(data)
            return
        # JSX 에서 중괄호는 식으로 읽힌다. 글자로 쓰려면 감싸야 한다.
        for ch in "{}<>":
            if ch in data:
                data = data.replace(ch, "{'" + ch + "'}")
        self.out.append(data)

    def handle_comment(self, data):
        if self._script is not None:
            self._script_buf.append(f"<!--{data}-->")
            return
        self.out.append("{/*" + data.replace("*/", "*\\/") + "*/}")


def use_opt_images(text: str) -> str:
    """`/img/<이름>` 을 `/opt/<이름>` 으로 바꾼다. 같은 그림의 줄인 판이다.

    원본 PHP 에는 15MB 짜리 `/img/main_bg_01.jpg` 같은 주소가 그대로 들어
    있다. 그걸 손으로 `/opt/` 로 바꿔 놨는데, 페이지를 다시 port 하면 원본
    주소가 되살아난다. 게다가 `compare.py` 는 `SAME_IMAGE` 로 두 주소를
    같은 것으로 세므로 대조 검사도 통과한다 — 무거워진 것을 아무도 못 잡는다.
    그래서 쓰기 직전에 기계가 바꾼다.

    바꿀 이름은 `web/public/opt/` 를 그때그때 읽어서 정한다. 목록을 여기에
    적어 두면 그림이 늘 때 조용히 빠진다.
    """
    names = sorted(
        (f.name for f in (ROOT / "web" / "public" / "opt").glob("*") if f.is_file()),
        key=len, reverse=True,
    )
    if not names:
        return text
    # 뒤를 막지 않으면 `/img/logo.png` 규칙이 `/img/logo.png.bak` 에도 걸린다.
    pat = r"/img/(" + "|".join(re.escape(n) for n in names) + r")(?![\w.-])"
    return re.sub(pat, r"/opt/\1", text)


def php_vars(src: str) -> dict[str, str]:
    """$x = "..."; 형태의 단순 대입만 읽는다. 그 이상은 TODO 로 넘어간다."""
    out = {}
    for m in re.finditer(r"""\$(\w+)\s*=\s*(['"])(.*?)\2\s*;""", src):
        out[m.group(1)] = m.group(3)
    return out


def main() -> None:
    path = sys.argv[1]
    src_file = ROOT / path.lstrip("/")
    php = src_file.read_text()
    todo: list[str] = []

    # `include __DIR__ . '/_board.php'` 같은 공용 파셜을 펼친다. PHP 는
    # 진입점에서 변수를 정하고 파셜을 부르는데, 펼치지 않으면 본문이
    # 통째로 빈다.
    def splice(m):
        part = src_file.parent / m.group(1)
        return part.read_text() if part.is_file() else m.group(0)
    php = re.sub(r"include(?:_once)?\s*\(?\s*__DIR__\s*\.\s*'/([\w.]+)'\s*\)?\s*;",
                 splice, php)

    variables = php_vars(php)

    # 헤더 include 앞뒤를 잘라 낸다. 남는 것이 페이지 본문이다.
    body = php
    # 따옴표 종류와 공백이 파일마다 다르다. 하나라도 안 맞으면 본문 전체가
    # 안 잘리고 PHP 가 그대로 흘러들어간다.
    inc = lambda name: r"include_once\(\$_SERVER\[['\"]DOCUMENT_ROOT['\"]\]\s*\.\s*['\"]/" + name + r"\.php['\"]\)\s*;"
    body = re.sub(r"^.*?" + inc("header"), "", body, flags=re.S)
    body = re.sub(r"<\?php\s*(?://[^\n]*\n)?\s*" + inc("footer") + r"\s*\?>\s*$",
                  "", body, flags=re.S)
    # 헤더 include 는 여는 <?php 블록 안에 있다. 그 블록의 끝(?>)까지가
    # 전부 PHP 코드다. 변수 대입 몇 개만 골라 지우면 배열·주석 같은 것이
    # 그대로 본문으로 새어 JSX 한복판에 PHP 가 남는다.
    body = re.sub(r"^.*?\?>", "", body, flags=re.S)

    # breadcrumb include → 컴포넌트
    has_bc = "breadcrumb.php" in body
    body = re.sub(r"<\?php\s*" + inc("breadcrumb") + r"\s*\?>", "@@BREADCRUMB@@", body)

    # <?php echo $x ?> → 값. 못 푸는 것은 남겨서 TODO 로 잡는다.
    def echo(m):
        name = m.group(1)
        if name in variables:
            return variables[name]
        todo.append(f"<?php echo ${name} ?> — 값을 못 찾았다")
        return f"@@PHP:{name}@@"
    body = re.sub(r"<\?(?:php\s+echo|=)\s*\$(\w+)\s*;?\s*\?>", echo, body)

    # foreach → map. 배열은 TS 상수로 뽑아 올린다.
    consts: list[str] = []
    raws: set[str] = set()

    def loop(m):
        arr, idx, item, inner = m.group(1), m.group(2), m.group(3), m.group(4)
        lit = php_array(php, arr)
        if lit is None:
            todo.append(f"${arr} 배열을 못 읽었다 — 손으로 옮길 것")
            return m.group(0)
        const = arr.upper()
        consts.append(f"const {const} = {lit} as const")
        for k in raw_keys(php, arr):
            raws.add(f"{item}['{k}']")
        # 인덱스가 없어도 만들어 둔다 — key 가 필요하다.
        i = idx or "_i"
        LOOP_VARS.update({item, i})
        args = f"({item}, {i})"
        return (f"@@MAPSTART:{const}:{args}:{i}@@" + inner + "@@MAPEND@@")

    body = re.sub(
        r"<\?php\s*foreach\s*\(\s*\$(\w+)\s+as\s+(?:\$(\w+)\s*=>\s*)?\$(\w+)\s*\)\s*:\s*\?>(.*?)<\?php\s*endforeach;?\s*\?>",
        loop, body, flags=re.S)

    # 남은 echo 는 반복 변수를 쓰는 식이다. 자리표로 바꿔 두고 JSX 로 만든 뒤 되돌린다.
    def echo_expr(m):
        return "@@X:" + base64.b64encode(php_expr(m.group(1), variables).encode()).decode() + "@@"
    body = re.sub(r"<\?(?:php\s+echo|=)\s*(.+?)\s*;?\s*\?>", echo_expr, body, flags=re.S)

    for m in re.finditer(r"<\?php.*?\?>", body, flags=re.S):
        todo.append("남은 PHP 블록: " + " ".join(m.group(0).split())[:110])

    if UNRESOLVED:
        todo.append("값을 못 찾은 변수: " + ", ".join(sorted("$" + n for n in UNRESOLVED))
                    + " — 손으로 넘겨줄 것")

    p = ToJsx()
    p.feed(body)
    p.close()
    todo = p.todo + todo

    jsx = "".join(p.out).strip()
    jsx = jsx.replace("@@BREADCRUMB@@", "<Breadcrumb currentPath={PATH} />")
    jsx = re.sub(r"@@PHP:(\w+)@@", r"{/* TODO $\1 */}", jsx)
    jsx = jsx.replace("@@STYLE@@", "<style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />")

    # 값이 이미 정해진 글자면 식으로 감싸지 말고 그냥 글자로 쓴다.
    # `style="url('{'/img/a.jpg'}')"` 같은 것이 나오는 것을 막는다.
    def literal(m):
        e = base64.b64decode(m.group(1)).decode()
        lit = re.fullmatch(r"'(.*)'", e, flags=re.S)
        return lit.group(1) if lit else m.group(0)
    jsx = re.sub(r"@@X:([A-Za-z0-9+/=]+)@@", literal, jsx)

    def unx(m):
        return "{" + base64.b64decode(m.group(1)).decode() + "}"
    # 속성 안에 자리표가 섞여 있으면 템플릿 문자열로 만든다.
    def attr_x(m):
        name, val = m.group(1), m.group(2)
        if re.fullmatch(r"@@X:([A-Za-z0-9+/=]+)@@", val):
            return f"{name}={{{base64.b64decode(re.findall(r'@@X:([A-Za-z0-9+/=]+)@@', val)[0]).decode()}}}"
        tpl = re.sub(r"@@X:([A-Za-z0-9+/=]+)@@",
                     lambda k: "${" + base64.b64decode(k.group(1)).decode() + "}", val)
        return f"{name}={{`{tpl}`}}"
    jsx = re.sub(r'([\w-]+)="([^"]*@@X:[^"]*)"', attr_x, jsx)
    jsx = re.sub(r"@@X:([A-Za-z0-9+/=]+)@@", unx, jsx)
    jsx = re.sub(r"@@MAPSTART:(\w+):(\([^)]*\)):(\w+)@@",
                 lambda m: "{" + m.group(1) + ".map(" + m.group(2)
                           + " => (<Fragment key={" + m.group(3) + "}>", jsx)
    jsx = jsx.replace("@@MAPEND@@", "</Fragment>))}")

    # <div class="feat_ico">{ft['icon']}</div> → dangerouslySetInnerHTML.
    # 값이 우리 소스 안의 상수라서 바깥에서 들어오는 문자열이 아니다.
    for expr in raws:
        jsx = re.sub(
            r"<(\w+)([^>]*)>\{" + re.escape(expr) + r"\}</\1>",
            lambda m: f"<{m.group(1)}{m.group(2)} dangerouslySetInnerHTML={{{{ __html: {expr} }}}} />",
            jsx)


    need_fragment = "<Fragment" in jsx
    css = re.sub(r"@@X:([A-Za-z0-9+/=]+)@@",
                 lambda m: base64.b64decode(m.group(1)).decode().strip("'"),
                 "".join(p.page_css)).strip()
    scripts = []
    def unplace(text: str) -> str:
        """스크립트 본문은 JSX 가 아니다. 자리표를 값 그대로 되돌린다."""
        return re.sub(r"@@X:([A-Za-z0-9+/=]+)@@",
                      lambda m: base64.b64decode(m.group(1)).decode(), text)

    for i, (src, inline) in enumerate(p.scripts):
        inline = unplace(inline)
        if src:
            scripts.append(f'      <Script src="{src}" strategy="afterInteractive" />')
        elif inline.strip():
            # 템플릿 문자열 안에서는 백슬래시가 이스케이프로 먹힌다.
            # `/https?:\/\//` 같은 정규식이 `/https?:////` 가 되어 스크립트가
            # 통째로 문법 오류로 죽는다 — 화면은 멀쩡하고 기능만 안 된다.
            body = (inline.strip()
                    .replace("\\", "\\\\")
                    .replace("`", "\\`")
                    .replace("${", "\\${"))
            scripts.append(
                f'      <Script id="page-script-{i}" strategy="afterInteractive">{{`\n'
                + body + "\n      `}</Script>")

    imports = ["import SiteFooter from '@/components/SiteFooter'",
               "import SiteHeader from '@/components/SiteHeader'"]
    if has_bc:
        imports.insert(0, "import Breadcrumb from '@/components/Breadcrumb'")
    if p.used_fallback:
        imports.insert(0, "import FallbackImage from '@/components/FallbackImage'")
    if p.used_action:
        imports.insert(0, "import ClientAction from '@/components/ClientAction'")
    if need_fragment:
        imports.insert(0, "import { Fragment } from 'react'")
    if scripts:
        imports.append("import Script from 'next/script'")

    head = "\n".join(imports)
    todo_block = ""
    if todo:
        todo_block = ("\n/* 옮기는 사람이 손으로 처리해야 하는 것 —\n   "
                      + "\n   ".join(todo) + "\n */\n")

    consts_block = ("\n" + "\n\n".join(consts) + "\n") if consts else ""

    # 화면 주소. 폴더 이름도 이것이고 PATH 상수도 이것이다.
    clean_path = "/" if path.lstrip("/") == "index.php" else re.sub(r"\.php$", "", path)

    out = f'''{head}

/**
 * {path} 를 옮긴 것.
 *
 * 주소에서 `.php` 를 뺐다. 옛 주소는 lib/phpRoutes.mjs 의 목록대로 308 로
 * 넘어오므로 검색에 쌓인 것을 잃지 않는다.
 *
 * 페이지 전용 CSS 는 원본의 <style> 블록을 문자열로 들고 있다. 파일로 빼면
 * 로드 순서가 바뀌어 우선순위가 달라진다. 이관 판정이 끝난 뒤에 정리한다.
 */
{todo_block}
const PATH = '{clean_path}'
{consts_block}
const PAGE_CSS = `
{css}
`

export default function Page() {{
  return (
    <>
      <SiteHeader currentPath={{PATH}} />

{jsx}

{chr(10).join(scripts)}

      <SiteFooter />
    </>
  )
}}
'''
    # 홈만 자리가 다르다. `/index.php` 를 폴더로 만들면 홈이 둘이 된다
    # (`/` 와 `/index.php`). 옛 주소는 `/` 로 넘기는 308 만 남기고, 화면은
    # 뿌리에 둔다 — next.config.mjs 의 리다이렉트와 짝이다.
    if path.lstrip("/") == "index.php":
        dest = ROOT / "web" / "app" / "page.tsx"
    else:
        # 폴더 이름에서 `.php` 를 뗀다. 옛 주소는 리다이렉트가 받는다.
        dest = ROOT / "web" / "app" / clean_path.lstrip("/") / "page.tsx"
    # 결과 전체에 한 번 건다. PAGE_CSS 의 `url(...)`, JSX 의 src·href,
    # 인라인 스크립트가 모두 한 문자열 안에 들어 있다.
    out = use_opt_images(out)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(out)
    print(f"→ {dest.relative_to(ROOT)}")
    # 목록에 안 넣으면 옛 주소가 404 가 되고, 대조 대상에서도 빠진다.
    routes = ROOT / "web" / "lib" / "phpRoutes.mjs"
    if clean_path != "/" and f"'{clean_path}'" not in routes.read_text():
        print(f"!! lib/phpRoutes.mjs 의 CLEAN_PATHS 에 '{clean_path}' 을 넣어라 — "
              "안 넣으면 옛 주소가 404 가 되고 대조 대상에서도 빠진다")
    if todo:
        print(f"  손으로 처리할 것 {len(todo)}건:")
        for t in todo:
            print(f"    - {t}")


if __name__ == "__main__":
    main()
