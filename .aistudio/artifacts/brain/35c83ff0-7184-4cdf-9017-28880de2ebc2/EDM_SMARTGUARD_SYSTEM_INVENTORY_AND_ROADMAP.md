# BÁO CÁO KIỂM KÊ TOÀN DIỆN, ĐÁNH GIÁ KHOẢNG CÁCH VÀ BẢN ĐỒ NÂNG CẤP HỆ THỐNG
## DỰ ÁN: EDM SMARTGUARD AI — NỀN TẢNG QUẢN LÝ BẢO TRÌ CÔNG NGHIỆP THÔNG MINH LIÊN NHÀ MÁY
**Mã dự án:** EDM-SMARTGUARD-2026 | **Phiên bản hiện tại:** v3.4.0 -> **Mục tiêu:** v4.0.0
**Tiêu chuẩn kiểm kê:** Tuân thủ 100% Chỉ thị I & II (Bảo toàn chức năng, Zero Regression, Human in the Loop)

---

## I. TỔNG QUAN HỆ THỐNG VÀ HIỆN TRẠNG KỸ THUẬT

### 1. Thông tin kiến trúc & Công nghệ nền tảng
- **Frontend Framework:** React 19 + TypeScript (strict mode) chạy trên nền Vite bundler.
- **Styling & Design System:** Tailwind CSS v4 (`@import "tailwindcss"`), dark mode công nghiệp (Industrial Dark Slate/Navy) tối ưu chống mỏi mắt cho xưởng cơ khí, hỗ trợ chế độ Tương phản cao (`high-contrast`) chống lóa/chói sáng.
- **Backend Entry Point:** Full-stack Express + TypeScript (`server.ts`, 4,772 dòng) tích hợp middleware Vite dev server, quản trị cơ sở dữ liệu in-memory đồng bộ với khả năng lưu trữ Offline IndexedDB/LocalStorage.
- **AI Engine:** Google GenAI SDK (`@google/genai`) kết hợp thuật toán đối chiếu lịch sử hỏng hóc thực tế (Historical Precedent Correlation) và công cụ trích xuất SOP đa thức.
- **Thời gian phản hồi IoT:** Chu kỳ telemetry 1,000ms mô phỏng chuẩn Modbus TCP/IP và OPC-UA công nghiệp với 9 chỉ số sống: `V_GAP`, `I_PEAK`, `P_FLUSH`, `T_DIELEC`, `W_TENS`, `W_SPD`, `VIB_SPN`, `COND_ION`, `OEE_RT`.
- **Hệ thống âm thanh & Cảnh báo:** Web Audio API (`soundManager`) đa tần số (Còi hú dừng khẩn cấp 1400Hz, chuông thông báo, âm xác nhận thành công).
- **Hỗ trợ thiết bị:** Responsive toàn diện thích ứng Desktop (PC/Workstation), Tablet công nghiệp và Mobile hiện trường (hỗ trợ khung vỏ mô phỏng Smartphone và Full-width Mobile).

---

## II. BẢNG KIỂM KÊ HỆ THỐNG CHI TIẾT (SYSTEM INVENTORY TABLE)

Bảng đối chiếu kiểm kê toàn bộ chức năng thực tế trong mã nguồn:

