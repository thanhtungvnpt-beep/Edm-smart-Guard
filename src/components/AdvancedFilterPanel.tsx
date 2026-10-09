import React, { useState, useEffect, useMemo } from 'react';
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
  Bookmark,
  BookmarkPlus,
  Trash2,
  Check,
  Tag,
  ShieldCheck,
  Star,
  RefreshCw,
  Edit3,
  Layers,
  Sun,
  Moon,
  Sunset,
  Calendar,
  Users,
} from 'lucide-react';
import { Device } from '../types';
import { getDeviceOperationalMetrics } from '../utils/operationalMetrics';
import { soundManager } from '../utils/audio';

export type ShiftFilterMode = 'ALL' | 'MORNING' | 'AFTERNOON' | 'NIGHT';

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

  // Shift Schedule (Ca làm việc: Morning, Afternoon, Night)
  shiftMode: ShiftFilterMode;

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
  shiftMode: 'ALL',
  urgentMaintenanceOnly: false,
};

export type QuickFilterColor = 'rose' | 'amber' | 'emerald' | 'cyan' | 'purple' | 'blue';
export type QuickFilterIcon =
  | 'AlertTriangle'
  | 'Flame'
  | 'Zap'
  | 'Clock'
  | 'ShieldCheck'
  | 'Sparkles'
  | 'Star'
  | 'SlidersHorizontal'
  | 'Bookmark'
  | 'Sun'
  | 'Moon'
  | 'Sunset'
  | 'Users'
  | 'Calendar';

export interface QuickFilterPreset {
  id: string;
  name: string;
  description?: string;
  criteria: AdvancedFilterCriteria;
  isBuiltIn?: boolean;
  color: QuickFilterColor;
  icon: QuickFilterIcon;
  createdAt?: string;
}

