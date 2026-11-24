# Đoàn Viên Số — Báo cáo giao diện & Hướng dẫn sử dụng (Đề 1)

- **Link chạy 24/7:** https://sotaychidoan.pages.dev (dự phòng: https://de-1-so-tay-chi-doan.pages.dev)
- **Công nghệ:** Vite + React 18 + Tailwind CSS + React Router; API chạy trên Cloudflare Pages Functions; cơ sở dữ liệu Neon PostgreSQL (chuẩn hóa 3NF).
- **Kiểm thử đã chạy:** `eslint` 0 lỗi · 18 test frontend · 5 test backend · build thành công · kiểm tra trên Chrome (PC 1440×900 và điện thoại 390×844, 0 lỗi console).

---

## 1. Người dùng & vai trò (đúng 3 nhóm người dùng của đề)

| Người dùng trong đề | Vai trò trong hệ thống | Làm gì chính |
|---|---|---|
| Bí thư chi đoàn (27 tuổi, dùng điện thoại) | `Bí thư chi đoàn` | Quản lý 46 đoàn viên Khu phố 5, quét QR + GPS, duyệt sinh hoạt bù, nhắc lịch, xuất báo cáo chi đoàn |
| Đoàn viên (công nhân KCN, làm ca) | `Đoàn viên` | Xem bản tin, quét QR điểm danh, xem lịch sử & giờ CTXH, đăng ký sinh hoạt bù |
| Cán bộ Đoàn xã, phường | `Cán bộ Đoàn xã/phường` | Đăng/sửa/xóa tin tức, tạo sự kiện + phát/đổi/đóng mã QR, xem số liệu toàn phường |

**Kế thừa quyền:** Đoàn viên là gốc; Bí thư = Đoàn viên + quản lý chi đoàn; Cán bộ = Đoàn viên + điều phối cấp phường. Cùng một màn hình dùng chung, chỉ hiện thêm chức năng theo quyền (không viết lặp 3 bản).

## 2. Tài khoản dùng thử (đã kiểm tra đăng nhập thật trên bản online)

Đăng nhập bằng tên tài khoản, số điện thoại hoặc mã đoàn viên — hệ thống **tự nhận diện vai trò**, không có bước chọn vai trò.

| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| Bí thư chi đoàn | `bithu.kp5` | `123456` |
| Đoàn viên | `doanvien.kp5` | `123456` |
| Cán bộ Đoàn xã/phường | `canbo.tamhiep` | `1234?A` |

## 3. Báo cáo giao diện

### 3.1 Nguyên tắc thiết kế
- **Đơn giản, đóng gói, bấm vào mới ra chi tiết:** mỗi màn hình chỉ hiện số liệu chính; chi tiết mở bằng cửa sổ trượt (modal).
- **Chữ vừa và lớn:** nội dung 15–16px, tiêu đề 20–28px, số liệu 24–30px; không còn chữ nhỏ hơn 13px.
- **Khung mềm:** thẻ bo góc `rounded-2xl`, viền mảnh, bóng nhẹ, nội dung giới hạn `max-w-5xl` để không tràn viền.
- **Màu thống nhất:** xanh Đoàn `#005BAC` làm màu hành động chính; xanh lá = hợp lệ; đỏ = lỗi/ngoài vùng; vàng = chờ duyệt.
- **Một ứng dụng, hai cách điều hướng:** PC có thanh bên cố định; điện thoại có thanh điều hướng dưới (ngón cái bấm tới) và menu trượt.
- **Chạm tối thiểu 44×44px**, nhãn có `aria-label`, hộp thoại có `role="dialog"`.

### 3.2 Danh sách màn hình

