# EDM SMARTGUARD AI — GIAI ĐOẠN 1: TRUSTED AI FOUNDATION
## BÁO CÁO HIỆN TRẠNG TOÀN DIỆN VÀ THIẾT KẾ KIẾN TRÚC QUẢN TRỊ AI ĐÁNG TIN CẬY

---

## PHẦN A: BÁO CÁO HIỆN TRẠNG HỆ THỐNG (SYSTEM INVENTORY & BASELINE AUDIT)

### 1. Thông Tin Kiến Trúc Nền Tảng
- **Tên Dự Án**: EDM SmartGuard AI (Industrial Equipment Maintenance & Production Reliability Platform)
- **Công Nghệ Cốt Lõi**:
  - Frontend: React 19.x, TypeScript 5.x, Vite, Tailwind CSS v4, Lucide React Icons.
  - Backend/Proxy: Express.js (`server.ts`) kết hợp Vite Middleware chạy trên cổng 3000.
  - Cơ chế Quản trị Dữ liệu: In-Memory Datastore với chu kỳ telemetry 1Hz (1 giây), hỗ trợ Offline LocalStorage Snapshot Cache và Sync Latency Tracker.
- **Tình Trạng Sức Khỏe Ban Đầu**:
  - TypeScript Compile (`tsc --noEmit`): 0 lỗi.
  - Build Bundle (`npm run build`): Thành công.
  - Độ sẵn sàng của các Module hiện hữu: 100% chức năng cốt lõi đang chạy ổn định.

### 2. Bảng Kiểm Kê Hiện Trạng Chức Năng (Baseline Inventory Matrix)

| Mã Chức Năng | Tên Chức Năng | Vị Trí Mã Nguồn | Trạng Thái Thực Tế | Phụ Thuộc | Rủi Ro Khi Sửa | Phương Án Nâng Cấp Giai Đoạn 1 |
|:---|:---|:---|:---|:---|:---|:---|
| **CORE-01** | Giám Sát Thiết Bị Thời Gian Thực (1Hz Telemetry) | `/src/App.tsx`, `/server.ts`, `/src/components/DeviceCard.tsx` | Đang hoạt động hoàn hảo | In-memory stream, Modbus proxy | Gián đoạn hiển thị máy khi thêm trường dữ liệu | Giữ nguyên 100% schema cũ, bổ sung metadata nguồn (Data Source ID, Traceability Hash) |
| **CORE-02** | Mô Phỏng Tín Hiệu Xung & Dừng Máy Khẩn Cấp | `/src/components/EdmSimulatorModal.tsx`, `/server.ts` | Đang hoạt động | State máy EDM | Mất đồng bộ còi báo và sự cố | Bảo toàn luồng giả lập, gắn thẻ nguồn "SIMULATOR_TEST" để phân định với dữ liệu thật |
| **ROLE-01** | Bảng Điều Khiển Giám Đốc (Plant Director) | `/src/components/roles/PlantDirectorView.tsx` | Đang hoạt động | OEE Stats, Executive Proposals | Thiếu chuỗi bằng chứng kiểm toán chi tiết | Mở rộng liên kết với Data Trust Center và Audit Log bất biến |
| **ROLE-02** | Bảng Điều Phối EQM Leader | `/src/components/roles/EqmLeaderView.tsx` | Đang hoạt động | Technician status, SLA 30p, Parts inventory | Lệch phân công kỹ thuật viên | Tích hợp RBAC 8 vai trò và quy trình phê duyệt Human-in-the-Loop |
| **ROLE-03** | Bảng Thao Tác Kỹ Thuật Viên (Field Tech) | `/src/components/roles/FieldTechnicianView.tsx` | Đang hoạt động | Voice-to-Text, Dynamic Checklist, QR Scan | Mất tính tức thời khi cập nhật trạng thái sửa chữa | Bổ sung xác nhận nguồn thực địa (Observed Real vs Confirmed) |
| **ROLE-04** | Cộng Đồng Chuyên Gia Liên Nhà Máy | `/src/components/roles/CrossFactoryCommunityView.tsx` | Đang hoạt động | In-memory posts, SOP verification | Rò rỉ thông tin nhạy cảm giữa các cơ sở | Gắn thẻ bảo mật, phân quyền Community Expert vs Community Moderator |
| **TOWER-01** | AI Performance Control Tower (P2-01) | `/src/components/phase2/AiPerformanceControlTower.tsx` | Đang hoạt động | 4 Engines (PdM, RCA, Optimizer, Quality) | Đưa ra cảnh báo mà thiếu nhãn dữ liệu tin cậy | Tích hợp trực tiếp Data Trust Gate và 5 câu hỏi cốt lõi vào Control Tower |
| **DATA-01** | Thư Viện Tài Liệu & Tri Thức Lỗi | `/src/components/DocumentsTab.tsx`, `/src/components/AILearningsTab.tsx` | Đang hoạt động | In-memory docs, PDF SOPs | Chưa truy xuất được tài liệu nào đã sinh ra đề xuất AI | Thiết lập Data Lineage liên kết tài liệu nguồn vào từng AIDecisionCard |
| **ALARM-01** | Quản Lý Cảnh Báo & Âm Thanh | `/src/components/PredictiveMaintenanceAlerts.tsx`, `/src/utils/audio.ts` | Đang hoạt động | Web Audio API, Notification Logs | Chưa phân định rõ nguồn cảnh báo (Observed vs Rule vs AI Prediction) | Nâng cấp mô hình vòng đời 8 bước và nhãn phân định nguồn dữ liệu |

