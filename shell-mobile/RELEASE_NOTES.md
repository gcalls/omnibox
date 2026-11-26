# Ghi chú phát hành Omnibox

Hiển thị cho người dùng trên Google Play ("Có gì mới") và App Store ("What's New"), cho tester trên TestFlight
("What to Test"). CI lấy đúng mục `## <version>` khớp `"version"` trong `src/package.json`
(`scripts/release-notes.py`), tự thêm dòng đầu "Phiên bản x.y.z" / "Version x.y.z".

Quy ước:

- Mỗi lần tăng `"version"`, thêm một mục mới **ở trên cùng**, có đủ `### vi` và `### en-US`.
- Viết cho người dùng: ngắn gọn, mỗi dòng một thay đổi, không nói chi tiết kỹ thuật.
- Mỗi ngôn ngữ tối đa khoảng 450 ký tự (Google Play giới hạn 500, đã tính dòng phiên bản).
- Merge vào `main` mà thiếu mục của phiên bản → CI dừng trước khi phát hành.

## 1.0.4

### vi

- Sửa lỗi ứng dụng bị dừng hoặc kẹt màn hình đen khi mở lại từ đa nhiệm.
- Màn hình khởi động mới: chờ tổng đài sẵn sàng rồi mới vào, không còn nháy hay màn đen.
- Lần đầu sử dụng: giải thích lý do trước khi xin quyền micro, thông báo, thiết bị lân cận; hướng dẫn bấm "Cho phép".
- Tự kết nối lại khi mất mạng hoặc trang tổng đài bị gián đoạn.

### en-US

- Fixed the app stopping or getting stuck on a black screen when reopened from recent apps.
- New startup screen: waits until the call center is ready, no more flicker or black screen.
- First launch: explains why microphone, notification and nearby-device permissions are needed and guides you to tap "Allow".
- Reconnects automatically when the network or the call center page is interrupted.

## 1.0.3

### vi

- Lần đầu mở ứng dụng: đọc hết Điều khoản dịch vụ và bấm "Đồng ý" trước khi sử dụng.
- Luôn hiển thị số phiên bản ở góc dưới bên trái màn hình.
- iPhone (iOS 18.2 trở lên): có thể chọn Omnibox làm ứng dụng gọi mặc định.
- Thông báo khi có phiên bản mới; bản nâng cấp lớn yêu cầu cập nhật để tiếp tục sử dụng.

### en-US

- First launch: read the entire Terms of Service and tap "Agree" before using the app.
- The app version is always shown in the bottom-left corner.
- iPhone (iOS 18.2 or later): Omnibox can be your default calling app.
- Notifies you when a new version is available; major upgrades must be installed to continue.

## 1.0.2

### vi

- Luôn hiển thị số phiên bản ở góc dưới bên trái màn hình.
- iPhone (iOS 18.2 trở lên): có thể chọn Omnibox làm ứng dụng gọi mặc định trong Cài đặt → Ứng dụng → Ứng dụng mặc định → Gọi.
- Thông báo khi có phiên bản mới; bản nâng cấp lớn yêu cầu cập nhật để tiếp tục sử dụng.
- Gỡ bỏ thành phần không cần thiết, ứng dụng gọn nhẹ hơn.

### en-US

- The app version is always shown in the bottom-left corner.
- iPhone (iOS 18.2 or later): Omnibox can be your default calling app in Settings → Apps → Default Apps → Calling.
- Notifies you when a new version is available; major upgrades must be installed to continue.
- Removed unused components for a lighter app.

## 1.0.1

### vi

- Hiển thị phiên bản ứng dụng trên màn hình khởi động.
- Thông báo khi có phiên bản mới; bản nâng cấp lớn yêu cầu cập nhật để tiếp tục sử dụng.
- Gỡ bỏ thành phần không cần thiết, ứng dụng gọn nhẹ hơn.

### en-US

- Shows the app version on the startup screen.
- Notifies you when a new version is available; major upgrades must be installed to continue.
- Removed unused components for a lighter app.

## 1.0

### vi

- Phiên bản đầu tiên của Omnibox: gọi điện qua tổng đài Gcalls, đồng bộ danh bạ, hỗ trợ tai nghe Bluetooth.

### en-US

- First release of Omnibox: calls through the Gcalls call center, contact sync, Bluetooth headset support.
