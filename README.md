# 🏠 RentEasy - Hệ Thống Quản Lý Bất Động Sản & Cho Thuê Trọ

**RentEasy** là giải pháp toàn diện giúp chủ nhà (Owner) dễ dàng quản lý hệ thống nhà trọ, căn hộ dịch vụ, chung cư mini, khách thuê, hợp đồng và tính toán hóa đơn hàng tháng một cách minh bạch, tự động và an toàn.

---

## 🚀 Tính Năng Nổi Bật

### 🔐 1. Xác thực & Bảo mật (Authentication & Security)
- **Đăng ký / Đăng nhập an toàn**: Mã hóa mật khẩu bằng thuật toán tiên tiến `Argon2`.
- **Cơ chế JWT Session Rotation**: Quản lý `Refresh Session` độc lập, hỗ trợ tự động thu hồi và **phát hiện Token Reuse (Phát hiện sử dụng lại token trái phép)**.
- **Chống tấn công Brute-Force**: Tích hợp Custom Rate Limiting Guard dựa trên Redis/In-Memory cho các endpoint nhạy cảm (Auth, Login, Register).
- **Nhật ký hệ thống (Audit Logs)**: Ghi nhận chi tiết lịch sử thao tác người dùng (đăng nhập, thay đổi thông tin, tạo hợp đồng, thanh toán...).

### 🏢 2. Quản Lý Bất Động Sản & Phòng Trọ (Properties & Rooms)
- Quản lý đa dạng mô hình: Nhà riêng, dãy phòng trọ, chung cư mini, căn hộ dịch vụ...
- Cấu hình trạng thái phòng linh hoạt (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `INACTIVE`).
- Quản lý diện tích, sức chứa, giá thuê niêm yết, tiền cọc và tầng lầu.

### 👥 3. Quản Lý Khách Thêu (Tenants)
- Lưu trữ thông tin cá nhân khách thuê: Họ tên, số điện thoại, CCCD/CMND, ngày cấp, nơi cấp, địa chỉ thường trú.
- Theo dõi lịch sử thuê trọ và các hợp đồng liên quan.

### 📝 4. Quản Lý Hợp Đồng (Contracts)
- Lập hợp đồng thuê trọ trực quan, thiết lập ngày bắt đầu/kết thúc, tiền phòng hàng tháng, tiền cọc.
- Theo dõi trạng thái hợp đồng (`PENDING`, `ACTIVE`, `EXPIRED`, `TERMINATED`, `CANCELLED`).
- Tự động thanh lý hợp đồng và ghi nhận lý do kết thúc.

