# TÀI LIỆU GIỚI THIỆU CHỨC NĂNG HỆ THỐNG EDM SMARTGUARD AI
## HỆ THỐNG QUẢN LÝ GIÁM SÁT, BẢO TRÌ DỰ ĐOÁN & CHẨN ĐOÁN SỰ CỐ THIẾT BỊ EDM/CNC CÔNG NGHIỆP TÍCH HỢP TRÍ TUỆ NHÂN TẠO

---

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)

### 1.1. Giới thiệu
**EDM SmartGuard AI** là nền tảng số hóa quản lý thiết bị công nghiệp (Equipment Data Management - EDM) thế hệ mới, chuyên biệt cho nhà máy gia công cơ khí chính xác, khuôn mẫu và cắt dây / xung điện EDM (Wire-cut EDM, Sinker EDM, High-speed CNC).

Hệ thống kết hợp giữa **IoT Cảm biến thời gian thực**, **Mô hình Trí tuệ Nhân tạo Gemini 3.8 Flash**, quy trình **Học máy tăng cường tương tác con người (Human-in-the-Loop Learning)** và kiến trúc **PWA Offline-First**, nhằm:
- Giảm thiểu thời gian dừng máy ngoài kế hoạch (Unplanned Downtime) xuống dưới 5%.
- Tự động hóa quy trình phân tích sự cố, cung cấp Quy trình Thao tác Chuẩn (SOP) chỉ trong 3 giây.
- Hỗ trợ kỹ thuật viên thao tác rảnh tay tại hiện trường với công nghệ **Voice-to-Text** và **Text-to-Speech (Audio SOP)**.
- Chẩn đoán thông minh đối chiếu trực tiếp với **Lịch sử bảo dưỡng định kỳ** của từng máy.
- Dự báo chính xác thời gian hoàn thành sửa chữa (AI Estimated Time to Repair - ETTR).
- Đo lường và trực quan hóa năng lực, kinh nghiệm thực chiến của đội ngũ kỹ thuật viên qua **Bảng điểm thành thạo (Proficiency Score)**.

---

## 2. KIẾN TRÚC KỸ THUẬT VÀ CÔNG NGHỆ CỐT LÕI

| Thành phần | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Giao diện Người dùng (Frontend)** | React 18, TypeScript, Tailwind CSS, Lucide Icons | Giao diện công nghiệp chuẩn Industrial Dark Theme, phản hồi thời gian thực, trực quan hóa dữ liệu trực quan |
| **Biểu đồ & Trực quan hóa** | Recharts, SVG Sparklines, Canvas Waveforms | Vẽ biểu đồ xu hướng cảm biến, dự báo Uptime 7 ngày, biểu đồ tần suất hỏng hóc |
| **Máy chủ & API (Backend)** | Node.js, Express, TypeScript | Xử lý nghiệp vụ, API RESTful, quản lý trạng thái máy và kỹ thuật viên, proxy an toàn cho AI |
| **Trí tuệ Nhân tạo (AI Engine)** | Google Gemini API (@google/genai SDK) | Phân tích cơ chế hỏng hóc, trích xuất nguyên nhân gốc rễ, đối chiếu tài liệu RAG, trợ lý chat Copilot |
| **Tương tác Giọng nói (Speech AI)** | Web Speech API (SpeechRecognition & SpeechSynthesis) | Nhập triệu chứng rảnh tay bằng tiếng Việt, đọc to các bước SOP cho kỹ thuật viên đang đeo găng tay thao tác |
| **Đồng bộ Ngoại tuyến (Offline-First)** | Service Worker PWA, IndexedDB, Cache Storage | Duy trì hoạt động khi mất mạng phân xưởng cơ khí, tự động đẩy hàng đợi đồng bộ khi kết nối lại |
| **Xuất Báo cáo & Tài liệu** | jsPDF, CSV Exporter, Markdown Engine | Xuất phiếu lý lịch máy (Machine Dossier PDF), trích xuất dữ liệu vận hành CSV, quản trị kho tri thức RAG |

---

## 3. CÁC PHÂN HỆ VÀ TÍNH NĂNG CHI TIẾT

