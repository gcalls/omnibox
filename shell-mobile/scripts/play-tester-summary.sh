#!/usr/bin/env bash
# =====================================================================================
#  play-tester-summary.sh – ghi vào Summary của lần chạy (GITHUB_STEP_SUMMARY) bảng link mời tester Android:
#  trạng thái từng track (versionCode, status) + link tham gia.
#    (test: internal + Internal App Sharing, không review; main: alpha + beta, Google duyệt; production làm tay)
#    internal  → PLAY_INTERNAL_TEST_URL trong 1config/android/app.env (Play Console → Internal testing →
#                Testers → "Copy link"; API không trả link này)
#    alpha     → https://play.google.com/apps/testing/<package> (tester phải có trong danh sách Closed testing)
#    beta      → cùng link testing, ai cũng tham gia được sau khi Google duyệt bản Open testing
#  Internal App Sharing: link do scripts/play-internal-sharing.sh ghi (biến môi trường SHARING_URL nếu có).
#  Cách dùng:  bash scripts/play-tester-summary.sh
# =====================================================================================
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT/1config/chplay/env.sh"
INTERNAL_URL="$(sed -n 's/^PLAY_INTERNAL_TEST_URL=//p' "$ROOT/1config/android/app.env")"
T="$(play_token)"; A="$PLAY_API/$PLAY_PACKAGE_NAME"
edit="$(curl -gsS -X POST -H "Authorization: Bearer $T" "$A/edits" -d '' | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')"
tracks="$(curl -gsS -H "Authorization: Bearer $T" "$A/edits/$edit/tracks")"
curl -gsS -X DELETE -H "Authorization: Bearer $T" "$A/edits/$edit" >/dev/null || true
TRACKS="$tracks" PKG="$PLAY_PACKAGE_NAME" INTERNAL_URL="$INTERNAL_URL" SHARING_URL="${SHARING_URL:-}" python3 -I - <<'PY' | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"
import json, os
pkg = os.environ["PKG"]
testing = f"https://play.google.com/apps/testing/{pkg}"
rel = {}
for t in json.loads(os.environ["TRACKS"]).get("tracks", []):
    r = (t.get("releases") or [{}])[0]
    rel[t["track"]] = f'{r.get("name", "–")} · {",".join(r.get("versionCodes", []))} · {r.get("status", "–")}'
internal = os.environ["INTERNAL_URL"] or "_chưa khai `PLAY_INTERNAL_TEST_URL` (Play Console → Internal testing → Testers → Copy link)_"
rows = [
    ("Internal testing", rel.get("internal", "–"), internal, "Nhánh test · không review · có ngay cho email trong danh sách Internal testing"),
    ("Internal App Sharing", "AAB vừa build", os.environ["SHARING_URL"] or "_xem bước Internal App Sharing_", "Nhánh test · không review · cài ngay; máy phải bật Internal app sharing trong Play Store"),
    ("Closed testing (alpha)", rel.get("alpha", "–"), testing, "Nhánh main · Google duyệt · tester trong danh sách Closed testing"),
    ("Open testing (beta)", rel.get("beta", "–"), testing, "Nhánh main · Google duyệt · ai cũng tham gia được sau khi duyệt"),
    ("Production", rel.get("production", "–"), f"https://play.google.com/store/apps/details?id={pkg}", "Không do CI đẩy – phát hành công khai trên Play Console"),
]
print("### Android – link cho tester\n")
print("| Kênh | Bản trên Play (tên · versionCode · trạng thái) | Link | Ghi chú |\n| --- | --- | --- | --- |")
for r in rows:
    print("| " + " | ".join(r) + " |")
print()
PY
