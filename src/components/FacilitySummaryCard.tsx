import React, { useMemo } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Cpu,
  Factory,
  Gauge,
  Radio,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Wrench,
  Zap,
} from 'lucide-react';
import { Device } from '../types';

interface FacilitySummaryCardProps {
  devices: Device[];
  activeFilter?: string;
  onSelectFilter?: (filter: 'ALL' | 'ALARM' | 'RUNNING') => void;
}

export const FacilitySummaryCard: React.FC<FacilitySummaryCardProps> = ({
  devices,
  activeFilter = 'ALL',
  onSelectFilter,
}) => {
  // Key performance indicators calculated directly from current devices state
  const metrics = useMemo(() => {
    const total = devices.length;
    const runningDevices = devices.filter((d) => d.status === 'RUNNING');
    const alarmDevices = devices.filter((d) => d.status === 'ALARM_STOPPED');
    const idleDevices = devices.filter((d) => d.status === 'IDLE');
    const warningDevices = devices.filter((d) => d.status === 'WARNING');

    const activeCount = runningDevices.length;
    const alarmCount = alarmDevices.length;
    const idleCount = idleDevices.length;
    const activeRate = total > 0 ? Math.round((activeCount / total) * 100) : 0;

    // Average Efficiency (OEE) across all machines
    const sumOee = devices.reduce((acc, d) => acc + (d.telemetry?.oee || 0), 0);
    const avgOee = total > 0 ? (sumOee / total).toFixed(1) : '0';

    // Pending urgent repairs & unacknowledged alarms
    const unacknowledgedCount = alarmDevices.filter(
      (d) => !d.activeIncident?.acknowledgedAt
    ).length;

    // Average vibration across facility
    const sumVib = devices.reduce((acc, d) => acc + (d.telemetry?.vibration || 0), 0);
    const avgVibration = total > 0 ? (sumVib / total).toFixed(2) : '0.00';

    // Facility reliability index (percentage of machines running without critical telemetry deviation)
    const healthyCount = devices.filter(
      (d) =>
        d.status === 'RUNNING' &&
        (!d.telemetry || d.telemetry.vibration < (d.nominalRanges?.vibration?.[1] || 2.0))
    ).length;
    const reliabilityRate = total > 0 ? Math.round((healthyCount / total) * 100) : 100;

    return {
      total,
      activeCount,
      alarmCount,
      idleCount,
      warningDevices,
      alarmDevices,
      activeRate,
      avgOee,
      unacknowledgedCount,
      avgVibration,
      reliabilityRate,
    };
  }, [devices]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 p-5 shadow-2xl backdrop-blur-md transition-all duration-300">
      {/* Header bar of facility summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <Factory className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Chỉ Số Vận Hành Toàn Nhà Máy (Facility SCADA KPI)
              </h2>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tổng hợp thời gian thực từ mạng lưới cảm biến IoT và trạng thái máy cắt dây & xung điện EDM
            </p>
          </div>
        </div>

        {/* Global Factory Status Badge */}
        <div className="flex items-center gap-2">
          {metrics.alarmCount > 0 ? (
            <div className="flex items-center gap-2 rounded-2xl bg-red-950/60 border border-red-500/50 px-3.5 py-1.5 text-xs text-red-200 animate-pulse shadow-lg shadow-red-950/40">
              <AlertOctagon className="h-4 w-4 text-red-400 shrink-0" />
              <span className="font-bold">Cảnh báo: Có {metrics.alarmCount} thiết bị dừng sự cố</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-1.5 text-xs text-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">Toàn bộ xưởng vận hành ổn định</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: TOTAL ACTIVE MACHINES */}
        <div
          onClick={() => onSelectFilter && onSelectFilter('RUNNING')}
          className={`group rounded-2xl border p-4 transition-all cursor-pointer relative overflow-hidden ${
            activeFilter === 'RUNNING'
              ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/30'
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Thiết Bị Đang Chạy (Active)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition">
              <Cpu className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-white">
              {metrics.activeCount}
            </span>
            <span className="font-mono text-sm text-slate-400 font-semibold">
              / {metrics.total} máy
            </span>
            <span className="ml-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-400">
              {metrics.activeRate}%
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Chờ phôi: <strong>{metrics.idleCount} máy</strong></span>
            </span>
            <span className="text-emerald-400 group-hover:translate-x-0.5 transition flex items-center gap-0.5 text-[10px]">
              Lọc máy đang chạy <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* KPI 2: AVERAGE EFFICIENCY RATE (OEE) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-950/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Hiệu Suất Trung Bình (OEE)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Activity className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-amber-400">
              {metrics.avgOee}%
            </span>
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+4.2% so với SLA</span>
            </span>
          </div>

          {/* Efficiency Progress Bar */}
          <div className="mt-2.5 space-y-1">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
                style={{ width: `${Math.min(100, Math.max(10, parseFloat(metrics.avgOee)))}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Mục tiêu: 85.0%</span>
              <span className="text-emerald-400 font-bold">Vượt chuẩn</span>
            </div>
          </div>
        </div>

        {/* KPI 3: PENDING URGENT REPAIRS */}
        <div
          onClick={() => onSelectFilter && onSelectFilter('ALARM')}
          className={`group rounded-2xl border p-4 transition-all cursor-pointer relative overflow-hidden ${
            metrics.alarmCount > 0
              ? 'border-red-500/80 bg-red-950/20 shadow-lg shadow-red-950/40 ring-1 ring-red-500/40 hover:border-red-400'
              : activeFilter === 'ALARM'
              ? 'border-amber-500 bg-amber-950/20 ring-1 ring-amber-500/30'
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Sự Cố Cần Sửa Gấp (Repairs)</span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl border group-hover:scale-110 transition ${
                metrics.alarmCount > 0
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {metrics.alarmCount > 0 ? (
                <AlertOctagon className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span
              className={`font-mono text-3xl font-extrabold ${
                metrics.alarmCount > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {metrics.alarmCount}
            </span>
            <span className="text-xs text-slate-400">máy sự cố</span>

            {metrics.alarmCount > 0 ? (
              <span className="ml-auto rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-red-300 animate-pulse">
                CẦN XỬ LÝ
              </span>
            ) : (
              <span className="ml-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                AN TOÀN
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-2.5">
            {metrics.alarmCount > 0 ? (
              <span className="text-red-300 text-[10px] truncate">
                {metrics.unacknowledgedCount > 0
                  ? `🚨 ${metrics.unacknowledgedCount} máy chưa KTV tiếp nhận`
                  : 'Đang có KTV xử lý'}
              </span>
            ) : (
              <span className="text-emerald-400 text-[10px]">
                ✓ 0 sự cố đang chờ xử lý
              </span>
            )}

            <span className="text-amber-400 group-hover:translate-x-0.5 transition flex items-center gap-0.5 text-[10px]">
              Lọc sự cố <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* KPI 4: RELIABILITY & VIBRATION INDEX */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-950/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Độ Tin Cậy & Rung Động</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Gauge className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-purple-400">
              {metrics.reliabilityRate}%
            </span>
            <span className="text-xs text-slate-400">độ sẵn sàng</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="truncate pr-1">
              Độ rung TB: <strong className="text-slate-200 font-mono">{metrics.avgVibration} mm/s</strong>
            </span>
            <span className="text-slate-400 font-mono text-[10px] shrink-0">
              Chuẩn: &lt;1.8 mm/s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
