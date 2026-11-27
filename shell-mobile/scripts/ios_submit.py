#!/usr/bin/env python3
"""ios_submit.py – nộp phiên bản lên App Store Review (CI: merge vào main), không fastlane.

  1. Chờ build <version> (<build>) vừa upload xử lý xong trên App Store Connect
  2. Khai báo build không dùng mã hoá ngoài miễn trừ (khớp ITSAppUsesNonExemptEncryption = NO)
  3. Đồng bộ metadata (store_sync_ios.py --version) – phải thành công
  4. Gắn build vào phiên bản App Store đang soạn, rồi tạo + gửi yêu cầu duyệt
Phát hành: theo releaseType trên App Store Connect (MANUAL: bấm Release sau khi Apple duyệt).
--no-submit (CI nhánh main): chỉ đồng bộ metadata + gắn build, KHÔNG nộp – nộp/phát hành công khai làm trên App Store Connect.
Cách dùng:  python3 -I scripts/ios_submit.py --version 1.2.3 --build 42|latest [--timeout 2700]
CI: job "Nộp App Store Review" (ios_submit) chạy mỗi lần push main – đã nộp/đã phát hành thì bỏ qua.
"""
import argparse, os, subprocess, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import store_sync_ios as s  # noqa: E402  (dùng chung token, call(), IOS_ENV)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", required=True)
    ap.add_argument("--build", required=True, help="số build, hoặc latest = build mới nhất của phiên bản")
    ap.add_argument("--timeout", type=int, default=2700)
    ap.add_argument("--no-submit", action="store_true", help="chỉ chuẩn bị phiên bản (metadata + build), không nộp duyệt")
    a = ap.parse_args()
    app_id = s.call("GET", f"/v1/apps?filter[bundleId]={s.IOS_ENV['APP_ID']}")["data"][0]["id"]

    # 0. Trạng thái phiên bản trên App Store: đang chờ duyệt / chờ phát hành → chưa nộp được; đã phát hành → xong.
    IN_FLIGHT = ("WAITING_FOR_REVIEW", "IN_REVIEW", "PENDING_DEVELOPER_RELEASE", "PENDING_APPLE_RELEASE",
                 "PROCESSING_FOR_APP_STORE", "READY_FOR_REVIEW", "WAITING_FOR_EXPORT_COMPLIANCE", "PENDING_CONTRACT", "ACCEPTED")
    allv = s.call("GET", f"/v1/apps/{app_id}/appStoreVersions?filter[platform]=IOS&limit=50")["data"]
    flying = next((v for v in allv if v["attributes"]["appStoreState"] in IN_FLIGHT), None)
    if flying:
        fv, fs = flying["attributes"]["versionString"], flying["attributes"]["appStoreState"]
        if fv == a.version:
            print(f"✔ Phiên bản {a.version} đã nộp, đang {fs} – không cần nộp lại")
        else:
            print(f"::warning::Phiên bản {fv} đang {fs} – chưa nộp {a.version}. Build có trên TestFlight; "
                  f"push main lần sau sẽ nộp khi {fv} xong (PENDING_DEVELOPER_RELEASE = bấm phát hành trên App Store Connect).")
        return
    if any(v["attributes"]["versionString"] == a.version and v["attributes"]["appStoreState"] == "READY_FOR_SALE" for v in allv):
        print(f"✔ Phiên bản {a.version} đã phát hành trên App Store – không có gì để nộp (ra bản mới: tăng \"version\" trong src/package.json)")
        return

    # 1. Chờ build xử lý xong (--build latest: build mới nhất đã upload của phiên bản này)
    deadline, build = time.time() + a.timeout, None
    while time.time() < deadline:
        q = (f"/v1/builds?filter[app]={app_id}&filter[preReleaseVersion.version]={a.version}&sort=-uploadedDate&limit=1"
             if a.build == "latest" else
             f"/v1/builds?filter[app]={app_id}&filter[version]={a.build}&filter[preReleaseVersion.version]={a.version}&limit=1")
        found = s.call("GET", q)["data"]
        state = found[0]["attributes"]["processingState"] if found else "CHƯA THẤY"
        num = found[0]["attributes"]["version"] if found else a.build
        print(f"Build {a.version} ({num}): {state}", flush=True)
        if state == "VALID":
            build = found[0]; a.build = num; break
        if state in ("FAILED", "INVALID"):
            sys.exit(f"Apple từ chối build {a.version} ({num}): {state}")
        time.sleep(60)
    if not build:
        sys.exit(f"Không có build hợp lệ của {a.version} (hết thời gian chờ hoặc chưa upload)")

    # 2. Khai báo mã hoá
    if build["attributes"].get("usesNonExemptEncryption") is None:
        s.call("PATCH", f"/v1/builds/{build['id']}", {"data": {"type": "builds", "id": build["id"],
               "attributes": {"usesNonExemptEncryption": False}}})

    # 3. Metadata
    r = subprocess.run([sys.executable, "-I", os.path.join(s.ROOT, "scripts/store_sync_ios.py"), "--version", a.version])
    if r.returncode:
        sys.exit("Metadata App Store chưa đủ (xem ✖ ở trên) – chưa nộp duyệt")
    shots = os.path.join(s.STORE, "ios", "screenshots")
    if not (os.path.isdir(shots) and os.listdir(shots)):
        print("CẢNH BÁO: 1config/store/ios/screenshots/ trống – Apple sẽ từ chối nếu phiên bản chưa có screenshot trên App Store Connect")

    # 4. Gắn build + nộp duyệt
    vers = s.call("GET", f"/v1/apps/{app_id}/appStoreVersions?filter[platform]=IOS&filter[versionString]={a.version}")["data"]
    ver_id = vers[0]["id"]
    s.call("PATCH", f"/v1/appStoreVersions/{ver_id}/relationships/build", {"data": {"type": "builds", "id": build["id"]}})
    print(f"Đã gắn build {a.build} vào phiên bản {a.version}")
    if a.no_submit:
        print(f"✔ Phiên bản {a.version} đã sẵn sàng trên App Store Connect (build {a.build}, What's New, metadata) – "
              "chưa nộp: bấm \"Add for Review\" trên App Store Connect khi muốn phát hành công khai")
        return

    subs = s.call("GET", f"/v1/reviewSubmissions?filter[app]={app_id}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW")["data"]
    sub_id = subs[0]["id"] if subs else s.call("POST", "/v1/reviewSubmissions", {"data": {"type": "reviewSubmissions",
             "attributes": {"platform": "IOS"}, "relationships": {"app": s.rel("apps", app_id)}}})["data"]["id"]
    try:
        s.call("POST", "/v1/reviewSubmissionItems", {"data": {"type": "reviewSubmissionItems",
               "relationships": {"reviewSubmission": s.rel("reviewSubmissions", sub_id),
                                 "appStoreVersion": s.rel("appStoreVersions", ver_id)}}})
    except RuntimeError as e:
        if "already" not in str(e).lower():
            raise
    s.call("PATCH", f"/v1/reviewSubmissions/{sub_id}", {"data": {"type": "reviewSubmissions", "id": sub_id,
           "attributes": {"submitted": True}}})
    print(f"✔ Đã nộp App Store Review: {a.version} ({a.build}) – phát hành theo releaseType sau khi Apple duyệt")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as e:
        sys.exit(f"LỖI App Store Connect: {e}")
