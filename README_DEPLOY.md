# FloodGuard User 3.2 — Auth Initialization Fix

Bản hotfix cho lỗi `Cannot read properties of null (reading auth)` khi người dùng bấm đăng ký trước khi Supabase client khởi tạo xong.

## Yêu cầu backend
- FloodGuard Rescue Backend 19.0 đang Live.
- `GET /api/public-config` trả `multi_user: true` và `supabase.url`, `supabase.anon_key`.

## Cập nhật
Upload đè toàn bộ file của thư mục này vào repo `floodguard-user`. Render Static Site sẽ tự deploy lại.
