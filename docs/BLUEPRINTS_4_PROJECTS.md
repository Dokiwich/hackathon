# Kiến Trúc Hoàn Thiện Ra Thị Trường — 4 Đề Tài Hackathon Đồng Nai

Tài liệu thiết kế cấu trúc **Web + App + Backend + Hạ tầng + Bảo mật** hoàn chỉnh để đưa cả 4 sản phẩm từ MVP hackathon lên vận hành thực tế tại tỉnh Đồng Nai (95 xã/phường sau sáp nhập, 150+ sản phẩm OCOP, khối Đoàn cơ sở & HS-SV 16–22 tuổi).

---

## Mục Lục Nhanh

| Đề | Sản phẩm | Kiến trúc cốt lõi | Điểm khác biệt để ra thị trường |
|---|---|---|---|
| **Đề 1** | Sổ Tay Chi Đoàn Số | Next.js + Expo/Zalo Mini App + NestJS + PostgreSQL + Report Engine | Dynamic QR chống check-in hộ + Offline sync + 1-click `.docx/.xlsx` chuẩn mẫu Thành đoàn |
| **Đề 2** | Tai Mắt Công Dân Đồng Nai | Vite/Next.js + Zalo Mini App/Expo + NestJS + PostGIS + Cloudflare R2 | PostGIS auto-route 95 xã/phường + SLA leo thang 24h/48h/72h + SHA-256 ảnh hiện trường |
| **Đề 3** | OCOP Đồng Nai Lên Sàn | Seller UX 3 chạm + Affiliate App + Ops Web + FFmpeg Worker + Marketplace Adapters | OAuth Vault 3 sàn (TikTok/Shopee/Lazada) + Double-Entry hoa hồng + Plan 90 ngày 10 pilot |
| **Đề 4** | Chống Lừa 101 | Interactive Game Web + Zalo OA Bot/Mini App + CMS + Satori Cert Engine | Giả lập kịch bản thật + AI Roleplay có guardrail cứng + Chứng chỉ QR verify chống giả |

---

## 1. Đề 1 — Sổ Tay Chi Đoàn Số (Quản lý Đoàn viên · Chấm công QR · Báo cáo 1-click · Nhắc lịch)

### 1.1 Bài toán thực tế cần giải quyết để bán/triển khai thật
- Mỗi Đoàn cơ sở chỉ có 1–2 cán bộ kiêm nhiệm nhưng quản lý nhiều chi đoàn trực thuộc.
- Sự kiện tình nguyện thường diễn ra ngoài trời (sóng yếu), cần điểm danh nhanh hàng trăm người mà không gian lận (chụp ảnh QR gửi qua Zalo nhờ quét hộ).
- Báo cáo tuần/tháng gửi Thành đoàn phải khớp chính xác biểu mẫu Word/Excel hiện hành của tổ chức Đoàn, không thể chỉ xuất CSV thô.

### 1.2 Cấu trúc Monorepo (Turborepo + pnpm)

```text
so-tay-chi-doan/
├── apps/
│   ├── web-admin/                 # Next.js 15 App Router + Tailwind + Shadcn/UI (Bí thư & Thành đoàn)
│   │   ├── src/app/(auth)/        # Đăng nhập SSO / Zalo OA / OTP SĐT
│   │   ├── src/app/(dashboard)/   # Dashboard, Danh sách đoàn viên, Lịch sinh hoạt, Xuất báo cáo
│   │   └── src/features/          # Feature-sliced: members, attendance, reports, reminders
│   ├── mobile/                    # Expo React Native (iOS/Android) + Zalo Mini App wrapper
│   │   ├── app/                   # Quét QR check-in, Thẻ đoàn viên số, Lịch tình nguyện, Offline queue
│   │   └── services/              # SQLite offline cache (expo-sqlite) + background sync
│   └── api/                       # NestJS (TypeScript) + Prisma ORM + BullMQ
│       └── src/modules/
│           ├── auth-rbac/         # Phân quyền 4 tầng: Thành đoàn -> Huyện/Cơ sở -> Chi đoàn -> Đoàn viên
│           ├── members/           # Import/Export Excel, tìm kiếm, chuyển sinh hoạt đoàn
│           ├── attendance/        # Dynamic QR HMAC-SHA256 xoay vòng 60s + geofence check
│           ├── reports/           # Tổng hợp số liệu + gọi packages/report-templates
│           └── reminders/         # Cron job BullMQ gửi Zalo ZNS / Web Push / FCM
├── packages/
│   ├── report-templates/          # Sinh .docx (docxtemplater) & .xlsx (exceljs) đúng mẫu Thành đoàn
│   ├── shared/                    # Zod schemas, TypeScript types, RBAC permissions matrix
│   └── ui/                        # Design tokens + components dùng chung
└── infra/
    ├── docker-compose.yml         # PostgreSQL 16 + Redis 7 + MinIO (dev local)
    └── terraform/                 # Cloud Run / VPS + Managed Postgres + R2
```

