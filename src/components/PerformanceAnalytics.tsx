import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Download,
  Droplets,
  FileSpreadsheet,
  Filter,
  Info,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wrench,
  Zap,
} from 'lucide-react';
import { Device } from '../types';
import { download30DayOperationalCSV } from '../utils/csvExportHelper';
import { getStoredReminders } from '../utils/maintenanceReminderData';
import { getMachineScheduledTasks } from '../utils/serviceScheduleData';

interface PerformanceAnalyticsProps {
  devices: Device[];
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ devices }) => {
  const [selectedMachine, setSelectedMachine] = useState<string>('ALL');
  const [activeMetric, setActiveMetric] = useState<'uptime' | 'oee' | 'downtime' | 'forecast'>('downtime');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [downtimeThreshold, setDowntimeThreshold] = useState<number>(120); // 120 minutes = 2 hours

  // Calculate equivalent uptime threshold for 24h day (1440 mins)
  const uptimeCriticalThreshold = useMemo(() => {
    return Math.round(((1440 - downtimeThreshold) / 1440) * 1000) / 10;
  }, [downtimeThreshold]);

  // Generate realistic 30-day historical data
  const historyData = useMemo(() => {
    const data = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

      // Base uptime with realistic factory fluctuations
      let baseUptime = 96.2;
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        baseUptime = 98.4;
      }

      const noise = Math.sin(i * 1.7) * 2.8 + Math.cos(i * 0.9) * 1.5;
      let uptime = Math.min(99.8, Math.max(88.5, baseUptime + noise));

      // Problematic days with significant stoppage:
      // Day 18 (approx 12 days ago): major wire break and spark-gap short
      // Day 6 (approx 24 days ago): dielectric pressure pump failure
      let problemMachine = '';
      let problemCause = '';
      if (i === 18) {
        uptime = 89.2; // 156 mins downtime (> 2.5 hours)
        problemMachine = 'EDM-W01 (Makino U6 H.E.A.T)';
        problemCause = 'Đứt dây đồng & kẹt cặn xỉ khe phóng điện (E-102)';
      }
      if (i === 6) {
        uptime = 90.8; // 132 mins downtime (> 2.2 hours)
        problemMachine = 'EDM-W02 (Sodick ALC600G)';
        problemCause = 'Tụt áp suất bơm dung dịch điện môi & nghẹt lọc (ALARM-204)';
      }

      const downtimeMinutes = Math.round((100 - uptime) * 14.4); // 1% = 14.4 mins in 24h
      const oee = Math.round((uptime * 0.94 + Math.sin(i) * 1.8) * 10) / 10;
      const isExceeded = downtimeMinutes >= downtimeThreshold;

      data.push({
        date: dayStr,
        fullDate: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        uptime: Math.round(uptime * 10) / 10,
        targetUptime: 95.0,
        oee: Math.min(98, Math.max(82, oee)),
        downtimeMinutes,
        isExceeded,
        problemMachine,
        problemCause,
      });
    }
    return data;
  }, [downtimeThreshold]);

  // List of days where downtime exceeded threshold
  const exceededDays = useMemo(() => {
    return historyData.filter((d) => d.isExceeded);
  }, [historyData]);

  // Root cause breakdown over 30 days
  const breakdownCausesData = useMemo(() => {
    return [
      { name: 'Đứt dây cắt (Spark-gap)', incidents: 14, color: '#f59e0b', avgMttr: 22 },
      { name: 'Tụt áp suất điện môi', incidents: 8, color: '#06b6d4', avgMttr: 18 },
      { name: 'Quá nhiệt khối IGBT', incidents: 5, color: '#ef4444', avgMttr: 35 },
      { name: 'Kẹt van một chiều trục Z', incidents: 4, color: '#8b5cf6', avgMttr: 28 },
      { name: 'Bảo dưỡng định kỳ', incidents: 6, color: '#10b981', avgMttr: 45 },
    ];
  }, []);

  // Summary Metrics
  const avgUptime = useMemo(() => {
    const sum = historyData.reduce((acc, curr) => acc + curr.uptime, 0);
    return (sum / historyData.length).toFixed(1);
  }, [historyData]);

  const avgOee = useMemo(() => {
    const sum = historyData.reduce((acc, curr) => acc + curr.oee, 0);
    return (sum / historyData.length).toFixed(1);
  }, [historyData]);

  const totalDowntimeHours = useMemo(() => {
    const mins = historyData.reduce((acc, curr) => acc + curr.downtimeMinutes, 0);
    return (mins / 60).toFixed(0);
  }, [historyData]);

  // 7-Day Forward Operational Performance (Uptime) Forecast based on historical trends & current maintenance alerts
  const forecast7DaysData = useMemo(() => {
    // Current date benchmark: 2026-10-06
    const today = new Date('2026-10-06T12:00:00Z');
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

    const allReminders = getStoredReminders().filter((r) => r.isActive);
    const targetDevices = selectedMachine === 'ALL' ? devices : devices.filter((d) => d.id === selectedMachine);
    const fleetSize = Math.max(1, targetDevices.length);
    const baseHistoricalUptime = Number(avgUptime) || 96.2;

    const forecast = [];

    for (let i = 1; i <= 7; i++) {
      const forecastDate = new Date(today);
      forecastDate.setUTCDate(today.getUTCDate() + i);

      const year = forecastDate.getUTCFullYear();
      const month = forecastDate.getUTCMonth() + 1;
      const day = forecastDate.getUTCDate();
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const shortDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
      const dayOfWeekIndex = forecastDate.getUTCDay();
      const dayName = dayNames[dayOfWeekIndex];
      const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6;

      const matchingTasks: string[] = [];
      let totalPlannedDowntimeMins = 0;

      targetDevices.forEach((dev) => {
        // Scheduled service tasks
        const devTasks = getMachineScheduledTasks(dev);
        devTasks
          .filter((t) => t.dueDate === dateStr)
          .forEach((t) => {
            matchingTasks.push(`[${dev.code}] ${t.taskTitle}`);
            totalPlannedDowntimeMins += t.estimatedDurationMinutes || 60;
          });

        // Reminders due
        const devReminders = allReminders.filter((r) => r.deviceId === dev.id && r.nextDueDate === dateStr);
        devReminders.forEach((r) => {
          matchingTasks.push(`[${dev.code}] Nhắc nhở: ${r.componentName}`);
          totalPlannedDowntimeMins += r.intervalType === 'CALENDAR_DAYS' ? 45 : 30;
        });

        // Active incidents on day 1 or 2
        if (i <= 2 && (dev.status === 'ALARM_STOPPED' || dev.activeIncident)) {
          matchingTasks.push(`[${dev.code}] ⚠️ Khắc phục sự cố: ${dev.activeIncident?.errorTitle || 'Dừng máy'}`);
          totalPlannedDowntimeMins += 50;
        }
      });

      // Calculate planned downtime impact: 1% uptime = 14.4 mins in 24h
      const avgMachineDowntime = totalPlannedDowntimeMins / fleetSize;
      const plannedDowntimeImpactPct = (avgMachineDowntime / 1440) * 100;
      const weekendBoost = isWeekend ? 1.4 : 0;
      const stochasticVariance = Math.sin(i * 1.5) * 0.35;

      let predictedUptime = baseHistoricalUptime + weekendBoost - plannedDowntimeImpactPct + stochasticVariance;
      predictedUptime = Math.round(Math.min(99.5, Math.max(82.0, predictedUptime)) * 10) / 10;

      const confidenceUpper = Math.round(Math.min(99.8, predictedUptime + 1.6) * 10) / 10;
      const confidenceLower = Math.round(Math.max(78.0, predictedUptime - (matchingTasks.length > 0 ? 2.6 : 1.4)) * 10) / 10;

      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (predictedUptime < 93.0 || totalPlannedDowntimeMins >= 100) {
        riskLevel = 'HIGH';
      } else if (predictedUptime < 95.0 || matchingTasks.length > 0) {
        riskLevel = 'MEDIUM';
      }

      let eventSummary = 'Vận hành ổn định (Không có lịch bảo trì)';
      if (matchingTasks.length === 1) {
        eventSummary = matchingTasks[0];
      } else if (matchingTasks.length > 1) {
        eventSummary = `${matchingTasks[0]} (+${matchingTasks.length - 1} nhiệm vụ)`;
      }

      let recommendation = 'Duy trì ca trực và sản xuất tiêu chuẩn.';
      if (riskLevel === 'HIGH') {
        recommendation = 'Chuẩn bị sẵn vật tư dự phòng, điều phối đơn hàng sang các máy dự phòng.';
      } else if (riskLevel === 'MEDIUM') {
        recommendation = 'Theo dõi chặt chẽ áp suất và nhiệt độ trong ca bảo dưỡng.';
      }

      forecast.push({
        dayIndex: i,
        dayName,
        date: shortDate,
        fullDate: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`,
        predictedUptime,
        targetUptime: 95.0,
        confidenceUpper,
        confidenceLower,
        totalPlannedDowntimeMins,
        plannedDowntimeHours: (totalPlannedDowntimeMins / 60).toFixed(1),
        matchingTasks,
        eventSummary,
        riskLevel,
        recommendation,
        isWeekend,
      });
    }

    return forecast;
  }, [devices, selectedMachine, avgUptime]);

  const avgForecastUptime = useMemo(() => {
    const sum = forecast7DaysData.reduce((acc, curr) => acc + curr.predictedUptime, 0);
    return (sum / forecast7DaysData.length).toFixed(1);
  }, [forecast7DaysData]);

  const totalForecastEventsCount = useMemo(() => {
    return forecast7DaysData.reduce((acc, curr) => acc + curr.matchingTasks.length, 0);
  }, [forecast7DaysData]);

  const highestRiskForecastDay = useMemo(() => {
    let lowest = forecast7DaysData[0];
    forecast7DaysData.forEach((d) => {
      if (d.predictedUptime < (lowest?.predictedUptime || 100)) {
        lowest = d;
      }
    });
    return lowest;
  }, [forecast7DaysData]);

  // Export current 30-day analytics data as CSV
  const handleDownloadCSV = () => {
    const selectedMachineName =
      selectedMachine === 'ALL'
        ? 'Toàn bộ xưởng EDM (Tất cả thiết bị)'
        : devices.find((d) => d.id === selectedMachine)?.name || selectedMachine;

    // CSV Headers
    const headers = [
      'Ngày',
      'Ngày Đầy Đủ',
      'Tỷ Lệ Uptime (%)',
      'Mục Tiêu SLA (%)',
      'Chỉ Số OEE (%)',
      'Thời Gian Dừng Máy (Phút)',
      'Thời Gian Dừng Máy (Giờ)',
      'Trạng Thái Ngưỡng',
      'Thiết Bị Sự Cố',
      'Nguyên Nhân Chi Tiết',
    ];

    // Data Rows
    const rows = historyData.map((d) => [
      `"${d.date}"`,
      `"${d.fullDate}"`,
      d.uptime,
      d.targetUptime,
      d.oee,
      d.downtimeMinutes,
      (d.downtimeMinutes / 60).toFixed(2),
      d.isExceeded ? 'CẢNH BÁO (VƯỢT NGƯỠNG)' : 'BÌNH THƯỜNG',
      `"${(d.problemMachine || 'Không có sự cố nghiêm trọng').replace(/"/g, '""')}"`,
      `"${(d.problemCause || 'Vận hành ổn định').replace(/"/g, '""')}"`,
    ]);

    // Metadata Header for Industrial Audit / Management
    const metadata = [
      '# BÁO CÁO PHÂN TÍCH HIỆU SUẤT VẬN HÀNH & UPTIME 30 NGÀY - HỆ THỐNG EDM SMARTGUARD',
      `# Thời điểm trích xuất: ${new Date().toLocaleString('vi-VN')}`,
      `# Phạm vi thiết bị: ${selectedMachineName}`,
      `# Tỷ lệ Uptime trung bình: ${avgUptime}% (Mục tiêu SLA: 95%)`,
      `# Hiệu suất OEE trung bình: ${avgOee}%`,
      `# Tổng thời gian dừng máy: ${totalDowntimeHours} giờ`,
      `# Ngưỡng cảnh báo dừng máy: ${downtimeThreshold} phút (${(downtimeThreshold / 60).toFixed(1)} giờ)`,
      `# Số ngày vượt ngưỡng cảnh báo: ${exceededDays.length} ngày`,
      '',
    ];

    // UTF-8 BOM (\uFEFF) ensures Excel displays Vietnamese correctly
    const csvContent =
      '\uFEFF' +
      metadata.join('\n') +
      headers.join(',') +
      '\n' +
      rows.map((r) => r.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `EDM_SmartGuard_Performance_Report_30Days_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-sm transition-all duration-300">
      {/* Header bar with toggle & download */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Phân Tích Hiệu Suất & Xu Hướng Uptime (30 Ngày Qua)
              </h2>
              <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400">
                Recharts Analytics
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Giám sát độ tin cậy vận hành, thời gian hoạt động liên tục và tác động tích cực của AI đến MTTR
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV Button for 30-Day Machine Uptime Trend Audit */}
          <button
            onClick={() => download30DayOperationalCSV(devices)}
            title="Tải báo cáo dữ liệu 30 ngày dưới định dạng CSV cho mục đích kiểm toán bên ngoài (Excel/Google Sheets)"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3.5 py-1.5 text-xs shadow-md shadow-emerald-950/40 transition active:scale-95 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Machine Filter Dropdown */}
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
          >
            <option value="ALL">Toàn Bộ Xưởng EDM (Tất cả máy)</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>

          {/* Toggle Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-300 transition"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span className="hidden sm:inline">Thu gọn</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span className="hidden sm:inline">Mở rộng</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-5 space-y-6 animate-in fade-in duration-300">
          {/* Quick KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tỷ lệ Uptime TB 30 ngày</span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-1 font-mono text-2xl font-extrabold text-emerald-400">
                {avgUptime}%
              </div>
              <div className="mt-1 text-[11px] text-emerald-400/90 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Vượt mục tiêu chuẩn (+1.4%)</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Hiệu suất OEE Trung bình</span>
                <Activity className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-1 font-mono text-2xl font-extrabold text-amber-400">
                {avgOee}%
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Mức World-Class: &gt; 85%
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Thời gian sửa máy (MTTR)</span>
                <Clock className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="mt-1 font-mono text-2xl font-extrabold text-cyan-400">
                24.5<span className="text-sm font-normal text-slate-400 ml-1">phút</span>
              </div>
              <div className="mt-1 text-[11px] text-cyan-400/90 flex items-center gap-1 font-medium">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>Giảm 38% nhờ AI gợi ý SOP</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Thời gian giữa 2 sự cố (MTBF)</span>
                <Cpu className="h-4 w-4 text-purple-400" />
              </div>
              <div className="mt-1 font-mono text-2xl font-extrabold text-purple-400">
                342<span className="text-sm font-normal text-slate-400 ml-1">giờ</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Tổng downtime 30 ngày: {totalDowntimeHours}h
              </div>
            </div>

            {/* 5th KPI Card: 7-Day Predictive Uptime Forecast */}
            <div
              onClick={() => setActiveMetric('forecast')}
              className={`rounded-2xl border p-3.5 cursor-pointer transition ${
                activeMetric === 'forecast'
                  ? 'border-cyan-500 bg-cyan-950/40 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-500/50'
                  : 'border-slate-800/80 bg-gradient-to-br from-slate-950 to-cyan-950/20 hover:border-cyan-500/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="text-cyan-300 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                  Dự báo 7 ngày tới
                </span>
                <span className="rounded bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 text-[9px] font-mono font-bold">
                  Recharts AI
                </span>
              </div>
              <div className="mt-1 font-mono text-2xl font-extrabold text-cyan-400">
                {avgForecastUptime}%
              </div>
              <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{totalForecastEventsCount} kỳ bảo dưỡng</span>
                <span className="text-emerald-400 font-medium">SLA: Đạt</span>
              </div>
            </div>
          </div>

          {/* Metric Selector & Threshold Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setActiveMetric('downtime')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeMetric === 'downtime'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Thời Gian Dừng Máy (Phút/Ngày)
                </button>
                <button
                  onClick={() => setActiveMetric('uptime')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeMetric === 'uptime'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Tỷ lệ Uptime Hoạt Động (%)
                </button>
                <button
                  onClick={() => setActiveMetric('oee')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeMetric === 'oee'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Chỉ Số OEE Sản Xuất (%)
                </button>
                <button
                  onClick={() => setActiveMetric('forecast')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                    activeMetric === 'forecast'
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400/40'
                      : 'text-cyan-400 hover:text-white hover:bg-slate-800 border border-cyan-500/30'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Dự Báo Uptime 7 Ngày Tới (AI &amp; Bảo Trì)</span>
                </button>
              </div>

              {/* Threshold Selector for Downtime Alert (> 2 hours) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-950/30 px-3 py-1 text-xs">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-slate-300 font-medium">Ngưỡng cảnh báo dừng:</span>
                  <select
                    value={downtimeThreshold}
                    onChange={(e) => setDowntimeThreshold(Number(e.target.value))}
                    className="bg-transparent font-mono font-bold text-red-400 focus:outline-none cursor-pointer"
                  >
                    <option value={90} className="bg-slate-900 text-white">&gt; 1.5 giờ (90m)</option>
                    <option value={120} className="bg-slate-900 text-white">&gt; 2.0 giờ (120m - Tiêu chuẩn)</option>
                    <option value={150} className="bg-slate-900 text-white">&gt; 2.5 giờ (150m)</option>
                    <option value={180} className="bg-slate-900 text-white">&gt; 3.0 giờ (180m)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* MAIN CHART: RECHARTS 30-DAY UPTIME TREND OR 7-DAY FORECAST */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {activeMetric === 'forecast' ? (
                  <ComposedChart data={forecast7DaysData} margin={{ top: 20, right: 15, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                    />
                    <YAxis
                      domain={[85, 100]}
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#06b6d4',
                        borderRadius: '14px',
                        color: '#f8fafc',
                        fontSize: '11px',
                        boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.7)',
                        padding: '12px 14px',
                      }}
                      formatter={(value: any, name: any, item: any) => {
                        const payload = item?.payload;
                        if (name === 'predictedUptime') {
                          return [
                            `${value}% (Dải tin cậy: ${payload?.confidenceLower}% - ${payload?.confidenceUpper}%)`,
                            'Dự Báo Uptime',
                          ];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label, items) => {
                        const item = items?.[0]?.payload;
                        if (!item) return label;
                        return `📅 ${item.dayName} (${item.fullDate}) • Kế hoạch: ${item.eventSummary}`;
                      }}
                    />
                    {/* Target SLA ReferenceLine */}
                    <ReferenceLine
                      y={95}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Mục Tiêu SLA Chuẩn: 95%',
                        fill: '#f59e0b',
                        fontSize: 10,
                        position: 'insideTopRight',
                      }}
                    />
                    {/* Critical Alert ReferenceLine */}
                    <ReferenceLine
                      y={92}
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      label={{
                        value: 'Ngưỡng Rủi Ro Gián Đoạn: 92%',
                        fill: '#ef4444',
                        fontSize: 10,
                        fontWeight: 'bold',
                        position: 'insideBottomRight',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="confidenceUpper"
                      stroke="none"
                      fill="url(#forecastAreaGradient)"
                      name="Dải tin cậy 95%"
                    />
                    <Line
                      type="monotone"
                      dataKey="predictedUptime"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#06b6d4', stroke: '#090d16', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#38bdf8' }}
                      name="predictedUptime"
                    />
                  </ComposedChart>
                ) : activeMetric === 'downtime' ? (
                  <BarChart data={historyData} margin={{ top: 20, right: 15, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="date"
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
                      unit="m"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '11px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      }}
                      formatter={(value: any, name: any, item: any) => [
                        `${value} phút (${(value / 60).toFixed(1)} giờ) ${value >= downtimeThreshold ? '🚨 [VƯỢT NGƯỠNG]' : ''}`,
                        'Thời gian dừng máy',
                      ]}
                      labelFormatter={(label, items) => {
                        const item = items?.[0]?.payload;
                        if (!item) return label;
                        return item.problemMachine
                          ? `${item.fullDate} • ${item.problemMachine}`
                          : item.fullDate;
                      }}
                    />
                    {/* VISUAL REFERENCE LINE: DOWNTIME THRESHOLD (> 2 HOURS / 120 MINS) */}
                    <ReferenceLine
                      y={downtimeThreshold}
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      label={{
                        value: `⚠️ NGƯỠNG DỪNG MÁY > ${(downtimeThreshold / 60).toFixed(1)}H (${downtimeThreshold} PHÚT)`,
                        fill: '#ef4444',
                        fontSize: 10,
                        fontWeight: 'bold',
                        position: 'insideTopRight',
                      }}
                    />
                    <Bar
                      dataKey="downtimeMinutes"
                      radius={[4, 4, 0, 0]}
                      name="Downtime (phút)"
                    >
                      {historyData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.downtimeMinutes >= downtimeThreshold ? '#ef4444' : '#38bdf8'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={historyData} margin={{ top: 20, right: 15, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="oeeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                    />
                    <YAxis
                      domain={[80, 100]}
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '11px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      }}
                      formatter={(value: any, name: any) => [
                        `${value}%`,
                        name === 'uptime' ? 'Tỷ lệ Uptime' : 'Chỉ số OEE',
                      ]}
                      labelFormatter={(label, items) => {
                        const item = items?.[0]?.payload;
                        return item ? `${item.fullDate} (${item.incidentsCount} sự cố dừng)` : label;
                      }}
                    />
                    {/* Target Benchmark 95% */}
                    <ReferenceLine
                      y={95}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Mục Tiêu Chuẩn SLA: 95%',
                        fill: '#f59e0b',
                        fontSize: 10,
                        position: 'insideTopRight',
                      }}
                    />
                    {/* Critical Threshold corresponding to > 2h downtime */}
                    <ReferenceLine
                      y={uptimeCriticalThreshold}
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      label={{
                        value: `⚠️ Ngưỡng dừng > ${(downtimeThreshold / 60).toFixed(1)}h (Uptime < ${uptimeCriticalThreshold}%)`,
                        fill: '#ef4444',
                        fontSize: 10,
                        fontWeight: 'bold',
                        position: 'insideBottomRight',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={activeMetric}
                      stroke={activeMetric === 'uptime' ? '#10b981' : '#f59e0b'}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill={activeMetric === 'uptime' ? 'url(#uptimeGradient)' : 'url(#oeeGradient)'}
                      name={activeMetric === 'uptime' ? 'Tỷ lệ Uptime' : 'Chỉ số OEE'}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* 7-DAY PREDICTIVE FORECAST CARDS BREAKDOWN */}
            {activeMetric === 'forecast' && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      Chi Tiết Dự Báo Vận Hành &amp; Lịch Bảo Trì Linh Kiện (7 Ngày Tới)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Dựa trên dữ liệu lịch sử 30 ngày &amp; các cảnh báo bảo trì linh kiện hiện tại
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
                  {forecast7DaysData.map((day) => (
                    <div
                      key={day.dayIndex}
                      className={`rounded-2xl border p-3 flex flex-col justify-between transition ${
                        day.riskLevel === 'HIGH'
                          ? 'border-red-500/40 bg-gradient-to-b from-red-950/30 to-slate-950'
                          : day.riskLevel === 'MEDIUM'
                          ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-slate-950'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5 mb-2">
                          <span className="text-xs font-bold text-white">{day.dayName}</span>
                          <span className="font-mono text-[11px] text-slate-400">{day.date}</span>
                        </div>

                        <div className="flex items-baseline justify-between mb-2">
                          <span
                            className={`font-mono text-lg font-black ${
                              day.predictedUptime >= 95
                                ? 'text-emerald-400'
                                : day.predictedUptime >= 92
                                ? 'text-amber-400'
                                : 'text-red-400'
                            }`}
                          >
                            {day.predictedUptime}%
                          </span>
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                              day.riskLevel === 'HIGH'
                                ? 'bg-red-500/20 text-red-300'
                                : day.riskLevel === 'MEDIUM'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {day.riskLevel === 'HIGH' ? 'RỦI RO' : day.riskLevel === 'MEDIUM' ? 'BẢO TRÌ' : 'ỔN ĐỊNH'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-300 font-medium leading-snug line-clamp-2 mb-2">
                          {day.eventSummary}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                        {day.totalPlannedDowntimeMins > 0 ? (
                          <span className="text-amber-300 flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3 text-amber-400" />
                            Dừng dự kiến: ~{day.totalPlannedDowntimeMins}m
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Chạy liên tục
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Forecast Action Recommendation Banner */}
                <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900 to-slate-950 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white">
                        Khuyến Nghị Điều Phối Sản Xuất &amp; Bảo Trì Phòng Ngừa
                      </h5>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        Ngày <strong className="text-amber-300">{highestRiskForecastDay?.date} ({highestRiskForecastDay?.dayName})</strong> có lịch bảo dưỡng tập trung ({highestRiskForecastDay?.eventSummary}). {highestRiskForecastDay?.recommendation}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 self-end sm:self-auto shrink-0">
                    <span className="rounded bg-slate-800 px-2.5 py-1 text-slate-200">
                      Dự báo Uptime TB: <strong className="text-cyan-400">{avgForecastUptime}%</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* PROBLEMATIC MACHINES IDENTIFIER BANNER (THRESHOLD EXCEEDED) */}
            {exceededDays.length > 0 && (
              <div className="rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-950 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-500/20 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-600 text-white animate-pulse">
                      <AlertOctagon className="h-3.5 w-3.5" />
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-red-200">
                      Cảnh Báo Vượt Ngưỡng: Phát Hiện {exceededDays.length} Ngày Có Tổng Dừng Máy &gt; {(downtimeThreshold / 60).toFixed(1)} Giờ ({downtimeThreshold} Phút)
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Định vị thiết bị sự cố & nguyên nhân gốc rễ
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exceededDays.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-red-500/30 bg-slate-950/80 p-3.5 text-xs hover:border-red-400 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5 font-mono">
                          <Calendar className="h-3.5 w-3.5 text-amber-400" />
                          {item.fullDate}
                        </span>
                        <span className="font-mono font-bold text-red-400 bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded text-[11px]">
                          Dừng máy: {item.downtimeMinutes} phút ({(item.downtimeMinutes / 60).toFixed(1)}h)
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          <span>Thiết bị gặp sự cố: {item.problemMachine}</span>
                        </div>
                        <p className="mt-1 text-slate-300 text-[11px] pl-5 leading-relaxed">
                          Nguyên nhân gốc: {item.problemCause}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* SECONDARY ROW: ROOT CAUSE FREQUENCY DISTRIBUTION */}
          <div className="pt-2 border-t border-slate-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Phân Bổ Nguyên Nhân Sự Cố Dừng Máy 30 Ngày & Hiệu Quả Sửa Chữa (MTTR)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {breakdownCausesData.map((cause, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span className="truncate pr-1">{cause.name}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                      style={{ backgroundColor: `${cause.color}25`, color: cause.color }}
                    >
                      {cause.incidents} lần
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>MTTR TB:</span>
                    <span className="font-bold text-white">{cause.avgMttr} phút</span>
                  </div>
                  {/* Progress proportion */}
                  <div className="mt-1.5 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(cause.incidents / 14) * 100}%`,
                        backgroundColor: cause.color,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
