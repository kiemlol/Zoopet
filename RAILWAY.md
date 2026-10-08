# Railway Deploy — Zoo Pet (Frontend + Backend + PostgreSQL)

## 1. Tạo project mới trên Railway
- railway.app → New Project → Deploy from GitHub → chọn repo `kiemlol/Zoopet`

## 2. Service 1: Frontend (web tĩnh)
- Railway tự tạo service từ repo. Vào Settings:
  - **Build Command:** `node scripts/restore.mjs && npm run build`
  - **Output Directory:** `dist`
  - **Start Command:** để trống (static site, Railway tự serve)
- Railway sẽ cấp domain `*.up.railway.app`

## 3. Service 2: Backend (game server)
- Trong project → New → GitHub Repo → chọn lại repo `kiemlol/Zoopet`
- Vào Settings:
  - **Build Command:** `node scripts/restore.mjs && npm install`
  - **Start Command:** `npm start`
    (chạy `node server/server.mjs`, port 8787)
- **Biến môi trường:** Railway tự inject `PORT`, server đã hỗ trợ.

## 4. Database PostgreSQL
- Trong project → New → Database → Add PostgreSQL
- Railway tự tạo biến `DATABASE_URL` và inject vào các service cùng project.
- Server tự tạo bảng qua `schema.sql` (IF NOT EXISTS) khi khởi động.

## 5. Nối frontend với backend
- Trong code frontend, URL server lấy từ biến môi trường hoặc config.
- Nếu frontend cần biết URL backend: vào service backend → Settings → Networking → Generate Domain → copy URL → thêm vào biến môi trường của service frontend (ví dụ `VITE_SERVER_URL`).

## Lưu ý
- Không cần file `railway.json` — cấu hình qua dashboard là đủ.
- File `render.yaml` ở root repo chỉ dùng cho Render, Railway bỏ qua.
- Gói miễn phí Railway: $5 credit/tháng. Web tĩnh + server Node nhỏ + Postgres đủ dùng cho test.
