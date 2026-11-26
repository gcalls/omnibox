#!/usr/bin/env bash
# =====================================================================================
#  play-release-status.sh – in "completed" nếu app đã có ít nhất một release được phát hành
#  trên Google Play (bất kỳ track), ngược lại in "draft".
#  Lý do: app chưa phát hành lần nào thì Play API CHỈ nhận release dạng draft – bản đầu tiên
#  phải bấm phát hành trên Play Console; từ đó CI phát hành tự động.
# =====================================================================================
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT/1config/chplay/env.sh"
# Lỗi API / phản hồi không có "tracks" → thử lại, rồi LỖI (không trả "draft" nhầm làm bản build thành nháp)
for attempt in 1 2 3; do
  T="$(play_token)"; A="$PLAY_API/$PLAY_PACKAGE_NAME"
  edit="$(curl -gsS -X POST -H "Authorization: Bearer $T" "$A/edits" -d '' | python3 -c 'import json,sys;print(json.load(sys.stdin).get("id",""))' || true)"
  if [ -n "$edit" ]; then
    out="$(curl -gsS -H "Authorization: Bearer $T" "$A/edits/$edit/tracks" | python3 -c '
import json, sys
d = json.load(sys.stdin)
if "tracks" not in d:
    sys.exit(1)
live = any(r.get("status") in ("completed", "inProgress", "halted") for t in d["tracks"] for r in t.get("releases", []))
print("completed" if live else "draft")' || true)"
    curl -gsS -X DELETE -H "Authorization: Bearer $T" "$A/edits/$edit" >/dev/null || true
    [ -n "$out" ] && { echo "$out"; exit 0; }
  fi
  sleep $((attempt * 5))
done
echo "Không đọc được track Google Play để xác định trạng thái release" >&2
exit 1
