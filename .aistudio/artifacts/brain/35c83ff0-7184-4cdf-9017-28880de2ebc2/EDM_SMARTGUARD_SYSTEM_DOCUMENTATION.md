# BÁO CÁO THẨM ĐỊNH & TÀI LIỆU TOÀN DIỆN HỆ THỐNG EDM SMARTGUARD AI
## HỆ THỐNG GIÁM SÁT THỜI GIAN THỰC, BẢO TRÌ DỰ ĐOÁN & CHẨN ĐOÁN SỰ CỐ THIẾT BỊ EDM/CNC CÔNG NGHIỆP TÍCH HỢP AI GEMINI

**Mã tài liệu:** `DOC-EDM-SMARTGUARD-2026-V2.5`  
**Phiên bản hệ thống:** `v2.5.0 Industrial Edition`  
**Mục đích:** Xuất tài liệu kỹ thuật & nghiệp vụ phục vụ việc đánh giá, thẩm định và nghiệm thu hệ thống  

---

## MỤC LỤC TÀI LIỆU
1. **Tổng Quan Hệ Thống & Tầm Nhìn Chiến Lược**
2. **Kiến Trúc Kỹ Thuật & Ngăn Xếp Công Nghệ (Tech Stack)**
3. **Danh Mục 17 Phân Hệ & Tính Năng Chuyên Sâu**
4. **Từ Điển Dữ Liệu & Bảng Dải Danh Định Cảm Biến IoT**
5. **Quy Trình Thao Tác Chuẩn (Standard Operating Workflows)**
6. **Bộ Tiêu Chí Đánh Giá & Ma Trận Kiểm Thử Nghiệm Thu (KPIs & Acceptance Criteria)**

---

## 1. TỔNG QUAN HỆ THỐNG & TẦM NHÌN CHIẾN LƯỢC

### 1.1. Bối cảnh
Trong gia công khuôn mẫu và cơ khí chính xác, các dòng máy phóng điện tia lửa điện (**Wire-cut EDM** - Cắt dây, **Sinker EDM** - Bắn điện xung chìm, **High-speed Milling**) đòi hỏi độ chính xác micron và hoạt động liên tục 24/7. Các hư hỏng đột ngột (đứt dây cắt, sụt áp suất dung môi làm mát, quá nhiệt Chiller, cháy bo xung, bám muội cảm biến) gây tổn thất lớn về tiến độ sản xuất và chi phí phôi hỏng.

### 1.2. Giải pháp EDM SmartGuard AI
Hệ thống **EDM SmartGuard AI** được xây dựng nhằm tạo ra một hệ sinh thái đồng bộ khép kín:
- **Giám sát IoT thời gian thực:** Thu thập liên tục 9 thông số cảm biến công nghiệp, tự động phát hiện dị thường và tính toán điểm sức khỏe thiết bị (Health Score Arc Gauge).
- **Trợ lý AI chẩn đoán siêu tốc:** Ứng dụng mô hình Gemini API cung cấp SOP khắc phục sự cố, danh mục dụng cụ cách điện và linh kiện thay thế chỉ trong 3 giây.
- **Hỗ trợ thao tác rảnh tay hiện trường:** Tích hợp Voice-to-Text tiếng Việt và Text-to-Speech (Audio SOP) giúp kỹ thuật viên vừa nghe hướng dẫn vừa thao tác máy.
- **Bộ não học hỏi liên tục (Human-in-the-Loop):** Tự động tổng hợp tri thức kép từ tài liệu SOP OEM và các báo cáo nghiệm thu thực chiến của kỹ thuật viên.
- **Trung tâm điều hành EQM Leader:** Cung cấp bảng điều phối lệnh sửa chữa, phân công KTV 1-chạm, bảng xếp hạng MTTR, biểu đồ Radar kỹ năng trên 5 dòng máy EDM và ghi chú nhắc việc nhanh (Quick Notes).

---

## 2. KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ CỐT LÕI

| Lớp Kiến Trúc | Công Nghệ Sử Dụng | Vai Trò & Điểm Nổi Bật |
| :--- | :--- | :--- |
| **Giao Diện (Frontend)** | React 18, TypeScript, Tailwind CSS, Lucide Icons | Giao diện công nghiệp Industrial Dark Theme, phản hồi thời gian thực, responsive PC & Mobile |
| **Trực Quan Hóa (Visualization)** | Recharts, SVG Spider/Radar Chart, Canvas Waveforms | Vẽ biểu đồ OEE ComposedChart 7 ngày, Radar Chart 5 dòng máy, Sparklines 60 giây |
| **Backend & API Gateway** | Node.js, Express, WebSockets | Xử lý API RESTful, quản lý trạng thái máy và kỹ thuật viên, proxy an toàn cho AI |
| **Trí Tuệ Nhân Tạo (AI Engine)** | Google Gemini API SDK (`@google/genai`) | Phân tích nguyên nhân gốc rễ, đối chiếu tài liệu RAG, trợ lý chat Copilot, tổng hợp tri thức |
| **Giọng Nói & Âm Thanh (Speech AI)** | Web Speech API & Web Audio Synthesizer | Nhập triệu chứng giọng nói tiếng Việt rảnh tay; phát âm thanh còi báo và Audio SOP |
| **Đồng Bộ Ngoại Tuyến (Offline-First)** | Service Worker PWA, IndexedDB, LocalStorage | Hoạt động độc lập khi mất mạng xưởng cơ khí, tự động đẩy hàng đợi đồng bộ khi có mạng |
| **Xuất Báo Cáo & Dữ Liệu** | jsPDF, CSV Exporter, Markdown Engine | Xuất phiếu lý lịch máy (Machine Dossier PDF), trích xuất dữ liệu vận hành CSV |

