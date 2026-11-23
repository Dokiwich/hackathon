# Đồng Nai Hackathon — 4 Standalone Full-Stack Starters

Kho lưu trữ được tổ chức thành **4 thư mục độc lập hoàn toàn** (mỗi thư mục chứa Frontend React 18 + Vite 5 + Tailwind CSS 3 + Backend Fastify 5 + Zod 4 + Docker + `AGENTS.md` riêng), dùng chung bộ quy chuẩn AI Agent, tối ưu token/CodeGraph, bảo mật CI/CD và script đóng gói / triển khai lên Internet.

## 1. Cấu Trúc 4 Đề Tài

| Đề | Thư mục | Trạng thái hiện tại | Cổng FE / BE |
|---|---|---|---|
| **Đề 1: Sổ Tay Chi Đoàn Số** | [`de-1-so-tay-chi-doan/`](de-1-so-tay-chi-doan/AGENTS.md) | Starter Skeleton (FE + BE chuẩn cấu trúc, sẵn sàng code) | `5174` / `4001` |
| **Đề 2: Tai Mắt Công Dân Đồng Nai** | [`de-2-tai-mat-cong-dan/`](de-2-tai-mat-cong-dan/AGENTS.md) | Full MVP (95 xã/phường, GPS/Watermark, Leaflet, SLA, Pitch Deck) + BE Skeleton (PostGIS) | `5173` / `4002` |
| **Đề 3: OCOP Đồng Nai Lên Sàn** | [`de-3-ocop-len-san/`](de-3-ocop-len-san/AGENTS.md) | Starter Skeleton (FE + BE chuẩn cấu trúc, sẵn sàng code) | `5175` / `4003` |
| **Đề 4: Chống Lừa 101** | [`de-4-chong-lua-101/`](de-4-chong-lua-101/AGENTS.md) | Starter Skeleton (FE + BE chuẩn cấu trúc, sẵn sàng code) | `5176` / `4004` |

- **Live Portal Hub (GitHub Pages):** `https://dokiwich.github.io/hackathon/` *(sau khi bật Settings → Pages → Source: GitHub Actions)*

## 2. Lệnh Thao Tác Nhanh (Chạy từ Root)

```bash
# Cài dependencies cho toàn bộ 4 Frontend & 4 Backend
npm run install:all
npm run install:backend:all

# Chạy dev local từng đề (VD: Đề 2)
npm run dev:de2
npm run dev:api:de2

# Kiểm tra toàn bộ (ESLint + Vitest + Build FE + ESLint/Test BE)
npm run verify

# Build Portal 4-trong-1 cho GitHub Pages (dist-pages/)
npm run build:gh

# Đóng gói release/<track>-dist.zip & <track>-source.zip
npm run pack

# Khởi tạo index CodeGraph riêng từng đề (tối ưu AI context)
npm run codegraph:init
```

## 3. Triển Khai Lên Internet

- **Windows PowerShell:**
  ```powershell
  .\scripts\deploy.ps1 -App all -Target gh-pages -Prod
  .\scripts\deploy.ps1 -App de2 -Target vercel -Prod
  .\scripts\deploy-backend.ps1 -App de2 -Target cloudrun -Region asia-southeast1
  ```
- **Bash / Linux / macOS:**
  ```bash
  ./scripts/deploy.sh vercel --app de2 --prod
  ./scripts/deploy-backend.sh cloudrun --app de2 --region asia-southeast1
  ```

## 4. Tài Liệu Kiến Trúc & Quy Chuẩn AI
- Hướng dẫn AI Agent hợp nhất: [`AGENTS.md`](AGENTS.md)
- Kiến trúc hệ thống & ranh giới module: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Kiến trúc thị trường full-stack cho cả 4 đề: [`docs/BLUEPRINTS_4_PROJECTS.md`](docs/BLUEPRINTS_4_PROJECTS.md)
- Hướng dẫn đóng gói & deploy chi tiết: [`docs/DEPLOY.md`](docs/DEPLOY.md)
- Chính sách bảo mật AI Agent & CI/CD: [`docs/agents/security.md`](docs/agents/security.md)
