import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  DollarSign,
  FileText,
  Filter,
  Flame,
  Gauge,
  Layers,
  MapPin,
  PackageCheck,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Wrench,
  Zap,
} from 'lucide-react';
import { Device } from '../types';
import {
  generatePredictiveHardwareInsights,
  HardwareWearComponent,
} from '../utils/hardwarePrediction';

interface PredictiveInsightPanelProps {
  device: Device;
  onScheduleReplacement?: (component: HardwareWearComponent) => void;
}

export const PredictiveInsightPanel: React.FC<PredictiveInsightPanelProps> = ({
  device,
  onScheduleReplacement,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const report = generatePredictiveHardwareInsights(device);

  const filteredComponents = report.components.filter((c) => {
    if (selectedCategory === 'ALL') return true;
    return c.category === selectedCategory;
  });

  const getStatusBadge = (status: HardwareWearComponent['status']) => {
    switch (status) {
      case 'CRITICAL_REPLACE':
        return (
          <span className="rounded-full bg-red-500/20 border border-red-500/50 px-2.5 py-0.5 text-[10px] font-mono font-bold text-red-400 animate-pulse flex items-center gap-1">
            <AlertOctagon className="h-3 w-3" />
            CẦN THAY NGAY (NGUY CƠ DỪNG MÁY)
          </span>
        );
      case 'REPLACE_SOON':
        return (
          <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            CẦN THAY TRONG TUẦN TỚI
          </span>
        );
      case 'MODERATE_WEAR':
        return (
          <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-mono font-medium text-blue-400">
            HAO MÒN TIÊU CHUẨN
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
            TỐT (HOẠT ĐỘNG ỔN ĐỊNH)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP EXECUTIVE SUMMARY BANNER */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-950 p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Phân Tích Dự Báo Linh Kiện Cần Thay Phòng Ngừa (Predictive Insight)
                </h4>
                <span className="rounded bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300">
                  AI 30-Day Analysis
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tổng hợp từ dữ liệu hiệu suất 30 ngày, dao động cảm biến IoT và tiền sử dừng máy
              </p>
            </div>
          </div>

          {/* Overall Health Risk Badge */}
          <div>
            {report.overallRiskLevel === 'CRITICAL' ? (
              <span className="rounded-xl bg-red-950/60 border border-red-500/50 px-3.5 py-1.5 text-xs font-bold text-red-200 animate-pulse flex items-center gap-1.5 shadow-lg shadow-red-950/50">
                <AlertOctagon className="h-4 w-4 text-red-400 shrink-0" />
                <span>RỦI RO CAO: CẦN THAY THẾ KHẨN CẤP</span>
              </span>
            ) : report.overallRiskLevel === 'ELEVATED' ? (
              <span className="rounded-xl bg-amber-950/40 border border-amber-500/50 px-3.5 py-1.5 text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>CẢNH BÁO HAO MÒN: LÊN LỊCH THAY SỚM</span>
              </span>
            ) : (
              <span className="rounded-xl bg-emerald-950/40 border border-emerald-500/40 px-3.5 py-1.5 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>LINH KIỆN HOẠT ĐỘNG AN TOÀN</span>
              </span>
            )}
          </div>
        </div>

        {/* Narrative wear summary */}
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          💡 <strong>Đánh giá từ AI Brain:</strong> {report.wearAnalysisSummary}
        </p>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="text-slate-400 text-xs flex items-center justify-between">
              <span>Cửa sổ thay thế an toàn</span>
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
            </span>
            <div className="mt-1 font-mono text-2xl font-black text-amber-400">
              &le; {report.recommendedWindowDays} <span className="text-xs font-normal text-slate-400">ngày tới</span>
            </div>
            <span className="text-[10px] text-slate-400">Trước khi suy hao vượt ngưỡng</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="text-slate-400 text-xs flex items-center justify-between">
              <span>Thời gian chết ngăn ngừa</span>
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
            </span>
            <div className="mt-1 font-mono text-2xl font-black text-emerald-400">
              +{report.totalDowntimeSavedHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">giờ dừng máy</span>
            </div>
            <span className="text-[10px] text-emerald-400">Tiết kiệm chi phí dừng chuyền MTTR</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="text-slate-400 text-xs flex items-center justify-between">
              <span>Giá trị rủi ro tránh được</span>
              <DollarSign className="h-3.5 w-3.5 text-cyan-400" />
            </span>
            <div className="mt-1 font-mono text-2xl font-black text-cyan-400">
              ${report.costSavingsEstimateUSD.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <span className="text-[10px] text-slate-400">Ước tính thiệt hại phế phẩm & nhân công</span>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY FILTERS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`rounded-lg px-3 py-1 font-medium transition shrink-0 ${
            selectedCategory === 'ALL'
              ? 'bg-slate-800 text-amber-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Tất cả linh kiện ({report.components.length})
        </button>
        <button
          onClick={() => setSelectedCategory('ELECTRICAL_DISCHARGE')}
          className={`rounded-lg px-3 py-1 font-medium transition shrink-0 ${
            selectedCategory === 'ELECTRICAL_DISCHARGE'
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ⚡ Phóng Điện & Dẫn Hướng
        </button>
        <button
          onClick={() => setSelectedCategory('FILTRATION')}
          className={`rounded-lg px-3 py-1 font-medium transition shrink-0 ${
            selectedCategory === 'FILTRATION'
              ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🧪 Bộ Lọc & Áp Lực Nước
        </button>
        <button
          onClick={() => setSelectedCategory('MECHANICAL_MOTION')}
          className={`rounded-lg px-3 py-1 font-medium transition shrink-0 ${
            selectedCategory === 'MECHANICAL_MOTION'
              ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ⚙️ Ổ Bi & Cơ Khí Trục
        </button>
      </div>

      {/* 3. HARDWARE COMPONENTS PREVENTIVE REPLACEMENT LIST */}
      <div className="space-y-3.5">
        {filteredComponents.map((comp) => (
          <div
            key={comp.id}
            className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
              comp.status === 'CRITICAL_REPLACE'
                ? 'border-red-500/70 bg-gradient-to-br from-red-950/20 via-slate-900 to-slate-950 shadow-lg shadow-red-950/30 ring-1 ring-red-500/40'
                : comp.status === 'REPLACE_SOON'
                ? 'border-amber-500/60 bg-gradient-to-br from-amber-950/15 via-slate-900 to-slate-950 shadow-md'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
            }`}
          >
            {/* Header: Title, SKU & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="font-bold text-white text-sm sm:text-base leading-tight">
                    {comp.name}
                  </h5>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    Mã SKU: <strong className="text-amber-400 font-bold">{comp.partNumber}</strong>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-cyan-400" />
                    Thay mất ~{comp.estimatedLaborMinutes} phút
                  </span>
                </div>
              </div>

              <div>{getStatusBadge(comp.status)}</div>
            </div>

            {/* Wear Progression Bar */}
            <div className="mt-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <span>Mức độ hao mòn ước tính:</span>
                  <strong
                    className={`font-mono text-sm ${
                      comp.wearPercentage >= 80
                        ? 'text-red-400 font-extrabold'
                        : comp.wearPercentage >= 65
                        ? 'text-amber-400 font-bold'
                        : 'text-emerald-400'
                    }`}
                  >
                    {comp.wearPercentage}%
                  </strong>
                </span>

                <span className="text-[11px] font-mono text-slate-400">
                  {comp.daysUntilFailure <= 3 ? (
                    <span className="text-red-400 font-bold animate-pulse">
                      🚨 Nguy cơ hỏng trong {comp.daysUntilFailure} ngày tới!
                    </span>
                  ) : (
                    <span>Thời hạn còn lại: ~{comp.daysUntilFailure} ngày</span>
                  )}
                </span>
              </div>

              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    comp.wearPercentage >= 80
                      ? 'bg-gradient-to-r from-orange-500 to-red-500'
                      : comp.wearPercentage >= 65
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${comp.wearPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* 30-Day Wear Indicators & Evidence */}
            <div className="mt-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 p-3 space-y-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5 text-amber-400" />
                <span>Dấu hiệu hao mòn từ dữ liệu vận hành 30 ngày:</span>
              </span>
              <ul className="space-y-1 pl-4 list-disc text-slate-300 text-[11px]">
                {comp.wearIndicators.map((ind, iIdx) => (
                  <li key={iIdx} className="leading-relaxed">
                    {ind}
                  </li>
                ))}
              </ul>
            </div>

            {/* Failure Consequence & Recommended Action */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-xl border border-red-950/40 bg-red-950/15 p-2.5 space-y-1">
                <span className="text-[10px] font-bold uppercase text-red-400 flex items-center gap-1">
                  <AlertOctagon className="h-3 w-3" />
                  Hậu quả nếu để xảy ra dừng máy (Downtime Consequence):
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {comp.failureConsequence}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-950/40 bg-emerald-950/15 p-2.5 space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Hành động bảo dưỡng phòng ngừa khuyến nghị:
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {comp.preventiveAction}
                </p>
              </div>
            </div>

            {/* Stock, Cost & Action Bar */}
            <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3 text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <PackageCheck className="h-4 w-4 text-emerald-400" />
                  Tồn kho: <strong className="text-white">{comp.inStockQuantity} bộ sẵn sàng</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[11px]">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  {comp.stockLocation}
                </span>
                <span>•</span>
                <span className="font-mono text-slate-300">
                  Chi phí linh kiện: ~${comp.replacementCostEstUSD}
                </span>
              </div>

              <button
                onClick={() => onScheduleReplacement && onScheduleReplacement(comp)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95 shrink-0"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>Lên Lịch Thay Thế Ngay</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
