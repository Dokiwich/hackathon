# Hướng Dẫn Đóng Gói & Triển Khai Lên Internet

Repo hỗ trợ xuất bản cả **4 thư mục độc lập** theo 2 chế độ:
- **Triển khai Portal Hub (`-App all`):** Một link duy nhất trỏ tới `/de-1/`, `/de-2/`, `/de-3/`, `/de-4/`.
- **Triển khai hoặc Đóng gói riêng 1 Đề (`de1` | `de2` | `de3` | `de4`):** Khi bốc trúng đề nào, build, đóng gói `.zip` hoặc xuất bản riêng đúng thư mục đó lên `/` domain gốc.

---

## 1. Đóng gói file `.zip` (Để nộp bài, chia sẻ hoặc upload host thủ công)

Chạy từ thư mục gốc `d:\hackathon`:
```powershell
npm run pack            # Đóng gói cả 4 đề vào thư mục release/
npm run pack:de1        # Chỉ đóng gói Đề 1
npm run pack:de2        # Chỉ đóng gói Đề 2
npm run pack:de3        # Chỉ đóng gói Đề 3
npm run pack:de4        # Chỉ đóng gói Đề 4
```

Mỗi đề tạo ra 2 file trong `release/`:
- `release/<ten-de>-dist.zip`: Bản build tĩnh đã biên dịch sẵn (`index.html`, `assets/`, `_redirects`, `_headers`, `manifest.webmanifest`, `favicon.svg`), chỉ việc kéo thả lên Netlify Drop / Cloudflare Pages / hosting bất kỳ.
- `release/<ten-de>-source.zip`: Toàn bộ mã nguồn sạch (đã loại bỏ `node_modules/`, `dist/`, `.env*`, `*.log`) để gửi nộp bài hoặc tách thành repo Git độc lập.

---

## 2. Triển khai tự động lên Internet

### Cách A: GitHub Pages (Miễn phí, không cần tài khoản ngoài)
Workflow [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) tự động build `dist-pages/` mỗi khi push lên `main`:
- Portal chọn đề: `https://<username>.github.io/<repo-name>/`
- Ứng dụng từng đề: `/de-1/`, `/de-2/`, `/de-3/`, `/de-4/`

Trên GitHub: vào **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Hoặc đẩy thủ công từ Windows:
```powershell
npm run deploy:gh                                         # Deploy Hub 4 đề
.\scripts\deploy.ps1 -App de2 -Target gh-pages -Prod      # Chỉ deploy riêng Đề 2
```

### Cách B: Vercel / Cloudflare Pages / Netlify (1 Lệnh Từ Máy)

**Windows PowerShell:**
```powershell
npm run deploy:vercel
npm run deploy:cf
npm run deploy:netlify

# Hoặc xuất bản riêng 1 đề ra domain gốc '/':
.\scripts\deploy.ps1 -App de1 -Target vercel -Prod
.\scripts\deploy.ps1 -App de2 -Target cloudflare -Prod -ProjectName tai-mat-cong-dan-dong-nai
.\scripts\deploy.ps1 -App de4 -Target netlify -Prod
```

**Linux / macOS / WSL:**
```bash
./scripts/deploy.sh vercel --app all --prod
./scripts/deploy.sh cloudflare --app de2 --prod --project tai-mat-cong-dan-dong-nai
```

**Hoặc bấm chạy trên GitHub Actions:**
Vào tab **Actions → Deploy Selected App to Vercel or Cloudflare Pages → Run workflow**, chọn `app` (`de-1-so-tay-chi-doan` .. `de-4-chong-lua-101`) và `target` (`cloudflare-pages` | `vercel`).

---

## 3. Triển Khai Backend API (`<track>/backend/`)

Mỗi thư mục đề có sẵn khung Fastify API chuẩn 3 tầng (`routes -> controller -> service -> repository`), `Dockerfile` multi-stage và `docker-compose.yml` (PostgreSQL 16 + Redis 7, riêng Đề 2 dùng PostGIS `postgis/postgis:16-3.4-alpine`).

**Chạy DB + Redis cục bộ bằng Docker Compose:**
```powershell
docker compose -f de-2-tai-mat-cong-dan/backend/docker-compose.yml up -d
npm run dev:api:de2
```

**Đẩy API lên Internet (Google Cloud Run / Fly.io / Docker):**
```powershell
.\scripts\deploy-backend.ps1 -App de2 -Target cloudrun -Region asia-southeast1
.\scripts\deploy-backend.ps1 -App de1 -Target fly
.\scripts\deploy-backend.ps1 -App de3 -Target docker
```
*(Linux/macOS/WSL: `./scripts/deploy-backend.sh cloudrun --app de2 --region asia-southeast1`)*

Khi deploy production thật, cấu hình biến môi trường `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` (>= 32 ký tự) và `CORS_ORIGINS` đúng tên miền frontend.

---

## 4. Lưu Ý Bảo Mật & HTTPS
- Trên điện thoại, GPS (`de-2`) và Camera (`de-1`, `de-2`, `de-3`) chỉ hoạt động qua **HTTPS**.
- Khi nối Frontend với Backend deploy trên domain khác (VD: `https://*.run.app` hoặc `api.dongnai.gov.vn`), thêm origin API đó vào chỉ thị `connect-src` trong `vercel.json` và `public/_headers` của đề tương ứng.
- Khi nối Git Integration trên Vercel/Cloudflare Dashboard cho 1 đề duy nhất, đặt **Root Directory** bằng đúng tên thư mục đề (VD: `de-2-tai-mat-cong-dan`).
