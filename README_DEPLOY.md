# FloodGuard User - Production Static Site

Backend đã cấu hình sẵn: `https://floodguard-rescue-backend.onrender.com`

## Upload GitHub
Tạo repo `floodguard-user`, upload toàn bộ file trong thư mục này vào **root** repo.

## Render
New -> Static Site -> chọn repo.
- Build Command: để trống (hoặc `echo static`)
- Publish Directory: `.`

Sau khi deploy, người dùng chỉ cần mở URL của Static Site. Không cần cấu hình Webhook/Sync URL.

## PWA
Website có manifest + service worker. Trên trình duyệt hỗ trợ, người dùng có thể Add to Home Screen.
