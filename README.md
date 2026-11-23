# Đồng Nai Hackathon — 4 Standalone Full-Stack Starters

Kho lưu trữ được tổ chức thành **4 thư mục độc lập hoàn toàn** (mỗi thư mục chứa Frontend React 18 + Vite 5 + Tailwind CSS 3 + Backend Fastify 5 + Zod 4 + Docker + `AGENTS.md` riêng), sẵn sàng build, đóng gói `.zip` và đẩy trực tiếp lên **Cloudflare Pages** / **Cloudflare Quick Tunnel**.

## 1. Cấu Trúc 4 Đề Tài

| Đề | Thư mục | Trạng thái hiện tại | Cổng FE / BE |
|---|---|---|---|
| **Đề 1: Sổ Tay Chi Đoàn Số** | [`de-1-so-tay-chi-doan/`](de-1-so-tay-chi-doan/AGENTS.md) | Starter Skeleton (FE + BE chuẩn cấu trúc, sẵn sàng code) | `5174` / `4001` |
| **Đề 2: Tai Mắt Công Dân Đồng Nai** | [`de-2-tai-mat-cong-dan/`](de-2-tai-mat-cong-dan/AGENTS.md) | Full MVP (95 xã/phường, GPS/Watermark, Leaflet, SLA, Pitch Deck) + BE Skeleton (PostGIS) | `5173` / `4002` |
| **Đề 3: OCOP Đồng Nai Lên Sàn** | [`de-3-ocop-len-san/`](de-3-ocop-len-san/AGENTS.md) | Starter Skeleton (FE + BE chuẩn cấu trúc, sẵn sàng code) | `5175` / `4003` |
| **Đề 4: Chống Lừa 101** | [`de-4-chong-lua-101/`](de-4-chong-lua-101/AGENTS.md) | Starter Skeleton (FE + BE chuẩn cấu trúc, sẵn sàng code) | `5176` / `4004` |

## 2. Đưa Web Lên Internet Qua Cloudflare (1 Lệnh)

```powershell
# Đẩy thẳng lên Cloudflare Pages (*.pages.dev) — lần đầu tự mở trình duyệt xác nhận
npm run cf:de2        # hoặc cf:de1 / cf:de3 / cf:de4

# Hoặc mở nhanh link HTTPS tạm (*.trycloudflare.com) từ máy local
npm run dev:de2
npm run tunnel:de2    # (ở terminal thứ 2)
```

Hướng dẫn chi tiết (CLI, nối Git trên Cloudflare Dashboard, GitHub Actions, Custom Domain, Backend): [`docs/DEPLOY.md`](docs/DEPLOY.md).

## 3. Lệnh Thao Tác Nhanh (Chạy từ Root)

```bash
# Cài dependencies cho 4 Frontend & 4 Backend
npm run install:all
npm run install:backend:all

# Kiểm tra toàn bộ (ESLint + Vitest + Build FE + ESLint/Test BE)
npm run verify

# Đóng gói release/<track>-dist.zip & <track>-source.zip
npm run pack

# Khởi tạo index CodeGraph riêng từng đề (tối ưu AI context)
npm run codegraph:init
```

## 4. Tài Liệu Kiến Trúc & Quy Chuẩn AI
- Hướng dẫn AI Agent hợp nhất: [`AGENTS.md`](AGENTS.md)
- Kiến trúc hệ thống & ranh giới module: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Kiến trúc thị trường full-stack cho cả 4 đề: [`docs/BLUEPRINTS_4_PROJECTS.md`](docs/BLUEPRINTS_4_PROJECTS.md)
- Chính sách bảo mật AI Agent & CI/CD: [`docs/agents/security.md`](docs/agents/security.md)
