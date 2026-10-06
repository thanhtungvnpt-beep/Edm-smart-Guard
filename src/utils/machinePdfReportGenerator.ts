import { Device, MaintenanceRecord } from '../types';
import { calculateMachineServiceInterval } from './serviceIntervalHelper';
import { calculatePredictedMaintenance } from './maintenancePrediction';
import { generatePredictiveHardwareInsights, HardwareWearComponent } from './hardwarePrediction';

export interface MachineIncidentLog {
  id: string;
  errorCode: string;
  errorTitle: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  occurredAt: string;
  resolvedAt: string;
  durationMinutes: number;
  rootCause: string;
  resolution: string;
  technicianName: string;
}

/**
 * Provides comprehensive historical error and incident records for each factory machine
 */
export function getDeviceIncidentHistory(deviceId: string): MachineIncidentLog[] {
  const incidentDatabase: Record<string, MachineIncidentLog[]> = {
    'dev-01': [
      {
        id: 'inc-01-01',
        errorCode: 'E-102',
        errorTitle: 'SPARK GAP SHORT-CIRCUIT & WIRE BREAKAGE',
        severity: 'CRITICAL',
        occurredAt: '2026-09-12T08:30:00Z',
        resolvedAt: '2026-09-12T09:15:00Z',
        durationMinutes: 45,
        rootCause: 'Xỉ cắt bám dính đầu dẫn hướng kim cương trên, làm tụt áp suất nước xả xỉ từ 1.8 MPa xuống 0.7 MPa.',
        resolution: 'Rửa siêu âm đầu dẫn hướng kim cương, thay vòi phun cao áp 4mm mới và căn chỉnh góc phun.',
        technicianName: 'Nguyễn Văn Hùng',
      },
      {
        id: 'inc-01-02',
        errorCode: 'ALARM-205',
        errorTitle: 'DIELECTRIC FLUID LOW FLOW RATE WARNING',
        severity: 'HIGH',
        occurredAt: '2026-08-28T14:10:00Z',
        resolvedAt: '2026-08-28T14:40:00Z',
        durationMinutes: 30,
        rootCause: 'Lõi lọc giấy ion 3-micron bị nghẹt cặn bẩn sau 180 giờ gia công thép hợp kim SKD11.',
        resolution: 'Thay thế cụm lõi lọc giấy mới, xả khí bẫy trong buồng bơm tuần hoàn.',
        technicianName: 'Trần Minh Tuấn',
      },
      {
        id: 'inc-01-03',
        errorCode: 'W-088',
        errorTitle: 'DI RESIN DEIONIZATION CONDUCTIVITY EXCEEDED',
        severity: 'MEDIUM',
        occurredAt: '2026-08-10T10:00:00Z',
        resolvedAt: '2026-08-10T10:35:00Z',
        durationMinutes: 35,
        rootCause: 'Độ dẫn điện dung dịch điện môi vượt ngưỡng an toàn (24 µS/cm > 15 µS/cm).',
        resolution: 'Bổ sung hạt nhựa khử ion (DI Resin) mới vào bình lọc phụ, đưa độ dẫn về 4.5 µS/cm.',
        technicianName: 'Lê Hoàng Nam',
      },
    ],
    'dev-02': [
      {
        id: 'inc-02-01',
        errorCode: 'SPW-303',
        errorTitle: 'GENERATOR OVERTEMPERATURE / IGBT THERMAL TRIP',
        severity: 'CRITICAL',
        occurredAt: '2026-09-18T13:20:00Z',
        resolvedAt: '2026-09-18T14:15:00Z',
        durationMinutes: 55,
        rootCause: 'Quạt làm mát tủ điện nguồn xung 24VDC bị kẹt bụi kim loại mịn, nhiệt độ khối IGBT vượt 78°C.',
        resolution: 'Thay quạt Sunon 24VDC mới, xịt rửa tấm lọc bụi tủ điện bằng khí nén khô áp lực 3 Bar.',
        technicianName: 'Nguyễn Văn Hùng',
      },
      {
        id: 'inc-02-02',
        errorCode: 'W-104',
        errorTitle: 'WIRE TENSION INSTABILITY FLUCTUATION',
        severity: 'HIGH',
        occurredAt: '2026-09-02T16:00:00Z',
        resolvedAt: '2026-09-02T16:30:00Z',
        durationMinutes: 30,
        rootCause: 'Bột đồng tích tụ quanh cụm con lăn phanh hãm lực căng cơ học Brake Roller.',
        resolution: 'Vệ sinh con lăn bọc urethane, căn chỉnh lực căng về dải chuẩn 14N - 16N đối với dây 0.25mm.',
        technicianName: 'Phạm Đức Anh',
      },
    ],
    'dev-03': [
      {
        id: 'inc-03-01',
        errorCode: 'ALARM-204',
        errorTitle: 'DIELECTRIC FLUID LOW PRESSURE CAVITATION',
        severity: 'CRITICAL',
        occurredAt: '2026-09-10T11:00:00Z',
        resolvedAt: '2026-09-10T11:45:00Z',
        durationMinutes: 45,
        rootCause: 'Bọt khí xâm thực (Cavitation) tại cánh bơm cao áp sau 120h chạy vật liệu thép Inconel.',
        resolution: 'Mở van xả air PRV-02 trên thân bơm chính, kiểm tra phớt cơ khí làm kín trục bơm.',
        technicianName: 'Trần Minh Tuấn',
      },
    ],
    'dev-04': [
      {
        id: 'inc-04-01',
        errorCode: 'AWF-402',
        errorTitle: 'AUTOMATIC WIRE THREADING THERMAL CUTTER ERROR',
        severity: 'HIGH',
        occurredAt: '2026-09-05T09:10:00Z',
        resolvedAt: '2026-09-05T09:40:00Z',
        durationMinutes: 30,
        rootCause: 'Dao cắt nhiệt Annealing Wire Cutter bị dính mạt cháy, mối hàn đầu dây bị vẹo không lọt lỗ dẫn hướng.',
        resolution: 'Mài phẳng lưỡi tiếp xúc bằng giũa kim cương mịn, thổi sạch lỗ dẫn hướng áp lực 0.5 Bar.',
        technicianName: 'Lê Hoàng Nam',
      },
    ],
    'dev-05': [
      {
        id: 'inc-05-01',
        errorCode: 'SPN-501',
        errorTitle: 'SPINDLE CHILLER TEMPERATURE OUT OF RANGE',
        severity: 'MEDIUM',
        occurredAt: '2026-08-20T15:00:00Z',
        resolvedAt: '2026-08-20T15:30:00Z',
        durationMinutes: 30,
        rootCause: 'Mức chất làm mát máy làm lạnh trục chính thấp hơn vạch MIN do bốc hơi mùa hè.',
        resolution: 'Châm thêm 2.5 lít dầu làm mát trục chính Mobil Velocite No.3, kiểm tra đường ống kín.',
        technicianName: 'Trần Minh Tuấn',
      },
    ],
    'dev-06': [
      {
        id: 'inc-06-01',
        errorCode: 'ROT-601',
        errorTitle: 'ROTARY HEAD SEAL WATER LEAKAGE',
        severity: 'HIGH',
        occurredAt: '2026-09-15T10:15:00Z',
        resolvedAt: '2026-09-15T11:00:00Z',
        durationMinutes: 45,
        rootCause: 'Phớt xoay cao áp đầu mang điện cực ống đồng bị mòn rò rỉ nước ở áp suất 60 Bar.',
        resolution: 'Thay mới bộ phớt gốm cơ khí Rotary Seal 60 Bar, kiểm tra đồng tâm trục xoay.',
        technicianName: 'Nguyễn Văn Hùng',
      },
    ],
  };

  return incidentDatabase[deviceId] || [
    {
      id: `inc-${deviceId}-default`,
      errorCode: 'SYS-101',
      errorTitle: 'PERIODIC SENSOR DRIFT RECALIBRATION',
      severity: 'MEDIUM',
      occurredAt: '2026-08-15T08:00:00Z',
      resolvedAt: '2026-08-15T08:30:00Z',
      durationMinutes: 30,
      rootCause: 'Cảm biến dao động vi mô phát sinh trôi điểm 0 sau chu kỳ gia công phôi nặng.',
      resolution: 'Hiệu chuẩn lại điểm zero cảm biến lực và bàn trượt.',
      technicianName: 'Kỹ sư Bảo trì',
    },
  ];
}

