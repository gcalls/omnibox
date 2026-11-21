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

# archive (thay vì build): bật DEPLOYMENT_POSTPROCESSING nên strip ký hiệu debug khỏi binary,
# giảm IPA từ ~150 MB xuống dưới giới hạn 100 MB/file của gist. dSYM nằm riêng trong .xcarchive.
ARCHIVE="$IOS/build/Gcalls.xcarchive"
rm -rf "$ARCHIVE"
xcodebuild \
  -workspace "$IOS/Gcalls.xcworkspace" \
  -scheme Gcalls \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath "$DERIVED" \
  -archivePath "$ARCHIVE" \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" \
  -quiet \
  archive

app="$(find "$ARCHIVE/Products/Applications" -maxdepth 1 -name '*.app' | head -n1)"
[ -n "$app" ] || { echo "Không tìm thấy file .app trong archive" >&2; exit 1; }
du -sh "$app"
echo "15 file lớn nhất trong $(basename "$app"):"
find "$app" -type f -exec du -k {} + | sort -rn | head -15 | awk '{printf "  %8.1f MB  %s\n", $1/1024, $2}'

# Strip ký hiệu debug khỏi file thực thi chính và các framework nhúng (an toàn vì IPA chưa ký)
exe="$app/$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$app/Info.plist")"
for bin in "$exe" $(find "$app/Frameworks" -maxdepth 2 -type f -perm -111 2>/dev/null); do
  if file "$bin" | grep -q 'Mach-O'; then
    before=$(du -k "$bin" | cut -f1)
    xcrun strip -S -x "$bin" 2>/dev/null || echo "  (không strip được $bin)"
    echo "  strip $(basename "$bin"): $((before / 1024)) MB → $(( $(du -k "$bin" | cut -f1) / 1024 )) MB"
  fi
done
du -sh "$app"

mkdir -p "$OUT_DIR"
tmp="$(mktemp -d)"
mkdir "$tmp/Payload"
cp -R "$app" "$tmp/Payload/"
rm -f "$OUT_DIR/${name}.ipa"
(cd "$tmp" && zip -qry -9 "$OUT_DIR/${name}.ipa" Payload)
rm -rf "$tmp"
ls -la "$OUT_DIR/${name}.ipa"
