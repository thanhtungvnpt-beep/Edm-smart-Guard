import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  Gauge,
  Radio,
  Sparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { Device } from '../types';

interface EdmSimulatorModalProps {
  devices: Device[];
  onClose: () => void;
  onTriggerAlarm: (deviceId: string, errorCode: string, errorTitle: string) => void;
}

export const EdmSimulatorModal: React.FC<EdmSimulatorModalProps> = ({
  devices,
  onClose,
  onTriggerAlarm,
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id || '');
  const [selectedScenario, setSelectedScenario] = useState<{
    code: string;
    title: string;
    icon: any;
    desc: string;
  }>({
    code: 'E-102',
    title: 'Đứt dây cắt EDM & Sụt áp phóng điện khe hở (Spark-Gap Breakage)',
    icon: Zap,
    desc: 'Điện áp tụt còn 14V, dòng đỉnh vọt lên 48A, dây cắt dừng hẳn. EDM gửi tín hiệu dừng khẩn cấp.',
  });

  const scenarios = [
    {
      code: 'E-102',
      title: 'Đứt dây cắt EDM & Sụt áp phóng điện khe hở',
      icon: Zap,
      desc: 'Điện áp sụt xuống 14.2V, dòng đỉnh tăng vọt 48A do kẹt cặn xỉ kim loại tại đầu dẫn hướng kim cương.',
    },
    {
      code: 'ALARM-204',
      title: 'Tụt áp suất dung dịch điện môi nguy hiểm (<0.3 Bar)',
      icon: Gauge,
      desc: 'Áp suất vòi phun chìm dưới 0.28 Bar, nguy cơ cháy phôi và bốc khói bồn gia công.',
    },
    {
      code: 'SPW-303',
      title: 'Quá nhiệt khối phát xung IGBT nguồn EDM (>75°C)',
      icon: Flame,
      desc: 'Nhiệt độ tản nhiệt IGBT lên 76.5°C, rơ-le nhiệt ngắt tải khẩn cấp bảo vệ biến tần.',
    },
    {
      code: 'E-408',
      title: 'Lỗi dịch chuyển trục Z & kẹt van một chiều hồi dầu',
      icon: AlertTriangle,
      desc: 'Đầu điện cực không rụt về kịp chu kỳ xung do hạt phôi kẹt van bi tại đầu gá 3R.',
    },
  ];

  const handleExecute = () => {
    onTriggerAlarm(selectedDeviceId, selectedScenario.code, selectedScenario.title);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-red-500/80 bg-slate-950 p-6 shadow-2xl shadow-red-950/60">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Bộ Giả Lập Tín Hiệu EDM Dừng Máy Khẩn Cấp
              </h3>
              <p className="text-xs text-slate-400">
                Thử nghiệm quy trình bắn Push Notification tức thì đến điện thoại KTV và kích hoạt AI.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-900 p-2 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Target Machine Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              1. Chọn máy phát sinh sự cố:
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name} ({d.assignedTechnician?.name || 'KTV'})
                </option>
              ))}
            </select>
          </div>

          {/* Breakdown Scenarios */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              2. Chọn kịch bản dừng máy công nghiệp:
            </label>
            <div className="space-y-2">
              {scenarios.map((sc) => {
                const isSelected = selectedScenario.code === sc.code;
                const Icon = sc.icon;
                return (
                  <button
                    key={sc.code}
                    type="button"
                    onClick={() => setSelectedScenario(sc)}
                    className={`w-full text-left rounded-xl p-3 border transition ${
                      isSelected
                        ? 'border-red-500 bg-red-950/40 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${isSelected ? 'text-red-400' : 'text-slate-400'}`} />
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {sc.code}
                        </span>
                        <span className="text-xs font-bold">{sc.title}</span>
                      </div>
                      <span className={`h-2.5 w-2.5 rounded-full ${isSelected ? 'bg-red-500' : 'bg-slate-700'}`}></span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 pl-6 leading-relaxed">
                      {sc.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleExecute}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-2.5 text-xs font-bold text-white shadow-xl shadow-red-600/40 transition active:scale-95"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>KÍCH HOẠT DỪNG MÁY & BẮN PUSH</span>
          </button>
        </div>
      </div>
    </div>
  );
};
