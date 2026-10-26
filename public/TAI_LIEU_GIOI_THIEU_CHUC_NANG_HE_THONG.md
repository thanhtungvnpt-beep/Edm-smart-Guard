# TÀI LIỆU TOÀN DIỆN VỀ HỆ THỐNG EDM SMARTGUARD AI
## HỆ THỐNG QUẢN LÝ THIẾT BỊ, GIÁM SÁT IOT, BẢO TRÌ DỰ ĐOÁN & CHẨN ĐOÁN SỰ CỐ TÍCH HỢP TRÍ TUỆ NHÂN TẠO GEMINI
**Tài liệu kỹ thuật và nghiệp vụ phục vụ thẩm định, đánh giá và nghiệm thu hệ thống**

---

## 1. TỔNG QUAN HỆ THỐNG & TẦM NHÌN (SYSTEM OVERVIEW & EXECUTIVE SUMMARY)

### 1.1. Bối cảnh công nghiệp
Trong ngành sản xuất cơ khí chính xác, chế tạo khuôn mẫu kim loại và gia công linh kiện hàng không / y tế, các dòng máy phóng điện EDM (**Wire-cut EDM** - Cắt dây, **Sinker EDM** - Bắn điện định hình, **CNC High-speed**) là tài sản giá trị cao nhất và là nút thắt sống còn của dây chuyền.
Mỗi sự cố dừng máy ngoài kế hoạch (*Unplanned Downtime*) do đứt dây liên tục, tụt áp suất nước xả, chập khe hở phóng điện hoặc lỗi cảm biến bo mạch servo có thể gây thiệt hại từ hàng chục đến hàng trăm triệu đồng/giờ và làm gián đoạn toàn bộ tiến độ giao hàng.

### 1.2. Mục tiêu chiến lược của EDM SmartGuard AI
**EDM SmartGuard AI** là nền tảng quản trị thiết bị công nghiệp 4.0 (Equipment Data Management - EDM) thế hệ mới, giải quyết triệt để 4 bài toán lớn:
1. **Triệt tiêu thời gian phản hồi sự cố:** Phát hiện bất thường cảm biến sớm (nhiệt độ, rung động, áp suất dung môi) trước khi xảy ra hỏng hóc cơ học nghiêm trọng; tự động đẩy cảnh báo khẩn cấp tới điện thoại kỹ thuật viên theo thời gian thực.
2. **Cắt giảm thời gian xử lý sự cố (MTTR - Mean Time to Repair):** Ứng dụng mô hình AI Gemini phân tích nguyên nhân gốc rễ và trích xuất Quy trình Thao tác Chuẩn (SOP) từng bước chỉ trong 3 giây.
3. **Bảo tồn & tự học từ tri thức con người (Human-in-the-Loop Continuous Learning):** Bộ não AI liên tục học hỏi từ tài liệu kỹ thuật OEM cập nhật và báo cáo nghiệm thu thực chiến của các kỹ sư trưởng.
4. **Điều phối hiện trường thông minh (EQM Leader Command Center):** Phân công lệnh sửa chữa 1-chạm, theo dõi tải công việc, bảng xếp hạng thành tích kỹ thuật viên, biểu đồ Radar Chart năng lực 5 dòng máy EDM và gắn ghi chú nhắc việc nhanh.

### 1.3. Bảng chỉ số hiệu năng mục tiêu (Target KPIs Matrix)
| Chỉ Số KPI | Phương Pháp Truyền Thống | EDM SmartGuard AI | Mức Độ Cải Thiện |
| :--- | :--- | :--- | :--- |
| **Thời gian dừng máy ngoài dự kiến (Downtime)** | 12 - 18% tổng giờ chạy | < 4.5% tổng giờ chạy | Giảm **> 65%** |
| **Thời gian chẩn đoán sự cố (MTTD)** | 35 - 90 phút (tra sổ tay OEM) | 3 - 5 giây (AI Gemini) | Rút ngắn **> 90%** |
| **Thời gian trung bình xử lý sự cố (MTTR)** | 60 - 120 phút | 21 - 34 phút | Rút ngắn **> 55%** |
| **Tuân thủ hạn định SLA sửa chữa** | 78 - 82% | 96.5 - 98.5% | Tăng **+18%** |
| **Bảo lưu tri thức kỹ sư lành nghề** | Thất thoát khi nhân sự nghỉ việc | Số hóa vĩnh viễn vào Bộ não AI | **100%** bảo lưu |

