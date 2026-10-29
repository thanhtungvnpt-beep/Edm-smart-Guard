# BẢNG KIỂM KÊ MÃ NGUỒN VÀ KẾ HOẠCH TÁI CẤU TRÚC INDUSTRIAL CLARITY PRO
**Dự án**: EDM SMARTGUARD AI — Nền Tảng Điều Hành Giám Sát & Bảo Trì Thiết Bị Công Nghiệp Thông Minh  
**Mục tiêu**: Chuyển đổi giao diện sang chuẩn **Industrial Clarity PRO (Enterprise Operations Room)** theo ảnh tham chiếu thực tế, bảo toàn 100% chức năng hiện có.

---

## 1. KIỂM KÊ MÃ NGUỒN & HỆ THỐNG HIỆN HỮU (GIAI ĐOẠN 1)

| Tên tệp / Đường dẫn | Tên Component | Loại giao diện | Chức năng nghiệp vụ | Nơi gọi / Sử dụng | Nguồn dữ liệu & API | Quyền truy cập | Phụ thuộc chính | Nguy cơ khi thay đổi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `src/components/ControlTowerLayout.tsx` | `ControlTowerLayout` | App Shell / Khung chính | Header Dark Navy (`#0A2B4C`), Sidebar 15 mục (`#082A4A`), thanh tìm kiếm, bộ chọn xưởng/nhà máy | `src/App.tsx` | State nhà máy, thông báo từ `server.ts` | Toàn quyền xem | Lucide icons, Image assets | Vỡ layout tổng thể, mất liên kết điều hướng 15 phân hệ |
| `src/components/IndustrialControlTowerPro.tsx` | `IndustrialControlTowerPro` | Dashboard trung tâm | Màn hình điều hành 11 Panel: 6 thẻ KPI, Sơ đồ nhà máy 3D, OEE xưởng, Cảnh báo, Đề xuất AI, Thiết bị (48), Lệnh WO (28), KTV (12), Xu hướng 7 ngày, Donut trạng thái, Top sự cố, Tình trạng hệ thống | `src/App.tsx` (tab 'overview') | `/api/devices`, `/api/technicians`, `/api/stats`, telemetry polling | Giám đốc, EQM Leader, Kỹ thuật viên | Recharts, D3.js modal | Mất đồng bộ dữ liệu thời gian thực, lỗi render biểu đồ |
| `src/components/DeviceCard.tsx` | `DeviceCard` | Thẻ thiết bị chuyên sâu | Giám sát xung EDM (V, A, servo, nhiệt độ), cảnh báo liên tục > 48h, nút mở dự báo D3, điều khiển nhanh | `src/App.tsx`, `FleetGrid` | `telemetry`, `operationalMetrics.ts` | KTV, EQM Leader | `operationalMetrics`, `maintenancePrediction` | Sai lệch cảnh báo ngưỡng an toàn máy |
| `src/components/AIVibrationFailurePredictionModal.tsx` | `AIVibrationFailurePredictionModal` | Modal D3.js chuyên sâu | Biểu đồ xác suất hỏng hóc 7 ngày theo phổ rung động FFT, ngưỡng ISO 10816-3 (50%, 75%) | `DeviceCard`, `IndustrialControlTowerPro` | `calculateAIVibrationCurrentSchedule` | Kỹ thuật viên, EQM | `d3`, SVG, Lucide | Lỗi render toán học D3 nếu thay đổi cấu trúc dữ liệu rung |
| `src/components/Header.tsx` | `Header` | Header phụ trợ | Header thay thế khi chuyển view Fleet Grid, phân loại lỗi Critical | `src/App.tsx` | State máy, notifications | All roles | Lucide icons | Trùng lặp thanh header nếu không điều hướng nhất quán |
| `src/components/EmergencyModal.tsx` | `EmergencyModal` | Modal khẩn cấp | Popup cảnh báo dừng máy đột ngột, còi báo động, xác nhận KTV tiếp nhận | `src/App.tsx` | `/api/devices/:id/acknowledge` | KTV trực ca, Quản lý | Audio Manager, Web Push | Chậm trễ cứu hộ máy khi xảy ra cháy/chập phóng điện |
| `src/components/roles/RoleNavigationHeader.tsx` | `RoleNavigationHeader` | Chuyển đổi vai trò | Chuyển góc nhìn Director / EQM Leader / Field Tech / Mobile Viewport | `src/App.tsx` | State `currentRole`, `viewportMode` | All roles | Role view components | Ảnh hưởng phân quyền xem dữ liệu |
| `src/components/trust/DataTrustCenter.tsx` | `DataTrustCenter` | Trung tâm tin cậy dữ liệu | Đo lường độ tin cậy telemetry IoT, drift cảm biến, tỉ lệ dữ liệu hợp lệ | `src/App.tsx` (tab 'data-trust') | Telemetry history, audit log | Quản trị, Director | Recharts, audit storage | Mất cơ sở kiểm chứng dữ liệu AI |
| `src/components/trust/HitlWorkflowManagementCenter.tsx` | `HitlWorkflowManagementCenter` | Human-in-the-Loop | Quy trình con người phê duyệt đề xuất AI trước khi sinh lệnh bảo trì | `src/App.tsx` (tab 'hitl') | AI Learnings, Work Orders | EQM Leader, Director | State máy, audit logger | AI tự động can thiệp sai lệch vào máy mà không có kỹ sư duyệt |
| `src/components/trust/AuditLogAndRbacCenter.tsx` | `AuditLogAndRbacCenter` | Quản trị RBAC & Audit | Nhật ký thao tác hệ thống, phân quyền kỹ thuật viên, truy vết lỗi | `src/App.tsx` (tab 'audit') | Audit logs storage | Quản trị viên IT | LocalStorage / server logs | Lỗ hổng bảo mật và mất truy vết pháp lý |
| `src/components/UnifiedReportsHub.tsx` | `UnifiedReportsHub` | Trung tâm báo cáo | Xuất báo cáo ca trực, phân tích OEE, MTBF, MTTR, chi phí linh kiện | `src/App.tsx` (tab 'reports') | Stats aggregation | Quản lý, Giám đốc | Recharts, CSV/PDF export | Sai lệch số liệu báo cáo tuần/tháng |
| `src/components/OfflineConnectivityBanner.tsx` | `OfflineConnectivityBanner` | Banner mạng ngoại tuyến | Quản lý Service Worker cache PWA, đồng bộ khi có mạng trở lại | `src/App.tsx` | `offlineManager.ts`, Cache API | All roles | IndexedDB / Cache storage | Mất khả năng tra cứu tài liệu khi nhà máy đứt cáp quang |

