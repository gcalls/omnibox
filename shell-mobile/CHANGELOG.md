# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). Phiên bản theo [SemVer](https://semver.org/lang/vi/).

## [Unreleased]

### 1.0.4

- UAT-01 (văng / màn đen khi mở lại từ đa nhiệm):
  - `gAppStateModule.js` gọi `webViewRef.current.injectJavaScript` khi WebView chưa có → lỗi JS không bắt làm app dừng; mọi lời gọi WebView giờ kiểm tra null.
  - `MainActivity`: `super.onCreate(null)` (không khôi phục trạng thái view sau khi Android đóng tiến trình); bỏ xin `BLUETOOTH_CONNECT` mỗi lần `onStart` (trùng requestCode với PermissionsAndroid → kết quả quyền trả nhầm, yêu cầu quyền treo).
  - WebView: tiến trình render (Android) bị dừng → dựng lại; tiến trình nội dung (iOS) bị dừng → tải lại; lỗi tải → màn lỗi có nút Thử lại.
  - Không còn 4 yêu cầu quyền chạy chồng lúc khởi động.
  - Màn khởi động native tím (Android `windowBackground` + Splash Screen API, iOS LaunchScreen) – trước đây đen (DayNight) / trắng.
  - `components/Boot.tsx`: màn khởi động → cấp quyền (lần đầu) → Điều khoản (lần đầu) → callbox; màn khởi động giữ tới khi trang kế tiếp tải xong (tối đa 20 giây).
- UAT-02: màn giải thích quyền (micro, thông báo, thiết bị lân cận/Bluetooth) trước khi xin; lớp phủ tím mờ + mũi tên ngoằn ngoèo chỉ nút cho phép mỗi khi hộp thoại quyền hiện (`services/permissions.ts`, `components/PermissionOverlay.tsx`). iOS: xin micro qua `LocalStorageIosModule.requestMicrophone`.

### 1.0.3

