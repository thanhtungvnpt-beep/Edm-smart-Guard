import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  Factory,
  FileSpreadsheet,
  Gauge,
  Radio,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wrench,
  Zap,
} from 'lucide-react';
import { Device } from '../types';
import { download30DayOperationalCSV } from '../utils/csvExportHelper';

interface FacilitySummaryCardProps {
  devices: Device[];
  activeFilter?: string;
  onSelectFilter?: (filter: 'ALL' | 'ALARM' | 'RUNNING') => void;
}

interface SparklineProps {
  id: string;
  data: number[];
  color: string;
  gradientFrom: string;
  gradientTo: string;
  height?: number;
  unit?: string;
  dayLabels?: string[];
}

const Sparkline: React.FC<SparklineProps> = ({
  id,
  data,
  color,
  gradientFrom,
  gradientTo,
  height = 34,
  unit = '',
  dayLabels = ['T-6', 'T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Hôm nay'],
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 240;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max === min ? 1 : max - min;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y, val, label: dayLabels[idx] || `Ngày ${idx + 1}` };
  });

  // Build SVG path
  const linePath = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    // Smooth line curve
    const prev = points[idx - 1];
    const cX1 = prev.x + (pt.x - prev.x) / 2;
    const cY1 = prev.y;
    const cX2 = prev.x + (pt.x - prev.x) / 2;
    const cY2 = pt.y;
    return `${acc} C ${cX1},${cY1} ${cX2},${cY2} ${pt.x},${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <div className="relative w-full pt-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-8 sm:h-9 overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientFrom} stopOpacity={0.4} />
            <stop offset="100%" stopColor={gradientTo} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Gradient fill underneath */}
        <path d={areaPath} fill={`url(#spark-${id})`} />

        {/* Trend line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover detection vertical line & hitboxes */}
        {points.map((pt, idx) => (
          <g key={idx} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
            <rect
              x={Math.max(0, pt.x - width / (data.length * 2))}
              y={0}
              width={width / data.length}
              height={height}
              fill="transparent"
              className="cursor-pointer"
            />
            {hoveredIdx === idx && (
              <>
                <line
                  x1={pt.x}
                  y1={0}
                  x2={pt.x}
                  y2={height}
                  stroke={color}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity={0.7}
                />
                <circle cx={pt.x} cy={pt.y} r={3.5} fill="#fff" stroke={color} strokeWidth="2" />
              </>
            )}
          </g>
        ))}

        {/* Last day dot indicator */}
        {hoveredIdx === null && (
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="3"
            fill="#ffffff"
            stroke={color}
            strokeWidth="2"
          />
        )}
      </svg>

      {/* Hover tooltip */}
      {hoveredIdx !== null ? (
        <div className="absolute -top-6 right-0 rounded bg-slate-900 border border-slate-700 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow-lg pointer-events-none">
          {points[hoveredIdx].label}: {points[hoveredIdx].val}
          {unit}
        </div>
      ) : null}
    </div>
  );
};

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

    // 7-DAY SPARKLINE TREND DATA SYNTHESIS (Anchored to current live metrics)
    const curOeeNum = parseFloat(avgOee) || 88.5;

    const sparklines = {
      activeMachines: [
        Math.max(1, activeCount - 1),
        Math.max(1, activeCount),
        Math.max(1, activeCount - 1),
        Math.max(1, activeCount),
        Math.max(1, activeCount),
        Math.max(1, activeCount - 1),
        activeCount,
      ],
      efficiencyOee: [
        Math.max(75, Math.round((curOeeNum - 3.8) * 10) / 10),
        Math.max(76, Math.round((curOeeNum - 2.5) * 10) / 10),
        Math.max(77, Math.round((curOeeNum - 1.2) * 10) / 10),
        Math.max(78, Math.round((curOeeNum - 0.4) * 10) / 10),
        Math.max(78, Math.round((curOeeNum - 1.5) * 10) / 10),
        Math.max(79, Math.round((curOeeNum - 0.6) * 10) / 10),
        curOeeNum,
      ],
      pendingRepairs: [
        alarmCount > 0 ? 1 : 2,
        alarmCount > 0 ? 2 : 1,
        alarmCount > 0 ? 1 : 0,
        alarmCount > 0 ? 0 : 1,
        alarmCount > 0 ? 1 : 0,
        alarmCount > 0 ? 1 : 0,
        alarmCount,
      ],
      reliabilityScore: [
        Math.max(80, reliabilityRate - 6),
        Math.max(82, reliabilityRate - 4),
        Math.max(85, reliabilityRate - 2),
        Math.max(88, reliabilityRate - 1),
        Math.max(87, reliabilityRate - 3),
        Math.max(90, reliabilityRate - 1),
        reliabilityRate,
      ],
    };

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
      sparklines,
    };
  }, [devices]);

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        download30DayOperationalCSV(devices);
        setIsExporting(false);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3500);
      } catch (err) {
        console.error('Export CSV error:', err);
        setIsExporting(false);
      }
    }, 450);
  };

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
              Tổng hợp thời gian thực từ mạng lưới cảm biến IoT kèm biểu đồ xu hướng 7 ngày gần nhất
            </p>
          </div>
        </div>

        {/* Global Factory Status Badge & Export CSV Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50 ${
              exportSuccess
                ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-white'
            }`}
            title="Tải xuống tệp CSV 30 ngày dữ liệu vận hành (OEE, thời gian dừng, số sự cố, chi phí)"
          >
            {exportSuccess ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Đã Tải Báo Cáo CSV!</span>
              </>
            ) : isExporting ? (
              <>
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
                <span>Đang xuất CSV...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span>Xuất CSV (30 Ngày)</span>
                <Download className="h-3 w-3 text-slate-400" />
              </>
            )}
          </button>

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

      {/* KPI Cards Grid with 7-Day Sparkline Trends */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: TOTAL ACTIVE MACHINES */}
        <div
          onClick={() => onSelectFilter && onSelectFilter('RUNNING')}
          className={`group rounded-2xl border p-4 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeFilter === 'RUNNING'
              ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/30'
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950/90'
          }`}
        >
          <div>
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

            {/* 7-Day Sparkline Chart */}
            <div className="mt-2 pt-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                <span className="font-medium">Xu hướng 7 ngày:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  Ổn định
                </span>
              </div>
              <Sparkline
                id="active"
                data={metrics.sparklines.activeMachines}
                color="#10b981"
                gradientFrom="#10b981"
                gradientTo="#059669"
                unit=" máy"
              />
            </div>
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
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-950/90 flex flex-col justify-between">
          <div>
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

            {/* 7-Day Sparkline Chart */}
            <div className="mt-2 pt-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                <span className="font-medium">Xu hướng OEE 7 ngày:</span>
                <span className="text-amber-400 font-bold font-mono">Mục tiêu: 85%</span>
              </div>
              <Sparkline
                id="oee"
                data={metrics.sparklines.efficiencyOee}
                color="#f59e0b"
                gradientFrom="#f59e0b"
                gradientTo="#d97706"
                unit="%"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="text-slate-400 text-[10px]">
              Tiêu chuẩn ISO 9001
            </span>
            <span className="text-emerald-400 font-mono font-bold text-[10px]">
              Vượt chuẩn +{Math.max(0, parseFloat(metrics.avgOee) - 85).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* KPI 3: PENDING URGENT REPAIRS */}
        <div
          onClick={() => onSelectFilter && onSelectFilter('ALARM')}
          className={`group rounded-2xl border p-4 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            metrics.alarmCount > 0
              ? 'border-red-500/80 bg-red-950/20 shadow-lg shadow-red-950/40 ring-1 ring-red-500/40 hover:border-red-400'
              : activeFilter === 'ALARM'
              ? 'border-amber-500 bg-amber-950/20 ring-1 ring-amber-500/30'
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950/90'
          }`}
        >
          <div>
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

            {/* 7-Day Sparkline Chart */}
            <div className="mt-2 pt-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                <span className="font-medium">Số sự cố 7 ngày qua:</span>
                <span className={metrics.alarmCount > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {metrics.alarmCount > 0 ? 'Có phát sinh' : 'Kiểm soát tốt'}
                </span>
              </div>
              <Sparkline
                id="alarm"
                data={metrics.sparklines.pendingRepairs}
                color={metrics.alarmCount > 0 ? '#ef4444' : '#10b981'}
                gradientFrom={metrics.alarmCount > 0 ? '#ef4444' : '#10b981'}
                gradientTo={metrics.alarmCount > 0 ? '#b91c1c' : '#059669'}
                unit=" sự cố"
              />
            </div>
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
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-950/90 flex flex-col justify-between">
          <div>
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

            {/* 7-Day Sparkline Chart */}
            <div className="mt-2 pt-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                <span className="font-medium">Độ sẵn sàng 7 ngày:</span>
                <span className="text-purple-400 font-bold font-mono">
                  {metrics.avgVibration} mm/s
                </span>
              </div>
              <Sparkline
                id="reliability"
                data={metrics.sparklines.reliabilityScore}
                color="#a855f7"
                gradientFrom="#a855f7"
                gradientTo="#7e22ce"
                unit="%"
              />
            </div>
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
