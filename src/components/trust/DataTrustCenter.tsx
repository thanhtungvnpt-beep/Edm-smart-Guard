import React, { useState } from 'react';
import {
  ShieldCheck,
  Database,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  GitBranch,
  RefreshCw,
  Search,
  ExternalLink,
  Lock,
  Clock,
  Server,
  Filter,
  CheckSquare,
  FileCheck,
  AlertOctagon,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  DataSourceRegistryItem,
  DataQualityDimensionScore,
  DataQualityIssueItem,
  DataLineageNode,
  AIReadinessGateReport,
  DataReadinessState,
  DataQualityDimensionKey,
} from '../../types';
import {
  INITIAL_DATA_SOURCES,
  INITIAL_DATA_QUALITY_DIMENSIONS,
  INITIAL_DATA_QUALITY_ISSUES,
  INITIAL_DATA_LINEAGE_NODES,
  INITIAL_AI_READINESS_GATE_REPORT,
} from '../../utils/trustedFoundationData';

interface DataTrustCenterProps {
  onToast?: (message: string) => void;
}

export const DataTrustCenter: React.FC<DataTrustCenterProps> = ({ onToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'SOURCES' | 'QUALITY' | 'ISSUES' | 'LINEAGE' | 'GATE'>('GATE');
  const [dataSources, setDataSources] = useState<DataSourceRegistryItem[]>(INITIAL_DATA_SOURCES);
  const [dimensions, setDimensions] = useState<DataQualityDimensionScore[]>(INITIAL_DATA_QUALITY_DIMENSIONS);
  const [issues, setIssues] = useState<DataQualityIssueItem[]>(INITIAL_DATA_QUALITY_ISSUES);
  const [lineageNodes, setLineageNodes] = useState<DataLineageNode[]>(INITIAL_DATA_LINEAGE_NODES);
  const [gateReport, setGateReport] = useState<AIReadinessGateReport>(INITIAL_AI_READINESS_GATE_REPORT);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedLineageStep, setSelectedLineageStep] = useState<number>(4);

  // Manual trigger to simulate quality evaluation
  const handleTriggerQualityAudit = () => {
    onToast?.('Đang chạy kiểm tra toàn vẹn dữ liệu 6 tiêu chuẩn trên 5 nguồn cấp...');
    setTimeout(() => {
      onToast?.('Đã kiểm tra 86.420 gói tin: Tất cả 6 chỉ số chất lượng đạt mức Tin Cậy Cao (READY)');
    }, 800);
  };

  const handleResolveIssue = (issueId: string) => {
    setIssues((prev) =>
      prev.map((item) =>
        item.id === issueId
          ? {
              ...item,
              status: 'RESOLVED',
              resolvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              resolutionNotes: 'Đã hiệu chuẩn và kiểm tra đối chiếu tại hiện trường bởi Data Steward.',
            }
          : item
      )
    );
    onToast?.(`Đã đánh dấu hoàn tất xử lý sự cố chất lượng dữ liệu ${issueId}`);
  };

  const getGateBadge = (state: DataReadinessState) => {
    switch (state) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            READY — Đủ Điều Kiện Kích Hoạt AI Quyết Định
          </span>
        );
      case 'READY_WITH_LIMITATIONS':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            READY WITH LIMITATIONS — Kèm Cảnh Báo Giới Hạn
          </span>
        );
      case 'NOT_READY':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 border border-orange-500/40 px-3 py-1 text-xs font-bold text-orange-300">
            <AlertOctagon className="h-4 w-4 text-orange-400" />
            NOT READY — Chưa Đủ Tin Cậy Để Ra Quyết Định
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-xs font-bold text-red-300">
            <AlertOctagon className="h-4 w-4 text-red-400" />
            BLOCKED — Khóa Khẩn Cấp Do Mất Nguồn Dữ Liệu
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Data Trust Center Title & Quick Gate Score */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-900/40 p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Mô-đun 2: Data Trust Center
              </span>
              <span className="rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono font-medium">
                6 Chiều Đánh Giá • 5 Nguồn Dữ Liệu
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Database className="h-6 w-6 text-cyan-400" />
              <span>Trung Tâm Quản Trị & Kiểm Soát Dữ Liệu Đáng Tin Cậy</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Nền tảng kiểm tra tính toàn vẹn dữ liệu trước khi đưa vào mô hình AI. Đảm bảo mọi quyết định, cảnh báo đều có nguồn gốc rõ ràng, loại trừ hoàn toàn dữ liệu giả mạo và ảo giác.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={handleTriggerQualityAudit}
              className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-bold text-white transition active:scale-95"
            >
              <RefreshCw className="h-4 w-4 text-cyan-400" />
              <span>Kiểm Định Lại 6 Chiều</span>
            </button>
            <div className="rounded-2xl bg-slate-950/90 border border-cyan-500/40 px-4 py-2 text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Trạng Thái Cổng AI</div>
              <div className="mt-0.5">{getGateBadge(gateReport.state)}</div>
            </div>
          </div>
        </div>

        {/* 5 Sub Navigation Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('GATE')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeSubTab === 'GATE'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>AI Data Readiness Gate</span>
            <span className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-mono text-cyan-200">
              {gateReport.overallQualityScore}%
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('SOURCES')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeSubTab === 'SOURCES'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Server className="h-4 w-4" />
            <span>Nguồn Dữ Liệu (Data Sources)</span>
            <span className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-mono text-cyan-200">
              {dataSources.length} Nguồn
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('QUALITY')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeSubTab === 'QUALITY'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span>Bảng 6 Chiều Chất Lượng</span>
            <span className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-mono text-cyan-200">
              6 Tiêu Chí
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('ISSUES')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeSubTab === 'ISSUES'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Quản Lý Lỗi Dữ Liệu</span>
            <span className="rounded bg-amber-500/30 text-amber-300 px-1.5 py-0.5 text-[10px] font-mono font-bold">
              {issues.filter((i) => i.status === 'OPEN').length} Mở
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('LINEAGE')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeSubTab === 'LINEAGE'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            <span>Phả Hệ Dữ Liệu 9 Mắt Xích (Data Lineage)</span>
            <span className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-mono text-cyan-200">
              9 Bước
            </span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: AI DATA READINESS GATE                                        */}
      {/* ==================================================================== */}
      {activeSubTab === 'GATE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gate Summary Card */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-400">Trạng Thái Đánh Giá</span>
                <span className="text-[11px] font-mono text-slate-500">Chu kỳ: 10s</span>
              </div>

              <div className="text-center py-4 bg-slate-950/70 rounded-2xl border border-slate-800/80">
                <div className="text-4xl font-black text-cyan-400 font-mono tracking-tight">
                  {gateReport.overallQualityScore}%
                </div>
                <div className="text-xs font-bold text-slate-300 mt-1">Chỉ Số Tin Cậy Dữ Liệu Toàn Hệ Thống</div>
                <div className="mt-3 inline-block">{getGateBadge(gateReport.state)}</div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Thời điểm đánh giá:</span>
                  <span className="font-mono text-white">{gateReport.evaluatedAt}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Tiêu chuẩn kiểm tra:</span>
                  <span className="font-semibold text-emerald-400">6/6 Tiêu chí đạt ngưỡng</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Rào cản ngăn chặn (Blockers):</span>
                  <span className="font-semibold text-emerald-400">0 Lỗi Chặn</span>
                </div>
              </div>
            </div>

            {/* Allowed vs Restricted Capabilities */}
            <div className="lg:col-span-2 rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Quyền Hạn Mô Hình AI Được Phép Dựa Trên Độ Sẵn Sàng Dữ Liệu</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/30 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Tính Năng AI Được Phép Chạy ({gateReport.allowedAIFeatures.length})</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {gateReport.allowedAIFeatures.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-red-950/20 border border-red-500/30 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-red-300 font-bold text-xs">
                    <AlertOctagon className="h-4 w-4 shrink-0" />
                    <span>Hạn Chế Bắt Buộc (Quy Tắc An Toàn) ({gateReport.restrictedAIFeatures.length})</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {gateReport.restrictedAIFeatures.map((restr, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">✕</span>
                        <span>{restr}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 4 Readiness States Guidance */}
              <div className="mt-4 rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <div className="text-xs font-bold text-slate-300 mb-2">Định Nghĩa 4 Cấp Độ Sẵn Sàng (Readiness Gate Architecture):</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-emerald-900/10 border border-emerald-500/20">
                    <div className="font-bold text-emerald-300">1. READY (≥95%)</div>
                    <p className="text-slate-400 mt-0.5">Dữ liệu hoàn hảo, kích hoạt trọn vẹn 4 Engine phân tích & gợi ý.</p>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-900/10 border border-amber-500/20">
                    <div className="font-bold text-amber-300">2. LIMITATIONS (80-94%)</div>
                    <p className="text-slate-400 mt-0.5">Đạt ngưỡng tối thiểu, khuyến nghị kèm cảnh báo thiếu dữ liệu.</p>
                  </div>
                  <div className="p-2 rounded-xl bg-orange-900/10 border border-orange-500/20">
                    <div className="font-bold text-orange-300">3. NOT READY (&lt;80%)</div>
                    <p className="text-slate-400 mt-0.5">Dữ liệu kém tin cậy, AI bị vô hiệu hóa tạo đề xuất tự động.</p>
                  </div>
                  <div className="p-2 rounded-xl bg-red-900/10 border border-red-500/20">
                    <div className="font-bold text-red-300">4. BLOCKED (0%)</div>
                    <p className="text-slate-400 mt-0.5">Mất cảm biến then chốt, lập tức khóa chức năng dự báo rủi ro.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: DATA SOURCE REGISTRY                                          */}
      {/* ==================================================================== */}
      {activeSubTab === 'SOURCES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="h-5 w-5 text-cyan-400" />
                <span>Danh Mục 5 Nguồn Cấp Dữ Liệu Nhà Máy (Data Source Registry)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Theo dõi giao thức, độ trễ truyền dẫn, chủ quản dữ liệu (Data Owner) và trạng thái kết nối thực tế.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>5/5 Nguồn Trực Tuyến</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {dataSources.map((source) => (
              <div
                key={source.id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 transition shadow-md space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-xs px-2 py-0.5 font-bold">
                      {source.id}
                    </span>
                    <h4 className="text-sm font-bold text-white">{source.name}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold">
                      ● {source.connectionStatus} ({source.latencyMs} ms)
                    </span>
                    <span className="rounded-md bg-slate-800 text-slate-300 px-2 py-0.5 text-[11px] font-mono">
                      {source.protocol}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tần Suất Lấy Mẫu:</span>
                    <span className="font-semibold text-white font-mono">{source.frequency}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Chủ Quản Dữ Liệu:</span>
                    <span className="font-semibold text-cyan-300">{source.dataOwner}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phân Loại Bảo Mật:</span>
                    <span className="font-semibold text-amber-300">{source.securityClassification}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Bản Ghi Hôm Nay:</span>
                    <span className="font-semibold text-emerald-300 font-mono">
                      {source.recordsProcessedToday.toLocaleString()} ({source.errorRatePercent}% lỗi)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <div className="font-mono text-slate-500 truncate max-w-md">
                    Endpoint: {source.endpoint}
                  </div>
                  <div className="text-right">
                    Đồng bộ lần cuối: <span className="text-slate-300">{source.lastSyncTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: DATA QUALITY DASHBOARD (6 DIMENSIONS)                         */}
      {/* ==================================================================== */}
      {activeSubTab === 'QUALITY' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-cyan-400" />
                <span>Bảng Đo Lường Chất Lượng Dữ Liệu Theo 6 Tiêu Chí Bắt Buộc</span>
              </h3>
              <p className="text-xs text-slate-400">
                Đánh giá định lượng trên toàn bộ mẫu cảm biến và báo cáo sản xuất trước khi chuyển tiếp cho các Engine AI.
              </p>
            </div>
            <div className="text-xs font-mono text-cyan-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              Tổng mẫu kiểm tra: 86.420 tín hiệu
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dimensions.map((dim) => (
              <div
                key={dim.key}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 relative overflow-hidden shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                      {dim.key}
                    </span>
                    <h4 className="text-sm font-bold text-white">{dim.vietnameseName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black font-mono text-emerald-400">
                      {dim.scorePercent}%
                    </span>
                    <span className="block text-[10px] text-slate-400">Ngưỡng: &ge;{dim.thresholdPercent}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dim.scorePercent >= dim.thresholdPercent
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, dim.scorePercent)}%` }}
                  ></div>
                </div>

                {/* Formula & Details */}
                <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 text-xs space-y-1">
                  <div className="text-[11px] text-slate-400 font-mono">
                    <strong className="text-slate-300">Công thức:</strong> {dim.metricFormula}
                  </div>
                  <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800/60">
                    {dim.details}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Mẫu: {dim.sampleCheckCount.toLocaleString()}</span>
                  <span className={dim.failedCheckCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                    Lỗi: {dim.failedCheckCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: DATA QUALITY ISSUES TRACKER                                   */}
      {/* ==================================================================== */}
      {activeSubTab === 'ISSUES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <span>Theo Dõi & Phân Công Xử Lý Sự Cố Chất Lượng Dữ Liệu</span>
              </h3>
              <p className="text-xs text-slate-400">
                Giao việc trực tiếp cho Data Steward / Đội Cơ Điện khắc phục lệch tín hiệu cảm biến hoặc trễ mạng.
              </p>
            </div>
            <div className="text-xs text-slate-400">
              Đang mở: <strong className="text-amber-400 font-bold">{issues.filter((i) => i.status === 'OPEN').length}</strong> sự cố
            </div>
          </div>

          <div className="space-y-3">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className={`rounded-2xl border p-4 transition shadow-md ${
                  issue.status === 'OPEN'
                    ? 'bg-amber-950/10 border-amber-500/30'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
                      {issue.id}
                    </span>
                    <span className="text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                      {issue.dimension}
                    </span>
                    <h4 className="text-sm font-bold text-white">{issue.sourceName}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        issue.status === 'OPEN'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {issue.status === 'OPEN' ? 'ĐANG MỞ (OPEN)' : 'ĐÃ KHẮC PHỤC (RESOLVED)'}
                    </span>
                    {issue.status === 'OPEN' && (
                      <button
                        onClick={() => handleResolveIssue(issue.id)}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1 shadow transition"
                      >
                        Nghiệm Thu Khắc Phục
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  {issue.description}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>
                      Người phụ trách: <strong className="text-cyan-300">{issue.assignedTo}</strong>
                    </span>
                    <span>
                      Trường ảnh hưởng:{' '}
                      <code className="text-amber-300 font-mono">
                        {issue.affectedFields.join(', ')}
                      </code>
                    </span>
                  </div>
                  <div className="font-mono text-slate-500">
                    Phát hiện lúc: {issue.detectedAt} • Mã: {issue.correlationId}
                  </div>
                </div>

                {issue.resolvedAt && (
                  <div className="mt-2 text-xs text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                    <strong>Biện pháp khắc phục:</strong> {issue.resolutionNotes} (Lúc {issue.resolvedAt})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: DATA LINEAGE (9-LINK TRACEABILITY CHAIN)                     */}
      {/* ==================================================================== */}
      {activeSubTab === 'LINEAGE' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-cyan-400" />
                <span>Phả Hệ Dữ Liệu & Chuỗi Truy Xuất Nguồn Gốc 9 Mắt Xích</span>
              </h3>
              <p className="text-xs text-slate-400">
                Cho phép truy vết từ tín hiệu cảm biến rung động thô ban đầu đến quyết định phê duyệt dừng máy và kết quả đo kiểm thực tế sau khi sửa.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-mono bg-indigo-950 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-indigo-300">
              <span>Mã Truy Vết:</span>
              <strong className="text-white">CORR-9L-EDM01-VIB</strong>
            </div>
          </div>

          {/* 9-Step Interactive Stepper */}
          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2">
              {lineageNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedLineageStep(node.stepNumber)}
                  className={`text-left p-2.5 rounded-xl border transition relative ${
                    selectedLineageStep === node.stepNumber
                      ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-lg ring-1 ring-cyan-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="font-bold text-cyan-300">BƯỚC {node.stepNumber}</span>
                    <span className="text-emerald-400 font-bold">{node.qualityScore}%</span>
                  </div>
                  <div className="text-[11px] font-bold line-clamp-2 text-slate-200">
                    {node.stepName.split('(')[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Step Detailed Trace View */}
          {(() => {
            const activeNode = lineageNodes.find((n) => n.stepNumber === selectedLineageStep) || lineageNodes[0];
            return (
              <div className="rounded-3xl bg-slate-900 border border-cyan-500/40 p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs uppercase font-bold text-cyan-400">
                      Mắt Xích #{activeNode.stepNumber} Trong Chuỗi 9 Bước
                    </span>
                    <h4 className="text-lg font-black text-white">{activeNode.stepName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                      Chất Lượng: {activeNode.qualityScore}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-slate-400 font-bold block text-[11px] uppercase">
                      Đầu Vào (Input Payload):
                    </span>
                    <div className="text-slate-200">{activeNode.inputSummary}</div>
                    <div className="text-[11px] text-cyan-400 font-mono pt-1 border-t border-slate-800/80">
                      Nguồn tham chiếu: {activeNode.sourceRef}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-slate-400 font-bold block text-[11px] uppercase">
                      Đầu Ra & Xử Lý (Output & Inference):
                    </span>
                    <div className="text-slate-200">{activeNode.outputSummary}</div>
                    <div className="text-[11px] text-emerald-400 font-mono pt-1 border-t border-slate-800/80">
                      Tác nhân thực thi: {activeNode.actorOrEngine}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-slate-950/70 p-3 rounded-xl border border-slate-800 font-mono text-slate-400">
                  <div>
                    Thời gian: <span className="text-white">{activeNode.executionTimestamp}</span>
                  </div>
                  <div>
                    Mã liên kết: <span className="text-cyan-300">{activeNode.correlationId}</span>
                  </div>
                  <div className="truncate max-w-sm">
                    Khóa băm: <span className="text-amber-400">{activeNode.verificationHash}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
