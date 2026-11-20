# Gcalls Shell Mobile

Ứng dụng di động Gcalls (`co.gcalls.shell`) cho Android và iOS, viết bằng React Native. Ứng dụng là lớp vỏ native bọc một WebView chạy softphone web (f-callbox). Lớp vỏ lo phần native: deep link `tel:`/`gcalls:`, danh bạ, âm thanh, CallKit, thông báo.

## Cấu trúc

```text
.
├── 1config.tar.gz.gpg   # cấu hình + chứng chỉ build đã mã hoá (gpg AES256); bản rõ 1config/ không bao giờ commit
├── docs/                # tài liệu dự án (SECRETS.md: danh mục secret, không chứa giá trị)
├── scripts/
└── src/                 # mã nguồn React Native
    ├── App.tsx
    ├── android/         # project Android + fastlane
    └── ios/             # project Xcode + fastlane
```

## Yêu cầu môi trường

| Công cụ | Phiên bản hiện tại (RN 0.71) |
| --- | --- |
| Node.js | 18 LTS |
| JDK | 11 |
| Android SDK | API 33 |
| Xcode | 26.x (bắt buộc để upload App Store) |
| Ruby / Bundler | theo `src/ios/Gemfile.lock` |
| CocoaPods | theo `src/ios/Podfile.lock` |

Các phiên bản trên sẽ được nâng cùng đợt nâng cấp React Native (xem `CHANGELOG.md`).

## Cài đặt local

1. Xin owner passphrase của bundle cấu hình. Passphrase lưu trong password manager của công ty.
2. Giải mã cấu hình và đặt file vào đúng chỗ:

   ```bash
   export ONECONFIG_GPG_PASSPHRASE='<passphrase>'
   gpg --batch --yes --quiet --pinentry-mode loopback --decrypt \
       --passphrase "$ONECONFIG_GPG_PASSPHRASE" 1config.tar.gz.gpg | tar -xz
   bash 1config/cp.sh internal           # Windows: powershell -File 1config\cp.ps1 -Mode internal
   ```

3. Cài dependency và chạy:

   ```bash
   cd src
   npm install
   (cd ios && bundle install && bundle exec pod install)   # chỉ trên macOS
   npm run android      # hoặc: npm run ios
   ```

Xoá các file cấu hình đã copy vào `src/`: `bash 1config/cp.sh --clean`.

## Phát hành

Việc phát hành chạy bằng GitHub Actions và fastlane:

- Android: lane `demo` (Firebase App Distribution + Play internal) và `production`.
- iOS: lane `test` (TestFlight) và `release` (App Store).

Mọi khoá và chứng chỉ được nạp từ bundle `1config` đã giải mã. Không ai build release thủ công trên máy cá nhân.

## Bảo mật

- Không commit secret, chứng chỉ, khoá hay dữ liệu cá nhân. `.gitignore` đã chặn các mẫu phổ biến, và GitHub push protection được bật.
- Báo lỗ hổng: xem [SECURITY.md](SECURITY.md).

## Giấy phép

Mã nguồn được công bố để tham khảo. Mọi quyền thuộc về chủ sở hữu, xem [LICENSE](LICENSE).