---

## 3. DANH MỤC 17 PHÂN HỆ VÀ TÍNH NĂNG CHI TIẾT

1. **Giám Sát IoT Telemetry Thời Gian Thực:** Đo kiểm 9 thông số cảm biến phóng điện, hiển thị Sparklines 60s và đồng hồ đo độ trễ mạng.
2. **Đồng Hồ Arc Gauge Chỉ Số Sức Khỏe Thiết Bị:** Biểu đồ cung tròn 250 độ đo độ tin cậy từ 0-100%, phân hạng A, B, C, D tự động theo tần suất sự cố và thời gian chạy liên tục.
3. **Menu Tác Vụ Nhanh (Quick Actions):** Đặt lại bộ đếm bảo dưỡng 500h/linh kiện, hiệu chuẩn cảm biến 4 giai đoạn mô phỏng PLC và cưỡng bức đồng bộ Modbus TCP/IP.
4. **Bàn Phím Công Nghiệp & Phím Tắt Tốc Độ Cao:** Tổ hợp phím Alt+1..5, Alt+K, Alt+Q, Shift+R tối ưu cho kỹ thuật viên đeo găng tay bảo hộ cách điện.
5. **Bộ Lọc Nâng Cao & Bộ Lọc Nhanh Tùy Chỉnh:** Lọc đa chiều theo ca làm việc, nhiệt độ, Uptime; hỗ trợ lưu vĩnh viễn các cấu hình lọc riêng kèm màu sắc và icon.
6. **Factory Health Trend & Dự Báo Uptime 7 Ngày:** Biểu đồ Recharts ComposedChart phân tích 3 trụ cột OEE (A, P, Q) đối chiếu đường chuẩn World-Class 85%.
7. **AI Chẩn Đoán Sự Cố & Nhập Giọng Nói Tiếng Việt Rảnh Tay:** Mô tả âm thanh/triệu chứng qua micro, AI Gemini trích xuất nguyên nhân và cảnh báo an toàn.
8. **Chẩn Đoán Đối Chiếu Lịch Sử Máy (Historical Failure Correlation):** Phân tích tương quan các lần sửa chữa trước đây của máy, phát hiện nguy cơ hư hỏng lặp lại.
9. **Trợ Lý Copilot AI Phân Xưởng & Audio SOP:** Chatbox hỏi đáp chuyên sâu cơ khí EDM và chức năng Text-to-Speech đọc to từng bước hướng dẫn thao tác.
10. **Nghiệm Thu Hiện Trường & AI Dự Báo Thời Gian Sửa Chữa (ETTR):** Dự báo số phút sửa chữa hoàn tất và nạp tri thức nghiệm thu vào Bộ não AI (Human-in-the-Loop).
11. **Trung Tâm Lịch Sử Bảo Trì Sửa Chữa (Maintenance History Hub):** Cơ sở dữ liệu số hóa lịch sử từng máy, hỗ trợ xem dạng Thẻ (Cards) hoặc Bảng (Table) và xuất file CSV.
12. **Quản Lý Thiết Bị Di Động & Push Notification Simulator:** Mô phỏng thông báo đẩy khẩn cấp khi máy dừng đột ngột hoặc khi KTV nhận huy hiệu khen thưởng.
13. **Trung Tâm Điều Hành EQM Leader (Dual Viewport):** Bản PC điều hành toàn cảnh và bản Mobile Pocket Companion hiện trường với 4 tab chuyên biệt (Điều phối, Kíp KTV, Xếp hạng, Bộ não AI).
14. **Bảng Xếp Hạng Kỹ Thuật Viên Sửa Chữa (Leaderboard):** Xếp hạng theo số ca khắc phục, tốc độ MTTR, điểm năng lực; bục vinh danh Top 1-2-3 với icon Vương miện và nút Tuyên dương gửi Push Notification tức thời.
15. **Hồ Sơ Kỹ Thuật Viên & Biểu Đồ Radar Đa Chiều Năng Lực 5 Dòng Máy EDM:** Biểu đồ Radar Chart phân tích năng lực trên 5 dòng máy EDM danh tiếng, số giờ làm việc và dòng thời gian huy hiệu thành tích.
16. **Bộ Não Tổng Hợp Tri Thức AI Kép (Knowledge Synthesis Engine):** Đồng hóa song song tài liệu SOP tiêu chuẩn và báo cáo con người, tạo biểu đồ tri thức và thẻ trích dẫn minh bạch.
17. **Thanh Tìm Kiếm Đa Tiêu Chí & Ghi Chú Nhanh (Quick Notes):** Tìm kiếm tức thì KTV, tùy chọn sắp xếp đa năng và trường gắn nhắc nhở ngắn hạn có phân cấp ưu tiên (Bình thường / Khẩn cấp ⚠️) tự động ghim lên lệnh điều phối sự cố.

