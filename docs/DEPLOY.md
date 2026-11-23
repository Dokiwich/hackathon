# Hướng Dẫn Đưa Web Lên Internet Qua Cloudflare

Cả 4 thư mục đề (`de-1-so-tay-chi-doan`, `de-2-tai-mat-cong-dan`, `de-3-ocop-len-san`, `de-4-chong-lua-101`) đều đã cấu hình sẵn `_redirects` (SPA routing không lỗi 404 khi F5) và `_headers` (bảo mật + quyền GPS/Camera + CSP).

---

## Cách 1: Chạy 1 Lệnh Từ Máy Đẩy Thẳng Lên Cloudflare Pages (Nhanh Nhất)

Script [`scripts/deploy-cloudflare.ps1`](../scripts/deploy-cloudflare.ps1) sẽ tự kiểm tra đăng nhập Cloudflare (lần đầu tự mở trình duyệt để bấm *Allow*), tự tạo project Pages nếu chưa có, build bản production và xuất bản lên tên miền HTTPS miễn phí `https://<ten-project>.pages.dev`.

**Windows PowerShell (chạy tại `d:\hackathon`):**
```powershell
npm run cf:de2        # Đẩy Đề 2 lên https://de-2-tai-mat-cong-dan.pages.dev
npm run cf:de1        # Đẩy Đề 1 lên https://de-1-so-tay-chi-doan.pages.dev
npm run cf:de3        # Đẩy Đề 3 lên https://de-3-ocop-len-san.pages.dev
npm run cf:de4        # Đẩy Đề 4 lên https://de-4-chong-lua-101.pages.dev
```

**Đặt tên miền `.pages.dev` riêng hoặc chỉ đẩy bản xem thử (`preview`):**
```powershell
.\scripts\deploy-cloudflare.ps1 -App de2 -ProjectName tai-mat-cong-dan-dong-nai
.\scripts\deploy-cloudflare.ps1 -App de2 -Preview
```

**Linux / macOS / WSL:**
```bash
./scripts/deploy-cloudflare.sh --app de2 --project tai-mat-cong-dan-dong-nai
```

---

## Cách 2: Nối GitHub Với Cloudflare Dashboard (Tự Động Deploy Khi `git push`)

Nếu muốn mỗi lần `git push origin main` là web tự cập nhật trên Cloudflare không cần chạy lệnh từ máy:
1. Đăng nhập **Cloudflare Dashboard** → **Workers & Pages** → **Create** → chọn tab **Pages** → **Connect to Git**.
2. Chọn repo `Dokiwich/hackathon` và nhánh **Production branch**: `main`.
3. Điền **Build configuration** cho đúng đề bạn muốn xuất bản:
   - **Root directory (Advanced):** nhập tên thư mục đề, ví dụ `de-2-tai-mat-cong-dan`
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Bấm **Save and Deploy** — sau ~40 giây web sẽ chạy vĩnh viễn tại `https://<project>.pages.dev`.

*(Có thể tạo tối đa nhiều Pages project trỏ vào cùng 1 repo với 4 `Root directory` khác nhau để cả 4 đề đều có URL riêng.)*

---

## Cách 3: Đẩy Bằng GitHub Actions (`Deploy to Cloudflare Pages`)

Nếu muốn bấm nút deploy từ tab **Actions** trên GitHub:
1. Vào **Cloudflare Dashboard → My Profile → API Tokens → Create Token** → chọn mẫu **Edit Cloudflare Workers** (hoặc quyền `Cloudflare Pages: Edit`) để lấy `CLOUDFLARE_API_TOKEN`, và copy **Account ID** ở trang tổng quan Cloudflare (`CLOUDFLARE_ACCOUNT_ID`).
2. Vào GitHub Repo → **Settings → Secrets and variables → Actions**, thêm 2 Repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Vào tab **Actions → Deploy Selected App to Cloudflare Pages → Run workflow**, chọn `app` (`de-1`..`de-4`) và bấm chạy.

---

## Cách 4: Mở Link HTTPS Tạm Trong 10 Giây Bằng Cloudflare Quick Tunnel

Dùng khi cần test GPS/Camera trên điện thoại hoặc mở nhanh web/API đang chạy ở `localhost` cho ban giám khảo xem trực tiếp mà không cần đăng nhập tài khoản:

- **Terminal 1 — chạy web local:**
  ```powershell
  npm run dev:de2
  ```
- **Terminal 2 — mở đường hầm HTTPS Cloudflare:**
  ```powershell
  npm run tunnel:de2         # Mở link https://*.trycloudflare.com cho Frontend Đề 2
  npm run tunnel:api:de2     # Hoặc mở link HTTPS cho Backend API Đề 2 (port 4002)
  ```
*(Tương tự với `tunnel:de1`, `tunnel:de3`, `tunnel:de4`.)*

---

## 5. Gắn Tên Miền Riêng, Triển Khai Backend & Đóng Gói `.zip`

- **Tên miền riêng (Custom Domain):** Trên Cloudflare Pages → chọn project → tab **Custom domains → Set up a custom domain**, nhập tên miền (VD `taimat.dongnai.vn`) — Cloudflare tự cấp SSL miễn phí.
- **Kết nối Backend API:** Khi deploy Backend (`<track>/backend/` lên Cloud Run / Fly.io / VPS), thêm origin domain API vào `connect-src` trong `<track>/public/_headers` và `<track>/vercel.json`, đồng thời khai báo biến `VITE_API_BASE_URL` trong Cloudflare Pages → **Settings → Environment variables**.
- **Triển khai Backend API:**
  ```powershell
  docker compose -f de-2-tai-mat-cong-dan/backend/docker-compose.yml up -d
  .\scripts\deploy-backend.ps1 -App de2 -Target cloudrun -Region asia-southeast1
  ```
- **Đóng gói `.zip` (`dist.zip` + `source.zip` vào `release/`):**
  ```powershell
  npm run pack        # Đóng gói cả 4 đề
  npm run pack:de2    # Đóng gói riêng Đề 2
  ```
