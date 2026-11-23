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
- Tên file: `{branch}-{version}.{apk|ipa}`, ví dụ `main-1.0.apk`, `main-2.5.ipa`.
- File được đăng lên gist chung "omnibox builds"; link tải nằm trong Summary của lần chạy workflow.
- Có thể chạy tay: Actions → shell-mobile → Run workflow.
- Secret cần có: `ONECONFIG_GPG_PASSPHRASE`, `GIST_TOKEN` (xem [docs/SECRETS.md](docs/SECRETS.md)).

Nhánh `main` còn phát hành bằng GitHub Marketplace actions (không fastlane):

- Android → Firebase App Distribution (`wzieba/Firebase-Distribution-Github-Action`) và Google Play (`r0adkll/upload-google-play`, bật bằng `PLAY_UPLOAD=true` trong `1config/android/app.env`).
- iOS → TestFlight (`apple-actions/import-codesign-certs`, `apple-actions/upload-testflight-build`) khi `1config/ios/` có bộ ký do `1config/appconnect/asc-signing.sh` tạo.

Quản lý từ terminal: `1config/chplay/` (Google Play Developer API), `1config/appconnect/` (App Store Connect API).

## Bảo mật

- Không commit secret, chứng chỉ, khoá hay dữ liệu cá nhân. `.gitignore` đã chặn các mẫu phổ biến, và GitHub push protection được bật.
- Báo lỗ hổng: xem [SECURITY.md](SECURITY.md).

## Giấy phép

Mã nguồn được công bố để tham khảo. Mọi quyền thuộc về chủ sở hữu, xem [LICENSE](LICENSE).