| # | Màn hình | Ai thấy | Nội dung |
|---|---|---|---|
| 1 | **Đăng nhập** | Tất cả | Thẻ trắng bo mềm, tự nhận diện vai trò khi gõ tài khoản, nhớ đăng nhập, đổi mật khẩu |
| 2 | **Tổng quan / Bản tin** | Tất cả | Số đoàn viên (46: 31 tại chỗ · 12 đi xa), 3 kỳ sinh hoạt gần nhất (28 · 19 · 33), hoạt động sắp tới, bản tin có ảnh minh họa. Cán bộ có nút thêm/sửa/xóa tin |
| 3 | **Đoàn viên** | Bí thư, Cán bộ | Danh sách + bộ lọc (đang ở địa phương / đi làm xa / chuyển sinh hoạt), tìm kiếm, thêm/sửa/xóa, nhập CSV, đóng đoàn phí. Cán bộ chỉ xem |
| 4 | **Sự kiện & QR** | Cán bộ | Tạo sự kiện, gắn tọa độ + bán kính GPS, phát/đổi/đóng mã QR, xem ai đã điểm danh theo thời gian thực |
| 5 | **Quét QR & Bù** | Bí thư, Đoàn viên | Quét QR bằng camera / tải ảnh / dán link + xác thực GPS; lịch sử tham gia; đăng ký sinh hoạt bù (Bí thư duyệt) |
| 6 | **Giờ CTXH & Thi đua** | Tất cả | Điểm thi đua cá nhân, nhật ký; bảng xếp hạng ở cấp quản lý |
| 7 | **Báo cáo** | Bí thư, Cán bộ | Tỷ lệ sinh hoạt từng chi đoàn, nhận xét tự động, xuất Word / CSV / PDF |
| 8 | **Nhắc lịch** | Tất cả (tạo: Bí thư, Cán bộ) | Lịch sinh hoạt, hạn báo cáo, bật/tắt nhắc tự động |
| 9 | **Cài đặt** | Tất cả | Thông tin tài khoản, đổi mật khẩu, xem quyền hạn, đăng xuất |

### 3.3 Trạng thái lỗi & trống (đã có trong mã)
- Chưa có bản tin trong chuyên mục · Không có đoàn viên khớp bộ lọc · Chưa có lượt điểm danh · Chưa có đơn sinh hoạt bù · Không có lịch nhắc.
- Lỗi quét QR: không đọc được mã / mã hết hạn / sự kiện đã đóng / không có camera (gợi ý tải ảnh QR hoặc chạm vào sự kiện đang mở).
- Lỗi GPS: chưa cấp quyền, tín hiệu cũ, ngoài bán kính — hiện khoảng cách thực tế so với bán kính cho phép.

## 4. Hướng dẫn sử dụng theo vai trò

### 4.1 Cán bộ Đoàn xã/phường
1. Đăng nhập `canbo.tamhiep`. Vào **Tổng quan** → nút **Thêm tin tức** để đăng bản tin (có ảnh); bấm vào bài để **Sửa** hoặc **Xóa**.
2. Vào **Sự kiện & QR** → **Tạo sự kiện & QR**: nhập tên, địa điểm, giờ, điểm thi đua, bán kính GPS.
3. Bấm **Vị trí hiện tại** để lấy tọa độ tại chỗ (hoặc dùng tọa độ mẫu). Bấm **Tạo**.
4. Mở sự kiện → hiện mã QR. Bấm **Tải QR** hoặc **Copy link** gửi Bí thư/Đoàn viên; **Đổi QR · 15p** để cấp mã mới; **Đóng QR** khi kết thúc.
5. Nếu cần kiểm thử ngay tại chỗ đang ngồi: **Dời tâm GPS về vị trí của tôi** hoặc **Mở rộng bán kính 2km**.
6. **Báo cáo** → chọn tuần/tháng → **Xuất Word / CSV / PDF**.

### 4.2 Bí thư chi đoàn
1. Đăng nhập `bithu.kp5`. **Tổng quan** cho thấy ngay 46 đoàn viên, 3 kỳ sinh hoạt gần nhất, hoạt động sắp tới.
2. **Quét QR & Bù** → **Mở camera quét QR** (hoặc **Tải ảnh QR** / **Dán link**) → **Lấy GPS thực tế & Điểm danh**.
3. **Đoàn viên** → lọc theo trạng thái cư trú; thêm/sửa/xóa/nhập CSV; bấm biểu tượng đoàn phí để cập nhật.
4. Tab **Duyệt sinh hoạt bù ca KCN** → **Duyệt** hoặc **Từ chối** đơn của đoàn viên làm ca.
5. **Nhắc lịch** → thêm lịch sinh hoạt/hạn báo cáo; **Báo cáo** → xuất tháng.