---

## PHẦN B: KẾ HOẠCH NÂNG CẤP VÀ THIẾT KẾ 6 MÔ-ĐUN CỐT LÕI (GIAI ĐOẠN 1)

### 1. Chuỗi Truy Xuất Nguồn Gốc 9 Mắt Xích Bắt Buộc (9-Link Traceability Chain)
Mọi quyết định, cảnh báo hoặc khuyến nghị trong EDM SmartGuard AI bắt buộc phải gắn liền với chuỗi 9 mắt xích:
```
[1. NGUỒN DỮ LIỆU] 
       ↓ (Modbus TCP/IP, ERP/MES, CMM inspection, Sách hướng dẫn OEM, Nhật ký bảo trì)
[2. KIỂM TRA CHẤT LƯỢNG] 
       ↓ (Đánh giá 6 chiều: Đầy đủ, Kịp thời, Hợp lệ, Nhất quán, Đơn nhất, Truy vết)
[3. PHÂN TÍCH AI] 
       ↓ (Engine PdM / RCA / Optimizer / Quality Forecast xử lý dữ liệu đạt chuẩn)
[4. BẰNG CHỨNG (EVIDENCE)] 
       ↓ (Dải tham số vượt chuẩn, correlation token, tham chiếu SOP OEM)
[5. CON NGƯỜI XEM XÉT (HITL)] 
       ↓ (Kỹ sư/Leader kiểm tra ngữ cảnh thực tế, rủi ro và phương án thay thế)
[6. PHÊ DUYỆT (APPROVAL)] 
       ↓ (Cấp có thẩm quyền ký số, lưu mã định danh, lý do duyệt/từ chối)
[7. THỰC HIỆN (EXECUTION)] 
       ↓ (Kỹ thuật viên thực thi theo lệnh công tác Work Order)
[8. NHẬT KÝ KIỂM TOÁN (AUDIT LOG)] 
       ↓ (Bất biến, ghi nhận correlationId, actor, diff trước/sau, checksum)
[9. XÁC MINH KẾT QUẢ (VERIFICATION)]
         (Đo lường hiệu quả thực tế: Downtime tiết kiệm được, lỗi sản phẩm ngăn ngừa)
```

---

### 2. Thiết Kế Chi Tiết 6 Mô-Đun Nền Tảng