---

## 2. KIẾN TRÚC KỸ THUẬT & NGĂN XẾP CÔNG NGHỆ (TECHNICAL ARCHITECTURE)

```
+-----------------------------------------------------------------------------------+
|                        NGƯỜI DÙNG & THIẾT BỊ ĐẦU CUỐI                              |
|  - Màn hình giám sát trung tâm (Desktop Web / SCADA Dashboard)                    |
|  - Điện thoại & Máy tính bảng hiện trường kỹ thuật viên (Mobile PWA / Tablet)      |
|  - Trợ lý âm thanh giọng nói rảnh tay (Web Speech Recognition & Audio SOP TTS)    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ HTTPS / WSS / REST API
+-----------------------------------------------------------------------------------+
|                         TẦNG ỨNG DỤNG (FRONTEND & CLIENT)                          |
|  - React 18 SPA + TypeScript + Vite + Tailwind CSS (Industrial Dark Theme)        |
|  - Recharts Data Visualization (ComposedChart OEE, Sparklines, Radar Charts)      |
|  - Service Worker PWA (Offline-First Architecture, Background Queue Sync)         |
|  - LocalStorage / IndexedDB Hardware Persistence Layer                            |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ Proxy Route & Webhook
+-----------------------------------------------------------------------------------+
|                      TẦNG MÁY CHỦ TRUNG TÂM (EXPRESS & NODE.JS)                   |
|  - Node.js + Express API Gateway (Port 3000)                                      |
|  - Push Commendation Service (/api/mobile-devices/push-commendation)              |
|  - AI Knowledge Synthesis Engine Proxy (/api/ai/synthesize-knowledge)             |
|  - Telemetry Telemetry Stream & Machine State Engine                              |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ Secure API Client
+-----------------------------------------------------------------------------------+
|                      BỘ NÃO TRÍ TUỆ NHÂN TẠO (AI & RAG ENGINE)                     |
|  - Google Gemini API SDK (@google/genai)                                          |
|  - Retrieval-Augmented Generation (RAG) đối chiếu tài liệu kỹ thuật OEM            |
|  - Human-in-the-Loop Machine Learning: Đồng hóa biên bản nghiệm thu kỹ thuật viên |
+-----------------------------------------------------------------------------------+
```

---

## 3. DANH MỤC 17 PHÂN HỆ VÀ TÍNH NĂNG CHI TIẾT (FUNCTIONAL MODULES)

### 3.1. Phân hệ Giám sát Cảm biến IoT Telemetry Thời Gian Thực
- **Thu thập liên tục 9 thông số cảm biến công nghiệp:**
  1. *Discharge Gap Voltage (V):* Điện áp khe hở phóng điện (định mức: 42 - 58 V).
  2. *Peak Current (A):* Dòng điện đỉnh xung tia lửa điện (định mức: 12 - 24 A).
  3. *Dielectric Pressure (Bar):* Áp lực xả nước khử ion làm nguội khe cắt (định mức: 7.5 - 12.0 Bar).
  4. *Dielectric Temperature (°C):* Nhiệt độ dung môi điện môi (định mức: 20.0 - 24.5 °C).
  5. *Wire Tension (N):* Lực căng dây cắt đồng/molypden chống đứt dây (định mức: 12.0 - 18.0 N).
  6. *Wire Speed (m/min):* Tốc độ cuộn dây hồi phục (định mức: 6.0 - 10.0 m/min).
  7. *Spindle / Table Vibration (mm/s):* Độ rung động trục và gá phôi (định mức: 0.12 - 0.45 mm/s).
  8. *Water Conductivity (µS/cm):* Độ dẫn điện của nước ion hóa (định mức: 8.0 - 15.0 µS/cm).
  9. *Overall Equipment Effectiveness (OEE %):* Hiệu suất thiết bị tổng thể (chuẩn: ≥ 85%).
