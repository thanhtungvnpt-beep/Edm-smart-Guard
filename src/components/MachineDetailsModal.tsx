import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Award,
  BellRing,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Cpu,
  DollarSign,
  FileCheck2,
  FileDown,
  FileText,
  Filter,
  Flame,
  Gauge,
  Layers,
  Phone,
  Plus,
  Printer,
  QrCode,
  Radio,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { Device, MaintenanceRecord } from '../types';
import { calculatePredictedMaintenance } from '../utils/maintenancePrediction';
import {
  getDeviceMaintenanceHistory,
  saveMaintenanceRecord,
} from '../utils/maintenanceHistoryData';
import { generateMachineQRDataUrl } from '../utils/qrCodeHelper';
import { PredictiveInsightPanel } from './PredictiveInsightPanel';
import { HardwareWearComponent } from '../utils/hardwarePrediction';
import { TelemetrySparklineCard } from './TelemetrySparklineCard';
import { MachinePdfReportModal } from './MachinePdfReportModal';
import { ServiceScheduleCalendar } from './ServiceScheduleCalendar';
import { ScheduledServiceTask } from '../utils/serviceScheduleData';
import { MaintenanceFrequencyChart } from './MaintenanceFrequencyChart';
import { MaintenanceReminderModal } from './MaintenanceReminderModal';
import { getDeviceMaintenanceReminders } from '../utils/maintenanceReminderData';
import { getDeviceOperationalMetrics } from '../utils/operationalMetrics';

interface MachineDetailsModalProps {
  device: Device;
  onClose: () => void;
  onOpenDiagnosis?: (device: Device) => void;
  onTriggerAlarm?: (deviceId: string) => void;
}