### 4.3 Đoàn viên
1. Đăng nhập `doanvien.kp5`. Xem bản tin ở **Tổng quan**.
2. **Quét QR & Bù** → quét QR sự kiện → cho phép vị trí → điểm danh. Phiếu kết quả hiện khoảng cách, sai số GPS, giờ được cộng.
3. Làm ca trùng giờ sinh hoạt: tab **Đăng ký Sinh hoạt bù (Làm ca)** → chọn buổi vắng + buổi bù → gửi, chờ Bí thư duyệt.
4. **Giờ CTXH** xem điểm thi đua và nhật ký; **Nhắc lịch** xem lịch sắp tới.

### 4.4 Mở camera / GPS trên điện thoại
- Mở trang bằng **Chrome hoặc Safari**. Nếu mở từ khung chat Zalo/Messenger, bấm `⋯` → **Mở bằng trình duyệt**.
- Android báo *"Trang web không thể yêu cầu quyền"*: tắt bong bóng chat nổi / ghi màn hình rồi bấm lại.
- Máy tính không có webcam: dùng **Tải ảnh QR** hoặc chạm vào sự kiện đang mở trong danh sách.

## 5. Đối chiếu tiêu chí chấm (thang 100)

> Điểm bên dưới là **tự đánh giá mức đáp ứng** dựa trên những gì đã có trong sản phẩm, không phải điểm chính thức của Ban giám khảo.

### Tiêu chí 1 — Hiểu vấn đề & người dùng (25đ)
| Yêu cầu | Tình trạng | Bằng chứng |
|---|---|---|
| Đúng người dùng: Bí thư / Đoàn viên làm ca / Cán bộ phường | Đạt | 3 vai trò, 3 tài khoản, phân quyền kế thừa |
| Đúng nỗi đau: sổ giấy + Zalo, điểm danh, tổng hợp báo cáo, đoàn viên đi xa | Đạt | QR + GPS thay điểm danh giấy; báo cáo tự tổng hợp; trạng thái "đi làm xa / chuyển sinh hoạt" |
| Bối cảnh Đồng Nai | Đạt | Dữ liệu Khu phố 5, Phường Tam Hiệp, TP. Biên Hòa; công nhân KCN làm ca |
| Luồng chính giải quyết vấn đề | Đạt | Cán bộ tạo QR → Bí thư/Đoàn viên quét + GPS → số liệu tự cập nhật → báo cáo |

### Tiêu chí 2 — Thiết kế giải pháp UX/UI (30đ)
| Yêu cầu | Tình trạng | Ghi chú |
|---|---|---|
| Luồng hợp lý, ít bước | Đạt | Quét QR → GPS → xong (3 bước); đăng nhập không cần chọn vai trò |
| Rõ ràng, nhất quán, dễ đọc trên điện thoại | Đạt | Chữ ≥ 13px (nội dung 15–16px), thanh điều hướng dưới, không tràn viền (đã kiểm tra `scrollWidth = innerWidth`) |
| Xử lý lỗi | Đạt | Thông báo lỗi riêng cho QR, GPS, camera, mạng, mật khẩu |
| Trạng thái trống | Đạt | 5+ màn hình có thông báo "chưa có…" |
| Phù hợp đối tượng (người cao tuổi, học sinh, cán bộ cơ sở) | Đạt một phần | Chữ lớn, nút to, ít thao tác; chưa có chế độ chữ cực lớn hay hướng dẫn bằng giọng nói |

### Tiêu chí 3 — Tính sáng tạo (20đ)
| Điểm sáng tạo | Tình trạng |
|---|---|
| Xác thực kép QR ký số (HMAC-SHA256, đổi mỗi 15 phút) + GPS bán kính, chống điểm danh hộ | Có, chạy thật |
| Bản đồ vùng điểm danh (radar bán kính, khoảng cách người quét) | Có, chạy thật |
| Sinh hoạt bù cho công nhân làm ca (đăng ký → Bí thư duyệt) | Có, chạy thật |
| Nhận xét báo cáo tự động | Có, nhưng là **luật thống kê** (so sánh tỷ lệ, cảnh báo ngưỡng), **chưa dùng mô hình AI/ML** |
| Không sao chép | Tự xây từ đầu theo đề |