### 1.3 Thiết kế Cơ sở Dữ liệu Cốt lõi (PostgreSQL)

| Bảng | Vai trò & Trường trọng tâm |
|---|---|
| `organizations` | Cây phân cấp đơn vị (`id`, `parent_id`, `level`: `thanh_doan \| co_so \| chi_doan`, `code`, `name`) |
| `users` | Tài khoản đăng nhập (`id`, `phone`, `zalo_id`, `role`, `org_id`, `mfa_enabled`) |
| `members` | Hồ sơ đoàn viên (`id`, `org_id`, `full_name`, `dob`, `student_or_worker_id`, `union_join_date`, `status`) |
| `activities` | Hoạt động / kỳ sinh hoạt (`id`, `org_id`, `title`, `start_at`, `end_at`, `lat`, `lng`, `radius_m`, `social_hours`) |
| `qr_sessions` | Phiên QR động (`id`, `activity_id`, `secret_seed`, `expires_at`, `require_geofence`) |
| `attendances` | Lượt chấm công (`id`, `activity_id`, `member_id`, `checked_in_at`, `device_hash`, `sync_source`: `online \| offline`) |
| `social_work_ledger` | Sổ cái giờ công tác xã hội — append-only, chống sửa tay mất dấu (`member_id`, `activity_id`, `hours`, `approved_by`) |
| `report_templates` | File `.docx/.xlsx` mẫu chuẩn Thành đoàn lưu trên S3/R2 kèm biến mapping JSON |
| `reminders` | Lịch nhắc việc (`id`, `activity_id`, `channel`: `zalo_zns \| push`, `scheduled_at`, `status`) |
| `audit_logs` | Nhật ký chỉnh sửa danh sách đoàn viên, duyệt giờ công tác xã hội |

### 1.4 Cơ chế Bảo mật & Chống gian lận (Market-Ready)
1. **Dynamic QR Check-in (chống gửi ảnh qua Zalo):** QR hiển thị trên máy Bí thư tự xoay token mỗi 30–60 giây theo công thức `HMAC-SHA256(secret_seed, activity_id + time_bucket)`. Khi quét, app kiểm tra chữ ký + thời hạn + tùy chọn bán kính GPS (`radius_m`).
2. **Offline-First Sync:** Nếu đoàn viên quét tại vùng sóng yếu, app lưu `signed_qr_payload + local_timestamp + device_signature` vào SQLite cục bộ và đồng bộ ngay khi có mạng.
3. **1-Click Export chuẩn Thành đoàn:** `packages/report-templates` bơm dữ liệu tổng hợp từ `social_work_ledger` và `attendances` thẳng vào template `.docx`/`.xlsx` chính thức có sẵn quốc hiệu, tiêu ngữ, chữ ký số/chờ ký.
4. **Phân quyền đa cấp (Multi-tenant RBAC):** Bí thư chi đoàn chỉ xem/sửa đúng `org_id` của mình; Thành đoàn xem dashboard tổng hợp toàn bộ chi đoàn trực thuộc mà không cần đợi nộp file Excel.

