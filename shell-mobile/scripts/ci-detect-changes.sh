#!/usr/bin/env bash
# =====================================================================================
#  ci-detect-changes.sh – quyết định build Android / iOS cho workflow shell-mobile.
#
#  Quy tắc (đường dẫn tính từ gốc repo omnibox):
#    shell-mobile/src/android/**                    → Android
#    shell-mobile/src/ios/**, shell-mobile/scripts/ios-build.sh → iOS
#    shell-mobile/src/** còn lại (JS, package.json…) → cả hai (code dùng chung)
#    shell-mobile/1config.tar.gpg                   → cả hai (cấu hình dùng chung)
#    shell-mobile/store/**                          → đồng bộ metadata store (không build)
#    shell-mobile/store/<os>/screenshots.sha256     → + upload lại screenshot của hệ điều hành đó
#      (file mã băm do 1config/cp.sh ghi từ 1config/screenshots/<os>/)
#    còn lại (docs, README…)                        → không build
#  Tag v* (phát hành production): build cả hai + đồng bộ store.
#
#  Env: EVENT_NAME, BEFORE, AFTER, PLATFORM (workflow_dispatch: both|android|ios)
#  Ghi android=, ios=, store= (true|false) vào $GITHUB_OUTPUT (mặc định stdout).
# =====================================================================================
set -euo pipefail

OUT="${GITHUB_OUTPUT:-/dev/stdout}"
EVENT_NAME="${EVENT_NAME:-push}"
AFTER="${AFTER:-HEAD}"
android=false
ios=false
store=false
shots_android=false
shots_ios=false

if [[ "${GITHUB_REF:-}" == refs/tags/v* ]]; then
  android=true; ios=true; store=true
  echo "Tag phát hành ${GITHUB_REF#refs/tags/} → build cả hai + đồng bộ store"
elif [ "$EVENT_NAME" = "workflow_dispatch" ]; then
  case "${PLATFORM:-both}" in
    android) android=true ;;
    ios)     ios=true ;;
    *)       android=true; ios=true ;;
  esac
  echo "Chạy tay: platform=${PLATFORM:-both}"
elif [ -z "${BEFORE:-}" ] || [ "$BEFORE" = "0000000000000000000000000000000000000000" ] \
     || ! git cat-file -e "${BEFORE}^{commit}" 2>/dev/null; then
  # Nhánh mới hoặc force-push: không có mốc so sánh tin cậy → build cả hai
  android=true; ios=true
  echo "Không có commit mốc ($BEFORE) → build cả Android và iOS"
else
  echo "File thay đổi trong shell-mobile/ ($BEFORE..$AFTER):"
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    echo "  $f"
    case "$f" in
      shell-mobile/src/android/*)                     android=true ;;
      shell-mobile/src/ios/*|shell-mobile/scripts/ios-build.sh) ios=true ;;
      shell-mobile/src/*|shell-mobile/1config.tar.gpg) android=true; ios=true ;;
      shell-mobile/store/android/screenshots.sha256)  store=true; shots_android=true ;;
      shell-mobile/store/ios/screenshots.sha256)      store=true; shots_ios=true ;;
      shell-mobile/store/*)                           store=true ;;
    esac
  done < <(git diff --name-only "$BEFORE" "$AFTER" -- shell-mobile)
fi

echo "→ android=$android ios=$ios store=$store shots_android=$shots_android shots_ios=$shots_ios"
{
  echo "android=$android"
  echo "ios=$ios"
  echo "store=$store"
  echo "shots_android=$shots_android"
  echo "shots_ios=$shots_ios"
} >> "$OUT"
