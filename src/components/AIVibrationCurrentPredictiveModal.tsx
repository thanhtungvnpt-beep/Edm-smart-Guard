import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Sparkles,
  Wrench,
  X,
  Activity,
  Zap,
  TrendingUp,
  Package,
  Phone,
  User,
  ShieldAlert,
  ArrowRight,
  Info,
  RotateCcw,
  Gauge,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Device } from '../types';
import {
  calculateAIVibrationCurrentSchedule,
  AIPredictiveMaintenanceScheduleItem,
} from '../utils/aiPredictiveMaintenanceScheduler';

interface AIVibrationCurrentPredictiveModalProps {
  device: Device | null;
  onClose: () => void;
  onSetMaintenance?: (deviceId: string) => void;
  onCalibrateSensors?: (deviceId: string) => void;
  onToast?: (msg: string) => void;
}

export const AIVibrationCurrentPredictiveModal: React.FC<AIVibrationCurrentPredictiveModalProps> = ({
  device,
  onClose,
  onSetMaintenance,
  onCalibrateSensors,
  onToast,
}) => {
  if (!device) return null;

  const scheduleItem: AIPredictiveMaintenanceScheduleItem = calculateAIVibrationCurrentSchedule(device);
  const [activeTab, setActiveTab] = useState<'FORECAST' | 'SENSORS' | 'PARTS' | 'AI_ADVICE'>('FORECAST');
  const [isAiReevaluating, setIsAiReevaluating] = useState(false);
  const [scheduledConfirmed, setScheduledConfirmed] = useState(false);

  const handleReevaluateAi = () => {
    setIsAiReevaluating(true);
    setTimeout(() => {
      setIsAiReevaluating(false);
      onToast?.(`AI Gemini đã tái phân tích phổ rung & dòng điện máy ${device.code}!`);
    }, 1200);
  };

  const handleConfirmSchedule = () => {
    setScheduledConfirmed(true);
    onToast?.(`Đã xác nhận lịch bảo trì AI cho máy ${device.code}: ${scheduleItem.predictedDateFormatted}`);
  };

  const isUrgent = scheduleItem.urgency === 'CRITICAL_URGENT';
  const isWarning = scheduleItem.urgency === 'HIGH_WARNING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isUrgent
              ? 'border-red-500/40 bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900'
              : isWarning
              ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900'
              : 'border-slate-700 bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl font-mono text-sm font-bold shadow-inner ${
                isUrgent
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                  : isWarning
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
              }`}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  {device.code}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Dự Báo Bảo Trì AI: Phân Tích Rung Động & Dòng Điện
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {device.name} • {device.model} ({device.location})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* HERO SCHEDULE HIGHLIGHT BANNER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. Scheduled Time */}
            <div
              className={`rounded-xl border p-3.5 flex flex-col justify-between ${
                isUrgent
                  ? 'border-red-500/50 bg-red-950/30'
                  : isWarning
                  ? 'border-amber-500/50 bg-amber-950/30'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  LỊCH DỰ BÁO BẢO TRÌ
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isUrgent
                      ? 'bg-red-500 text-white animate-pulse'
                      : isWarning
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isUrgent ? 'CẤP BÁCH' : isWarning ? 'CẢNH BÁO' : 'ĐỊNH KỲ'}
                </span>
              </div>
              <div className="my-2">
                <div className="font-mono text-base sm:text-lg font-bold text-white">
                  {scheduleItem.predictedDateFormatted}
                </div>
                <div className="text-xs text-amber-300 font-semibold mt-0.5">
                  ⏳ Cần can thiệp sau:{' '}
                  <strong className="text-white font-mono text-sm">{scheduleItem.hoursRemaining} giờ</strong> (~
                  {scheduleItem.daysRemaining} ngày)
                </div>
              </div>
              <div className="text-[11px] text-slate-400">
                Ca phân công: <span className="text-slate-200 font-medium">{scheduleItem.predictedShift}</span>
              </div>
            </div>

            {/* 2. Vibration Analysis Metric */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  PHÂN TÍCH RUNG ĐỘNG
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    scheduleItem.vibrationAnalysis.status === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : scheduleItem.vibrationAnalysis.status === 'ELEVATED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {scheduleItem.vibrationAnalysis.status === 'CRITICAL'
                    ? 'Nguy hiểm'
                    : scheduleItem.vibrationAnalysis.status === 'ELEVATED'
                    ? 'Rung cao'
                    : 'Ổn định'}
                </span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-cyan-300">
                    {scheduleItem.vibrationAnalysis.currentValue.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400">mm/s</span>
                  {scheduleItem.vibrationAnalysis.deviationPercent > 0 && (
                    <span className="text-xs font-mono font-bold text-amber-400">
                      (+{scheduleItem.vibrationAnalysis.deviationPercent}%)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  Chuẩn danh định: {scheduleItem.vibrationAnalysis.nominalRange[0]} -{' '}
                  {scheduleItem.vibrationAnalysis.nominalRange[1]} mm/s
                </div>
              </div>
              <div className="text-[11px] text-slate-400 truncate" title={scheduleItem.vibrationAnalysis.probableMechanicalCause}>
                ⚙️ {scheduleItem.vibrationAnalysis.probableMechanicalCause}
              </div>
            </div>

            {/* 3. Sensor Current Analysis Metric */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  DÒNG ĐIỆN CẢM BIẾN
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    scheduleItem.currentAnalysis.status === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : scheduleItem.currentAnalysis.status === 'ELEVATED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {scheduleItem.currentAnalysis.status === 'CRITICAL'
                    ? 'Quá tải xung'
                    : scheduleItem.currentAnalysis.status === 'ELEVATED'
                    ? 'Bất thường'
                    : 'Đạt chuẩn'}
                </span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold text-amber-300">
                    {scheduleItem.currentAnalysis.currentValue.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400">A</span>
                  <span className="text-xs text-slate-400 ml-1">
                    (Độ ổn định: {scheduleItem.currentAnalysis.sparkStabilityIndex}%)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Chuẩn danh định: {scheduleItem.currentAnalysis.nominalRange[0]} -{' '}
                  {scheduleItem.currentAnalysis.nominalRange[1]} A
                </div>
              </div>
              <div className="text-[11px] text-slate-400 truncate" title={scheduleItem.currentAnalysis.probableElectricalCause}>
                ⚡ {scheduleItem.currentAnalysis.probableElectricalCause}
              </div>
            </div>
          </div>
        </div>

        {/* TAB CONTROLS */}
        <div className="flex border-b border-slate-800 px-5 pt-2 gap-4 text-xs font-semibold bg-slate-900/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('FORECAST')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'FORECAST'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Đồ Thị Xu Hướng Rung &amp; Dòng Điện (48H)
          </button>
          <button
            onClick={() => setActiveTab('SENSORS')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'SENSORS'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="h-4 w-4" />
            Cơ Chế Suy Thoái Rung Động &amp; Dòng Điện
          </button>
          <button
            onClick={() => setActiveTab('PARTS')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'PARTS'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="h-4 w-4" />
            Phụ Tùng Thay Thế Dự Kiến ({scheduleItem.recommendedSpareParts.length})
          </button>
          <button
            onClick={() => setActiveTab('AI_ADVICE')}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'AI_ADVICE'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Khuyến Nghị Kỹ Thuật Viên
          </button>
        </div>

        {/* TAB BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: 48H FORECAST GRAPH */}
          {activeTab === 'FORECAST' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    Mô Hình Dự Báo Rung Động &amp; Dòng Điện Phóng Tia Lửa 48 Giờ
                  </h4>
                  <p className="text-xs text-slate-400">
                    Phối hợp phân tích biến thiên biên độ rung (mm/s) và dòng đỉnh cảm biến (A) để xác định thời điểm vượt ngưỡng an toàn.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
                    Rung động (mm/s - Trục trái)
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                    Dòng cảm biến (A - Trục phải)
                  </span>
                </div>
              </div>

              {/* RECHARTS COMPOSED CHART */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={scheduleItem.hourlyForecast} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis
                      dataKey="timeLabel"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#22d3ee"
                      fontSize={11}
                      domain={[0, (dataMax: number) => Math.max(2.5, Math.ceil(dataMax * 1.2))]}
                      tickFormatter={(v) => `${v}`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#fbbf24"
                      fontSize={11}
                      domain={[0, (dataMax: number) => Math.max(50, Math.ceil(dataMax * 1.2))]}
                      tickFormatter={(v) => `${v}A`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs shadow-xl backdrop-blur-md">
                              <div className="font-bold text-amber-300">{data.timeLabel} • {data.displayTime}</div>
                              <div className="mt-1 space-y-1 font-mono">
                                <div className="text-cyan-400">
                                  〰️ Rung động dự kiến: <strong>{data.vibrationMmS} mm/s</strong>
                                </div>
                                <div className="text-amber-400">
                                  ⚡ Dòng điện cảm biến: <strong>{data.currentAmps} A</strong>
                                </div>
                                <div className="text-rose-400">
                                  ⚠️ Chỉ số rủi ro hỏng hóc: <strong>{data.riskScore}%</strong>
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-300 mt-1 border-t border-slate-800 pt-1">
                                {data.primaryDriver}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      yAxisId="left"
                      y={scheduleItem.vibrationAnalysis.nominalRange[1]}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Trần Rung An Toàn',
                        fill: '#ef4444',
                        fontSize: 10,
                        position: 'insideTopLeft',
                      }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="vibrationMmS"
                      fill="#06b6d4"
                      fillOpacity={0.15}
                      stroke="#22d3ee"
                      strokeWidth={2.5}
                      name="Rung động (mm/s)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="currentAmps"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#f59e0b' }}
                      name="Dòng điện (A)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* FORECAST TIMELINE CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {scheduleItem.hourlyForecast.slice(0, 4).map((pt, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-2.5 ${
                      pt.riskScore >= 70
                        ? 'border-red-500/50 bg-red-950/20'
                        : pt.riskScore >= 40
                        ? 'border-amber-500/40 bg-amber-950/20'
                        : 'border-slate-800 bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-mono font-bold text-amber-400">{pt.timeLabel}</span>
                      <span className="font-mono text-[10px]">{pt.riskScore}% rủi ro</span>
                    </div>
                    <div className="mt-1 font-mono text-xs">
                      <div>Rung: <strong className="text-cyan-300">{pt.vibrationMmS} mm/s</strong></div>
                      <div>Dòng: <strong className="text-amber-300">{pt.currentAmps} A</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED SENSOR MECHANISMS */}
          {activeTab === 'SENSORS' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4" />
                  1. Phân Tích Cơ Học Rung Động (Vibration Spectrum)
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <p>
                    • <strong>Đặc tính dao động:</strong>{' '}
                    {scheduleItem.vibrationAnalysis.waveformType === 'ERRATIC_SPIKES'
                      ? 'Dạng xung gai nhọn bất đối xứng, chu kỳ ngẫu nhiên - dấu hiệu ma sát kim loại và rơ trượt con lăn trục Z.'
                      : scheduleItem.vibrationAnalysis.waveformType === 'HIGH_FREQUENCY_HARMONIC'
                      ? 'Sóng hài cao tần (1.2 - 2.8 kHz) - dấu hiệu thiếu dầu mỡ bôi trơn ray bi dẫn hướng con lăn tuyến tính.'
                      : 'Dao động hình sin điều hòa ổn định, nằm trong vùng thiết kế an toàn.'}
                  </p>
                  <p>
                    • <strong>Nguy cơ cơ khí:</strong> {scheduleItem.vibrationAnalysis.probableMechanicalCause}
                  </p>
                  <p>
                    • <strong>Khuyến cáo căn chỉnh:</strong> Kiểm tra độ rơ backlash trục vít me bi (Ball Screw), siết lại các ốc chân đế giảm chấn và tra mỡ mỡ bôi trơn Kluber NBU 15.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <h4 className="font-bold text-sm text-amber-300 flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4" />
                  2. Phân Tích Dòng Điện Cảm Biến &amp; Hồ Quang EDM (Electrical Spark Stability)
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <p>
                    • <strong>Đặc tính xung phóng:</strong>{' '}
                    {scheduleItem.currentAnalysis.dischargeWaveform === 'MICRO_SHORT_CIRCUIT'
                      ? 'Tần suất chạm chập vi mô (Micro Short-circuits) vượt 22% - phôi và dây cắt tiếp xúc trực tiếp do thoát phoi kém.'
                      : scheduleItem.currentAnalysis.dischargeWaveform === 'ARC_DEGRADATION'
                      ? 'Hồ quang bị thoái hóa, xung dòng kéo dài gây sinh nhiệt cục bộ và cháy xém bề mặt bạc cấp điện.'
                      : 'Xung tia lửa điện phân bố đều, dòng phóng dập tắt đúng chu trình T-on/T-off.'}
                  </p>
                  <p>
                    • <strong>Chỉ số ổn định tia lửa:</strong>{' '}
                    <span className="font-mono font-bold text-amber-400">
                      {scheduleItem.currentAnalysis.sparkStabilityIndex}%
                    </span>
                  </p>
                  <p>
                    • <strong>Nguy cơ điện năng:</strong> {scheduleItem.currentAnalysis.probableElectricalCause}
                  </p>
                  <p>
                    • <strong>Biện pháp khắc phục:</strong> Xoay mặt tiếp xúc bạc cấp điện carbide thêm 90°, vệ sinh vòi phun cao áp để cải thiện áp lực xả thoát xỉ và kiểm tra tụ điện lọc nguồn xung.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPARE PARTS */}
          {activeTab === 'PARTS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">
                  Linh kiện cần cho ca bảo trì dự kiến ({scheduleItem.predictedDateFormatted}):
                </span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Đã đối chiếu tồn kho phụ tùng xưởng
                </span>
              </div>

              <div className="space-y-2">
                {scheduleItem.recommendedSpareParts.map((part, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold font-mono">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100">{part}</div>
                        <div className="text-[11px] text-slate-400">
                          Mục đích: Thay thế phòng ngừa sự cố dừng máy do rung/quá dòng
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                        Sẵn sàng trong kho
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AI ADVICE & ACTION */}
          {activeTab === 'AI_ADVICE' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-amber-300">
                      Tổng Hợp Khuyến Nghị Bảo Trì Từ Trí Tuệ Nhân Tạo AI
                    </h4>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                      {scheduleItem.aiDiagnosticSummary}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Quy trình can thiệp bảo trì khuyến nghị (MTTR dự kiến: {scheduleItem.estimatedMttrMinutes} phút):
                </h5>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
                  <li>
                    <strong>Bước 1:</strong> Ngắt nguồn xung phát tia lửa EDM, thực hiện quy trình an toàn điện LOTO.
                  </li>
                  <li>
                    <strong>Bước 2:</strong> Kiểm tra cảm biến rung gắn trên đế trục Z và động cơ servo. Cân chỉnh lại lực căng đai.
                  </li>
                  <li>
                    <strong>Bước 3:</strong> Vệ sinh bề mặt tiếp xúc bạc cấp điện (Power Feed Contact), xoay mặt dẫn 90° hoặc thay mới.
                  </li>
                  <li>
                    <strong>Bước 4:</strong> Bơm mỡ bôi trơn ray trượt bằng súng mỡ chuyên dụng, lau sạch mạt kim loại và bụi bẩn.
                  </li>
                  <li>
                    <strong>Bước 5:</strong> Khởi động lại máy, chạy test chu trình không tải và đo kiểm lại dòng xung cảm biến.
                  </li>
                </ol>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Kỹ thuật viên phụ trách: <strong>{scheduleItem.assignedTechnicianName}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400 font-mono">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{scheduleItem.assignedTechnicianPhone}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="border-t border-slate-800 bg-slate-950/80 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReevaluateAi}
              disabled={isAiReevaluating}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isAiReevaluating ? 'animate-spin' : ''}`} />
              <span>{isAiReevaluating ? 'Đang phân tích lại...' : 'Chạy lại AI Phân Tích'}</span>
            </button>

            {onCalibrateSensors && (
              <button
                onClick={() => {
                  onCalibrateSensors(device.id);
                  onToast?.(`Đã gửi lệnh hiệu chỉnh cảm biến cho máy ${device.code}!`);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition active:scale-95"
              >
                <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                <span>Hiệu Chỉnh Cảm Biến</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition"
            >
              Đóng
            </button>

            <button
              onClick={handleConfirmSchedule}
              disabled={scheduledConfirmed}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
                scheduledConfirmed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 cursor-default'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>{scheduledConfirmed ? 'Đã Lưu Lịch Dự Báo AI' : 'Xác Nhận Lịch Bảo Trì AI'}</span>
            </button>

            {onSetMaintenance && device.status !== 'MAINTENANCE' && (
              <button
                onClick={() => {
                  onSetMaintenance(device.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold shadow-lg shadow-blue-600/30 transition active:scale-95"
              >
                <Wrench className="h-4 w-4" />
                <span>Chuyển Sang Bảo Trì Ngay</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
