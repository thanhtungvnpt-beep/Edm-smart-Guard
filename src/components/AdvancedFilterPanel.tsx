import React from 'react';
import {
  SlidersHorizontal,
  Flame,
  Zap,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Info,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Device } from '../types';
import { getDeviceOperationalMetrics } from '../utils/operationalMetrics';

export interface AdvancedFilterCriteria {
  // Operating Temperature Threshold
  tempMode: 'ALL' | 'OVERHEATING' | 'ELEVATED' | 'CUSTOM_MIN';
  minTempThreshold: number; // e.g. 23°C or 25°C

  // Power Consumption Status
  powerStatusMode: 'ALL' | 'OVERCONSUMPTION' | 'HIGH_DRAW' | 'IDLE_SAVING';
  minPowerKw: number; // e.g. 8.0 kW

  // Continuous Uptime / Runtime
  uptimeMode: 'ALL' | 'OVER_24H' | 'OVER_18H' | 'OVER_12H' | 'CUSTOM_HOURS';
  minUptimeHours: number; // e.g. 20 hours

  // Quick preset: Priority urgent maintenance
  urgentMaintenanceOnly: boolean;
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilterCriteria = {
  tempMode: 'ALL',
  minTempThreshold: 24,
  powerStatusMode: 'ALL',
  minPowerKw: 8.0,
  uptimeMode: 'ALL',
  minUptimeHours: 18,
  urgentMaintenanceOnly: false,
};

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  criteria: AdvancedFilterCriteria;
  onChange: (criteria: AdvancedFilterCriteria) => void;
  onReset: () => void;
  devices: Device[];
  filteredCount: number;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  isOpen,
  onClose,
  criteria,
  onChange,
  onReset,
  devices,
  filteredCount,
}) => {
  if (!isOpen) return null;

  // Compute active filters count
  const activeCount =
    (criteria.tempMode !== 'ALL' ? 1 : 0) +
    (criteria.powerStatusMode !== 'ALL' ? 1 : 0) +
    (criteria.uptimeMode !== 'ALL' ? 1 : 0) +
    (criteria.urgentMaintenanceOnly ? 1 : 0);

  // Quick counts
  const urgentCount = devices.filter((d) => {
    const m = getDeviceOperationalMetrics(d);
    return m.isUrgentMaintenanceNeeded;
  }).length;

  const overheatCount = devices.filter((d) => {
    const m = getDeviceOperationalMetrics(d);
    return m.tempStatus === 'OVERHEATING' || m.temperature >= 24;
  }).length;

  const highPowerCount = devices.filter((d) => {
    const m = getDeviceOperationalMetrics(d);
    return m.powerKw >= 8.0 || m.powerStatus === 'OVERCONSUMPTION';
  }).length;

  const longUptimeCount = devices.filter((d) => {
    const m = getDeviceOperationalMetrics(d);
    return m.continuousUptimeHours >= 18;
  }).length;

  return (
    <div className="relative z-30 mt-3 rounded-2xl border border-amber-500/30 bg-slate-900/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                Bộ Lọc Nâng Cao Theo Vận Hành & Khẩn Cấp
              </h3>
              {activeCount > 0 && (
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-300">
                  {activeCount} bộ lọc đang áp dụng
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Lọc theo nhiệt độ vận hành, công suất tiêu thụ & thời gian chạy liên tục để ưu tiên bảo trì cấp bách
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Đặt lại tất cả các điều kiện lọc nâng cao"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Đóng bảng lọc nâng cao"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* QUICK PRESET CHIPS */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-400" />
          Kịch bản ưu tiên nhanh:
        </span>

        {/* Preset 1: Urgent Maintenance Priority */}
        <button
          onClick={() => {
            onChange({
              ...criteria,
              urgentMaintenanceOnly: !criteria.urgentMaintenanceOnly,
            });
          }}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition border ${
            criteria.urgentMaintenanceOnly
              ? 'bg-red-500/20 border-red-500 text-red-200 ring-1 ring-red-500/50'
              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-red-500/40 hover:text-red-300'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
          <span>🚨 Cần bảo trì cấp bách ({urgentCount} máy)</span>
        </button>

        {/* Preset 2: Overheating Machines */}
        <button
          onClick={() => {
            onChange({
              ...criteria,
              tempMode: criteria.tempMode === 'OVERHEATING' ? 'ALL' : 'OVERHEATING',
              minTempThreshold: 24,
            });
          }}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition border ${
            criteria.tempMode === 'OVERHEATING'
              ? 'bg-rose-500/20 border-rose-500 text-rose-200 ring-1 ring-rose-500/50'
              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-rose-500/40 hover:text-rose-300'
          }`}
        >
          <Flame className="h-3.5 w-3.5 text-rose-400" />
          <span>Nhiệt độ vượt ngưỡng ({overheatCount} máy)</span>
        </button>

        {/* Preset 3: High Power / Heavy Load */}
        <button
          onClick={() => {
            onChange({
              ...criteria,
              powerStatusMode: criteria.powerStatusMode === 'HIGH_DRAW' ? 'ALL' : 'HIGH_DRAW',
              minPowerKw: 8.0,
            });
          }}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition border ${
            criteria.powerStatusMode === 'HIGH_DRAW'
              ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/50'
              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-amber-500/40 hover:text-amber-300'
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span>Tải điện cao &gt; 8kW ({highPowerCount} máy)</span>
        </button>

        {/* Preset 4: Long Uptime > 18h */}
        <button
          onClick={() => {
            onChange({
              ...criteria,
              uptimeMode: criteria.uptimeMode === 'OVER_18H' ? 'ALL' : 'OVER_18H',
              minUptimeHours: 18,
            });
          }}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition border ${
            criteria.uptimeMode === 'OVER_18H'
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50'
              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300'
          }`}
        >
          <Clock className="h-3.5 w-3.5 text-cyan-400" />
          <span>Chạy liên tục &gt; 18h ({longUptimeCount} máy)</span>
        </button>
      </div>

      {/* 3 PARAMETERS GRID */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* PARAMETER 1: OPERATING TEMPERATURE */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-rose-400 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5" />
                Ngưỡng Nhiệt Độ Vận Hành
              </span>
              <span className="font-mono text-[11px] text-slate-400">°C Dung môi / Tủ máy</span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="tempMode"
                  checked={criteria.tempMode === 'ALL'}
                  onChange={() => onChange({ ...criteria, tempMode: 'ALL' })}
                  className="accent-rose-500"
                />
                <span>Mọi mức nhiệt độ (Mặc định)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="tempMode"
                  checked={criteria.tempMode === 'OVERHEATING'}
                  onChange={() => onChange({ ...criteria, tempMode: 'OVERHEATING' })}
                  className="accent-rose-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  Vượt ngưỡng nhiệt an toàn (&gt; 24°C)
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="tempMode"
                  checked={criteria.tempMode === 'CUSTOM_MIN'}
                  onChange={() => onChange({ ...criteria, tempMode: 'CUSTOM_MIN' })}
                  className="accent-rose-500"
                />
                <span>Tùy chỉnh ngưỡng nhiệt độ tối thiểu</span>
              </label>
            </div>
          </div>

          {/* Slider if CUSTOM_MIN */}
          {criteria.tempMode === 'CUSTOM_MIN' && (
            <div className="mt-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Lọc máy có nhiệt độ &ge;</span>
                <span className="font-mono font-bold text-rose-400">{criteria.minTempThreshold}°C</span>
              </div>
              <input
                type="range"
                min="18"
                max="32"
                step="0.5"
                value={criteria.minTempThreshold}
                onChange={(e) =>
                  onChange({ ...criteria, minTempThreshold: parseFloat(e.target.value) })
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>18°C (Mát)</span>
                <span>24°C (Chuẩn)</span>
                <span>32°C (Quá nhiệt)</span>
              </div>
            </div>
          )}
        </div>

        {/* PARAMETER 2: POWER CONSUMPTION */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Tình Trạng Tiêu Thụ Điện Năng
              </span>
              <span className="font-mono text-[11px] text-slate-400">kW Phóng điện + Bơm</span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="powerMode"
                  checked={criteria.powerStatusMode === 'ALL'}
                  onChange={() => onChange({ ...criteria, powerStatusMode: 'ALL' })}
                  className="accent-amber-500"
                />
                <span>Mọi mức công suất điện</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="powerMode"
                  checked={criteria.powerStatusMode === 'HIGH_DRAW'}
                  onChange={() => onChange({ ...criteria, powerStatusMode: 'HIGH_DRAW' })}
                  className="accent-amber-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  Tải công suất cao (&ge; {criteria.minPowerKw} kW)
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="powerMode"
                  checked={criteria.powerStatusMode === 'OVERCONSUMPTION'}
                  onChange={() => onChange({ ...criteria, powerStatusMode: 'OVERCONSUMPTION' })}
                  className="accent-amber-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  Vượt định mức danh định (&gt; 11.5 kW)
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="powerMode"
                  checked={criteria.powerStatusMode === 'IDLE_SAVING'}
                  onChange={() => onChange({ ...criteria, powerStatusMode: 'IDLE_SAVING' })}
                  className="accent-amber-500"
                />
                <span>Chế độ nghỉ tiết kiệm (&lt; 2 kW)</span>
              </label>
            </div>
          </div>

          {/* Slider if HIGH_DRAW */}
          {criteria.powerStatusMode === 'HIGH_DRAW' && (
            <div className="mt-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Ngưỡng công suất &ge;</span>
                <span className="font-mono font-bold text-amber-400">{criteria.minPowerKw} kW</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="16.0"
                step="0.5"
                value={criteria.minPowerKw}
                onChange={(e) =>
                  onChange({ ...criteria, minPowerKw: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>3 kW</span>
                <span>8 kW</span>
                <span>16 kW (Cực đại)</span>
              </div>
            </div>
          )}
        </div>

        {/* PARAMETER 3: CONTINUOUS RUNTIME / UPTIME */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Thời Gian Vận Hành Liên Tục (Uptime)
              </span>
              <span className="font-mono text-[11px] text-slate-400">Giờ (Hours)</span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="uptimeMode"
                  checked={criteria.uptimeMode === 'ALL'}
                  onChange={() => onChange({ ...criteria, uptimeMode: 'ALL' })}
                  className="accent-cyan-500"
                />
                <span>Mọi thời lượng hoạt động</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="uptimeMode"
                  checked={criteria.uptimeMode === 'OVER_24H'}
                  onChange={() => onChange({ ...criteria, uptimeMode: 'OVER_24H', minUptimeHours: 24 })}
                  className="accent-cyan-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  Chạy liên tục &gt; 24 giờ (Quá tải ca)
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="uptimeMode"
                  checked={criteria.uptimeMode === 'OVER_18H'}
                  onChange={() => onChange({ ...criteria, uptimeMode: 'OVER_18H', minUptimeHours: 18 })}
                  className="accent-cyan-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                  Chạy liên tục &gt; 18 giờ (Cần rà soát)
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="uptimeMode"
                  checked={criteria.uptimeMode === 'CUSTOM_HOURS'}
                  onChange={() => onChange({ ...criteria, uptimeMode: 'CUSTOM_HOURS' })}
                  className="accent-cyan-500"
                />
                <span>Tùy chỉnh thời gian chạy tối thiểu</span>
              </label>
            </div>
          </div>

          {/* Slider if CUSTOM_HOURS */}
          {criteria.uptimeMode === 'CUSTOM_HOURS' && (
            <div className="mt-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Chạy liên tục &ge;</span>
                <span className="font-mono font-bold text-cyan-400">{criteria.minUptimeHours} giờ</span>
              </div>
              <input
                type="range"
                min="4"
                max="48"
                step="1"
                value={criteria.minUptimeHours}
                onChange={(e) =>
                  onChange({ ...criteria, minUptimeHours: parseInt(e.target.value) })
                }
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>4h</span>
                <span>24h</span>
                <span>48h (Tối đa)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER SUMMARY STRIP */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Info className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            Kết quả lọc: <strong className="text-amber-400 font-bold font-mono">{filteredCount}</strong> / {devices.length} máy thỏa mãn điều kiện.
            {criteria.urgentMaintenanceOnly && (
              <span className="ml-1 text-red-300">
                (Đang bật chế độ <strong>ưu tiên máy cần bảo trì cấp bách</strong>)
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            Áp Dụng Bộ Lọc ({filteredCount} máy)
          </button>
        </div>
      </div>
    </div>
  );
};
