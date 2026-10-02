import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Phone,
  Sparkles,
  User,
  Wrench,
  Zap,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { Device } from '../types';

interface DeviceCardProps {
  device: Device;
  onOpenDiagnosis: (device: Device) => void;
  onOpenRepairReport: (device: Device) => void;
  onTriggerAlarm: (deviceId: string) => void;
  onAcknowledge: (deviceId: string) => void;
  onOpenPhoneViewWithIncident: (device: Device) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onOpenDiagnosis,
  onOpenRepairReport,
  onTriggerAlarm,
  onAcknowledge,
  onOpenPhoneViewWithIncident,
}) => {
  const isAlarm = device.status === 'ALARM_STOPPED';
  const isRunning = device.status === 'RUNNING';
  const isIdle = device.status === 'IDLE';

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-xl ${
        isAlarm
          ? 'border-red-500/80 bg-red-950/20 shadow-red-950/50 ring-2 ring-red-500/40 animate-pulse'
          : isRunning
          ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
          : 'border-slate-800/80 bg-slate-900/40'
      }`}
    >
      {/* Top Header Strip */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 font-mono text-xs font-bold text-amber-400 border border-slate-700">
            {device.code}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                {device.name}
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              {device.model} • {device.location}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isAlarm && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-500/40 animate-bounce">
              <AlertTriangle className="h-3.5 w-3.5" />
              DỪNG MÁY!
            </span>
          )}
          {isRunning && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              Đang Chạy
            </span>
          )}
          {isIdle && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
              Chờ Phôi
            </span>
          )}
        </div>
      </div>

      {/* EMERGENCY BANNER IF STOPPED */}
      {isAlarm && device.activeIncident && (
        <div className="border-b border-red-500/30 bg-red-950/60 p-3.5 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-red-300 font-semibold">
                <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-mono text-white">
                  {device.activeIncident.errorCode}
                </span>
                <span>{device.activeIncident.errorTitle}</span>
              </div>
              <p className="text-slate-300 mt-1">
                ⏱️ Thời điểm dừng: {new Date(device.activeIncident.triggeredAt).toLocaleTimeString('vi-VN')}
              </p>
              {device.activeIncident.acknowledgedBy ? (
                <div className="mt-1 flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>KTV {device.activeIncident.acknowledgedBy} đã tiếp nhận xử lý</span>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-1.5 text-amber-300 font-medium animate-pulse">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Đã bắn Push tới ĐT KTV - Đang chờ tiếp nhận...</span>
                </div>
              )}
            </div>

            <button
              onClick={() => onOpenPhoneViewWithIncident(device)}
              title="Xem thông báo gửi tới điện thoại KTV"
              className="shrink-0 flex items-center gap-1 rounded bg-slate-800/90 border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700"
            >
              <span>Xem ĐT KTV</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* EDM Live Telemetry Dashboard Grid */}
      <div className="p-4 space-y-3.5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {/* Discharge Voltage */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-400" />
                Điện áp xung
              </span>
              <span className="font-mono text-[10px]">V</span>
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-white">
              {device.telemetry.dischargeVoltage.toFixed(1)}
              <span className="text-xs font-normal text-slate-400 ml-1">V</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Chuẩn: {device.nominalRanges.dischargeVoltage[0]}-{device.nominalRanges.dischargeVoltage[1]}V
            </div>
          </div>

          {/* Peak Current */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-cyan-400" />
                Dòng đỉnh xung
              </span>
              <span className="font-mono text-[10px]">A</span>
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-white">
              {device.telemetry.peakCurrent.toFixed(1)}
              <span className="text-xs font-normal text-slate-400 ml-1">A</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Chuẩn: {device.nominalRanges.peakCurrent[0]}-{device.nominalRanges.peakCurrent[1]}A
            </div>
          </div>

          {/* Dielectric Pressure */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3 text-blue-400" />
                Áp suất dung dịch
              </span>
              <span className="font-mono text-[10px]">Bar</span>
            </div>
            <div className={`mt-1 font-mono text-lg font-bold ${device.telemetry.dielectricPressure < 0.8 ? 'text-red-400 font-extrabold' : 'text-white'}`}>
              {device.telemetry.dielectricPressure.toFixed(2)}
              <span className="text-xs font-normal text-slate-400 ml-1">Bar</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Chuẩn: {device.nominalRanges.dielectricPressure[0]}-{device.nominalRanges.dielectricPressure[1]}
            </div>
          </div>

          {/* Temperature or Tension */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3 text-rose-400" />
                Nhiệt độ dung môi
              </span>
              <span className="font-mono text-[10px]">°C</span>
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-white">
              {device.telemetry.dielectricTemp.toFixed(1)}
              <span className="text-xs font-normal text-slate-400 ml-1">°C</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {device.type === 'WIRE_EDM' ? `Căng dây: ${device.telemetry.wireTension}N` : `Rung: ${device.telemetry.vibration}mm/s`}
            </div>
          </div>
        </div>

        {/* Assigned Technician Profile Bar */}
        <div className="flex items-center justify-between rounded-xl bg-slate-950/40 border border-slate-800/80 p-2.5 text-xs">
          <div className="flex items-center gap-2.5">
            {device.assignedTechnician?.avatar ? (
              <img
                src={device.assignedTechnician.avatar}
                alt={device.assignedTechnician.name}
                className="h-8 w-8 rounded-full object-cover border border-amber-500/40"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                <User className="h-4 w-4" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-200">
                  {device.assignedTechnician?.name || 'Chưa phân công'}
                </span>
                <span className="rounded bg-emerald-500/20 px-1 text-[10px] text-emerald-300 font-medium">
                  {device.assignedTechnician?.shift.split(' ')[0] || 'Ca trực'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-amber-400 font-mono">
                  <Phone className="h-3 w-3" />
                  {device.assignedTechnician?.phone}
                </span>
                <span>• {device.assignedTechnician?.role.split('-')[0]}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block">Hiệu suất OEE</span>
            <span className="font-mono text-sm font-bold text-amber-400">
              {device.telemetry.oee}%
            </span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {isAlarm ? (
            <>
              {/* If not acknowledged yet */}
              {!device.activeIncident?.acknowledgedAt && (
                <button
                  onClick={() => onAcknowledge(device.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 px-3 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>KTV Tiếp Nhận Xử Lý</span>
                </button>
              )}

              {/* View AI Diagnosis */}
              <button
                onClick={() => onOpenDiagnosis(device)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-2.5 px-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition active:scale-95"
              >
                <Sparkles className="h-4 w-4 text-amber-300 animate-spin" />
                <span>Xem Đề Xuất AI Sửa Máy</span>
              </button>

              {/* Complete Repair & Teach AI */}
              <button
                onClick={() => onOpenRepairReport(device)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 py-2.5 px-3 text-xs font-semibold text-emerald-300 transition"
                title="Báo cáo hoàn thành sửa máy và nạp tri thức cho AI"
              >
                <Wrench className="h-4 w-4" />
                <span>Nghiệm Thu & Dạy AI</span>
              </button>
            </>
          ) : (
            <>
              {/* Routine Diagnosis or Inspection */}
              <button
                onClick={() => onOpenDiagnosis(device)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 py-2 px-3 text-xs font-medium text-slate-200 transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>Chẩn Đoán Sức Khỏe AI</span>
              </button>

              {/* Quick Trigger Breakdown Simulation on this specific machine */}
              <button
                onClick={() => onTriggerAlarm(device.id)}
                className="flex items-center justify-center gap-1 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/15 py-2 px-3 text-xs font-medium text-red-400 transition"
                title="Giả lập EDM báo dừng máy tức thì trên thiết bị này"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Giả Lập Dừng</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
