# Ghi chú: dọn dẹp app Gcalls cũ (`co.gcalls.shell`)

Ghi ngày 26/11/2026. Các việc còn treo, **chờ chủ dự án xác nhận** trước khi làm. Omnibox (`co.gcalls.omnibox`)
không dùng chung tài nguyên nào với app cũ: chứng chỉ, profile, API key Apple, upload keystore Android, service
account Play đều tạo mới cho Omnibox từ 23/11/2026.

## Đã làm

- iOS: app Gcalls 2.7 đã gỡ khỏi bán; App ID không dùng, 5 profile cũ, 2 khóa APNs đã xoá/thu hồi (qua Claude in Chrome).
- Ticket Apple Support **103025138915**: giải phóng 5 App ID bị giữ (`co.gcalls.shell`, `vn.gcalls.demo`,
  `co.gcalls.gvoip`, `co.gcalls.contact`, `com.gcallsreactnative`).

## Cần bổ sung vào ticket Apple 103025138915 (API trả lỗi, chỉ Apple Support làm được)

- Bản nháp **macOS 1.0** của Gcalls (app 6446264891) và Gcalls Sip Client (app 6478266693) không xoá được:
  "A new version must be created on another platform before this version can be deleted" → lý do không Remove App được.
- Chứng chỉ **Developer ID Application** `ZFSKR558S8`: "This certificate can only be revoked by Apple Developer Program Support".

## Chờ xác nhận (Claude làm bằng API sau khi có xác nhận)

1. Xoá 2 service account CI của app cũ trong Google Cloud `mobile-dev-13d1a`: `play-publisher@…`,
   `firebase-app-distribution@…`, cùng app Firebase `co.gcalls.shell` của dự án đó.
   **Không** đụng `firebase-adminsdk-*` (có thể backend đang dùng gửi push) và các app khác trong dự án:
   Sip Client (`vn.gcalls.demo`), Phone App (`com.intern.phoneapp`), GVoip (`co.gcalls.gvoip`).
   → Không xoá cả dự án `mobile-dev-13d1a`.
2. Xoá `1config/archive/co.gcalls.shell/` (gồm upload keystore cũ `gcallsshell-key.keystore`).
   **Sau bước này không thể cập nhật app Gcalls cũ được nữa.**
3. Có gỡ luôn **Gcalls Sip Client** (`vn.gcalls.demo`, iOS 1.1 + Android) không?

## Việc trên Play Console (không có API)

- App Gcalls → Cài đặt → **Gỡ xuất bản ứng dụng** (Google không cho xoá hẳn app đã phát hành). Sip Client tương tự nếu gỡ.
- Users and permissions / API access: gỡ quyền `play-publisher@mobile-dev-13d1a`, `firebase-app-distribution@mobile-dev-13d1a`.

## Mâu thuẫn cần quyết

- Kế hoạch cũ: bỏ Firebase / Google Cloud sau khi phát hành. Nhưng `https://terms.gcalls.co` (link chính sách trên
  cả hai store) đang chạy trên **Firebase Hosting** của `omnibox-515602`. Muốn bỏ Firebase thì phải chuyển trang này
  trước (GitHub Pages hoặc `callbox.gcalls.co/terms`), rồi mới dọn Firebase/Google Cloud của `omnibox-515602`
  (giữ service account `play-publisher@omnibox-515602` cho CI Google Play).