#### Mô-đun 1: AI Control Tower (Tháp Điều Hành AI Trung Tâm)
- Hỗ trợ cả 2 chế độ hiển thị: Màn hình PC toàn diện & Màn hình Mobile cảm ứng hiện trường.
- Tích hợp 4 phân khu vận hành:
  1. **Operational Overview**: Trạng thái 6 máy EDM, OEE, Downtime, MTBF, MTTR kèm mác nguồn dữ liệu.
  2. **Alert Governance Center**: Trung tâm cảnh báo phân loại rõ nguồn gốc (Thực tế cảm biến vs Quy tắc ngưỡng vs AI Dự báo).
  3. **AI Decision Queue (Human-in-the-Loop)**: Hàng đợi quyết định AI chờ phê duyệt với mức độ rủi ro và bằng chứng liên kết.
  4. **Data Trust Gate Status**: Cổng kiểm soát chất lượng dữ liệu AI (READY, READY_WITH_LIMITATIONS, NOT_READY, BLOCKED).
- Trực quan hóa trả lời ngay lập tức **5 câu hỏi cốt lõi**:
  1. Hệ thống đang chạy thế nào?
  2. Đang có vấn đề gì nghiêm trọng?
  3. AI đang đề xuất gì?
  4. Dữ liệu có đáng tin để ra quyết định không?
  5. Hành động nào cần con người phê duyệt ngay?

#### Mô-đun 2: Data Trust Center (Trung Tâm Quản Trị Dữ Liệu Đáng Tin Cậy)
- **Data Source Registry**: Quản lý 5 nguồn dữ liệu nhà máy:
  - `SRC-MODBUS`: Cảm biến PLC/CNC Modbus TCP/IP (Tần suất 1Hz, Độ trễ 12ms, Data Owner: Đội Cơ Điện).
  - `SRC-MES`: Hệ thống Điều hành Sản xuất MES/ERP (Tần suất 10s, Độ trễ 180ms, Data Owner: Phòng Kế Hoạch).
  - `SRC-CMM`: Máy đo tọa độ chính xác Zeiss CMM (Tần suất theo mẻ ép/cắt, Data Owner: Phòng QC).
  - `SRC-OEM`: Tài liệu Kỹ thuật & Sổ tay Hướng dẫn Sodick/Makino (Tần suất Cập nhật phiên bản, Data Owner: Trưởng ban Công Nghệ).
  - `SRC-CMMS`: Cơ sở dữ liệu Lịch sử Bảo trì & Phụ tùng (Tần suất Theo ca, Data Owner: Quản lý Xưởng).
- **Data Quality Dashboard (6 Tiêu Chí)**:
  1. *Completeness*: Tỷ lệ đầy đủ của các gói tin cảm biến (Mục tiêu >98%).
  2. *Freshness*: Độ trễ truyền dẫn tín hiệu (Ngưỡng an toàn < 2000ms).
  3. *Validity*: Dữ liệu nằm trong dải vật lý hợp lệ (0-100V, 0-60A, 15-35°C).
  4. *Consistency*: Độ đồng nhất giữa thông số máy và kết quả đo CMM.
  5. *Uniqueness*: Đơn nhất, không trùng lặp timestamp gói tin.
  6. *Traceability*: Khả năng truy vết từ bản ghi về đúng thiết bị và phiên làm việc.
- **Data Quality Issue Management**:
  - Ghi nhận lỗi phát sinh (mất gói tin, cảm biến trôi lệch, thiếu dữ liệu bảo trì).
  - Giao việc tự động cho Data Steward / Kỹ sư đo lường kèm SLA xử lý.
- **Data Lineage (Phả Hệ Dữ Liệu)**:
  - Bản đồ truy xuất trực quan từ Tín hiệu cảm biến thô → Chuẩn hóa ETL → Tính năng toán học → Mô hình suy luận AI → Khuyến nghị / Quyết định.
- **AI Data Readiness Gate**:
  - `READY`: Dữ liệu hoàn hảo (>95%), kích hoạt đầy đủ 4 Engine.
  - `READY_WITH_LIMITATIONS`: Đạt ngưỡng 80-94%, khuyến nghị kèm điều kiện phụ thuộc.
  - `NOT_READY`: Dưới 80%, cấm đưa ra đề xuất tự động.
  - `BLOCKED`: Cảm biến then chốt mất tín hiệu, khóa tức thì chức năng dự đoán rủi ro cho máy tương ứng.