### 3.1. Phân hệ Giám sát Thời gian Thực & Cảm biến IoT Telemetry
- **Giám sát thông số cắt gọt EDM đa chiều:**
  - Điện áp phóng điện (Discharge Gap Voltage - V).
  - Dòng đỉnh xung điện (Peak Current - A).
  - Áp suất dung dịch điện môi / nước khử ion (Dielectric Pressure - Bar).
  - Nhiệt độ dung dịch điện môi (Dielectric Temp - °C).
  - Lực căng dây cắt đồng / molybdenum (Wire Tension - N).
  - Tốc độ cuộn dây (Wire Speed - m/min).
  - Độ rung động cơ khí ổ trục (Vibration - mm/s).
  - Độ dẫn điện dung môi khử ion (Conductivity - µS/cm).
  - Hiệu suất tổng thể thiết bị OEE (Overall Equipment Effectiveness - %).
- **Thẻ thiết bị thông minh (DeviceCard):**
  - Hiển thị trực quan trạng thái vận hành: `RUNNING` (Xanh lục), `MAINTENANCE` (Vàng hổ phách), `CRITICAL_STOP` (Đỏ cảnh báo), `OFFLINE` (Xám).
  - Sparkline hiển thị biến thiên điện áp và áp lực 60 giây gần nhất.
  - Phím thao tác nhanh: Xem chi tiết máy, quét QR Code thẻ tài sản, gọi AI chẩn đoán, xuất báo cáo PDF.

### 3.2. Phân hệ Bảng điều khiển Trung tâm (Dashboard) & Tùy biến Kéo Thả
- **Facility Summary Card:** Báo cáo tổng thể tình trạng đội máy (Fleet Overview), số máy đang chạy, số máy đang sự cố, tỷ lệ khả dụng trung bình toàn xưởng.
- **Predictive Maintenance Alerts Card:** Cảnh báo sớm linh kiện sắp tới hạn bảo trì (bộ dẫn hướng kim cương, lọc giấy, phớt bơm, quạt biến tần).
- **Performance Analytics Card (Tích hợp Recharts):**
  - Biểu đồ dự báo Uptime vận hành cho 7 ngày tới dựa trên chuỗi thời gian lịch sử và xác suất dừng máy.
  - Nút xuất dữ liệu phân tích ra định dạng file CSV chuẩn công nghiệp (`Export CSV`).
- **Tùy biến Giao diện Kéo Thả (Customize Dashboard):**
  - Cho phép người dùng kéo thả sắp xếp lại vị trí ưu tiên của 3 khối thẻ chính.
  - Lưu cấu hình bố cục cá nhân hóa vào LocalStorage, tự động khôi phục theo phiên làm việc.

### 3.3. Phân hệ Chẩn đoán Sự cố Khẩn cấp bằng Trí tuệ Nhân tạo (AI Diagnosis Engine)
Khi máy gặp sự cố (như đứt dây liên tục E-102, quá nhiệt IGBT SPW-303, tụt áp dầu ALARM-204):
- **Phân tích Snapshot cảm biến tức thời:** AI đọc toàn bộ giá trị cảm biến tại micro-second máy dừng.
- **Tổng hợp Tri thức Kỹ thuật (RAG):** Đối chiếu với sổ tay bảo dưỡng OEM và tài liệu quy chuẩn nội bộ nhà máy.
- **Nhập triệu chứng bằng giọng nói rảnh tay (Hands-Free Voice-to-Text):**
  - Kỹ thuật viên không cần tháo găng tay hay gõ phím; chỉ cần bấm biểu tượng Micro và nói trực tiếp tiếng Việt (hoặc tiếng Anh).
  - Nhận diện âm thanh lạ ("tiếng rít ở trục Z"), mùi khét biến áp xung, hiện tượng bọt khí xả nước...
  - Hỗ trợ các mẫu triệu chứng thực chiến một chạm để kiểm tra nhanh.
- **Đọc to quy trình hướng dẫn bằng giọng nói (Text-to-Speech Audio SOP):**
  - AI đọc to từng bước thao tác an toàn và các bước kiểm tra cơ khí để kỹ thuật viên tập trung thao tác máy.

### 3.4. Chẩn đoán Thông minh Dựa trên Lịch sử Bảo dưỡng Định kỳ (Smart History-Based Diagnosis)
- **Tự động đối chiếu lịch sử của chính thiết bị đó:**
  - Truy vấn toàn bộ các đợt bảo dưỡng định kỳ (`PREVENTIVE`), sửa chữa đột xuất (`CORRECTIVE`), và hiệu chuẩn (`CALIBRATION`) trước đây của máy.
  - Tính toán số giờ hoạt động lũy kế kể từ lần thay linh kiện gần nhất (Operating Hours Since Service).