### 1.5 Stack & Hạ tầng đề xuất
- **Frontend Web:** Next.js 15 + React 19 + Tailwind CSS + Shadcn/UI + TanStack Table (xử lý danh sách >5.000 đoàn viên mượt).
- **Mobile / Mini App:** Zalo Mini App (tỉ lệ tiếp cận đoàn viên cao nhất tại VN không cần cài app) + Expo React Native cho cán bộ.
- **Backend & DB:** NestJS + Prisma + PostgreSQL 16 + Redis + BullMQ.
- **Thông báo:** Zalo ZNS (gửi nhắc lịch sinh hoạt chính thức) + Web Push / Firebase Cloud Messaging.

---

## 2. Đề 2 — Tai Mắt Công Dân Đồng Nai (95 Xã/Phường Sau Sáp Nhập)

> **Liên kết trực tiếp với repo hiện tại (`d:\hackathon`):** Workspace này đang là **MVP Web SPA** của Đề 2 (Vite + React 18 + Tailwind CSS + Leaflet + React Router v7 + `localStorage`). Kiến trúc dưới đây là lộ trình nâng cấp trực tiếp từ MVP trong `src/` lên hệ thống production phục vụ 95 xã/phường tỉnh Đồng Nai.

### 2.1 Lộ trình nâng cấp từ MVP hiện tại (`d:\hackathon/src`)

| Thành phần MVP hiện tại | Giới hạn của MVP | Nâng cấp ra thị trường |
|---|---|---|
| `src/data/wardsData.js` (mảng tĩnh 95 xã/phường) | Tọa độ tâm ước lượng, chưa phân ranh đa giác | Bảng `wards_95` trong PostgreSQL + **PostGIS** chứa GeoJSON Polygon chính xác để `ST_Contains` tự định tuyến |
| `src/utils/watermark.js` (vẽ watermark client-side) | Lưu base64 vào `localStorage` (giới hạn ~5MB) | Upload ảnh trực tiếp lên **Cloudflare R2** qua Presigned URL, worker server đóng dấu SHA-256 + tách bản sạch/bản public che mặt/biển số |
| `src/data/accountsData.js` + `LoginView.jsx` | Đổi role demo trên client | Đăng nhập **VNeID / Zalo Auth / OTP** cho công dân; SSO/JWT + RBAC theo `ward_id` cho cán bộ 95 xã/phường |
| `localStorage` state trong `src/App.jsx` | Dữ liệu cục bộ từng trình duyệt | REST/GraphQL API + **Server-Sent Events (SSE)** cập nhật trạng thái real-time trên `PublicMap` và `WardDispatch` |

### 2.2 Cấu trúc Monorepo Sản phẩm Thị Trường

```text
tai-mat-cong-dan-dong-nai/
├── apps/
│   ├── web/                       # Nâng cấp từ src/ hiện tại (Vite/Next.js + Leaflet/MapLibre GL)
│   │   ├── src/features/citizen/  # Luồng gửi phản ánh 3 bước, theo dõi mã hồ sơ, đánh giá hài lòng
│   │   ├── src/features/agency/   # Bàn điều phối xã/phường, phân công đội thi công, đính kèm ảnh nghiệm thu
│   │   └── src/features/public/   # Bản đồ công khai 95 xã/phường + Dashboard xếp hạng MTTR & % đúng hạn
│   ├── zalo-miniapp/              # Zalo Mini App (React) — dân gửi phản ánh ngay trong Zalo, tự lấy GPS
│   ├── mobile-field/              # Expo React Native cho đội xử lý hiện trường (nhận push, chụp ảnh sau xử lý)
│   ├── api/                       # NestJS / Go Fiber + PostgreSQL + PostGIS + Redis/BullMQ
│   │   └── src/modules/
│   │       ├── geo-routing/       # ST_Contains tự gán ward_id từ tọa độ GPS + fallback ranh giới gần nhất
│   │       ├── reports/           # State machine: submitted -> verified -> assigned -> in_progress -> resolved -> rated
│   │       ├── sla-engine/        # BullMQ delayed jobs: cảnh báo vàng (75% SLA), quá hạn (100% -> leo thang UBND/tỉnh)
│   │       └── deduplication/     # Phát hiện phản ánh trùng trong bán kính 50m + cùng danh mục trong 48h
│   └── media-worker/              # Nén WebP, strip EXIF nhạy cảm cho bản công khai, tạo pHash chống spam ảnh mạng
├── packages/
│   ├── geo-dongnai/               # Ranh giới TopoJSON/GeoJSON chuẩn 95 xã/phường Đồng Nai sau sáp nhập
│   ├── watermark-core/            # Tái sử dụng logic đóng dấu GPS + timestamp + mã hồ sơ
│   └── shared/                    # Danh mục sự cố, SLA matrix, Zod validation
└── infra/
    ├── postgres-postgis/          # PostgreSQL 16 + PostGIS 3.4 + pg_trgm
    └── deploy/                    # Vercel/Cloudflare Pages (web) + Cloud Run / Kubernetes (api + worker)
```

