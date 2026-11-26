#!/usr/bin/env python3
"""ios_adhoc_profile.py – chuẩn bị provisioning profile "Omnibox Ad Hoc" cho kênh Ad Hoc (CI macOS, nhánh dev/test).

  - Lấy mọi iPhone/iPad đang ENABLED trong Certificates, Identifiers & Profiles → Devices
    (thêm thiết bị: bash 1config/appconnect/asc-device.sh add "<tên>" <UDID>)
  - Profile cùng tên còn ACTIVE, đủ thiết bị và đúng chứng chỉ (1config/ios/signing.env CERT_ID) → dùng lại;
    ngược lại xoá rồi tạo mới
  - Cài vào ~/Library/MobileDevice/Provisioning Profiles và ghi ADHOC_PROFILE=<tên> vào $GITHUB_ENV
Chưa có thiết bị nào → cảnh báo và bỏ qua (không lỗi job).
Cách dùng:  python3 -I scripts/ios_adhoc_profile.py
"""
import base64, os, subprocess, sys, tempfile, urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import store_sync_ios as s  # noqa: E402

NAME = "Omnibox Ad Hoc"


def env_file(path):
    out = {}
    for line in open(path, encoding="utf-8"):
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.rstrip("\n").split("=", 1)
            out[k.strip()] = v
    return out


def main():
    cert_id = env_file(os.path.join(s.ROOT, "1config/ios/signing.env"))["CERT_ID"]
    devices = s.call("GET", "/v1/devices?limit=200&filter[platform]=IOS&filter[status]=ENABLED&fields[devices]=name")["data"]
    if not devices:
        print("::warning::Chưa có iPhone nào được đăng ký (Devices) – bỏ qua bản Ad Hoc. "
              "Thêm thiết bị: bash 1config/appconnect/asc-device.sh add \"<tên>\" <UDID>")
        return
    want = {d["id"] for d in devices}
    print(f"{len(want)} thiết bị: " + ", ".join(d["attributes"]["name"] for d in devices))
    bid = s.call("GET", f"/v1/bundleIds?filter[identifier]={s.IOS_ENV['APP_ID']}&fields[bundleIds]=identifier")["data"]
    bid = next(b["id"] for b in bid if b["attributes"]["identifier"] == s.IOS_ENV["APP_ID"])

    content = None
    for p in s.call("GET", f"/v1/profiles?filter[name]={urllib.parse.quote(NAME)}&limit=20")["data"]:
        have = {d["id"] for d in s.call("GET", f"/v1/profiles/{p['id']}/devices?limit=200")["data"]}
        certs = {c["id"] for c in s.call("GET", f"/v1/profiles/{p['id']}/certificates?limit=20")["data"]}
        if content is None and p["attributes"]["profileState"] == "ACTIVE" and have == want and cert_id in certs:
            content = p["attributes"]["profileContent"]
            print(f"Dùng lại profile {NAME} ({p['id']}), hạn {p['attributes']['expirationDate'][:10]}")
        else:
            s.call("DELETE", f"/v1/profiles/{p['id']}")
            print(f"  xoá profile cũ {p['id']} (thiết bị/chứng chỉ đã đổi)")
    if content is None:
        p = s.call("POST", "/v1/profiles", {"data": {"type": "profiles",
                   "attributes": {"name": NAME, "profileType": "IOS_APP_ADHOC"},
                   "relationships": {"bundleId": s.rel("bundleIds", bid),
                                     "certificates": {"data": [{"type": "certificates", "id": cert_id}]},
                                     "devices": {"data": [{"type": "devices", "id": i} for i in sorted(want)]}}}})["data"]
        content = p["attributes"]["profileContent"]
        print(f"Đã tạo profile {NAME} ({p['id']}), hạn {p['attributes']['expirationDate'][:10]}")

    raw = base64.b64decode(content)
    with tempfile.NamedTemporaryFile(suffix=".mobileprovision", delete=False) as f:
        f.write(raw)
    uuid = subprocess.run(f'security cms -D -i "{f.name}" | plutil -extract UUID raw -o - -', shell=True,
                          check=True, capture_output=True, text=True).stdout.strip()
    dest = os.path.expanduser(f"~/Library/MobileDevice/Provisioning Profiles/{uuid}.mobileprovision")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    os.replace(f.name, dest)
    print(f"Đã cài profile {NAME} ({uuid})")
    if os.environ.get("GITHUB_ENV"):
        with open(os.environ["GITHUB_ENV"], "a") as g:
            g.write(f"ADHOC_PROFILE={NAME}\n")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as e:
        print(f"::warning::Không chuẩn bị được profile Ad Hoc: {e}")