| Mã CN | Tên Chức Năng | Vị Trí Mã Nguồn | Trạng Thái Thực Tế | Phụ Thuộc | Rủi Ro Khi Sửa | Phương Án Xử Lý & Bảo Toàn |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MGR-01** | Dashboard Quản Đốc Nhà Máy | `PlantDirectorView.tsx` | Hoạt động tốt | `devices`, `stats`, OEE formula | Mất đồng bộ KPI khi đổi schema | Bảo toàn 100% công thức tính OEE, Availability, MTTR; nâng cấp giao diện phân bổ chi phí |
| **MGR-02** | Quản lý cảnh báo & Sự cố | `PlantDirectorView.tsx`, `DeviceCard.tsx` | Hoạt động tốt | `Incident`, WebSocket/Polling | Cảnh báo giả nếu lọc sai độ nghiêm trọng | Giữ nguyên bộ phân loại sự cố CRITICAL/HIGH/MEDIUM; bổ sung chuyển cấp xử lý trực tiếp |
| **MGR-03** | Phê duyệt quyết định & Chi phí | `PlantDirectorView.tsx` | Hoạt động cơ bản | `approvals` state | AI tự duyệt trái thẩm quyền con người | **Human in the Loop:** Giữ nút ký duyệt thủ công có xác nhận âm thanh; bổ sung Audit Log lưu vết lý do & người duyệt |
| **MGR-04** | Báo cáo điều hành & OEE 7 ngày | `PlantDirectorView.tsx`, `PerformanceAnalytics.tsx` | Hoạt động tốt | Recharts, `getOperationalMetrics` | Sai lệch đồ thị A/P/Q | Tái sử dụng ComposedChart chuẩn 85% world-class; hỗ trợ xuất PDF/CSV tuần tự |
| **LEAD-01** | Bảng điều phối lệnh sửa chữa | `EqmLeaderView.tsx` | Hoạt động tốt | `DispatchTicket`, `devices` | Mất liên kết SLA 30 phút | Bảo toàn bảng phân bổ vé theo trạng thái; hiển thị rõ thời gian còn lại đến vi phạm SLA |
| **LEAD-02** | Danh sách KTV, Tìm kiếm & Quick Note | `EqmLeaderView.tsx` | Hoạt động tốt | `TechSortOption`, `TechQuickNote` | Mất ghi chú ngắn khi refresh | Lưu trữ LocalStorage đồng bộ; hỗ trợ lọc theo trạng thái sẵn sàng, điểm kỹ năng, có ghi chú |
| **LEAD-03** | Radar Đánh giá Kỹ năng KTV 5 Dòng Máy | `TechnicianDetailModal.tsx` | Hoạt động tốt | SVG Polygon calculation | Biến dạng đồ thị khi số trục thay đổi | Chuẩn hóa 5 trục máy EDM: Makino U6, Sodick ALC600G, Makino EDAF3, Fanuc α-C600iB, Mitsubishi EA12V |
| **LEAD-04** | Bảng Vàng KTV & Commendation | `TechnicianRepairLeaderboard.tsx` | Hoạt động tốt | Web Push API, MTTR stats | Token FCM hết hạn | Bảo toàn cơ chế đẩy thông báo khen thưởng kèm âm thanh chúc mừng và danh hiệu Top 1 |
| **TECH-01** | Nhận việc & Quét mã QR tại máy | `FieldTechnicianView.tsx`, `QRCodeScannerModal.tsx` | Hoạt động tốt | Camera HTML5, jsQR | Lỗi quyền truy cập Camera | Duy trì cơ chế quét tự động và nhập mã máy dự phòng thủ công; kích hoạt 1-chạm |
| **TECH-02** | AI Chẩn đoán, Âm thanh SOP & Voice | `AIDiagnosisModal.tsx`, `SpeechSynthesis` | Hoạt động tốt | Web Speech API, Gemini SDK | Trình duyệt không hỗ trợ Web Speech | Tự động chuyển đổi giữa đọc âm thanh Text-to-Speech và văn bản hướng dẫn từng bước |
| **TECH-03** | Checklist Model Máy & Đóng Báo Cáo | `ModelMaintenanceChecklist.tsx`, `RepairReportModal.tsx` | Hoạt động tốt | `MaintenanceRecord`, Brain API | Thiếu dữ liệu phụ tùng thay thế | Bắt buộc xác thực checklist trước khi đóng báo cáo; đẩy kết quả vào bộ não tri thức AI |
| **COM-01** | Bảng tin cộng đồng liên nhà máy | `CrossFactoryCommunityView.tsx` *(mới)* | Cần triển khai | `CommunityPost`, API | Xung đột luồng dữ liệu | Tạo component chuyên biệt, kết nối vào Role Switcher dưới dạng vai trò Cộng đồng / Chuyên gia |
| **COM-02** | Đăng câu hỏi & Bộ lọc ẩn danh | `CrossFactoryCommunityView.tsx` *(mới)* | Cần triển khai | Regex sanitizer, AI Duplicate check | Rò rỉ dữ liệu nhạy cảm của khách hàng | Triển khai Anonymization Sanitizer tự động loại bỏ serial, tên đối tác trước khi gửi |
| **COM-03** | Thảo luận đa nhà máy & AI Tóm tắt | `CrossFactoryCommunityView.tsx` *(mới)* | Cần triển khai | `CommunityAnswer`, AI Prompt | Quá tải thông tin | AI Copilot tóm tắt luồng thảo luận, chỉ ra rủi ro an toàn và đề xuất câu trả lời khả thi |
| **COM-04** | Hồ sơ Chuyên gia & Bảng vinh danh | `CrossFactoryCommunityView.tsx` *(mới)* | Cần triển khai | `ExpertProfile`, Danh hiệu | Thiếu động lực đóng góp | Cấp huy hiệu chuyên môn: Chuyên gia Makino, Cứu tinh sự cố, Tri thức vàng, ẩn danh/công khai |
| **COM-05** | Quy trình 5 bước xác minh tri thức | `CrossFactoryCommunityView.tsx` *(mới)* | Cần triển khai | Phê duyệt Quản đốc & SOP engine | Tri thức sai sót phát tán diện rộng | Chuẩn hóa luồng 5 bước nghiêm ngặt: Đề xuất -> Thẩm định -> Chuẩn hóa SOP -> Phê duyệt -> Phát hành |
| **COM-06** | Kho tri thức dùng chung có kiểm duyệt | `CrossFactoryCommunityView.tsx`, `AILearningsTab.tsx` | Hoàn thiện | `AILearning`, `TechnicalDocument` | Dữ liệu trùng lặp | Đồng bộ kho tri thức đã qua 5 bước vào cơ sở dữ liệu `learnings` và `documents` toàn hệ thống |
| **IOT-01** | Telemetry Sparklines & Arc Gauge | `TelemetrySparklineCard.tsx`, `MachineHealthArcGauge.tsx` | Hoạt động tốt | Canvas/SVG, Nominal Ranges | Tràn mảng số liệu khi chạy lâu | Duy trì FIFO buffer 30 điểm đo; phân cấp màu xanh/vàng/đỏ theo dải dung sai danh định |
| **RCA-01** | Module Phân tích Nguyên nhân Gốc rễ | `AIRootCauseAnalysisModule.tsx` | Hoạt động tốt | 5-Whys, Biểu đồ Ishikawa | Phân tích thiếu bằng chứng | Kết hợp sơ đồ xương cá (6M) và chuỗi 5-Tại sao gắn liền với hồ sơ tiền lệ lịch sử |
| **INV-01** | Quản lý kho phụ tùng & Mức tồn an toàn | `SparePartsInventoryTab.tsx` | Hoạt động tốt | `SparePart`, `StockTransaction` | Tồn kho âm hoặc thiếu cảnh báo | Cảnh báo tồn dưới mức an toàn; liên kết nhanh từ đề xuất phụ tùng của AI vào xuất kho |
| **OFF-01** | Vận hành Offline & Đồng bộ nền | `useOfflineStatus.ts`, `offlineManager.ts` | Hoạt động tốt | IndexedDB, LocalStorage | Xung đột dữ liệu khi tái kết nối | Cache toàn bộ snapshot hạm đội máy và tài liệu SOP; tự động push hàng đợi khi có mạng |