### 2.3 Thiết kế Cơ sở Dữ liệu Cốt lõi (PostgreSQL + PostGIS)

| Bảng | Trường trọng tâm |
|---|---|
| `wards_95` | `id`, `code`, `name`, `type` (`phuong \| xa`), `boundary` (`GEOMETRY(MultiPolygon, 4326)`), `sla_multiplier` |
| `users` | `id`, `phone`, `zalo_id`, `role` (`citizen \| ward_officer \| ward_leader \| provincial_admin`), `ward_id` |
| `reports` | `id`, `tracking_code` (`DN-2026-XXXX`), `category`, `severity`, `description`, `location` (`GEOMETRY(Point, 4326)`), `ward_id`, `status`, `sla_due_at`, `duplicate_of_id` |
| `report_media` | `id`, `report_id`, `stage` (`before \| after`), `storage_key`, `sha256_hash`, `phash`, `captured_at` |
| `assignments` | `id`, `report_id`, `assignee_id`, `assigned_by`, `department_name`, `assigned_at` |
| `status_events` | `id`, `report_id`, `from_status`, `to_status`, `actor_id`, `note`, `created_at` (append-only audit) |
| `sla_rules` | `category`, `severity`, `ack_hours` (2h), `resolve_hours` (24h/48h/72h), `escalate_to_role` |
| `citizen_ratings` | `report_id`, `stars` (1–5), `comment`, `rated_at` |
| `ward_kpi_daily` | Materialized view: tổng tiếp nhận, đã xử lý, quá hạn, MTTR (giờ), điểm xếp hạng 95 xã/phường |

### 2.4 Cơ chế Vận hành & Bảo mật
- **Chống spam & giả mạo ảnh:** Chỉ cho phép chụp ảnh trực tiếp hoặc kiểm tra EXIF + `pHash` trùng lặp; gắn Rate Limit theo SĐT/IP (`5 phản ánh/giờ/thiết bị`).
- **Quyền riêng tư (Nghị định 13/2023/NĐ-CP):** Ảnh công khai trên bản đồ tự động xóa metadata EXIF định danh cá nhân (giữ thông tin tọa độ vụ việc tách riêng ở DB) và làm mờ khuôn mặt/biển số bằng worker AI nếu bật chế độ bảo vệ danh tính; thông tin SĐT người gửi chỉ cán bộ thụ lý được xem khi cần liên hệ xác minh.
- **Minh bạch xếp hạng 95 xã/phường:** Dashboard tính điểm theo công thức công khai: `Score = 50% Tỷ lệ đúng hạn SLA + 30% Tốc độ xử lý trung bình (MTTR) + 20% Đánh giá hài lòng của dân`.

---

## 3. Đề 3 — OCOP Đồng Nai Lên Sàn (150+ Sản phẩm · Nông dân · Đoàn viên Affiliate)

### 3.1 Bài toán & Thiết kế UX chuyên biệt cho thị trường
- **Chủ cơ sở OCOP (nông dân/thanh niên khởi nghiệp):** Ngại phần mềm phức tạp, không rành dựng video hay cấu hình Shopee/TikTok Seller Center → App người bán phải đạt chuẩn **"3 chạm — chữ to — nhập liệu giọng nói — template quay video cầm tay chỉ việc"**.
- **Đoàn viên thanh niên (Affiliate):** Muốn kiếm thêm thu nhập minh bạch bằng cách chia sẻ sản phẩm quê hương trên TikTok/Facebook/Zalo → App affiliate cần **1 chạm lấy link/video gốc + ví hoa hồng minh bạch theo từng đơn**.

