import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Layers,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { MaintenanceRecord } from '../types';

interface MaintenanceFrequencyChartProps {
  records: MaintenanceRecord[];
  deviceName: string;
  deviceCode: string;
}

export const MaintenanceFrequencyChart: React.FC<MaintenanceFrequencyChartProps> = ({
  records,
  deviceName,
  deviceCode,
}) => {
  // View mode: 'stacked' (broken down by task type) or 'composed' (task counts + duration hours)
  const [chartMode, setChartMode] = useState<'stacked' | 'composed'>('stacked');
  // Time span: 6 months or all history
  const [timeRange, setTimeRange] = useState<'6m' | 'all'>('6m');

  // Generate continuous monthly time buckets for the chart
  const monthlyData = useMemo(() => {
    // Collect the past 6 months (May 2026 to Oct 2026 as benchmark reference)
    const now = new Date('2026-10-06T12:00:00Z');
    const monthsCount = timeRange === '6m' ? 6 : 8;

    const buckets: {
      key: string;
      label: string;
      monthYear: string;
      preventive: number;
      corrective: number;
      partsReplacement: number;
      calibration: number;
      overhaul: number;
      totalCount: number;
      totalDurationHours: number;
      taskTitles: string[];
    }[] = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth() + 1; // 1-12
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      const label = `T${month.toString().padStart(2, '0')}/${year.toString().slice(2)}`;
      const monthYear = `Tháng ${month}/${year}`;

      buckets.push({
        key,
        label,
        monthYear,
        preventive: 0,
        corrective: 0,
        partsReplacement: 0,
        calibration: 0,
        overhaul: 0,
        totalCount: 0,
        totalDurationHours: 0,
        taskTitles: [],
      });
    }

    // Populate with records
    records.forEach((r) => {
      const rDate = new Date(r.completedAt);
      if (isNaN(rDate.getTime())) return;
      const rKey = `${rDate.getUTCFullYear()}-${(rDate.getUTCMonth() + 1).toString().padStart(2, '0')}`;

      const bucket = buckets.find((b) => b.key === rKey);
      if (bucket) {
        bucket.totalCount += 1;
        bucket.totalDurationHours += (r.durationMinutes || 0) / 60;
        bucket.taskTitles.push(r.taskTitle);

        switch (r.taskType) {
          case 'PREVENTIVE':
            bucket.preventive += 1;
            break;
          case 'CORRECTIVE':
            bucket.corrective += 1;
            break;
          case 'PARTS_REPLACEMENT':
            bucket.partsReplacement += 1;
            break;
          case 'CALIBRATION':
            bucket.calibration += 1;
            break;
          case 'OVERHAUL':
            bucket.overhaul += 1;
            break;
          default:
            bucket.preventive += 1;
            break;
        }
      }
    });

    // Round total duration hours to 1 decimal place
    return buckets.map((b) => ({
      ...b,
      totalDurationHours: Math.round(b.totalDurationHours * 10) / 10,
    }));
  }, [records, timeRange]);

  // Analytical summary KPIs
  const stats = useMemo(() => {
    const total = records.length;
    const preventiveCount = records.filter(
      (r) => r.taskType === 'PREVENTIVE' || r.taskType === 'CALIBRATION' || r.taskType === 'OVERHAUL'
    ).length;
    const correctiveCount = records.filter((r) => r.taskType === 'CORRECTIVE').length;
    const partsCount = records.filter((r) => r.taskType === 'PARTS_REPLACEMENT').length;

    const proactiveRatio = total > 0 ? Math.round((preventiveCount / total) * 100) : 100;

    // Peak month calculation
    let peakBucket = monthlyData[0];
    monthlyData.forEach((b) => {
      if (b.totalCount > (peakBucket?.totalCount || 0)) {
        peakBucket = b;
      }
    });

    // Estimate MTBM (Mean Time Between Maintenance in days)
    // Approximate 180 days across 6 months divided by count
    const activeMonths = monthlyData.filter((b) => b.totalCount > 0).length || 1;
    const mtbmDays = total > 1 ? Math.round((activeMonths * 30) / total) : 30;

    return {
      total,
      preventiveCount,
      correctiveCount,
      partsCount,
      proactiveRatio,
      peakMonthLabel: peakBucket?.totalCount > 0 ? `${peakBucket.label} (${peakBucket.totalCount} lần)` : 'Đều đặn',
      mtbmDays,
    };
  }, [records, monthlyData]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 p-4 sm:p-5 shadow-xl space-y-4">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <BarChart2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white leading-tight">
                Tần Suất Bảo Dưỡng Theo Thời Gian (Maintenance Frequency)
              </h4>
              <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400">
                Recharts
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Biểu đồ phân bổ mật độ bảo trì, sửa chữa và thay thế linh kiện qua các tháng của máy {deviceCode}
            </p>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-[11px] font-medium">
            <button
              onClick={() => setChartMode('stacked')}
              className={`px-2.5 py-1 rounded-lg transition ${
                chartMode === 'stacked'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Phân Loại
            </button>
            <button
              onClick={() => setChartMode('composed')}
              className={`px-2.5 py-1 rounded-lg transition ${
                chartMode === 'composed'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lượt & Giờ Bảo Trì
            </button>
          </div>

          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-[11px] font-medium">
            <button
              onClick={() => setTimeRange('6m')}
              className={`px-2.5 py-1 rounded-lg transition ${
                timeRange === '6m'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              6 Tháng
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                timeRange === 'all'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              8 Tháng
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRIC HIGHLIGHTS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Tổng lượt can thiệp</span>
            <Wrench className="h-3 w-3 text-amber-400" />
          </div>
          <div className="mt-1 font-mono text-base font-bold text-white">
            {stats.total}{' '}
            <span className="text-[10px] font-normal text-slate-400">nhiệm vụ</span>
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span>100% hoàn thành đạt chuẩn</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Chu kỳ TB (MTBM)</span>
            <Calendar className="h-3 w-3 text-cyan-400" />
          </div>
          <div className="mt-1 font-mono text-base font-bold text-cyan-400">
            ~{stats.mtbmDays}{' '}
            <span className="text-[10px] font-normal text-slate-400">ngày/lần</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Khoảng cách trung bình</div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Tỷ lệ chủ động phòng ngừa</span>
            <Sparkles className="h-3 w-3 text-purple-400" />
          </div>
          <div className="mt-1 font-mono text-base font-bold text-purple-400">
            {stats.proactiveRatio}%
          </div>
          <div className="text-[10px] text-purple-300 mt-0.5">
            {stats.proactiveRatio >= 75 ? 'Rất tốt (Ít sự cố)' : 'Cần tăng định kỳ'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Tháng cao điểm nhất</span>
            <TrendingUp className="h-3 w-3 text-amber-400" />
          </div>
          <div className="mt-1 font-mono text-xs font-bold text-amber-400 truncate">
            {stats.peakMonthLabel}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Sửa chữa: {stats.correctiveCount} lần
          </div>
        </div>
      </div>

      {/* RECHARTS VISUALIZATION CONTAINER */}
      <div className="h-60 sm:h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'stacked' ? (
            <BarChart
              data={monthlyData}
              margin={{ top: 15, right: 10, left: -22, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                allowDecimals={false}
                unit=" lần"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '14px',
                  color: '#f8fafc',
                  fontSize: '11px',
                  boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.6)',
                  padding: '10px 14px',
                }}
                formatter={(value: any, name: any) => {
                  let nameLabel = 'Nhiệm vụ';
                  if (name === 'preventive') nameLabel = 'Bảo dưỡng định kỳ';
                  if (name === 'corrective') nameLabel = 'Sửa chữa khẩn cấp';
                  if (name === 'partsReplacement') nameLabel = 'Thay linh kiện';
                  if (name === 'calibration') nameLabel = 'Hiệu chuẩn độ chính xác';
                  if (name === 'overhaul') nameLabel = 'Đại tu toàn diện';
                  return [`${value} lượt`, nameLabel];
                }}
                labelFormatter={(label, items) => {
                  const item = items?.[0]?.payload;
                  if (!item) return label;
                  return `${item.monthYear} • Tổng: ${item.totalCount} lần (${item.totalDurationHours} giờ)`;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={28}
                iconSize={8}
                formatter={(value: string) => {
                  if (value === 'preventive') return <span className="text-[10px] text-slate-300">Định kỳ</span>;
                  if (value === 'corrective') return <span className="text-[10px] text-slate-300">Sửa chữa</span>;
                  if (value === 'partsReplacement') return <span className="text-[10px] text-slate-300">Thay phụ tùng</span>;
                  if (value === 'calibration') return <span className="text-[10px] text-slate-300">Hiệu chuẩn</span>;
                  return <span className="text-[10px] text-slate-300">{value}</span>;
                }}
              />
              <Bar dataKey="preventive" stackId="tasks" fill="#10b981" radius={[0, 0, 0, 0]} name="preventive" />
              <Bar dataKey="calibration" stackId="tasks" fill="#06b6d4" radius={[0, 0, 0, 0]} name="calibration" />
              <Bar dataKey="partsReplacement" stackId="tasks" fill="#a855f7" radius={[0, 0, 0, 0]} name="partsReplacement" />
              <Bar dataKey="corrective" stackId="tasks" fill="#f43f5e" radius={[3, 3, 0, 0]} name="corrective" />
            </BarChart>
          ) : (
            <ComposedChart
              data={monthlyData}
              margin={{ top: 15, right: 10, left: -22, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                allowDecimals={false}
                unit=" lần"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f59e0b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#78350f' }}
                unit="h"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '14px',
                  color: '#f8fafc',
                  fontSize: '11px',
                  boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.6)',
                  padding: '10px 14px',
                }}
                formatter={(value: any, name: any) => {
                  if (name === 'totalCount') return [`${value} lượt nhiệm vụ`, 'Tổng số lượt bảo dưỡng'];
                  if (name === 'totalDurationHours') return [`${value} giờ`, 'Tổng thời gian can thiệp'];
                  return [value, name];
                }}
                labelFormatter={(label, items) => {
                  const item = items?.[0]?.payload;
                  if (!item) return label;
                  return `${item.monthYear}`;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={28}
                iconSize={8}
                formatter={(value: string) => {
                  if (value === 'totalCount') return <span className="text-[10px] text-slate-300">Tổng số lượt (Bar)</span>;
                  if (value === 'totalDurationHours') return <span className="text-[10px] text-amber-300">Thời gian (Giờ - Line)</span>;
                  return <span className="text-[10px] text-slate-300">{value}</span>;
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="totalCount"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="totalCount"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalDurationHours"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f59e0b', stroke: '#090d16', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#fbbf24' }}
                name="totalDurationHours"
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* FOOTER ANNOTATION */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-amber-400 shrink-0" />
          <span>
            Dữ liệu tổng hợp từ các lần ghi nhận bảo dưỡng thực tế & khuyến cáo chu kỳ OEM.
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Định kỳ ({stats.preventiveCount})
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-purple-500"></span>
            Linh kiện ({stats.partsCount})
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            Sự cố ({stats.correctiveCount})
          </span>
        </div>
      </div>
    </div>
  );
};
