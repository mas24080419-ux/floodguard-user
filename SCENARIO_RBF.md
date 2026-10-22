# Dashboard mưa–triều RBF

Trang `scenario.html` là dashboard công khai: nhập mưa 0–200 mm, triều −2…2 m theo mốc nguồn; xem lớp ô trên Leaflet/OSM; tìm đường theo tên và chọn đúng đoạn OSM; tra cứu tọa độ hoặc mã ô; tải CSV. Nút “Kịch bản mưa–triều” trong bản đồ chính mở cùng công cụ và nhận lớp kết quả qua thông điệp cùng origin và đúng iframe.

## Dữ liệu và mô hình
- 49.173 ô 10 m; 11.327 ô giao tim đường có tên; 8.761 đoạn trong danh mục, 1.128 đoạn có ô hỗ trợ.
- Cố định RBF thin-plate/smoothing 0,01 từ `scenario_emulator.joblib`, SHA-256 trong manifest; không huấn luyện lại hoặc dùng nhãn TEST trong trình duyệt.
- Phép tính Float64 từ hệ số TRAIN, bao lồi theo nhóm các ô có cùng mặt nạ kịch bản hợp lệ. Ngoài bao lồi trả UNAVAILABLE, không thay bằng 0 cm.
- Tải hệ số theo phần cần dùng, hai phần đồng thời; Web Worker tính kết quả, cache RAM cho lần tiếp theo. Toàn bộ dữ liệu nén khoảng 47 MB; mặc định chỉ tải phần phục vụ ô tim đường. Chọn toàn vùng sẽ tải thêm dữ liệu.
- Metadata và hệ số được kiểm tra SHA-256 sau giải nén. Lỗi mạng hoặc dữ liệu không khớp làm thất bại truy vấn, không tự tạo dự đoán.
- Độ sâu phân lớp tại 20/40 cm, độc lập với chính sách cảnh báo. Chính sách ưu tiên phát hiện dùng ngưỡng CALIBRATION; chế độ bù sai số dùng buffer từng ô. Scope toàn ô và tim đường dùng đúng bộ ngưỡng tương ứng.

## Phạm vi diễn giải
Đây là kịch bản mới tại vị trí đã có hồ sơ mô phỏng. Không xác lập dự báo trước trận ngập thực tế hoặc thời gian báo trước. Mốc triều và thời lượng mưa chưa được xác minh để chuyển trực tiếp từ quan trắc. LOW có thể bao gồm ngập nông. Lớp bản đồ không làm thay đổi tuyến đi, trạm sạc, SOS hoặc suy ra xe có thể đi qua. Hình học đường chỉ giao tim đường OSM, không phủ đầy đủ mặt đường.

## Tái tạo và kiểm tra
```bash
python tools/export-rbf-dashboard.py --source /path/to/02_MO_HINH_HIEN_TAI --output scenario-data/rbf-v2
node --test tests/scenario.test.cjs tests/scenario.dom.test.cjs
python -m http.server 4173
LOCAL_URL=http://127.0.0.1:4173 node tests/rbf-browser.mjs
```
DOM/browser cần jsdom, Playwright và Chromium. CI `RBF dashboard verification` kiểm tra tự động. Fixture Python nén được tạo từ mô hình gốc; đối chiếu 540.903 cặp (491.730 hữu hạn, 49.173 từ chối), sai lệch tuyệt đối tối đa 5,55e−13 cm. Kiểm tra toàn bộ tâm ô, mã đường, ngưỡng cảnh báo, lỗi mạng, giao diện desktop/mobile, xuất CSV và handoff bản đồ Leaflet.

## Nguồn và giấy phép
MIKE+: https://doi.org/10.5281/zenodo.11353524, CC BY 4.0; tác giả Dang, Quang Thanh, “Integrated Machine Learning model in Early Urban Flooding Warning System – Data”. Hệ số RBF là bản dẫn xuất dùng trong FloodGuard. Hình học và bản đồ đường: © OpenStreetMap contributors, ODbL; https://www.openstreetmap.org/copyright. Hệ tọa độ lưới EPSG:32648, PixelIsArea. Ô RBF dùng ID 0…49172 của bộ toàn ô, không trộn ID mẫu Random Forest 846 ô cũ.

## Triển khai
Dữ liệu đóng băng nằm ở root `scenario-data/rbf-v2`; mobile dùng chung nguồn này. Các file JS/CSS HTML của dashboard được đồng bộ root/mobile. Giữ nguyên đăng nhập và cơ chế định tuyến của website. Không tạo thêm backend hoặc dịch vụ trả phí.
