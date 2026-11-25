# f-callbox/terms – bộ điều khoản pháp lý dùng lại cho app VoIP / SMS / OTT / AI agent

| Văn bản | File nội dung | Dùng cho |
| --- | --- | --- |
| Privacy Policy | `docs/privacy-policy.html` | **Bắt buộc** trên Google Play và App Store |
| Terms of Service | `docs/terms-of-service.html` | Điều khoản sử dụng dịch vụ |
| EULA | `docs/eula.html` | Giấy phép app di động (đủ điều khoản Apple yêu cầu cho EULA riêng) |
| Acceptable Use Policy | `docs/acceptable-use-policy.html` | Cấm spam, robocall, giả mạo… (Nghị định 91/2020, TCPA) |
| Messaging Terms | `docs/messaging-terms.html` | Chương trình SMS/OTT: đồng ý, STOP/HELP, phí |
| Call Recording & AI Notice | `docs/call-recording-ai-notice.html` | Ghi âm cuộc gọi, AI agent, chuyển cho người thật |
| Account & Data Deletion | `docs/data-deletion.html` | URL xoá tài khoản (Google Play Data safety / quyền xoá dữ liệu) |
| Cookie Policy | `docs/cookie-policy.html` | Website và web app |

Nội dung viết một lần, dùng biến `{{appName}}`, `{{legalName}}`, `{{brandName}}`, `{{address}}`, `{{country}}`, `{{website}}`, `{{supportEmail}}`, `{{privacyEmail}}`, `{{phone}}`, `{{effectiveDate}}`, `{{governingLaw}}`, `{{disputeVenue}}`, `{{minAge}}`. Giá trị mặc định nằm ở **`org.json`** – sửa một file này là mọi trang đổi theo. Giá trị chứa `TODO` được tô vàng để dễ thấy.

> Đây là bản mẫu chuẩn cho dịch vụ thoại/nhắn tin; nên để bộ phận pháp lý rà lại trước khi dùng chính thức.

## Cách 1: nhúng bằng 1 link CDN (app/website khác)

```html
<div data-terms-doc="privacy-policy"></div>
<script src="https://cdn.jsdelivr.net/gh/gcalls/omnibox@main/f-callbox/terms/terms.js"
        data-app-name="Tên app"
        data-legal-name="CÔNG TY ABC"
        data-address="Địa chỉ đăng ký"
        data-privacy-email="privacy@abc.vn"
        data-support-email="support@abc.vn"
        data-phone="+84…"
        data-website="https://abc.vn"></script>
```

- Không có `data-*` nào thì dùng `org.json` (thông tin Gcalls). Mỗi `data-*` ghi đè đúng trường đó (`data-legal-name` → `legalName`).
- Hoặc trỏ tới file cấu hình riêng: `data-org-url="https://abc.vn/org.json"`; hoặc khai báo `window.TERMS_ORG = {…}` trước thẻ script.
- Thông tin rời trong trang: `<span data-org="legalName"></span>`, `<a data-org="privacyEmail"></a>` (tự thành link mailto).
- Thêm `terms.css` nếu muốn kiểu chữ có sẵn: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/gcalls/omnibox@main/f-callbox/terms/terms.css">`.
- jsDelivr cache tối đa 12 giờ; ghim phiên bản bằng tag/commit (`@v1.0.0`) cho trang quan trọng.

## Cách 2: trang tĩnh công khai (URL cho Google Play / App Store)

Store kiểm tra URL chính sách bằng HTML thật, có thể không chạy JS → dùng bản tĩnh đã điền sẵn:

```bash
cd f-callbox
python3 terms/build.py --out public/terms          # sinh public/terms/*.html từ org.json
firebase deploy --only hosting --project omnibox-515602   # predeploy cũng tự chạy build
```

URL: `https://omnibox-515602.web.app/terms/privacy-policy` (có/không đuôi `.html` đều được). Có thể gắn tên miền riêng (vd. `legal.gcalls.co`) trong Firebase Hosting → Add custom domain.

Cho app khác dùng chung bản host: `python3 terms/build.py --set appName="App B" --set legalName="…" --out public/app-b` rồi deploy.