#### Mô-đun 3: Human-in-the-Loop Workflow (Quy Trình Phê Duyệt 8 Trạng Thái)
- Chuỗi 8 bước nghiêm ngặt:
  `DRAFT` → `PENDING_REVIEW` → `APPROVED` / `REJECTED` → `EXECUTION_PENDING` → `EXECUTED` → `VERIFICATION_PENDING` → `VERIFIED`.
- Ma trận phê duyệt phân tầng theo cấp độ rủi ro (Risk Level 1: Thông tin, Level 2: Khuyến nghị vận hành, Level 3: Dừng máy hoặc Thay đổi đơn hàng).
- Ghi nhận đầy đủ: Người ký, chức danh, dấu thời gian, căn cứ phê duyệt và các phương án thay thế được cân nhắc.

#### Mô-đun 4: Audit Log (Nhật Ký Hành Động Bất Biến)
- Ghi nhận mọi tương tác: AI sinh đề xuất, Kỹ sư kiểm tra, Người duyệt ký lệnh, Kỹ thuật viên hoàn tất, Trưởng ca nghiệm thu.
- Mỗi bản ghi bao gồm:
  - `correlationId`: Mã định danh chuỗi truy vết liên kết từ cảnh báo đến nghiệm thu.
  - `timestamp`: Dấu thời gian chuẩn ISO.
  - `actor`: Tên và vai trò của người thực hiện.
  - `actionType`: Loại hành động (PROPOSE, APPROVE, REJECT, EXECUTE, OVERRIDE, CONFIG_CHANGE).
  - `targetEntity`: Đối tượng tác động (Thiết bị, Đơn hàng, Tham số, Nguồn dữ liệu).
  - `stateDiff`: Biến động giá trị trước (before) và sau (after).
  - `antiTamperHash`: Chuỗi băm SHA-256 bảo vệ tính toàn vẹn, chống chỉnh sửa.

#### Mô-đun 5: Role & Permission Management (RBAC 8 Vai Trò)
Hệ thống chuẩn hóa 8 vai trò chuyên trách với ma trận quyền hạn ma trận rõ ràng:
1. `SYSTEM_ADMIN`: Toàn quyền quản trị hệ thống, hạ tầng dữ liệu và nhật ký kiểm toán.
2. `PLANT_MANAGER`: Giám đốc nhà máy, duyệt ngân sách lớn, thay đổi lịch giao hàng, dừng máy toàn phân xưởng.
3. `LEADER`: Trưởng ca bảo trì, duyệt phiếu công tác kỹ thuật, phân công KTV, duyệt linh kiện thay thế.
4. `TECHNICIAN`: Kỹ thuật viên trực tiếp, nhận lệnh sửa chữa, cập nhật checklist, phản hồi kết quả AI.
5. `DATA_STEWARD`: Quản trị viên dữ liệu, xử lý lỗi chất lượng dữ liệu, cấu hình nguồn cấp, giám sát Data Gate.
6. `WORKFLOW_APPROVER`: Người phê duyệt độc lập cho các quy trình an toàn và chất lượng đặc biệt.
7. `COMMUNITY_EXPERT`: Chuyên gia kỹ thuật liên nhà máy, thẩm định và chuẩn hóa SOP từ các bài viết thực địa.
8. `COMMUNITY_MODERATOR`: Kiểm duyệt viên cộng đồng, ẩn danh hóa dữ liệu nhạy cảm, phê duyệt bài đăng.

#### Mô-đun 6: Alert Management (Quản Lý Cảnh Báo Chuẩn Hóa)
- Vòng đời cảnh báo 8 bước:
  `DETECTED` → `TRIAGED` → `ASSIGNED` → `ACKNOWLEDGED` → `IN_PROGRESS` → `RESOLVED` → `VERIFIED` → `CLOSED`.
- 4 Nhãn phân định bản chất cảnh báo (Data Provenance Tags):
  - `OBSERVED_REAL`: Dữ liệu đo đạc trực tiếp từ cảm biến vật lý.
  - `RULE_BASED`: Vi phạm ngưỡng định mức kỹ thuật đã định nghĩa.
  - `AI_PREDICTION`: Dự báo xu hướng bất thường từ mô hình học máy.
  - `CONFIRMED`: Đã được nhân viên kiểm tra thực tế tại hiện trường xác nhận.
