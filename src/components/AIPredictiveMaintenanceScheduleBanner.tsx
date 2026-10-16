import React, { useState, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Wrench,
  CheckCircle2,
  TrendingUp,
  Sliders,
  RefreshCw,
  Search,
  Filter,
  Info,
  ArrowRight,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { Device } from '../types';
import {
  calculateFleetAIPredictiveSchedule,
  AIPredictiveMaintenanceScheduleItem,
} from '../utils/aiPredictiveMaintenanceScheduler';

interface AIPredictiveMaintenanceScheduleBannerProps {
  devices: Device[];
  onOpenPredictiveDetails: (device: Device) => void;
  onSetMaintenance?: (deviceId: string) => void;
  onQuickSyncDirect?: (deviceId: string) => void;
  onToast?: (msg: string) => void;
}

export const AIPredictiveMaintenanceScheduleBanner: React.FC<AIPredictiveMaintenanceScheduleBannerProps> = ({
  devices,
  onOpenPredictiveDetails,
  onSetMaintenance,
  onQuickSyncDirect,
  onToast,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'URGENT' | 'WARNING' | 'NORMAL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fleetSummary = useMemo(() => {
    return calculateFleetAIPredictiveSchedule(devices);
  }, [devices]);

  const filteredItems = useMemo(() => {
    return fleetSummary.schedule.filter((item) => {
      // Urgency filter
      if (filterUrgency === 'URGENT' && item.urgency !== 'CRITICAL_URGENT') return false;
      if (filterUrgency === 'WARNING' && item.urgency !== 'HIGH_WARNING') return false;
      if (filterUrgency === 'NORMAL' && item.urgency !== 'SCHEDULED_NORMAL' && item.urgency !== 'OPTIMAL') return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.deviceCode.toLowerCase().includes(q) ||
          item.deviceName.toLowerCase().includes(q) ||
          item.deviceLocation.toLowerCase().includes(q) ||
          item.aiDiagnosticSummary.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [fleetSummary.schedule, filterUrgency, searchTerm]);

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 shadow-xl backdrop-blur-sm overflow-hidden transition-all duration-300">
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3 sm:px-5 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-inner">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                Lịch Dự Báo Bảo Trì AI: Phân Tích Rung Động &amp; Dòng Điện Cảm Biến
              </h3>
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                <Sparkles className="h-3 w-3" />
                AI Model 48H
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tự động dự báo thời điểm máy cần bảo trì dựa trên biến thiên rung động cơ khí (mm/s) và dòng điện hồ quang EDM (A)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fleetSummary.urgentCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/50 px-3 py-1 text-xs font-bold text-red-300 shadow-sm animate-pulse">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              {fleetSummary.urgentCount} máy cần bảo trì &lt; 24h
            </span>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
          >
            <span>{isExpanded ? 'Thu gọn lịch' : 'Mở lịch dự kiến'}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* QUICK KPI HIGHLIGHT STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:px-5 sm:py-3 border-b border-slate-800/60 bg-slate-950/20 text-xs">
        <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 px-3 py-2">
          <Clock className="h-4 w-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block truncate">Thời điểm cần bảo trì sớm nhất:</span>
            <span className="font-mono text-xs font-bold text-amber-300">
              {fleetSummary.schedule[0] ? `Trong ~${fleetSummary.schedule[0].hoursRemaining}h (${fleetSummary.schedule[0].deviceCode})` : 'Chưa có'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 px-3 py-2">
          <Activity className="h-4 w-4 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block truncate">Rung động TB toàn xưởng:</span>
            <span className="font-mono text-xs font-bold text-cyan-300">
              {fleetSummary.avgVibration} mm/s
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 px-3 py-2">
          <Zap className="h-4 w-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block truncate">Dòng điện cảm biến TB:</span>
            <span className="font-mono text-xs font-bold text-amber-300">
              {fleetSummary.avgCurrent} A
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 px-3 py-2">
          <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block truncate">Phân loại cấp bách:</span>
            <span className="font-mono text-xs font-bold text-slate-200">
              <span className="text-red-400">{fleetSummary.urgentCount} Khẩn</span> •{' '}
              <span className="text-amber-400">{fleetSummary.warningCount} Cảnh báo</span> •{' '}
              <span className="text-emerald-400">{fleetSummary.normalCount} Định kỳ</span>
            </span>
          </div>
        </div>
      </div>

      {/* EXPANDED SCHEDULE CONTENT */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* FILTER & SEARCH BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                Lọc mức độ:
              </span>
              <button
                onClick={() => setFilterUrgency('ALL')}
                className={`rounded-xl px-2.5 py-1 font-semibold transition ${
                  filterUrgency === 'ALL'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Tất cả ({fleetSummary.schedule.length})
              </button>
              <button
                onClick={() => setFilterUrgency('URGENT')}
                className={`rounded-xl px-2.5 py-1 font-semibold transition ${
                  filterUrgency === 'URGENT'
                    ? 'bg-red-500 text-white font-bold shadow'
                    : 'bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20'
                }`}
              >
                🚨 Cấp bách &lt; 24h ({fleetSummary.urgentCount})
              </button>
              <button
                onClick={() => setFilterUrgency('WARNING')}
                className={`rounded-xl px-2.5 py-1 font-semibold transition ${
                  filterUrgency === 'WARNING'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                ⚠️ Cảnh báo 24h-72h ({fleetSummary.warningCount})
              </button>
              <button
                onClick={() => setFilterUrgency('NORMAL')}
                className={`rounded-xl px-2.5 py-1 font-semibold transition ${
                  filterUrgency === 'NORMAL'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
              >
                🛡️ Định kỳ &gt; 72h ({fleetSummary.normalCount})
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Tìm mã máy, tên máy, vị trí..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-56 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-1.5 pl-8 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>
          </div>

          {/* SCHEDULE ITEMS LIST */}
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400">
                Không tìm thấy máy nào phù hợp với bộ lọc tìm kiếm.
              </div>
            ) : (
              filteredItems.map((item) => {
                const device = devices.find((d) => d.id === item.deviceId);
                const isItemUrgent = item.urgency === 'CRITICAL_URGENT';
                const isItemWarning = item.urgency === 'HIGH_WARNING';

                return (
                  <div
                    key={item.deviceId}
                    className={`rounded-xl border p-3.5 transition-all duration-200 hover:border-slate-600 ${
                      isItemUrgent
                        ? 'border-red-500/60 bg-red-950/20 shadow-sm'
                        : isItemWarning
                        ? 'border-amber-500/50 bg-amber-950/15'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Machine & Schedule Date */}
                      <div className="flex items-start sm:items-center gap-3 min-w-[280px]">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold border ${
                            isItemUrgent
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : isItemWarning
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-slate-800 text-slate-200 border-slate-700'
                          }`}
                        >
                          {item.deviceCode}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm hover:text-amber-400 transition cursor-pointer" onClick={() => device && onOpenPredictiveDetails(device)}>
                              {item.deviceName}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                                isItemUrgent
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : isItemWarning
                                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                              }`}
                            >
                              {isItemUrgent ? 'CẤP BÁCH' : isItemWarning ? 'CẢNH BÁO' : 'ĐỊNH KỲ'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {item.deviceModel} • {item.deviceLocation}
                          </div>
                        </div>
                      </div>

                      {/* Scheduled Time Countdown Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="rounded-xl bg-slate-950/60 border border-slate-800/90 px-3 py-2 text-xs">
                          <span className="text-[10px] text-slate-400 block">Lịch dự kiến bảo trì:</span>
                          <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400 text-xs sm:text-sm">
                            <Calendar className="h-3.5 w-3.5 text-amber-400" />
                            <span>{item.predictedDateFormatted}</span>
                          </div>
                          <div className="text-[11px] text-slate-300 mt-0.5">
                            Còn: <strong className="text-white font-mono">{item.hoursRemaining}h</strong> ({item.predictedShift})
                          </div>
                        </div>

                        {/* Dual Sensors: Vibration & Current */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {/* Vibration */}
                          <div className="rounded-xl bg-slate-950/60 border border-slate-800/90 px-2.5 py-1.5 min-w-[125px]">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3 text-cyan-400" />
                                Rung động
                              </span>
                              <span className={`font-bold ${item.vibrationAnalysis.status === 'CRITICAL' ? 'text-red-400' : item.vibrationAnalysis.status === 'ELEVATED' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {item.vibrationAnalysis.status === 'CRITICAL' ? 'Nguy hiểm' : item.vibrationAnalysis.status === 'ELEVATED' ? 'Rung cao' : 'Ổn định'}
                              </span>
                            </div>
                            <div className="mt-0.5 font-mono font-bold text-white text-xs">
                              {item.vibrationAnalysis.currentValue.toFixed(2)} mm/s
                              <span className="text-[10px] text-slate-400 font-normal ml-1">
                                (Max {item.vibrationAnalysis.nominalRange[1]})
                              </span>
                            </div>
                          </div>

                          {/* Current */}
                          <div className="rounded-xl bg-slate-950/60 border border-slate-800/90 px-2.5 py-1.5 min-w-[125px]">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-amber-400" />
                                Dòng cảm biến
                              </span>
                              <span className={`font-bold ${item.currentAnalysis.status === 'CRITICAL' ? 'text-red-400' : item.currentAnalysis.status === 'ELEVATED' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {item.currentAnalysis.status === 'CRITICAL' ? 'Quá dòng' : item.currentAnalysis.status === 'ELEVATED' ? 'Bất thường' : 'Đạt'}
                              </span>
                            </div>
                            <div className="mt-0.5 font-mono font-bold text-white text-xs">
                              {item.currentAnalysis.currentValue.toFixed(1)} A
                              <span className="text-[10px] text-slate-400 font-normal ml-1">
                                ({item.currentAnalysis.sparkStabilityIndex}% ổn định)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                        {device && (
                          <button
                            onClick={() => onOpenPredictiveDetails(device)}
                            className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-300 transition active:scale-95"
                            title="Xem chi tiết phân tích đồ thị rung động & dòng điện phóng tia lửa"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Chi Tiết AI</span>
                          </button>
                        )}

                        {onSetMaintenance && item.deviceStatus !== 'MAINTENANCE' && (
                          <button
                            onClick={() => {
                              onSetMaintenance(item.deviceId);
                              onToast?.(`Đã đưa máy ${item.deviceCode} vào trạng thái bảo trì!`);
                            }}
                            className="flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-500/20 hover:bg-blue-500/30 px-3 py-2 text-xs font-semibold text-blue-300 transition active:scale-95"
                            title="Xác nhận đưa máy vào bảo trì ngay theo lịch AI"
                          >
                            <Wrench className="h-3.5 w-3.5 text-blue-400" />
                            <span>Đặt Bảo Trì</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* AI DIAGNOSTIC INSIGHT ROW */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-300">
                      <div className="flex items-start sm:items-center gap-2">
                        <span className="font-semibold text-amber-400 shrink-0">💡 AI Dự báo:</span>
                        <p className="line-clamp-1">{item.aiDiagnosticSummary}</p>
                      </div>
                      <div className="text-slate-400 shrink-0">
                        Phụ tùng cần:{' '}
                        <span className="text-slate-200 font-medium">
                          {item.recommendedSpareParts[0] || 'Kiểm tra bôi trơn định kỳ'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
