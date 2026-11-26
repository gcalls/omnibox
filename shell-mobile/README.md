# Gcalls Shell Mobile

Ứng dụng di động Gcalls (`co.gcalls.shell`) cho Android và iOS, viết bằng React Native. Ứng dụng là lớp vỏ native bọc một WebView chạy softphone web (f-callbox). Lớp vỏ lo phần native: deep link `tel:`/`gcalls:`, danh bạ, âm thanh, CallKit, thông báo.

## Cấu trúc

```text
.
├── 1config.tar.gpg      # cấu hình + chứng chỉ build đã mã hoá (gpg AES256); bản rõ 1config/ không bao giờ commit
├── docs/                # tài liệu dự án (SECRETS.md: danh mục secret, không chứa giá trị)
├── scripts/           # ci-detect-changes.sh, ios-build.sh
└── src/                 # mã nguồn React Native
    ├── App.tsx
    ├── android/         # project Android (Gradle)
    └── ios/             # project Xcode
```

## Yêu cầu môi trường

| Công cụ | Phiên bản (React Native 0.88, New Architecture) |
| --- | --- |
| Node.js | 24 (`src/.node-version`) |
| JDK | 17 |
| Android SDK | compileSdk 37, targetSdk 36, minSdk 31 (Android 12 → 17), build-tools 37, NDK 27.1 |
| Xcode | 26.x (iOS 26 SDK, bắt buộc để upload App Store); app chạy từ iOS 15.1 |
| CocoaPods | bản cài sẵn trên máy/runner macOS |

## Cài đặt local

1. Xin owner passphrase của bundle cấu hình. Passphrase lưu trong password manager của công ty.
2. Giải mã cấu hình và đặt file vào đúng chỗ:

   ```bash
   export ONECONFIG_GPG_PASSPHRASE='<passphrase>'
   gpg --batch --yes --quiet --pinentry-mode loopback --decrypt \
       --passphrase "$ONECONFIG_GPG_PASSPHRASE" 1config.tar.gpg | tar -xz
   bash 1config/cp.sh internal           # Windows: powershell -File 1config\cp.ps1 -Mode internal
   ```

3. Cài dependency và chạy:

   ```bash
   cd src
   npm install
   (cd ios && pod install)                                   # chỉ trên macOS
   npm run android      # hoặc: npm run ios
   ```

Xoá các file cấu hình đã copy vào `src/`: `bash 1config/cp.sh --clean`.

## CI/CD (GitHub Actions)

Workflow [`.github/workflows/shell-mobile.yml`](../.github/workflows/shell-mobile.yml) ở gốc repo omnibox, **không dùng fastlane**. Workflow chạy khi push/merge vào `main` hoặc `test` và có thay đổi trong `shell-mobile/`:

| Thay đổi | Build |
| --- | --- |
| `src/android/**` | Android (`.apk`, Gradle) |
| `src/ios/**` | iOS (`.ipa` không ký, `xcodebuild`) |
| phần còn lại của `src/**` (code dùng chung), `1config.tar.gpg` | cả hai |
| docs, README… | không build |

- Cấu hình: `main` → `bash 1config/cp.sh production`, `test` → `bash 1config/cp.sh internal`.
- Tên file: `{branch}-{version}.{apk|ipa}`, ví dụ `main-1.0.1.apk`, `test-1.0.1.ipa`.
- File được đăng lên gist chung "omnibox builds"; link tải nằm trong Summary của lần chạy workflow.
- Có thể chạy tay: Actions → shell-mobile → Run workflow.
- Secret cần có: `ONECONFIG_GPG_PASSPHRASE`, `GIST_TOKEN` (xem [docs/SECRETS.md](docs/SECRETS.md)).

Phát hành lên store bằng GitHub Marketplace actions và script API (không fastlane, không Firebase). Phiên bản lấy từ `"version"` trong `src/package.json` (tăng khi ra bản mới), số build là số lần chạy CI.

| Nhánh | Android | iOS |
| --- | --- | --- |
| `test` | Google Play `PLAY_TRACK` = `internal,beta`: tester nội bộ (internal) và tester ngoài (open testing) | TestFlight: tester nội bộ nhận ngay; nhóm "Omnibox External" sau Beta App Review (`scripts/ios_testflight_external.py`) |
| `main` | Google Play production – phát hành đại trà sau khi Google duyệt | TestFlight + nộp App Store Review (`scripts/ios_submit.py`; bỏ qua kèm cảnh báo nếu phiên bản khác đang chờ duyệt) |

Chỉ nền tảng có code thay đổi mới được build và phát hành: `src/android/**` → Android, `src/ios/**` → iOS, phần còn lại của `src/` (code dùng chung, kể cả `package.json`) hoặc `1config.tar.gpg` → cả hai.

- versionCode Android = `major×10000000 + minor×100000 + patch×1000 + (số lần chạy CI % 1000)`, nên MINOR và PATCH phải < 100.
- Khi khởi động, app hiện `Omnibox <version> (<build>)` dưới vòng xoay tải trang và gửi `appVersion`/`appBuild` vào WebView.
- Yêu cầu cập nhật (`src/services/appUpdate.js`): store có bản mới đổi major/minor → bắt buộc (Android: Google Play In-App Updates toàn màn hình; iOS: hộp thoại chỉ có nút Cập nhật, mở App Store); chỉ đổi patch → nhắc, cho bỏ qua. Android chỉ hoạt động với bản cài từ Google Play.

- Android dùng `r0adkll/upload-google-play` với `1config/android/play-service-account.json` (bật bằng `PLAY_UPLOAD=true`; thiếu file thì chỉ build + đăng gist).
- iOS dùng `apple-actions/import-codesign-certs`, `apple-actions/upload-testflight-build` khi `1config/ios/` có bộ ký do `1config/appconnect/asc-signing.sh` tạo.
- iOS 18.2+: Omnibox có thể làm app gọi mặc định (Settings → Apps → Default Apps → Calling) nhờ entitlement `com.apple.developer.calling-app`. App ID phải bật capability **Default Calling App** trên developer.apple.com (API không hỗ trợ) rồi chạy lại `asc-signing.sh`; profile chưa có thì `scripts/ios-build.sh` tự bỏ entitlement và cảnh báo.

Quản lý từ terminal: `1config/chplay/` (Google Play Developer API), `1config/appconnect/` (App Store Connect API).

## Bảo mật

- Không commit secret, chứng chỉ, khoá hay dữ liệu cá nhân. `.gitignore` đã chặn các mẫu phổ biến, và GitHub push protection được bật.
- Báo lỗ hổng: xem [SECURITY.md](SECURITY.md).

## Giấy phép

Mã nguồn được công bố để tham khảo. Mọi quyền thuộc về chủ sở hữu, xem [LICENSE](LICENSE).