- **Phát hiện quy luật hỏng hóc tái diễn:**
  - Nhận diện linh kiện đang tiến sát ngưỡng hao mòn tới hạn (ví dụ: cụm dẫn hướng kim cương P-104 đã chạy 380h / giới hạn 500h; lọc giấy đạt 85% vòng đời).
  - Đối chiếu tiền sử lỗi để phân biệt giữa lỗi linh kiện mới lắp và cặn xỉ tích tụ do chu kỳ súc rửa chưa sạch.
- **Khuyến nghị phòng ngừa chuyên sâu:**
  - AI đưa ra tỷ lệ tương quan lịch sử (ví dụ: 86% tương quan với đợt bảo dưỡng ngày 22/09).
  - Hướng dẫn kỹ thuật viên kiểm tra tiền sử trước khi quyết định thay mới linh kiện đắt tiền.

### 3.5. Trợ lý AI Kỹ thuật Hiện trường (Field Copilot Chat)
- Chat tương tác 2 chiều với AI am hiểu sâu về điện khí, thủy lực và sơ đồ mạch EDM.
- Hỗ trợ đặt câu hỏi bằng văn bản hoặc giọng nói trực tiếp.
- Tra cứu tức thì thông số cắt tối ưu: thời gian xung bật/tắt (Pulse ON/OFF), điện áp khe hở, lưu lượng xả nước.

### 3.6. Nghiệm thu Khắc phục, Dạy cho AI & Dự báo Thời gian Sửa chữa (Repair Report & ETTR)
- **AI Dự báo Thời gian Sửa chữa (AI Estimated Time to Repair - ETTR):**
  - Phân tích mã lỗi hiện tại (E-102, SPW-303, P-104...).
  - Đánh giá chỉ số hiệu suất trong quá khứ của chính kỹ thuật viên được giao việc trên dòng máy tương tự (Makino, Sodick, Fanuc).
  - Tự động tính toán thời gian mục tiêu tối ưu (Target Minutes) kèm khoảng tin cậy.
  - Cung cấp nút một chạm "Áp dụng thời gian dự kiến từ AI" và hiển thị so sánh thực tế (Nhanh hơn / Đúng kế hoạch / Vượt giờ).
- **Vòng lặp Học máy Con người dạy cho AI (Human-in-the-Loop):**
  - Sau khi sửa chữa xong, kỹ thuật viên nhập nguyên nhân thực tế phát hiện, mẹo kỹ thuật đã áp dụng, linh kiện đã thay và chấm điểm đề xuất của AI (1-5 sao).
  - Dữ liệu này được đóng gói thành **AI Learning**, nạp thẳng vào Kho tri thức phân xưởng để các ca sửa chữa tương lai của bất kỳ kỹ thuật viên nào cũng được thừa hưởng.

### 3.7. Quản lý Đội ngũ Kỹ thuật viên & Bảng điểm Thành thạo (Technician Status & Proficiency Score)
- **Quản lý Trực ca & Điều phối (Dispatch Fleet):**
  - Theo dõi trạng thái: Đang trực (`ON_DUTY`), Bận sửa máy (`BUSY`), Nghỉ ca (`OFF_DUTY`).
  - Phân bổ phụ trách từng máy, liên lạc nhanh qua điện thoại / email.
- **Bảng điểm Thành thạo Kỹ thuật viên (Proficiency Score):**
  - Đánh giá khách quan dựa trên số ca sửa chữa thực tế đã hoàn thành, số lượng máy đã giải quyết thành công, và số lần tri thức của KTV được tái sử dụng thành công trên toàn xưởng.
  - Phân hạng chuyên môn: Tập sự (Apprentice) ➔ Kỹ thuật viên Lành nghề (Specialist) ➔ Chuyên gia Trưởng (Master Engineer).
  - Huy hiệu thành tích (Badges) cho các chuyên môn đặc thù: Chuyên gia Cắt dây, Bậc thầy Thủy lực, Cao thủ Nguồn xung IGBT.

