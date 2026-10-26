# BÁO CÁO KIỂM KÊ CHỨC NĂNG & THIẾT KẾ KIẾN TRÚC GIAI ĐOẠN 2
## DỰ ÁN: EDM SMARTGUARD AI — NÂNG CAO HIỆU SUẤT THIẾT BỊ VÀ SẢN XUẤT
**Tiêu chuẩn:** Tuân thủ mục 1 - 18 của Master Prompt Giai đoạn 2 (Data First → AI Second → Decision Third → Action Fourth → Learning Last)

---

## I. BẢNG KIỂM KÊ CHỨC NĂNG HIỆN CÓ TRƯỚC GIAI ĐOẠN 2

| Module | Đã Có | Hoàn Thiện | Cần Nâng Cấp | Có Thể Tái Sử Dụng | Phụ Thuộc |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Giám Sát Thiết Bị & IoT** | 9 thông số cảm biến thời gian thực, 6 máy EDM | 100% | Tích hợp tính toán Equipment Risk Score (0-100) & Risk Timeline 5 nấc | Tái sử dụng Sparklines, ArcGauge, FIFO telemetry buffer | Sensor Telemetry 1Hz |
| **Bảo Dưỡng Dự Đoán (Engine A)** | `AIVibrationCurrentPredictiveModal`, `PredictiveInsightPanel` | 75% | Mở rộng thành **P2-02 Predictive Maintenance Center** với Risk Timeline và phân biệt Prediction vs Confirmed | Tái sử dụng FFT vibration analysis, ngưỡng dung sai | Historical Records, Telemetry |
| **Phân Tích Nguyên Nhân Gốc (Engine B)** | `AIRootCauseAnalysisModule` (5-Whys, Ishikawa) | 80% | Nâng cấp thành **P2-03 RCA Center** với Verification Evidence Checklist và gắn nhãn "CONFIRMED ROOT CAUSE" bởi con người | Tái sử dụng mô hình 6M Ishikawa, 5-Whys chain | Alarm, Checklist, SOP, Lịch sử |
| **Tối Ưu Sản Xuất (Engine C)** | Chưa có module độc lập | 0% | Xây dựng mới **P2-04 Production Optimizer**: Quản lý đơn hàng, phát hiện bottleneck, mô phỏng 5 AI Scenarios | Tái sử dụng trạng thái máy (`RUNNING`, `MAINTENANCE`), KTV roster | Production Orders, Machine Availability |
| **Dự Báo Chất Lượng (Engine D)** | `ImageInspectionResult` (cơ bản) | 20% | Xây dựng mới **P2-05 Quality Forecast Center**: Ma trận rủi ro chất lượng phôi khuôn, phân tích độ nhám/rỗ/cháy góc | Tái sử dụng model dung sai EDM, thông số `V_GAP`, `I_PEAK` | QC History, Telemetry, Material |
| **AI Performance Control Tower** | `PerformanceAnalytics` (OEE 7 ngày) | 60% | Xây dựng **P2-01 Control Tower** tích hợp 5 Khu vực: A (10 KPI), B (Thiết bị), C (Sản xuất), D (Chất lượng), E (Đề xuất) | Tái sử dụng Recharts, OEE calculation | Dữ liệu tích hợp 4 Engine |
| **AI Decision Board & Learning Loop** | `PlantDirectorView` (Duyệt cơ bản) | 50% | Xây dựng **P2-06 Decision Board** & **P2-08 Learning Loop**: Chuỗi 8 bước Decision Card và so sánh Prediction vs Reality | Tái sử dụng Audit Trail, Human-in-the-Loop flow | Quyết định Quản đốc, Kết quả đo |
| **Phân Tích Tác Động (Impact Analysis)** | Ước tính chi phí downtime $125/h | 40% | Nâng cấp **P2-07 Impact Analysis**: Chuỗi Equipment Failure → Available Capacity → Schedule → Order Risk → Financial Loss | Tái sử dụng công thức tài chính phân xưởng | Lệnh sản xuất, Giá trị phôi |
| **Mobile AI Operations (P2-09)** | `FieldTechnicianView`, Phone Simulator | 85% | Đồng bộ cảnh báo sản xuất & đề xuất tối ưu lên Mobile, tối giản thao tác hiện trường | Tái sử dụng Smartphone Shell, 1-tap voice | Web Speech, Notification |