- **Trực quan hóa Sparkline thời gian thực:** Đồ thị đường sóng biến thiên 60 giây gần nhất cho áp suất và điện áp.

### 3.2. Đồng hồ Arc Gauge Đo Chỉ Số Sức Khỏe Thiết Bị (Health Score 0-100%)
- **Mô hình tính toán điểm độ tin cậy tự động:**
  - Trọng số hóa tần suất sự cố 30 ngày gần nhất (`incident frequency`).
  - Thời gian vận hành liên tục không gián đoạn (`continuous uptime hours`).
  - Biên độ sai lệch cảm biến so với dải danh định OEM.
- **Phân hạng trực quan 4 cấp độ:**
  - *Hạng A - Rất Tốt (≥ 85%):* Vòng cung xanh lục, hệ thống vận hành trơn tru.
  - *Hạng B - Ổn Định (70 - 84%):* Vòng cung xanh dương, đạt yêu cầu ca kíp.
  - *Hạng C - Cần Lưu Ý (50 - 69%):* Vàng hổ phách, khuyến nghị kiểm tra dự phòng.
  - *Hạng D - Rủi Ro Cao (< 50%):* Đỏ cảnh báo, nguy cơ dừng máy cao.

### 3.3. Menu Tác Vụ Nhanh Tại Thẻ Máy (Quick Actions Menu)
- Cho phép kỹ thuật viên xử lý ngay tại hiện trường trong 1 chạm mà không cần mở modal:
  - **Đặt Lại Bộ Đếm Giờ Chạy (Reset Service Counter):** Xóa bộ đếm sau bảo dưỡng 500h hoặc bảo dưỡng bộ lọc (250h), cụm dẫn hướng kim cương (300h), hạt nhựa khử ion (150h).
  - **Hiệu Chuẩn Cảm Biến (Calibrate Sensor):** Mô phỏng quy trình PLC khử trôi điểm 0 (Zero-offset) và chuẩn hóa Span Gain 4 giai đoạn.
  - **Cưỡng Bức Đồng Bộ PLC (Force Sync):** Gửi gói tin Modbus TCP/IP tức thời, đo kiểm độ trễ mili-giây (11-19ms) và xóa bộ đệm đọng.
  - **Kiểm Tra Kết Nối Mạng (Ping Controller):** Kiểm tra trạng thái đáp ứng mạng LAN tới bộ điều khiển CNC (Fanuc, Makino, Sodick, Mitsubishi).

### 3.4. Bàn Phím Công Nghiệp & Phím Tắt Tối Ưu Cho Thao Tác Đeo Găng Tay
- Hỗ trợ thao tác tốc độ cao trên màn hình công nghiệp IPC:
  - `Alt + 1` .. `Alt + 5` (kèm hỗ trợ Numpad 1..5): Chuyển tab tức thời giữa Giám sát xưởng, Bộ não AI, Tài liệu SOP, Nhật ký Push, Quản lý thiết bị di động.
  - `Shift + R`: Cưỡng bức làm mới & đồng bộ toàn bộ xưởng EDM.
  - `Alt + Q`: Mở nhanh máy quét mã QR Code thẻ tài sản máy.
  - `Alt + T`: Mở bảng phân ca trực kỹ thuật viên.
  - `Alt + M`: Bật/Tắt còi báo động khẩn cấp.
  - `Alt + K` hoặc `?`: Mở bảng tra cứu phím tắt kèm âm thanh xúc giác (tactile click feedback).

### 3.5. Bộ Lọc Nâng Cao Đa Chiều & Quản Lý Bộ Lọc Nhanh Tùy Chỉnh (Custom Quick Filters)
- Lọc theo **Ca làm việc** (Ca Sáng 06:00-14:30, Ca Chiều 14:00-22:30, Ca Đêm 22:00-06:30, hoặc tự động nhận diện giờ thực tế).
- Lọc theo nhiệt độ dung môi, điện năng tiêu thụ, thời gian chạy liên tục (Uptime >18h / >24h).
- **Lưu bộ lọc tùy chỉnh không giới hạn:** Người dùng tự đặt tên bộ lọc (VD: *"Kiểm tra khẩn cấp ca sáng"*), gắn màu sắc, icon và lưu trữ vĩnh viễn trên thiết bị.

