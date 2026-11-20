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

| File trong `1config/` | Copy tới | Chứa | Nhạy cảm | Rotate gần nhất |
| --- | --- | --- | --- | --- |
| `env/internal.env`, `env/production.env` | `src/.env` | `BASE_URL` | Thấp | — |
| `android/google-services.json` | `src/android/app/` | Cấu hình Firebase Android (API key cần giới hạn theo package + SHA) | Trung bình | — |
| `android/keystore.properties` | `src/android/` | `storeFile`, `storePassword`, `keyAlias`, `keyPassword` | **Cao** | — |
| `android/gcallsshell-key.keystore` | `src/android/app/` | Upload keystore Android | **Cao** | — |
| `android/fastlane.env` | `src/android/fastlane/.env` | `APP_ID`, `FIREBASE_ANDROID_APP_ID`, `FIREBASE_TESTER_GROUPS` | Thấp | — |
| `android/play-service-account.json` | `src/android/fastlane/secure/` | Service account Google Play Developer API | **Cao** | — |
| `android/firebase-service-account.json` | `src/android/fastlane/secure/` | Service account Firebase App Distribution | **Cao** | — |
| `ios/fastlane.env` | `src/ios/fastlane/.env` | `APPLE_TEAM_ID`, `ASC_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `TESTFLIGHT_GROUPS`, `MATCH_GIT_URL`, `MATCH_PASSWORD`, `MATCH_GIT_BASIC_AUTHORIZATION`, `APP_REVIEW_*` | **Cao** | — |
| `ios/AuthKey.p8` | `src/ios/fastlane/secure/` | App Store Connect API key | **Cao** | — |

## Lịch rotate

- Hằng năm, và **ngay lập tức** khi có người rời dự án hoặc nghi ngờ bị lộ.
- Sau khi rotate:
  1. Cập nhật vault, rồi cập nhật file trong `1config/`.
  2. Mã hoá lại bundle và commit `1config.tar.gpg`.
  3. Ghi ngày vào bảng trên.
- Khi rotate `ONECONFIG_GPG_PASSPHRASE`: cập nhật GitHub Environment secret, rồi báo cho các lập trình viên đang có passphrase cũ.