---

## 2. BỘ THIẾT KẾ DÙNG CHUNG DESIGN SYSTEM (GIAI ĐOẠN 2)
Xây dựng các component nguyên tử dùng chung tại `src/components/ui/` theo đúng design tokens:
- **Navy chính**: `#073B68` / `#0A2B4C`
- **Navy đậm Sidebar**: `#082A4A`
- **Xanh hành động**: `#1677D2`
- **Nền chính**: `#F3F7FB`
- **Nền thẻ Card**: `#FFFFFF`
- **Viền mảnh**: `#D9E3ED`
- **Chữ chính**: `#19324D` | **Chữ phụ**: `#64748B`
- **Màu trạng thái**: Thành công `#16A36A`, Cảnh báo `#F2A51A`, Nghiêm trọng `#E5484D`, Thông tin `#2196D2`

Các component chuẩn hóa:
1. `KPIStatCard`: Thẻ KPI nền trắng, chỉ số to rõ, delta %, breakdown chấm màu.
2. `StatusBadge`: Tag trạng thái bo góc tròn, màu sắc và độ tương phản cao chuẩn WCAG.
3. `DataTable`: Bảng dữ liệu công nghiệp nền trắng, header xám nhạt, hover hàng, responsive.
4. `EmptyState`, `LoadingState`, `ErrorState`: Xử lý triệt để tính toàn vẹn dữ liệu (Giai đoạn 6).

---

## 3. LỘ TRÌNH TRIỂN KHAI THEO TỪNG GIAI ĐOẠN
1. **Giai đoạn 2**: Tạo thư viện `src/components/ui/IndustrialClarityDesignSystem.tsx` chuẩn hóa toàn bộ các component dùng chung.
2. **Giai đoạn 3 & 4**: Nâng cấp `ControlTowerLayout` và `IndustrialControlTowerPro` tích hợp trực tiếp Design System và xử lý các trạng thái dữ liệu (Loading, Error, Empty, Real Data, Offline).
3. **Giai đoạn 5 & 6**: Rà soát các luồng dữ liệu, modal, API và đảm bảo tính trung thực (không tự sinh số liệu giả).
4. **Giai đoạn 7 & 8**: Kiểm tra hiển thị responsive (Desktop, Tablet, Mobile) và chạy kiểm thử `lint_applet` / `compile_applet`.