### 3.6. Biểu Đồ Factory Health Trend & Dự Báo Uptime 7 Ngày (Recharts)
- Biểu đồ phối hợp ComposedChart hiển thị lịch sử 7 ngày và dự báo 48h tới.
- Phân tích chi tiết 3 trụ cột OEE:
  - **Availability (A):** Tỷ lệ sẵn sàng thiết bị (thời gian chạy thực tế / kế hoạch).
  - **Performance (P):** Tốc độ phóng điện và tốc độ ăn mòn kim loại (mm²/phút).
  - **Quality (Q):** Tỷ lệ sản phẩm cắt đạt dung sai kích thước và độ bóng bề mặt Ra.
- Đối sánh trực quan với đường chuẩn Thế Giới (*World-Class Benchmark: 85%*).

### 3.7. AI Chẩn Đoán Sự Cố & Nhập Liệu Giọng Nói Rảnh Tay (Voice-to-Text)
- Nhập triệu chứng hư hỏng bằng giọng nói tiếng Việt rảnh tay (Hands-free Web Speech API) khi kỹ thuật viên đang đeo găng tay thao tác dính dầu mỡ.
- Trích xuất tự động nguyên nhân gốc rễ, danh mục dụng cụ cách điện cần mang, linh kiện thay thế và cảnh báo an toàn điện cao áp.

### 3.8. AI Chẩn Đoán Thông Minh Đối Chiếu Lịch Sử Máy (Historical Failure Correlation)
- Thuật toán đối soát tự động giữa sự cố hiện tại với toàn bộ biên bản bảo trì quá khứ của thiết bị:
  - Tính toán tỷ lệ tương quan hư hỏng lặp lại (`correlation percentage`).
  - Đưa ra giả thuyết rủi ro linh kiện phụ trợ liên đới bị suy hao (màng bơm áp lực, bạc dẫn hướng, gioăng làm kín).
  - Khuyến cáo hành động bảo trì đón đầu nhằm ngăn chặn chu kỳ hỏng lặp lại.

### 3.9. Trợ Lý AI Copilot Phân Xưởng & Đọc To Hướng Dẫn Âm Thanh (Audio SOP)
- Khung hội thoại AI chuyên môn sâu về cơ khí gia công tia lửa điện EDM.
- Chức năng **Audio SOP Text-to-Speech:** Đọc to từng bước hướng dẫn kỹ thuật rõ ràng, mạch lạc bằng giọng đọc tiếng Việt chuẩn, hỗ trợ kỹ thuật viên thao tác tuần tự từng bước mà không cần rời mắt khỏi chi tiết máy.

### 3.10. Nghiệm Thu Hiện Trường, Dạy Học AI & Dự Báo Thời Gian Sửa Chữa (AI ETTR)
- **Module dự báo AI Estimated Time to Repair (ETTR):** Ước tính số phút hoàn thành dựa trên độ phức tạp sự cố, kinh nghiệm của KTV phụ trách và dữ liệu lịch sử các lần sửa tương tự.
- **Biên bản nghiệm thu Human-in-the-Loop:** Kỹ thuật viên đánh giá độ chính xác của đề xuất AI (1-5 sao), ghi chú thực tế tại hiện trường và nhấn nạp tri thức vào **Bộ não AI phân xưởng**.

### 3.11. Trung Tâm Lịch Sử Bảo Trì Sửa Chữa (Maintenance History Hub)
- Cơ sở dữ liệu số hóa toàn diện từng lần can thiệp: Ngày giờ, Triệu chứng, Hành động xử lý, Phụ tùng thay thế, Kỹ thuật viên nghiệm thu.
- Hỗ trợ xem dạng Thẻ dòng thời gian (Timeline Cards) hoặc Bảng công nghiệp SCADA Table.
- Tìm kiếm từ khóa tức thì và xuất dữ liệu ra file CSV phục vụ tích hợp ERP / CMMS.

