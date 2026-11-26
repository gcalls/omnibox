#!/usr/bin/env python3
"""release-notes.py – lấy ghi chú phát hành của một phiên bản từ RELEASE_NOTES.md và ghi vào 1config/store
(đã giải mã) để CI đưa lên store:

  1config/store/android/whatsnew/whatsnew-<locale>   → Google Play "Có gì mới" (r0adkll/upload-google-play)
  1config/store/ios/<locale>/release_notes.txt       → App Store "What's New" (store_sync_ios.py)
                                                       và TestFlight "What to Test" (ios_testflight_external.py)

Văn bản = "Phiên bản x.y.z" / "Version x.y.z" + các dòng của mục `## x.y.z` → `### <locale>`.
Cách dùng:  python3 -I scripts/release-notes.py --version 1.0.1 [--strict] [--print]
  --strict  thiếu mục phiên bản / ngôn ngữ → lỗi (CI nhánh main). Không có thì dùng câu mặc định.
"""
import argparse, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "RELEASE_NOTES.md")
STORE = os.path.join(ROOT, "1config", "store")
LOCALES = ("vi", "en-US")
HEADER = {"vi": "Phiên bản {v}", "en-US": "Version {v}"}
FALLBACK = {"vi": "- Cải thiện hiệu năng và sửa lỗi.", "en-US": "- Performance improvements and bug fixes."}
PLAY_LIMIT = 500


def parse(text):
    """{version: {locale: body}} từ các mục '## <version>' / '### <locale>'."""
    out, ver, loc = {}, None, None
    for line in text.splitlines():
        m2 = re.match(r"^##\s+(\S+)\s*$", line)
        m3 = re.match(r"^###\s+(\S+)\s*$", line)
        if m2:
            ver, loc = m2.group(1), None
            out.setdefault(ver, {})
        elif m3 and ver:
            loc = m3.group(1)
            out[ver].setdefault(loc, [])
        elif ver and loc:
            out[ver][loc].append(line)
    return {v: {l: "\n".join(x).strip() for l, x in d.items()} for v, d in out.items()}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", required=True)
    ap.add_argument("--strict", action="store_true")
    ap.add_argument("--print", action="store_true", help="chỉ in, không ghi file")
    a = ap.parse_args()
    notes = parse(open(SOURCE, encoding="utf-8").read()).get(a.version, {})
    errors = []
    for loc in LOCALES:
        body = notes.get(loc, "")
        if not body:
            msg = f"RELEASE_NOTES.md thiếu mục '## {a.version}' → '### {loc}'"
            if a.strict:
                errors.append(msg); continue
            print(f"::warning::{msg} – dùng câu mặc định")
            body = FALLBACK[loc]
        text = HEADER[loc].format(v=a.version) + "\n" + body
        if len(text) > PLAY_LIMIT:
            errors.append(f"Ghi chú {a.version} [{loc}] dài {len(text)} ký tự (Google Play tối đa {PLAY_LIMIT})"); continue
        print(f"--- {loc} ({len(text)} ký tự)\n{text}")
        if a.print:
            continue
        wn = os.path.join(STORE, "android", "whatsnew"); os.makedirs(wn, exist_ok=True)
        open(os.path.join(wn, f"whatsnew-{loc}"), "w", encoding="utf-8").write(text + "\n")
        ios = os.path.join(STORE, "ios", loc); os.makedirs(ios, exist_ok=True)
        open(os.path.join(ios, "release_notes.txt"), "w", encoding="utf-8").write(text + "\n")
    if errors:
        for e in errors:
            print(f"::error::{e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