// Built-in presets including "Kiểm tra khẩn cấp ca sáng"
export const BUILT_IN_QUICK_PRESETS: QuickFilterPreset[] = [
  {
    id: 'preset-morning-urgent-shift',
    name: 'Kiểm tra khẩn cấp ca sáng',
    description: 'Rà soát ưu tiên máy ca sáng (06:00 - 14:30) cần bảo trì khẩn cấp, nhiệt độ vượt ngưỡng hoặc tải điện cao',
    criteria: {
      tempMode: 'OVERHEATING',
      minTempThreshold: 24,
      powerStatusMode: 'HIGH_DRAW',
      minPowerKw: 8.0,
      uptimeMode: 'ALL',
      minUptimeHours: 18,
      shiftMode: 'MORNING',
      urgentMaintenanceOnly: true,
    },
    isBuiltIn: true,
    color: 'rose',
    icon: 'AlertTriangle',
    createdAt: '2026-03-01T06:00:00Z',
  },
  {
    id: 'preset-afternoon-shift',
    name: 'Máy trực ca chiều (14:00 - 22:30)',
    description: 'Chỉ hiển thị các máy do kỹ thuật viên ca chiều phụ trách theo dõi và vận hành',
    criteria: {
      tempMode: 'ALL',
      minTempThreshold: 24,
      powerStatusMode: 'ALL',
      minPowerKw: 8.0,
      uptimeMode: 'ALL',
      minUptimeHours: 18,
      shiftMode: 'AFTERNOON',
      urgentMaintenanceOnly: false,
    },
    isBuiltIn: true,
    color: 'amber',
    icon: 'Sunset',
    createdAt: '2026-03-01T06:00:00Z',
  },
  {
    id: 'preset-night-shift',
    name: 'Máy trực ca đêm (22:00 - 06:30)',
    description: 'Rà soát các máy chạy tự động trong ca 3 đêm khuya không người trông',
    criteria: {
      tempMode: 'ALL',
      minTempThreshold: 24,
      powerStatusMode: 'ALL',
      minPowerKw: 8.0,
      uptimeMode: 'ALL',
      minUptimeHours: 18,
      shiftMode: 'NIGHT',
      urgentMaintenanceOnly: false,
    },
    isBuiltIn: true,
    color: 'purple',
    icon: 'Moon',
    createdAt: '2026-03-01T06:00:00Z',
  },
  {
    id: 'preset-overheating',
    name: 'Giám sát quá nhiệt dung môi',
    description: 'Nhiệt độ dung môi hoặc tủ điều khiển CNC vượt ngưỡng an toàn (>24°C)',
    criteria: {
      tempMode: 'OVERHEATING',
      minTempThreshold: 24,
      powerStatusMode: 'ALL',
      minPowerKw: 8.0,
      uptimeMode: 'ALL',
      minUptimeHours: 18,
      shiftMode: 'ALL',
      urgentMaintenanceOnly: false,
    },
    isBuiltIn: true,
    color: 'rose',
    icon: 'Flame',
    createdAt: '2026-03-01T06:00:00Z',
  },
  {
    id: 'preset-heavy-load',
    name: 'Tải điện cao & xung lớn (>8kW)',
    description: 'Máy gia công xung điện công suất cao cần giám sát dây đồng & máy phát',
    criteria: {
      tempMode: 'ALL',
      minTempThreshold: 24,
      powerStatusMode: 'HIGH_DRAW',
      minPowerKw: 8.0,
      uptimeMode: 'ALL',
      minUptimeHours: 18,
      shiftMode: 'ALL',
      urgentMaintenanceOnly: false,
    },
    isBuiltIn: true,
    color: 'amber',
    icon: 'Zap',
    createdAt: '2026-03-01T06:00:00Z',
  },
  {
    id: 'preset-continuous-run',
    name: 'Chạy liên tục xuyên ca (>18h)',
    description: 'Máy vận hành liên tục không ngừng trên 18 giờ cần kiểm tra bôi trơn và con trượt',
    criteria: {
      tempMode: 'ALL',
      minTempThreshold: 24,
      powerStatusMode: 'ALL',
      minPowerKw: 8.0,
      uptimeMode: 'OVER_18H',
      minUptimeHours: 18,
      shiftMode: 'ALL',
      urgentMaintenanceOnly: false,
    },
    isBuiltIn: true,
    color: 'cyan',
    icon: 'Clock',
    createdAt: '2026-03-01T06:00:00Z',
  },
];

const STORAGE_KEY = 'EDM_SCADA_SAVED_QUICK_FILTERS_V1';

export function getSavedQuickPresets(): QuickFilterPreset[] {
  if (typeof window === 'undefined') return BUILT_IN_QUICK_PRESETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return BUILT_IN_QUICK_PRESETS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse saved quick filters from localStorage', e);
  }
  return BUILT_IN_QUICK_PRESETS;
}

export function saveQuickPresetsToStorage(presets: QuickFilterPreset[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save quick filters to localStorage', e);
  }
}

export const matchesShift = (
  device: Device,
  shiftMode?: ShiftFilterMode
): boolean => {
  if (!shiftMode || shiftMode === 'ALL') return true;
  const shiftStr = (device.assignedTechnician?.shift || '').toLowerCase();
  if (!shiftStr) return false;

  if (shiftMode === 'MORNING') {
    return (
      shiftStr.includes('sáng') ||
      shiftStr.includes('morning') ||
      shiftStr.includes('ca 1') ||
      shiftStr.includes('06:00')
    );
  }
  if (shiftMode === 'AFTERNOON') {
    return (
      shiftStr.includes('chiều') ||
      shiftStr.includes('afternoon') ||
      shiftStr.includes('ca 2') ||
      shiftStr.includes('14:00')
    );
  }
  if (shiftMode === 'NIGHT') {
    return (
      shiftStr.includes('đêm') ||
      shiftStr.includes('night') ||
      shiftStr.includes('ca 3') ||
      shiftStr.includes('22:00')
    );
  }
  return true;
};

