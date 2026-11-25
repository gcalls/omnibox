# Omnibox – các mục phải khai trên giao diện (làm 1 lần)

Mọi mục khác đều đồng bộ bằng API qua CI (`scripts/store-sync-android.sh`, `scripts/play-data-safety.py`,
`scripts/store_sync_ios.py`). Các mục dưới đây **Google/Apple không có API**, nên phải làm tay một lần cho app.
Câu trả lời đã được chọn để khớp với những gì CI khai qua API (Data safety, xếp hạng độ tuổi, mô tả).

Thông tin dùng chung:

| | |
| --- | --- |
| Chính sách quyền riêng tư | `https://gcalls.co/en/chinh-sach-bao-mat/` |
| Tài khoản demo | tenant `gcalls` · `phuc.pham@gcalls.co` · mật khẩu: xem `1config/ios/app.env` (`APP_REVIEW_DEMO_PASSWORD`) |
| Người liên hệ duyệt app | Phuc Pham · Google: `phucpt+chplay@gcalls.co` · Apple: `phucpt+appconnect@gcalls.co` · +84931823685 |

## Google Play Console (app Omnibox, tài khoản `gcall`)

Menu trái **Policy and programs → App content**. Mỗi mục bấm **Start** hoặc **Manage**, điền, rồi **Save**.

| Mục | Câu trả lời |
| --- | --- |
| **Privacy policy** | URL ở bảng trên |
| **App access** (Sign-in details) | "All or some functionality in my app is restricted" → **Add instructions**: Name `Gcalls demo`; Username `phuc.pham@gcalls.co`; Password (demo); Other information: `Bước 1: nhập tenant "gcalls". Bước 2: đăng nhập bằng email/mật khẩu trên. Liên hệ: phucpt+chplay@gcalls.co, +84931823685` |
| **Ads** | No, my app does not contain ads |
| **Content rating** | Email: `phucpt+chplay@gcalls.co`; Category: **All other app types**; violence, sexuality, language, drugs, gambling: **No**; "users can interact or exchange information": **Yes** (gọi điện với khách hàng); shares location: No; digital purchases: No → Save → **Submit** |
| **Target audience and content** | Chỉ chọn **18 and over** → "Appeal to children": No |
| **Data safety** | **Đã khai bằng API** – chỉ mở ra kiểm tra rồi bấm Submit nếu Console yêu cầu |
| **Government apps** | No |
| **Financial features** | My app doesn't provide any financial features |
| **Health** | My app does not have any health features |

**Grow users → Store presence → Store settings**: App category **Business**; Contact details: email `sales+chplay@gcalls.co`, website `https://gcalls.co` (đã có, chỉ kiểm tra) → Save.

Sau đó mục "Release your app" mở khoá. **Không cần tạo release tay**: đẩy tag `v1.0.0` là CI đưa lên production.

## App Store Connect (app Omnibox)

1. **App Privacy** (App Store → Trust & Safety → App Privacy) → **Edit** → "Do you or your third-party partners collect data?" **Yes**, chọn:
   - Contact Info: **Name**, **Email Address**, **Phone Number**
   - User Content: **Audio Data**
   - Identifiers: **User ID**

   Với **mỗi** loại: mục đích **App Functionality**; Linked to user: **Yes**; Used for tracking: **No**. Bấm **Publish**.
2. **Age Ratings** (General → App Information → Age Rating → Edit): các câu đã được API trả lời (kết quả 4+); xem các câu mới, bấm **Done** để tắt banner "Review New Questions".
3. **App Compliance** (General → App Compliance):
   - **EU Digital Services Act**: khai trạng thái **Trader** (công ty Gcalls) nếu tài khoản chưa khai; thiếu thì app không được bán ở EU.
   - **China mainland**: nhập **số đăng ký ICP** của app, hoàn thành **AIGC Services Declaration** (Omnibox không cung cấp dịch vụ AI tạo sinh) và **Security Assessment**. Thiếu các mục này app vẫn được duyệt và bán ở các nước khác, chỉ không bán ở Trung Quốc.
4. Bỏ qua **Retention Messaging** (chỉ dành cho app có subscription).

## Sau khi làm xong

Báo lại để kiểm tra bằng API, rồi phát hành: `git tag v1.0.0 && git push origin v1.0.0`.
