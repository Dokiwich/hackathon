# AGENTS.md — Đề 1: Sổ Tay Chi Đoàn Số (Starter Skeleton)

> Standalone starter template for `de-1-so-tay-chi-doan/`. Inherits root security, accessibility, and deployment rules in `../AGENTS.md`.

## 1. Bối cảnh & Đề bài
- **Bối cảnh:** Mỗi Đoàn cơ sở chỉ 1–2 cán bộ nhưng phải quản lý danh sách đoàn viên, chấm công tình nguyện, báo cáo tuần/tháng về Thành đoàn, kê khai giờ công tác xã hội — toàn bộ làm thủ công trên Excel/Word dễ sai sót.
- **Mục tiêu ứng dụng:**
  1. Quản lý danh sách đoàn viên (thêm / sửa / tìm kiếm, lọc trạng thái, QR check-in).
  2. Chấm công hoạt động tình nguyện tự động (QR động chống điểm danh hộ + cộng giờ CTXH).
  3. Xuất báo cáo tuần/tháng đúng mẫu Thành đoàn chỉ trong 1 click (`.doc` / `.csv`).
  4. Nhắc việc tự động theo lịch sinh hoạt chi đoàn.
- **Sản phẩm cần nộp:** Pitch deck 10 slide (`public/pitch-deck.html`), User flow, 5–7 màn hình chính (Dashboard, Danh sách đoàn viên, Chấm công QR, Xuất báo cáo, Nhắc lịch).

## 2. Cấu trúc Thư mục Sẵn sàng Code
- `src/App.jsx` — Điểm nối `<Routes>` (hiện là skeleton tối giản, sẵn sàng thêm routes mới).
- `src/main.jsx` — Đã cấu hình `<ErrorBoundary>` + `<BrowserRouter basename={import.meta.env.BASE_URL}>`.
- `src/components/` — Chứa màn hình chính & UI components (hiện có `ErrorBoundary.jsx`).
- `src/data/` — Chứa dữ liệu mẫu đoàn viên, hoạt động, lịch sinh hoạt.
- `src/utils/` — Chứa helper xuất Word/CSV, tính giờ CTXH, formatter.
- `src/services/storageService.js` — Adapter lưu trữ `localStorage` & `VITE_API_BASE_URL` khi nối backend.
- `public/` — Đã có `favicon.svg`, `manifest.webmanifest`, `robots.txt`, `_redirects`, `_headers`; đặt `pitch-deck.html` tại đây và liên kết qua `${import.meta.env.BASE_URL}pitch-deck.html`.

## 3. Quy tắc Kỹ thuật Bắt buộc cho Đề 1
1. **Bảo mật Export:** Không cài `xlsx` (dính lỗ hổng prototype pollution). Nếu xuất Excel, ưu tiên `.csv` UTF-8 BOM `\uFEFF` và escape tiền tố công thức (`=`, `+`, `-`, `@`); nếu xuất Word `.doc`/`.docx`, escape HTML entities triệt để.
2. **QR Check-in:** Nếu cài lib QR (`qrcode`), ưu tiên QR token xoay vòng theo thời gian hoặc nút làm mới để chống chụp ảnh gửi qua Zalo.
3. **Subpath & Quyền trình duyệt:** Giữ `camera=(self)` trong `vercel.json` và `public/_headers` nếu thêm máy quét QR trên trình duyệt.
4. **Design Direction (Editorial Civic Utility):** Dùng palette trong `tailwind.config.js` (`canvas: #F8FAFC`, `brand: #0066B3` xanh Đoàn, `accent: #0F766E`); ưu tiên bảng dữ liệu rõ cột với `tabular-nums`, viền `1px border-line` sắc gọn; tuyệt đối không dùng gradient tím hay emoji trang trí.
5. **Kiến trúc thị trường đầy đủ:** Tham khảo `../docs/BLUEPRINTS_4_PROJECTS.md` mục Đề 1.

## 4. Lệnh Chạy & Kiểm tra (trong `de-1-so-tay-chi-doan/`)
- `npm run dev` — Chạy dev server (port `5174`)
- `npm run lint` — Kiểm tra ESLint
- `npm test` — Chạy unit tests Vitest
- `npm run build` — Build bản production (`/`)
- `npm run build:gh` — Build subpath GitHub Pages (`/hackathon/de-1/`)
- Backend (`backend/`): port `4001`; các thư mục module chuẩn bị sẵn: `auth-rbac`, `members`, `attendance`, `reports`, `reminders` (chạy `npm --prefix backend run lint` & `test`).

## 5. CodeGraph & Tối ưu Token
- Khi thư mục này có `.codegraph/`, gọi `codegraph_explore(projectPath="d:\\hackathon\\de-1-so-tay-chi-doan", query="...", maxFiles=6)` trước khi grep/read lặp, và không mở lại file đã trả về.
- Không đọc `package-lock.json`, `dist/`, hoặc `node_modules/`; đọc đúng dải dòng cần sửa và dùng `context-mode` nếu log build/test dài.