---

## 4. TỪ ĐIỂN DỮ LIỆU & DẢI DANH ĐỊNH CẢM BIẾN IOT

| Mã Cảm Biến | Thông Số Đo | Đơn Vị | Dải Chuẩn Danh Định | Hành Động Khi Bất Thường |
| :--- | :--- | :--- | :--- | :--- |
| `V_GAP` | Điện áp khe hở phóng điện | V | 42.0 - 58.0 V | Kiểm tra ngắn mạch phôi, cân chỉnh gap voltage servo |
| `I_PEAK` | Dòng điện xung đỉnh cực đại | A | 12.0 - 24.0 A | Giảm thông số On-time / Off-time của bo phát xung |
| `P_FLUSH` | Áp lực nước xả điện môi | Bar | 7.5 - 12.0 Bar | Kiểm tra nghẹt lõi lọc 3µm, súc rửa vòi xả trên/dưới |
| `T_DIELEC` | Nhiệt độ dung dịch điện môi | °C | 20.0 - 24.5 °C | Kiểm tra giàn lạnh Chiller, bổ sung chất làm mát |
| `W_TENS` | Lực căng dây cắt EDM | N | 12.0 - 18.0 N | Hiệu chuẩn lại ly hợp phanh từ cuộn cấp dây (Brake Roller) |
| `W_SPD` | Tốc độ cuộn dây cắt | m/min | 6.0 - 10.0 m/min | Kiểm tra kẹt motor cuộn dây thải |
| `VIB_SPN` | Độ rung trục vít me bi | mm/s | 0.12 - 0.45 mm/s | Kiểm tra độ rơ ổ bi trục vít me bi (Ball screw) |
| `COND_ION` | Độ dẫn điện nước khử ion | µS/cm | 8.0 - 15.0 µS/cm | Thay thế cột hạt nhựa trao đổi ion (Deionizing Resin) |
| `OEE_RT` | Hiệu suất tổng thể thiết bị | % | ≥ 85.0 % | Xem biểu đồ Factory Health để bóc tách tổn thất A, P, Q |

---

## 5. BỘ TIÊU CHÍ ĐÁNH GIÁ & NGHIỆM THU HỆ THỐNG

| Tiêu Chí Đánh Giá | Yêu Cầu Kỹ Thuật | Kết Quả Đạt Được | Trạng Thái |
| :--- | :--- | :--- | :--- |
| **Khả năng phản hồi cảm biến IoT** | Cập nhật liên tục 9 thông số không giật lag | Sparkline 60s mượt mà, Arc Gauge phản ứng tức thời | **ĐẠT (PASS)** |
| **Độ chính xác chẩn đoán AI** | Trích xuất nguyên nhân, SOP, dụng cụ, linh kiện | Đầy đủ 5 thành phần, có chỉ dẫn an toàn cao áp | **ĐẠT (PASS)** |
| **Trợ lý giọng nói rảnh tay** | Nhận diện tiếng Việt và phát âm Audio SOP | Web Speech API tiếng Việt chính xác, TTS to rõ | **ĐẠT (PASS)** |
| **Khả năng dự báo bảo trì** | Phân tích tương quan lịch sử và cảnh báo sớm | Cảnh báo rung động trục Z và nghẹt màng áp lực đón đầu | **ĐẠT (PASS)** |
| **Điều phối hiện trường EQM Leader** | Phân công 1-chạm, tìm kiếm KTV, duyệt phụ tùng | Giao việc tức thì, gắn Quick Note kèm ưu tiên khẩn | **ĐẠT (PASS)** |
| **Đo lường năng lực KTV** | Biểu đồ Radar 5 dòng máy, MTTR Leaderboard | Radar Chart SVG chuẩn xác, Push Commendation thời gian thực | **ĐẠT (PASS)** |
| **Tổng hợp tri thức liên tục** | Học hỏi kép từ SOP OEM và báo cáo KTV | Trích dẫn nguồn minh bạch, đối soát chéo tri thức | **ĐẠT (PASS)** |
| **Tính tương thích & Offline-First** | Hỗ trợ PC & Mobile PWA, lưu trữ dữ liệu an toàn | PWA mượt mà, LocalStorage duy trì trạng thái vĩnh viễn | **ĐẠT (PASS)** |

---
**Tài liệu biên soạn bởi Hệ thống EDM SmartGuard AI • Xuất bản ngày 24/10/2026**
