import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Layers,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  Activity,
  FileText,
  Volume2,
  VolumeX,
  Share2,
  Printer,
  BookmarkCheck,
  Search,
  Filter,
  Check,
  Mic,
  MicOff,
  Radio,
  ExternalLink,
  Info,
  Calendar,
  Package,
  HardHat,
  Eye,
  TrendingDown,
  ArrowUpRight,
  Send,
} from 'lucide-react';
import {
  Device,
  Technician,
  MaintenanceRecord,
  RootCauseAnalysisResult,
  WhyStep,
  RootCauseCategoryItem,
  StoppageActionStep,
} from '../types';

interface AIRootCauseAnalysisModuleProps {
  devices: Device[];
  technicians: Technician[];
  initialDeviceId?: string;
  initialErrorCode?: string;
  onOpenMachineDetails?: (device: Device) => void;
  onOpenRepairReport?: (device: Device) => void;
  onNavigateTab?: (tab: any) => void;
  onToast?: (message: string) => void;
}

const COMMON_ERROR_PRESETS = [
  {
    code: 'E-102',
    label: 'E-102: Đứt dây cắt liên tục & Tụt áp vòi xả cao áp (Wire EDM)',
    category: 'WIRE_EDM',
    severity: 'CRITICAL',
  },
  {
    code: 'ALARM-204',
    label: 'ALARM-204: Tụt áp suất dung dịch điện môi nguy hiểm (Dielectric Pressure)',
    category: 'HYDRAULIC',
    severity: 'CRITICAL',
  },
  {
    code: 'SPW-303',
    label: 'SPW-303: Phóng tia lửa hồ quang bất thường & Đột biến dòng đỉnh',
    category: 'ELECTRICAL',
    severity: 'HIGH',
  },
  {
    code: 'AXIS-Z',
    label: 'AXIS-Z: Kẹt thanh trượt / Độ rơ trục Z quá mức cho phép',
    category: 'MECHANICAL',
    severity: 'HIGH',
  },
  {
    code: 'ERR-08',
    label: 'ERR-08: Quá nhiệt tủ biến tần nguồn phát xung (Inverter Overheat)',
    category: 'THERMAL',
    severity: 'MEDIUM',
  },
  {
    code: 'ALL',
    label: 'Tất cả các loại sự cố dừng máy xưởng',
    category: 'ALL',
    severity: 'MEDIUM',
  },
];

const PRESET_SYMPTOMS = [
  'Vòi xả nước phụ có tiếng rít và tia nước bị loe',
  'Khói bốc nhẹ trong buồng gia công và có mùi khét hữu cơ',
  'Nhiệt độ nước tuần hoàn vọt lên > 26°C vào đầu ca chiều',
  'Màng rung cảm biến áp lực bám muội carbon sau khi cắt thép SKD11',
  'Dây đồng ø0.25mm rung giật mạnh khi cắt phôi dày > 60mm',
  'Độ rơ trục Z tăng đột biến khi chạy chế độ Rapid',
];

