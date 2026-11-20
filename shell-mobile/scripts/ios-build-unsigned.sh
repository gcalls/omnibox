#!/usr/bin/env bash
# =====================================================================================
#  ios-build-unsigned.sh – build iOS bằng xcodebuild (không dùng fastlane), KHÔNG ký.
#  Kết quả: $OUT_DIR/{branch}-{MARKETING_VERSION}.ipa (mặc định OUT_DIR=shell-mobile/dist)
#
#  Yêu cầu: macOS + Xcode; đã giải mã 1config, chạy `bash 1config/cp.sh <mode>`,
#  `npm ci` trong src/ và `pod install` trong src/ios/.
#
#  IPA không ký: chỉ cài được sau khi tự ký lại (vd. bằng chứng chỉ của bạn qua Sideloadly/AltStore),
#  vì bundle 1config chưa có chứng chỉ/provisioning profile của Apple.
# =====================================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS="$ROOT/src/ios"
OUT_DIR="${OUT_DIR:-$ROOT/dist}"
DERIVED="$IOS/build/DerivedData"

# Tên branch: biến môi trường CI trước, sau đó git. Giữ đồng bộ với android/app/build.gradle
branch=""
for k in GITHUB_HEAD_REF GITHUB_REF_NAME CI_COMMIT_BRANCH BRANCH_NAME; do
  if [ -n "${!k:-}" ]; then branch="${!k}"; break; fi
done
[ -n "$branch" ] || branch="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
{ [ -z "$branch" ] || [ "$branch" = "HEAD" ]; } && branch="detached"
branch="$(printf '%s' "$branch" | sed -E 's/[^A-Za-z0-9._-]+/-/g')"

version="$(xcodebuild -project "$IOS/Gcalls.xcodeproj" -target Gcalls -configuration Release \
  -showBuildSettings 2>/dev/null | awk -F' = ' '$1 ~ /^ *MARKETING_VERSION$/ {print $2; exit}')"
[ -n "$version" ] || { echo "Không đọc được MARKETING_VERSION" >&2; exit 1; }
name="${branch}-${version}"
echo "Build iOS → ${name}.ipa (Xcode: $(xcodebuild -version | head -1))"

xcodebuild \
  -workspace "$IOS/Gcalls.xcworkspace" \
  -scheme Gcalls \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath "$DERIVED" \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" \
  -quiet \
  build

app="$(find "$DERIVED/Build/Products/Release-iphoneos" -maxdepth 1 -name '*.app' | head -n1)"
[ -n "$app" ] || { echo "Không tìm thấy file .app" >&2; exit 1; }

mkdir -p "$OUT_DIR"
tmp="$(mktemp -d)"
mkdir "$tmp/Payload"
cp -R "$app" "$tmp/Payload/"
rm -f "$OUT_DIR/${name}.ipa"
(cd "$tmp" && zip -qry "$OUT_DIR/${name}.ipa" Payload)
rm -rf "$tmp"
ls -la "$OUT_DIR/${name}.ipa"
