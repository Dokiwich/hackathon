# AGENTS.md — Đề 4: Chống Lừa 101 (Starter Skeleton)

> Standalone starter template for `de-4-chong-lua-101/`. Inherits root security, accessibility, and deployment rules in `../AGENTS.md`.

## 1. Bối cảnh & Đề bài
- **Bối cảnh:** Học sinh — sinh viên 16–22 tuổi là nhóm bị lừa đảo trực tuyến nhiều nhất Đồng Nai 2025 (giả danh công an, việc làm online, link lạ, tin nhắn trúng thưởng…); tuyên truyền bằng poster tĩnh kém hiệu quả.
- **Mục tiêu ứng dụng:**
  1. Mini-game / chatbot mô phỏng tình huống lừa đảo thực tế qua giao diện chat/game.
  2. Người chơi chọn phương án xử lý → hệ thống chấm điểm + giải thích Red-Flag tức thì.
  3. 5–10 kịch bản đa dạng (công an giả, việc làm online, trúng thưởng, hack Zalo mượn tiền, QR giả…).
  4. Kết thúc cấp chứng chỉ "Công dân số an toàn" (PNG) chia sẻ Facebook/Zalo.
- **Sản phẩm cần nộp:** Pitch deck 10 slide (`public/pitch-deck.html`), 5 kịch bản game, Prototype chatbot clickable.

## 2. Cấu trúc Thư mục Sẵn sàng Code
- `src/App.jsx` — Điểm nối `<Routes>` (hiện là skeleton tối giản, sẵn sàng thêm lobby, player chat và màn hình chứng chỉ).
- `src/main.jsx` — Đã cấu hình `<ErrorBoundary>` + `<BrowserRouter basename={import.meta.env.BASE_URL}>`.
- `src/components/` — Chứa màn hình chính & UI components (hiện có `ErrorBoundary.jsx`).
- `src/data/` — Chứa kịch bản phân nhánh JSON (nodes, choices, points, red-flag feedback).
- `src/utils/` — Chứa engine vẽ chứng chỉ PNG trên Canvas 2D & bộ tính điểm.
- `src/services/storageService.js` — Adapter lưu trữ `localStorage` & `VITE_API_BASE_URL` khi nối Zalo OA/API.
- `public/` — Đã có `favicon.svg`, `manifest.webmanifest`, `robots.txt`, `_redirects`, `_headers`; đặt `pitch-deck.html` tại đây và liên kết qua `${import.meta.env.BASE_URL}pitch-deck.html`.

## 3. Quy tắc An toàn Nội dung Bắt buộc cho Đề 4
1. **Không dùng domain/SĐT/file độc hại thật:** Mọi URL giả lập trong kịch bản chỉ dùng domain dành riêng `.example.test`; luôn hiển thị nhãn cảnh báo `"TÌNH HUỐNG MÔ PHỎNG GIÁO DỤC"`.
2. **Bảo vệ dữ liệu học sinh 16–18 tuổi:** Không yêu cầu nhập CCCD, mật khẩu hay thông tin nhạy cảm thật để nhận chứng chỉ.
3. **XSS & Quyền trình duyệt:** Không render nội dung chat/tên người chơi bằng `dangerouslySetInnerHTML`; giữ `Permissions-Policy: geolocation=(), camera=(), microphone=()` trong `vercel.json` và `public/_headers`.
4. **Design Direction (High-Contrast Cyber-Sim / Native OS Chat):** Dùng palette trong `tailwind.config.js` (`canvas: #F8FAFC`, `ink: #0F172A`, `brand: #DC2626` đỏ cảnh báo, `accent: #059669`); mô phỏng sát giao diện chat Zalo/SMS/cuộc gọi thật kèm thẻ Red-Flag tương phản cao — cấm phong cách neon game lòe loẹt hay glassmorphism.
5. **Kiến trúc thị trường đầy đủ:** Tham khảo `../docs/BLUEPRINTS_4_PROJECTS.md` mục Đề 4.

## 4. Lệnh Chạy & Kiểm tra (trong `de-4-chong-lua-101/`)
- `npm run dev` — Chạy dev server (port `5176`)
- `npm run lint` — Kiểm tra ESLint
- `npm test` — Chạy unit tests Vitest
- `npm run build` — Build bản production (`/`)
- `npm run build:gh` — Build subpath GitHub Pages (`/hackathon/de-4/`)
- Backend (`backend/`): port `4004`; các thư mục module chuẩn bị sẵn: `scenarios`, `game-sessions`, `certificates`, `zalo-webhook`, `analytics`.

## 5. CodeGraph & Tối ưu Token
- Khi thư mục này có `.codegraph/`, gọi `codegraph_explore(projectPath="d:\\hackathon\\de-4-chong-lua-101", query="...", maxFiles=6)` trước khi grep/read lặp, và không mở lại file đã trả về.
- Không đọc `package-lock.json`, `dist/`, hoặc `node_modules/`; đọc đúng dải dòng cần sửa và dùng `context-mode` nếu log build/test dài.