### 3.2 Cấu trúc Monorepo

```text
ocop-dong-nai/
├── apps/
│   ├── seller-app/                # Expo React Native (hoặc PWA mobile-first) cho Chủ cơ sở OCOP
│   │   ├── catalog-wizard/        # Chụp ảnh bao bì + tem OCOP -> AI gợi ý mô tả chuẩn SEO sàn
│   │   ├── video-studio/          # Camera overlay khung hình + nhắc thoại teleprompter (15s/30s/45s)
│   │   └── orders-unified/        # Gom đơn từ TikTok Shop, Shopee, Lazada về 1 màn hình tiếng Việt dễ hiểu
│   ├── affiliate-app/             # Zalo Mini App + Mobile Web cho Đoàn viên Affiliate
│   │   ├── marketplace/           # Chọn 150+ SP OCOP theo % hoa hồng, mẫu thử, sản phẩm hot
│   │   ├── media-kit/             # Tải video thô/đã cắt, ảnh feedback, kịch bản caption có sẵn
│   │   └── wallet/                # Theo dõi đơn pending -> approved -> rút tiền VietQR
│   ├── ops-web/                   # Next.js 15 Dashboard cho Tỉnh đoàn / Sở Công Thương / Điều phối
│   │   ├── ocop-verification/     # Duyệt chứng nhận OCOP 3-4 sao, hạn sử dụng, ATTP
│   │   ├── analytics/             # Doanh thu theo sàn, Top SKU, Top đoàn viên affiliate, bản đồ vùng nguyên liệu
│   │   └── payout-reconcile/      # Đối soát công nợ & chi trả hoa hồng định kỳ
│   ├── api/                       # NestJS + PostgreSQL + Redis + BullMQ
│   │   └── src/modules/
│   │       ├── token-vault/       # Lưu OAuth access/refresh token các sàn mã hóa AES-256-GCM / KMS
│   │       ├── catalog-sync/      # Map SKU chuẩn sang TikTok / Shopee / Lazada
│   │       ├── webhook-ingest/    # Nhận webhook đơn hàng + idempotency key chống cộng hoa hồng trùng
│   │       └── commission-ledger/ # Sổ cái kế toán kép (Double-Entry) cho dòng tiền hoa hồng
│   └── media-worker/              # Python/Node + FFmpeg + Whisper: tự cắt cảnh, ghép nhạc bản quyền, phụ đề TV
├── packages/
│   ├── marketplace-adapters/      # Adapter pattern chuẩn hóa API TikTok Shop, Shopee Open Platform, Lazada OP
│   ├── video-templates/           # JSON timeline cho 5 mẫu video OCOP (Bưởi Tân Triều, Cà phê, Hạt điều, Mật ong...)
│   └── shared/                    # Tax/VAT calculator, VietQR payload builder, Zod schemas
└── docs/
    └── GO_LIVE_90_DAYS.md         # Playbook triển khai thực địa 10 sản phẩm pilot
```

### 3.3 Thiết kế Cơ sở Dữ liệu Cốt lõi

| Bảng | Trường trọng tâm |
|---|---|
| `ocop_producers` | `id`, `business_name`, `owner_name`, `phone`, `ward_id`, `ocop_cert_no`, `ocop_stars` (`3 \| 4`), `cert_expires_at`, `verified` |
| `products` | `id`, `producer_id`, `sku`, `title`, `price_vnd`, `stock`, `commission_rate_bps` (VD: `1200` = 12%), `media_kit_url` |
| `marketplace_connections` | `id`, `producer_id`, `platform` (`tiktok \| shopee \| lazada`), `shop_id`, `encrypted_tokens`, `token_expires_at` |
| `product_listings` | Mapping 1 SKU nội bộ ↔ `external_item_id` trên từng sàn, đồng bộ tồn kho tập trung |
| `affiliate_links` | `id`, `affiliate_user_id`, `product_id`, `short_code`, `utm_tag`, `platform_deep_link` |
| `orders` | `id`, `platform`, `external_order_id`, `idempotency_key`, `gross_amount`, `net_amount`, `status`, `affiliate_link_id` |
| `commission_ledger` | Kế toán kép: `entry_id`, `account_id`, `direction` (`debit \| credit`), `amount_vnd`, `state` (`pending \| available \| paid \| clawed_back`) |
| `payout_batches` | `id`, `period`, `total_amount`, `bank_ref`, `status` (chỉ giải ngân sau khi hết hạn đổi trả 7–15 ngày của sàn) |

