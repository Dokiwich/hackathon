# Tài khoản Demo 3 Vai trò — Đề 1: Đoàn Viên Số (Sổ Tay Chi Đoàn Số)

- **Link Web ngắn gọn chính thức (24/7):** `https://sotaychidoan.pages.dev`
- **Link dự phòng song song (24/7):** `https://de-1-so-tay-chi-doan.pages.dev`

> Database Neon PostgreSQL đã được chuẩn hóa **3NF** (`12` bảng + `2` SQL View) và nạp dữ liệu mẫu chuẩn đề:
> - **Chi đoàn Khu phố 5 (`BR-KP5`)**: **46 đoàn viên** (`31` đang ở địa phương, `12` đi làm xa, `3` chuyển sinh hoạt); **03 buổi sinh hoạt gần nhất** đạt **`28`**, **`19`**, **`33`** lượt điểm danh thật.
> - **Phường Tam Hiệp (`WARD-TAMHIEP`)**: thêm **Chi đoàn Khu phố 2** (`8` đoàn viên) và **Chi đoàn Khu phố 3** (`6` đoàn viên) để kiểm thử báo cáo tổng hợp toàn phường (tổng `60` đoàn viên).

## 1. Danh sách 3 Tài khoản (Đăng nhập bằng Tên tài khoản, SĐT hoặc Mã đoàn viên)

| Vai trò | Role Code | Tên đăng nhập | SĐT | Mã đoàn viên | Mật khẩu ban đầu | Đơn vị / Phạm vi | Quyền hạn chính |
|---|---|---|---|---|---|---|---|
| **Bí thư chi đoàn** | `branch_secretary` | `bithu.kp5` | `0912345001` | `DN-KP5-001` | `123456` | Chi đoàn Khu phố 5 (`BR-KP5`) | **Quản lý 46 đoàn viên KP5 + Quét QR & GPS**: thêm/sửa/xóa/import đoàn viên KP5, quét QR + xác thực GPS tại sự kiện, xem tiến độ KP5, nhắc lịch KP5, xuất báo cáo KP5 |
| **Cán bộ Đoàn xã/phường** | `ward_officer` | `canbo.tamhiep` | `0912345900` | `CB-TH-001` | `1234?A` | Đoàn Phường Tam Hiệp (`WARD-TAMHIEP`) | **Tạo sự kiện & phát QR/GPS + Quản trị tin tức**: đăng/sửa/xóa tin tức, tạo sự kiện gắn tọa độ & bán kính GPS, phát/đổi/đóng mã QR, xem toàn phường 60 ĐV (không thêm/xóa ĐV) |
| **Đoàn viên** | `member` | `doanvien.kp5` | `0912345002` | `DN-KP5-002` | `123456` | Chi đoàn Khu phố 5 (`BR-KP5`) | Xem tin tức Tổng quan, quét QR + xác thực GPS điểm danh sự kiện, xem lịch sử & giờ CTXH cá nhân, nhận nhắc lịch |

## 2. Luồng kiểm thử nhanh
1. **Đăng nhập tự nhận diện vai trò:** Tại màn hình **Đoàn Viên Số**, chỉ cần nhập `username`, `SĐT` hoặc `Mã đoàn viên` + mật khẩu `123456`, hệ thống (Backend / Neon) tự xác định đúng `role` và phân giao diện theo quyền hạn tương ứng.
2. **Đổi mật khẩu có xác nhận mật khẩu cũ:** Sau khi vào ứng dụng, vào **Cài đặt** → **Đổi mật khẩu tài khoản**:
   - Nhập đúng **Mật khẩu hiện tại** (`123456`)
   - Nhập **Mật khẩu mới** (>= 6 ký tự, khác mật khẩu cũ) và **Xác nhận mật khẩu mới**
   - Thử **Đăng xuất** rồi đăng nhập lại bằng mật khẩu cũ (bị từ chối) và mật khẩu mới (thành công).
3. **Đồng bộ lại Neon (khi cần reset dữ liệu mẫu):** chạy tại thư mục `de-1-so-tay-chi-doan/backend`:
   ```powershell
   npm run db:reset-3nf
   npm run db:check
   ```
