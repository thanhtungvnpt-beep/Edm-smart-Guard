import React from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  Phone,
  Smartphone,
  Sparkles,
  X,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { Device } from '../types';

interface EmergencyModalProps {
  device: Device | null;
  onClose: () => void;
  onAcknowledge: (deviceId: string) => void;
  onOpenDiagnosis: (device: Device) => void;
  onOpenPhoneView: (device: Device) => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  device,
  onClose,
  onAcknowledge,
  onOpenDiagnosis,
  onOpenPhoneView,
}) => {
  if (!device || !device.activeIncident) return null;

  const incident = device.activeIncident;
  const tech = device.assignedTechnician;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border-2 border-red-500 bg-slate-950 p-6 shadow-2xl shadow-red-600/40 ring-4 ring-red-500/20">
        {/* Urgent Industrial Pulsing Stripe */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-slate-900 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/50 animate-bounce">
            <AlertOctagon className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-red-500/20 border border-red-500/40 px-2 py-0.5 font-mono text-xs font-bold text-red-400">
                TÍN HIỆU EDM DỪNG MÁY KHẨN CẤP
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(incident.triggeredAt).toLocaleTimeString('vi-VN')}
              </span>
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">
              {device.name}
            </h2>
            <p className="text-sm font-medium text-slate-300">
              Vị trí: <span className="text-amber-400">{device.location}</span> • Model:{' '}
              <span className="text-white font-mono">{device.model}</span>
            </p>
          </div>
        </div>

        {/* Alarm Detail Box */}
        <div className="mt-5 rounded-2xl border border-red-500/40 bg-red-950/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded bg-red-600 px-2 py-1 font-mono text-xs font-bold text-white">
                MÃ LỖI: {incident.errorCode}
              </span>
              <span className="text-sm font-bold text-red-200">
                {incident.errorTitle}
              </span>
            </div>
            <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-400 uppercase">
              {incident.severity}
            </span>
          </div>

          {/* Telemetry Snapshot */}
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-red-500/20 pt-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">ĐIỆN ÁP XUNG</span>
              <span className="text-white font-bold">{incident.telemetrySnapshot.dischargeVoltage} V</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">DÒNG ĐỈNH</span>
              <span className="text-white font-bold">{incident.telemetrySnapshot.peakCurrent} A</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ÁP SUẤT DUNG MÔI</span>
              <span className="text-red-300 font-bold">{incident.telemetrySnapshot.dielectricPressure} Bar</span>
            </div>
          </div>
        </div>

        {/* Instant Push Delivery Status to Technician's Phone */}
        <div className="mt-4 rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
              <Smartphone className="h-4 w-4 text-indigo-400 animate-pulse" />
              <span>ĐÃ PHÁT THÔNG BÁO ĐẨY ĐẾN ĐIỆN THOẠI KTV:</span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              Đã nhận tin nhắn (Delivered)
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-900/80 p-2.5 border border-indigo-500/20">
            <div className="flex items-center gap-3">
              {tech?.avatar && (
                <img
                  src={tech.avatar}
                  alt={tech.name}
                  className="h-10 w-10 rounded-full object-cover border border-amber-400"
                />
              )}
              <div>
                <p className="text-sm font-bold text-white">{tech?.name}</p>
                <p className="text-xs text-slate-300 flex items-center gap-1.5 font-mono">
                  <Phone className="h-3 w-3 text-amber-400" />
                  {tech?.phone} • {tech?.role}
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenPhoneView(device)}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition shadow"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mở Màn Hình ĐT</span>
            </button>
          </div>
        </div>

        {/* Safety Warning */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-300">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
          <span>Lưu ý an toàn: Đảm bảo ngắt công tắc phóng điện cao áp và xả áp suất khí nén trước khi chạm vào cụm đầu dẫn hướng.</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          {/* Acknowledge Button */}
          {!incident.acknowledgedAt ? (
            <button
              onClick={() => {
                onAcknowledge(device.id);
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 py-3 px-4 font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition active:scale-95"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>Kỹ Thuật Viên Tiếp Nhận Xử Lý</span>
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 py-3 px-4 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <span>Đã Tiếp Nhận ({incident.acknowledgedBy})</span>
            </div>
          )}

          {/* AI Diagnosis Button */}
          <button
            onClick={() => {
              onClose();
              onOpenDiagnosis(device);
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-3 px-4 font-bold text-white shadow-xl shadow-purple-600/30 transition active:scale-95"
          >
            <Sparkles className="h-5 w-5 text-amber-300" />
            <span>Xem Đề Xuất Sửa Chữa Nhanh Của AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