---

## III. BÁO CÁO ĐÁNH GIÁ KHOẢNG CÁCH (GAP ANALYSIS)

### 1. Module 1: Quản Đốc Nhà Máy (Plant Manager)
- **Đã có:** Dashboard OEE, hiển thị số máy dừng khẩn cấp, tính toán chi phí gián đoạn sản xuất ($125/h), nút duyệt đề xuất nhanh.
- **Khoảng cách cần nâng cấp:**
  1. Thiếu thông tin bằng chứng chi tiết của AI và phân tích rủi ro khi duyệt các quyết định quan trọng (MGR-03).
  2. Bổ sung cơ chế ghi vết (Audit Log) đầy đủ: người duyệt, thời điểm, lý do phê duyệt/từ chối và hành động khắc phục.
  3. Bổ sung chuyển cấp xử lý trực tiếp từ Quản đốc tới Leader EQM hoặc KTV phụ trách theo quyền hạn (MGR-02).

### 2. Module 2: Leader / Trưởng nhóm kỹ thuật (EQM Leader)
- **Đã có:** Bảng điều phối lệnh theo SLA 30 phút, phân công nhân lực, tìm kiếm/sắp xếp danh sách KTV, gắn ghi chú nhanh (Quick Note), Radar đánh giá năng lực 5 dòng máy EDM, Bảng vàng thành tích KTV với Web Push khen thưởng, AI Knowledge Synthesis Engine.
- **Trạng thái:** Hoàn chỉnh và đáp ứng vượt trội các yêu cầu LEAD-01 đến LEAD-05.

### 3. Module 3: Kỹ Thuật Viên (Technician)
- **Đã có:** Nhận việc hiện trường 1-chạm, quét mã QR nhận diện máy, AI chẩn đoán tích hợp đọc âm thanh SOP (Text-to-Speech), ghi âm giọng nói rảnh tay (Speech-to-Text), quy trình kiểm tra động theo model máy (Makino/Sodick/Fanuc/Mitsubishi), báo cáo kết quả và đánh giá độ chính xác của AI.
- **Trạng thái:** Hoàn chỉnh và bảo toàn các quy tắc vận hành an toàn.