export const AIRootCauseAnalysisModule: React.FC<AIRootCauseAnalysisModuleProps> = ({
  devices,
  technicians,
  initialDeviceId,
  initialErrorCode,
  onOpenMachineDetails,
  onOpenRepairReport,
  onNavigateTab,
  onToast,
}) => {
  // Selector & Filter State
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    initialDeviceId || (devices.find((d) => d.status === 'ALARM_STOPPED')?.id || devices[0]?.id || 'dev-01')
  );
  const [selectedErrorCode, setSelectedErrorCode] = useState<string>(initialErrorCode || 'E-102');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7D' | '30D' | '90D' | 'ALL'>('30D');
  const [customSymptoms, setCustomSymptoms] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');

  // Voice recording state for hands-free factory floor input
  const [isListening, setIsListening] = useState<boolean>(false);

  // Analysis Result State
  const [analysisResult, setAnalysisResult] = useState<RootCauseAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Historical Records Analyzed
  const [analyzedRecords, setAnalyzedRecords] = useState<MaintenanceRecord[]>([]);
  const [metrics, setMetrics] = useState<{
    totalOccurrences: number;
    totalDowntimeMinutes: number;
    avgMttrMinutes: number;
    frequentParts: string[];
  }>({
    totalOccurrences: 0,
    totalDowntimeMinutes: 0,
    avgMttrMinutes: 0,
    frequentParts: [],
  });

  // Active Solution Tab
  const [solutionTab, setSolutionTab] = useState<'QUICK_FIX' | 'PERMANENT' | 'SOP_STEPS'>('QUICK_FIX');

  // Interactive Checklist of completed steps
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Audio Reading state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Show detailed historical records toggle
  const [showHistoryDetail, setShowHistoryDetail] = useState<boolean>(false);

  // Saved to AI Brain indicator
  const [isSavedToBrain, setIsSavedToBrain] = useState<boolean>(false);

  // Target device object
  const targetDevice = useMemo(() => {
    return devices.find((d) => d.id === selectedDeviceId) || null;
  }, [devices, selectedDeviceId]);

  // Voice Speech Recognition Setup
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onToast) onToast('Trình duyệt không hỗ trợ Web Speech API. Vui lòng nhập bằng phím.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        if (onToast) onToast('🎙️ Đang lắng nghe mô tả triệu chứng sự cố...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setCustomSymptoms((prev) => (prev ? `${prev}. ${transcript}` : transcript));
          if (onToast) onToast(`Đã nhận diện: "${transcript}"`);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Run AI Root Cause Analysis API
  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setIsSavedToBrain(false);
    setCompletedSteps({});

    try {
      const res = await fetch('/api/ai/root-cause-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDeviceId,
          errorCode: selectedErrorCode,
          timeframe: selectedTimeframe,
          customSymptoms,
          userNotes,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAnalysisResult(data.data);
        setAnalyzedRecords(data.analyzedRecords || []);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
        if (onToast) {
          onToast(`⚡ Hoàn tất phân tích nguyên nhân gốc rễ cho [${selectedErrorCode}]!`);
        }
      } else {
        throw new Error(data.message || 'Không thể lấy kết quả phân tích AI');
      }
    } catch (err: any) {
      console.error('Failed to run RCA:', err);
      setErrorMsg(err.message || 'Lỗi kết nối tới AI Engine');
      if (onToast) onToast('Lỗi khi phân tích nguyên nhân AI');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial trigger
  useEffect(() => {
    handleRunAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId, selectedErrorCode, selectedTimeframe]);

  // Audio Speech Synthesis (TTS in Vietnamese)
  const toggleSpeechAudio = () => {
    if (!analysisResult) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `Báo cáo phân tích nguyên nhân gốc rễ sự cố dừng máy mã ${analysisResult.targetErrorCode || ''}. ${analysisResult.primaryRootCause}. Khuyến nghị giải pháp nhanh: ${analysisResult.quickFixSolution.summary}.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Save Lesson to AI Knowledge Brain
  const handleSaveToBrain = async () => {
    if (!analysisResult || isSavedToBrain) return;

    try {
      const res = await fetch('/api/learnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: analysisResult.deviceId,
          deviceCode: analysisResult.deviceCode,
          errorCode: analysisResult.targetErrorCode || 'E-102',
          title: `RCA AI: ${analysisResult.targetErrorCode || 'Sự cố dừng máy'} - ${analysisResult.primaryRootCause.slice(0, 80)}...`,
          solutionSummary: analysisResult.quickFixSolution.summary,
          rootCauseAnalysis: analysisResult.primaryRootCause,
          category: 'CORRECTIVE',
          technicianNotes: `Phân tích AI 5-Whys: ${analysisResult.fiveWhysChain[analysisResult.fiveWhysChain.length - 1]?.answer || ''}`,
          stepsToResolve: analysisResult.actionSteps.map((s) => s.actionTitle),
          recommendedSpareParts: analysisResult.recommendedParts.map((p) => p.name),
        }),
      });

      if (res.ok) {
        setIsSavedToBrain(true);
        if (onToast) {
          onToast(' Đã nạp thành công phân tích nguyên nhân vào Bộ Não Tri Thức AI!');
        }
      }
    } catch (err) {
      console.error('Error saving to brain:', err);
      if (onToast) onToast('Lỗi khi lưu bài học vào Bộ Não AI');
    }
  };

  // Toggle checklist step
  const toggleStepCompleted = (stepNumber: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner & Executive Overview */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-500/10 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 text-xs font-mono font-bold text-cyan-400">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-300" />
                AI ROOT CAUSE ANALYSIS ENGINE
              </span>
              <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[11px] font-mono text-purple-300">
                Gemini 3.8 Flash Industrial Core
              </span>
              <span className="hidden sm:inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400">
                5-Whys & Ishikawa 6M
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Module AI Phân Tích Nguyên Nhân Gốc Rễ & Đề Xuất Sửa Chữa Sự Cố Dừng Máy
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Trích xuất tự động dữ liệu lịch sử vận hành, telemetry sụt áp/nhiệt độ, hồ sơ sửa chữa và tài liệu SOP của hệ thống EDM để xác định chính xác nguyên nhân cốt lõi gây dừng máy, ngăn chặn rủi ro tái phát và chỉ dẫn giải pháp sửa chữa nhanh chóng, hiệu quả.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRunAnalysis}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-orange-500/25 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Đang phân tích...' : 'Phân Tích Lại'}</span>
            </button>

            {analysisResult && (
              <>
                <button
                  onClick={toggleSpeechAudio}
                  title="Nghe AI đọc báo cáo nguyên nhân bằng giọng nói"
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    isSpeaking
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 animate-pulse'
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  {isSpeaking ? <VolumeX className="h-4 w-4 text-cyan-400" /> : <Volume2 className="h-4 w-4 text-cyan-400" />}
                  <span className="hidden sm:inline">{isSpeaking ? 'Dừng đọc' : 'Nghe AI Đọc'}</span>
                </button>

                <button
                  onClick={handleSaveToBrain}
                  disabled={isSavedToBrain}
                  title="Lưu bài học vào Bộ Não Tri Thức AI để chia sẻ toàn xưởng"
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    isSavedToBrain
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:text-white'
                  }`}
                >
                  {isSavedToBrain ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <BookmarkCheck className="h-4 w-4 text-purple-400" />}
                  <span className="hidden sm:inline">{isSavedToBrain ? 'Đã lưu vào Brain' : 'Lưu vào Brain AI'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  title="In hoặc lưu file PDF báo cáo phân tích"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  <Printer className="h-4 w-4 text-slate-400" />
                  <span className="hidden sm:inline">In Báo Cáo</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Real-time KPI Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>Sự cố lịch sử đối chiếu</span>
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {metrics.totalOccurrences}{' '}
              <span className="text-xs font-normal text-slate-400">lần dừng máy</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-rose-400" />
              <span>Tổng Downtime tổn thất</span>
            </div>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">
              {metrics.totalDowntimeMinutes}{' '}
              <span className="text-xs font-normal text-slate-400">phút (~{(metrics.totalDowntimeMinutes / 60).toFixed(1)}h)</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-cyan-400" />
              <span>MTTR phục hồi trung bình</span>
            </div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
              {metrics.avgMttrMinutes}{' '}
              <span className="text-xs font-normal text-slate-400">phút/lần</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3">
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-purple-400" />
              <span>Độ tin cậy mô hình AI</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {analysisResult ? `${analysisResult.confidenceScore}%` : '96%'}{' '}
              <span className="text-xs font-normal text-slate-400">công nghiệp</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Selection & Symptom Diagnosis Filter Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Bộ Lọc Thiết Bị & Triệu Chứng Cần Phân Tích
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {targetDevice ? `${targetDevice.brand} ${targetDevice.model} (${targetDevice.code})` : 'Toàn xưởng'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Machine Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Thiết bị EDM mục tiêu:</span>
              {targetDevice && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    targetDevice.status === 'ALARM_STOPPED'
                      ? 'bg-red-500/20 text-red-400'
                      : targetDevice.status === 'RUNNING'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {targetDevice.status}
                </span>
              )}
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="ALL">Toàn bộ xưởng / Cụm tất cả máy EDM</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name} ({d.model})
                </option>
              ))}
            </select>
          </div>

          {/* Error Code / Incident Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Mã lỗi sự cố dừng máy:
            </label>
            <select
              value={selectedErrorCode}
              onChange={(e) => setSelectedErrorCode(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
            >
              {COMMON_ERROR_PRESETS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Khung thời gian dữ liệu lịch sử:
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['7D', '30D', '90D', 'ALL'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`rounded-xl py-2 text-xs font-semibold transition ${
                    selectedTimeframe === tf
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  {tf === '7D' ? '7 Ngày' : tf === '30D' ? '30 Ngày' : tf === '90D' ? '90 Ngày' : 'Tất cả'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Technician Symptom Observations (with Voice Input) */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <span>Mô tả triệu chứng thực tế tại hiện trường (Không bắt buộc):</span>
            </label>

            <button
              onClick={toggleVoiceInput}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                isListening
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {isListening ? <MicOff className="h-3.5 w-3.5 text-red-400" /> : <Mic className="h-3.5 w-3.5 text-amber-400" />}
              <span>{isListening ? 'Dừng ghi âm' : 'Nói triệu chứng (Giọng nói)'}</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={customSymptoms}
              onChange={(e) => setCustomSymptoms(e.target.value)}
              placeholder="Ví dụ: Vòi phun phụ xả áp yếu, nước có cặn muội đen, dây cắt ø0.25mm rung giật mạnh..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
            {customSymptoms && (
              <button
                onClick={() => setCustomSymptoms('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                &times;
              </button>
            )}
          </div>

          {/* Quick Preset Tags for Quick Selection */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500 font-mono">Gợi ý triệu chứng:</span>
            {PRESET_SYMPTOMS.map((sym, idx) => (
              <button
                key={idx}
                onClick={() => setCustomSymptoms(sym)}
                className="rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 px-2 py-0.5 text-[11px] text-slate-300 hover:text-amber-300 transition"
              >
                + {sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-3 animate-pulse">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 shadow-lg">
            <Sparkles className="h-6 w-6 animate-spin" />
          </div>
          <h3 className="text-base font-bold text-white">AI Gemini đang trích xuất & phân tích dữ liệu lịch sử EDM...</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Đang tổng hợp các chuỗi 5-Whys, xây dựng biểu đồ Ishikawa 6M và tính toán giải pháp sửa chữa nhanh chóng, hiệu quả.
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && !isLoading && (
        <div className="rounded-2xl border border-red-500/50 bg-red-950/20 p-5 text-red-300 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Lỗi trong quá trình phân tích AI</h4>
            <p className="text-xs text-red-300/80 mt-0.5">{errorMsg}</p>
            <button
              onClick={handleRunAnalysis}
              className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition"
            >
              Thử lại ngay
            </button>
          </div>
        </div>
      )}

      {/* 3. Main AI Analysis Dashboard Display */}
      {analysisResult && !isLoading && (
        <div className="space-y-6">
          {/* 3.1 Primary Root Cause Headline Banner */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 items-center rounded-full bg-red-500/20 border border-red-500/40 px-2.5 text-[11px] font-mono font-bold text-red-400">
                  NGUYÊN NHÂN GỐC RỄ CỐT LÕI (PRIMARY ROOT CAUSE)
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Mã lỗi: [{analysisResult.targetErrorCode}]
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Độ tin cậy: <strong>{analysisResult.confidenceScore}%</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Rủi ro tái diễn: <strong>{analysisResult.recurrenceProbability}%</strong></span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-black text-amber-200 leading-snug">
                {analysisResult.primaryRootCause}
              </h2>
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Cơ chế hư hỏng kỹ thuật chuyên sâu (Failure Mechanism):</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {analysisResult.failureMechanismDeepDive}
                </p>
              </div>
            </div>
          </div>

          {/* 3.2 Dual Grid: 5-Whys Tree & Ishikawa 6M Fishbone Diagram */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 5-Whys Deep-Dive Tree */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Chuỗi 5 Cấp Độ "Tại Sao" (5-Whys Analysis)</h3>
                    <p className="text-[11px] text-slate-400">Từ triệu chứng biểu hiện bề mặt đến lỗ hổng cốt lõi trong quy trình</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/20">
                  5 CẤP ĐỘ
                </span>
              </div>

              <div className="space-y-3 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
                {analysisResult.fiveWhysChain.map((step, idx) => {
                  const isRoot = idx === analysisResult.fiveWhysChain.length - 1;
                  return (
                    <div
                      key={step.level}
                      className={`relative pl-9 transition-all rounded-xl p-3 ${
                        isRoot
                          ? 'border border-amber-500/40 bg-amber-500/10 shadow-md'
                          : 'border border-slate-800/80 bg-slate-950/60'
                      }`}
                    >
                      <div
                        className={`absolute left-2.5 top-3.5 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold font-mono ${
                          isRoot
                            ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {step.level}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold ${isRoot ? 'text-amber-400' : 'text-slate-400'}`}>
                            {isRoot ? '★ CẤP 5: NGUYÊN NHÂN CỐT LÕI (ROOT CAUSE)' : `CẤP ĐỘ ${step.level}`}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Bằng chứng: {step.evidence}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-white">
                          Q: {step.question}
                        </p>
                        <p className={`text-xs ${isRoot ? 'text-amber-200 font-medium' : 'text-slate-300'}`}>
                          ➜ {step.answer}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ishikawa 6M Fishbone Diagram Breakdown */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Biểu Đồ Xương Cá Ishikawa (6M Categories)</h3>
                    <p className="text-[11px] text-slate-400">Phân loại yếu tố suy thoái theo 6 trục công nghiệp sản xuất</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                  ISHIKAWA 6M
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysisResult.ishikawaCategories.map((item) => (
                  <div
                    key={item.category}
                    className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="text-purple-400">●</span> {item.categoryLabel}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">
                        {item.impactScore}%
                      </span>
                    </div>

                    {/* Impact Bar */}
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                        style={{ width: `${item.impactScore}%` }}
                      />
                    </div>

                    {/* Causes list */}
                    <ul className="space-y-1">
                      {item.causes.map((c, cIdx) => (
                        <li key={cIdx} className="text-[11px] text-slate-400 flex items-start gap-1 leading-tight">
                          <span className="text-slate-600 mt-0.5">-</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3.3 Actionable Solutions & Troubleshooting Guide */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-amber-400" />
                  <span>Giải Pháp Khắc Phục Sự Cố & Sửa Chữa Nhanh Chóng, Hiệu Quả</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lựa chọn phương án phù hợp theo áp lực sản xuất của xưởng tại thời điểm hiện tại
                </p>
              </div>

              {/* Solution Mode Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setSolutionTab('QUICK_FIX')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    solutionTab === 'QUICK_FIX'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Sửa Nhanh (&lt; 15 Phút)</span>
                </button>

                <button
                  onClick={() => setSolutionTab('PERMANENT')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    solutionTab === 'PERMANENT'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Sửa Triệt Để Bền Vững</span>
                </button>

                <button
                  onClick={() => setSolutionTab('SOP_STEPS')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    solutionTab === 'SOP_STEPS'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Quy Trình Từng Bước (SOP)</span>
                </button>
              </div>
            </div>

            {/* Content: TAB 1 - QUICK FIX */}
            {solutionTab === 'QUICK_FIX' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <span>PHƯƠNG ÁN CẤP TỐC: PHỤC HỒI DÂY CHUYỀN TRONG VÒNG {analysisResult.quickFixSolution.estimatedMinutes} PHÚT</span>
                    </span>
                    <span className="text-[11px] font-mono text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded">
                      Ước tính: ~{analysisResult.quickFixSolution.estimatedMinutes} phút
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200">
                    {analysisResult.quickFixSolution.summary}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Các thao tác thực hiện ngay tại hiện trường:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysisResult.quickFixSolution.steps.map((st, sIdx) => (
                      <div
                        key={sIdx}
                        className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 flex items-start gap-3"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold font-mono">
                          {sIdx + 1}
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-medium">
                          {st}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Content: TAB 2 - PERMANENT REPAIR */}
            {solutionTab === 'PERMANENT' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-purple-400" />
                      <span>PHƯƠNG ÁN TRIỆT ĐỂ: LOẠI BỎ TẬN GỐC & CẬP NHẬT CHÍNH SÁCH BẢO TRÌ</span>
                    </span>
                    <span className="text-[11px] font-mono text-purple-400 font-bold bg-purple-500/20 px-2 py-0.5 rounded">
                      Thời gian: ~{analysisResult.permanentRepairSolution.estimatedMinutes} phút
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200">
                    {analysisResult.permanentRepairSolution.summary}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Các bước đại tu & thay thế linh kiện mấu chốt:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysisResult.permanentRepairSolution.steps.map((st, sIdx) => (
                      <div
                        key={sIdx}
                        className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 flex items-start gap-3"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold font-mono">
                          {sIdx + 1}
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-medium">
                          {st}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {analysisResult.permanentRepairSolution.preventionPolicy && (
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3.5">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                      📋 Chính sách bảo trì phòng ngừa đề xuất (Preventive Maintenance Policy):
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {analysisResult.permanentRepairSolution.preventionPolicy}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Content: TAB 3 - STEP-BY-STEP ACTION CHECKLIST */}
            {solutionTab === 'SOP_STEPS' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2">
                  <span>Tích chọn các bước kỹ thuật viên đã hoàn tất trong ca trực để lưu vết:</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    Đã hoàn thành {Object.values(completedSteps).filter(Boolean).length}/
                    {analysisResult.actionSteps.length} bước
                  </span>
                </div>

                <div className="space-y-3">
                  {analysisResult.actionSteps.map((step) => {
                    const isDone = !!completedSteps[step.stepNumber];
                    return (
                      <div
                        key={step.stepNumber}
                        onClick={() => toggleStepCompleted(step.stepNumber)}
                        className={`rounded-xl border p-4 cursor-pointer transition select-none ${
                          isDone
                            ? 'border-emerald-500/40 bg-emerald-500/10'
                            : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-mono mt-0.5 transition ${
                              isDone
                                ? 'bg-emerald-500 text-slate-950'
                                : 'border border-slate-700 bg-slate-900 text-slate-400'
                            }`}
                          >
                            {isDone ? <Check className="h-4 w-4" /> : step.stepNumber}
                          </div>

                          <div className="flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4
                                className={`text-xs sm:text-sm font-bold ${
                                  isDone ? 'text-emerald-300 line-through' : 'text-white'
                                }`}
                              >
                                {step.actionTitle}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                  ~{step.estimatedMinutes} phút
                                </span>
                                <span
                                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                    step.difficulty === 'EXPERT'
                                      ? 'bg-red-500/20 text-red-400'
                                      : step.difficulty === 'MEDIUM'
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : 'bg-emerald-500/20 text-emerald-400'
                                  }`}
                                >
                                  {step.difficulty === 'EXPERT'
                                    ? 'Cần Kỹ Sư Trưởng'
                                    : step.difficulty === 'MEDIUM'
                                    ? 'KTV Bậc 3'
                                    : 'Dễ thao tác'}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed font-sans">
                              {step.actionDetail}
                            </p>

                            {/* Required Tools and Parts */}
                            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                              {step.requiredTools && step.requiredTools.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Wrench className="h-3 w-3 text-cyan-400" />
                                  <span>Dụng cụ: {step.requiredTools.join(', ')}</span>
                                </div>
                              )}
                              {step.requiredParts && step.requiredParts.length > 0 && (
                                <div className="flex items-center gap-1 text-purple-300">
                                  <Package className="h-3 w-3 text-purple-400" />
                                  <span>Linh kiện: {step.requiredParts.join(', ')}</span>
                                </div>
                              )}
                            </div>

                            {/* Safety Notice */}
                            {step.safetyNotice && (
                              <div className="text-[11px] text-rose-300 flex items-center gap-1 mt-1 bg-rose-500/10 px-2 py-1 rounded">
                                <AlertTriangle className="h-3 w-3 text-rose-400 shrink-0" />
                                <span>{step.safetyNotice}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3.4 Spare Parts & Tools Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Spare Parts Inventory */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Vật Tư & Phụ Tùng Thay Thế Cần Chuẩn Bị</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {analysisResult.recommendedParts.length} linh kiện
                </span>
              </div>

              <div className="space-y-2">
                {analysisResult.recommendedParts.map((part, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white">{part.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Part No: <span className="text-cyan-400">{part.partNumber}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          part.urgency === 'IMMEDIATE'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : part.urgency === 'NEXT_SHIFT'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {part.urgency === 'IMMEDIATE'
                          ? 'Cần Ngay Lập Tức'
                          : part.urgency === 'NEXT_SHIFT'
                          ? 'Trong Ca Tới'
                          : 'Bảo Dưỡng Định Kỳ'}
                      </span>
                      {typeof part.inStockEstimate === 'number' && (
                        <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                          Tồn kho xưởng: ~{part.inStockEstimate} cái
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Industrial Safety Guidelines */}
            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/10 p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <HardHat className="h-4 w-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wider">
                    Quy Tắc An Toàn Sống Còn (Safety Protocol)
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded">
                  BẮT BUỘC TUÂN THỦ
                </span>
              </div>

              <div className="space-y-2.5">
                {analysisResult.criticalSafetyGuidelines.map((guide, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-rose-500/20 bg-slate-950/80 p-3 flex items-start gap-2.5"
                  >
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-200 leading-relaxed font-medium">
                      {guide}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3.5 Historical Precedents & Correlation Records */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Dữ Liệu Đối Chiếu Lịch Sử Sự Cố Tương Đồng ({analyzedRecords.length} Bản Ghi)
                </h3>
              </div>

              <button
                onClick={() => setShowHistoryDetail((prev) => !prev)}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                <span>{showHistoryDetail ? 'Thu gọn' : 'Xem chi tiết'}</span>
                {showHistoryDetail ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Historical Precedent Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {analysisResult.historicalPrecedents.map((prec, pIdx) => (
                <div
                  key={pIdx}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-400">{new Date(prec.date).toLocaleDateString('vi-VN')}</span>
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                      {prec.similarityScore}% tương đồng
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-white">
                    KTV: {prec.technician}
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {prec.lessonLearned}
                  </p>
                </div>
              ))}
            </div>

            {/* Detailed Table (if toggled) */}
            {showHistoryDetail && analyzedRecords.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Thời gian</th>
                      <th className="p-2.5">Thiết bị</th>
                      <th className="p-2.5">Sự cố / Nhiệm vụ</th>
                      <th className="p-2.5">KTV xử lý</th>
                      <th className="p-2.5">Thời lượng</th>
                      <th className="p-2.5">Linh kiện thay thế</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-sans">
                    {analyzedRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-800/50">
                        <td className="p-2.5 font-mono text-slate-400">
                          {new Date(rec.completedAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-2.5 font-bold text-white">{rec.deviceCode || 'EDM'}</td>
                        <td className="p-2.5 max-w-xs truncate">{rec.taskTitle}</td>
                        <td className="p-2.5 text-cyan-300">{rec.technicianName}</td>
                        <td className="p-2.5 font-mono">{rec.durationMinutes} phút</td>
                        <td className="p-2.5 text-slate-400">
                          {rec.partsReplaced && rec.partsReplaced.length > 0
                            ? rec.partsReplaced.join(', ')
                            : 'Không thay'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
