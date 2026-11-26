#!/usr/bin/env python3
"""ios_testflight_external.py – phát build TestFlight cho tester ngoài (CI: nhánh test), không fastlane.

  1. Chờ build <version> (<build>) xử lý xong trên App Store Connect
  2. Khai báo không dùng mã hoá ngoài miễn trừ (khớp ITSAppUsesNonExemptEncryption = NO)
  3. Ghi "What to Test" (en-US, vi)
  4. Gắn build vào nhóm TESTFLIGHT_EXTERNAL_GROUP (1config/ios/app.env, mặc định "Omnibox External")
  5. Gửi Beta App Review (bắt buộc cho tester ngoài; Apple duyệt xong tester nhận bản)
Tester nội bộ (nhóm internal, hasAccessToAllBuilds) nhận mọi build ngay sau bước 1, không cần script này.
Cách dùng:  python3 -I scripts/ios_testflight_external.py --version 1.0.1 --build 42 [--timeout 2700]
"""
import argparse, os, subprocess, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import store_sync_ios as s  # noqa: E402  (dùng chung token, call(), IOS_ENV)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", required=True)
    ap.add_argument("--build", required=True)
    ap.add_argument("--timeout", type=int, default=2700)
    a = ap.parse_args()
    app_id = s.call("GET", f"/v1/apps?filter[bundleId]={s.IOS_ENV['APP_ID']}")["data"][0]["id"]
    group_name = s.IOS_ENV.get("TESTFLIGHT_EXTERNAL_GROUP", "Omnibox External")

    # 1. Chờ build xử lý xong
    deadline, build = time.time() + a.timeout, None
    while time.time() < deadline:
        found = s.call("GET", f"/v1/builds?filter[app]={app_id}&filter[version]={a.build}"
                              f"&filter[preReleaseVersion.version]={a.version}&limit=1")["data"]
        state = found[0]["attributes"]["processingState"] if found else "CHƯA THẤY"
        print(f"Build {a.version} ({a.build}): {state}", flush=True)
        if state == "VALID":
            build = found[0]; break
        if state in ("FAILED", "INVALID"):
            sys.exit(f"Apple từ chối build {a.version} ({a.build}): {state}")
        time.sleep(60)
    if not build:
        sys.exit("Hết thời gian chờ Apple xử lý build")
    bid = build["id"]

    # 2. Mã hoá
    if build["attributes"].get("usesNonExemptEncryption") is None:
        s.call("PATCH", f"/v1/builds/{bid}", {"data": {"type": "builds", "id": bid,
               "attributes": {"usesNonExemptEncryption": False}}})

    # 3. What to Test: ghi chú phát hành (scripts/release-notes.py ghi vào 1config/store/ios/<locale>/release_notes.txt)
    sha = os.environ.get("GITHUB_SHA", "")[:7]
    notes = {}
    for loc, label in (("en-US", "build"), ("vi", "bản build")):
        f = os.path.join(s.STORE, "ios", loc, "release_notes.txt")
        body = open(f, encoding="utf-8").read().strip() if os.path.isfile(f) else f"Omnibox {a.version}"
        notes[loc] = f"{body}\n\n({label} {a.build} {sha})".strip()
    have = {x["attributes"]["locale"]: x["id"] for x in s.call("GET", f"/v1/builds/{bid}/betaBuildLocalizations")["data"]}
    for loc, text in notes.items():
        try:
            if loc in have:
                s.call("PATCH", f"/v1/betaBuildLocalizations/{have[loc]}", {"data": {"type": "betaBuildLocalizations",
                       "id": have[loc], "attributes": {"whatsNew": text}}})
            else:
                s.call("POST", "/v1/betaBuildLocalizations", {"data": {"type": "betaBuildLocalizations",
                       "attributes": {"locale": loc, "whatsNew": text}, "relationships": {"build": s.rel("builds", bid)}}})
        except RuntimeError as e:
            print(f"  (bỏ qua What to Test {loc}: {e})")

    # 4. Nhóm tester ngoài
    groups = s.call("GET", f"/v1/apps/{app_id}/betaGroups?limit=50")["data"]
    g = next((x for x in groups if x["attributes"]["name"] == group_name and not x["attributes"].get("isInternalGroup")), None)
    if not g:
        sys.exit(f"Không có nhóm tester ngoài \"{group_name}\" trên App Store Connect")
    s.call("POST", f"/v1/betaGroups/{g['id']}/relationships/builds", {"data": [{"type": "builds", "id": bid}]})
    print(f"Đã gắn build vào nhóm \"{group_name}\"")

    # 5. Beta App Review
    try:
        s.call("POST", "/v1/betaAppReviewSubmissions", {"data": {"type": "betaAppReviewSubmissions",
               "relationships": {"build": s.rel("builds", bid)}}})
        print(f"✔ Đã gửi Beta App Review cho {a.version} ({a.build}) – tester ngoài nhận bản khi Apple duyệt")
    except RuntimeError as e:
        # Đã gửi / có build khác đang chờ duyệt: không làm hỏng job, tester nội bộ vẫn có bản
        print(f"::warning::Chưa gửi được Beta App Review cho {a.version} ({a.build}): {e}")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as e:
        sys.exit(f"LỖI App Store Connect: {e}")
