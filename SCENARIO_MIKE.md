# Kịch bản MIKE+ trên FloodGuard

Trang `scenario.html` và nút “Kịch bản MIKE+” trong bản đồ chính sử dụng dữ liệu có nguồn, tách khỏi bộ máy lịch sử hiện có.

- Nguồn: Dang, Quang Thanh (2024), DOI10.5281/zenodo.11353524; mã tham chiếu DOI10.5281/zenodo.11365883. Metadata nguồn ghi CC BY4.0.
- Dữ liệu hiển thị:846 ô mẫu tại các hàng dùng phát triển;231 tổ hợp mưa0–200mm/bước10 và triều−2–2m/bước0,4. Lưới nguồn khoảng10m, EPSG32648.
- MIKE+ là đầu ra công bố của tác giả, không phải nhóm chạy lại MIKE+. RF là pipeline hồi quy đã huấn luyện trong dự án; xuất dự đoán trước cho đúng231 tổ hợp. Không tự nội suy theo lượng mưa hoặc tọa độ.
- Độ sâu thiếu/âm được cách ly ở cả hai phương pháp. Điểm ngoài ô mẫu trả chưa đủ dữ liệu. Các tâm ô được chuyển sang WGS84 bằng pyproj; đa giác4góc được dùng kiểm tra tọa độ.
- Theo dõi:<10cm; cảnh giác:10–<30cm; cao:≥30cm. Đây là nhóm sàng lọc theo độ sâu, không phải mô hình ba lớp đã kiểm định hoặc chuẩn an toàn xe điện. Mốc10cm tham khảo Scheiber etal.,2023,DOI10.5194/nhess-23-2313-2023; mốc30cm tham khảo Pregnolato etal.,2017,DOI10.1016/j.trd.2017.06.020. Không áp dụng kết quả giao thông ở nghiên cứu khác thành bảo đảm đi qua tại TP.HCM.
- Chưa kiểm định thực địa; chưa xác nhận thời lượng mưa, mốc triều, hình học đoạn đường hoặc lối vào trạm sạc. Không đưa mô phỏng vào quan sát thực tế, không phát email/SOS từ tính năng này.

`tools/export-mike-scenarios.py --project PATH` tái xuất từ gói nghiên cứu đã rà soát. Manifest giữ checksum dữ liệu/mô hình. Gzip nhằm giảm dung lượng; trình duyệt kiểm SHA256 dữ liệu sau giải nén. Trình duyệt cần hỗ trợWebCrypto vàDecompressionStream (hoặc máy chủ giải nén trước).

Kiểm tra:

```
node --test tests/scenario.test.cjs tests/cache-reliability.test.cjs
# DOM tests cần jsdom:
node --test tests/scenario.dom.test.cjs
```

Lớp bản đồ được thêm riêng, có nút ẩn, không cập nhật dữ liệu đường đi hoặc bộ định tuyến. Chỉ nhận thông điệp từiframe cùng nguồn, kiểm số lượng/miền tọa độ và trạng thái chưa kiểm định. Kết quả không phải bằng chứng hoàn thành so sánh hai nguồn huấn luyện trên cùng thực tế2026.
