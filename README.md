# Foodi

Ứng dụng web hỗ trợ lập kế hoạch dinh dưỡng cá nhân: lên lịch bữa ăn theo ngày, theo dõi năng lượng và vi chất, quản lý món ăn và áp dụng thực đơn gợi ý.

---

## Giới thiệu

**Foodi** là hệ thống quản lý dinh dưỡng tập trung vào thực đơn hằng ngày. Người dùng xây dựng lịch ăn trên calendar, ghi nhận khẩu phần từng món và xem tổng hợp calo cùng các chất dinh dưỡng đã nạp. Hệ thống tính mục tiêu năng lượng (TDEE) dựa trên hồ sơ cơ thể và cung cấp thư viện món ăn cùng thực đơn gợi ý do quản trị viên biên soạn.

Phân quyền hai vai trò: **user** (sử dụng ứng dụng) và **admin** (quản trị dữ liệu hệ thống).

---

## Tính năng chính

### Người dùng

- Đăng ký, đăng nhập, quên/đặt lại mật khẩu
- Hồ sơ cá nhân: avatar, chỉ số cơ thể, mục tiêu, TDEE
- Lịch ăn theo ngày; tạo/sửa bữa (sáng, trưa, tối, phụ)
- Thêm món vào bữa, chỉnh khẩu phần (gram), đánh dấu bữa đã ăn
- Theo dõi macro và các vi chất tùy chọn
- Thư viện món cá nhân; tìm kiếm món hệ thống
- Xem và áp dụng thực đơn gợi ý (cả tuần, một ngày hoặc một bữa)

### Quản trị viên

- Dashboard thống kê
- Quản lý người dùng
- Quản lý món ăn global và catalog chất dinh dưỡng
- Biên soạn thực đơn gợi ý (nhiều ngày, công khai/ẩn)

---

## Công nghệ sử dụng

| Tầng          | Công nghệ                                                  |
|---------------|------------------------------------------------------------|
| Frontend      | React, Vite, TypeScript, Tailwind CSS, React Router, Axios |
| Backend       | Node.js, Express, TypeScript, Prisma ORM                   |
| Cơ sở dữ liệu | PostgreSQL 16                                              |
| Xác thực      | JWT (access + refresh token), bcrypt                       |
| Dịch vụ ngoài | Cloudinary (ảnh), Resend (email)                           |

---

## Hướng dẫn cài đặt và chạy

Tài liệu dưới đây mô tả quy trình khởi chạy từ mã nguồn. Thứ tự thực hiện: cấu hình cơ sở dữ liệu → backend → frontend.

---

## 1. Cấu trúc thư mục

| Thư mục     | Vai trò                                       |
| ----------- | --------------------------------------------- |
| `backend/`  | API REST, Prisma ORM, migration, seed dữ liệu |
| `frontend/` | Giao diện                                     |

---

## 2. Yêu cầu môi trường

| Công cụ / dịch vụ | Ghi chú                                       |
| ----------------- | --------------------------------------------- |
| Node.js (LTS)     | Chạy backend và frontend                      |
| npm               | Cài dependency, chạy script                   |
| Docker            | Khởi chạy PostgreSQL qua `docker-compose.yml` |
| PostgreSQL 16     | Có thể dùng instance riêng thay cho Docker    |
| Cloudinary        | Upload avatar, ảnh món, ảnh thực đơn gợi ý    |
| Resend            | Gửi email quên mật khẩu (tùy chọn)            |

---

## 3. Backend

### 3.1. Biến môi trường

Sao chép file mẫu và chỉnh sửa giá trị thực tế:

```powershell
cd backend
copy .env.example .env
```

Nội dung cần cấu hình trong `.env`:

