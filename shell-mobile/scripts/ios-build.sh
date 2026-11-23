#!/usr/bin/env bash
# =====================================================================================
#  ios-build.sh – build iOS bằng xcodebuild (không dùng fastlane).
#  Kết quả: $OUT_DIR/{branch}-{MARKETING_VERSION}.ipa (mặc định OUT_DIR=shell-mobile/dist)
#
#  SIGNED=1  ký bằng chứng chỉ Apple Distribution + profile "Omnibox App Store" (đã cài sẵn vào
#            keychain/máy – CI làm bằng apple-actions/import-codesign-certs), export bản App Store.
#  mặc định  IPA không ký (cài được sau khi tự ký lại, vd. Sideloadly/AltStore).
#  BUILD_NUMBER  số build (CFBundleVersion); CI truyền github.run_number. Mặc định theo project.
#  APP_VERSION   phiên bản hiển thị (CFBundleShortVersionString); CI truyền từ tag v*. Mặc định theo project.
#
#  Yêu cầu: macOS + Xcode; đã giải mã 1config, chạy `bash 1config/cp.sh <mode>`,
#  `npm ci` trong src/ và `pod install` trong src/ios/ (React Native 0.88, New Architecture).
# =====================================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS="$ROOT/src/ios"
OUT_DIR="${OUT_DIR:-$ROOT/dist}"
DERIVED="$IOS/build/DerivedData"
ARCHIVE="$IOS/build/Gcalls.xcarchive"
SIGNED="${SIGNED:-0}"

# Tên branch: biến môi trường CI trước, sau đó git. Giữ đồng bộ với android/app/build.gradle
branch=""
for k in GITHUB_HEAD_REF GITHUB_REF_NAME CI_COMMIT_BRANCH BRANCH_NAME; do
  if [ -n "${!k:-}" ]; then branch="${!k}"; break; fi
done
[ -n "$branch" ] || branch="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
{ [ -z "$branch" ] || [ "$branch" = "HEAD" ]; } && branch="detached"
branch="$(printf '%s' "$branch" | sed -E 's/[^A-Za-z0-9._-]+/-/g')"

setting() { xcodebuild -project "$IOS/Gcalls.xcodeproj" -target Gcalls -configuration Release -showBuildSettings 2>/dev/null \
            | awk -F' = ' -v k="$1" '$1 ~ "^ *"k"$" {print $2; exit}'; }
version="$(setting MARKETING_VERSION)"; bundle_id="$(setting PRODUCT_BUNDLE_IDENTIFIER)"
team="$(setting DEVELOPMENT_TEAM)"; profile="$(setting PROVISIONING_PROFILE_SPECIFIER)"
[ -n "$version" ] || { echo "Không đọc được MARKETING_VERSION" >&2; exit 1; }
name="${branch}-${version}"
extra=(); [ -n "${BUILD_NUMBER:-}" ] && extra+=("CURRENT_PROJECT_VERSION=$BUILD_NUMBER")
[ -n "${APP_VERSION:-}" ] && { extra+=("MARKETING_VERSION=$APP_VERSION"); version="$APP_VERSION"; name="${branch}-${version}"; }
[ "$SIGNED" = 1 ] || extra+=(CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="")
echo "Build iOS $bundle_id $version (build ${BUILD_NUMBER:-mặc định}) → ${name}.ipa | ký: $([ "$SIGNED" = 1 ] && echo "có, profile \"$profile\", team $team" || echo không) | $(xcodebuild -version | head -1)"

rm -rf "$ARCHIVE"
xcodebuild \
  -workspace "$IOS/Gcalls.xcworkspace" \
  -scheme Gcalls \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath "$DERIVED" \
  -archivePath "$ARCHIVE" \
  "${extra[@]}" \
  -quiet \
  archive

mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR/${name}.ipa"

if [ "$SIGNED" = 1 ]; then
  export_dir="$IOS/build/export"; rm -rf "$export_dir"
  plist="$IOS/build/ExportOptions.plist"
  cat > "$plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>teamID</key><string>$team</string>
  <key>signingStyle</key><string>manual</string>
  <key>provisioningProfiles</key><dict><key>$bundle_id</key><string>$profile</string></dict>
  <key>uploadSymbols</key><true/>
  <key>destination</key><string>export</string>
</dict></plist>
EOF
  xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportOptionsPlist "$plist" -exportPath "$export_dir" -quiet
  ipa="$(find "$export_dir" -maxdepth 1 -name '*.ipa' | head -n1)"
  [ -n "$ipa" ] || { echo "exportArchive không tạo ra .ipa" >&2; exit 1; }
  mv "$ipa" "$OUT_DIR/${name}.ipa"
else
  app="$(find "$ARCHIVE/Products/Applications" -maxdepth 1 -name '*.app' | head -n1)"
  [ -n "$app" ] || { echo "Không tìm thấy file .app trong archive" >&2; exit 1; }
  # Bản không ký: strip thêm ký hiệu debug (an toàn vì chưa có chữ ký). Bitcode Hermes đã bị xoá ở Podfile.
  exe="$app/$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$app/Info.plist")"
  for bin in "$exe" $(find "$app/Frameworks" -maxdepth 2 -type f -perm -111 2>/dev/null); do
    file "$bin" | grep -q 'Mach-O' && xcrun strip -S -x "$bin" 2>/dev/null || true
  done
  du -sh "$app"
  tmp="$(mktemp -d)"; mkdir "$tmp/Payload"; cp -R "$app" "$tmp/Payload/"
  (cd "$tmp" && zip -qry -9 "$OUT_DIR/${name}.ipa" Payload)
  rm -rf "$tmp"
fi
ls -la "$OUT_DIR/${name}.ipa"
