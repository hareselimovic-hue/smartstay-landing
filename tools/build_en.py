# Builds the English site (en/...) from the Bosnian pages + i18n/en/*.json translations,
# and adds hreflang links + the BS/EN switcher to the Bosnian pages (idempotent).
# Run from the repo root:  python tools/build_en.py
import re, json, os, sys, glob

sys.path.insert(0, os.path.dirname(__file__))
from i18n_extract import PAGES, h, element_units, attr_units, jsonld_units, script_units, BS_LETTER

sys.stdout.reconfigure(encoding="utf-8")
SITE = "https://smartstay.ba"
OUT = {
    "index.html": "en/index.html",
    "apartmani/index.html": "en/apartments/index.html",
    "hoteli/index.html": "en/hotels/index.html",
    "resursi/index.html": "en/resources/index.html",
    "resursi/kucni-red-za-apartmane/index.html": "en/resources/house-rules-for-apartments/index.html",
    "resursi/upute-za-goste/index.html": "en/resources/guest-instructions/index.html",
    "resursi/self-check-in/index.html": "en/resources/self-check-in/index.html",
    "resursi/checklista-za-pripremu-apartmana/index.html": "en/resources/apartment-turnover-checklist/index.html",
}
def url_of(page):  # "apartmani/index.html" -> "/apartmani/"
    return "/" + page.replace("index.html", "")
URLS = {url_of(bs): url_of(en) for bs, en in OUT.items()}  # "/apartmani/" -> "/en/apartments/"

MARK = "<!-- i18n -->"
SWITCH_CSS = MARK + """<style>
  .nav-lang { font-size:13px; font-weight:700; color:var(--navy); border:1px solid var(--border); border-radius:999px; padding:6px 11px; text-decoration:none; flex-shrink:0; letter-spacing:.03em; transition:background .2s; }
  .nav-lang:hover { background:#F7F7F5; }
  .nav-links .nav-lang-li { display:none; }
  @media (max-width: 600px) { .nav-lang { display:none; } .nav-links .nav-lang-li { display:block; border-top:1px solid var(--border); margin-top:6px; padding-top:6px; } }
</style>
"""


def load_translations():
    T = {}
    for f in sorted(glob.glob("i18n/en/*.json")):
        for k, v in json.load(open(f, encoding="utf-8")).items():
            T[k if len(k) == 8 else h(k)] = v  # keys are hashes, or the full Bosnian text
    return T


def js_quote(text, q):
    return text.replace("\\", "\\\\").replace(q, "\\" + q)


def translate(s, T, report):
    # 1) element innerHTML, longest first so outer elements win over nested ones
    units = sorted(set(element_units(s)), key=len, reverse=True)
    for u in units:
        en = T.get(h(u))
        if en is None:
            report.append(u); continue
        s = re.sub(r"(>\s*)" + re.escape(u) + r"(\s*<)", lambda m: m.group(1) + en + m.group(2), s)
    # 2) attributes
    for u in set(attr_units(s)):
        en = T.get(h(u))
        if en is None:
            report.append(u); continue
        s = s.replace('="%s"' % u, '="%s"' % en)
    # 3) JSON-LD: parse, translate every string, dump again
    def ld(m):
        try:
            data = json.loads(m.group(1))
        except Exception:
            return m.group(0)
        def walk(v):
            if isinstance(v, str):
                t = T.get(h(v))
                if t is not None: return t
                if v == "bs": return "en"
                return v
            if isinstance(v, list): return [walk(x) for x in v]
            if isinstance(v, dict): return {k: walk(x) for k, x in v.items()}
            return v
        for u in jsonld_units(m.group(0)):
            if h(u) not in T: report.append(u)
        return m.group(0)[:m.start(1) - m.start(0)] + "\n" + json.dumps(walk(data), ensure_ascii=False, indent=2) + "\n" + m.group(0)[m.end(1) - m.start(0):]
    s = re.sub(r"(?s)(?<=<script type=\"application/ld\+json\">)(.*?)(?=</script>)", lambda m: ld_wrap(m, ld), s)
    # 4) inline-script strings
    for u in set(script_units(s)):
        en = T.get(h(u))
        if en is None:
            report.append(u); continue
        s = re.sub(r"""(['"])""" + re.escape(u) + r"\1", lambda m: m.group(1) + js_quote(en, m.group(1)) + m.group(1), s)
    return s


def ld_wrap(m, ld):
    # adapter: ld() expects a match whose group(1) is the JSON text and group(0) the full block
    class M:
        def __init__(self, inner): self.inner = inner
        def group(self, i): return self.inner
        def start(self, i=0): return 0
        def end(self, i=0): return len(self.inner)
    try:
        data = json.loads(m.group(1))
    except Exception:
        return m.group(1)
    return ld.__wrapped_walk__(data) if hasattr(ld, "__wrapped_walk__") else _ld_translate(m.group(1), ld)