export const MachineDetailsModal: React.FC<MachineDetailsModalProps> = ({
  device,
  onClose,
  onOpenDiagnosis,
  onTriggerAlarm,
}) => {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'schedule' | 'prediction' | 'telemetry'>('maintenance');
  const [records, setRecords] = useState<MaintenanceRecord[]>(() =>
    getDeviceMaintenanceHistory(device.id)
  );
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showQRTag, setShowQRTag] = useState<boolean>(false);
  const [showPdfReport, setShowPdfReport] = useState<boolean>(false);
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const activeRemindersCount = useMemo(() => {
    return getDeviceMaintenanceReminders(device.id).filter((r) => r.isActive).length;
  }, [device.id, showReminderModal]);

  // Live Telemetry Streaming toggle & real-time history buffer
  const [isLiveStreamEnabled, setIsLiveStreamEnabled] = useState<boolean>(true);

  const [liveTelemetry, setLiveTelemetry] = useState(() => ({
    dischargeVoltage: device.telemetry?.dischargeVoltage || 45,
    peakCurrent: device.telemetry?.peakCurrent || 22,
    dielectricPressure: device.telemetry?.dielectricPressure || 1.2,
    dielectricTemp: device.telemetry?.dielectricTemp || 24.5,
    vibration: device.telemetry?.vibration || 0.8,
    wireTension: device.telemetry?.wireTension || 12.5,
    oee: device.telemetry?.oee || 88.5,
  }));

  const [telemetryHistory, setTelemetryHistory] = useState(() => {
    const v = device.telemetry?.dischargeVoltage || 45;
    const c = device.telemetry?.peakCurrent || 22;
    const p = device.telemetry?.dielectricPressure || 1.2;
    const t = device.telemetry?.dielectricTemp || 24.5;
    const vib = device.telemetry?.vibration || 0.8;

    return {
      dischargeVoltage: [v - 1.2, v - 0.8, v + 0.4, v - 0.2, v + 0.6, v - 0.5, v + 0.3, v - 0.1, v],
      peakCurrent: [c - 0.8, c - 0.4, c + 0.6, c - 0.3, c + 0.2, c - 0.1, c + 0.5, c - 0.2, c],
      dielectricPressure: [p + 0.05, p + 0.03, p - 0.02, p - 0.04, p + 0.02, p - 0.01, p + 0.03, p - 0.02, p],
      dielectricTemp: [t - 0.4, t - 0.2, t + 0.3, t - 0.1, t + 0.2, t + 0.1, t - 0.2, t + 0.1, t],
      vibration: [vib - 0.06, vib - 0.03, vib + 0.04, vib - 0.02, vib + 0.05, vib - 0.01, vib + 0.03, vib],
    };
  });

  // Real-time telemetry streaming update loop with visual highlight fluctuations
  useEffect(() => {
    if (!isLiveStreamEnabled) return;

    const interval = setInterval(() => {
      setLiveTelemetry((prev) => {
        const isAlarm = device.status === 'ALARM_STOPPED';
        // Generate realistic micro-fluctuations
        const vibDelta = isAlarm ? (Math.random() - 0.4) * 0.12 : (Math.random() - 0.5) * 0.04;
        const pressDelta = isAlarm ? -Math.random() * 0.03 : (Math.random() - 0.5) * 0.025;
        const voltDelta = isAlarm ? 0 : (Math.random() - 0.5) * 0.7;
        const currDelta = isAlarm ? 0 : (Math.random() - 0.5) * 0.4;
        const tempDelta = (Math.random() - 0.48) * 0.08;

        const next = {
          dischargeVoltage: Math.max(0, Math.round((prev.dischargeVoltage + voltDelta) * 10) / 10),
          peakCurrent: Math.max(0, Math.round((prev.peakCurrent + currDelta) * 10) / 10),
          dielectricPressure: Math.max(0.1, Math.round((prev.dielectricPressure + pressDelta) * 100) / 100),
          dielectricTemp: Math.max(15, Math.round((prev.dielectricTemp + tempDelta) * 10) / 10),
          vibration: Math.max(0.1, Math.round((prev.vibration + vibDelta) * 100) / 100),
          wireTension: prev.wireTension,
          oee: prev.oee,
        };

        setTelemetryHistory((hist) => ({
          dischargeVoltage: [...hist.dischargeVoltage.slice(-13), next.dischargeVoltage],
          peakCurrent: [...hist.peakCurrent.slice(-13), next.peakCurrent],
          dielectricPressure: [...hist.dielectricPressure.slice(-13), next.dielectricPressure],
          dielectricTemp: [...hist.dielectricTemp.slice(-13), next.dielectricTemp],
          vibration: [...hist.vibration.slice(-13), next.vibration],
        }));

        return next;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isLiveStreamEnabled, device.status]);

  useEffect(() => {
    let active = true;
    generateMachineQRDataUrl(device).then((url) => {
      if (active) setQrDataUrl(url);
    });
    return () => {
      active = false;
    };
  }, [device]);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MaintenanceRecord['taskType']>('PREVENTIVE');
  const [newTech, setNewTech] = useState(device.assignedTechnician?.name || 'Kỹ thuật viên EDM');
  const [newDuration, setNewDuration] = useState('60');
  const [newParts, setNewParts] = useState('');
  const [newFindings, setNewFindings] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newHours, setNewHours] = useState('4250');
  const [formSuccess, setFormSuccess] = useState(false);

  // Heuristic maintenance prediction
  const prediction = useMemo(() => calculatePredictedMaintenance(device), [device]);

  // Filtered maintenance history
  const filteredRecords = useMemo(() => {
    if (filterType === 'ALL') return records;
    return records.filter((r) => r.taskType === filterType);
  }, [records, filterType]);

  // Statistics for this machine's maintenance
  const totalCost = useMemo(() => {
    return records.reduce((acc, r) => acc + (r.costEstimateVND || 0), 0);
  }, [records]);

  const totalMinutes = useMemo(() => {
    return records.reduce((acc, r) => acc + r.durationMinutes, 0);
  }, [records]);

  // Pre-fill maintenance logging task from Predictive Insight suggestion
  const handleScheduleReplacement = (comp: HardwareWearComponent) => {
    setActiveTab('maintenance');
    setShowAddForm(true);
    setNewTitle(`Thay thế phòng ngừa: ${comp.name}`);
    setNewType('PARTS_REPLACEMENT');
    setNewParts(`${comp.name} [SKU: ${comp.partNumber}]`);
    setNewDuration(comp.estimatedLaborMinutes.toString());
    setNewFindings(
      `Linh kiện đạt mức hao mòn ${comp.wearPercentage}%. Thay thế phòng ngừa để tránh ${comp.downtimeRiskHours}h dừng máy. Hành động: ${comp.preventiveAction}`
    );
    setNewNotes(`Kho lưu trữ: ${comp.stockLocation}. Đã xuất kho dự trù.`);
  };

  // Pre-fill maintenance logging form from Service Schedule Calendar task
  const handlePreFillFromSchedule = (task: ScheduledServiceTask) => {
    setActiveTab('maintenance');
    setShowAddForm(true);
    setNewTitle(task.taskTitle);
    setNewType(
      task.serviceType === 'OVERHAUL'
        ? 'OVERHAUL'
        : task.serviceType === 'CALIBRATION'
        ? 'CALIBRATION'
        : task.serviceType === 'PARTS_REPLACEMENT'
        ? 'PARTS_REPLACEMENT'
        : 'PREVENTIVE'
    );
    setNewTech(task.assignedTechnicianName || device.assignedTechnician?.name || 'Kỹ thuật viên ca trực');
    setNewDuration(task.estimatedDurationMinutes.toString());
    setNewHours(task.operatingHoursTarget.toString());
    setNewParts(task.recommendedParts.join(', '));
    setNewFindings(`Kế hoạch thực hiện: ${task.instructions}`);
    setNewNotes(`Theo tài liệu: ${task.sopDocumentTitle || 'SOP tiêu chuẩn'}. Hạn hoàn thành: ${task.dueDate}`);
  };

  // Handle submit new maintenance record
  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const partsList = newParts
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const record: MaintenanceRecord = {
      id: `maint-${Date.now()}`,
      deviceId: device.id,
      taskTitle: newTitle.trim(),
      taskType: newType,
      completedAt: new Date().toISOString(),
      technicianName: newTech.trim() || 'Kỹ thuật viên ca trực',
      technicianRole: 'Kỹ thuật viên Bảo trì',
      durationMinutes: parseInt(newDuration, 10) || 60,
      partsReplaced: partsList,
      findingsAndActions:
        newFindings.trim() ||
        'Đã kiểm tra, vệ sinh cụm phóng điện, căn chỉnh khe hở và nghiệm thu hoạt động ổn định.',
      technicianNotes: newNotes.trim() || 'Đã vận hành thử không tải và có tải đạt yêu cầu kỹ thuật.',
      operatingHoursAtMaintenance: parseInt(newHours, 10) || 4200,
      qualityPassed: true,
      costEstimateVND: 1200000,
      aiVerified: true,
    };

    const updated = saveMaintenanceRecord(record);
    setRecords(updated.filter((r) => r.deviceId === device.id));
    setShowAddForm(false);
    setNewTitle('');
    setNewParts('');
    setNewFindings('');
    setNewNotes('');
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 4000);
  };

  const getTaskTypeBadge = (type: MaintenanceRecord['taskType']) => {
    switch (type) {
      case 'PREVENTIVE':
        return (
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
            BẢO DƯỠNG ĐỊNH KỲ
          </span>
        );
      case 'CORRECTIVE':
        return (
          <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-red-400">
            SỬA CHỮA KHẨN CẤP
          </span>
        );
      case 'PARTS_REPLACEMENT':
        return (
          <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-purple-400">
            THAY THẾ LINH KIỆN
          </span>
        );
      case 'CALIBRATION':
        return (
          <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-400">
            HIỆU CHUẨN ĐỘ CHÍNH XÁC
          </span>
        );
      case 'OVERHAUL':
        return (
          <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-400">
            ĐẠI TU TOÀN DIỆN
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-mono text-slate-300">
            BẢO DƯỠNG
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden my-auto">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 font-mono text-sm font-extrabold text-amber-400">
              {device.code}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {device.name}
                </h3>
                {device.status === 'RUNNING' ? (
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Đang Chạy
                  </span>
                ) : device.status === 'ALARM_STOPPED' ? (
                  <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-bold text-red-400">
                    Sự Cố Dừng Máy
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                    Chờ Lệnh
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Model: <span className="text-slate-200 font-medium">{device.model}</span> • Hãng:{' '}
                <span className="text-slate-200 font-medium">{device.brand}</span> • Khu vực:{' '}
                <span className="text-slate-200 font-medium">{device.location}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Telemetry Stream Toggle Button */}
            <button
              onClick={() => setIsLiveStreamEnabled(!isLiveStreamEnabled)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                isLiveStreamEnabled
                  ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300 shadow-sm shadow-cyan-500/20'
                  : 'border-slate-700 bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
              title="Bật/Tắt luồng cập nhật dữ liệu cảm biến thời gian thực"
            >
              <Radio
                className={`h-3.5 w-3.5 ${
                  isLiveStreamEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'
                }`}
              />
              <span className="hidden sm:inline">Live Stream:</span>
              <span className="font-bold">{isLiveStreamEnabled ? 'BẬT' : 'TẮT'}</span>
            </button>

            {/* Set Maintenance Reminder Button */}
            <button
              onClick={() => setShowReminderModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
              title="Thiết lập nhắc nhở bảo dưỡng linh kiện định kỳ (Lõi lọc, Bơm làm mát, Cụm kim cương...)"
            >
              <BellRing className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Set Maintenance Reminder</span>
              <span className="sm:hidden">Nhắc Nhở</span>
              {activeRemindersCount > 0 && (
                <span className="ml-0.5 rounded-full bg-amber-500/25 border border-amber-500/40 px-1.5 py-0.2 text-[10px] font-mono font-bold text-amber-300">
                  {activeRemindersCount}
                </span>
              )}
            </button>

            {/* Download PDF Report Button */}
            <button
              onClick={() => setShowPdfReport(true)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:text-white transition cursor-pointer shadow-sm"
              title="Tải & In báo cáo tổng hợp lịch sử bảo dưỡng, lỗi gần đây và yêu cầu dịch vụ (PDF)"
            >
              <FileDown className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Tải Báo Cáo PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            {/* QR Asset Tag Button */}
            <button
              onClick={() => setShowQRTag(!showQRTag)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 transition"
              title="Xem tem nhãn mã QR vật lý dán trên máy này"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>{showQRTag ? 'Ẩn Tem QR' : 'Tem QR Máy'}</span>
            </button>

            {onOpenDiagnosis && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDiagnosis(device);
                }}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 text-xs font-semibold text-purple-300 transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Trợ Lý Sửa Chữa AI</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Đóng cửa sổ"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-5 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
                activeTab === 'maintenance'
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="h-4 w-4" />
              <span>Lịch Sử Bảo Dưỡng ({records.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
                activeTab === 'schedule'
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Lịch Bảo Dưỡng (Service Schedule)</span>
            </button>

            <button
              onClick={() => setActiveTab('prediction')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
                activeTab === 'prediction'
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Dự Báo & Linh Kiện AI (Predictive Insight)</span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
                activeTab === 'telemetry'
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Thông Số & Cảm Biến</span>
            </button>
          </div>

          {activeTab === 'maintenance' && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showAddForm ? 'Hủy Biểu Mẫu' : 'Ghi Nhận Bảo Dưỡng Mới'}</span>
            </button>
          )}
        </div>

        {/* NOTIFICATION TOAST WHEN LOGGED */}
        {formSuccess && (
          <div className="bg-emerald-600/90 text-white px-5 py-2.5 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Đã ghi nhận nhiệm vụ bảo dưỡng thành công vào hồ sơ thiết bị và đồng bộ AI Brain!</span>
          </div>
        )}

        {/* QR ASSET TAG STICKER DRAWER */}
        {showQRTag && (
          <div className="border-b border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 p-4 animate-in slide-in-from-top-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="shrink-0 p-2 bg-white rounded-2xl shadow-lg border-2 border-amber-400">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt={`Mã QR ${device.code}`} className="h-24 w-24 object-contain" />
                  ) : (
                    <div className="h-24 w-24 flex items-center justify-center text-xs text-slate-500 font-mono">Tạo QR...</div>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-500 text-slate-950 font-mono font-black px-1.5 py-0.5 text-[10px]">
                      PHYSICAL ASSET TAG
                    </span>
                    <span className="font-mono font-bold text-amber-400 text-sm">{device.code}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{device.name}</h4>
                  <p className="text-slate-300">Model: {device.model} • Hãng: {device.brand}</p>
                  <p className="text-slate-400">Vị trí dán tem: {device.location}</p>
                  <p className="text-[11px] text-emerald-400">✓ Quét mã này trên ứng dụng để mở trực tiếp chẩn đoán & bảo dưỡng</p>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md transition"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>In Tem Dán</span>
                </button>
                <button
                  onClick={() => setShowQRTag(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition"
                >
                  Đóng Tem
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: MAINTENANCE HISTORY */}
          {activeTab === 'maintenance' && (
            <div className="space-y-5">
              {/* Summary Metric Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Tổng số nhiệm vụ</span>
                    <Wrench className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="mt-1 font-mono text-xl font-bold text-white">
                    {records.length} <span className="text-xs font-normal text-slate-400">lần</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">100% đạt chuẩn nghiệm thu</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Tổng thời gian bảo trì</span>
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                  <div className="mt-1 font-mono text-xl font-bold text-cyan-400">
                    {(totalMinutes / 60).toFixed(1)}{' '}
                    <span className="text-xs font-normal text-slate-400">giờ</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">TB: {Math.round(totalMinutes / Math.max(1, records.length))} phút/lần</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Linh kiện đã thay thế</span>
                    <Layers className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                  <div className="mt-1 font-mono text-xl font-bold text-purple-400">
                    {records.reduce((acc, r) => acc + r.partsReplaced.length, 0)}{' '}
                    <span className="text-xs font-normal text-slate-400">phụ tùng</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Lọc, kim cương, bạc đạn</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Lần bảo dưỡng gần nhất</span>
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="mt-1 font-mono text-sm font-bold text-emerald-400 truncate">
                    {records[0] ? new Date(records[0].completedAt).toLocaleDateString('vi-VN') : 'Chưa có'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    KTV: {records[0]?.technicianName || 'N/A'}
                  </div>
                </div>
              </div>

              {/* SUMMARY CHART: FREQUENCY OF PAST MAINTENANCE TASKS OVER TIME (RECHARTS) */}
              <MaintenanceFrequencyChart
                records={records}
                deviceName={device.name}
                deviceCode={device.code}
              />

              {/* ADD NEW MAINTENANCE TASK FORM */}
              {showAddForm && (
                <form
                  onSubmit={handleCreateRecord}
                  className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 p-4 space-y-3.5 shadow-xl animate-in slide-in-from-top-3"
                >
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Plus className="h-4 w-4" />
                      <span>Ghi Nhận Nhiệm Vụ Bảo Dưỡng Hoàn Thành Mới</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">Mã máy: {device.code}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Tiêu đề nhiệm vụ bảo dưỡng *</label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="VD: Thay cụm ống dẫn kim cương & hiệu chỉnh độ vuông góc"
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Loại hình bảo dưỡng</label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      >
                        <option value="PREVENTIVE">Bảo dưỡng định kỳ (Preventive)</option>
                        <option value="CORRECTIVE">Khắc phục sự cố khẩn cấp (Corrective)</option>
                        <option value="PARTS_REPLACEMENT">Thay thế linh kiện tiêu hao (Parts)</option>
                        <option value="CALIBRATION">Hiệu chuẩn độ chính xác & đo kiểm (Calibration)</option>
                        <option value="OVERHAUL">Đại tu toàn diện thiết bị (Overhaul)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Kỹ thuật viên thực hiện</label>
                      <input
                        type="text"
                        value={newTech}
                        onChange={(e) => setNewTech(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-300 mb-1 font-medium">Thời lượng (phút)</label>
                        <input
                          type="number"
                          value={newDuration}
                          onChange={(e) => setNewDuration(e.target.value)}
                          className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1 font-medium">Giờ máy (Hours)</label>
                        <input
                          type="number"
                          value={newHours}
                          onChange={(e) => setNewHours(e.target.value)}
                          className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 mb-1 font-medium">
                        Linh kiện thay thế (cách nhau bởi dấu phẩy)
                      </label>
                      <input
                        type="text"
                        value={newParts}
                        onChange={(e) => setNewParts(e.target.value)}
                        placeholder="VD: Cụm dẫn hướng kim cương 0.25mm, Lõi lọc điện môi 5µm, Tấm tiếp điện"
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 mb-1 font-medium">
                        Nội dung phát hiện & Biện pháp kỹ thuật đã xử lý
                      </label>
                      <textarea
                        rows={2}
                        value={newFindings}
                        onChange={(e) => setNewFindings(e.target.value)}
                        placeholder="Ghi lại hiện trạng linh kiện, nguyên nhân hao mòn và kết quả sau khi căn chỉnh..."
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20"
                    >
                      Lưu Hồ Sơ Bảo Dưỡng
                    </button>
                  </div>
                </form>
              )}

              {/* FILTER BAR FOR MAINTENANCE RECORDS */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  <span className="text-slate-400 flex items-center gap-1 pr-1">
                    <Filter className="h-3 w-3" />
                    Lọc:
                  </span>
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'PREVENTIVE', label: 'Định kỳ' },
                    { id: 'CORRECTIVE', label: 'Khắc phục' },
                    { id: 'PARTS_REPLACEMENT', label: 'Thay linh kiện' },
                    { id: 'CALIBRATION', label: 'Hiệu chuẩn' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterType(f.id)}
                      className={`rounded-lg px-2.5 py-1 font-medium transition ${
                        filterType === f.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  Hiển thị {filteredRecords.length}/{records.length} bản ghi
                </span>
              </div>

              {/* TIMELINE OF COMPLETED MAINTENANCE RECORDS */}
              <div className="space-y-3">
                {filteredRecords.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-400 text-xs">
                    Không có lịch sử bảo dưỡng nào khớp với bộ lọc này.
                  </div>
                ) : (
                  filteredRecords.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 hover:border-slate-700 transition space-y-2.5"
                    >
                      {/* Record Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getTaskTypeBadge(item.taskType)}
                          <h4 className="font-bold text-white text-sm sm:text-base leading-snug">
                            {item.taskTitle}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-amber-400" />
                            {new Date(item.completedAt).toLocaleDateString('vi-VN')}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-cyan-400" />
                            {item.durationMinutes} phút
                          </span>
                          <span>•</span>
                          <span className="text-slate-300 font-bold">
                            Giờ máy: {item.operatingHoursAtMaintenance.toLocaleString()}h
                          </span>
                        </div>
                      </div>

                      {/* Findings and technical actions */}
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                        {item.findingsAndActions}
                      </p>

                      {/* Parts replaced pill tags */}
                      {item.partsReplaced && item.partsReplaced.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                            <Layers className="h-3 w-3 text-purple-400" />
                            Linh kiện đã thay:
                          </span>
                          {item.partsReplaced.map((part, pIdx) => (
                            <span
                              key={pIdx}
                              className="rounded-lg bg-slate-900 border border-slate-700/80 px-2 py-0.5 text-[10px] text-purple-300 font-medium"
                            >
                              ✓ {part}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer sign-off and technician */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-2 text-[11px]">
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="flex items-center gap-1 text-slate-300 font-medium">
                            <User className="h-3.5 w-3.5 text-amber-400" />
                            KTV: {item.technicianName}
                          </span>
                          {item.technicianRole && <span>({item.technicianRole})</span>}
                          {item.technicianNotes && (
                            <span className="italic text-slate-400 truncate max-w-xs">
                              — "{item.technicianNotes}"
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {item.qualityPassed && (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Nghiệm thu đạt chuẩn
                            </span>
                          )}
                          {item.aiVerified && (
                            <span className="flex items-center gap-1 text-amber-400 font-medium">
                              <Sparkles className="h-3 w-3" />
                              AI Brain Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: SERVICE SCHEDULE CALENDAR VIEW */}
          {activeTab === 'schedule' && (
            <ServiceScheduleCalendar
              device={device}
              onPreFillMaintenanceRecord={handlePreFillFromSchedule}
              onOpenNewTaskForm={() => {
                setActiveTab('maintenance');
                setShowAddForm(true);
              }}
            />
          )}

          {/* TAB 2: AI MAINTENANCE PREDICTIONS */}
          {activeTab === 'prediction' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-amber-400" />
                    <h4 className="font-bold text-white text-base">
                      Dự Đoán Thời Điểm Bảo Dưỡng Kế Tiếp Cho Thiết Bị Này
                    </h4>
                  </div>
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 text-xs font-mono font-bold text-amber-400">
                    Heuristic Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                    <span className="text-xs text-slate-400 block">Ngày dự đoán cần bảo dưỡng</span>
                    <div className="mt-1 font-mono text-xl font-extrabold text-amber-400">
                      {prediction.predictedDateStr}
                    </div>
                    <span className="text-[11px] text-slate-400">Theo chu kỳ suy hao thực tế</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                    <span className="text-xs text-slate-400 block">Thời gian còn lại</span>
                    <div className={`mt-1 font-mono text-xl font-extrabold ${prediction.daysRemaining <= 2 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {prediction.daysRemaining === 0 ? 'Khẩn Cấp' : `${prediction.daysRemaining} ngày`}
                    </div>
                    <span className="text-[11px] text-slate-400">Mức độ: {prediction.urgencyLevel}</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                    <span className="text-xs text-slate-400 block">Điểm độ bền linh kiện (Health Score)</span>
                    <div className="mt-1 font-mono text-xl font-extrabold text-white">
                      {prediction.healthScore}%
                    </div>
                    <span className="text-[11px] text-emerald-400">Độ tin cậy vận hành cao</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-amber-400" />
                    <span>Hạng mục bảo dưỡng ưu tiên số 1 khi đến kỳ:</span>
                  </h5>
                  <p className="text-sm font-semibold text-white pl-5">
                    {prediction.primaryMaintenanceTask}
                  </p>
                  <p className="text-xs text-slate-400 pl-5 leading-relaxed">
                    💡 <strong>Cơ sở tính toán:</strong> {prediction.heuristicRationale}
                  </p>
                </div>
              </div>

              {/* Hardware Component Wear & Preventive Replacement Panel */}
              <PredictiveInsightPanel
                device={device}
                onScheduleReplacement={handleScheduleReplacement}
              />
            </div>
          )}

          {/* TAB 3: LIVE TELEMETRY & SPECS WITH REAL-TIME SPARKLINE CHARTS & ALERT THRESHOLDS */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              {/* Live Streaming Control & Alert Threshold Legend Strip */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                      isLiveStreamEnabled
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'border-slate-700 bg-slate-800/80 text-slate-500'
                    }`}
                  >
                    <Radio
                      className={`h-5 w-5 ${
                        isLiveStreamEnabled ? 'animate-pulse text-cyan-400' : 'text-slate-500'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        Luồng Dữ Liệu Thời Gian Thực (Live Telemetry Stream)
                      </h4>
                      {isLiveStreamEnabled ? (
                        <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                          Đang Cập Nhật 1.8s
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                          Tạm Dừng
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Mô phỏng dao động tín hiệu vi mô từ cảm biến IoT theo thời gian thực kèm cảnh báo ngưỡng tới hạn
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center gap-3 shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isLiveStreamEnabled}
                      onChange={(e) => setIsLiveStreamEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    <span className="ml-2.5 text-xs font-bold text-white">
                      {isLiveStreamEnabled ? 'Bật Live' : 'Tắt Live'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Sparkline Cards Grid with Alert Threshold Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Spindle Vibration (Độ rung cơ khí trục) */}
                <TelemetrySparklineCard
                  title="Độ Rung Trục Chính (Spindle Vibration)"
                  metricKey="vibration"
                  currentValue={liveTelemetry.vibration}
                  unit=" mm/s"
                  history={telemetryHistory.vibration}
                  nominalMin={device.nominalRanges.vibration[0]}
                  nominalMax={device.nominalRanges.vibration[1]}
                  thresholdType="UPPER"
                  criticalThreshold={device.nominalRanges.vibration[1]}
                  isLiveStreaming={isLiveStreamEnabled}
                  icon={<Activity className="h-4 w-4 text-purple-400" />}
                  lineColor="#a855f7"
                />

                {/* 2. Dielectric Pressure (Áp suất dung môi) */}
                <TelemetrySparklineCard
                  title="Áp Suất Dung Môi (Dielectric Pressure)"
                  metricKey="pressure"
                  currentValue={liveTelemetry.dielectricPressure}
                  unit=" Bar"
                  history={telemetryHistory.dielectricPressure}
                  nominalMin={device.nominalRanges.dielectricPressure[0]}
                  nominalMax={device.nominalRanges.dielectricPressure[1]}
                  thresholdType="LOWER"
                  criticalThreshold={device.nominalRanges.dielectricPressure[0]}
                  isLiveStreaming={isLiveStreamEnabled}
                  icon={<Gauge className="h-4 w-4 text-blue-400" />}
                  lineColor="#38bdf8"
                />

                {/* 3. Dielectric Temperature (Nhiệt độ dung môi) */}
                <TelemetrySparklineCard
                  title="Nhiệt Độ Dung Môi (Dielectric Temp)"
                  metricKey="temp"
                  currentValue={liveTelemetry.dielectricTemp}
                  unit="°C"
                  history={telemetryHistory.dielectricTemp}
                  nominalMin={device.nominalRanges.dielectricTemp[0]}
                  nominalMax={device.nominalRanges.dielectricTemp[1]}
                  thresholdType="UPPER"
                  criticalThreshold={device.nominalRanges.dielectricTemp[1]}
                  isLiveStreaming={isLiveStreamEnabled}
                  icon={<Flame className="h-4 w-4 text-rose-400" />}
                  lineColor="#fb7185"
                />

                {/* 4. Discharge Voltage (Điện áp phóng điện) */}
                <TelemetrySparklineCard
                  title="Điện Áp Phóng Điện (Discharge Voltage)"
                  metricKey="voltage"
                  currentValue={liveTelemetry.dischargeVoltage}
                  unit="V"
                  history={telemetryHistory.dischargeVoltage}
                  nominalMin={device.nominalRanges.dischargeVoltage[0]}
                  nominalMax={device.nominalRanges.dischargeVoltage[1]}
                  thresholdType="UPPER"
                  criticalThreshold={device.nominalRanges.dischargeVoltage[1]}
                  isLiveStreaming={isLiveStreamEnabled}
                  icon={<Zap className="h-4 w-4 text-amber-400" />}
                  lineColor="#f59e0b"
                />
              </div>

              {/* Operational Energy & Continuous Uptime Diagnostics Panel */}
              {(() => {
                const op = getDeviceOperationalMetrics(device);
                return (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                          Chỉ Số Điện Năng &amp; Thời Gian Chạy Liên Tục (Operational Uptime)
                        </h4>
                      </div>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${op.isUrgentMaintenanceNeeded ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                        {op.isUrgentMaintenanceNeeded ? '⚠️ CẦN BẢO TRÌ CẤP BÁCH' : 'TẢI VẬN HÀNH BÌNH THƯỜNG'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
                        <span className="text-slate-400 block text-[11px]">Công suất tiêu thụ:</span>
                        <div className="mt-1 font-mono text-base font-bold text-amber-300">
                          {op.powerKw.toFixed(1)} kW
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Định mức: {op.nominalPowerKw[0]}-{op.nominalPowerKw[1]} kW
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
                        <span className="text-slate-400 block text-[11px]">Chạy liên tục chu kỳ này:</span>
                        <div className={`mt-1 font-mono text-base font-bold ${op.continuousUptimeHours >= 24 ? 'text-rose-400' : op.continuousUptimeHours >= 18 ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {op.continuousUptimeHours.toFixed(1)} giờ
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {op.isLongRunWarning ? '⚠️ Chạy dài ca liên tục' : 'Thời gian ổn định'}
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
                        <span className="text-slate-400 block text-[11px]">Tổng giờ chạy lũy kế:</span>
                        <div className="mt-1 font-mono text-base font-bold text-white">
                          {op.totalOperatingHours.toLocaleString('vi-VN')} h
                        </div>
                        <span className="text-[10px] text-slate-400">Odometer máy</span>
                      </div>

                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5">
                        <span className="text-slate-400 block text-[11px]">Hệ số công suất cos φ:</span>
                        <div className="mt-1 font-mono text-base font-bold text-emerald-400">
                          {op.powerFactor.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400">Hiệu suất điện năng tối ưu</span>
                      </div>
                    </div>

                    {op.urgencyReasons.length > 0 && (
                      <div className="mt-3 rounded-xl bg-amber-950/30 border border-amber-500/30 p-2.5 text-xs text-amber-200">
                        <span className="font-bold text-amber-300">Phân tích bảo dưỡng cấp bách: </span>
                        <span>{op.urgencyReasons.join(' • ')}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Technical Specifications */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-amber-400" />
                  <span>Hồ Sơ Kỹ Thuật Nhà Máy & Cấu Hình Thiết Bị</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Dòng máy:</span>
                    <span className="font-semibold text-white">{device.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Kỹ thuật viên phụ trách:</span>
                    <span className="font-semibold text-amber-400">
                      {device.assignedTechnician?.name || 'Chưa phân công'} ({device.assignedTechnician?.phone})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tín hiệu EDM gần nhất:</span>
                    <span className="font-mono text-white">
                      {new Date(device.lastEdmSignalTime).toLocaleTimeString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/90 px-5 py-3">
          <div className="text-xs text-slate-400">
            Hồ sơ bảo trì liên kết cơ sở dữ liệu số hóa nhà máy thông minh SCADA 4.0
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPdfReport(true)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 px-3.5 py-2 text-xs font-bold text-indigo-300 hover:text-white transition cursor-pointer active:scale-95"
            >
              <FileDown className="h-3.5 w-3.5 text-indigo-400" />
              <span>Tải Báo Cáo PDF (Bảo Dưỡng &amp; Sự Cố)</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      </div>

      {/* Printable PDF Report Modal */}
      {showPdfReport && (
        <MachinePdfReportModal
          device={device}
          records={records}
          onClose={() => setShowPdfReport(false)}
        />
      )}

      {/* Custom Recurring Maintenance Reminder Modal */}
      {showReminderModal && (
        <MaintenanceReminderModal
          device={device}
          onClose={() => setShowReminderModal(false)}
          onToast={() => {
            setFormSuccess(true);
            setTimeout(() => setFormSuccess(false), 4000);
          }}
        />
      )}
    </div>
  );
};
