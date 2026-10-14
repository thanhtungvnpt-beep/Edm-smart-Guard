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
  TrendingUp,
  Activity,
  Gauge,
  Flame,
  Zap,
  BarChart2,
  Filter,
  Info,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Device } from '../types';
import {
  getAllMachineServiceIntervals,
  MachineServiceIntervalInfo,
} from '../utils/serviceIntervalHelper';
import {
  calculateFleet48hPredictions,
  calculateMachine48hProbability,
  Fleet48hPredictionSummary,
  Machine48hPrediction,
  HourlyProbabilityPoint,
} from '../utils/sensorFailurePrediction';

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
  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'URGENT' | 'UPCOMING' | 'NORMAL' | 'HIGH_RISK_48H'>('ALL');
  const [selectedChartEntity, setSelectedChartEntity] = useState<string>('FLEET');
  const [showChartDetails, setShowChartDetails] = useState<boolean>(true);

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

  // Compute 48-hour sensor-based incident prediction model
  const fleet48hSummary = useMemo<Fleet48hPredictionSummary>(() => {
    return calculateFleet48hPredictions(devices);
  }, [devices]);

  // Map for fast lookup of 48h prediction per machine
  const machine48hMap = useMemo(() => {
    const map = new Map<string, Machine48hPrediction>();
    fleet48hSummary.machines.forEach((m) => map.set(m.deviceId, m));
    return map;
  }, [fleet48hSummary]);

  // Selected Machine for chart or null if FLEET
  const selectedMachinePrediction = useMemo(() => {
    if (selectedChartEntity === 'FLEET') return null;
    return fleet48hSummary.machines.find((m) => m.deviceId === selectedChartEntity) || null;
  }, [selectedChartEntity, fleet48hSummary]);

