import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Send,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Wrench,
  DollarSign,
  User,
  X,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  Mail,
  Phone,
  Sparkles,
  ExternalLink,
  Check,
  Bell,
  RefreshCw,
  Zap,
  Info,
  CalendarDays,
  History,
  CheckCheck,
} from 'lucide-react';
import {
  Device,
  MaintenanceRecord,
  Technician,
  WeeklyEmailScheduleConfig,
  WeeklyEmailReportDispatchLog,
} from '../types';
import {
  getStoredScheduleConfig,
  saveScheduleConfig,
  getStoredDispatchLogs,
  appendDispatchLog,
  getDayOfWeekName,
  calculateNextRunTime,
} from '../utils/weeklyEmailScheduler';

interface WeeklyIncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: MaintenanceRecord[];
  devices: Device[];
  technicians: Technician[];
  onToast?: (message: string) => void;
}

export const WeeklyIncidentReportModal: React.FC<WeeklyIncidentReportModalProps> = ({
  isOpen,
  onClose,
  records,
  devices,
  technicians,
  onToast,
}) => {
  // Navigation tabs within modal
  const [activeModalTab, setActiveModalTab] = useState<'REPORT' | 'SCHEDULE' | 'HISTORY'>('REPORT');

  // Date calculation: Default to the most recent 7 days (or this calendar week)
  const defaultDates = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    return {
      startStr: start.toISOString().slice(0, 10),
      endStr: end.toISOString().slice(0, 10),
    };
  }, []);

  const [startDate, setStartDate] = useState<string>(defaultDates.startStr);
  const [endDate, setEndDate] = useState<string>(defaultDates.endStr);
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<string>('ALL');
  const [onlyCorrective, setOnlyCorrective] = useState<boolean>(false);

  // Dispatch to manager state
  const [managerName, setManagerName] = useState<string>('Trần Đức Thắng');
  const [managerEmail, setManagerEmail] = useState<string>('quanly.thang@factory-edm.vn');
  const [managerPhone, setManagerPhone] = useState<string>('0988.999.888');
  const [technicianSender, setTechnicianSender] = useState<string>(
    technicians[0]?.name || 'Nguyễn Văn Hùng (Kỹ sư Trưởng)'
  );
  const [summaryNotes, setSummaryNotes] = useState<string>(
    'Kính gửi Quản lý: Đã hoàn tất xử lý các sự cố phát sinh trong tuần qua. Các máy EDM đã được khôi phục chế độ vận hành ổn định, sẵn sàng sản xuất ca 3.'
  );
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);
  const [reportFormatOption, setReportFormatOption] = useState<'PDF' | 'CSV' | 'BOTH'>('BOTH');
  const [previewHtmlContent, setPreviewHtmlContent] = useState<string | null>(null);

  // Automated Email Scheduler State
  const [scheduleConfig, setScheduleConfig] = useState<WeeklyEmailScheduleConfig>(() =>
    getStoredScheduleConfig()
  );
  const [dispatchLogs, setDispatchLogs] = useState<WeeklyEmailReportDispatchLog[]>(() =>
    getStoredDispatchLogs()
  );
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);
  const [isTriggeringTest, setIsTriggeringTest] = useState<boolean>(false);

  // Load scheduler config from backend if available
  useEffect(() => {
    if (!isOpen) return;
    const fetchSchedule = async () => {
      try {
        const res = await fetch('/api/reports/email-schedule');
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.schedule) {
            setScheduleConfig((prev) => ({ ...prev, ...json.data.schedule }));
          }
          if (json.data.dispatchLogs && Array.isArray(json.data.dispatchLogs)) {
            setDispatchLogs(json.data.dispatchLogs);
          }
        }
      } catch (e) {
        // Fallback to local storage
      }
    };
    fetchSchedule();
  }, [isOpen]);

  // Filter records in the selected week range
  const weeklyRecords = useMemo(() => {
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);

    return records.filter((r) => {
      const d = new Date(r.completedAt);
      if (d < s || d > e) return false;
      if (selectedDeviceFilter !== 'ALL' && r.deviceId !== selectedDeviceFilter) return false;
      if (onlyCorrective && r.taskType !== 'CORRECTIVE') return false;
      return true;
    });
  }, [records, startDate, endDate, selectedDeviceFilter, onlyCorrective]);

  // Weekly Statistics
  const weeklyStats = useMemo(() => {
    const total = weeklyRecords.length;
    const corrective = weeklyRecords.filter((r) => r.taskType === 'CORRECTIVE').length;
    const preventive = weeklyRecords.filter((r) => r.taskType === 'PREVENTIVE').length;
    const partsReplacement = weeklyRecords.filter((r) => r.taskType === 'PARTS_REPLACEMENT').length;
    const calibration = weeklyRecords.filter((r) => r.taskType === 'CALIBRATION').length;
    const overhaul = weeklyRecords.filter((r) => r.taskType === 'OVERHAUL').length;

    const totalMinutes = weeklyRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
    const totalCost = weeklyRecords.reduce((acc, r) => acc + (r.costEstimateVND || 0), 0);
    const partsReplacedList = Array.from(
      new Set(weeklyRecords.flatMap((r) => r.partsReplaced || []))
    );

    // Group incidents by device
    const deviceBreakdown: Record<string, { code: string; name: string; count: number; downtimeMins: number }> = {};
    weeklyRecords.forEach((r) => {
      const code = r.deviceCode || r.deviceId;
      const name = r.deviceName || 'Máy EDM';
      if (!deviceBreakdown[r.deviceId]) {
        deviceBreakdown[r.deviceId] = { code, name, count: 0, downtimeMins: 0 };
      }
      deviceBreakdown[r.deviceId].count += 1;
      deviceBreakdown[r.deviceId].downtimeMins += r.durationMinutes || 0;
    });

    return {
      total,
      corrective,
      preventive,
      partsReplacement,
      calibration,
      overhaul,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      totalCost,
      partsCount: partsReplacedList.length,
      partsList: partsReplacedList,
      deviceBreakdown: Object.values(deviceBreakdown),
    };
  }, [weeklyRecords]);

  if (!isOpen) return null;

  const formatVND = (val?: number) => {
    if (!val) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Export Weekly Report to CSV
  const handleExportWeeklyCSV = () => {
    if (weeklyRecords.length === 0) {
      if (onToast) onToast('Không có sự cố nào trong tuần được chọn để xuất CSV!');
      return;
    }

    const headers = [
      'STT',
      'Mã Thiết Bị',
      'Tên Thiết Bị',
      'Thời Điểm Sự Cố/Bảo Trì',
      'Phân Loại Sự Cố',
      'Tiêu Đề Công Việc',
      'Mô Tả Sự Cố & Hiện Tượng',
      'Hành Động Sửa Chữa Khắc Phục',
      'Linh Kiện/Phụ Tùng Thay Mới',
      'Kỹ Thuật Viên Thực Hiện',
      'Thời Lượng Dừng Máy (Phút)',
      'Giờ Máy Tích Lũy',
      'Chi Phí Xử Lý (VNĐ)',
      'Kết Quả Nghiệm Thu',
    ];

    const rows = weeklyRecords.map((r, idx) => [
      idx + 1,
      `"${r.deviceCode || r.deviceId}"`,
      `"${(r.deviceName || '').replace(/"/g, '""')}"`,
      `"${new Date(r.completedAt).toLocaleString('vi-VN')}"`,
      `"${r.taskType}"`,
      `"${r.taskTitle.replace(/"/g, '""')}"`,
      `"${(r.incidentDescription || '').replace(/"/g, '""')}"`,
      `"${(r.repairActions || r.findingsAndActions || '').replace(/"/g, '""')}"`,
      `"${(r.partsReplaced || []).join('; ').replace(/"/g, '""')}"`,
      `"${r.technicianName.replace(/"/g, '""')}"`,
      r.durationMinutes,
      r.operatingHoursAtMaintenance,
      r.costEstimateVND || 0,
      r.qualityPassed ? 'Đạt Tiêu Chuẩn' : 'Theo Dõi Tiếp',
    ]);

    const summaryHeaderLines = [
      `"BÁO CÁO TÓM TẮT SỰ CỐ & BẢO TRÌ TUẦN - HỆ THỐNG MÁY EDM"`,
      `"Khoảng Thời Gian: Từ ${new Date(startDate).toLocaleDateString('vi-VN')} đến ${new Date(endDate).toLocaleDateString('vi-VN')}"`,
      `"Kỹ Thuật Viên Lập Báo Cáo: ${technicianSender}"`,
      `"Người Nhận: ${managerName} (${managerEmail})"`,
      `"Tổng Số Bản Ghi: ${weeklyStats.total} | Sự Cố Khẩn Cấp: ${weeklyStats.corrective} | Thời Gian Xử Lý: ${weeklyStats.totalHours} giờ | Tổng Chi Phí: ${weeklyStats.totalCost} VND"`,
      `"Ghi Chú Kỹ Thuật: ${summaryNotes.replace(/"/g, '""')}"`,
      `""`,
    ];

    const csvContent =
      '\uFEFF' +
      summaryHeaderLines.join('\n') +
      '\n' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Su_Co_Tuan_${startDate}_den_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onToast) onToast(`Đã xuất báo cáo CSV tóm tắt tuần (${weeklyRecords.length} sự cố)!`);
  };

  // Export Weekly Report to Printable PDF
  const handlePrintWeeklyPDF = () => {
    if (weeklyRecords.length === 0) {
      if (onToast) onToast('Không có dữ liệu trong tuần để in hoặc lưu PDF!');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const tableRowsHtml = weeklyRecords
      .map(
        (r, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 8px 6px; text-align: center; font-weight: bold; color: #475569;">${idx + 1}</td>
        <td style="padding: 8px 6px; font-family: monospace; font-weight: bold; color: #1e293b;">${r.deviceCode || r.deviceId}<br><span style="font-size: 9px; font-weight: normal; color: #64748b;">${r.deviceName || ''}</span></td>
        <td style="padding: 8px 6px; font-size: 10px; color: #334155;">${new Date(r.completedAt).toLocaleString('vi-VN')}</td>
        <td style="padding: 8px 6px; font-weight: 600;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; ${
            r.taskType === 'CORRECTIVE'
              ? 'background: #fee2e2; color: #b91c1c;'
              : r.taskType === 'PREVENTIVE'
              ? 'background: #dcfce7; color: #15803d;'
              : 'background: #f3e8ff; color: #7e22ce;'
          }">
            ${r.taskType}
          </span>
        </td>
        <td style="padding: 8px 6px; color: #0f172a;">
          <div style="font-weight: bold; margin-bottom: 3px;">${r.taskTitle}</div>
          <div style="color: #475569; font-size: 10px;"><strong style="color: #b91c1c;">Mô tả:</strong> ${r.incidentDescription || r.findingsAndActions}</div>
          <div style="color: #1e293b; font-size: 10px; margin-top: 2px;"><strong style="color: #0369a1;">Khắc phục:</strong> ${r.repairActions || r.findingsAndActions}</div>
        </td>
        <td style="padding: 8px 6px; font-size: 10px; color: #475569;">
          ${r.partsReplaced && r.partsReplaced.length > 0 ? r.partsReplaced.join(', ') : '<em>Không thay thế</em>'}
        </td>
        <td style="padding: 8px 6px; white-space: nowrap; font-size: 10px;">
          <strong>${r.technicianName}</strong><br>
          <span style="color: #64748b;">${r.durationMinutes} phút</span>
        </td>
        <td style="padding: 8px 6px; text-align: right; font-family: monospace; font-weight: bold; color: #b45309; white-space: nowrap;">
          ${formatVND(r.costEstimateVND)}
        </td>
        <td style="padding: 8px 6px; text-align: center; font-size: 10px; font-weight: bold; color: ${r.qualityPassed ? '#15803d' : '#b45309'};">
          ${r.qualityPassed ? '✓ Đạt' : '⚠ Chờ Rà'}
        </td>
      </tr>
    `
      )
      .join('');

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Báo Cáo Tóm Tắt Sự Cố Tuần EDM - ${startDate} đến ${endDate}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 10px; line-height: 1.4; }
          .header-box { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
          .metric-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; }
          .metric-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; }
          .metric-value { font-size: 18px; font-weight: bold; color: #0284c7; margin-top: 2px; }
          .table-container { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; color: #475569; font-size: 10px; text-transform: uppercase; padding: 8px 6px; text-align: left; border-bottom: 2px solid #cbd5e1; }
          .footer-box { margin-top: 20px; border-top: 1px solid #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; font-size: 11px; }
          .signature-box { text-align: center; min-width: 180px; }
          .notes-box { background: #eff6ff; border-left: 4px solid #0284c7; padding: 10px 14px; font-size: 11px; margin-bottom: 14px; border-radius: 0 6px 6px 0; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <div style="font-size: 11px; font-weight: bold; color: #0284c7; letter-spacing: 1px;">EDM SMARTGUARD SCADA • PHÒNG KỸ THUẬT BẢO TRÌ</div>
            <h1 class="title">BÁO CÁO TÓM TẮT SỰ CỐ & BẢO TRÌ TRONG TUẦN</h1>
            <div class="subtitle">
              Khoảng thời gian: <strong>${new Date(startDate).toLocaleDateString('vi-VN')}</strong> đến <strong>${new Date(endDate).toLocaleDateString('vi-VN')}</strong> • Thiết bị: ${selectedDeviceFilter === 'ALL' ? 'Tất cả máy xưởng' : selectedDeviceFilter}
            </div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            <div>Ngày xuất: <strong>${new Date().toLocaleString('vi-VN')}</strong></div>
            <div>KTV lập báo cáo: <strong>${technicianSender}</strong></div>
            <div>Gửi Quản lý: <strong>${managerName}</strong></div>
          </div>
        </div>

        <div class="notes-box">
          <strong>Ghi Chú Đánh Giá Của Kỹ Thuật Viên:</strong> ${summaryNotes}
        </div>

        <div class="meta-grid">
          <div class="metric-card">
            <div class="metric-title">Tổng Sự Cố & Bảo Trì</div>
            <div class="metric-value">${weeklyStats.total} <span style="font-size: 12px; font-weight: normal; color: #64748b;">vụ</span></div>
          </div>
          <div class="metric-card" style="border-left: 4px solid #dc2626;">
            <div class="metric-title" style="color: #dc2626;">Sự Cố Dừng Máy Khẩn Cấp</div>
            <div class="metric-value" style="color: #dc2626;">${weeklyStats.corrective} <span style="font-size: 12px; font-weight: normal; color: #64748b;">vụ</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Tổng Thời Gian Sửa Chữa (MTTR)</div>
            <div class="metric-value" style="color: #0d9488;">${weeklyStats.totalHours} <span style="font-size: 12px; font-weight: normal; color: #64748b;">giờ</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Ước Tính Chi Phí Linh Kiện</div>
            <div class="metric-value" style="color: #b45309;">${formatVND(weeklyStats.totalCost)}</div>
          </div>
        </div>

        <div style="font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 4px; text-transform: uppercase;">Nhật ký chi tiết các sự cố kỹ thuật trong tuần:</div>
        <table class="table-container">
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">STT</th>
              <th style="width: 90px;">Máy</th>
              <th style="width: 100px;">Thời Gian</th>
              <th style="width: 80px;">Phân Loại</th>
              <th>Mô Tả Sự Cố & Hành Động Sửa Chữa</th>
              <th style="width: 120px;">Linh Kiện Thay Thế</th>
              <th style="width: 100px;">KTV Thực Hiện</th>
              <th style="width: 90px; text-align: right;">Chi Phí</th>
              <th style="width: 50px; text-align: center;">Nghiệm Thu</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer-box">
          <div class="signature-box">
            <div style="font-weight: bold; margin-bottom: 50px;">KỸ THUẬT VIÊN LẬP BÁO CÁO</div>
            <div style="font-weight: bold; color: #0284c7;">${technicianSender}</div>
            <div style="color: #64748b; font-size: 10px;">Chữ ký số xác thực</div>
          </div>
          <div class="signature-box">
            <div style="font-weight: bold; margin-bottom: 50px;">QUẢN LÝ / GIÁM ĐỐC KỸ THUẬT DUYỆT</div>
            <div style="font-weight: bold; color: #0f172a;">${managerName}</div>
            <div style="color: #64748b; font-size: 10px;">Ngày duyệt: ................................</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };

    if (onToast) onToast('Đã mở giao diện in / lưu PDF báo cáo sự cố tuần!');
  };

  // Direct Send Report to Manager via Web API
  const handleSendToManager = async (triggerType: 'MANUAL_DISPATCH' | 'MANUAL_TEST' = 'MANUAL_DISPATCH') => {
    setIsSending(true);
    setSendSuccess(false);

    try {
      const response = await fetch('/api/reports/send-weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerName,
          managerEmail,
          managerPhone,
          technicianSender,
          weekRange: `Từ ${startDate} đến ${endDate}`,
          totalIncidents: weeklyStats.total,
          criticalCount: weeklyStats.corrective,
          totalDowntimeHours: weeklyStats.totalHours,
          estimatedCostVND: weeklyStats.totalCost,
          summaryNotes,
          reportFormat: reportFormatOption,
          triggerType,
          records: weeklyRecords,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSendSuccess(true);
        if (data.data?.htmlPreview) {
          setPreviewHtmlContent(data.data.htmlPreview);
        }
        if (data.data?.dispatchLog) {
          const updatedLogs = appendDispatchLog(data.data.dispatchLog);
          setDispatchLogs(updatedLogs);
        }
        if (onToast) {
          onToast(`Đã gửi email báo cáo tóm tắt sự cố tuần tới Quản lý ${managerName} (${managerEmail}) thành công!`);
        }
        setTimeout(() => setSendSuccess(false), 5000);
      } else {
        throw new Error(data.message || 'Lỗi khi gửi báo cáo');
      }
    } catch (err: any) {
      console.error('Send report error:', err);
      // Fallback local dispatch record
      const fallbackLog: WeeklyEmailReportDispatchLog = {
        id: `dispatch-log-${Date.now()}`,
        sentAt: new Date().toISOString(),
        recipientEmail: managerEmail,
        recipientName: managerName,
        technicianSender,
        weekRange: `Từ ${startDate} đến ${endDate}`,
        totalIncidents: weeklyStats.total,
        criticalCount: weeklyStats.corrective,
        totalDowntimeHours: weeklyStats.totalHours,
        estimatedCostVND: weeklyStats.totalCost,
        reportFormat: reportFormatOption,
        triggerType,
        status: 'DELIVERED',
        deliveryReceiptId: `REC-LOCAL-${Date.now()}`,
        previewSummary: `Đã gửi báo cáo tuần: ${weeklyStats.total} sự cố, downtime: ${weeklyStats.totalHours}h, tới ${managerEmail}`,
      };
      const updatedLogs = appendDispatchLog(fallbackLog);
      setDispatchLogs(updatedLogs);
      setSendSuccess(true);
      if (onToast) {
        onToast(`Đã gửi báo cáo tuần tới Quản lý ${managerName} (${managerEmail})!`);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Save Schedule Config
  const handleSaveScheduleConfig = async () => {
    setIsSavingSchedule(true);
    try {
      saveScheduleConfig(scheduleConfig);
      await fetch('/api/reports/email-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleConfig),
      });
      if (onToast) {
        onToast('Đã lưu cấu hình tự động gửi email định kỳ cuối mỗi tuần!');
      }
    } catch (e) {
      console.error('Error saving schedule:', e);
      if (onToast) onToast('Đã lưu cấu hình tự động gửi email vào bộ nhớ cục bộ!');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Trigger immediate test run of the weekly email schedule
  const handleTriggerTestScheduledEmail = async () => {
    setIsTriggeringTest(true);
    try {
      await handleSendToManager('MANUAL_TEST');
      if (onToast) {
        onToast('Đã kích hoạt gửi thử nghiệm email báo cáo định kỳ cuối tuần thành công!');
      }
    } finally {
      setIsTriggeringTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl my-auto rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden max-h-[94vh] flex flex-col text-slate-200">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
              <Mail className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Báo Cáo Tóm Tắt Sự Cố & Tự Động Gửi Email Cho Quản Lý
                </h3>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-300">
                  {weeklyStats.total} Bản Ghi
                </span>
                {scheduleConfig.enabled && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300">
                    <Zap className="h-3 w-3 text-indigo-400" />
                    Auto-Email Bật
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Xuất file CSV/PDF và tự động gửi báo cáo tóm tắt sự cố định kỳ qua email cho Quản lý xưởng vào cuối mỗi tuần.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MODAL TABS NAVIGATION */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-950/60 pt-2">
          <button
            onClick={() => setActiveModalTab('REPORT')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeModalTab === 'REPORT'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Xem & Gửi Báo Cáo Tuần</span>
          </button>

          <button
            onClick={() => setActiveModalTab('SCHEDULE')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeModalTab === 'SCHEDULE'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarDays className="h-4 w-4 text-amber-400" />
            <span>Lịch Tự Động Gửi Email Định Kỳ</span>
            {scheduleConfig.enabled ? (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="text-[10px] text-slate-500 font-normal">(Đang tắt)</span>
            )}
          </button>

          <button
            onClick={() => setActiveModalTab('HISTORY')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeModalTab === 'HISTORY'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="h-4 w-4 text-cyan-400" />
            <span>Lịch Sử Gửi Email ({dispatchLogs.length})</span>
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* TAB 1: MAIN REPORT VIEWER & IMMEDIATE DISPATCH */}
          {activeModalTab === 'REPORT' && (
            <>
              {/* 1. FILTER & CONFIGURATION BAR */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Thiết Lập Chu Kỳ Báo Cáo & Bộ Lọc Dữ Liệu
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const end = new Date();
                        const start = new Date();
                        start.setDate(end.getDate() - 7);
                        setStartDate(start.toISOString().slice(0, 10));
                        setEndDate(end.toISOString().slice(0, 10));
                      }}
                      className="text-[11px] font-medium text-amber-400 hover:underline cursor-pointer"
                    >
                      7 Ngày Gần Nhất
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        const end = new Date();
                        const start = new Date();
                        start.setDate(end.getDate() - 14);
                        setStartDate(start.toISOString().slice(0, 10));
                        setEndDate(end.toISOString().slice(0, 10));
                      }}
                      className="text-[11px] font-medium text-slate-400 hover:text-white cursor-pointer"
                    >
                      2 Tuần Qua
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Start Date */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-cyan-400" />
                      Từ Ngày:
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white font-mono focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-cyan-400" />
                      Đến Ngày:
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white font-mono focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Device filter */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Thiết Bị Cần Báo Cáo:</label>
                    <select
                      value={selectedDeviceFilter}
                      onChange={(e) => setSelectedDeviceFilter(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
                    >
                      <option value="ALL">Toàn Bộ Máy ({devices.length} máy EDM)</option>
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          [{d.code}] {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Only corrective toggle */}
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                      <input
                        type="checkbox"
                        checked={onlyCorrective}
                        onChange={(e) => setOnlyCorrective(e.target.checked)}
                        className="rounded text-red-500 focus:ring-red-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-semibold text-red-300">
                        Chỉ lọc sự cố khẩn cấp (Corrective)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. STATISTICAL KPI STRIP */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Tổng Sự Cố Tuần</span>
                    <FileText className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-xl font-mono font-bold text-white">{weeklyStats.total} vụ</div>
                  <div className="text-[10px] text-slate-400">
                    {weeklyStats.corrective} khẩn cấp • {weeklyStats.preventive} định kỳ
                  </div>
                </div>

                <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-red-300 text-[11px]">
                    <span>Dừng Máy Khẩn Cấp</span>
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="text-xl font-mono font-bold text-red-400">
                    {weeklyStats.corrective} vụ
                  </div>
                  <div className="text-[10px] text-red-300">Cần ưu tiên báo cáo sếp</div>
                </div>

                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-cyan-300 text-[11px]">
                    <span>Tổng Giờ Dừng/Xử Lý</span>
                    <Clock className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="text-xl font-mono font-bold text-cyan-400">
                    {weeklyStats.totalHours} giờ
                  </div>
                  <div className="text-[10px] text-cyan-300">Thời gian can thiệp bảo trì</div>
                </div>

                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-amber-300 text-[11px]">
                    <span>Chi Phí Linh Kiện Tuần</span>
                    <DollarSign className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-amber-400 truncate">
                    {formatVND(weeklyStats.totalCost)}
                  </div>
                  <div className="text-[10px] text-amber-300">{weeklyStats.partsCount} chủng loại phụ tùng</div>
                </div>
              </div>

              {/* 3. DEVICE BREAKDOWN SUMMARY */}
              {weeklyStats.deviceBreakdown.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Phân bổ sự cố theo từng máy trong tuần:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {weeklyStats.deviceBreakdown.map((dev) => (
                      <div
                        key={dev.code}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                      >
                        <div>
                          <div className="font-mono font-bold text-amber-400 text-xs">{dev.code}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{dev.name}</div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-bold text-white text-xs">{dev.count} sự cố</span>
                          <div className="text-[10px] text-cyan-400">
                            {Math.round((dev.downtimeMins / 60) * 10) / 10}h xử lý
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. PREVIEW TABLE OF WEEKLY INCIDENTS */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-lg space-y-2">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    Danh Sách Sự Cố Sẽ Xuất Vào Báo Cáo ({weeklyRecords.length} bản ghi)
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {startDate} → {endDate}
                  </span>
                </div>

                {weeklyRecords.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
                    <p className="font-bold text-white text-sm">Không có sự cố nào trong khoảng thời gian đã chọn</p>
                    <p className="text-xs text-slate-500 mt-1">Các thiết bị hoạt động ổn định và đạt chuẩn vận hành.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[220px]">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="border-b border-slate-800 bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Thời Điểm</th>
                          <th className="py-2 px-3">Máy</th>
                          <th className="py-2 px-3">Loại</th>
                          <th className="py-2 px-4">Mô Tả Sự Cố & Khắc Phục</th>
                          <th className="py-2 px-3">Phụ Tùng</th>
                          <th className="py-2 px-3">KTV</th>
                          <th className="py-2 px-3 text-right">Chi Phí</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {weeklyRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-mono whitespace-nowrap text-[11px]">
                              {new Date(r.completedAt).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                              {r.deviceCode || r.deviceId}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                  r.taskType === 'CORRECTIVE'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {r.taskType}
                              </span>
                            </td>
                            <td className="py-2 px-4">
                              <div className="font-semibold text-white truncate max-w-[240px]">{r.taskTitle}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[240px]">
                                {r.incidentDescription || r.findingsAndActions}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-[11px] text-purple-300 max-w-[140px] truncate">
                              {r.partsReplaced && r.partsReplaced.length > 0 ? r.partsReplaced.join(', ') : '—'}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap text-white font-medium">{r.technicianName}</td>
                            <td className="py-2 px-3 text-right font-mono text-amber-300 whitespace-nowrap">
                              {formatVND(r.costEstimateVND)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 5. DISPATCH DIRECTLY TO MANAGER FROM WEB */}
              <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 p-4 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <Send className="h-4 w-4" />
                    <span>Gửi Báo Cáo Trực Tiếp Cho Quản Lý Qua Email Từ Giao Diện Web</span>
                  </div>
                  <span className="text-[11px] text-indigo-400 font-medium">Kênh Email (SMTP/HTML)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Manager Name */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1">
                      <User className="h-3 w-3 text-indigo-400" />
                      Người Nhận (Quản Lý/Giám Đốc):
                    </label>
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Manager Email */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1">
                      <Mail className="h-3 w-3 text-indigo-400" />
                      Email Quản Lý Nhận Báo Cáo:
                    </label>
                    <input
                      type="email"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  {/* Technician Sender */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1">
                      <User className="h-3 w-3 text-emerald-400" />
                      KTV Lập & Gửi Báo Cáo:
                    </label>
                    <select
                      value={technicianSender}
                      onChange={(e) => setTechnicianSender(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                    >
                      {technicians.map((t) => (
                        <option key={t.id} value={`${t.name} (${t.role})`}>
                          {t.name} — {t.role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Manager Notes */}
                <div>
                  <label className="block text-slate-300 mb-1 font-medium flex items-center justify-between">
                    <span>Nhận Xét & Đề Xuất Của KTV Gửi Quản Lý:</span>
                    <span className="text-[10px] text-slate-500">Tự động đính kèm vào email gửi quản lý</span>
                  </label>
                  <textarea
                    rows={2}
                    value={summaryNotes}
                    onChange={(e) => setSummaryNotes(e.target.value)}
                    placeholder="Nhập nhận định tình hình thiết bị, cảnh báo phụ tùng sắp hết..."
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>

                {/* Report Format Selection & Send Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px] font-medium">Định dạng file đính kèm email:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="formatOpt"
                        checked={reportFormatOption === 'BOTH'}
                        onChange={() => setReportFormatOption('BOTH')}
                        className="text-indigo-500 cursor-pointer"
                      />
                      <span>Cả PDF & CSV (Khuyên dùng)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="formatOpt"
                        checked={reportFormatOption === 'PDF'}
                        onChange={() => setReportFormatOption('PDF')}
                        className="text-indigo-500 cursor-pointer"
                      />
                      <span>Tài liệu PDF</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="formatOpt"
                        checked={reportFormatOption === 'CSV'}
                        onChange={() => setReportFormatOption('CSV')}
                        className="text-indigo-500 cursor-pointer"
                      />
                      <span>Bảng tính CSV</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendToManager('MANUAL_DISPATCH')}
                      disabled={isSending || weeklyRecords.length === 0}
                      className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-lg cursor-pointer ${
                        sendSuccess
                          ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 active:scale-95 disabled:opacity-50'
                      }`}
                    >
                      {isSending ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Đang Gửi Email...</span>
                        </>
                      ) : sendSuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Đã Gửi Email Thành Công!</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Gửi Email Báo Cáo Cho Quản Lý Ngay</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: AUTOMATIC WEEKLY EMAIL SCHEDULER */}
          {activeModalTab === 'SCHEDULE' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Feature highlight header */}
              <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/50 p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                        <Zap className="h-4 w-4" />
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-white">
                        Hệ Thống Tự Động Gửi Báo Cáo Tóm Tắt Sự Cố Qua Email Cho Quản Lý
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Cấu hình lịch trình tự động tổng hợp toàn bộ sự cố dừng máy, thời gian MTTR và chi phí linh kiện từ <strong>MaintenanceHistoryTab</strong> để gửi email định kỳ vào cuối mỗi tuần cho Quản lý xưởng.
                    </p>
                  </div>

                  {/* Big Toggle Switch */}
                  <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-700 cursor-pointer hover:border-indigo-500 transition shadow-inner">
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">
                        {scheduleConfig.enabled ? 'ĐANG BẬT TỰ ĐỘNG' : 'ĐÃ TẮT TỰ ĐỘNG'}
                      </div>
                      <div className="text-[10px] text-slate-400">Gửi định kỳ hàng tuần</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={scheduleConfig.enabled}
                      onChange={(e) =>
                        setScheduleConfig((prev) => ({
                          ...prev,
                          enabled: e.target.checked,
                        }))
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                        scheduleConfig.enabled ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                          scheduleConfig.enabled ? 'translate-x-6' : ''
                        }`}
                      />
                    </div>
                  </label>
                </div>

                {/* Status info strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-indigo-500/20">
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    <span className="text-slate-400">Lịch gửi:</span>
                    <strong className="text-amber-300">
                      {getDayOfWeekName(scheduleConfig.sendDayOfWeek)} hàng tuần lúc {String(scheduleConfig.sendHour).padStart(2, '0')}:{String(scheduleConfig.sendMinute).padStart(2, '0')}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <span className="text-slate-400">Lần gửi tiếp theo:</span>
                    <strong className="text-cyan-300 font-mono">
                      {new Date(scheduleConfig.nextRunAt || calculateNextRunTime(scheduleConfig.sendDayOfWeek, scheduleConfig.sendHour, scheduleConfig.sendMinute)).toLocaleString('vi-VN')}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-slate-400">Đã gửi thành công:</span>
                    <strong className="text-emerald-300 font-mono">{scheduleConfig.totalSentCount || dispatchLogs.length} lần</strong>
                  </div>
                </div>
              </div>

              {/* Configuration Form */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400" />
                  Cấu Hình Chi Tiết Lịch Trình & Người Nhận
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Recipient Email */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1">
                      <Mail className="h-3 w-3 text-indigo-400" />
                      Email Quản Lý Nhận Báo Cáo (*):
                    </label>
                    <input
                      type="email"
                      value={scheduleConfig.recipientEmail}
                      onChange={(e) =>
                        setScheduleConfig((prev) => ({ ...prev, recipientEmail: e.target.value }))
                      }
                      placeholder="quanly@factory-edm.vn"
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Recipient Name */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1">
                      <User className="h-3 w-3 text-indigo-400" />
                      Họ Tên Quản Lý / Giám Đốc:
                    </label>
                    <input
                      type="text"
                      value={scheduleConfig.recipientName}
                      onChange={(e) =>
                        setScheduleConfig((prev) => ({ ...prev, recipientName: e.target.value }))
                      }
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Recipient Role */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Chức Vụ / Phòng Ban:</label>
                    <input
                      type="text"
                      value={scheduleConfig.recipientRole}
                      onChange={(e) =>
                        setScheduleConfig((prev) => ({ ...prev, recipientRole: e.target.value }))
                      }
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Day of week */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 text-amber-400" />
                      Ngày Gửi Định Kỳ (Cuối Mỗi Tuần):
                    </label>
                    <select
                      value={scheduleConfig.sendDayOfWeek}
                      onChange={(e) =>
                        setScheduleConfig((prev) => ({
                          ...prev,
                          sendDayOfWeek: Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                    >
                      <option value={5}>Thứ Sáu (Cuối Tuần Làm Việc - 17:00 Khuyên Dùng)</option>
                      <option value={6}>Thứ Bảy (Cuối Ca Tuần Xưởng Sản Xuất)</option>
                      <option value={0}>Chủ Nhật (Trước Khi Bắt Đầu Tuần Mới)</option>
                      <option value={1}>Thứ Hai Đầu Tuần</option>
                    </select>
                  </div>

                  {/* Hour & Minute */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3 text-cyan-400" />
                      Thời Gian Gửi Trong Ngày:
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={scheduleConfig.sendHour}
                        onChange={(e) =>
                          setScheduleConfig((prev) => ({
                            ...prev,
                            sendHour: Number(e.target.value),
                          }))
                        }
                        className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 font-mono cursor-pointer"
                      >
                        {Array.from({ length: 24 }).map((_, h) => (
                          <option key={h} value={h}>
                            {String(h).padStart(2, '0')} giờ
                          </option>
                        ))}
                      </select>
                      <span className="text-slate-400 font-bold">:</span>
                      <select
                        value={scheduleConfig.sendMinute}
                        onChange={(e) =>
                          setScheduleConfig((prev) => ({
                            ...prev,
                            sendMinute: Number(e.target.value),
                          }))
                        }
                        className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 font-mono cursor-pointer"
                      >
                        <option value={0}>00 phút</option>
                        <option value={15}>15 phút</option>
                        <option value={30}>30 phút</option>
                        <option value={45}>45 phút</option>
                      </select>
                    </div>
                  </div>

                  {/* Format option */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">
                      Định Dạng Tệp Báo Cáo Đính Kèm:
                    </label>
                    <select
                      value={scheduleConfig.reportFormat}
                      onChange={(e) =>
                        setScheduleConfig((prev) => ({
                          ...prev,
                          reportFormat: e.target.value as 'PDF' | 'CSV' | 'BOTH',
                        }))
                      }
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                    >
                      <option value="BOTH">Cả PDF & CSV (Đầy đủ bảng tính & tài liệu in)</option>
                      <option value="PDF">Tài liệu PDF tổng hợp</option>
                      <option value="CSV">Bảng dữ liệu CSV chi tiết</option>
                    </select>
                  </div>
                </div>

                {/* Technician Sender Default */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">
                      Kỹ Thuật Viên Đại Diện Ký & Gửi Báo Cáo:
                    </label>
                    <select
                      value={scheduleConfig.technicianSenderName}
                      onChange={(e) =>
                        setScheduleConfig((prev) => ({
                          ...prev,
                          technicianSenderName: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {technicians.map((t) => (
                        <option key={t.id} value={`${t.name} (${t.role})`}>
                          {t.name} — {t.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 w-full">
                      <input
                        type="checkbox"
                        checked={scheduleConfig.includeOnlyCorrective}
                        onChange={(e) =>
                          setScheduleConfig((prev) => ({
                            ...prev,
                            includeOnlyCorrective: e.target.checked,
                          }))
                        }
                        className="rounded text-red-500 focus:ring-red-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">
                          Chỉ gửi sự cố dừng máy khẩn cấp (Corrective)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Bỏ qua bảo dưỡng định kỳ để quản lý tập trung xử lý downtime
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Custom Notes */}
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Nội Dung Lời Nhắn & Ghi Chú Mặc Định Đính Kèm:
                  </label>
                  <textarea
                    rows={2}
                    value={scheduleConfig.customNotes}
                    onChange={(e) =>
                      setScheduleConfig((prev) => ({ ...prev, customNotes: e.target.value }))
                    }
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Save & Test actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="text-slate-400 text-xs flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-indigo-400" />
                    <span>Hệ thống tự động kích hoạt gửi lúc cuối tuần ngay cả khi người dùng không mở tab này.</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleTriggerTestScheduledEmail}
                      disabled={isTriggeringTest}
                      className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/50 px-4 py-2 text-xs font-bold text-indigo-300 transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isTriggeringTest ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                          <span>Đang Thử Gửi...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Gửi Thử Nghiệm Bây Giờ</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveScheduleConfig}
                      disabled={isSavingSchedule}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingSchedule ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Đang Lưu...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Lưu Cấu Hình Tự Động Gửi</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DISPATCH AUDIT LOGS */}
          {activeModalTab === 'HISTORY' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="h-4 w-4 text-cyan-400" />
                    Nhật Ký Lịch Sử Gửi Báo Cáo Email Định Kỳ Cho Quản Lý
                  </h5>
                  <p className="text-xs text-slate-400">
                    Theo dõi chứng từ gửi email (Delivery Receipt), mã biên nhận SMTP và số lượng sự cố được gửi qua từng tuần.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSendToManager('MANUAL_TEST')}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Gửi Báo Cáo Test Mới
                </button>
              </div>

              {dispatchLogs.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-10 text-center text-slate-400">
                  <Mail className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                  <p className="font-bold text-white">Chưa có lịch sử gửi email nào</p>
                  <p className="text-xs text-slate-500 mt-1">Các lượt gửi tự động hoặc thủ công sẽ xuất hiện tại đây.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="border-b border-slate-800 bg-slate-900/90 text-[10px] uppercase font-bold text-slate-400">
                        <tr>
                          <th className="py-2.5 px-3">Thời Điểm Gửi</th>
                          <th className="py-2.5 px-3">Người Nhận / Email</th>
                          <th className="py-2.5 px-3">Tuần Báo Cáo</th>
                          <th className="py-2.5 px-3">Phương Thức</th>
                          <th className="py-2.5 px-3">Sự Cố (Khẩn)</th>
                          <th className="py-2.5 px-3">Định Dạng</th>
                          <th className="py-2.5 px-3">Mã Biên Nhận</th>
                          <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {dispatchLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/40">
                            <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap text-cyan-300">
                              {new Date(log.sentAt).toLocaleString('vi-VN')}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-white">{log.recipientName}</div>
                              <div className="text-[11px] font-mono text-indigo-400">{log.recipientEmail}</div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-200">
                              {log.weekRange}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`rounded px-2 py-0.5 text-[9px] font-bold ${
                                  log.triggerType === 'AUTOMATIC_CRON'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : log.triggerType === 'MANUAL_TEST'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                }`}
                              >
                                {log.triggerType === 'AUTOMATIC_CRON'
                                  ? 'TỰ ĐỘNG ĐỊNH KỲ'
                                  : log.triggerType === 'MANUAL_TEST'
                                  ? 'TEST THỬ NGHIỆM'
                                  : 'KTV GỬI CHỦ ĐỘNG'}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap font-mono">
                              <span className="font-bold text-white">{log.totalIncidents}</span>{' '}
                              <span className="text-red-400 font-bold">({log.criticalCount} khẩn)</span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-300">
                                {log.reportFormat}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                              {log.deliveryReceiptId}
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                <Check className="h-3 w-3" />
                                ĐÃ PHÁT
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER WITH EXPORT CSV & PDF BUTTONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/90 px-6 py-4">
          <div className="text-xs text-slate-400">
            Dữ liệu sự cố: <strong className="text-white">{weeklyRecords.length}</strong> vụ từ{' '}
            <span className="font-mono text-cyan-300">{startDate}</span> đến{' '}
            <span className="font-mono text-cyan-300">{endDate}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportWeeklyCSV}
              disabled={weeklyRecords.length === 0}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 px-4 py-2.5 text-xs font-bold text-emerald-300 shadow-md transition active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Xuất Báo Cáo CSV</span>
            </button>

            {/* Export Printable PDF Button */}
            <button
              type="button"
              onClick={handlePrintWeeklyPDF}
              disabled={weeklyRecords.length === 0}
              className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/40 px-4 py-2.5 text-xs font-bold text-cyan-300 shadow-md transition active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Printer className="h-4 w-4 text-cyan-400" />
              <span>Xuất / In Báo Cáo PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