/**
 * Builds printable HTML document for the Machine Maintenance & Reliability Report
 */
export function generateMachineReportHtml(
  device: Device,
  records: MaintenanceRecord[]
): string {
  const serviceInterval = calculateMachineServiceInterval(device);
  const prediction = calculatePredictedMaintenance(device);
  const hardwareWear = generatePredictiveHardwareInsights(device).components;
  const incidents = getDeviceIncidentHistory(device.id);

  const formattedDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = new Date().toLocaleTimeString('vi-VN');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo Cáo Bảo Dưỡng &amp; Vận Hành Thiết Bị - ${device.code} (${device.name})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.45;
    }
    .report-container {
      max-width: 100%;
      margin: 0 auto;
    }
    .header-banner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 18pt;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 9.5pt;
      color: #64748b;
      margin-top: 3px;
      font-weight: 500;
    }
    .report-meta {
      text-align: right;
      font-size: 9pt;
      color: #475569;
    }
    .report-badge {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      font-size: 8pt;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .section-title {
      font-size: 11.5pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      border-left: 4px solid #f59e0b;
      padding-left: 8px;
      margin: 18px 0 10px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 8px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .info-label {
      font-size: 8pt;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
    }
    .info-value-sm {
      font-size: 9.5pt;
      color: #334155;
    }
    .highlight-amber { color: #d97706; }
    .highlight-emerald { color: #059669; }
    .highlight-red { color: #dc2626; }
    .highlight-blue { color: #0284c7; }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-top: 6px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      text-align: left;
      padding: 7px 9px;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      padding: 7px 9px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .badge {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-urgent { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .badge-preventive { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .badge-corrective { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .badge-calibration { background: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
    .badge-running { background: #dcfce7; color: #15803d; }
    .badge-alarm { background: #fee2e2; color: #b91c1c; }

    .progress-bar-container {
      background: #e2e8f0;
      height: 10px;
      border-radius: 999px;
      overflow: hidden;
      margin: 4px 0;
    }
    .progress-bar-fill {
      height: 100%;
      background: #f59e0b;
    }

    /* Sign-off signatures */
    .signoff-section {
      margin-top: 28px;
      border-top: 1.5px solid #cbd5e1;
      padding-top: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      text-align: center;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    .signoff-box {
      padding: 0 10px;
    }
    .signoff-line {
      margin-top: 50px;
      border-top: 1px dashed #94a3b8;
      font-weight: 700;
      color: #0f172a;
      padding-top: 4px;
    }
    .signoff-role {
      font-size: 8pt;
      color: #64748b;
    }

    /* Non-print toolbar for quick print */
    .no-print-toolbar {
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .print-btn {
      background: #f59e0b;
      color: #0f172a;
      border: none;
      padding: 8px 18px;
      font-size: 10pt;
      font-weight: 800;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .print-btn:hover {
      background: #fbbf24;
    }

    @media print {
      .no-print-toolbar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <!-- Print Bar for user preview -->
  <div class="no-print-toolbar">
    <div style="font-weight: 700; font-size: 11pt;">
      Bản Xem Trước Báo Cáo Bảo Dưỡng Kỹ Thuật (Print Preview)
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="print-btn" onclick="window.print()">
        🖨️ In / Lưu PDF (Print to PDF)
      </button>
      <button style="background: #334155; color: #fff; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 9pt;" onclick="window.close()">
        ✕ Đóng
      </button>
    </div>
  </div>

  <div style="padding: 18px 24px;" class="report-container">
    <!-- Header -->
    <div class="header-banner">
      <div>
        <div class="brand-title">Hệ Thống SCADA EDM SmartGuard</div>
        <div class="brand-subtitle">Báo Cáo Kỹ Thuật Bảo Dưỡng, Nhật Ký Sự Cố &amp; Chu Kỳ Dịch Vụ Định Kỳ</div>
      </div>
      <div class="report-meta">
        <span class="report-badge">Hồ Sơ Kỹ Thuật SCADA 4.0</span>
        <div><strong>Mã Báo Cáo:</strong> RPT-${device.code}-${Date.now().toString().slice(-6)}</div>
        <div><strong>Ngày Xuất:</strong> ${formattedDate} (${formattedTime})</div>
      </div>
    </div>

    <!-- Machine Overview Section -->
    <div class="section-title">
      <span>1. Thông Tin Nhận Diện &amp; Trạng Thái Vận Hành</span>
      <span class="badge ${device.status === 'RUNNING' ? 'badge-running' : 'badge-alarm'}">
        ${device.status === 'RUNNING' ? '● ĐANG HOẠT ĐỘNG BÌNH THƯỜNG' : '▲ ĐANG DỪNG KHẮC PHỤC SỰ CỐ'}
      </span>
    </div>

    <div class="grid-4">
      <div class="info-card">
        <div class="info-label">Mã Định Danh Máy</div>
        <div class="info-value highlight-amber">${device.code}</div>
        <div class="info-value-sm">${device.name}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Hãng &amp; Dòng Máy</div>
        <div class="info-value">${device.model}</div>
        <div class="info-value-sm">${device.brand} • ${device.type}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Vị Trí Phân Xưởng</div>
        <div class="info-value">${device.location}</div>
        <div class="info-value-sm">Khu vực gia công chính xác</div>
      </div>
      <div class="info-card">
        <div class="info-label">Kỹ Thuật Viên Phụ Trách</div>
        <div class="info-value highlight-blue">${device.assignedTechnician?.name || 'Kỹ sư ca trực'}</div>
        <div class="info-value-sm">ĐT: ${device.assignedTechnician?.phone || 'N/A'}</div>
      </div>
    </div>

    <!-- Live Telemetry Snapshot -->
    <div style="margin-top: 10px;" class="grid-4">
      <div class="info-card">
        <div class="info-label">Tổng Giờ Máy Hoạt Động</div>
        <div class="info-value">${serviceInterval.totalUsageHours.toLocaleString()}h</div>
        <div class="info-value-sm">Chu kỳ chuẩn: ${serviceInterval.serviceIntervalCycleHours}h</div>
      </div>
      <div class="info-card">
        <div class="info-label">Hiệu Suất Tổng Thể (OEE)</div>
        <div class="info-value highlight-emerald">${device.telemetry?.oee || 88.5}%</div>
        <div class="info-value-sm">Chuẩn ISO xưởng: &gt;80%</div>
      </div>
      <div class="info-card">
        <div class="info-label">Áp Suất Dung Môi (Dielectric)</div>
        <div class="info-value">${device.telemetry?.dielectricPressure || 1.2} Bar</div>
        <div class="info-value-sm">Ngưỡng: ${device.nominalRanges.dielectricPressure[0]} - ${device.nominalRanges.dielectricPressure[1]} Bar</div>
      </div>
      <div class="info-card">
        <div class="info-label">Độ Rung Trục Chính</div>
        <div class="info-value highlight-amber">${device.telemetry?.vibration || 0.8} mm/s</div>
        <div class="info-value-sm">Tiêu chuẩn: &lt;${device.nominalRanges.vibration[1]} mm/s</div>
      </div>
    </div>

    <!-- Upcoming Service Requirements (Predictive Maintenance) -->
    <div class="section-title">
      <span>2. Yêu Cầu Dịch Vụ Sắp Tới &amp; Dự Đoán Bảo Dưỡng (Predictive Maintenance)</span>
      <span class="badge badge-urgent">
        ${serviceInterval.urgency === 'URGENT' || serviceInterval.urgency === 'OVERDUE' ? 'CẦN BẢO DƯỠNG GẤP' : 'CHU KỲ BÌNH THƯỜNG'}
      </span>
    </div>

    <div class="info-card" style="margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <span class="info-label">Tiến Độ Chu Kỳ Bảo Dưỡng Định Kỳ (500 Giờ Máy)</span>
        <span style="font-weight: 800; font-size: 11pt; color: #d97706;">
          ${serviceInterval.hoursSinceLastService}h / ${serviceInterval.serviceIntervalCycleHours}h (${serviceInterval.progressPercentage}%)
        </span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: ${serviceInterval.progressPercentage}%;"></div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 8.5pt; color: #64748b;">
        <span>Đã vận hành: ${serviceInterval.hoursSinceLastService} giờ</span>
        <strong style="color: ${serviceInterval.hoursRemaining <= 36 ? '#dc2626' : '#059669'};">
          Thời gian còn lại: ${serviceInterval.hoursRemaining} giờ máy (~${serviceInterval.estimatedDaysRemaining} ngày làm việc)
        </strong>
      </div>
    </div>

    <div class="grid-2">
      <div class="info-card">
        <div class="info-label">Nhiệm Vụ Bảo Dưỡng Dự Kiến Ưu Tiên Số 1</div>
        <div style="font-weight: 700; color: #0f172a; margin-top: 3px;">
          ${prediction.primaryMaintenanceTask || serviceInterval.serviceTask}
        </div>
        <div style="font-size: 8.5pt; color: #475569; margin-top: 4px;">
          <strong>Cơ sở tính toán AI:</strong> ${prediction.heuristicRationale}
        </div>
      </div>

      <div class="info-card">
        <div class="info-label">Danh Mục Phụ Tùng Linh Kiện Cần Chuẩn Bị Xuất Kho</div>
        <div style="margin-top: 4px;">
          ${serviceInterval.recommendedParts.map((p) => `<div style="font-size: 8.5pt; color: #334155; margin-bottom: 2px;">• <strong>${p}</strong></div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Hardware Component Wear Table -->
    <div style="margin-top: 10px;">
      <div style="font-size: 8.5pt; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
        Đánh Giá Mức Độ Hao Mòn Linh Kiện Phần Cứng Trọng Yếu:
      </div>
      <table>
        <thead>
          <tr>
            <th>Linh Kiện / Bộ Phận</th>
            <th>Mã Phụ Tùng (SKU)</th>
            <th>Hao Mòn</th>
            <th>Thời Gian Dự Kiến</th>
            <th>Vị Trí Trong Kho</th>
            <th>Hành Động Khuyến Nghị</th>
          </tr>
        </thead>
        <tbody>
          ${hardwareWear.map((item: HardwareWearComponent) => `
            <tr>
              <td><strong>${item.name}</strong></td>
              <td style="font-family: monospace;">${item.partNumber}</td>
              <td>
                <span class="badge ${item.wearPercentage >= 80 ? 'badge-urgent' : item.wearPercentage >= 60 ? 'badge-calibration' : 'badge-preventive'}">
                  ${item.wearPercentage}%
                </span>
              </td>
              <td style="font-weight: 700; color: ${item.daysUntilFailure <= 3 ? '#dc2626' : '#334155'};">
                ${item.daysUntilFailure} ngày
              </td>
              <td>${item.stockLocation}</td>
              <td style="font-size: 8pt; color: #475569;">${item.preventiveAction}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Recent Error & Incident Logs -->
    <div class="section-title">
      <span>3. Nhật Ký Lỗi &amp; Sự Cố Dừng Máy Gần Nhất (Recent Error Logs)</span>
      <span style="font-size: 8.5pt; font-weight: 600; color: #64748b; text-transform: none;">
        Tổng số sự cố lịch sử: ${device.incidentHistoryCount || incidents.length} lần
      </span>
    </div>

    <table>
      <thead>
        <tr>
          <th>Mã Lỗi</th>
          <th>Tên Sự Cố &amp; Mô Tả Cảnh Báo</th>
          <th>Mức Độ</th>
          <th>Thời Điểm Ghi Nhận</th>
          <th>Thời Lượng</th>
          <th>Nguyên Nhân Gốc Rễ &amp; Biện Pháp Khắc Phục</th>
          <th>KTV Xử Lý</th>
        </tr>
      </thead>
      <tbody>
        ${incidents.map((inc) => `
          <tr>
            <td style="font-family: monospace; font-weight: 800; color: #dc2626;">${inc.errorCode}</td>
            <td><strong>${inc.errorTitle}</strong></td>
            <td>
              <span class="badge ${inc.severity === 'CRITICAL' ? 'badge-urgent' : 'badge-calibration'}">
                ${inc.severity}
              </span>
            </td>
            <td style="font-size: 8pt; color: #64748b;">
              ${new Date(inc.occurredAt).toLocaleDateString('vi-VN')} ${new Date(inc.occurredAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </td>
            <td style="font-weight: 700;">${inc.durationMinutes} phút</td>
            <td style="font-size: 8pt;">
              <div><strong>Nguyên nhân:</strong> ${inc.rootCause}</div>
              <div style="color: #059669; margin-top: 2px;"><strong>Khắc phục:</strong> ${inc.resolution}</div>
            </td>
            <td style="font-size: 8pt; font-weight: 600;">${inc.technicianName}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Maintenance History Records -->
    <div class="section-title">
      <span>4. Lịch Sử Thực Hiện Bảo Dưỡng (Maintenance History)</span>
      <span style="font-size: 8.5pt; font-weight: 600; color: #64748b; text-transform: none;">
        Ghi nhận: ${records.length} nhiệm vụ hoàn thành
      </span>
    </div>

    <table>
      <thead>
        <tr>
          <th>Ngày</th>
          <th>Hạng Mục Nhiệm Vụ</th>
          <th>Phân Loại</th>
          <th>KTV Thực Hiện</th>
          <th>Thời Lượng</th>
          <th>Giờ Máy</th>
          <th>Linh Kiện Đã Thay Thế &amp; Thao Tác Kỹ Thuật</th>
          <th>Nghiệm Thu</th>
        </tr>
      </thead>
      <tbody>
        ${records.slice(0, 5).map((r) => `
          <tr>
            <td style="white-space: nowrap; font-size: 8pt; font-family: monospace;">
              ${new Date(r.completedAt).toLocaleDateString('vi-VN')}
            </td>
            <td><strong>${r.taskTitle}</strong></td>
            <td>
              <span class="badge ${r.taskType === 'PREVENTIVE' ? 'badge-preventive' : r.taskType === 'CORRECTIVE' ? 'badge-corrective' : 'badge-calibration'}">
                ${r.taskType}
              </span>
            </td>
            <td style="font-size: 8pt;">
              ${r.technicianName}
              <div style="color: #64748b; font-size: 7.5pt;">${r.technicianRole || ''}</div>
            </td>
            <td style="font-weight: 700;">${r.durationMinutes}m</td>
            <td style="font-family: monospace;">${r.operatingHoursAtMaintenance.toLocaleString()}h</td>
            <td style="font-size: 8pt;">
              ${r.partsReplaced && r.partsReplaced.length > 0 ? `<div style="color: #7c3aed; font-weight: 600;">• Thay: ${r.partsReplaced.join(', ')}</div>` : ''}
              <div style="color: #475569; margin-top: 2px;">${r.findingsAndActions}</div>
            </td>
            <td>
              <span style="color: #059669; font-weight: 700; font-size: 8pt;">✓ Đạt Chuẩn</span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Digital Sign-off Section -->
    <div class="signoff-section">
      <div class="signoff-box">
        <div style="font-weight: 700; text-transform: uppercase;">Kỹ Sư Trưởng Bảo Trì</div>
        <div class="signoff-role">Phòng Kỹ Thuật Cơ Điện</div>
        <div class="signoff-line">Nguyễn Văn Hùng</div>
        <div style="font-size: 7.5pt; color: #94a3b8; margin-top: 2px;">(Đã ký duyệt điện tử)</div>
      </div>
      <div class="signoff-box">
        <div style="font-weight: 700; text-transform: uppercase;">Kỹ Thuật Viên Phụ Trách Máy</div>
        <div class="signoff-role">Tổ Vận Hành &amp; Giám Sát Ca</div>
        <div class="signoff-line">${device.assignedTechnician?.name || 'Lê Hoàng Nam'}</div>
        <div style="font-size: 7.5pt; color: #94a3b8; margin-top: 2px;">(Xác nhận bàn giao)</div>
      </div>
      <div class="signoff-box">
        <div style="font-weight: 700; text-transform: uppercase;">Quản Lý Chất Lượng &amp; SCADA</div>
        <div class="signoff-role">Hệ Thống SmartGuard 4.0</div>
        <div class="signoff-line">HỆ THỐNG XÁC THỰC AI</div>
        <div style="font-size: 7.5pt; color: #059669; margin-top: 2px;">✓ Verified Stamp: SG-QC-${device.code}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers printable PDF generation via hidden iframe (avoids window.open popup block)
 */
export function printMachineReport(device: Device, records: MaintenanceRecord[]): void {
  const htmlContent = generateMachineReportHtml(device, records);

  // Use hidden iframe to trigger browser's native print-to-pdf dialog
  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';
  printFrame.id = 'machine-pdf-print-frame';

  document.body.appendChild(printFrame);

  const doc = printFrame.contentDocument || printFrame.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(printFrame);
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Allow styles and resources to render before calling print
  setTimeout(() => {
    try {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    } catch (e) {
      console.error('Failed to trigger print dialog:', e);
    } finally {
      // Clean up after print dialog finishes
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 60000);
    }
  }, 400);
}

/**
 * Downloads self-contained report as an HTML file that can be opened and printed anywhere
 */
export function downloadMachineReportHtml(
  device: Device,
  records: MaintenanceRecord[]
): void {
  const htmlContent = generateMachineReportHtml(device, records);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bao_Cao_Bao_Tri_${device.code}_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
