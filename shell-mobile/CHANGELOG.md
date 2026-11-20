# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). Phiên bản theo [SemVer](https://semver.org/lang/vi/).

## [Unreleased]

### Bảo mật

- Gỡ khỏi repo: chứng chỉ, provisioning profile, dSYM, `google-services.json`, thông tin App Review và danh sách tester. Các file này chuyển vào bundle cấu hình `1config` (mã hoá gpg).
- fastlane (Android/iOS), `Matchfile` và cấu hình ký Android chuyển sang đọc file `.env`, `keystore.properties` và `fastlane/secure/*`, do `1config/cp.sh`/`cp.ps1` copy từ bundle `1config` vào. GitHub Actions chỉ cần 1 secret: `ONECONFIG_GPG_PASSPHRASE`.
- Xác thực App Store Connect chuyển sang API key, không dùng Apple ID cá nhân.
- Pipeline GitLab: xoá các lệnh in secret ra log, đánh dấu deprecated.

### Thay đổi

- CI/CD GitHub Actions `.github/workflows/shell-mobile.yml` (gốc omnibox, không dùng fastlane): build Android/iOS khi merge vào `main`/`test` có thay đổi tương ứng trong `shell-mobile/`, đăng file lên gist "omnibox builds". `.github/` chuyển lên gốc monorepo.
- Tên file build: `{branch}-{version}.{apk|aab|ipa}` (Gradle, fastlane, `scripts/ios-build-unsigned.sh`).
- Gradle wrapper về 7.5.1 (khớp AGP 7.3.1 / RN 0.71); thêm `react-native-dotenv` vào devDependencies; commit `package-lock.json`.
- Vá URL tải boost (jfrog đã ngừng) bằng `patch-package`; Podfile thêm cờ cho Xcode 15+.
- `1config`: `BASE_URL` = `https://callbox.gcalls.co` (internal + production); `keystore.properties` tạm ký bằng `debug.keystore`.

- `.gitignore` gộp về gốc repo, chặn secret, file build, file của OS/IDE. Lockfile được commit.
- Xoá code thử nghiệm `TestNativeIosModule/`.
- Thêm `README.md`, `LICENSE`, `SECURITY.md`, `CODEOWNERS`, `docs/SECRETS.md`, `src/.env.example`.