---

## II. KIẾN TRÚC LIÊN KẾT 4 ENGINE (GIAI ĐOẠN 2)

```
             ┌────────────────────────────────────────────────────────┐
             │                 THIẾT BỊ & IOT TELEMETRY               │
             │       9 chỉ số: V_GAP, I_PEAK, P_FLUSH, VIB, TEMP...   │
             └───────────────────────────┬────────────────────────────┘
                                         │
                                         ▼
             ┌────────────────────────────────────────────────────────┐
             │           ENGINE A: PREDICTIVE MAINTENANCE             │
             │   Health Score (0-100) | Risk Timeline (5 trạng thái) │
             │         Nguy cơ dừng máy ngoài kế hoạch                │
             └───────────────────────────┬────────────────────────────┘
                                         │
                    ┌────────────────────┴───────────────────┐
                    ▼                                        ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│     ENGINE C: PRODUCTION OPTIMIZER   │  │      ENGINE D: QUALITY FORECAST      │
│ • Ảnh hưởng năng lực & tiến độ       │  │ • Rủi ro rỗ bề mặt & cháy phôi       │
│ • Phát hiện nút thắt cổ chai         │  │ • Tương quan dung sai & dòng xung    │
│ • 5 Kịch bản điều phối (Scenarios)   │  │ • Khuyến nghị tăng tần suất QC       │
└───────────────────┬──────────────────┘  └──────────────────┬───────────────────┘
                    │                                        │
                    └────────────────────┬───────────────────┘
                                         │
                                         ▼
             ┌────────────────────────────────────────────────────────┐
             │          ENGINE B: ROOT CAUSE ANALYSIS (RCA)           │
             │   5-Whys + Ishikawa 6M + Verification Evidence         │
             │   Phân định: Candidate Causes vs Confirmed Root Cause  │
             └───────────────────────────┬────────────────────────────┘
                                         │
                                         ▼
             ┌────────────────────────────────────────────────────────┐
             │            P2-06: AI DECISION BOARD                    │
             │   Problem → Evidence → Risk → Recommendation → Impact   │
             │           HUMAN IN THE LOOP (Duyệt / Từ chối)          │
             └───────────────────────────┬────────────────────────────┘
                                         │
                                         ▼
             ┌────────────────────────────────────────────────────────┐
             │            THỰC THI & P2-08: AI LEARNING LOOP          │
             │   So sánh Prediction vs Reality | Đánh giá sai số      │
             │   Cập nhật mô hình & tri thức nhà máy                  │
             └────────────────────────────────────────────────────────┘
```

---

## III. DATA QUALITY GATE & 3 TẦNG HUMAN-IN-THE-LOOP

1. **Data Quality Gate:**
   - Kiểm tra: Độ đầy đủ dữ liệu (Completeness), Độ tươi (Freshness), Tính nhất quán nhãn thời gian (Timestamp consistency), Dấu hiệu bất thường cảm biến (Anomaly detection).
   - Quy tắc: Nếu Data Health < 80% → Hệ thống hạ mức tin cậy và gắn cờ cảnh báo *"Dữ liệu không đủ để dự báo tin cậy"*, ngăn chặn ảo giác AI.

2. **3 Tầng Quyền Hạn (Human-in-the-Loop):**
   - **Level 1 (Information):** AI tự động phân tích, cảnh báo ngưỡng và hiển thị đồ thị xu hướng.
   - **Level 2 (Recommendation):** AI gợi ý kiểm tra, đề xuất kịch bản sản xuất và kịch bản bảo trì phòng ngừa.
   - **Level 3 (Critical Action):** Dừng máy, đổi thứ tự đơn hàng, thay đổi thông số cắt và tạo lệnh sửa chữa bắt buộc phải có chữ ký số điện tử của Quản đốc hoặc Leader có thẩm quyền.