### 3.12. Quản Lý Thiết Bị Di Động Kỹ Thuật Viên & Push Notification Simulator
- Quản lý danh bạ thiết bị (điện thoại, máy tính bảng) của các kỹ thuật viên trong xưởng.
- Mô phỏng thông báo đẩy khẩn cấp Web Push khi phát hiện máy dừng đột ngột hoặc khi kỹ thuật viên nhận được huy hiệu khen thưởng từ cấp quản lý.

### 3.13. Trung Tâm Điều Hành EQM Leader (EqmLeaderView - PC & Mobile Dual Viewport)
- **Giao diện đôi hoàn chỉnh:**
  - **Bản PC Điều Hành Toàn Cảnh (Command Board):** Bố trí 2 cột trực quan hóa lệnh điều phối, phê duyệt xuất kho phụ tùng khẩn cấp 1-chạm, bảng theo dõi kíp trực, lịch bảo dưỡng định kỳ và thanh phát thông báo bộ đàm ca trực.
  - **Bản Mobile Pocket Companion (Hiện Trường):** Tối ưu hóa 4 tab điều hướng di động: `Điều Phối` (giao việc khẩn), `Kíp KTV` (danh bạ nhân sự trực), `Xếp Hạng` (bảng thành tích), `Bộ Não AI` (tra cứu tri thức).
- Giao việc 1-chạm: Chọn kỹ thuật viên phù hợp nhất chỉ với một thao tác bấm.

### 3.14. Bảng Xếp Hạng Kỹ Thuật Viên Sửa Chữa (TechnicianRepairLeaderboard)
- Đo lường và vinh danh kỹ thuật viên theo:
  - Số sự cố khắc phục thành công (`resolved incidents`).
  - Thời gian trung bình xử lý sự cố (`MTTR minutes` - càng thấp càng xuất sắc).
  - Tỷ lệ hoàn thành đúng SLA và tỷ lệ vượt qua nghiệm thu lần đầu (`First-time Pass Rate`).
- **Lọc theo khoảng thời gian:** Tuần này, Tháng này, Năm nay.
- **Bục vinh danh Top 1 - 2 - 3:** Huy hiệu Vàng, Bạc, Đồng; kỹ thuật viên dẫn đầu (Top 1) nhận biểu tượng Vương miện (`Crown`) nổi bật.
- **Tuyên dương trực tiếp (Leader Commendation):** Bấm nút tuyên dương lập tức gửi thông báo đẩy di động tới điện thoại của kỹ thuật viên qua API `/api/mobile-devices/push-commendation`.

### 3.15. Hồ Sơ Kỹ Thuật Viên & Biểu Đồ Radar Đa Chiều Năng Lực 5 Dòng Máy EDM (TechnicianDetailModal)
- Nhấn vào bất kỳ kỹ thuật viên nào để mở hồ sơ năng lực chuyên sâu:
  - **Biểu đồ Radar Chart (Spider Chart SVG):** Đánh giá phân bổ kỹ năng trên 5 dòng máy cốt lõi:
    1. *Makino U6 H.E.A.T* (Cắt dây cao tốc)
    2. *Sodick ALC600G iGroove+* (Cắt dây tạo góc côn chính xác)
    3. *Makino EDAF3* (Bắn điện định hình chìm)
    4. *Fanuc Robocut α-C600iB* (Cắt dây công nghiệp bền bỉ)
    5. *Mitsubishi EA12V* (Xung điện tự động hóa)
  - Thống kê tổng số giờ làm việc thực tế, danh mục phiếu sửa chữa đã hoàn tất.
  - **Dòng thời gian huy hiệu (Milestone Timeline):** Trực quan hóa các cột mốc thành tích và thời điểm kỹ thuật viên đạt kỷ lục xử lý sự cố.

