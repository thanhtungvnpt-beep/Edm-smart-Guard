import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Gauge,
  History,
  Phone,
  Sparkles,
  User,
  Wrench,
  Zap,
  Activity,
  ArrowUpRight,
  Flame,
} from 'lucide-react';
import { Device } from '../types';
import { calculatePredictedMaintenance } from '../utils/maintenancePrediction';
import { getDeviceOperationalMetrics } from '../utils/operationalMetrics';
import { MachineHealthArcGauge } from './MachineHealthArcGauge';

interface DeviceCardProps {
  device: Device;
  onOpenDiagnosis: (device: Device) => void;
  onOpenRepairReport: (device: Device) => void;
  onTriggerAlarm: (deviceId: string) => void;
  onAcknowledge: (deviceId: string) => void;
  onOpenPhoneViewWithIncident: (device: Device) => void;
  onOpenMachineDetails?: (device: Device) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onOpenDiagnosis,
  onOpenRepairReport,
  onTriggerAlarm,
  onAcknowledge,
  onOpenPhoneViewWithIncident,
  onOpenMachineDetails,
}) => {
  const isAlarm = device.status === 'ALARM_STOPPED';
  const isRunning = device.status === 'RUNNING';
  const isIdle = device.status === 'IDLE';

  // Heuristic calculation of Predicted Next Maintenance Date based on 30-day performance
  const prediction = useMemo(() => calculatePredictedMaintenance(device), [device]);
  const opMetrics = useMemo(() => getDeviceOperationalMetrics(device), [device]);

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
        <div
          onClick={() => onOpenMachineDetails && onOpenMachineDetails(device)}
          title="Bấm để xem chi tiết máy & lịch sử các lần bảo dưỡng hoàn thành"
          className="flex items-center gap-2.5 cursor-pointer group/title"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 font-mono text-xs font-bold text-amber-400 border border-slate-700 group-hover/title:border-amber-500 group-hover/title:bg-amber-500/10 transition">
            {device.code}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight group-hover/title:text-amber-400 transition">
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
                <Flame className={`h-3 w-3 ${opMetrics.tempStatus === 'OVERHEATING' ? 'text-red-400 animate-pulse' : opMetrics.tempStatus === 'ELEVATED' ? 'text-amber-400' : 'text-rose-400'}`} />
                Nhiệt độ dung môi
              </span>
              <span className="font-mono text-[10px]">°C</span>
            </div>
            <div className={`mt-1 font-mono text-lg font-bold ${opMetrics.tempStatus === 'OVERHEATING' ? 'text-red-400' : 'text-white'}`}>
              {device.telemetry.dielectricTemp.toFixed(1)}
              <span className="text-xs font-normal text-slate-400 ml-1">°C</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {opMetrics.tempStatus === 'OVERHEATING' ? (
                <span className="text-red-400 font-semibold">⚠️ Vượt ngưỡng!</span>
              ) : (
                `Chuẩn: ${device.nominalRanges.dielectricTemp[0]}-${device.nominalRanges.dielectricTemp[1]}°C`
              )}
            </div>
          </div>
        </div>

        {/* Operational Diagnostics Strip: Real-time Power & Continuous Uptime */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-slate-950/50 border border-slate-800/90 px-2.5 py-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Zap className={`h-3.5 w-3.5 shrink-0 ${opMetrics.powerStatus === 'OVERCONSUMPTION' ? 'text-red-400 animate-pulse' : opMetrics.powerKw >= 8 ? 'text-amber-400' : 'text-yellow-400'}`} />
              <span className="text-slate-400 text-[11px] truncate">Công suất điện:</span>
            </div>
            <div className="text-right shrink-0">
              <span className={`font-mono text-xs font-bold ${opMetrics.powerStatus === 'OVERCONSUMPTION' ? 'text-red-400' : 'text-amber-300'}`}>
                {opMetrics.powerKw.toFixed(1)} kW
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-950/50 border border-slate-800/90 px-2.5 py-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock className={`h-3.5 w-3.5 shrink-0 ${opMetrics.isLongRunWarning ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'}`} />
              <span className="text-slate-400 text-[11px] truncate">Chạy liên tục:</span>
            </div>
            <div className="text-right shrink-0">
              <span className={`font-mono text-xs font-bold ${opMetrics.continuousUptimeHours >= 24 ? 'text-rose-400' : opMetrics.continuousUptimeHours >= 18 ? 'text-cyan-300' : 'text-slate-200'}`}>
                {opMetrics.continuousUptimeHours.toFixed(1)}h
              </span>
            </div>
          </div>
        </div>

        {/* URGENT OPERATIONAL MAINTENANCE WARNING BANNER (IF APPLICABLE) */}
        {opMetrics.isUrgentMaintenanceNeeded && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-2 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-red-300 text-[11px]">Cảnh báo bảo trì cấp bách:</span>
                <span className="font-mono text-[10px] text-red-400 font-bold">Điểm rủi ro: {opMetrics.urgencyScore}%</span>
              </div>
              <p className="text-slate-300 text-[11px] truncate mt-0.5" title={opMetrics.urgencyReasons.join(' • ')}>
                {opMetrics.urgencyReasons[0] || 'Thiết bị cần kiểm tra bảo dưỡng sớm'}
              </p>
            </div>
          </div>
        )}

        {/* MACHINE RELIABILITY HEALTH SCORE ARC GAUGE PANEL */}
        <div
          onClick={() => onOpenMachineDetails && onOpenMachineDetails(device)}
          title="Bấm để xem phân tích chi tiết độ tin cậy và lịch sử vận hành của máy"
          className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-2.5 hover:border-slate-700 hover:bg-slate-950/90 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Activity className="h-3 w-3 text-cyan-400" />
              Chỉ Số Sức Khỏe &amp; Độ Tin Cậy Máy (Health Score)
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Chu kỳ 30 ngày
            </span>
          </div>

          <MachineHealthArcGauge
            score={opMetrics.reliabilityHealthScore}
            incidentCount={device.incidentHistoryCount || 0}
            continuousUptimeHours={opMetrics.continuousUptimeHours}
            size={74}
            showLabel={true}
          />
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

        {/* PREDICTED NEXT MAINTENANCE DATE (Heuristic based on 30-day performance) */}
        <div
          onClick={() => onOpenMachineDetails && onOpenMachineDetails(device)}
          title="Bấm để xem lịch sử bảo dưỡng và dự báo chi tiết của thiết bị này"
          className={`rounded-xl border p-2.5 text-xs transition cursor-pointer hover:border-amber-500/60 ${
            prediction.urgencyLevel === 'IMMEDIATE'
              ? 'border-red-500/70 bg-red-950/40 text-red-200 ring-1 ring-red-500/50'
              : prediction.urgencyLevel === 'URGENT'
              ? 'border-amber-500/60 bg-amber-950/30 text-amber-200'
              : prediction.urgencyLevel === 'UPCOMING'
              ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-200'
              : 'border-slate-800 bg-slate-950/50 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-semibold min-w-0">
              <CalendarClock
                className={`h-4 w-4 shrink-0 ${
                  prediction.urgencyLevel === 'IMMEDIATE'
                    ? 'text-red-400 animate-pulse'
                    : prediction.urgencyLevel === 'URGENT'
                    ? 'text-amber-400'
                    : prediction.urgencyLevel === 'UPCOMING'
                    ? 'text-cyan-400'
                    : 'text-emerald-400'
                }`}
              />
              <span className="text-slate-300 text-[11px] truncate">Dự đoán bảo dưỡng:</span>
              <span className="font-mono font-bold text-amber-400">
                {prediction.predictedDateStr}
              </span>
            </div>

            {/* Days remaining urgency badge */}
            <span
              className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                prediction.urgencyLevel === 'IMMEDIATE'
                  ? 'bg-red-500 text-white animate-pulse'
                  : prediction.urgencyLevel === 'URGENT'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : prediction.urgencyLevel === 'UPCOMING'
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                  : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              }`}
            >
              {prediction.daysRemaining === 0 ? 'Khẩn Cấp' : `Còn ${prediction.daysRemaining} ngày`}
            </span>
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-1.5">
            <span className="truncate pr-2 text-slate-300 text-[10px]" title={prediction.primaryMaintenanceTask}>
              🛠️ {prediction.primaryMaintenanceTask}
            </span>
            <span className="font-mono text-[10px] text-slate-400 shrink-0">
              Độ bền: <strong className="text-white font-bold">{prediction.healthScore}%</strong>
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
                <span>Nghiệm Thu</span>
              </button>

              {/* Maintenance History */}
              {onOpenMachineDetails && (
                <button
                  onClick={() => onOpenMachineDetails(device)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 py-2.5 px-3 text-xs font-semibold text-amber-300 transition"
                  title="Xem lịch sử các đợt bảo dưỡng của máy này"
                >
                  <History className="h-4 w-4" />
                  <span>Lịch Sử</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Routine Diagnosis or Inspection */}
              <button
                onClick={() => onOpenDiagnosis(device)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 py-2 px-3 text-xs font-medium text-slate-200 transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>Chẩn Đoán AI</span>
              </button>

              {/* Maintenance History Button */}
              {onOpenMachineDetails && (
                <button
                  onClick={() => onOpenMachineDetails(device)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 py-2 px-3 text-xs font-semibold text-amber-300 transition"
                  title="Xem lịch sử các đợt bảo dưỡng và hồ sơ chi tiết thiết bị"
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Lịch Sử Bảo Dưỡng</span>
                </button>
              )}

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