- Lần đầu mở app sau khi cài: bắt buộc cuộn đọc hết Điều khoản dịch vụ (https://terms.gcalls.co/terms/terms-of-service, máy tiếng Việt dùng bản /vi/) mới hiện nút "Đồng ý"; đồng ý một lần (lưu `termsAcceptedVersion`) rồi vào callbox (`components/TermsGate.tsx`, bọc ở `index.js`).

### 1.0.2

- Nhãn phiên bản luôn hiện ở góc dưới trái, đè lên callbox.
- Kênh iOS Ad Hoc: `1config/appconnect/asc-device.sh` (đăng ký iPhone), `scripts/ios_adhoc_profile.py` (profile "Omnibox Ad Hoc"), `ios-build.sh` xuất `*-adhoc.ipa` + manifest, `publish-to-gist.sh` thay `{{RAW}}` và in link `itms-services`.
- Nhánh `dev`: build + đăng gist, không lên store.

### 1.0.1

- Bỏ hoàn toàn Firebase: xoá `google-services.json`, `GoogleService-Info.plist`, `firebase-service-account.json`, biến `FIREBASE_*` và bước Firebase App Distribution trong CI (app không dùng SDK Firebase nào). App chỉ phụ thuộc `callbox.gcalls.co`.
- iOS 18.2+: thêm entitlement `com.apple.developer.calling-app` để Omnibox xuất hiện trong Settings → Apps → Default Apps → Calling; `SceneDelegate` nhận số cần gọi qua `startCallHandle` (ngoài `INStartCallIntent`).
- CI: nhánh `test` → Google Play internal + open testing (beta) và TestFlight (tester nội bộ + nhóm "Omnibox External" qua Beta App Review); nhánh `main` → Google Play production + nộp App Store Review. Chỉ phát hành nền tảng có code thay đổi. Bỏ trigger tag `v*`; phiên bản lấy từ `src/package.json`; versionCode Android mã hoá major/minor/patch.
- Ghi chú phát hành theo phiên bản (`RELEASE_NOTES.md`, `scripts/release-notes.py`): CI đưa lên Google Play "Có gì mới", App Store "What's New", TestFlight "What to Test" kèm dòng "Phiên bản x.y.z". Job đồng bộ store dùng phiên bản từ `package.json` (trước đây mặc định 1.0).
- Hiện phiên bản `Omnibox <version> (<build>)` khi khởi động; yêu cầu cập nhật khi store có bản mới (bắt buộc nếu đổi major/minor, nhắc nếu chỉ đổi patch) – Android dùng Google Play In-App Updates (`com.google.android.play:app-update`), iOS dùng iTunes Lookup API.

### Bảo mật

- Gỡ khỏi repo: chứng chỉ, provisioning profile, dSYM, `google-services.json`, thông tin App Review và danh sách tester. Các file này chuyển vào bundle cấu hình `1config` (mã hoá gpg).
- fastlane (Android/iOS), `Matchfile` và cấu hình ký Android chuyển sang đọc file `.env`, `keystore.properties` và `fastlane/secure/*`, do `1config/cp.sh`/`cp.ps1` copy từ bundle `1config` vào. GitHub Actions chỉ cần 1 secret: `ONECONFIG_GPG_PASSPHRASE`.
- Xác thực App Store Connect chuyển sang API key, không dùng Apple ID cá nhân.
- Pipeline GitLab: xoá các lệnh in secret ra log, đánh dấu deprecated.

### Thay đổi

- Nâng React Native 0.71.7 → 0.88.1 (React 19, New Architecture, Node 24). Android dựng lại từ template (Kotlin, AGP/Gradle 9.4; minSdk 31, targetSdk 36, compileSdk 37); iOS dựng lại (AppDelegate/SceneDelegate Swift, iOS 15.1+, Xcode 26). Thông báo local dùng Notifee, keep-awake dùng @sayem314/react-native-keep-awake; bỏ thư viện không dùng/ngừng phát triển.
- Gọi điện: chỉ nhận link `tel:`/`gcalls:` (iOS: `gcalls:` và cuộc gọi từ danh bạ/Siri); bỏ prompt trình gọi mặc định và quyền Play hạn chế `PROCESS_OUTGOING_CALLS`, `CALL_REDIRECTION`.

- App đổi thành **Omnibox** (`co.gcalls.omnibox`, Android versionCode theo lần chạy CI, iOS 1.0): Firebase/Google Cloud project mới `omnibox-515602`, upload keystore và service account mới; bộ cũ của `co.gcalls.shell` chuyển vào `1config/archive/`. Authority/account type Android suy ra từ `applicationId` để cài song song với app cũ.
- Bỏ fastlane (Fastfile, Matchfile, Gemfile). CI phát hành bằng Marketplace actions: Firebase App Distribution, Google Play, TestFlight. Thêm `1config/chplay/` và `1config/appconnect/` để quản lý Google Play / App Store Connect qua API.
- iOS: Release ký thủ công với profile "Omnibox App Store", entitlements riêng `GcallsRelease.entitlements` (push production); xoá bitcode Hermes trong Podfile.

- CI/CD GitHub Actions `.github/workflows/shell-mobile.yml` (gốc omnibox, không dùng fastlane): build Android/iOS khi merge vào `main`/`test` có thay đổi tương ứng trong `shell-mobile/`, đăng file lên gist "omnibox builds". `.github/` chuyển lên gốc monorepo.
- Tên file build: `{branch}-{version}.{apk|aab|ipa}` (Gradle, fastlane, `scripts/ios-build-unsigned.sh`).
- Gradle wrapper về 7.5.1 (khớp AGP 7.3.1 / RN 0.71); thêm `react-native-dotenv` vào devDependencies; commit `package-lock.json`.
- Vá URL tải boost (jfrog đã ngừng) bằng `patch-package`; Podfile thêm cờ cho Xcode 15+.
- `1config`: `BASE_URL` = `https://callbox.gcalls.co` (internal + production); `keystore.properties` tạm ký bằng `debug.keystore`.

- `.gitignore` gộp về gốc repo, chặn secret, file build, file của OS/IDE. Lockfile được commit.
- Xoá code thử nghiệm `TestNativeIosModule/`.
- Thêm `README.md`, `LICENSE`, `SECURITY.md`, `CODEOWNERS`, `docs/SECRETS.md`, `src/.env.example`.