### 3.4 Kế Hoạch 90 Ngày Go-Live 10 Sản Phẩm Pilot

| Giai đoạn | Mục tiêu cụ thể | Chỉ số nghiệm thu (KPI) |
|---|---|---|
| **Ngày 1–30: Chuẩn hóa & Lên sàn** | Khảo sát & onboarding 10 cơ sở OCOP tiêu biểu (hạt điều, bưởi chế biến, mật ong, trà, ca cao...); kết nối API TikTok Shop & Shopee; hướng dẫn chủ cơ sở tự quay bằng Video Studio Template. | 10/10 gian hàng xác thực OCOP; >= 30 video ngắn dựng sẵn; 100% đồng bộ tồn kho & đơn về Seller App. |
| **Ngày 31–60: Kích hoạt Mạng lưới Đoàn viên Affiliate** | Tập huấn 50–100 đoàn viên/sinh viên tại các trường ĐH/CĐ Đồng Nai; cấp bộ Media Kit + link tracking; tổ chức 10–20 phiên Mega-Live tại vùng nguyên liệu/hội chợ số. | >= 80 affiliate phát sinh click/nội dung; >= 300 đơn hàng thử nghiệm; tỷ lệ hoàn hủy < 5%. |
| **Ngày 61–90: Đối soát, Tối ưu & Nhân rộng** | Chốt kỳ đối soát hoa hồng tự động đầu tiên qua VietQR; lọc Top 3 SKU bán chạy để tối ưu chi phí vận chuyển/combo; đóng gói playbook nhân rộng lên 150+ sản phẩm OCOP toàn tỉnh. | 100% đơn hoàn thành được đối soát chính xác; chi trả hoa hồng đúng hạn < 24h sau chốt kỳ; sẵn sàng mở khóa batch 40 sản phẩm tiếp theo. |

---

## 4. Đề 4 — Chống Lừa 101 (Mini-Game / Chatbot cho HS-SV 16–22 Tuổi Đồng Nai)

### 4.1 Thiết kế trải nghiệm để HS-SV chơi thật & lan tỏa tự nhiên
- **Không bắt tải app:** HS-SV mở trực tiếp qua **Zalo OA / Zalo Mini App** hoặc **Link Web chia sẻ trên Facebook/TikTok** (load < 1.5s trên 4G).
- **Cảm giác thật như đang bị lừa thật:** Giao diện giả lập y hệt màn hình chat Zalo người lạ, tin nhắn SMS brandname giả, màn hình cuộc gọi đến từ "Cán bộ Công an / Tòa án", hoặc trang web giả mạo tuyển CTV/trúng thưởng (được gắn nhãn watermark an toàn *"MÔ PHỎNG HUẤN LUYỆN"* để tránh lạm dụng ngược).
- **Vòng lặp 3 phút:** 1 tình huống kéo dài 60–180 giây → Người chơi chọn phản ứng → Bị "lừa mất tiền ảo" hoặc "thoát bẫy thành công" → Hiện thẻ **Giải phẫu 3 Red-Flag** + số hotline báo cáo thật (113 / Cục ATTT).

### 4.2 Cấu trúc Monorepo

