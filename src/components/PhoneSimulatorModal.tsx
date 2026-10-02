import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Phone,
  PhoneCall,
  Shield,
  Smartphone,
  Sparkles,
  Volume2,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { Device } from '../types';
import { soundManager } from '../utils/audio';

interface PhoneSimulatorModalProps {
  device: Device | null;
  onClose: () => void;
  onAcknowledge: (deviceId: string) => void;
  onOpenDiagnosis: (device: Device) => void;
}

export const PhoneSimulatorModal: React.FC<PhoneSimulatorModalProps> = ({
  device,
  onClose,
  onAcknowledge,
  onOpenDiagnosis,
}) => {
  if (!device) return null;

  const tech = device.assignedTechnician;
  const incident = device.activeIncident;
  const [testSent, setTestSent] = useState(false);

  const handleTestPing = () => {
    soundManager.playPushSound();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleAcknowledgeFromPhone = () => {
    soundManager.playSuccessChime();
    onAcknowledge(device.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col items-center">
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 rounded-full bg-slate-800 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Smartphone Shell Frame */}
        <div className="relative w-[340px] sm:w-[380px] rounded-[48px] border-[10px] border-slate-800 bg-slate-950 p-4 shadow-2xl shadow-cyan-950/60 ring-1 ring-slate-700">
          {/* Dynamic Island / Notch */}
          <div className="mx-auto mb-3 flex h-5 w-28 items-center justify-center rounded-full bg-black">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-900 border border-slate-700"></span>
          </div>

          {/* Phone Status Bar */}
          <div className="flex items-center justify-between px-3 text-[11px] font-mono text-slate-400">
            <span>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-emerald-400">5G EDM-NET</span>
              <Wifi className="h-3 w-3 text-slate-300" />
              <span className="rounded bg-slate-800 px-1 py-0.5 text-[9px] font-bold text-white">98%</span>
            </div>
          </div>

          {/* Technician Profile Card on Phone */}
          <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 p-2.5">
            {tech?.avatar && (
              <img
                src={tech.avatar}
                alt={tech.name}
                className="h-9 w-9 rounded-full object-cover border border-amber-500"
              />
            )}
            <div className="flex-1 truncate">
              <p className="text-xs font-bold text-white truncate">{tech?.name}</p>
              <p className="text-[10px] text-amber-400 font-mono">{tech?.phone} • {tech?.shift}</p>
            </div>
            <button
              onClick={handleTestPing}
              title="Phát chuông thông báo thử nghiệm"
              className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[10px] text-slate-300 transition"
            >
              <Volume2 className="h-3 w-3 text-amber-400" />
              <span>Thử chuông</span>
            </button>
          </div>

          {/* Phone Screen Notification Center */}
          <div className="mt-4 min-h-[380px] space-y-3">
            {incident ? (
              /* ACTIVE EMERGENCY PUSH NOTIFICATION CARD */
              <div className="rounded-3xl border-2 border-red-500 bg-gradient-to-b from-red-950/80 to-slate-900/90 p-4 shadow-xl shadow-red-950/60 ring-2 ring-red-500/30 animate-pulse">
                {/* Notification Header */}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-red-400">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-[10px]">
                      🚨
                    </span>
                    <span>EDM SMARTGUARD PUSH</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Vừa xong</span>
                </div>

                {/* Notification Content */}
                <div className="mt-2.5">
                  <h4 className="font-extrabold text-white text-sm leading-snug">
                    DỪNG MÁY KHẨN CẤP: {device.code} ({device.name})
                  </h4>
                  <p className="text-xs text-red-200 mt-1">
                    Hệ thống EDM ghi nhận sự cố: <strong className="text-amber-300">{incident.errorCode} - {incident.errorTitle}</strong>
                  </p>
                  <p className="text-[11px] text-slate-300 mt-1">
                    📍 Vị trí: {device.location}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    ⏱️ Báo dừng lúc: {new Date(incident.triggeredAt).toLocaleTimeString('vi-VN')}
                  </p>
                </div>

                {/* Telemetry snippet on lockscreen */}
                <div className="mt-3 rounded-xl bg-black/50 p-2 text-[10px] font-mono grid grid-cols-3 text-center border border-red-500/20">
                  <div>
                    <span className="text-slate-400 block">ÁP SUẤT</span>
                    <span className="text-red-300 font-bold">{incident.telemetrySnapshot.dielectricPressure} Bar</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ĐIỆN ÁP</span>
                    <span className="text-amber-300 font-bold">{incident.telemetrySnapshot.dischargeVoltage} V</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">DÒNG XUNG</span>
                    <span className="text-white font-bold">{incident.telemetrySnapshot.peakCurrent} A</span>
                  </div>
                </div>

                {/* Actions on lock screen notification */}
                <div className="mt-3.5 space-y-2">
                  {!incident.acknowledgedAt ? (
                    <button
                      onClick={handleAcknowledgeFromPhone}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 text-xs font-bold text-slate-950 shadow-md transition active:scale-95"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Nhấn Tiếp Nhận Xử Lý Ngay</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 py-2 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Đã Tiếp Nhận ({incident.acknowledgedBy})</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      onClose();
                      onOpenDiagnosis(device);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 py-2 text-xs font-bold text-white transition active:scale-95"
                  >
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Mở AI Chẩn Đoán & Giải Pháp</span>
                  </button>
                </div>
              </div>
            ) : (
              /* IDLE / NORMAL PUSH NOTIFICATION STATE */
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-white">Trạng thái thiết bị bình thường</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Máy {device.code} đang vận hành ổn định. Điện thoại KTV {tech?.name} đã sẵn sàng nhận thông báo đẩy tức thì nếu có sự cố.
                </p>
                <button
                  onClick={handleTestPing}
                  className="mt-3 inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-amber-400 transition"
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>Bắn Thông Báo Thử Nghiệm</span>
                </button>
              </div>
            )}

            {testSent && (
              <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-2.5 text-center text-xs text-emerald-300 animate-in fade-in">
                🔔 Tín hiệu Push Notification đã rung & phát chuông tới điện thoại!
              </div>
            )}
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="mt-4 flex justify-center pb-1">
            <span className="h-1 w-32 rounded-full bg-slate-700"></span>
          </div>
        </div>
      </div>
    </div>
  );
};
