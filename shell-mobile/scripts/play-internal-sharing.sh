#!/usr/bin/env bash
# =====================================================================================
#  play-internal-sharing.sh – upload AAB lên Google Play Internal App Sharing và in link cài đặt.
#  Tester mở link trên máy Android (đã bật "Internal app sharing" trong Play Store) để cài ngay,
#  không cần review và không cần nằm trong track nào.
#  Cách dùng:  bash scripts/play-internal-sharing.sh <file.aab>
#  CI ghi link vào Summary của lần chạy. Lỗi (vd. chưa cấp quyền) chỉ cảnh báo, không làm hỏng job.
# =====================================================================================
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
aab="${1:?Thiếu đường dẫn .aab}"
source "$ROOT/1config/chplay/env.sh"
T="$(play_token)"
resp="$(curl -gsS -X POST -H "Authorization: Bearer $T" -H "Content-Type: application/octet-stream" \
  --data-binary @"$aab" \
  "https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/internalappsharing/$PLAY_PACKAGE_NAME/artifacts/bundle?uploadType=media")"
url="$(printf '%s' "$resp" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("downloadUrl",""))' 2>/dev/null || true)"
if [ -z "$url" ]; then
  echo "::warning::Internal app sharing lỗi: $(printf '%s' "$resp" | head -c 400)"
  exit 0
fi
echo "Internal app sharing: $url"
# Đưa link vào bảng tester (scripts/play-tester-summary.sh đọc SHARING_URL)
[ -n "${GITHUB_ENV:-}" ] && echo "SHARING_URL=$url" >> "$GITHUB_ENV"
exit 0