```text
chong-lua-101/
├── apps/
│   ├── web-game/                  # Next.js / Vite + Tailwind + Framer Motion (Giao diện mô phỏng đa kênh)
│   │   ├── src/simulators/        # 4 UI skin: Chat Zalo giả, SMS giả, Cuộc gọi video/thoại, Landing page bẫy
│   │   ├── src/components/        # RedFlagOverlay, RiskMeter, ScoreBreakdown, ShareCertCard
│   │   └── src/app/verify/[id]/   # Trang công khai quét QR kiểm tra chứng chỉ thật
│   ├── zalo-bot/                  # Zalo OA Webhook Server + Zalo Mini App cho HS-SV chơi ngay trong Zalo
│   ├── cms/                       # Next.js Admin CMS (Tỉnh đoàn / Công an) soạn & publish kịch bản mới trong 5 phút
│   └── api/                       # Fastify / NestJS + PostgreSQL + Redis
│       └── src/modules/
│           ├── game-session/      # Chạy state machine kịch bản, chấm điểm server-side (chống hack điểm)
│           ├── ai-roleplay/       # Tùy chọn luyện tập với "Kẻ lừa đảo AI" có Output Guardrail cứng
│           ├── certificates/      # Sinh ảnh PNG/PDF bằng Satori (@vercel/og) + chữ ký HMAC trên QR
│           └── analytics/         # Thống kê tỷ lệ sập bẫy theo trường học, độ tuổi, loại thủ đoạn (ẩn danh)
├── packages/
│   ├── scenario-engine/           # Deterministic JSON Graph Engine (Node -> Choices -> Risk Delta -> Debrief)
│   ├── scenarios-dongnai/         # 8-10 kịch bản chuẩn hóa theo dữ liệu lừa đảo tại Đồng Nai
│   └── shared/                    # Scoring rules, Zod schema cho JSON kịch bản
└── docs/
    └── SCENARIO_AUTHORING.md      # Hướng dẫn cán bộ cập nhật thủ đoạn mới không cần đụng code
```

### 4.3 Bộ 8–10 Kịch bản Chuẩn Hóa (Cốt lõi Đề 4)

| Mã | Thủ đoạn thực tế tại Đồng Nai | Skin giao diện | Red-Flag trọng tâm dạy người chơi |
|---|---|---|---|
| `SC-01` | Giả danh Công an/VKS gọi video báo dính đường dây rửa tiền, ép "chứng minh tài chính" | Incoming Call + Chat | Cơ quan công an không làm việc/gửi lệnh bắt qua Zalo/Video call, không yêu cầu chuyển tiền vào "tài khoản tạm giữ" |
| `SC-02` | Tuyển CTV chốt đơn Shopee/TikTok tại nhà, nhiệm vụ đầu trả hoa hồng thật, nhiệm vụ 3 ép nạp tiền | Group Chat + Web | Mô hình "nạp tiền làm nhiệm vụ" luôn khóa rút ở mức nạp lớn |
| `SC-03` | Tin nhắn trúng thưởng xe máy / nhận học bổng, yêu cầu đóng "phí hồ sơ" hoặc bấm link lạ | SMS + Fake Web | Kiểm tra tên miền gốc (`.xyz`, `.vip` giả mạo), không bao giờ đóng phí nhận thưởng |
| `SC-04` | Tài khoản Facebook/Zalo bạn thân bị hack, nhắn tin mượn tiền gấp với lý do tai nạn/đóng viện phí | Zalo Chat | Luôn gọi điện thoại số truyền thống/video check mặt trước khi chuyển tiền |
| `SC-05` | Deepfake giọng nói/khuôn mặt người thân gọi video chập chờn 5 giây rồi tắt máy xin chuyển khoản | Video Call Sim | Kiểm tra câu hỏi bí mật gia đình + gọi lại qua số di động chính thức |
| `SC-06` | Quét mã QR dán đè ở quán trà sữa / bãi xe / cột điện dẫn tới web cài APK chứa mã độc | Camera QR Sim | Không cài file `.apk` ngoài Google Play; kiểm tra tem QR bị dán đè & URL trước khi xác nhận |
| `SC-07` | Giả mạo ngân hàng báo khóa thẻ / cập nhật sinh trắc học qua link gửi tin nhắn | SMS Brandname giả | Ngân hàng không gửi link yêu cầu nhập OTP/mật khẩu qua SMS |
| `SC-08` | Tống tiền nhạy cảm (Sextortion) qua kết bạn làm quen trên app hẹn hò/mạng xã hội | Chat + Escalate | Tuyệt đối không chuyển tiền (chuyển lần 1 sẽ bị đòi mãi), chụp bằng chứng + khóa tài khoản + báo 113/người lớn |

### 4.4 Thiết kế Cơ sở Dữ liệu & Chứng chỉ Chống Giả Mạo

