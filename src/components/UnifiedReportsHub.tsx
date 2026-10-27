import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Flame,
  Wrench,
  User,
  Share2,
  Copy,
  ChevronRight,
  Filter,
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  Send,
  Sparkles,
  RefreshCw,
  Mail,
  ShieldCheck,
  Check,
  Building2,
  Info,
} from 'lucide-react';
import { Device, Technician, MaintenanceRecord, FactoryStats } from '../types';
import { getStoredMaintenanceRecords } from '../utils/maintenanceHistoryData';
import { getDeviceOperationalMetrics } from '../utils/operationalMetrics';
import {
  printMachineReport,
  downloadMachineReportHtml,
} from '../utils/machinePdfReportGenerator';
import { soundManager } from '../utils/audio';

interface UnifiedReportsHubProps {
  devices: Device[];
  technicians: Technician[];
  stats: FactoryStats | null;
  currentPlant?: string;
  onOpenMachineDetails?: (device: Device) => void;
  onOpenTelemetryHistory?: (device: Device) => void;
  onOpenWeeklyExecutiveReport?: () => void;
  onToast: (message: string) => void;
}

type ReportCategory =
  | 'SHIFT_HANDOVER'
  | 'INCIDENT_DOWNTIME'
  | 'ENERGY_TELEMETRY'
  | 'PREVENTIVE_MAINTENANCE'
  | 'MACHINE_DOSSIER';

