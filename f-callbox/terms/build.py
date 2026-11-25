#!/usr/bin/env python3
"""build.py – sinh trang điều khoản HTML tĩnh (đã điền sẵn thông tin tổ chức) để host công khai.

Google Play / App Store kiểm tra URL chính sách bằng HTML thật (có thể không chạy JS), nên trang dùng
cho store phải là bản tĩnh. Bản nhúng động cho app khác dùng terms.js qua CDN (xem README.md).

  python3 build.py                                  # dùng org.json
  python3 build.py --org other-org.json --out ../public/terms
  python3 build.py --set appName="My App" --set legalName="My Co."   # ghi đè từng trường

Kết quả: <out>/index.html, <out>/<tài liệu>.html, kèm terms.js, terms.css, org.json, docs/ (để chính
bản host cũng dùng được làm nguồn nhúng).
"""
import argparse, html, json, os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = [
    ("privacy-policy", "Privacy Policy"),
    ("terms-of-service", "Terms of Service"),
    ("eula", "End User License Agreement"),
    ("acceptable-use-policy", "Acceptable Use Policy"),
    ("messaging-terms", "Messaging Terms (SMS/OTT)"),
    ("call-recording-ai-notice", "Call Recording & AI Notice"),
    ("data-deletion", "Account & Data Deletion"),
    ("cookie-policy", "Cookie Policy"),
]


def fill(text, org):
    def sub(m):
        k = m.group(1)
        if k not in org:
            return m.group(0)
        v = html.escape(str(org[k]))
        return f'<mark class="terms-todo">{v}</mark>' if "TODO" in str(org[k]) else v
    return re.sub(r"\{\{\s*([A-Za-z0-9_]+)\s*\}\}", sub, text)


def page(title, body, org, current):
    nav = "".join(f'<a href="{d}.html"{" aria-current=\"page\"" if d == current else ""}>{t}</a>' for d, t in DOCS)
    e = lambda k: html.escape(str(org.get(k, "")))
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)} – {e('appName')} by {e('brandName')}</title>
<meta name="description" content="{html.escape(title)} for {e('appName')}, provided by {e('legalName')}.">
<link rel="stylesheet" href="terms.css">
</head>
<body class="terms-page">
<div class="terms-wrap">
<header class="terms-header"><a href="{e('website')}">{e('brandName')}</a><nav class="terms-nav">{nav}</nav></header>
<main class="terms-doc" data-terms-rendered="1">
{body}
</main>
<footer class="terms-footer">{e('legalName')} · {fill('{{address}}', org)} · <a href="mailto:{e('privacyEmail')}">{e('privacyEmail')}</a> · {e('phone')}</footer>
</div>
</body>
</html>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--org", default=os.path.join(HERE, "org.json"))
    ap.add_argument("--out", default=os.path.join(HERE, "..", "public", "terms"))
    ap.add_argument("--set", action="append", default=[], metavar="KEY=VALUE")
    a = ap.parse_args()
    org = json.load(open(a.org, encoding="utf-8"))
    for kv in a.set:
        k, v = kv.split("=", 1)
        org[k] = v
    out = os.path.abspath(a.out)
    os.makedirs(out, exist_ok=True)

    for name, title in DOCS:
        body = fill(open(os.path.join(HERE, "docs", f"{name}.html"), encoding="utf-8").read(), org)
        open(os.path.join(out, f"{name}.html"), "w", encoding="utf-8").write(page(title, body, org, name))
    items = "".join(f'<li><a href="{d}.html">{t}</a></li>' for d, t in DOCS)
    index = f"<h1>Legal</h1><p class=\"terms-meta\">{{{{appName}}}} by {{{{legalName}}}} · Effective {{{{effectiveDate}}}}</p><ul>{items}</ul>"
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page("Legal", fill(index, org), org, "index"))

    for f in ("terms.js", "terms.css"):
        shutil.copy(os.path.join(HERE, f), out)
    json.dump(org, open(os.path.join(out, "org.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    shutil.copytree(os.path.join(HERE, "docs"), os.path.join(out, "docs"), dirs_exist_ok=True)

    todo = [k for k, v in org.items() if "TODO" in str(v)]
    print(f"Đã sinh {len(DOCS) + 1} trang vào {out}" + (f" – CÒN THIẾU: {', '.join(todo)}" if todo else ""))


if __name__ == "__main__":
    main()
