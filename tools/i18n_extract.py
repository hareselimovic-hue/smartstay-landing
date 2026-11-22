# Extracts translatable units from the Bosnian pages into i18n/units/<page>.json
# ({hash: bosnian_text}); a unit shared by several pages is listed under the first page only.
# Units: element innerHTML (inline markup kept), attributes, JSON-LD strings, inline-script strings.
# Run from the repo root:  python tools/i18n_extract.py
import re, json, sys, hashlib, os

sys.stdout.reconfigure(encoding="utf-8")
PAGES = [
    "index.html", "apartmani/index.html", "hoteli/index.html", "resursi/index.html",
    "resursi/kucni-red-za-apartmane/index.html", "resursi/upute-za-goste/index.html",
    "resursi/self-check-in/index.html", "resursi/checklista-za-pripremu-apartmana/index.html",
    "resursi/automatske-poruke-airbnb-booking/index.html",
]
TEXT_TAGS = "title|p|h1|h2|h3|h4|h5|h6|li|a|button|span|summary|td|th|label|em|strong|small|figcaption|option|dt|dd|blockquote|b|i|div"
BLOCK = re.compile(r"<(p|div|ul|ol|li|section|table|h[1-6]|details|form|nav|header|footer|article|blockquote|tr|img|input|select|textarea)\b", re.I)
LETTER3 = re.compile(r"[A-Za-zčćšžđČĆŠŽĐ]{2,}")
BS_LETTER = re.compile(r"[čćšžđČĆŠŽĐ]")
ATTRS = ["alt", "placeholder", "aria-label", "title", "content", "data-title", "value"]
SCRIPT_STR = re.compile(r"""(['"])((?:(?!\1)[^\\\n]|\\.){4,}?)\1""")
ELEMENT_RE = re.compile(r"(?=<(%s)\b[^>]*>(.*?)</\1>)" % TEXT_TAGS, re.S)


def h(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:8]


def strip_scripts(s):
    return re.sub(r"<(script|style)[^>]*>.*?</\1>", lambda m: " " * len(m.group(0)), s, flags=re.S)


def element_units(s):
    """innerHTML strings of inline-only text elements (nested elements yield their own units too)"""
    out = []
    for m in ELEMENT_RE.finditer(strip_scripts(s)):
        inner = m.group(2)
        if BLOCK.search(inner):
            continue
        plain = re.sub(r"<[^>]+>", "", inner)
        if not LETTER3.search(plain):
            continue
        t = inner.strip()
        if t and len(t) < 1500:
            out.append(t)
    return out


def attr_units(s):
    out = []
    nos = strip_scripts(s)
    for a in ATTRS:
        for m in re.finditer(r'\b%s="([^"]*)"' % a, nos):
            v = m.group(1).strip()
            if not LETTER3.search(v) or v.startswith(("http", "/", "width=", "#", "0px")):
                continue
            if " " in v or a in ("alt", "placeholder", "aria-label"):
                out.append(v)
    return out


def walk_json(v, out):
    if isinstance(v, str):
        if LETTER3.search(v) and " " in v and not v.startswith("http"):
            out.append(v)
    elif isinstance(v, list):
        for x in v:
            walk_json(x, out)
    elif isinstance(v, dict):
        for k, x in v.items():
            if k in ("@type", "@context", "url", "logo", "image", "priceCurrency", "price", "lowPrice", "highPrice", "applicationCategory", "operatingSystem", "inLanguage", "datePublished", "dateModified"):
                continue
            walk_json(x, out)


def jsonld_units(s):
    out = []
    for m in re.finditer(r"<script[^>]*ld\+json[^>]*>(.*?)</script>", s, re.S):
        try:
            walk_json(json.loads(m.group(1)), out)
        except Exception as e:
            print("JSON-LD parse error:", e)
    return out


def script_units(s):
    out = []
    for m in re.finditer(r"<script(?![^>]*ld\+json)[^>]*>(.*?)</script>", s, re.S):
        for q, v in SCRIPT_STR.findall(m.group(1)):
            if re.search(r"[{}();]|^[#./]|^\d", v):
                continue
            if BS_LETTER.search(v) or (len(v.split()) >= 3 and LETTER3.search(v)):
                out.append(v)
    return out


def units_for(s):
    return element_units(s) + attr_units(s) + jsonld_units(s) + script_units(s)


if __name__ == "__main__":
    os.makedirs("i18n/units", exist_ok=True)
    seen = set()
    total = 0
    for p in PAGES:
        s = open(p, encoding="utf-8").read()
        page_units = {}
        for u in units_for(s):
            k = h(u)
            if k in seen:
                continue
            seen.add(k)
            page_units[k] = u
        name = p.replace("/index.html", "").replace("index.html", "home").replace("/", "__")
        json.dump(page_units, open(f"i18n/units/{name}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        total += len(page_units)
        print(f"{name:45s} {len(page_units):4d} units  {sum(len(u) for u in page_units.values()):6d} chars")
    print("total", total)