def _ld_translate(text, ld):
    # ld() builds on a pseudo-match; simpler: rebuild here
    return text


def translate_ld(text, T, report):
    try:
        data = json.loads(text)
    except Exception:
        return text
    def walk(v):
        if isinstance(v, str):
            t = T.get(h(v))
            if t is not None: return t
            if v == "bs": return "en"
            return v
        if isinstance(v, list): return [walk(x) for x in v]
        if isinstance(v, dict): return {k: walk(x) for k, x in v.items()}
        return v
    for u in jsonld_units('<script type="application/ld+json">' + text + "</script>"):
        if h(u) not in T: report.append(u)
    return "\n" + json.dumps(walk(data), ensure_ascii=False, indent=2) + "\n"


def rewrite_links(s):
    # internal links to the EN counterparts; assets like /apartmani/x.webp are untouched
    for bs, en in sorted(URLS.items(), key=lambda kv: -len(kv[0])):
        s = re.sub(r"""(["'])%s(?=["'#])""" % re.escape(bs), lambda m, en=en: m.group(1) + en, s)
        s = re.sub(r"""(["'])%s%s(?=["'#])""" % (re.escape(SITE), re.escape(bs)), lambda m, en=en: m.group(1) + SITE + en, s)
    return s


def alternates(bs_url, en_url):
    return (f'{MARK}<link rel="alternate" hreflang="bs" href="{SITE}{bs_url}"/>\n'
            f'  <link rel="alternate" hreflang="en" href="{SITE}{en_url}"/>\n'
            f'  <link rel="alternate" hreflang="x-default" href="{SITE}{bs_url}"/>\n  ')


def add_switcher(s, target_url, label, title, mobile_label):
    if 'class="nav-lang"' in s:
        return s
    pill = f'<a class="nav-lang" href="{target_url}" title="{title}">{label}</a>\n      '
    s = s.replace('<button class="nav-burger"', pill + '<button class="nav-burger"', 1)
    s = re.sub(r'(<ul class="nav-links"[^>]*>)(.*?)(</ul>)',
               lambda m: m.group(1) + m.group(2).rstrip() + f'\n        <li class="nav-lang-li"><a href="{target_url}">{mobile_label}</a></li>\n      ' + m.group(3),
               s, count=1, flags=re.S)
    return s


def build():
    T = load_translations()
    missing_total = 0
    for page, out in OUT.items():
        bs_url, en_url = url_of(page), url_of(out)
        src = open(page, encoding="utf-8").read()

        # ── Bosnian page: hreflang + switcher (in place, once)
        bs = src
        if MARK not in bs:
            bs = bs.replace("</head>", alternates(bs_url, en_url) + SWITCH_CSS + "</head>", 1)
            bs = add_switcher(bs, en_url, "EN", "English", "🇬🇧 English version")
            open(page, "w", encoding="utf-8", newline="").write(bs)
        # strip the BS-only additions before translating so the EN page gets its own
        base = re.sub(re.escape(MARK) + r'<link rel="alternate".*?x-default[^>]*>\n  ', "", bs, count=1, flags=re.S)
        base = base.replace(SWITCH_CSS, "", 1)
        base = re.sub(r'<a class="nav-lang"[^>]*>.*?</a>\n      ', "", base, count=1, flags=re.S)
        base = re.sub(r'\n        <li class="nav-lang-li">.*?</li>\n      ', "\n      ", base, count=1, flags=re.S)

        # ── English page
        report = []
        en = base
        en = re.sub(r"(?s)(<script type=\"application/ld\+json\">)(.*?)(</script>)", lambda m: m.group(1) + translate_ld(m.group(2), T, report) + m.group(3), en)
        en = translate(en, T, report)
        en = rewrite_links(en)
        en = en.replace('<html lang="bs"', '<html lang="en"', 1)
        en = en.replace('content="bs_BA"', 'content="en_GB"')
        en = en.replace("</head>", alternates(bs_url, en_url) + SWITCH_CSS + "</head>", 1)
        en = add_switcher(en, bs_url, "BS", "Bosanski", "🇧🇦 Bosanska verzija")
        en = en.replace("{ email, source", "{ email, lang: 'en', source")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "w", encoding="utf-8", newline="").write(en)

        missing = [u for u in dict.fromkeys(report) if BS_LETTER.search(u) or len(u.split()) >= 3]
        missing_total += len(missing)
        print(f"{out:60s} missing translations: {len(missing)}")
        for u in missing[:40]:
            print("   -", u[:110].replace("\n", " "))
    print("TOTAL missing:", missing_total)


if __name__ == "__main__":
    build()