### 3.16. Bộ Não Tổng Hợp Tri Thức AI Kép (AIKnowledgeSynthesisEngine)
- Cơ chế học hỏi song song hai nguồn tài liệu (Dual-Pillar Knowledge Architecture):
  - **Trụ cột 1:** Tài liệu kỹ thuật tiêu chuẩn (SOP OEM, sổ tay bảo dưỡng, tài liệu mạch điện).
  - **Trụ cột 2:** Báo cáo sửa chữa thực tế của kỹ thuật viên con người (Human Resolution Reports).
- Giao diện truy vấn và tổng hợp tri thức tự động qua API `/api/ai/synthesize-knowledge`.
- Xuất thẻ trích dẫn nguồn có thể kiểm chứng (`Verifiable Citations`), minh bạch giữa tài liệu OEM và kinh nghiệm xử lý thực tế tại xưởng.

### 3.17. Thanh Tìm Kiếm Đa Tiêu Chí & Ghi Chú Nhanh (Quick Notes / Short-term Reminders)
- **Thanh tìm kiếm thời gian thực:** Tra cứu tức thì kỹ thuật viên theo Tên, Chức danh, Ca trực, Số điện thoại, Dòng máy chuyên môn hoặc nội dung ghi chú.
- **Tùy chọn sắp xếp linh hoạt:** Sắp xếp theo Điểm kỹ năng, Tên A-Z, Tải công việc ít nhất (ưu tiên giao việc), hoặc Trạng thái sẵn sàng.
- **Trường Ghi chú nhanh (Quick Note):**
  - Trưởng ca có thể gắn lời nhắc ngắn hạn trực tiếp cho từng kỹ thuật viên (VD: *"Bàn giao chìa khóa tủ linh kiện trước 21h"*).
  - Thiết lập mức ưu tiên: **Bình thường** (xanh) hoặc **Khẩn cấp ⚠️** (vàng hổ phách).
  - Gợi ý mẫu nhắc việc 1-chạm (bàn giao ca, bù dầu, ưu tiên máy).
  - Lưu trữ bền vững (`localStorage`) và tự động ghim huy hiệu nhắc nhở `📌 Lưu ý Leader` trên thẻ điều phối sự cố tương ứng.

---

## 4. TỪ ĐIỂN DỮ LIỆU & DẢI DANH ĐỊNH CẢM BIẾN (DATA DICTIONARY)

| Mã Cảm Biến | Tên Đại Lượng Đo | Đơn Vị | Dải Chuẩn Danh Định | Ngưỡng Cảnh Báo Sớm | Hành Động Kỹ Thuật Khi Vượt Ngưỡng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `V_GAP` | Điện áp phóng điện khe cắt | V (Volt) | 42.0 - 58.0 V | < 38.0 V hoặc > 64.0 V | Kiểm tra ngắn mạch phôi, điều chỉnh servo gap feed |
| `I_PEAK` | Dòng điện xung đỉnh cực đại | A (Ampe) | 12.0 - 24.0 A | > 28.0 A | Giảm thông số On-time / Off-time của bo xung phát tia |
| `P_FLUSH` | Áp lực nước xả điện môi | Bar | 7.5 - 12.0 Bar | < 6.8 Bar | Báo tắc lõi lọc 3µm, súc rửa vòi phun xả trên/dưới |
| `T_DIELEC` | Nhiệt độ dung dịch điện môi | °C | 20.0 - 24.5 °C | > 26.5 °C | Kiểm tra giàn lạnh Chiller, bù chất làm mát |
| `W_TENS` | Lực căng dây cắt EDM | N (Newton) | 12.0 - 18.0 N | < 10.0 N hoặc > 21.0 N | Cân chỉnh lại phanh từ ly hợp dây (Brake Roller) |
| `W_SPD` | Tốc độ cấp dây cắt | m/min | 6.0 - 10.0 m/min | < 5.0 m/min | Kiểm tra kẹt motor cuộn dây thải |
| `VIB_SPN` | Độ rung trục chính / bàn máy | mm/s | 0.12 - 0.45 mm/s | > 0.65 mm/s | Kiểm tra độ rơ ổ bi trục vít me bi (Ball screw) |
| `COND_ION` | Độ dẫn điện nước khử ion | µS/cm | 8.0 - 15.0 µS/cm | > 18.0 µS/cm | Thay cột hạt nhựa trao đổi ion (Deionizing Resin) |
| `OEE_RT` | Hiệu suất tổng thể thiết bị | % | ≥ 85.0 % | < 75.0 % | Phân tích nguyên nhân suy hao tại biểu đồ Factory Health |

