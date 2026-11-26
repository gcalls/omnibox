# Ghi chú phát hành Omnibox

Hiển thị cho người dùng trên Google Play ("Có gì mới") và App Store ("What's New"), cho tester trên TestFlight
("What to Test"). CI lấy đúng mục `## <version>` khớp `"version"` trong `src/package.json`
(`scripts/release-notes.py`), tự thêm dòng đầu "Phiên bản x.y.z" / "Version x.y.z".

Quy ước:

- Mỗi lần tăng `"version"`, thêm một mục mới **ở trên cùng**, có đủ `### vi` và `### en-US`.
- Viết cho người dùng: ngắn gọn, mỗi dòng một thay đổi, không nói chi tiết kỹ thuật.
- Mỗi ngôn ngữ tối đa khoảng 450 ký tự (Google Play giới hạn 500, đã tính dòng phiên bản).
- Merge vào `main` mà thiếu mục của phiên bản → CI dừng trước khi phát hành.

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
