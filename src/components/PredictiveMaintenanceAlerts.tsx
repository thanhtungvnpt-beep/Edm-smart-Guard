import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bell,
  BellOff,
  BellRing,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Layers,
  MapPin,
  PackageCheck,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Timer,
  User,
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';
import { Device } from '../types';
import {
  getAllMachineServiceIntervals,
  MachineServiceIntervalInfo,
} from '../utils/serviceIntervalHelper';

interface PredictiveMaintenanceAlertsProps {
  devices: Device[];
  onOpenMachineDetails: (device: Device) => void;
  maintenanceNotificationsEnabled?: boolean;
  onToggleMaintenanceNotifications?: (enabled: boolean) => void;
}

export const PredictiveMaintenanceAlerts: React.FC<PredictiveMaintenanceAlertsProps> = ({
  devices,
  onOpenMachineDetails,
  maintenanceNotificationsEnabled,
  onToggleMaintenanceNotifications,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'URGENT' | 'UPCOMING' | 'NORMAL'>('ALL');

  // Internal state fallback for fleet maintenance notification toggle
  const [internalNotificationsEnabled, setInternalNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartguard_fleet_maintenance_notifications_enabled');
      return saved !== 'false';
    }
    return true;
  });

  const isAlertsActive =
    maintenanceNotificationsEnabled !== undefined
      ? maintenanceNotificationsEnabled
      : internalNotificationsEnabled;

  const handleToggleAlerts = () => {
    const nextState = !isAlertsActive;
    setInternalNotificationsEnabled(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartguard_fleet_maintenance_notifications_enabled', String(nextState));
    }
    onToggleMaintenanceNotifications?.(nextState);
  };

  // Compute all intervals sorted by urgency
  const serviceIntervals = useMemo(() => {
    return getAllMachineServiceIntervals(devices);
  }, [devices]);

  // Counts for summary metrics
  const urgentCount = serviceIntervals.filter(
    (i) => i.urgency === 'URGENT' || i.urgency === 'OVERDUE'
  ).length;
  const upcomingCount = serviceIntervals.filter((i) => i.urgency === 'UPCOMING').length;
  const normalCount = serviceIntervals.filter((i) => i.urgency === 'NORMAL').length;

  // Filtered list
  const filteredIntervals = useMemo(() => {
    if (filterUrgency === 'ALL') return serviceIntervals;
    if (filterUrgency === 'URGENT') {
      return serviceIntervals.filter((i) => i.urgency === 'URGENT' || i.urgency === 'OVERDUE');
    }
    return serviceIntervals.filter((i) => i.urgency === filterUrgency);
  }, [serviceIntervals, filterUrgency]);

  const getUrgencyBadge = (urgency: MachineServiceIntervalInfo['urgency']) => {
    switch (urgency) {
      case 'OVERDUE':
        return (
          <span className="rounded-full bg-red-500/20 border border-red-500/50 px-2.5 py-0.5 text-[10px] font-mono font-black text-red-300 animate-pulse flex items-center gap-1">
            <AlertOctagon className="h-3 w-3" />
            QUÁ HẠN BẢO DƯỠNG
          </span>
        );
      case 'URGENT':
        return (
          <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-red-300 animate-pulse flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            CẦN BẢO DƯỠNG GẤP (&lt;36H)
          </span>
        );
      case 'UPCOMING':
        return (
          <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-400" />
            SẮP ĐẾN KỲ (&lt;100H)
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            ĐANG AN TOÀN
          </span>
        );
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 p-5 shadow-2xl backdrop-blur-md transition-all duration-300">
      {/* 1. Header with Title & Summary Counters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
            <Timer className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Cảnh Báo Bảo Dưỡng Dự Đoán Theo Giờ Máy (Predictive Maintenance Alerts)
              </h3>
              <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Service Interval Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Giám sát tiến độ chu kỳ vận hành 500 giờ máy thực tế để cảnh báo trước các mốc thay thế linh kiện phòng ngừa
            </p>
          </div>
        </div>

        {/* Right side: 'Toggle All Maintenance Notifications' Switch & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* THE REQUESTED TOGGLE SWITCH */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 px-3 py-1.5 shadow-inner">
            <div className="flex items-center gap-1.5">
              {isAlertsActive ? (
                <BellRing className="h-4 w-4 text-emerald-400 animate-pulse" />
              ) : (
                <BellOff className="h-4 w-4 text-slate-500" />
              )}
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-slate-200 leading-tight">
                  Thông Báo Bảo Dưỡng Hạm Đội
                </span>
                <span className="text-[9px] font-mono leading-tight">
                  {isAlertsActive ? (
                    <span className="text-emerald-400 font-semibold">ĐANG BẬT (Fleet Active)</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">ĐÃ TẮT (Fleet Silenced)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Toggle Switch Pill */}
            <button
              type="button"
              role="switch"
              aria-checked={isAlertsActive}
              onClick={handleToggleAlerts}
              title={
                isAlertsActive
                  ? 'Bấm để tắt toàn bộ cảnh báo bảo dưỡng cho hạm đội máy trong xưởng'
                  : 'Bấm để bật lại cảnh báo bảo dưỡng cho toàn bộ thiết bị'
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                isAlertsActive ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span className="sr-only">Toggle All Maintenance Notifications</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isAlertsActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Urgent / Stable Badges */}
          {urgentCount > 0 ? (
            <div className="flex items-center gap-1.5 rounded-xl bg-red-950/60 border border-red-500/40 px-3 py-1.5 text-xs text-red-200 font-bold animate-pulse shadow-md shadow-red-950/30">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <span>{urgentCount} máy cần bảo dưỡng gấp</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Chu kỳ ổn định</span>
            </div>
          )}

          {upcomingCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 px-3 py-1.5 text-xs text-amber-300 font-medium">
              <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>{upcomingCount} máy sắp đến kỳ</span>
            </div>
          )}

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer"
            title={isExpanded ? 'Thu gọn danh sách' : 'Mở rộng danh sách'}
          >
            {isExpanded ? (
              <>
                <span>Thu gọn</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>Mở rộng ({serviceIntervals.length})</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Silenced Mode Notice Banner when switch is turned OFF */}
      {!isAlertsActive && (
        <div className="mt-3.5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-amber-950/20 px-4 py-2.5 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <BellOff className="h-4 w-4" />
            </div>
            <div>
              <span className="font-extrabold text-amber-300">
                CHẾ ĐỘ TẮT THÔNG BÁO BẢO DƯỠNG TOÀN XƯỞNG (FLEET ALERTS SILENCED)
              </span>
              <p className="text-[11px] text-amber-100/80 mt-0.5">
                Giám sát viên đã tạm tắt toàn bộ thông báo đẩy bảo dưỡng cho cả đội thiết bị. Hệ thống vẫn tiếp tục đếm giờ máy và tính toán tiến độ bình thường.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleAlerts}
            className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow transition cursor-pointer"
          >
            Bật Lại Ngay
          </button>
        </div>
      )}

      {/* 2. Expanded Body Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterUrgency('ALL')}
              className={`rounded-lg px-3 py-1 font-medium transition shrink-0 ${
                filterUrgency === 'ALL'
                  ? 'bg-slate-800 text-amber-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả thiết bị ({serviceIntervals.length})
            </button>
            <button
              onClick={() => setFilterUrgency('URGENT')}
              className={`rounded-lg px-3 py-1 font-medium transition shrink-0 flex items-center gap-1 ${
                filterUrgency === 'URGENT'
                  ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/40'
                  : 'text-slate-400 hover:text-red-300'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              Cần bảo dưỡng gấp ({urgentCount})
            </button>
            <button
              onClick={() => setFilterUrgency('UPCOMING')}
              className={`rounded-lg px-3 py-1 font-medium transition shrink-0 flex items-center gap-1 ${
                filterUrgency === 'UPCOMING'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <Clock className="h-3 w-3" />
              Sắp đến hạn ({upcomingCount})
            </button>
            <button
              onClick={() => setFilterUrgency('NORMAL')}
              className={`rounded-lg px-3 py-1 font-medium transition shrink-0 flex items-center gap-1 ${
                filterUrgency === 'NORMAL'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              Đang an toàn ({normalCount})
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntervals.map((info) => {
              const matchedDevice = devices.find((d) => d.id === info.deviceId);
              const isUrgent = info.urgency === 'URGENT' || info.urgency === 'OVERDUE';
              const isUpcoming = info.urgency === 'UPCOMING';

              return (
                <div
                  key={info.deviceId}
                  className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                    isUrgent
                      ? 'border-red-500/70 bg-gradient-to-br from-red-950/20 via-slate-900 to-slate-950 shadow-lg shadow-red-950/30 ring-1 ring-red-500/30'
                      : isUpcoming
                      ? 'border-amber-500/50 bg-gradient-to-br from-amber-950/15 via-slate-900 to-slate-950 shadow-md'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  {/* Top: Device Code, Name & Status Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                            {info.deviceCode}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            {info.deviceLocation.split('-')[0].trim()}
                          </span>
                          {!isAlertsActive && (
                            <span
                              className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.2 text-[9px] font-mono text-slate-400 flex items-center gap-0.5"
                              title="Thông báo bảo dưỡng cho máy này đang tạm tắt tiếng"
                            >
                              <BellOff className="h-2.5 w-2.5 text-slate-500" />
                              Tắt chuông
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-white text-sm sm:text-base mt-1.5 leading-snug line-clamp-1">
                          {info.deviceName}
                        </h4>
                      </div>

                      <div className="shrink-0">{getUrgencyBadge(info.urgency)}</div>
                    </div>

                    {/* Progress Bar of Service Interval */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>Chu kỳ:</span>
                          <strong className="text-slate-200 font-mono">
                            {info.hoursSinceLastService}h / {info.serviceIntervalCycleHours}h
                          </strong>
                        </span>

                        <span
                          className={`font-mono text-xs font-black ${
                            isUrgent
                              ? 'text-red-400'
                              : isUpcoming
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {info.progressPercentage}%
                        </span>
                      </div>

                      {/* Progress Bar with Alert Threshold highlight */}
                      <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isUrgent
                              ? 'bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 animate-pulse'
                              : isUpcoming
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                              : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                          }`}
                          style={{ width: `${info.progressPercentage}%` }}
                        ></div>
                      </div>

                      {/* Time Remaining Metric Indicator */}
                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        <span className="text-slate-400">
                          {isUrgent ? (
                            <span className="text-red-400 font-bold flex items-center gap-1">
                              🚨 Còn lại: {info.hoursRemaining} giờ máy!
                            </span>
                          ) : isUpcoming ? (
                            <span className="text-amber-300 font-medium">
                              ⏳ Còn lại: {info.hoursRemaining} giờ máy
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-medium">
                              ✓ Còn lại: {info.hoursRemaining} giờ máy
                            </span>
                          )}
                        </span>

                        <span className="text-slate-400 font-mono text-[10px]">
                          ~{info.estimatedDaysRemaining} ngày làm việc
                        </span>
                      </div>
                    </div>

                    {/* Service Task Preview */}
                    <div className="mt-3 rounded-xl bg-slate-900/60 border border-slate-800/80 p-2.5 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                        <Wrench className="h-3 w-3 text-amber-400 shrink-0" />
                        <span className="truncate">{info.serviceLevel}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                        {info.serviceTask}
                      </p>

                      {/* Spare parts tags */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {info.recommendedParts.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className="rounded bg-slate-950 border border-slate-800 px-1.5 py-0.5 text-[9px] text-purple-300 font-mono"
                          >
                            📦 {p.split('(')[0].trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Total Usage & Action Link */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Tổng giờ máy: <strong className="text-white">{info.totalUsageHours.toLocaleString()}h</strong>
                    </span>

                    <button
                      onClick={() => matchedDevice && onOpenMachineDetails(matchedDevice)}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition group cursor-pointer"
                    >
                      <span>Xem & Lên Lịch</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

