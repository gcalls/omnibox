#!/usr/bin/env bash
# =====================================================================================
#  1config/cp.sh – copy file cấu hình / chứng chỉ / .env từ 1config/ vào đúng vị trí trong src/
#  Chỉ copy, không sinh hay biến đổi nội dung. Mọi file đích đều bị .gitignore chặn.
#
#  Cách dùng (chạy ở bất kỳ đâu):
#    bash 1config/cp.sh [internal|production] [--strict]
#    bash 1config/cp.sh --clean
#
#    internal    (mặc định) src/.env  ← 1config/env/internal.env
#    production  src/.env  ← 1config/env/production.env
#    --strict    thoát lỗi nếu thiếu file bắt buộc hoặc file còn chứa "<TODO" (dùng trong CI)
#    --clean     xoá mọi file đã copy vào src/
#  Tương thích bash 3.2 (macOS), Linux và Git Bash (Windows).
# =====================================================================================
set -euo pipefail

CONFIG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$CONFIG_DIR/.." && pwd)"

MODE="internal"; STRICT=0; CLEAN=0
for arg in "$@"; do
  case "$arg" in
    internal|production) MODE="$arg" ;;
    --strict) STRICT=1 ;;
    --clean)  CLEAN=1 ;;
    -h|--help) sed -n '2,15p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "Tham số không hợp lệ: $arg" >&2; exit 2 ;;
  esac
done

# -------------------------------------------------------------------------------------
# Bảng ánh xạ: "nguồn (trong 1config/) | đích (tính từ gốc repo) | mức"
#   required = cần cho mọi bản build (kể cả debug)
#   release  = cần khi build/phát hành bản release
#   optional = chỉ copy nếu có
# Giữ đồng bộ với cp.ps1 và mục "1config – file đã copy" trong ../.gitignore
# -------------------------------------------------------------------------------------
MAP="
env/$MODE.env|src/.env|required
android/google-services.json|src/android/app/google-services.json|required
android/keystore.properties|src/android/keystore.properties|release
android/gcallsshell-key.keystore|src/android/app/gcallsshell-key.keystore|release
android/fastlane.env|src/android/fastlane/.env|release
android/play-service-account.json|src/android/fastlane/secure/play-service-account.json|release
android/firebase-service-account.json|src/android/fastlane/secure/firebase-service-account.json|release
ios/fastlane.env|src/ios/fastlane/.env|release
ios/AuthKey.p8|src/ios/fastlane/secure/AuthKey.p8|release
ios/GoogleService-Info.plist|src/ios/Gcalls/GoogleService-Info.plist|optional
"

if [ "$CLEAN" -eq 1 ]; then
  echo "Xoá file đã copy từ 1config/ ..."
  echo "$MAP" | while IFS='|' read -r src dst level; do
    [ -n "$src" ] || continue
    if [ -f "$ROOT_DIR/$dst" ]; then rm -f "$ROOT_DIR/$dst"; echo "  xoá  $dst"; fi
  done
  for d in src/android/fastlane/secure src/ios/fastlane/secure; do
    rmdir "$ROOT_DIR/$d" 2>/dev/null || true
  done
  echo "Xong."
  exit 0
fi

echo "1config/cp.sh – chế độ: $MODE"
PROBLEMS=0
COPIED=0
# Dùng file tạm thay cho pipe để biến đếm không bị mất trong subshell
LIST="$(mktemp)"; trap 'rm -f "$LIST"' EXIT
echo "$MAP" > "$LIST"
while IFS='|' read -r src dst level; do
  [ -n "$src" ] || continue
  from="$CONFIG_DIR/$src"; to="$ROOT_DIR/$dst"
  if [ -f "$from" ]; then
    mkdir -p "$(dirname "$to")"
    cp "$from" "$to"
    chmod 600 "$to" 2>/dev/null || true
    COPIED=$((COPIED + 1))
    echo "  copy  1config/$src -> $dst"
    if grep -q "<TODO" "$from" 2>/dev/null; then
      echo "  [CẢNH BÁO] 1config/$src còn giá trị <TODO>" >&2
      PROBLEMS=$((PROBLEMS + 1))
    fi
  else
    case "$level" in
      optional) ;;
      *) echo "  [CẢNH BÁO] thiếu 1config/$src ($level)" >&2; PROBLEMS=$((PROBLEMS + 1)) ;;
    esac
  fi
done < "$LIST"

echo "Đã copy $COPIED file, $PROBLEMS cảnh báo."
if [ "$STRICT" -eq 1 ] && [ "$PROBLEMS" -gt 0 ]; then
  echo "--strict: dừng vì còn cảnh báo." >&2
  exit 1
fi