### 🧾 5. Quản Lý Hóa Đơn & Thanh Toán (Invoices & Payments)
- Tự động tính hóa đơn hàng tháng: Tiền phòng + Điện + Nước + Dịch vụ + Chi phí khác - Giảm giá.
- Theo dõi trạng thái hóa đơn (`DRAFT`, `UNPAID`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`).
- Quản lý lịch sử thanh toán (Tiền mặt, Chuyển khoản ngân hàng, Thẻ tín dụng) với mã biên nhận riêng biệt.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### 🖥️ Backend (`rent_easy-backend`)
- **Framework**: [NestJS v11](https://nestjs.com/) (Node.js/TypeScript)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM v6](https://www.prisma.io/)
- **Caching & Rate Limiting**: [Redis](https://redis.io/) (`ioredis`)
- **Security**: Argon2, Passport JWT, Custom Rate Limiter Decorator & Guards
- **Validation & Transformation**: `class-validator`, `class-transformer`
- **Testing**: Jest

### 🎨 Frontend (`rent_easy-frontend`)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), `tw-animate-css`
- **UI Components**: Radix UI / Base UI, Custom UI System, `lucide-react`
- **State Management & Data Fetching**: [TanStack Query v5](https://tanstack.com/query), [Zustand](https://zustand-demo.pmnd.rs/)
- **Form & Validation**: `react-hook-form` + `zod`
- **HTTP Client**: Axios
- **Notifications**: Sonner

---

## 📐 Kiến Trúc Hệ Thống (Architecture)

```mermaid
graph TD
    Client[Next.js 16 Frontend App] -->|REST API Requests| API[NestJS Backend Gateway]
    
    subgraph Backend Core Modules
        API --> Auth[Auth Module - JWT / Argon2]
        API --> Prop[Property & Room Module]
        API --> Tenant[Tenant Module]
        API --> Contract[Contract Module]
        API --> Invoice[Invoice & Payment Module]
        API --> Audit[Audit Log Module]
    end
    
    Auth -->|Rate Limit Check| Redis[(Redis Cache / Memory)]
    Auth -->|Session Tracking| DB[(PostgreSQL Database)]
    Prop --> DB
    Tenant --> DB
    Contract --> DB
    Invoice --> DB
    Audit --> DB
```

---

## 📂 Cấu Trúc Dự Án (Project Structure)

```text
rent_easy-project/
├── rent_easy-backend/          # NestJS Server Application
│   ├── prisma/                 # Database Schema & Migrations
│   │   └── schema.prisma       # Prisma Models (User, Property, Room, Contract, Invoice...)
│   ├── src/
│   │   ├── common/             # Guards, Decorators, Interceptors, Filters
│   │   └── modules/            # Auth, Users, Properties, Rooms, Tenant, Contract, Invoices...
│   ├── package.json
│   └── tsconfig.json
│
├── rent_easy-frontend/         # Next.js 16 Client Application
│   ├── src/
│   │   ├── app/                # App Router Pages & Layouts (Dashboard, Auth, etc.)
│   │   ├── components/         # Reusable UI Components
│   │   ├── services/           # API Services & Axios Interceptors
│   │   ├── store/              # Zustand Global Stores
│   │   └── types/              # TypeScript Definitions
│   ├── package.json
│   └── tailwind.config.ts
└── README.md
```

---

## ⚡ Hướng Dẫn Cài Đặt & Khởi Chạy (Getting Started)

### 📋 Yêu Cầu Tiền Đề (Prerequisites)
- **Node.js**: `v20.x` trở lên
- **npm**: `v10.x` trở lên
- **PostgreSQL**: `v14` trở lên
- **Redis Server** (Tùy chọn, để hỗ trợ distributed rate limiting)

---

### 1️⃣ Khởi Chạy Backend (`rent_easy-backend`)

1. **Di chuyển vào thư mục backend**:
   ```bash
   cd rent_easy-backend
   ```

2. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

3. **Cấu hình môi trường (`.env`)**:
   Tạo file `.env` tại thư mục `rent_easy-backend/`:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://postgres:password@localhost:5432/rent_easy_db?schema=public"
   REDIS_HOST="localhost"
   REDIS_PORT=6379
   JWT_ACCESS_SECRET="your_access_token_secret"
   JWT_REFRESH_SECRET="your_refresh_token_secret"
   JWT_ACCESS_EXPIRES_IN="15m"
   JWT_REFRESH_EXPIRES_IN="7d"
   ```

4. **Chạy Prisma Migration**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Khởi chạy Server ở chế độ Development**:
   ```bash
   npm run start:dev
   ```
   > Backend sẽ lắng nghe tại: `http://localhost:3000`

---

### 2️⃣ Khởi Chạy Frontend (`rent_easy-frontend`)

1. **Di chuyển vào thư mục frontend**:
   ```bash
   cd rent_easy-frontend
   ```

2. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

3. **Cấu hình môi trường (`.env.local`)**:
   Tạo file `.env.local` tại thư mục `rent_easy-frontend/`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3000"
   ```

4. **Khởi chạy ứng dụng Next.js**:
   ```bash
   npm run dev
   ```
   > Frontend sẽ lắng nghe tại: `http://localhost:3000` (hoặc `http://localhost:3001` nếu port 3000 đang được dùng bởi backend).

---

## 🧪 Kiểm Thử (Testing)

Đối với Backend:
```bash
cd rent_easy-backend

# Chạy Unit Tests
npm run test

# Chạy Test Coverage
npm run test:cov
```

---

## 📜 Giấy Phép & Tác Giả (License & Author)

- **Tác giả**: Tran Quoc Dong ([@tranquocdong1](https://github.com/tranquocdong1))
- **Dự án**: RentEasy - Rental Property Management System