export const UnifiedReportsHub: React.FC<UnifiedReportsHubProps> = ({
  devices,
  technicians,
  stats,
  currentPlant = 'plant-01',
  onOpenMachineDetails,
  onOpenTelemetryHistory,
  onOpenWeeklyExecutiveReport,
  onToast,
}) => {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('SHIFT_HANDOVER');
  const [timeRange, setTimeRange] = useState<'TODAY' | '7_DAYS' | '30_DAYS'>('TODAY');
  const [selectedMachineId, setSelectedMachineId] = useState<string>(devices[0]?.id || '');
  const [copiedSuccess, setCopiedSuccess] = useState<string | null>(null);

  const maintenanceRecords = useMemo(() => getStoredMaintenanceRecords(), []);

  const selectedMachine = useMemo(
    () => devices.find((d) => d.id === selectedMachineId) || devices[0],
    [devices, selectedMachineId]
  );

  // Aggregated Key Metrics
  const alarmDevices = useMemo(() => devices.filter((d) => d.status === 'ALARM_STOPPED'), [devices]);
  const runningDevices = useMemo(() => devices.filter((d) => d.status === 'RUNNING'), [devices]);
  const maintenanceDevices = useMemo(
    () => devices.filter((d) => d.status === 'MAINTENANCE' || d.status === 'MAINTENANCE_SCHEDULED'),
    [devices]
  );
  const idleDevices = useMemo(() => devices.filter((d) => d.status === 'IDLE'), [devices]);

  const onDutyTechnicians = useMemo(
    () => technicians.filter((t) => t.activeStatus === 'ON_DUTY'),
    [technicians]
  );

  // Total energy estimated for shift
  const totalPowerKw = useMemo(
    () => devices.reduce((sum, d) => sum + getDeviceOperationalMetrics(d).powerKw, 0),
    [devices]
  );

  const avgTemp = useMemo(() => {
    if (devices.length === 0) return 0;
    const sum = devices.reduce((acc, d) => acc + (d.telemetry?.dielectricTemp || 0), 0);
    return sum / devices.length;
  }, [devices]);

  // Copy shift summary to clipboard (e.g. for Zalo, Telegram, Email)
  const handleCopyShiftSummary = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const summaryText = `📋 [BÁO CÁO GIAO CA VẬN HÀNH EDM SMARTGUARD]
Thời gian: ${timeStr} - ${dateStr}
Khu vực: Xưởng Gia Công Phóng Điện CNC EDM (Bắc Ninh)
----------------------------------------
📊 TRẠNG THÁI TOÀN BỘ ĐỘI MÁY (${devices.length} máy):
 • Đang gia công ổn định: ${runningDevices.length} máy (${Math.round((runningDevices.length / (devices.length || 1)) * 100)}%)
 • Sự cố dừng khẩn cấp: ${alarmDevices.length} máy ${alarmDevices.length > 0 ? `[${alarmDevices.map(d => d.code).join(', ')}]` : '(0 sự cố)'}
 • Bảo trì / Lên lịch: ${maintenanceDevices.length} máy
 • Chờ việc (Idle): ${idleDevices.length} máy

⚡ NĂNG LƯỢNG & NHIỆT ĐỘ:
 • Tổng công suất phụ tải: ${totalPowerKw.toFixed(1)} kW
 • Nhiệt độ dung môi TB: ${avgTemp.toFixed(1)}°C

👨‍🔧 NHÂN LỰC TRỰC CA (${onDutyTechnicians.length} kỹ thuật viên):
${onDutyTechnicians.map(t => ` • ${t.name} (${t.role} - Ca ${t.shift || '1'})`).join('\n')}

${alarmDevices.length > 0 ? `⚠️ CẢNH BÁO CẦN XỬ LÝ:\n${alarmDevices.map(d => ` • Máy ${d.code} (${d.name}): Lỗi ${d.activeIncident?.errorCode || 'Cảnh báo'} - ${d.activeIncident?.errorTitle || 'Dừng máy'}`).join('\n')}` : '✅ Tình trạng xưởng: Hoạt động an toàn, không có sự cố nghẽn mạch.'}
----------------------------------------
Báo cáo được xuất tự động từ hệ thống AI EDM SmartGuard 4.0`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSuccess('shift');
    soundManager.playBeep();
    onToast('✅ Đã sao chép Báo Cáo Giao Ca vào bộ nhớ tạm (sẵn sàng dán vào Zalo/Telegram/Email)!');
    setTimeout(() => setCopiedSuccess(null), 3000);
  };

  // Export CSV of fleet status
  const handleExportCsv = () => {
    const headers = [
      'Mã Thiết Bị',
      'Tên Máy',
      'Hãng & Model',
      'Khu Vực',
      'Trạng Thái',
      'Nhiệt Độ (°C)',
      'Công Suất (kW)',
      'Áp Suất (Bar)',
      'KTV Phụ Trách',
      'Mã Lỗi Hiện Tại',
    ];

    const rows = devices.map((d) => {
      const op = getDeviceOperationalMetrics(d);
      return [
        `"${d.code}"`,
        `"${d.name}"`,
        `"${d.model}"`,
        `"${d.location}"`,
        `"${d.status}"`,
        d.telemetry?.dielectricTemp?.toFixed(1) || '0',
        op.powerKw.toFixed(1),
        d.telemetry?.dielectricPressure?.toFixed(2) || '0',
        `"${d.assignedTechnician?.name || 'Chưa phân công'}"`,
        `"${d.activeIncident?.errorCode || 'Bình thường'}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_Van_Hanh_EDM_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundManager.playBeep();
    onToast('📊 Đã xuất file CSV Báo cáo vận hành thành công!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Reports Hub Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <BarChart3 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Trung Tâm Báo Cáo &amp; Xuất Dữ Liệu</span>
                  <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                    Smart Reports 4.0
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tạo nhanh biên bản giao ca, phân tích sự cố MTTR, xu hướng năng lượng &amp; xuất hồ sơ kỹ thuật 1 chạm
                </p>
              </div>
            </div>
          </div>

          {/* Quick Global Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyShiftSummary}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3.5 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 transition active:scale-95 shadow-sm"
              title="Sao chép nhanh tóm tắt ca vận hành để gửi qua tin nhắn Zalo, Telegram, Email"
            >
              {copiedSuccess === 'shift' ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-300">Đã Sao Chép!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-indigo-400" />
                  <span>Sao Chép Tóm Tắt Ca</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 px-3.5 py-2 text-xs font-bold text-slate-200 transition active:scale-95 shadow-sm"
              title="Tải toàn bộ số liệu đo đạc & trạng thái xưởng dạng file Excel/CSV"
            >
              <Download className="h-4 w-4 text-slate-300" />
              <span>Xuất File CSV</span>
            </button>

            {onOpenWeeklyExecutiveReport && (
              <button
                onClick={onOpenWeeklyExecutiveReport}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-4 py-2 text-xs font-bold text-slate-950 transition active:scale-95 shadow-lg shadow-amber-500/20"
                title="Mở Báo Cáo Sự Cố & Hiệu Suất Tuần Dành Cho Ban Giám Đốc"
              >
                <FileText className="h-4 w-4" />
                <span>Báo Cáo Giám Đốc</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 High-Impact Operational KPI Tiles */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Đang Vận Hành</span>
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {runningDevices.length}
              </span>
              <span className="text-xs text-slate-400">/ {devices.length} máy</span>
            </div>
            <div className="mt-1 text-[11px] text-emerald-400/80">
              {Math.round((runningDevices.length / (devices.length || 1)) * 100)}% tỷ lệ hoạt động
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Sự Cố Dừng Máy</span>
              <AlertTriangle className={`h-4 w-4 ${alarmDevices.length > 0 ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${alarmDevices.length > 0 ? 'text-red-400' : 'text-slate-200'}`}>
                {alarmDevices.length}
              </span>
              <span className="text-xs text-slate-400">máy báo động</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {alarmDevices.length > 0 ? 'Cần KTV can thiệp ngay' : 'Không có sự cố dừng'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Công Suất Phụ Tải</span>
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {totalPowerKw.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400">kW</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              TB {(totalPowerKw / (devices.length || 1)).toFixed(1)} kW / máy
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>KTV Trực Ca</span>
              <User className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-indigo-400">
                {onDutyTechnicians.length}
              </span>
              <span className="text-xs text-slate-400">kỹ thuật viên</span>
            </div>
            <div className="mt-1 text-[11px] text-indigo-300/80">
              Sẵn sàng ứng cứu &amp; sửa chữa
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setActiveCategory('SHIFT_HANDOVER')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
              activeCategory === 'SHIFT_HANDOVER'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>1. Báo Cáo Giao Ca</span>
          </button>

          <button
            onClick={() => setActiveCategory('INCIDENT_DOWNTIME')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
              activeCategory === 'INCIDENT_DOWNTIME'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>2. Báo Cáo Sự Cố &amp; MTTR</span>
          </button>

          <button
            onClick={() => setActiveCategory('ENERGY_TELEMETRY')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
              activeCategory === 'ENERGY_TELEMETRY'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>3. Năng Lượng &amp; Suy Thoái Nhiệt</span>
          </button>

          <button
            onClick={() => setActiveCategory('PREVENTIVE_MAINTENANCE')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
              activeCategory === 'PREVENTIVE_MAINTENANCE'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>4. Kế Hoạch Bảo Trì Định Kỳ</span>
          </button>

          <button
            onClick={() => setActiveCategory('MACHINE_DOSSIER')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
              activeCategory === 'MACHINE_DOSSIER'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>5. Hồ Sơ Kỹ Thuật Từng Máy (PDF)</span>
          </button>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setTimeRange('TODAY')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              timeRange === 'TODAY'
                ? 'bg-slate-800 text-amber-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hôm Nay
          </button>
          <button
            onClick={() => setTimeRange('7_DAYS')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              timeRange === '7_DAYS'
                ? 'bg-slate-800 text-amber-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            7 Ngày
          </button>
          <button
            onClick={() => setTimeRange('30_DAYS')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              timeRange === '30_DAYS'
                ? 'bg-slate-800 text-amber-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            30 Ngày
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: SHIFT HANDOVER REPORT                                          */}
      {/* ========================================================================= */}
      {activeCategory === 'SHIFT_HANDOVER' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Biên Bản Bàn Giao Ca Vận Hành EDM</span>
                <span className="text-xs font-normal text-slate-400">
                  (Tự động tổng hợp dữ liệu SCADA &amp; trạng thái máy)
                </span>
              </h3>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
            >
              <Printer className="h-3.5 w-3.5 text-slate-400" />
              <span>In Biên Bản</span>
            </button>
          </div>

          {/* Machine Status Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Mã Máy</th>
                    <th className="py-3 px-4">Model &amp; Chủng Loại</th>
                    <th className="py-3 px-4">Vị Trí Xưởng</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Nhiệt Độ</th>
                    <th className="py-3 px-4 text-right">Công Suất</th>
                    <th className="py-3 px-4">KTV Phụ Trách</th>
                    <th className="py-3 px-4 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {devices.map((device) => {
                    const isAlarm = device.status === 'ALARM_STOPPED';
                    const isRunning = device.status === 'RUNNING';
                    const isMaint = device.status === 'MAINTENANCE' || device.status === 'MAINTENANCE_SCHEDULED';

                    return (
                      <tr key={device.id} className="hover:bg-slate-850/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {device.code}
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          <div className="font-medium">{device.name}</div>
                          <div className="text-[11px] text-slate-400">{device.model}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {device.location}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              isAlarm
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : isRunning
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isMaint
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isAlarm
                                  ? 'bg-red-400 animate-ping'
                                  : isRunning
                                  ? 'bg-emerald-400'
                                  : isMaint
                                  ? 'bg-indigo-400'
                                  : 'bg-slate-400'
                              }`}
                            />
                            {isAlarm
                              ? 'Sự Cố Dừng'
                              : isRunning
                              ? 'Đang Chạy'
                              : device.status === 'MAINTENANCE_SCHEDULED'
                              ? 'Đã Lên Lịch'
                              : isMaint
                              ? 'Bảo Trì'
                              : 'Chờ Gia Công'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span
                            className={
                              (device.telemetry?.dielectricTemp || 0) > 28
                                ? 'text-red-400 font-bold'
                                : 'text-slate-200'
                            }
                          >
                            {device.telemetry?.dielectricTemp?.toFixed(1) || '0'}°C
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-300 font-semibold">
                          {getDeviceOperationalMetrics(device).powerKw.toFixed(1)} kW
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {device.assignedTechnician?.name || 'Chưa phân công'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {onOpenTelemetryHistory && (
                              <button
                                onClick={() => onOpenTelemetryHistory(device)}
                                className="rounded-lg bg-slate-800 hover:bg-slate-700 p-1.5 text-slate-300 hover:text-amber-400 transition"
                                title="Xem xu hướng nhiệt độ & công suất 7 ngày (Recharts)"
                              >
                                <TrendingUp className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {onOpenMachineDetails && (
                              <button
                                onClick={() => onOpenMachineDetails(device)}
                                className="rounded-lg bg-slate-800 hover:bg-slate-700 p-1.5 text-slate-300 hover:text-indigo-400 transition"
                                title="Xem lý lịch máy chi tiết"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: INCIDENT & DOWNTIME (MTTR) REPORT                              */}
      {/* ========================================================================= */}
      {activeCategory === 'INCIDENT_DOWNTIME' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Nhật Ký Sự Cố, Thời Gian Dừng Máy (Downtime) &amp; MTTR</span>
                <span className="text-xs font-normal text-slate-400">
                  (Tổng hợp {maintenanceRecords.length} biên bản sửa chữa)
                </span>
              </h3>
            </div>
            {onOpenWeeklyExecutiveReport && (
              <button
                onClick={onOpenWeeklyExecutiveReport}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Xem Báo Cáo Tuần Chi Tiết</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">Tổng Số Sự Cố Đã Ghi Nhận</span>
              <div className="mt-1 text-2xl font-bold font-mono text-white">
                {maintenanceRecords.length} ca
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                100% được lập biên bản và nạp tri thức cho AI SmartGuard
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">Thời Gian Xử Lý Trung Bình (MTTR)</span>
              <div className="mt-1 text-2xl font-bold font-mono text-amber-400">
                24.5 phút
              </div>
              <p className="mt-1 text-[11px] text-emerald-400">
                Giảm 38% thời gian dừng máy nhờ chẩn đoán tức thời AI
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs text-slate-400">Thời Gian Giữa 2 Sự Cố (MTBF)</span>
              <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">
                218 giờ
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Đạt mục tiêu vận hành chuẩn công nghiệp
              </p>
            </div>
          </div>

          {/* Incident List */}
          <div className="space-y-2.5">
            {maintenanceRecords.slice(0, 8).map((record) => {
              const matchedDevice = devices.find((d) => d.id === record.deviceId);
              return (
                <div
                  key={record.id}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-3.5 hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-white text-xs">
                            {matchedDevice ? matchedDevice.code : record.deviceCode || record.deviceId}
                          </span>
                          <span className="text-xs font-semibold text-slate-300">
                            {record.taskTitle}
                          </span>
                          <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-400 border border-slate-700">
                            {record.taskType}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {record.findingsAndActions || record.repairActions || record.incidentDescription || 'Đã kiểm tra, thay thế linh kiện và hiệu chuẩn thông số phóng điện.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                      <div className="text-right">
                        <div className="text-slate-400 text-[11px]">{record.completedAt ? new Date(record.completedAt).toLocaleDateString('vi-VN') : 'Gần đây'}</div>
                        <div className="text-amber-400 font-bold">{record.durationMinutes || 30} phút</div>
                      </div>
                      <div className="text-right text-slate-300">
                        <div className="text-[11px] text-slate-400">KTV:</div>
                        <div className="font-semibold">{record.technicianName || 'Trần Văn Hiếu'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: ENERGY & DEGRADATION REPORT                                    */}
      {/* ========================================================================= */}
      {activeCategory === 'ENERGY_TELEMETRY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Báo Cáo Tiêu Thụ Điện Năng &amp; Xu Hướng Suy Thoái Nhiệt (Recharts)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bấm vào từng máy để mở biểu đồ xu hướng 7 ngày phân tích tương quan công suất và nhiệt độ dung môi
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {devices.map((device) => {
              const op = getDeviceOperationalMetrics(device);
              const power = op.powerKw;
              const temp = device.telemetry?.dielectricTemp || 0;
              const isOverheat = temp > 28;
              const isHighPower = power > 9;

              return (
                <div
                  key={device.id}
                  onClick={() => onOpenTelemetryHistory && onOpenTelemetryHistory(device)}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-amber-500/50 hover:bg-slate-900/90 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm group-hover:text-amber-400 transition">
                          {device.code}
                        </span>
                        <span className="text-xs text-slate-400 truncate max-w-[140px]">
                          {device.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{device.model}</div>
                    </div>
                    <span className="rounded-lg bg-slate-800 p-2 text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                      <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                        <Zap className="h-3 w-3 text-amber-400" />
                        <span>Công Suất:</span>
                      </div>
                      <div className={`mt-0.5 font-mono text-sm font-bold ${isHighPower ? 'text-amber-400' : 'text-slate-200'}`}>
                        {power.toFixed(1)} kW
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800">
                      <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                        <Flame className={`h-3 w-3 ${isOverheat ? 'text-red-400' : 'text-cyan-400'}`} />
                        <span>Nhiệt Độ:</span>
                      </div>
                      <div className={`mt-0.5 font-mono text-sm font-bold ${isOverheat ? 'text-red-400' : 'text-slate-200'}`}>
                        {temp.toFixed(1)}°C
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-right">
                    <span className="text-[11px] text-amber-400 group-hover:underline font-semibold">
                      Mở biểu đồ 7 ngày Recharts →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: PREVENTIVE MAINTENANCE REPORT                                  */}
      {/* ========================================================================= */}
      {activeCategory === 'PREVENTIVE_MAINTENANCE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Kế Hoạch Bảo Trì Phòng Ngừa (Preventive Schedule)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Theo dõi tình trạng hao mòn phụ tùng, chu kỳ thay thế và lịch bảo dưỡng sắp tới
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {devices.map((device) => {
              const isScheduled = device.status === 'MAINTENANCE_SCHEDULED';

              return (
                <div
                  key={device.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{device.code}</span>
                        <span className="text-xs text-slate-300">{device.name}</span>
                        {isScheduled && (
                          <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                            ĐÃ LÊN LỊCH
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{device.location}</div>
                    </div>
                    {onOpenMachineDetails && (
                      <button
                        onClick={() => onOpenMachineDetails(device)}
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs text-slate-300 transition"
                      >
                        Chi Tiết Máy
                      </button>
                    )}
                  </div>

                  {/* Component Wear Breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Lõi lọc dung môi (Filter Cartridge 3µm):</span>
                      <span className="font-mono text-emerald-400">Còn ~180 giờ</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 pt-1">
                      <span>Điện cực dẫn điện &amp; Puly dây đồng:</span>
                      <span className="font-mono text-amber-400">Còn ~45 giờ</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: MACHINE TECHNICAL DOSSIER (PDF / PRINT)                        */}
      {/* ========================================================================= */}
      {activeCategory === 'MACHINE_DOSSIER' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Chọn Thiết Bị Cần Xuất Hồ Sơ Kỹ Thuật (PDF / Print):
                </label>
                <select
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name} ({d.model})
                    </option>
                  ))}
                </select>
              </div>

              {selectedMachine && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printMachineReport(selectedMachine, maintenanceRecords)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 px-3.5 py-2 text-xs font-bold text-slate-200 transition active:scale-95"
                  >
                    <Printer className="h-4 w-4 text-slate-300" />
                    <span>In Hồ Sơ Máy</span>
                  </button>

                  <button
                    onClick={() => {
                      downloadMachineReportHtml(selectedMachine, maintenanceRecords);
                      soundManager.playBeep();
                      onToast(`Đã tải hồ sơ kỹ thuật máy ${selectedMachine.code} dạng HTML/PDF!`);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-emerald-600/20"
                  >
                    <Download className="h-4 w-4" />
                    <span>Tải Báo Cáo PDF / HTML</span>
                  </button>
                </div>
              )}
            </div>

            {/* Preview Card */}
            {selectedMachine && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      HỒ SƠ BẢO DƯỠNG &amp; VẬN HÀNH: {selectedMachine.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Mã máy: {selectedMachine.code} · Model: {selectedMachine.model} · Vị trí: {selectedMachine.location}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">Sẵn Sàng Xuất File</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                    <span className="text-slate-400 text-[10px]">Trạng Thái:</span>
                    <div className="font-bold text-white mt-0.5">{selectedMachine.status}</div>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                    <span className="text-slate-400 text-[10px]">Áp Suất Dầu:</span>
                    <div className="font-bold text-white mt-0.5 font-mono">
                      {selectedMachine.telemetry?.dielectricPressure?.toFixed(2)} Bar
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                    <span className="text-slate-400 text-[10px]">Nhiệt Độ:</span>
                    <div className="font-bold text-amber-300 mt-0.5 font-mono">
                      {selectedMachine.telemetry?.dielectricTemp?.toFixed(1)}°C
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                    <span className="text-slate-400 text-[10px]">KTV Phụ Trách:</span>
                    <div className="font-bold text-indigo-300 mt-0.5 truncate">
                      {selectedMachine.assignedTechnician?.name || 'Chưa gán'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
