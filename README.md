# Adopet Admin Dashboard

Next.js (App Router) admin cho nền tảng trung gian Adopet. Dashboard này sử dụng Supabase ở 2 chế độ:

- **Service role client**: chỉ chạy phía server để đọc/ghi các bảng escrow, payout, reward, dispute (bỏ qua RLS).
- **Supabase Auth (anon key)**: dùng cho đăng nhập admin, cookie session và middleware bảo vệ tất cả trang nội bộ.

## Tính năng

- **Authentication**: trang `/login`, middleware bảo vệ `/`, `/payouts`, `/disputes`, `/users`, nút đăng xuất ở TopBar.
- **Dashboard tổng quan**: số user, seller, pet, đơn hàng trong ngày, tổng escrow đang giữ, payout & dispute gần nhất.
- **Payout console**: filter trạng thái, cập nhật trạng thái qua server action (processing/completed/failed) có ghi chú.
- **Dispute console**: xem danh sách tranh chấp escrow và gửi quyết định (refund, partial, release, no action) → gọi RPC.
- **User explorer**: danh sách user mới nhất từ `profiles`.

## Cấu trúc

```
/Users/thanvinh/Desktop/adopet-admin
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar + TopBar
│   │   │   ├── page.tsx                # Dashboard
│   │   │   ├── payouts/page.tsx        # Bảng payout + actions
│   │   │   ├── disputes/page.tsx       # Danh sách tranh chấp + xử lý
│   │   │   └── users/page.tsx          # Người dùng mới nhất
│   │   └── login/page.tsx              # Trang đăng nhập công khai
│   ├── components/
│   │   ├── layout/Sidebar.tsx, TopBar.tsx
│   │   ├── auth/LoginForm.tsx
│   │   ├── payouts/PayoutActions.tsx
│   │   └── disputes/ResolveDisputeForm.tsx
│   └── lib/
│       ├── supabase/server.ts          # Service-role client (escrow/payout)
│       └── data/*                      # Hàm fetch số liệu
├── middleware.ts                       # Redirect về /login nếu chưa session
└── .env.local.example                  # Biến môi trường bắt buộc
```

## Môi trường & Auth

Tạo `.env.local` từ `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
ADMIN_EMAIL=ops@example.com
ADMIN_PASSWORD=super-secure-password
```

- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: thông tin đăng nhập nội bộ cho trang admin. Middleware lưu session bằng cookie HTTP-only (`adopet-admin-session`) trong 7 ngày.
- `SUPABASE_SERVICE_ROLE_KEY`: **chỉ** dùng trên server (Next.js) để truy vấn các bảng đã bật RLS. Tuyệt đối không expose lên client.

## Chạy dự án

```bash
npm install
npm run dev
```

- Mở `http://localhost:3000/login`, đăng nhập bằng cặp `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- Sau khi login thành công, middleware sẽ cho phép truy cập các trang `/`, `/payouts`, `/disputes`, `/users`.
- `npm run lint` đã chạy sạch lỗi (bao gồm các file mới).

## Liên kết với migrations Adopet

Dashboard này đọc dữ liệu từ các bảng được tạo trong migrations `039` → `042` của repo chính:

- `escrow_accounts`, `platform_commissions` – theo dõi escrow + commission
- `seller_bank_accounts`, `payout_records` – payout system
- `notifications` – thông báo escrow/payout
- `user_rewards`, `reward_transactions`, `product_reviews`, `escrow_disputes`, `dispute_messages`

Các RPC đã dùng: `refund_escrow_to_buyer`, `release_escrow_to_seller` (trigger từ admin dispute, payouts).

## Định hướng mở rộng

- Thêm RBAC (chỉ cho phép email thuộc whitelist) hoặc SSO nội bộ
- Gửi notification ngay trong admin sau khi cập nhật payout/dispute
- Trang chi tiết seller (bank accounts + lịch sử payout)
- Charts cho escrow volume theo thời gian
- Audit log cho hành động admin

## Scripts

- `npm run dev`: phát triển
- `npm run build`: build production
- `npm start`: chạy build production
- `npm run lint`: kiểm tra ESLint

> Dự án admin độc lập với thư mục `Adopet/`, thuận tiện deploy / hosting riêng cho team vận hành.
