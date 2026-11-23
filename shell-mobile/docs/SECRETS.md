# Danh mục secret

File này **không chứa giá trị**, chỉ ghi tên, mục đích, nơi lưu và lịch rotate.

Nơi lưu giá trị thật:

1. **Password manager của công ty**, vault "Gcalls Mobile". Đây là nguồn gốc duy nhất, lưu cả bản sao các file bên dưới và passphrase.
2. **Bundle `1config.tar.gpg`** (gpg AES256, commit trong repo). Giải mã ra thư mục `1config/`, rồi `1config/cp.sh` copy từng file vào `src/`. Xem `1config/README.md`.
3. **GitHub Actions** (repository secrets của omnibox): `ONECONFIG_GPG_PASSPHRASE` và `GIST_TOKEN`.

## Secret trên GitHub Actions

| Tên | Mục đích | Phạm vi | Rotate gần nhất |
| --- | --- | --- | --- |
| `ONECONFIG_GPG_PASSPHRASE` | Giải mã `shell-mobile/1config.tar.gpg` | repository | — |
| `GIST_TOKEN` | PAT (classic, scope `gist`) để đăng file build lên gist "omnibox builds" | repository | — |

## Nội dung bundle `1config`

| File trong `1config/` | Dùng bởi | Chứa | Nhạy cảm |
| --- | --- | --- | --- |
| `env/internal.env`, `env/production.env` | `cp.sh` → `src/.env` | `BASE_URL` | Thấp |
| `android/google-services.json` | `cp.sh` → `src/android/app/` | Firebase Android (project `omnibox-515602`) | Trung bình |
| `android/omnibox-upload.keystore` + `android/keystore.properties` | `cp.sh` → `src/android/` | Upload key Android `co.gcalls.omnibox` | **Cao** |
| `android/app.env` | CI | `APP_ID`, `FIREBASE_ANDROID_APP_ID`, `FIREBASE_TESTER_GROUPS`, `PLAY_TRACK`, `PLAY_RELEASE_STATUS`, `PLAY_UPLOAD` | Thấp |
| `android/play-service-account.json` | CI, `chplay/` | `play-publisher@omnibox-515602` (Google Play Developer API) | **Cao** |
| `android/firebase-service-account.json` | CI | `firebase-app-distribution@omnibox-515602` | **Cao** |
| `ios/GoogleService-Info.plist` | `cp.sh` → `src/ios/Gcalls/` | Firebase iOS | Trung bình |
| `ios/app.env` | CI, `appconnect/` | `APP_ID`, `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `FIREBASE_IOS_APP_ID`, `APP_REVIEW_*` | Trung bình |
| `ios/AuthKey.p8` | CI, `appconnect/` | App Store Connect API key (tạo bằng gad.appl6@gcalls.co) | **Cao** |
| `ios/distribution.p12` + `ios/signing.env`, `ios/profiles/*.mobileprovision` | CI | Chứng chỉ Apple Distribution + profile (tạo bằng `appconnect/asc-signing.sh`) | **Cao** |
| `archive/co.gcalls.shell/` | — | Bộ secret của app cũ `co.gcalls.shell` | **Cao** |

## Lịch rotate

- Hằng năm, và **ngay lập tức** khi có người rời dự án hoặc nghi ngờ bị lộ.
- Sau khi rotate:
  1. Cập nhật vault, rồi cập nhật file trong `1config/`.
  2. Mã hoá lại bundle và commit `1config.tar.gpg`.
  3. Ghi ngày vào bảng trên.
- Khi rotate `ONECONFIG_GPG_PASSPHRASE`: cập nhật GitHub Environment secret, rồi báo cho các lập trình viên đang có passphrase cũ.