| Biến                                                            | Mô tả                                                           |
| --------------------------------------------------------------- | ----------------------------------------------------------------|
| `DATABASE_URL`                                                  | Chuỗi kết nối PostgreSQL. Với Docker mặc định: `postgresql://admin:000000@localhost:5432/abc?schema=public`|
| `DB_USER`, `DB_PASSWORD`, `DB_NAME`                             | Dùng cho `docker-compose.yml` (phải khớp với `DATABASE_URL`)    |
| `PORT`                                                          | Cổng API — đặt `3000`                                           |
| `JWT_SECRET`, `JWT_EXPIRES_IN`                                  | Ký access token                                                 |
| `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN`              | Ký refresh token                                                |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Upload ảnh                                               |
| `FRONTEND_URL`                                                  | URL frontend — đặt `http://localhost:5173` (link reset mật khẩu)|
| `RESEND_API_KEY`, `MAIL_FROM`                                   | Email reset mật khẩu                                            |
| `SEED_DEMO`                                                     | `true` để luôn chạy seed demo (kể cả production)                |
| `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`| Tài khoản admin khi seed — mặc định: `admin` / `admin@gmail.com` / `123456`  |

### 3.2. Cơ sở dữ liệu (Docker)

Tại thư mục `backend/` (sau khi đã có file `.env`):

```powershell
docker compose up -d
```

Container `datn_postgres_db` lắng nghe cổng **5432**.

### 3.3. Cài dependency

```powershell
npm install
```

### 3.4. Migration và seed

Lệnh sau áp dụng schema, xóa dữ liệu cũ (nếu có) và chạy seed:

```powershell
npx prisma migrate reset
```

Xác nhận prompt khi được hỏi. Seed nạp:

- 24 chất dinh dưỡng
- 1 tài khoản admin
- 41 món ăn global
- 3 thực đơn gợi ý công khai

Dữ liệu demo (admin, món, gợi ý) chạy khi `NODE_ENV !== production` hoặc `SEED_DEMO=true`.

Chỉ migrate (không reset):

```powershell
npx prisma migrate dev
npm run prisma:seed
```

### 3.5. Chạy API

```powershell
npm run dev
```

API phục vụ tại `http://localhost:3000` (theo `PORT` trong `.env`).

---

## 4. Frontend

### 4.1. Cài dependency và chạy

```powershell
cd frontend
npm install
npm run dev
```

Ứng dụng web mở tại `http://localhost:5173`.

### 4.2. Biến môi trường (tùy chọn)

Frontend mặc định gọi API tại `http://localhost:3000`. Khi backend chạy host/cổng khác, tạo `frontend/.env`:

```env
VITE_API_URL=http://localhost:XXXX
```

---

## 5. Truy cập ứng dụng

| Thành phần                     | URL                           |
| ------------------------------ | ----------------------------- |
| Giao diện người dùng / landing | `http://localhost:5173`       |
| Trang quản trị                 | `http://localhost:5173/admin` |
| API backend                    | `http://localhost:3000`       |

Backend chỉ chấp nhận CORS từ `http://localhost:5173`. Đổi cổng frontend cần chỉnh CORS trong `backend/src/index.ts`.

---

## 6. Tài khoản sau seed

| Vai trò | Username                             | Email                                       | Mật khẩu                              |
| ------- | ------------------------------------ | ------------------------------------------- | ------------------------------------- |
| Admin   | `admin` (hoặc `SEED_ADMIN_USERNAME`) | `admin@gmail.com` (hoặc `SEED_ADMIN_EMAIL`) | `123456` (hoặc `SEED_ADMIN_PASSWORD`) |

Người dùng thường đăng ký qua giao diện; seed không tạo user demo ngoài admin.

---

## 7. Luồng khởi chạy tóm tắt

```text
cd backend
copy .env.example .env   → chỉnh DATABASE_URL, PORT=3000, FRONTEND_URL=http://localhost:5173
docker compose up -d     → PostgreSQL
npm install
npx prisma migrate reset → schema + seed
npm run dev              → API :3000

cd ../frontend
npm install
npm run dev              → UI :5173
```

---

## 8. Ghi chú vận hành

- **Upload ảnh**: Cần cấu hình Cloudinary hợp lệ; thiếu credential sẽ lỗi khi upload avatar / ảnh món.
- **Quên mật khẩu**: Cần `RESEND_API_KEY` và `MAIL_FROM`; link reset trỏ tới `FRONTEND_URL/reset-password?token=...`.
- **Reset database**: `npx prisma migrate reset` trong `backend/` — chỉ dùng môi trường dev / nộp bài.
- **Prisma Client**: Sau đổi schema, chạy `npm run prisma:generate`.