### 4. Module 4: Cộng đồng kỹ thuật viên liên nhà máy (Cross-Factory Technical Community)
- **Đã có:** Tab Thảo luận nhóm sự cố theo từng máy đơn lẻ (`IncidentGroupChat.tsx`) và Kho tri thức học máy (`AILearningsTab.tsx`).
- **Khoảng cách cần triển khai mới:**
  1. Chưa có không gian cộng đồng liên nhà máy chuyên biệt kết nối Nhà máy 1 (Bắc Ninh), Nhà máy 2 (Hà Nội), Nhà máy 3 (TP.HCM).
  2. Chưa có cơ chế tự động ẩn danh hóa (Anonymization Sanitizer) các số liệu độc quyền trước khi đăng bài ra ngoài mạng lưới.
  3. Chưa có quy trình 5 bước chuẩn hóa tri thức (Đề xuất -> Thẩm định chuyên gia -> Chuẩn hóa SOP -> Phê duyệt Quản đốc -> Phát hành kho dùng chung).
  4. Chưa có bảng vinh danh chuyên gia liên nhà máy theo từng hãng thiết bị EDM.

---

## IV. KIẾN TRÚC HỆ THỐNG MỤC TIÊU (TARGET SYSTEM ARCHITECTURE)

```
+----------------------------------------------------------------------------------------------------+
|                                    EDM SMARTGUARD AI v4.0 PLATFORM                                 |
+----------------------------------------------------------------------------------------------------+
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 ▼                                                                 ▼
    ┌──────────────────────────┐                                      ┌──────────────────────────┐
    │    DESKTOP PC CONSOLE    │                                      │     MOBILE FIELD PWA     │
    │  (Quản đốc & Leader EQM) │                                      │ (Kỹ thuật viên hiện trường)│
    └────────────┬─────────────┘                                      └────────────┬─────────────┘
                 │                                                                 │
                 ├───────────────────────────────┬─────────────────────────────────┤
                 ▼                               ▼                                 ▼
   ┌───────────────────────────┐   ┌───────────────────────────┐     ┌───────────────────────────┐
   │    ROLE 1: PLANT MGR      │   │    ROLE 2: EQM LEADER     │     │    ROLE 3: TECHNICIAN     │
   │  • Trung tâm OEE & Downtime│  │  • Điều phối lệnh & SLA   │     │  • Quét QR 1-chạm tại máy │
   │  • Duyệt đề xuất AI & Risk│   │  • Radar KTV 5 Model EDM  │     │  • Checklist động theo máy│
   │  • Audit Log & Phân bổ    │   │  • Quick Note & Bảng vàng │     │  • Voice Input & Audio SOP│
   └─────────────┬─────────────┘   └─────────────┬─────────────┘     └─────────────┬─────────────┘
                 │                               │                                 │
                 └───────────────────────────────┼─────────────────────────────────┘
                                                 ▼
                               ┌───────────────────────────────────┐
                               │     ROLE 4: LIÊN NHÀ MÁY (COM)    │
                               │  • Bảng tin sự cố đa nhà máy      │
                               │  • Bộ lọc ẩn danh hóa thông tin   │
                               │  • AI Copilot tóm tắt & an toàn   │
                               │  • Quy trình 5 bước duyệt tri thức│
                               │  • Bảng vinh danh chuyên gia EDM  │
                               └─────────────────┬─────────────────┘
                                                 │
                                                 ▼
             ┌──────────────────────────────────────────────────────────────────┐
             │                     INTELLIGENCE CORE & SERVICES                 │
             │  • Gemini AI Engine (@google/genai)                              │
             │  • Historical Precedent Correlation Engine                       │
             │  • Real-time Telemetry Engine (9 Sparklines, 1Hz, Modbus/OPC)    │
             │  • Audio Synthesizer & Web Speech Recognition                    │
             │  • Offline Sync Engine (IndexedDB + PWA Cache)                   │
             └──────────────────────────────────────────────────────────────────┘
```

---

## V. LỘ TRÌNH TRIỂN KHAI NÂNG CẤP CHI TIẾT (PHASED ROADMAP)

- **Pha 1 (Hoàn tất):** Kiểm kê toàn bộ repository, xác minh build sạch, lập bảng đối chiếu chức năng và phát hành tài liệu kiểm kê.
- **Pha 2 (Đang triển khai):** 
  - Khởi tạo module `CrossFactoryCommunityView.tsx` đáp ứng chuẩn COM-01 đến COM-06.
  - Tích hợp vai trò `COMMUNITY` vào thanh điều hướng `RoleNavigationHeader.tsx` và `App.tsx`.
- **Pha 3 (Đang triển khai):**
  - Nâng cấp `PlantDirectorView.tsx` với quy trình phê duyệt đề xuất AI (Human-in-the-Loop) có bằng chứng, phân tích rủi ro, chuyển cấp và Audit Log.
  - Hoàn thiện tính năng xuất báo cáo quản trị và theo dõi chất lượng khuyến nghị AI.
- **Pha 4 (Kiểm thử & Bàn giao):**
  - Kiểm thử toàn diện không gây lỗi hồi quy (`lint_applet` & `compile_applet`).
  - Cập nhật tài liệu hướng dẫn vận hành cho 4 nhóm người dùng.
