import React, { useState, useMemo } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Mic,
  MicOff,
  QrCode,
  Sparkles,
  BookOpen,
  MessageSquare,
  Package,
  Layers,
  Activity,
  CheckSquare,
  Zap,
  PhoneCall,
  Clock,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Flame,
  Gauge,
  Send,
  Eye,
} from 'lucide-react';
import { Device, Technician } from '../../types';
import { soundManager } from '../../utils/audio';
import { ModelMaintenanceChecklist } from '../ModelMaintenanceChecklist';

interface FieldTechnicianViewProps {
  devices: Device[];
  technicians: Technician[];
  viewportMode: 'PC' | 'MOBILE';
  onOpenDiagnosis: (device: Device) => void;
  onOpenRepairReport: (device: Device) => void;
  onOpenQRScanner: () => void;
  onOpenDeviceDetails: (device: Device) => void;
  onOpenInventory?: (partIdOrSku: string) => void;
}

export const FieldTechnicianView: React.FC<FieldTechnicianViewProps> = ({
  devices,
  technicians,
  viewportMode,
  onOpenDiagnosis,
  onOpenRepairReport,
  onOpenQRScanner,
  onOpenDeviceDetails,
  onOpenInventory,
}) => {
  // Current logged in technician persona
  const [activeTechId, setActiveTechId] = useState<string>('tech-03'); // Lê Hoàng Nam
  const currentTech = useMemo(
    () => technicians.find((t) => t.id === activeTechId) || technicians[0],
    [technicians, activeTechId]
  );

  // Machine currently assigned or in focus
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('dev-01');
  const targetDevice = useMemo(
    () => devices.find((d) => d.id === selectedDeviceId) || devices[0],
    [devices, selectedDeviceId]
  );

  // Voice recording state
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceInputText, setVoiceInputText] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [requestPartToast, setRequestPartToast] = useState<string | null>(null);

  const handleAcknowledgeTask = () => {
    soundManager.playSuccessChime();
    setAcknowledged(true);
  };

  const handleQuickRequestPart = (partName: string) => {
    soundManager.playSuccessChime();
    setRequestPartToast(`Đã gửi yêu cầu cấp phát khẩn cấp: "${partName}" tới Leader EQM!`);
    setTimeout(() => setRequestPartToast(null), 3500);
  };

  const toggleMic = () => {
    if (isVoiceRecording) {
      setIsVoiceRecording(false);
      return;
    }

    setIsVoiceRecording(true);
    // Simulate speech-to-text recognition
    setTimeout(() => {
      setVoiceInputText(
        'Đã tháo béc xả H.E.A.T, phát hiện cặn xỉ bám nghẹt lỗ Ø0.8mm. Đang ngâm cồn vệ sinh.'
      );
      setIsVoiceRecording(false);
      soundManager.playSuccessChime();
    }, 2000);
  };

  /* ------------------------------------------------------------- */
  /* RENDER 1: MOBILE VIEW (FIELD TECHNICIAN WORKSHOP COMPANION)  */
  /* ------------------------------------------------------------- */
  if (viewportMode === 'MOBILE') {
    return (
      <div className="mx-auto max-w-md p-3 sm:p-4 space-y-4">
        {/* Mobile Header Banner with Technician Persona */}
        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-950 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={currentTech?.avatar}
                alt={currentTech?.name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-emerald-500/40"
              />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                  Trợ Lý KTV Hiện Trường (Mobile)
                </span>
                <h2 className="text-sm font-bold text-white">{currentTech?.name}</h2>
                <span className="text-[10px] text-slate-400">{currentTech?.role}</span>
              </div>
            </div>

            {/* Quick QR Scanner Button */}
            <button
              type="button"
              onClick={onOpenQRScanner}
              className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 transition active:scale-95"
              title="Quét mã QR máy tại xưởng"
            >
              <QrCode className="h-6 w-6" />
              <span className="text-[8px] font-bold mt-0.5">Quét QR</span>
            </button>
          </div>
        </div>

        {/* Machine Switcher Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {devices.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setSelectedDeviceId(d.id);
                setAcknowledged(false);
              }}
              className={`rounded-xl px-3 py-1.5 font-bold transition shrink-0 ${
                selectedDeviceId === d.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              <span>{d.code}</span>
              {d.status === 'ALARM_STOPPED' && (
                <span className="ml-1 text-red-400">●</span>
              )}
            </button>
          ))}
        </div>

        {/* Big Urgent Machine Breakdown Card */}
        {targetDevice && (
          <div
            className={`rounded-2xl border p-4 shadow-xl space-y-3.5 ${
              targetDevice.status === 'ALARM_STOPPED'
                ? 'border-red-500/80 bg-red-950/25 ring-2 ring-red-500/30'
                : 'border-slate-800 bg-slate-900'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-white">{targetDevice.code}</span>
                  <span className="rounded bg-red-500 text-white font-mono text-[10px] px-2 py-0.5 font-bold">
                    {targetDevice.activeIncident?.errorCode || 'E-102'}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-200 mt-0.5">
                  {targetDevice.name}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400">Model:</span>
                <span className="block text-xs font-bold text-indigo-300 font-mono">
                  {targetDevice.model}
                </span>
              </div>
            </div>

            {/* Live Telemetry Glance (Big Numbers for shopfloor legibility) */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/80 rounded-xl p-2.5 border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Áp Suất Béc Xả</span>
                <span className="text-amber-400 font-bold text-sm">
                  {targetDevice.telemetry?.dielectricPressure || 0.65} Bar
                </span>
                <span className="text-[9px] text-red-400 block">(Chuẩn: 1.4 - 1.8)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Dòng Đỉnh Phóng</span>
                <span className="text-blue-400 font-bold text-sm">
                  {targetDevice.telemetry?.peakCurrent || 38.5} A
                </span>
                <span className="text-[9px] text-slate-400 block">(Tải cao)</span>
              </div>
            </div>

            {/* 1-Tap Acknowledge Button */}
            {!acknowledged ? (
              <button
                type="button"
                onClick={handleAcknowledgeTask}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 py-3 text-sm font-extrabold text-white shadow-xl shadow-orange-950/50 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>1-CHẠM TIẾP NHẬN SỰ CỐ TẠI MÁY</span>
              </button>
            ) : (
              <div className="rounded-xl bg-emerald-950/60 border border-emerald-500/50 p-2.5 text-xs text-emerald-300 flex items-center justify-center gap-2 font-bold font-mono">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>ĐÃ XÁC NHẬN CÓ MẶT TẠI MÁY • BẮT ĐẦU SỬA CHỮA</span>
              </div>
            )}

            {/* Main Operational Action Buttons (Touch Target >= 48px) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onOpenDiagnosis(targetDevice)}
                className="h-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30 transition active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>Chẩn Đoán AI & Chat</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenRepairReport(targetDevice)}
                className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 transition active:scale-95"
              >
                <Wrench className="h-4 w-4" />
                <span>Nghiệm Thu SOP</span>
              </button>
            </div>
          </div>
        )}

        {/* Model Maintenance Checklist (Embedded directly for field inspection) */}
        {targetDevice && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 px-1 block">
              Quy Trình Kiểm Tra Chuẩn Cho {targetDevice.model}
            </span>
            <ModelMaintenanceChecklist device={targetDevice} />
          </div>
        )}

        {/* Hands-Free Voice Input Box (Gloves-friendly) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Mic className="h-4 w-4 text-red-400" />
              <span>Nói Rảnh Tay Ghi Chú Hiện Trường</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Đeo găng tay</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMic}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition shrink-0 shadow-lg ${
                isVoiceRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-slate-800 text-red-400 hover:bg-red-600 hover:text-white'
              }`}
              title="Nhấn và nói để tự động ghi chép"
            >
              {isVoiceRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>

            <textarea
              rows={2}
              value={voiceInputText}
              onChange={(e) => setVoiceInputText(e.target.value)}
              placeholder="Nhấn micro to bên cạnh và nói triệu chứng..."
              className="flex-1 rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Quick Spare Parts Requisition Shortcut */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Package className="h-4 w-4 text-indigo-400" />
              <span>Xin Cấp Phụ Tùng Nhanh (1-Chạm)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickRequestPart('Lõi lọc áp lực 3µm (FLT-EDM-300)')}
              className="rounded-xl bg-slate-950 border border-slate-700 hover:border-indigo-500 p-2.5 text-left transition group active:scale-95"
            >
              <span className="text-xs font-bold text-white block group-hover:text-indigo-300">
                Lõi Lọc 3µm
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Gửi Leader duyệt</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRequestPart('Cuộn dây đồng 0.25mm P-5')}
              className="rounded-xl bg-slate-950 border border-slate-700 hover:border-indigo-500 p-2.5 text-left transition group active:scale-95"
            >
              <span className="text-xs font-bold text-white block group-hover:text-indigo-300">
                Dây Đồng 0.25mm
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Gửi Leader duyệt</span>
            </button>
          </div>

          {requestPartToast && (
            <div className="rounded-xl bg-indigo-950/80 border border-indigo-500/40 p-2 text-[11px] text-indigo-200">
              {requestPartToast}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* RENDER 2: PC DESKTOP VIEW (WORKSTATION FIELD BENCH)          */
  /* ------------------------------------------------------------- */
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Technician Diagnostic Workstation Header */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/20 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50">
              <Wrench className="h-7 w-7" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Trạm Làm Việc & Chẩn Đoán Kỹ Thuật Viên (Technician Workbench)
                </h2>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-300">
                  Shopfloor Precision Mode
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Khu vực thao tác kỹ thuật chuyên sâu: tra cứu sơ đồ nguyên lý mạch điện, đối chiếu cảm biến áp suất,
                thực hiện checklist nghiệm thu chuẩn SOP theo từng model máy và huấn luyện bộ não AI từ kinh nghiệm thực chiến.
              </p>
            </div>
          </div>

          {/* Quick Target Machine Selector & QR Scanner */}
          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-auto">
            <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs">
              <span className="text-slate-400">Máy đang xử lý:</span>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onOpenQRScanner}
              className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-950/40 transition active:scale-95"
            >
              <QrCode className="h-4 w-4" />
              <span>Quét QR Máy</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout: Machine Telemetry & Interactive SOP Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 1 Column - Machine Snapshot & Diagnostics Launcher */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-slate-400">Mã thiết bị</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{targetDevice.code}</span>
                  <span className="text-xs font-normal text-slate-300">({targetDevice.model})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{targetDevice.name}</p>
              </div>

              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                  targetDevice.status === 'ALARM_STOPPED'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {targetDevice.status}
              </span>
            </div>

            {/* Active Incident Warning if any */}
            {targetDevice.activeIncident ? (
              <div className="rounded-xl bg-red-950/30 border border-red-500/40 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-red-300">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    SỰ CỐ ĐANG GẶP PHẢI:
                  </span>
                  <span className="font-mono text-white bg-red-600 px-2 py-0.2 rounded text-[11px]">
                    {targetDevice.activeIncident.errorCode}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium">
                  {targetDevice.activeIncident.errorTitle}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenDiagnosis(targetDevice)}
                    className="rounded-xl bg-purple-600 hover:bg-purple-500 py-2 text-xs font-bold text-white text-center transition flex items-center justify-center gap-1 shadow-md shadow-purple-900/40"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Mở AI Chẩn Đoán</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenRepairReport(targetDevice)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-bold text-white text-center transition flex items-center justify-center gap-1 shadow-md shadow-emerald-900/40"
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Nghiệm Thu Báo Cáo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Máy đang vận hành gia công bình thường, không có lỗi dừng.</span>
              </div>
            )}

            {/* Telemetry Sensor Gauges */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Thông Số Cảm Biến Hiện Thời</span>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Áp Suất Dầu Xả</span>
                  <span className="text-amber-400 font-bold text-sm">
                    {targetDevice.telemetry?.dielectricPressure} Bar
                  </span>
                </div>

                <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Dòng Đỉnh Phóng IP</span>
                  <span className="text-blue-400 font-bold text-sm">
                    {targetDevice.telemetry?.peakCurrent} A
                  </span>
                </div>

                <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Điện Áp Xả</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {targetDevice.telemetry?.dischargeVoltage} V
                  </span>
                </div>

                <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Độ Rung Trục Z</span>
                  <span className="text-purple-400 font-bold text-sm">
                    {targetDevice.telemetry?.vibration} mm/s
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Technical Documents & Schematics */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span>Sơ Đồ Mạch & Hướng Dẫn Kỹ Thuật Máy</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                <span className="font-medium text-slate-200">Sơ đồ mạch cụm bơm cao áp PT-102</span>
                <span className="text-[10px] font-mono text-indigo-400">PDF • 2.4MB</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                <span className="font-medium text-slate-200">Hướng dẫn cân chỉnh góc dẫn hướng kim cương</span>
                <span className="text-[10px] font-mono text-indigo-400">SOP • Rev 4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 2 Columns - Interactive Dynamic Checklist for Specific Model */}
        <div className="lg:col-span-2 space-y-4">
          <ModelMaintenanceChecklist
            device={targetDevice}
            onApplyToReportSummary={(text) => {
              onOpenRepairReport(targetDevice);
            }}
          />
        </div>
      </div>
    </div>
  );
};