| Bảng | Trường trọng tâm |
|---|---|
| `scenarios` | `id`, `slug`, `title`, `category`, `difficulty`, `graph_json` (validated bằng Zod), `version`, `published_at` |
| `players` | `id`, `display_name`, `school_or_ward`, `age_group`, `zalo_id_hash` (băm 1 chiều bảo vệ dữ liệu vị thành niên 16–18t) |
| `play_sessions` | `id`, `player_id`, `scenario_id`, `choices_trace_json`, `score`, `passed`, `mistakes_tags`, `completed_at` |
| `certificates` | `id`, `serial_no` (`DN-SAFE-2026-XXXXX`), `player_id`, `verify_hmac`, `image_r2_url`, `issued_at` |

**An toàn bắt buộc cho Đề 4:**
1. **Không sử dụng domain/SĐT thật:** Mọi URL giả lập dùng tên miền dành riêng như `*.example.test` hoặc giả định nội bộ; giao diện luôn có banner nhỏ *"TÌNH HUỐNG MÔ PHỎNG GIÁO DỤC"* tránh người khác chụp cắt ghép gây hiểu nhầm.
2. **Guardrail cho AI Roleplay:** Nếu bật mode chat tự do với AI đóng vai kẻ lừa đảo, hệ thống bắt buộc gắn bộ lọc nội dung để AI **không bao giờ** sinh ra đường link truy cập thật, mã độc, hướng dẫn kỹ thuật tấn công, hay thu thập thông tin cá nhân thật (CCCD, số tài khoản) của học sinh.
3. **Bảo vệ dữ liệu người dưới 18 tuổi:** Không bắt buộc nhập CCCD/SĐT thật để lấy chứng chỉ — chỉ cần Tên hiển thị + Trường/Lớp + xác thực phiên chơi. Chứng chỉ sinh ra bằng Satori có chữ ký QR tra cứu tại `/verify/[serial_no]` và meta OpenGraph (`og:image`) để chia sẻ Facebook/Zalo đẹp ngay lập tức.

---

## 5. Chiến Lược Hạ Tầng Dùng Chung (Tối Ưu Chi Phí Cho Cả 4 Đề)

Nếu một đội kỹ thuật hoặc đơn vị tại Đồng Nai vận hành đồng thời 2–4 sản phẩm, nên chuẩn hóa chung 1 nền tảng xương sống để giảm 60% chi phí vận hành:

1. **Kênh tiếp cận công dân & thanh niên thống nhất:** **Zalo Mini App + Progressive Web App (PWA)** là giao diện mặc định (vì >90% người dân, đoàn viên, HS-SV Đồng Nai dùng Zalo hằng ngày, không tốn chi phí ép người dùng cài app riêng trên App Store/CH Play giai đoạn đầu).
2. **Core Stack thống nhất:**
   - **Frontend Web / Admin:** React / Next.js + Tailwind CSS + Lucide Icons + Leaflet/MapLibre.
   - **Backend & DB:** TypeScript (NestJS/Fastify) + PostgreSQL 16 (bật PostGIS cho Đề 2) + Redis + BullMQ.
   - **Object Storage:** Cloudflare R2 (miễn phí egress, lưu ảnh phản ánh Đề 2, mẫu báo cáo Đề 1, video OCOP Đề 3, ảnh chứng chỉ Đề 4).
   - **CI/CD & Agent Rules:** Bộ quy chuẩn `AGENTS.md`, `.github/instructions/*`, `.cursor/rules/*`, và scripts tự động deploy trong repo này.
3. **Chi phí ước tính giai đoạn Pilot (0–10.000 người dùng/tháng):**
   - Frontend Web (Vercel / Cloudflare Pages / GitHub Pages): **0đ/tháng**.
   - Database + PostGIS + Redis (1 VPS 4 vCPU / 8GB RAM hoặc Managed Cloud SQL): **~350.000 – 800.000đ/tháng** cho cả hệ thống.
   - Storage R2 (<10GB ban đầu): **0đ/tháng** (gói free tier).
   - Gửi tin ZNS/OTP (chỉ tính phí theo tin nhắn thật ở Đề 1/2/3): **~200–300đ/tin**.