interface PredictiveChartDataPoint {
  hourOffset: number;
  timeLabel: string;
  displayTime: string;
  shiftLabel?: string;
  probability: number;
  fleetAvg?: number;
  highestRiskProb?: number;
  highestRiskMachine?: string;
  primarySensorDriver: string;
  contributingFactors?: string[];
  projectedErrorCode?: string;
  riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL';
  recommendedAction?: string;
}

  // Chart data formatted for Recharts
  const chartData = useMemo<PredictiveChartDataPoint[]>(() => {
    if (selectedChartEntity === 'FLEET' || !selectedMachinePrediction) {
      // Fleet view: display fleet average + highest risk machine trace
      return fleet48hSummary.fleetAveragePoints.map((pt) => ({
        hourOffset: pt.hourOffset,
        timeLabel: pt.timeLabel,
        displayTime: pt.displayTime,
        probability: pt.fleetAvgProbability,
        highestRiskProb: pt.highestMachineProbability,
        highestRiskMachine: pt.highestMachineCode,
        primarySensorDriver: 'Tổng hợp cảm biến rung động, nhiệt độ & áp suất toàn xưởng',
        riskLevel: pt.fleetAvgProbability >= 65 ? 'CRITICAL' : pt.fleetAvgProbability >= 30 ? 'WARNING' : 'SAFE',
        recommendedAction:
          pt.fleetAvgProbability >= 65
            ? 'Khuyến nghị phân công kỹ thuật viên kiểm tra hạm đội'
            : 'Duy trì giám sát telemetry tự động',
      }));
    } else {
      // Single machine view: display machine probability + fleet average benchmark line
      const fleetMap = new Map(
        fleet48hSummary.fleetAveragePoints.map((p) => [p.hourOffset, p.fleetAvgProbability])
      );
      return selectedMachinePrediction.hourlyPoints.map((pt) => ({
        hourOffset: pt.hourOffset,
        timeLabel: pt.timeLabel,
        displayTime: pt.displayTime,
        shiftLabel: pt.shiftLabel,
        probability: pt.probability,
        fleetAvg: fleetMap.get(pt.hourOffset) || 20,
        primarySensorDriver: pt.primarySensorDriver,
        contributingFactors: pt.contributingFactors,
        projectedErrorCode: pt.projectedErrorCode,
        riskLevel: pt.riskLevel,
        recommendedAction: pt.recommendedAction,
      }));
    }
  }, [selectedChartEntity, selectedMachinePrediction, fleet48hSummary]);

  // Current entity peak & risk metrics for summary pill
  const activeMetrics = useMemo(() => {
    if (selectedMachinePrediction) {
      return {
        name: `${selectedMachinePrediction.deviceCode} - ${selectedMachinePrediction.deviceName}`,
        isFleet: false,
        currentProb: selectedMachinePrediction.currentProbability,
        peakProb: selectedMachinePrediction.peakProbability,
        peakTime: selectedMachinePrediction.peakTimeLabel,
        riskLevel: selectedMachinePrediction.overallRiskLevel,
        dominantFactor: selectedMachinePrediction.dominantSensorFactor,
        interventionWindow: selectedMachinePrediction.suggestedInterventionWindow,
        criticalInHours: selectedMachinePrediction.hoursUntilCriticalThreshold,
        topAnomalies: selectedMachinePrediction.topAnomalies,
      };
    }

    return {
      name: 'Toàn Bộ Hạm Đội Máy EDM (Fleet Average)',
      isFleet: true,
      currentProb: fleet48hSummary.fleetAveragePoints[0]?.fleetAvgProbability || 15,
      peakProb: fleet48hSummary.peakFleetProbability,
      peakTime: `T+${fleet48hSummary.peakFleetHourOffset}h`,
      riskLevel:
        fleet48hSummary.peakFleetProbability >= 65
          ? ('CRITICAL' as const)
          : fleet48hSummary.peakFleetProbability >= 30
          ? ('WARNING' as const)
          : ('SAFE' as const),
      dominantFactor: 'Tích lũy ma sát và dao động áp suất/nhiệt độ trong ca đêm',
      interventionWindow:
        fleet48hSummary.highRiskMachineCount > 0
          ? `Có ${fleet48hSummary.highRiskMachineCount} máy có nguy cơ cao (>65%) cần xử lý phòng ngừa`
          : 'Hạm đội vận hành trong giới hạn ổn định',
      criticalInHours: undefined,
      topAnomalies: [],
    };
  }, [selectedMachinePrediction, fleet48hSummary]);

  // Counts for summary metrics
  const urgentCount = serviceIntervals.filter(
    (i) => i.urgency === 'URGENT' || i.urgency === 'OVERDUE'
  ).length;
  const upcomingCount = serviceIntervals.filter((i) => i.urgency === 'UPCOMING').length;
  const normalCount = serviceIntervals.filter((i) => i.urgency === 'NORMAL').length;
  const highRisk48hCount = fleet48hSummary.highRiskMachineCount;

  // Filtered list
  const filteredIntervals = useMemo(() => {
    if (filterUrgency === 'ALL') return serviceIntervals;
    if (filterUrgency === 'URGENT') {
      return serviceIntervals.filter((i) => i.urgency === 'URGENT' || i.urgency === 'OVERDUE');
    }
    if (filterUrgency === 'HIGH_RISK_48H') {
      return serviceIntervals.filter((i) => {
        const pred = machine48hMap.get(i.deviceId);
        return pred && pred.peakProbability >= 50;
      });
    }
    return serviceIntervals.filter((i) => i.urgency === filterUrgency);
  }, [serviceIntervals, filterUrgency, machine48hMap]);

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
                Cảnh Báo Bảo Dưỡng Dự Đoán & Xu Hướng Sự Cố 48 Giờ
              </h3>
              <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Service Interval & 48h Sensor AI
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Giám sát tiến độ chu kỳ vận hành 500 giờ máy thực tế kết hợp phân tích vi sai cảm biến để dự báo xác suất phát sinh sự cố trong 48 giờ tới
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
              <span>{urgentCount} máy cần bảo dưỡng</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Chu kỳ ổn định</span>
            </div>
          )}

          {/* High risk 48h count */}
          {highRisk48hCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl bg-orange-950/50 border border-orange-500/40 px-3 py-1.5 text-xs text-orange-200 font-bold shadow-md">
              <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />
              <span>{highRisk48hCount} máy rủi ro 48h cao</span>
            </div>
          )}

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer"
            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
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
          {/* ========================================================================= */}
          {/* TREND CHART: BIỂU ĐỒ XU HƯỚNG XÁC SUẤT PHÁT SINH SỰ CỐ TRONG 48 GIỜ TỚI */}
          {/* ========================================================================= */}
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-950/90 via-slate-900/90 to-slate-950/95 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
            {/* Ambient background glow depending on active risk */}
            <div
              className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-20 transition-colors duration-500 ${
                activeMetrics.riskLevel === 'CRITICAL'
                  ? 'bg-red-500'
                  : activeMetrics.riskLevel === 'WARNING'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />

            {/* Top Toolbar: Title, View Switcher & Machine Dropdown */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                      <span>Biểu Đồ Xu Hướng Xác Suất Sự Cố Trong 48 Giờ Tới</span>
                    </h4>
                    <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300 flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Dựa Trên Dữ Liệu Cảm Biến EDM
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Dự báo xác suất suy thoái và phát sinh sự cố theo mốc thời gian (T+0h đến T+48h) từ dao động rung Z, nhiệt độ, áp suất & lực căng
                  </p>
                </div>
              </div>

              {/* View Switcher Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
                  <button
                    onClick={() => setSelectedChartEntity('FLEET')}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedChartEntity === 'FLEET'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="h-3 w-3" />
                    <span>Toàn Hạm Đội (Fleet)</span>
                  </button>
                </div>

                {/* Machine Selector Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Xem theo máy:</span>
                  <select
                    value={selectedChartEntity}
                    onChange={(e) => setSelectedChartEntity(e.target.value)}
                    className="rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                  >
                    <option value="FLEET">Toàn bộ máy (Trung bình Hạm Đội)</option>
                    {fleet48hSummary.machines.map((m) => (
                      <option key={m.deviceId} value={m.deviceId}>
                        {m.deviceCode} - {m.deviceName} (Đỉnh 48h: {m.peakProbability}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick KPI Highlight Badges Bar */}
            <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10">
              {/* Metric 1: Peak Probability */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Xác Suất Đỉnh (48h)</span>
                  <Flame
                    className={`h-3.5 w-3.5 ${
                      activeMetrics.peakProb >= 65
                        ? 'text-red-400 animate-pulse'
                        : activeMetrics.peakProb >= 30
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span
                    className={`text-xl font-mono font-black ${
                      activeMetrics.peakProb >= 65
                        ? 'text-red-400'
                        : activeMetrics.peakProb >= 30
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {activeMetrics.peakProb}%
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    tại {activeMetrics.peakTime}
                  </span>
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold ${
                      activeMetrics.riskLevel === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : activeMetrics.riskLevel === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {activeMetrics.riskLevel === 'CRITICAL'
                      ? 'NGUY CƠ DỪNG MÁY CAO'
                      : activeMetrics.riskLevel === 'WARNING'
                      ? 'CẦN GIÁM SÁT CHẶT CHẼ'
                      : 'TRẠNG THÁI AN TOÀN'}
                  </span>
                </div>
              </div>

              {/* Metric 2: Current Probability vs Start */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Hiện Tại (T+0h)</span>
                  <Activity className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-mono font-black text-white">
                    {activeMetrics.currentProb}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {activeMetrics.currentProb < activeMetrics.peakProb ? (
                      <span className="text-red-400 font-semibold flex items-center">
                        ↗ +{activeMetrics.peakProb - activeMetrics.currentProb}%
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">Ổn định</span>
                    )}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-1">
                  {selectedMachinePrediction ? `Trạng thái: ${selectedMachinePrediction.deviceCode}` : 'Trung bình hạm đội'}
                </p>
              </div>

              {/* Metric 3: Dominant Sensor Driver */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Cảm Biến Chi Phối Rủi Ro</span>
                  <Gauge className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="mt-1">
                  <span className="text-xs font-bold text-amber-300 line-clamp-1">
                    {activeMetrics.dominantFactor}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                  {selectedMachinePrediction && selectedMachinePrediction.topAnomalies.length > 0
                    ? `${selectedMachinePrediction.topAnomalies[0].description}`
                    : 'Phân tích vi sai rung, nhiệt & áp suất'}
                </p>
              </div>

              {/* Metric 4: Intervention Recommendation */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800/90 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Cửa Sổ Can Thiệp Đề Xuất</span>
                  <Wrench className="h-3.5 w-3.5 text-cyan-400" />
                </div>
                <div className="mt-1">
                  <span className="text-xs font-bold text-cyan-300 line-clamp-2 leading-tight">
                    {activeMetrics.interventionWindow}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {activeMetrics.criticalInHours !== undefined
                    ? `⚠️ Chạm ngưỡng đỏ lúc T+${activeMetrics.criticalInHours}h`
                    : 'Tránh gián đoạn kế hoạch sản xuất'}
                </p>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="mt-4 relative z-10">
              <div className="h-[250px] sm:h-[280px] w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 12, right: 16, left: -20, bottom: 4 }}
                  >
                    <defs>
                      {/* Gradient for Probability Area */}
                      <linearGradient id="probGradientCritical" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.65} />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>

                      <linearGradient id="probGradientWarning" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                        <stop offset="50%" stopColor="#eab308" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>

                      <linearGradient id="probGradientSafe" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#334155"
                      opacity={0.35}
                      vertical={false}
                    />

                    <XAxis
                      dataKey="timeLabel"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      dy={4}
                    />

                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />

                    {/* Reference Lines for Thresholds */}
                    <ReferenceLine
                      y={65}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: 'Ngưỡng Nguy Cấp (65%)',
                        fill: '#ef4444',
                        fontSize: 10,
                        position: 'insideTopRight',
                      }}
                    />

                    <ReferenceLine
                      y={30}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeWidth={1.2}
                      label={{
                        value: 'Ngưỡng Cảnh Báo (30%)',
                        fill: '#f59e0b',
                        fontSize: 10,
                        position: 'insideTopRight',
                      }}
                    />

                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const prob = data.probability;
                          const isCrit = prob >= 65;
                          const isWarn = prob >= 30;

                          return (
                            <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2 max-w-xs sm:max-w-sm">
                              {/* Header */}
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-2">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                                  <span className="font-mono font-bold text-white">
                                    {data.timeLabel} ({data.displayTime})
                                  </span>
                                </div>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold ${
                                    isCrit
                                      ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                                      : isWarn
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {isCrit ? 'NGUY CẤP' : isWarn ? 'CẢNH BÁO' : 'AN TOÀN'}
                                </span>
                              </div>

                              {/* Probability Value */}
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Xác suất phát sinh sự cố:</span>
                                <span
                                  className={`font-mono text-sm font-black ${
                                    isCrit
                                      ? 'text-red-400'
                                      : isWarn
                                      ? 'text-amber-400'
                                      : 'text-emerald-400'
                                  }`}
                                >
                                  {prob}%
                                </span>
                              </div>

                              {/* If showing single machine, also show fleet average benchmark */}
                              {data.fleetAvg !== undefined && (
                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                  <span>TB Hạm Đội cùng mốc:</span>
                                  <span className="font-mono text-slate-300 font-semibold">
                                    {data.fleetAvg}%
                                  </span>
                                </div>
                              )}

                              {/* If showing fleet, show highest machine */}
                              {data.highestRiskProb !== undefined && (
                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                  <span>Máy rủi ro cao nhất:</span>
                                  <span className="font-mono text-red-400 font-bold">
                                    {data.highestRiskMachine} ({data.highestRiskProb}%)
                                  </span>
                                </div>
                              )}

                              {/* Primary Sensor Driver */}
                              {data.primarySensorDriver && (
                                <div className="pt-1 border-t border-slate-800 text-[11px]">
                                  <span className="text-slate-400 block font-medium">Yếu tố cảm biến:</span>
                                  <span className="text-slate-200">{data.primarySensorDriver}</span>
                                </div>
                              )}

                              {/* Projected Error Code */}
                              {data.projectedErrorCode && (
                                <div className="text-[11px]">
                                  <span className="text-slate-400 block font-medium">Mã lỗi dự báo:</span>
                                  <span className="font-mono text-amber-300 font-semibold">
                                    {data.projectedErrorCode}
                                  </span>
                                </div>
                              )}

                              {/* Recommended Action */}
                              {data.recommendedAction && (
                                <div className="pt-1 border-t border-slate-800/80 text-[10px] text-cyan-300 flex items-start gap-1">
                                  <Wrench className="h-3 w-3 shrink-0 mt-0.5" />
                                  <span>{data.recommendedAction}</span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    {/* Main Area Chart */}
                    <Area
                      type="monotone"
                      dataKey="probability"
                      name="Xác suất sự cố"
                      stroke={
                        activeMetrics.riskLevel === 'CRITICAL'
                          ? '#ef4444'
                          : activeMetrics.riskLevel === 'WARNING'
                          ? '#f59e0b'
                          : '#10b981'
                      }
                      strokeWidth={2.5}
                      fill={
                        activeMetrics.riskLevel === 'CRITICAL'
                          ? 'url(#probGradientCritical)'
                          : activeMetrics.riskLevel === 'WARNING'
                          ? 'url(#probGradientWarning)'
                          : 'url(#probGradientSafe)'
                      }
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />

                    {/* Benchmark Line for Single Machine View */}
                    {selectedMachinePrediction && (
                      <Line
                        type="monotone"
                        dataKey="fleetAvg"
                        name="Trung bình Hạm Đội"
                        stroke="#6366f1"
                        strokeWidth={1.8}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}

                    {/* Benchmark Line for Fleet View (Highest Machine) */}
                    {!selectedMachinePrediction && (
                      <Line
                        type="monotone"
                        dataKey="highestRiskProb"
                        name="Máy Nguy Cơ Cao Nhất"
                        stroke="#f43f5e"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend & Summary Info Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        activeMetrics.riskLevel === 'CRITICAL'
                          ? 'bg-red-500'
                          : activeMetrics.riskLevel === 'WARNING'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className="font-medium text-slate-300">
                      {selectedMachinePrediction
                        ? `Xác suất sự cố ${selectedMachinePrediction.deviceCode}`
                        : 'Xác suất sự cố TB Hạm Đội'}
                    </span>
                  </div>

                  {selectedMachinePrediction && (
                    <div className="flex items-center gap-1.5 text-indigo-400">
                      <span className="inline-block w-4 border-b-2 border-indigo-400 border-dashed" />
                      <span>Đường tham chiếu TB Hạm Đội</span>
                    </div>
                  )}

                  {!selectedMachinePrediction && (
                    <div className="flex items-center gap-1.5 text-rose-400">
                      <span className="inline-block w-4 border-b-2 border-rose-400 border-dashed" />
                      <span>Máy có rủi ro đỉnh cao nhất</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-red-400/80">
                    <span className="inline-block w-3 border-b-2 border-red-500 border-dashed" />
                    <span>Ngưỡng nguy cấp (65%)</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-amber-400/80">
                    <span className="inline-block w-3 border-b-2 border-amber-500 border-dashed" />
                    <span>Ngưỡng cảnh báo (30%)</span>
                  </div>
                </div>

                {/* Quick Action: Filter High Risk Machines */}
                <button
                  onClick={() => setFilterUrgency(filterUrgency === 'HIGH_RISK_48H' ? 'ALL' : 'HIGH_RISK_48H')}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                    filterUrgency === 'HIGH_RISK_48H'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-amber-400 hover:bg-slate-700 border border-slate-700'
                  }`}
                  title="Lọc các máy có xác suất phát sinh sự cố trong 48h vượt quá 50%"
                >
                  <Filter className="h-3 w-3" />
                  <span>
                    {filterUrgency === 'HIGH_RISK_48H'
                      ? 'Đang lọc máy rủi ro 48h cao'
                      : 'Lọc máy rủi ro 48h cao (≥50%)'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Filters for Machines Grid */}
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
              onClick={() => setFilterUrgency('HIGH_RISK_48H')}
              className={`rounded-lg px-3 py-1 font-medium transition shrink-0 flex items-center gap-1 ${
                filterUrgency === 'HIGH_RISK_48H'
                  ? 'bg-orange-500/20 text-orange-300 font-bold border border-orange-500/40'
                  : 'text-slate-400 hover:text-orange-300'
              }`}
            >
              <Flame className="h-3 w-3" />
              Rủi ro 48h cao ({fleet48hSummary.machines.filter((m) => m.peakProbability >= 50).length})
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
              const pred48h = machine48hMap.get(info.deviceId);
              const isUrgent = info.urgency === 'URGENT' || info.urgency === 'OVERDUE';
              const isUpcoming = info.urgency === 'UPCOMING';
              const isHighRisk48h = pred48h && pred48h.peakProbability >= 65;
              const isSelectedInChart = selectedChartEntity === info.deviceId;

              return (
                <div
                  key={info.deviceId}
                  className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                    isSelectedInChart
                      ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-950 shadow-xl'
                      : isUrgent || isHighRisk48h
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

                    {/* 48-Hour Incident Probability Badge & Sensor Driver Alert */}
                    {pred48h && (
                      <div className="mt-3 rounded-xl bg-slate-900/90 border border-slate-800/90 p-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                            <TrendingUp className="h-3 w-3 text-indigo-400" />
                            <span>Xác suất sự cố 48h tới:</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono font-black text-xs ${
                                pred48h.peakProbability >= 65
                                  ? 'text-red-400'
                                  : pred48h.peakProbability >= 30
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              Đỉnh {pred48h.peakProbability}% ({pred48h.peakTimeLabel})
                            </span>

                            <button
                              onClick={() => {
                                setSelectedChartEntity(info.deviceId);
                                window.scrollTo({ top: 380, behavior: 'smooth' });
                              }}
                              className="rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-0.5 transition cursor-pointer"
                              title="Bấm để xem đường cong xu hướng 48h của máy này trên biểu đồ chính"
                            >
                              <Eye className="h-2.5 w-2.5" />
                              <span>Biểu đồ</span>
                            </button>
                          </div>
                        </div>

                        {/* Telemetry sensor anomaly summary */}
                        <div className="mt-1.5 text-[10px] text-slate-400 space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-300">
                            <Gauge className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                            <span className="truncate">{pred48h.dominantSensorFactor}</span>
                          </div>
                          {pred48h.topAnomalies.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {pred48h.topAnomalies.slice(0, 2).map((anom, aIdx) => (
                                <span
                                  key={aIdx}
                                  className={`rounded px-1.5 py-0.2 text-[9px] font-mono ${
                                    anom.severity === 'CRITICAL'
                                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  }`}
                                >
                                  {anom.sensorName.split('(')[0].trim()}: {anom.currentValue} {anom.unit}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
