#!/usr/bin/env bash
# =====================================================================================
#  store-sync-android.sh – đồng bộ trang Google Play từ shell-mobile/store/ (không fastlane):
#    store/android/listings/<lang>/{title,short_description,full_description}.txt
#    store/android/images/{icon.png (512x512), feature_graphic.png (1024x500)}
#    store/android/images/phone_screenshots/*.png (nếu có)
#    store/store.env: CONTACT_EMAIL, CONTACT_WEBSITE
#  Dùng Google Play Developer API qua 1config/chplay (service account play-publisher).
#  Cách dùng:  bash scripts/store-sync-android.sh [--dry-run]
# =====================================================================================
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STORE="$ROOT/store"; DRY=0; [ "${1:-}" = "--dry-run" ] && DRY=1
source "$ROOT/1config/chplay/env.sh"
set -a; source "$STORE/store.env"; set +a
PLAY_TOKEN="$(play_token)"
API="$PLAY_API/$PLAY_PACKAGE_NAME"
UPLOAD="https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/$PLAY_PACKAGE_NAME"
call() {  # call <METHOD> <url> [json] → in JSON, thoát nếu lỗi
  local out; out="$(curl -gsS -X "$1" -H "Authorization: Bearer $PLAY_TOKEN" ${3:+-H "Content-Type: application/json" -d "$3"} "$2")"
  if echo "$out" | grep -q '"error"'; then echo "LỖI $1 ${2#$API}: $(echo "$out" | python3 -c 'import json,sys;print(json.load(sys.stdin)["error"]["message"])')" >&2; return 1; fi
  echo "$out"
}
json() { python3 -I -c 'import json,sys; print(json.dumps(dict(zip(sys.argv[1::2], sys.argv[2::2]))))' "$@"; }

edit="$(call POST "$API/edits" '{}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')"
trap '[ -n "${committed:-}" ] || curl -gsS -X DELETE -H "Authorization: Bearer $PLAY_TOKEN" "$API/edits/$edit" >/dev/null 2>&1' EXIT
echo "Google Play $PLAY_PACKAGE_NAME – edit ${edit:0:8}…"

call PATCH "$API/edits/$edit/details" "$(json contactEmail "$CONTACT_EMAIL" contactWebsite "$CONTACT_WEBSITE")" >/dev/null
echo "  ✔ email liên hệ $CONTACT_EMAIL, website $CONTACT_WEBSITE"

for dir in "$STORE"/android/listings/*/; do
  lang="$(basename "$dir")"
  body="$(json language "$lang" title "$(cat "$dir/title.txt")" shortDescription "$(cat "$dir/short_description.txt")" fullDescription "$(cat "$dir/full_description.txt")")"
  call PUT "$API/edits/$edit/listings/$lang" "$body" >/dev/null
  echo "  ✔ listing $lang: $(cat "$dir/title.txt")"
  for kind in icon:icon.png featureGraphic:feature_graphic.png; do
    type="${kind%%:*}"; file="$STORE/android/images/${kind#*:}"
    [ -f "$file" ] || continue
    call DELETE "$API/edits/$edit/listings/$lang/$type" >/dev/null || true
    curl -gsS -X POST -H "Authorization: Bearer $PLAY_TOKEN" -H "Content-Type: image/png" --data-binary "@$file" \
      "$UPLOAD/edits/$edit/listings/$lang/$type?uploadType=media" | grep -q '"image"' && echo "    ✔ $type" || echo "    ✖ $type" >&2
  done
  shots=("$STORE"/android/images/phone_screenshots/*.png)
  if [ -f "${shots[0]}" ]; then
    call DELETE "$API/edits/$edit/listings/$lang/phoneScreenshots" >/dev/null || true
    for f in "${shots[@]}"; do
      curl -gsS -X POST -H "Authorization: Bearer $PLAY_TOKEN" -H "Content-Type: image/png" --data-binary "@$f" \
        "$UPLOAD/edits/$edit/listings/$lang/phoneScreenshots?uploadType=media" >/dev/null && echo "    ✔ screenshot $(basename "$f")"
    done
  fi
done

if [ "$DRY" = 1 ]; then echo "--dry-run: không commit (edit bị huỷ)"; exit 0; fi
# changesNotSentForReview=false: thay đổi được gửi duyệt cùng bản phát hành kế tiếp
if call POST "$API/edits/$edit:commit" >/dev/null; then committed=1; echo "✔ Đã lưu trang Google Play"; else exit 1; fi