---

## 5. HƯỚNG DẪN QUY TRÌNH THAO TÁC CHUẨN (STANDARD OPERATING WORKFLOWS)

### Quy Trình 1: Xử Lý Sự Cố Dừng Máy Khẩn Cấp (Incident Breakdown Workflow)
1. **Phát hiện & Cảnh báo:** Máy phát sinh cảnh báo bất thường, thẻ máy chuyển màu đỏ `ALARM_STOPPED`, hệ thống phát còi âm thanh cảnh báo công nghiệp và gửi Push Notification tới KTV trực ca.
2. **Tiếp cận & Gọi AI Chẩn Đoán:** KTV chạm nút **"AI Chẩn Đoán"** trên thẻ máy hoặc quét mã QR Code trên thân máy bằng camera (`Alt + Q`).
3. **Mô tả hiện trường rảnh tay:** Bấm nút micro để mô tả bằng giọng nói: *"Máy Makino U6 bị đứt dây liên tục ở góc vuông, áp lực nước xả đầu trên tụt còn 5.2 Bar và bồn phụ có bọt khí"*.
4. **Đối chiếu lịch sử:** AI tự động kích hoạt tính năng đối chiếu lịch sử bảo dưỡng của máy, phát hiện nguy cơ màng áp lực S-104 từng bị bám cặn cacbon cách đây 14 ngày.
5. **Thao tác rảnh tay với Audio SOP:** KTV bấm **"Đọc To Hướng Dẫn"** để nghe giọng đọc hướng dẫn chi tiết từng bước kiểm tra van tỷ lệ và thông vòi phun.
6. **Nghiệm thu & Nạp tri thức (Human-in-the-Loop):** Sau khi hoàn tất sửa chữa, KTV mở cửa sổ nghiệm thu, kiểm tra dự báo **AI ETTR**, đánh giá độ hữu ích của AI, nhập mẹo thực chiến và bấm **"Nghiệm Thu SOP & Dạy Học Cho AI"** để lưu vĩnh viễn vào kho tri thức nhà máy.

### Quy Trình 3: Thẩm Định Đề Xuất & Ký Duyệt Quyết Định Dành Cho Giám Đốc (Plant Manager MGR-03)
1. **Tiếp nhận đề xuất thông minh:** Xem danh sách đề xuất tự động của AI (mua sắm vật tư khẩn cấp, lịch dừng máy phòng ngừa 250h, hoặc can thiệp thông số xung).
2. **Kiểm tra bằng chứng AI & Phân tích rủi ro:** Đọc bằng chứng đo đạc cảm biến thời gian thực (`aiEvidenceSummary`) và rủi ro nếu trì hoãn (`riskHypothesis`).
3. **Thực thi quyền hạn con người (Human-in-the-Loop):** Giám đốc chọn Ký Duyệt (Approve), Yêu Cầu Bổ Sung Dữ Liệu (Request More Info), hoặc Từ Chối (Reject) kèm lý do chỉ đạo.
4. **Ủy quyền & Giao việc trực tiếp (MGR-02):** Chuyển giao trực tiếp công việc cho Kíp Trưởng ca trực để triển khai tại hiện trường.
5. **Ghi vết điện tử (Decision Audit Trail):** Quyết định được lưu vào sổ nhật ký điều hành không thể sửa xóa để phục vụ hậu kiểm.