### 3.8. Lập lịch Bảo dưỡng & Nhắc nhở Định kỳ (Service Schedule Calendar & Maintenance Reminders)
- **Lịch biểu trực quan theo tháng:** Hiển thị các kỳ bảo dưỡng 250h, 500h, 1000h và 2000h cho từng máy.
- **Cài đặt Lời nhắc Định kỳ (Set Maintenance Reminder):**
  - Cho phép người dùng thiết lập nhắc nhở lặp lại theo tuần, tháng hoặc theo số giờ vận hành máy cho các bộ phận hao mòn (như thay lõi lọc giấy, thay phớt bơm, tra mỡ thanh trượt).
  - Hiển thị danh sách nhắc việc chủ động và tích hợp hệ thống thông báo.

### 3.9. Quản trị Tài liệu Kỹ thuật RAG & Đồng bộ Thiết bị Di động
- **Documents Tab:** Kho sổ tay bảo dưỡng OEM, quy trình SOP xưởng, sơ đồ nguyên lý mạch điện. Cho phép tìm kiếm toàn văn và nạp tài liệu mới cho AI học.
- **Mobile Device Management (MDM) & Push Simulator:**
  - Quản lý danh sách điện thoại / máy tính bảng hiện trường của kỹ thuật viên.
  - Hỗ trợ gửi thông báo đẩy khẩn cấp (Push Notification Simulator) khi máy gặp sự cố dừng đột ngột.

### 3.10. Xuất Báo cáo & Lưu trữ Tài sản Kỹ thuật
- **Machine Dossier PDF Export:** Tạo phiếu lý lịch thiết bị chuẩn công nghiệp bao gồm lịch sử sửa chữa, biểu đồ vận hành, danh mục linh kiện thay thế và đánh giá OEE.
- **CSV Data Export:** Xuất dữ liệu chuỗi thời gian telemetry và phân tích hiệu suất phục vụ báo cáo ERP / MES.

---

## 4. HƯỚNG DẪN THAO TÁC CƠ BẢN DÀNH CHO KỸ THUẬT VIÊN

### Kịch bản 1: Xử lý sự cố máy dừng khẩn cấp
1. Khi máy báo dừng (Thẻ máy chuyển sang màu đỏ `CRITICAL_STOP`):
2. Bấm vào nút **"AI Chẩn Đoán"** trên thẻ máy.
3. Kỹ thuật viên quan sát hiện trường, bấm nút **Micro** tại ô "Nhập Triệu Chứng Bằng Giọng Nói" và mô tả: *"Dây bị đứt ở góc nhọn, nước xả đầu trên yếu và có bọt khí"*.
4. Bấm **"AI Tái Chẩn Đoán"** (hoặc tích chọn "Chẩn đoán thông minh dựa trên lịch sử" để đối chiếu các lần bảo dưỡng trước).
5. Bấm **"Đọc To Hướng Dẫn"** để nghe giọng nói hướng dẫn từng bước xử lý an toàn mà không cần nhìn màn hình.
6. Sau khi xử lý xong tại máy, bấm **"Đã Sửa Xong • Nghiệm Thu & Dạy AI"**.
7. Tại cửa sổ nghiệm thu, xem **AI Dự Báo Thời Gian Sửa Chữa (ETTR)**, bấm nút áp dụng thời gian và gửi báo cáo để hoàn tất.

### Kịch bản 2: Kiểm tra lịch bảo dưỡng và cài đặt lời nhắc
1. Mở xem chi tiết máy bằng nút **"Chi Tiết Máy & Lịch Sử"**.
2. Chuyển sang tab **"Lịch Trình Bảo Dưỡng"** để xem các mốc thời gian sắp tới.
3. Bấm **"Cài Đặt Nhắc Nhở Bảo Dưỡng"** để tạo thông báo định kỳ cho linh kiện cần theo dõi.

---

## 5. THÔNG TIN PHIÊN BẢN VÀ BẢN QUYỀN

- **Phiên bản:** EDM SmartGuard AI v2.5.0 Professional Edition
- **Hệ điều hành tương thích:** Trình duyệt Web hiện đại (Chrome, Edge, Safari, Firefox), Hỗ trợ PWA trên Android/iOS và Desktop.
- **Ngôn ngữ hỗ trợ:** Tiếng Việt (chính), Tiếng Anh.
- **Cập nhật:** Tự động đồng bộ tri thức phân xưởng theo thời gian thực (Human-in-the-Loop).
