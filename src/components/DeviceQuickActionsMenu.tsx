import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  RotateCcw,
  Sliders,
  RefreshCw,
  Radio,
  ExternalLink,
  Zap,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Device } from '../types';
import { QuickActionMode } from './DeviceQuickActionsModal';

interface DeviceQuickActionsMenuProps {
  device: Device;
  onSelectAction: (mode: QuickActionMode) => void;
  onOpenMachineDetails?: (device: Device) => void;
  onQuickSyncDirect?: (deviceId: string) => Promise<void>;
}

export const DeviceQuickActionsMenu: React.FC<DeviceQuickActionsMenuProps> = ({
  device,
  onSelectAction,
  onOpenMachineDetails,
  onQuickSyncDirect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDirectSyncing, setIsDirectSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTriggerAction = (mode: QuickActionMode) => {
    setIsOpen(false);
    onSelectAction(mode);
  };

  const handleDirectSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDirectSyncing(true);
    setSyncFeedback(null);
    try {
      if (onQuickSyncDirect) {
        await onQuickSyncDirect(device.id);
      } else {
        const res = await fetch(`/api/devices/${device.id}/quick-action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'force-sync' }),
        });
        await res.json();
      }
      setSyncFeedback('Đã đồng bộ 14ms');
      setTimeout(() => {
        setSyncFeedback(null);
        setIsOpen(false);
      }, 1000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDirectSyncing(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Tác vụ nhanh (Quick Actions): Reset bộ đếm, Hiệu chuẩn cảm biến, Đồng bộ PLC"
        className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition active:scale-95 ${
          isOpen
            ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-500/20'
            : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-amber-500/50 hover:bg-slate-700/80 hover:text-white'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Zap className="h-3.5 w-3.5 text-amber-400" />
        <span className="hidden sm:inline">Tác Vụ</span>
        <MoreVertical className="h-3 w-3 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 origin-top-right rounded-2xl border border-slate-700/80 bg-slate-900/95 p-1.5 text-slate-100 shadow-2xl shadow-black/80 backdrop-blur-md z-40 animate-in fade-in zoom-in-95 duration-150">
          {/* Menu Header Strip */}
          <div className="border-b border-slate-800 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Tác Vụ Nhanh (Quick Actions)
              </span>
              <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                {device.code}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              Thực thi trực tiếp không cần mở modal chi tiết
            </p>
          </div>

          <div className="py-1 space-y-0.5">
            {/* 1. Reset Service Counter */}
            <button
              type="button"
              onClick={() => handleTriggerAction('RESET_COUNTER')}
              className="w-full flex items-start gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-amber-500/10 hover:border-amber-500/30 border border-transparent transition group"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                <RotateCcw className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-200 group-hover:text-amber-300">
                    Reset Service Counter
                  </span>
                  <span className="text-[10px] font-mono text-amber-400/80">500h</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  Đặt lại giờ chạy bộ lọc & chu kỳ bảo dưỡng
                </p>
              </div>
            </button>

            {/* 2. Calibrate Sensor */}
            <button
              type="button"
              onClick={() => handleTriggerAction('CALIBRATE_SENSOR')}
              className="w-full flex items-start gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-transparent transition group"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition">
                <Sliders className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-200 group-hover:text-cyan-300">
                    Calibrate Sensor
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400/80">Zero/Span</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  Hiệu chuẩn áp suất, điện áp & dòng xung
                </p>
              </div>
            </button>

            {/* 3. Force Sync */}
            <div className="flex items-center gap-1 rounded-xl px-3 py-2 hover:bg-indigo-500/10 hover:border-indigo-500/30 border border-transparent transition group">
              <button
                type="button"
                onClick={() => handleTriggerAction('FORCE_SYNC')}
                className="flex items-start gap-2.5 text-left flex-1 min-w-0"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition">
                  <RefreshCw className={`h-3.5 w-3.5 ${isDirectSyncing ? 'animate-spin' : ''}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200 group-hover:text-indigo-300">
                      Force Sync
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400/80">Modbus</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {syncFeedback || 'Cưỡng bức đồng bộ dữ liệu PLC tức thì'}
                  </p>
                </div>
              </button>

              {/* 1-click instant sync button */}
              <button
                type="button"
                onClick={handleDirectSync}
                disabled={isDirectSyncing}
                title="Bấm để đồng bộ ngay lập tức không cần mở hộp thoại"
                className="shrink-0 p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-500 text-indigo-200 hover:text-white transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isDirectSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* 4. Ping Controller */}
            <button
              type="button"
              onClick={() => handleTriggerAction('PING_CONTROLLER')}
              className="w-full flex items-start gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-slate-800 border border-transparent transition group"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 group-hover:text-white transition">
                <Radio className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-200 group-hover:text-white">
                    Ping Controller
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">12ms</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  Kiểm tra độ trễ mạng PLC / Edge
                </p>
              </div>
            </button>
          </div>

          {/* Divider */}
          {onOpenMachineDetails && (
            <div className="border-t border-slate-800/90 pt-1 mt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenMachineDetails(device);
                }}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-amber-300 transition"
              >
                <span className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Mở Hồ Sơ Đầy Đủ &amp; Lịch Sử</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