### Quy Trình 4: Chia Sẻ Tri Thức & Xác Minh 5 Bước Liên Nhà Máy (Cross-Factory Community COM-01 → COM-06)
1. **Đăng câu hỏi hoặc ca sửa chữa tiêu biểu (COM-02):** Nhập hiện tượng, mã lỗi, model máy và các bước đã thử.
2. **Bộ lọc tự động ẩn danh hóa (Anonymization Sanitizer):** Tự động che số seri máy, mã khách hàng độc quyền và thông tin thương mại trước khi phát tán ra ngoài nhà máy.
3. **Thảo luận đa nhà máy & AI Tóm tắt (COM-03):** KTV các nhà máy Bắc Ninh, Hà Nội, TP.HCM cùng trao đổi; AI Copilot tự động tóm tắt tiền lệ và lưu ý an toàn; Trưởng nhóm chọn câu trả lời xuất sắc làm "Giải Pháp Tối Ưu".
4. **Quy trình chuẩn hóa 5 bước (COM-05):** Đề xuất -> Thẩm định chuyên gia -> Soạn thảo SOP chuẩn -> Phê duyệt Quản đốc -> Phát hành kho tri thức chính thức.
5. **Vinh danh chuyên gia (COM-04):** Bảng vinh danh Top chuyên gia từng hãng máy EDM kèm huy hiệu chuyên môn và thống kê tỷ lệ thành công thực nghiệm.

---

## 6. HƯỚNG DẪN ĐÁNH GIÁ & TIÊU CHÍ NGHIỆM THU (EVALUATION CHECKLIST)

Khi đánh giá và kiểm thử nghiệm thu hệ thống, hội đồng đánh giá có thể kiểm tra trực tiếp các tiêu chí sau trên ứng dụng:

- [x] **Tiêu chí 1 - Khả năng phản hồi thời gian thực (Real-time Response):** Cập nhật dữ liệu cảm biến 9 thông số không gián đoạn, sparkline đồ thị mượt mà.
- [x] **Tiêu chí 2 - Độ chính xác của AI Gemini:** Đưa ra giải pháp khắc phục có cấu trúc đầy đủ: Nguyên nhân gốc rễ, Quy trình từng bước, Dụng cụ cách điện, Linh kiện cần thay thế và Cảnh báo an toàn.
- [x] **Tiêu chí 3 - Tương tác giọng nói rảnh tay (Hands-Free Voice AI):** Nhận diện chính xác khẩu lệnh tiếng Việt và phát âm thanh đọc to SOP mạch lạc.
- [x] **Tiêu chí 4 - Khả năng dự báo bảo trì (Predictive Maintenance):** Phân tích tương quan lịch sử, cảnh báo rung động trục vít me và sụt áp lực sớm.
- [x] **Tiêu chí 5 - Trung tâm điều hành EQM Leader:** Hỗ trợ đầy đủ tìm kiếm, sắp xếp đa tiêu chí, phân ca trực, duyệt vật tư và gắn ghi chú ngắn hạn.
- [x] **Tiêu chí 6 - Bảng xếp hạng & Radar kỹ năng:** Trực quan hóa chính xác Spider Chart trên 5 dòng máy EDM và hỗ trợ gửi Push Notification tuyên dương.
- [x] **Tiêu chí 7 - Bộ não tự học hỏi (Knowledge Synthesis):** Khả năng tổng hợp tri thức chéo từ tài liệu SOP và báo cáo con người với trích dẫn minh bạch.
- [x] **Tiêu chí 8 - Tính tương thích & Offline-First:** Vận hành ổn định trên cả máy tính (PC) và di động (Mobile PWA), lưu trữ dữ liệu an toàn trên thiết bị.
- [x] **Tiêu chí 9 - Cơ chế Human in the Loop (MGR-03):** AI chỉ đề xuất, Quản đốc phê duyệt bằng chứng và lưu vết Audit Log minh bạch.
- [x] **Tiêu chí 10 - Cộng đồng liên nhà máy (COM-01 → 06):** Kết nối KTV 3 cơ sở với bộ lọc ẩn danh bảo mật, AI tóm tắt an toàn và quy trình 5 bước chuẩn hóa SOP.

---
**Bản quyền tài liệu thuộc về Ban Dự Án EDM SmartGuard AI • Phiên Bản 4.0.0 Industrial Suite**