export const getCurrentRealtimeShift = (): 'MORNING' | 'AFTERNOON' | 'NIGHT' => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'MORNING';
  if (hour >= 14 && hour < 22) return 'AFTERNOON';
  return 'NIGHT';
};

export const areCriteriaEqual = (
  a: AdvancedFilterCriteria,
  b: AdvancedFilterCriteria
): boolean => {
  return (
    a.tempMode === b.tempMode &&
    (a.tempMode !== 'CUSTOM_MIN' || a.minTempThreshold === b.minTempThreshold) &&
    a.powerStatusMode === b.powerStatusMode &&
    (a.powerStatusMode !== 'HIGH_DRAW' || a.minPowerKw === b.minPowerKw) &&
    a.uptimeMode === b.uptimeMode &&
    (a.uptimeMode !== 'CUSTOM_HOURS' || a.minUptimeHours === b.minUptimeHours) &&
    (a.shiftMode || 'ALL') === (b.shiftMode || 'ALL') &&
    Boolean(a.urgentMaintenanceOnly) === Boolean(b.urgentMaintenanceOnly)
  );
};

export const countMatchingDevices = (
  devices: Device[],
  crit: AdvancedFilterCriteria
): number => {
  return devices.filter((d) => {
    const opMetrics = getDeviceOperationalMetrics(d);

    // 1. Temperature Filter
    if (crit.tempMode === 'OVERHEATING') {
      if (opMetrics.tempStatus !== 'OVERHEATING' && opMetrics.temperature < 24) return false;
    } else if (crit.tempMode === 'ELEVATED') {
      if (opMetrics.tempStatus === 'NORMAL') return false;
    } else if (crit.tempMode === 'CUSTOM_MIN') {
      if (opMetrics.temperature < crit.minTempThreshold) return false;
    }

    // 2. Power Filter
    if (crit.powerStatusMode === 'HIGH_DRAW') {
      if (opMetrics.powerKw < crit.minPowerKw) return false;
    } else if (crit.powerStatusMode === 'OVERCONSUMPTION') {
      if (opMetrics.powerStatus !== 'OVERCONSUMPTION') return false;
    } else if (crit.powerStatusMode === 'IDLE_SAVING') {
      if (opMetrics.powerKw > 2.0 && opMetrics.powerStatus !== 'IDLE_SAVING') return false;
    }

    // 3. Continuous Uptime Filter
    if (crit.uptimeMode === 'OVER_24H') {
      if (opMetrics.continuousUptimeHours < 24) return false;
    } else if (crit.uptimeMode === 'OVER_18H') {
      if (opMetrics.continuousUptimeHours < 18) return false;
    } else if (crit.uptimeMode === 'OVER_12H') {
      if (opMetrics.continuousUptimeHours < 12) return false;
    } else if (crit.uptimeMode === 'CUSTOM_HOURS') {
      if (opMetrics.continuousUptimeHours < crit.minUptimeHours) return false;
    }

    // 4. Shift Schedule Filter
    if (crit.shiftMode && !matchesShift(d, crit.shiftMode)) {
      return false;
    }

    // 5. Urgent Maintenance Priority Filter
    if (crit.urgentMaintenanceOnly) {
      if (!opMetrics.isUrgentMaintenanceNeeded) return false;
    }

    return true;
  }).length;
};

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  criteria: AdvancedFilterCriteria;
  onChange: (criteria: AdvancedFilterCriteria) => void;
  onReset: () => void;
  devices: Device[];
  filteredCount: number;
  onToast?: (message: string) => void;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  isOpen,
  onClose,
  criteria,
  onChange,
  onReset,
  devices,
  filteredCount,
  onToast,
}) => {
  // Presets state persisted in localStorage
  const [presets, setPresets] = useState<QuickFilterPreset[]>(() => getSavedQuickPresets());

  // Save Modal / Inline drawer state
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [presetDescInput, setPresetDescInput] = useState('');
  const [presetColorInput, setPresetColorInput] = useState<QuickFilterColor>('rose');
  const [presetIconInput, setPresetIconInput] = useState<QuickFilterIcon>('AlertTriangle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Inline feedback notice
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Sync presets state if storage changes
  useEffect(() => {
    saveQuickPresetsToStorage(presets);
  }, [presets]);

  if (!isOpen) return null;

  // Compute active filters count
  const activeCount =
    (criteria.tempMode !== 'ALL' ? 1 : 0) +
    (criteria.powerStatusMode !== 'ALL' ? 1 : 0) +
    (criteria.uptimeMode !== 'ALL' ? 1 : 0) +
    (criteria.shiftMode !== 'ALL' ? 1 : 0) +
    (criteria.urgentMaintenanceOnly ? 1 : 0);

  // Find currently active preset if criteria exactly matches
  const matchedPreset = presets.find((p) => areCriteriaEqual(p.criteria, criteria));

  // Quick summary counts
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

  // Handle apply preset
  const handleApplyPreset = (preset: QuickFilterPreset) => {
    onChange(preset.criteria);
    soundManager.playSuccessChime();
    const count = countMatchingDevices(devices, preset.criteria);
    const msg = `Đã áp dụng cấu hình lọc nhanh: "${preset.name}" (${count} máy thỏa mãn)`;
    setFeedbackNotice(msg);
    if (onToast) onToast(msg);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Open save dialog
  const handleOpenSaveDialog = () => {
    // Generate intelligent default name based on current settings
    let defaultSuggestedName = 'Kiểm tra tùy chỉnh';
    if (criteria.shiftMode === 'MORNING' && criteria.urgentMaintenanceOnly) {
      defaultSuggestedName = 'Kiểm tra khẩn cấp ca sáng';
    } else if (criteria.shiftMode === 'MORNING') {
      defaultSuggestedName = 'Rà soát máy ca sáng (06:00)';
    } else if (criteria.shiftMode === 'AFTERNOON') {
      defaultSuggestedName = 'Kiểm tra máy ca chiều (14:00)';
    } else if (criteria.shiftMode === 'NIGHT') {
      defaultSuggestedName = 'Giám sát tự động ca đêm (22:00)';
    } else if (criteria.urgentMaintenanceOnly && criteria.tempMode === 'OVERHEATING') {
      defaultSuggestedName = 'Kiểm tra khẩn cấp quá nhiệt';
    } else if (criteria.urgentMaintenanceOnly) {
      defaultSuggestedName = 'Ưu tiên sửa chữa khẩn';
    } else if (criteria.tempMode === 'OVERHEATING') {
      defaultSuggestedName = 'Rà soát nhiệt độ cao';
    } else if (criteria.powerStatusMode === 'HIGH_DRAW') {
      defaultSuggestedName = 'Theo dõi máy tải nặng';
    } else if (criteria.uptimeMode !== 'ALL') {
      defaultSuggestedName = 'Máy chạy liên tục xuyên ca';
    }

    setPresetNameInput(defaultSuggestedName);
    setPresetDescInput(`Cấu hình lọc lưu ngày ${new Date().toLocaleDateString('vi-VN')}`);
    setPresetColorInput(
      criteria.urgentMaintenanceOnly
        ? 'rose'
        : criteria.shiftMode === 'MORNING'
        ? 'amber'
        : criteria.shiftMode === 'AFTERNOON'
        ? 'cyan'
        : criteria.shiftMode === 'NIGHT'
        ? 'purple'
        : criteria.powerStatusMode !== 'ALL'
        ? 'amber'
        : 'cyan'
    );
    setPresetIconInput(
      criteria.urgentMaintenanceOnly
        ? 'AlertTriangle'
        : criteria.shiftMode === 'MORNING'
        ? 'Sun'
        : criteria.shiftMode === 'AFTERNOON'
        ? 'Sunset'
        : criteria.shiftMode === 'NIGHT'
        ? 'Moon'
        : criteria.tempMode !== 'ALL'
        ? 'Flame'
        : 'Zap'
    );
    setSaveError(null);
    setIsSavingCustom(true);
  };

  // Save new custom preset
  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = presetNameInput.trim();
    if (!trimmed) {
      setSaveError('Vui lòng nhập tên cho cấu hình bộ lọc!');
      return;
    }

    const newPreset: QuickFilterPreset = {
      id: `custom-filter-${Date.now()}`,
      name: trimmed,
      description: presetDescInput.trim() || undefined,
      criteria: { ...criteria },
      isBuiltIn: false,
      color: presetColorInput,
      icon: presetIconInput,
      createdAt: new Date().toISOString(),
    };

    const updated = [newPreset, ...presets];
    setPresets(updated);
    saveQuickPresetsToStorage(updated);
    setIsSavingCustom(false);
    soundManager.playSuccessChime();

    const msg = `Đã lưu thành công bộ lọc nhanh: "${trimmed}"!`;
    setFeedbackNotice(msg);
    if (onToast) onToast(msg);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Delete preset
  const handleDeletePreset = (id: string, name: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    saveQuickPresetsToStorage(updated);
    soundManager.playBeep();
    const msg = `Đã xóa bộ lọc nhanh: "${name}"`;
    setFeedbackNotice(msg);
    if (onToast) onToast(msg);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  // Reset presets to factory defaults
  const handleRestoreDefaultPresets = () => {
    setPresets(BUILT_IN_QUICK_PRESETS);
    saveQuickPresetsToStorage(BUILT_IN_QUICK_PRESETS);
    soundManager.playSuccessChime();
    const msg = 'Đã khôi phục danh sách bộ lọc nhanh mặc định của phân xưởng!';
    setFeedbackNotice(msg);
    if (onToast) onToast(msg);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  // Helper render icon
  const renderPresetIcon = (icon: QuickFilterIcon, className = 'h-3.5 w-3.5') => {
    switch (icon) {
      case 'AlertTriangle':
        return <AlertTriangle className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Clock':
        return <Clock className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Star':
        return <Star className={className} />;
      case 'Bookmark':
        return <Bookmark className={className} />;
      case 'Sun':
        return <Sun className={className} />;
      case 'Moon':
        return <Moon className={className} />;
      case 'Sunset':
        return <Sunset className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'Calendar':
        return <Calendar className={className} />;
      default:
        return <SlidersHorizontal className={className} />;
    }
  };

  // Color styles helper
  const getColorStyles = (color: QuickFilterColor, isActive: boolean) => {
    switch (color) {
      case 'rose':
        return isActive
          ? 'bg-rose-500/25 border-rose-500 text-rose-200 ring-2 ring-rose-500/50 shadow-md shadow-rose-950/40'
          : 'bg-rose-950/20 border-rose-800/40 text-rose-300 hover:border-rose-500/60 hover:bg-rose-900/30';
      case 'amber':
        return isActive
          ? 'bg-amber-500/25 border-amber-500 text-amber-200 ring-2 ring-amber-500/50 shadow-md shadow-amber-950/40'
          : 'bg-amber-950/20 border-amber-800/40 text-amber-300 hover:border-amber-500/60 hover:bg-amber-900/30';
      case 'emerald':
        return isActive
          ? 'bg-emerald-500/25 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50 shadow-md shadow-emerald-950/40'
          : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300 hover:border-emerald-500/60 hover:bg-emerald-900/30';
      case 'cyan':
        return isActive
          ? 'bg-cyan-500/25 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/50 shadow-md shadow-cyan-950/40'
          : 'bg-cyan-950/20 border-cyan-800/40 text-cyan-300 hover:border-cyan-500/60 hover:bg-cyan-900/30';
      case 'purple':
        return isActive
          ? 'bg-purple-500/25 border-purple-500 text-purple-200 ring-2 ring-purple-500/50 shadow-md shadow-purple-950/40'
          : 'bg-purple-950/20 border-purple-800/40 text-purple-300 hover:border-purple-500/60 hover:bg-purple-900/30';
      case 'blue':
      default:
        return isActive
          ? 'bg-blue-500/25 border-blue-500 text-blue-200 ring-2 ring-blue-500/50 shadow-md shadow-blue-950/40'
          : 'bg-blue-950/20 border-blue-800/40 text-blue-300 hover:border-blue-500/60 hover:bg-blue-900/30';
    }
  };

  return (
    <div className="relative z-30 mt-3 rounded-2xl border border-amber-500/30 bg-slate-900/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                Bộ Lọc Nâng Cao & Quản Lý Lọc Nhanh (Smart SCADA Filters)
              </h3>
              {activeCount > 0 && (
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-300">
                  {activeCount} điều kiện đang kích hoạt
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Lọc theo nhiệt độ, công suất và thời gian chạy liên tục — Hỗ trợ lưu trữ các cấu hình bộ lọc tùy chỉnh cho từng ca trực
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

      {/* FEEDBACK NOTICE BANNER */}
      {feedbackNotice && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-500/15 border border-amber-500/40 px-3.5 py-2 text-xs text-amber-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* QUICK FILTER PRESETS SECTION ("LỌC NHANH") */}
      <div className="mt-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 sm:p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
              <Bookmark className="h-3 w-3" />
            </span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Lọc Nhanh (Saved Quick Filter Presets)
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              — Áp dụng tức thì hoặc lưu bộ lọc riêng của ca làm việc
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenSaveDialog}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-2.5 py-1 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95"
              title="Lưu cấu hình các thông số hiện tại thành một bộ lọc nhanh mới"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span>+ Lưu Cấu Hình Này</span>
            </button>

            {presets.some((p) => !p.isBuiltIn) && (
              <button
                type="button"
                onClick={handleRestoreDefaultPresets}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline decoration-slate-600 transition"
                title="Khôi phục các bộ lọc mẫu mặc định"
              >
                Khôi phục mặc định
              </button>
            )}
          </div>
        </div>

        {/* PRESET CHIPS LIST */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {presets.map((preset) => {
            const isActive = areCriteriaEqual(preset.criteria, criteria);
            const count = countMatchingDevices(devices, preset.criteria);
            const colorClass = getColorStyles(preset.color, isActive);

            return (
              <div
                key={preset.id}
                className={`group relative flex items-center rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${colorClass}`}
              >
                <button
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="flex items-center gap-2 text-left"
                  title={preset.description || preset.name}
                >
                  <span className="shrink-0">{renderPresetIcon(preset.icon)}</span>
                  <span className="font-bold">{preset.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-900/60 text-slate-300 border border-slate-700/50'
                    }`}
                  >
                    {count} máy
                  </span>
                  {isActive && <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[3]" />}
                </button>

                {/* Delete button for custom presets or presets with delete option */}
                {!preset.isBuiltIn && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(preset.id, preset.name);
                    }}
                    className="ml-2 text-slate-400 hover:text-red-400 p-0.5 rounded transition"
                    title={`Xóa bộ lọc "${preset.name}"`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Matched preset notification strip if currently matching a saved preset */}
        {matchedPreset && (
          <div className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-900/80 px-2.5 py-1.5 text-[11px] text-slate-300 border border-slate-800">
            <span className="flex items-center gap-1.5 text-amber-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Đang áp dụng: <strong>{matchedPreset.name}</strong>
              {matchedPreset.description && (
                <span className="text-slate-400 hidden md:inline">
                  — {matchedPreset.description}
                </span>
              )}
            </span>
            <span className="font-mono text-slate-400">
              {filteredCount} / {devices.length} máy thỏa điều kiện
            </span>
          </div>
        )}
      </div>

      {/* SAVE NEW FILTER PRESET MODAL / INLINE DRAWER */}
      {isSavingCustom && (
        <form
          onSubmit={handleSavePreset}
          className="mt-3.5 rounded-xl border border-amber-500/50 bg-slate-950 p-4 shadow-xl animate-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <BookmarkPlus className="h-4 w-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">
                Lưu Bộ Lọc Nhanh Tùy Chỉnh (Custom Quick Filter)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsSavingCustom(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tên bộ lọc nhanh <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                placeholder="VD: Kiểm tra khẩn cấp ca sáng, Rà soát EDM ca 3..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                autoFocus
              />
              {saveError && <p className="mt-1 text-[11px] text-red-400">{saveError}</p>}

              <label className="block text-xs font-semibold text-slate-300 mt-2.5 mb-1">
                Mô tả / Mục đích sử dụng (Tùy chọn)
              </label>
              <input
                type="text"
                value={presetDescInput}
                onChange={(e) => setPresetDescInput(e.target.value)}
                placeholder="VD: Kiểm tra trước giờ giao ca sáng 06:00, ưu tiên máy nguy cơ dừng..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              {/* Color & Icon Picker */}
              <div className="mb-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Màu sắc nhận diện
                </label>
                <div className="flex items-center gap-2">
                  {(['rose', 'amber', 'emerald', 'cyan', 'purple', 'blue'] as QuickFilterColor[]).map(
                    (col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setPresetColorInput(col)}
                        className={`h-6 w-6 rounded-full border-2 transition ${
                          presetColorInput === col ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                        } ${
                          col === 'rose'
                            ? 'bg-rose-500'
                            : col === 'amber'
                            ? 'bg-amber-500'
                            : col === 'emerald'
                            ? 'bg-emerald-500'
                            : col === 'cyan'
                            ? 'bg-cyan-500'
                            : col === 'purple'
                            ? 'bg-purple-500'
                            : 'bg-blue-500'
                        }`}
                      />
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Biểu tượng
                </label>
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      'AlertTriangle',
                      'Flame',
                      'Zap',
                      'Clock',
                      'ShieldCheck',
                      'Sparkles',
                      'Star',
                      'Bookmark',
                    ] as QuickFilterIcon[]
                  ).map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setPresetIconInput(ic)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                        presetIconInput === ic
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {renderPresetIcon(ic, 'h-3.5 w-3.5')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Snapshot preview */}
              <div className="mt-3 rounded-lg bg-slate-900/90 border border-slate-800 p-2 text-[11px] text-slate-400 space-y-0.5">
                <span className="font-semibold text-slate-300 block">Thông số sẽ lưu trong bộ lọc:</span>
                <div>• Ca làm việc: <strong className="text-purple-300">{criteria.shiftMode === 'ALL' ? 'Mọi ca' : criteria.shiftMode === 'MORNING' ? 'Ca Sáng (06:00 - 14:30)' : criteria.shiftMode === 'AFTERNOON' ? 'Ca Chiều (14:00 - 22:30)' : 'Ca Đêm (22:00 - 06:30)'}</strong></div>
                <div>• Ưu tiên bảo trì cấp bách: <strong className={criteria.urgentMaintenanceOnly ? 'text-red-400' : 'text-slate-300'}>{criteria.urgentMaintenanceOnly ? 'BẬT (Khẩn)' : 'Tắt'}</strong></div>
                <div>• Nhiệt độ: <strong className="text-rose-300">{criteria.tempMode === 'ALL' ? 'Mọi mức' : criteria.tempMode === 'OVERHEATING' ? '> 24°C (Quá nhiệt)' : criteria.tempMode}</strong></div>
                <div>• Tiêu thụ điện: <strong className="text-amber-300">{criteria.powerStatusMode === 'ALL' ? 'Mọi mức' : criteria.powerStatusMode === 'HIGH_DRAW' ? `>= ${criteria.minPowerKw} kW` : criteria.powerStatusMode}</strong></div>
                <div>• Chạy liên tục: <strong className="text-cyan-300">{criteria.uptimeMode === 'ALL' ? 'Mọi mức' : criteria.uptimeMode === 'OVER_18H' ? '> 18 giờ' : criteria.uptimeMode}</strong></div>
              </div>
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-slate-800/80 pt-2.5">
            <button
              type="button"
              onClick={() => setIsSavingCustom(false)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-1 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Lưu Cấu Hình Bộ Lọc</span>
            </button>
          </div>
        </form>
      )}

      {/* 4 PARAMETERS GRID (Temperature, Power, Uptime, Shift) */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
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

        {/* PARAMETER 4: CA LÀM VIỆC (SHIFT SCHEDULE) */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-purple-400 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Ca Làm Việc (Shift)
              </span>
              <span className="font-mono text-[11px] text-slate-400">Sáng / Chiều / Đêm</span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="shiftMode"
                  checked={criteria.shiftMode === 'ALL'}
                  onChange={() => onChange({ ...criteria, shiftMode: 'ALL' })}
                  className="accent-purple-500"
                />
                <span>Tất cả các ca ({devices.length} máy)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="shiftMode"
                  checked={criteria.shiftMode === 'MORNING'}
                  onChange={() => onChange({ ...criteria, shiftMode: 'MORNING' })}
                  className="accent-purple-500"
                />
                <span className="flex items-center gap-1.5">
                  <Sun className="h-3 w-3 text-amber-400" />
                  <span>Ca Sáng (06:00 - 14:30)</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({devices.filter((d) => matchesShift(d, 'MORNING')).length} máy)
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="shiftMode"
                  checked={criteria.shiftMode === 'AFTERNOON'}
                  onChange={() => onChange({ ...criteria, shiftMode: 'AFTERNOON' })}
                  className="accent-purple-500"
                />
                <span className="flex items-center gap-1.5">
                  <Sunset className="h-3 w-3 text-orange-400" />
                  <span>Ca Chiều (14:00 - 22:30)</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({devices.filter((d) => matchesShift(d, 'AFTERNOON')).length} máy)
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="shiftMode"
                  checked={criteria.shiftMode === 'NIGHT'}
                  onChange={() => onChange({ ...criteria, shiftMode: 'NIGHT' })}
                  className="accent-purple-500"
                />
                <span className="flex items-center gap-1.5">
                  <Moon className="h-3 w-3 text-indigo-400" />
                  <span>Ca Đêm (22:00 - 06:30)</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({devices.filter((d) => matchesShift(d, 'NIGHT')).length} máy)
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Quick Real-Time Shift Auto-Detect Button */}
          <div className="mt-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                const rtShift = getCurrentRealtimeShift();
                onChange({ ...criteria, shiftMode: rtShift });
                const shiftName =
                  rtShift === 'MORNING' ? 'Ca Sáng' : rtShift === 'AFTERNOON' ? 'Ca Chiều' : 'Ca Đêm';
                if (onToast) onToast(`Đã tự động chọn ${shiftName} theo đồng hồ thời gian thực!`);
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1.5 text-[11px] font-semibold text-purple-300 transition active:scale-95"
              title="Tự động nhận diện ca trực đang diễn ra theo giờ đồng hồ hiện tại"
            >
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>
                Chọn Ca Thực Tế: {getCurrentRealtimeShift() === 'MORNING' ? 'Ca Sáng' : getCurrentRealtimeShift() === 'AFTERNOON' ? 'Ca Chiều' : 'Ca Đêm'}
              </span>
            </button>
          </div>
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

