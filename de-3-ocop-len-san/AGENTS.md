# AGENTS.md — Đề 3: OCOP Đồng Nai Lên Sàn (Starter Skeleton)

> Standalone starter template for `de-3-ocop-len-san/`. Inherits root security, accessibility, and deployment rules in `../AGENTS.md`.

## 1. Bối cảnh & Đề bài
- **Bối cảnh:** Đồng Nai có hơn 150 sản phẩm OCOP 3–4 sao chủ yếu bán offline tại hội chợ; chủ cơ sở phần lớn là nông dân/thanh niên khởi nghiệp chưa rành marketing số, livestream hay vận hành sàn TMĐT.
- **Mục tiêu ứng dụng:**
  1. Kết nối sản phẩm OCOP với TikTok Shop / Shopee / Lazada.
  2. Hướng dẫn chủ cơ sở tự quay video sản phẩm bằng Video Studio Template có sẵn (khung hình, lời thoại).
  3. Mời đoàn viên trẻ làm affiliate hưởng hoa hồng minh bạch mỗi đơn.
  4. Dashboard theo dõi doanh thu, affiliate xuất sắc, sản phẩm hot & lộ trình pilot.
- **Sản phẩm cần nộp:** Pitch deck 10 slide (`public/pitch-deck.html`), App người bán (3 màn), App affiliate (3 màn), Kế hoạch 90 ngày go-live 10 sản phẩm pilot.

## 2. Cấu trúc Thư mục Sẵn sàng Code
- `src/App.jsx` — Điểm nối `<Routes>` (hiện là skeleton tối giản, sẵn sàng thêm routes cho Seller / Affiliate / Ops).
- `src/main.jsx` — Đã cấu hình `<ErrorBoundary>` + `<BrowserRouter basename={import.meta.env.BASE_URL}>`.
- `src/components/` — Chứa màn hình chính & UI components (hiện có `ErrorBoundary.jsx`).
- `src/data/` — Chứa danh mục sản phẩm OCOP pilot, kịch bản quay video mẫu, kế hoạch 90 ngày.
- `src/utils/` — Chứa công thức tính hoa hồng, tracking link, tổng hợp doanh thu.
- `src/services/storageService.js` — Adapter lưu trữ `localStorage` & `VITE_API_BASE_URL` khi nối backend/sàn.
- `public/` — Đã có `favicon.svg`, `manifest.webmanifest`, `robots.txt`, `_redirects`, `_headers`; đặt `pitch-deck.html` tại đây và liên kết qua `${import.meta.env.BASE_URL}pitch-deck.html`.

## 3. Quy tắc Kỹ thuật Bắt buộc cho Đề 3
1. **UX cho Chủ cơ sở nông thôn:** Giao diện Seller phải tối giản thao tác (<= 3 chạm), nút tối thiểu `44x44px`, chữ rõ ràng, lời thoại quay video dễ đọc.
2. **Bảo mật Token & Thanh toán:** Tuyệt đối không đưa OAuth secret sàn TMĐT hay khóa API thanh toán vào `VITE_*` hay code frontend.
3. **Subpath & Quyền trình duyệt:** Giữ `camera=(self), microphone=(self)` trong `vercel.json` và `public/_headers` cho tính năng quay video template.
4. **Design Direction (Warm Agricultural Commerce):** Dùng palette trong `tailwind.config.js` (`canvas: #FAF8F5` nền kem ấm, `ink: #1C1917`, `brand: #15803D` xanh nông sản, `accent: #B45309` hổ phách); ưu tiên chữ lớn, khoảng thở rộng và thẻ sản phẩm thật thay vì giao diện dashboard tối màu hay gradient SaaS.
5. **Kiến trúc thị trường đầy đủ:** Tham khảo `../docs/BLUEPRINTS_4_PROJECTS.md` mục Đề 3.

## 4. Lệnh Chạy & Kiểm tra (trong `de-3-ocop-len-san/`)
- `npm run dev` — Chạy dev server (port `5175`)
- `npm run lint` — Kiểm tra ESLint
- `npm test` — Chạy unit tests Vitest
- `npm run build` — Build bản production (`/`)
- `npm run build:gh` — Build subpath GitHub Pages (`/hackathon/de-3/`)
- Backend (`backend/`): port `4003`; các thư mục module chuẩn bị sẵn: `producers`, `catalog-sync`, `affiliates`, `orders-webhook`, `commission-ledger`, `media-jobs`.

## 5. CodeGraph & Tối ưu Token
- Khi thư mục này có `.codegraph/`, gọi `codegraph_explore(projectPath="d:\\hackathon\\de-3-ocop-len-san", query="...", maxFiles=6)` trước khi grep/read lặp, và không mở lại file đã trả về.
- Không đọc `package-lock.json`, `dist/`, hoặc `node_modules/`; đọc đúng dải dòng cần sửa và dùng `context-mode` nếu log build/test dài.