### Tiêu chí 4 — Tính khả thi & tác động (25đ)
| Yêu cầu | Tình trạng |
|---|---|
| Làm được trong 24 giờ | Đạt: web app chạy thật, có cơ sở dữ liệu thật, đã triển khai online |
| Kiến trúc, công nghệ phù hợp | Đạt: tĩnh + serverless + PostgreSQL, chi phí vận hành rất thấp |
| Triển khai thật tại xã, phường | Khả thi: không cần cài app; mở bằng trình duyệt; mở rộng 95 xã/phường bằng cách thêm bản ghi đơn vị |
| Bảo mật dữ liệu | Có: mật khẩu băm `scrypt`, phiên đăng nhập đối chiếu 2 lớp (giao diện + máy chủ), lọc mã độc XSS/SVG/CSV |

### Màn hình bắt buộc (tối thiểu 06) — đủ
| Yêu cầu của đề | Có | Màn hình |
|---|---|---|
| Đăng nhập theo vai trò | ✅ | Đăng nhập (tự nhận vai trò) |
| Trang chủ chi đoàn (số đoàn viên, hoạt động sắp tới) | ✅ | Tổng quan |
| Tạo buổi sinh hoạt và mã QR điểm danh | ✅ | Sự kiện & QR |
| Đoàn viên quét QR, xem lịch sử tham gia | ✅ | Quét QR & Bù (có lịch sử cá nhân) |
| Danh sách đoàn viên có bộ lọc (địa phương / đi làm xa / chuyển sinh hoạt) | ✅ | Đoàn viên |
| Tổng hợp Đoàn xã/phường (tỷ lệ từng chi đoàn, xuất báo cáo tháng) | ✅ | Báo cáo |

### Điểm cộng — đủ cả 3
| Điểm cộng | Có | Ghi chú |
|---|---|---|
| Đoàn viên làm ca chọn buổi sinh hoạt bù | ✅ | Đăng ký → chờ Bí thư duyệt, dữ liệu liên thông các vai trò |
| Nhắc lịch tự động | ✅ một phần | Có lịch, bật/tắt tự động, xem trước nội dung tin nhắn; **chưa gửi thật qua Zalo OA** |
| Tích điểm thi đua từ hoạt động tình nguyện | ✅ | Mỗi lần điểm danh hợp lệ tự cộng điểm vào sổ cái, có bảng xếp hạng |

### Dữ liệu mẫu — khớp đề
Chi đoàn Khu phố 5: **46 đoàn viên (31 ở địa phương, 12 đi làm xa, 3 chuyển sinh hoạt)**; 3 buổi sinh hoạt gần nhất có **28, 19, 33** người tham dự (đã nạp trong cơ sở dữ liệu và hiển thị ở Tổng quan).

## 6. Hạn chế đã biết (nên nói thẳng với Ban giám khảo)
1. **Nhắc lịch chưa gửi thật** qua Zalo OA/SMS — mới có lịch, trạng thái và bản xem trước tin nhắn.
2. **"Thông minh" của báo cáo là luật thống kê**, chưa phải AI/ML.
3. **PDF xuất qua hộp thoại in của trình duyệt**; **Word là tệp `.doc` dạng HTML** (mở được bằng Word, chưa phải `.docx` chuẩn).
4. **GPS thực tế:** đã gỡ hoàn toàn các nút giả lập GPS trên giao diện điểm danh. Khi kiểm thử ở xa địa điểm mẫu, Cán bộ Đoàn bấm *“Dời tâm GPS về vị trí của tôi”* hoặc *“Mở rộng bán kính 2km”* để quét bằng GPS thật.
5. GPS trong nhà/Wi-Fi trên máy tính thường lệch; hệ thống đã bù sai số tối đa 120m và cho Cán bộ dời tâm sự kiện về vị trí đang ngồi.
6. Camera/GPS cần HTTPS và trình duyệt thật (không phải trình duyệt nhúng của Zalo/Messenger).
7. Phần nộp **sản phẩm số 1 và số 3** theo quy định của đề (không có trong trang quy chế đã xem) cần Ban tổ chức xác nhận lại.

## 7. Lệnh vận hành
```powershell
cd d:\hackathon\de-1-so-tay-chi-doan
npm run lint; npm test; npm --prefix backend test; npm run build
npx wrangler pages deploy dist --project-name=sotaychidoan --branch=main
# Nạp lại dữ liệu mẫu chuẩn đề (chạy trong thư mục backend)
npm run db:reset-3nf; npm run db:check
```
