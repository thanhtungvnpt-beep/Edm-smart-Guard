import React, { useState, useMemo } from 'react';
import {
  Award,
  Brain,
  CheckCircle2,
  Clock,
  Gauge,
  Info,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Wrench,
  X,
  Zap,
  Lightbulb,
  CheckSquare,
  HelpCircle,
  ThumbsUp,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { AILearning, Device, Technician } from '../types';
import { soundManager } from '../utils/audio';
import { getStoredMaintenanceRecords } from '../utils/maintenanceHistoryData';
import { ModelMaintenanceChecklist, ChecklistItem } from './ModelMaintenanceChecklist';

interface RepairReportModalProps {
  device: Device | null;
  technicians?: Technician[];
  learnings?: AILearning[];
  onClose: () => void;
  onSuccess: (newLearning?: any) => void;
}

export const RepairReportModal: React.FC<RepairReportModalProps> = ({
  device,
  technicians = [],
  learnings = [],
  onClose,
  onSuccess,
}) => {
  if (!device) return null;

  // Identify assigned technician
  const technician = useMemo(() => {
    if (device.assignedTechnician) return device.assignedTechnician;
    if (technicians.length > 0) return technicians[0];
    return {
      id: 'tech-01',
      name: 'Lê Hoàng Nam',
      role: 'Chuyên gia Cắt Dây EDM',
      shift: 'Ca sáng',
      activeStatus: 'ON_DUTY' as const,
      phone: '090-482-1192',
      email: 'nam.le@edm.vn',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      fcmToken: '',
    };
  }, [device.assignedTechnician, technicians]);

  const activeIncident = device.activeIncident;
  const errorCode = activeIncident?.errorCode || 'E-102';
  const machineModel = device.model;
  const machineBrand = device.brand;
  const machineType = device.type;

  // --- AI ESTIMATED TIME TO REPAIR (ETTR) ENGINE ---
  const aiEttrAnalysis = useMemo(() => {
    // 1. Base error code time standard
    let baseMinutes = 35;
    let errorDescription = 'Ngắn mạch khe hở phóng điện & đứt dây';
    if (errorCode.includes('102') || errorCode === 'E-102') {
      baseMinutes = 35;
      errorDescription = 'Đứt dây liên tục & nghẹt vòi phun cao áp E-102';
    } else if (errorCode.includes('303') || errorCode === 'SPW-303') {
      baseMinutes = 45;
      errorDescription = 'Quá nhiệt biến tần IGBT & nguồn xung SPW-303';
    } else if (errorCode.includes('204') || errorCode === 'ALARM-204') {
      baseMinutes = 30;
      errorDescription = 'Tụt áp suất dung dịch điện môi & xả air ALARM-204';
    } else if (errorCode.includes('DIE') || errorCode === 'DIE-201') {
      baseMinutes = 40;
      errorDescription = 'Cảm biến nồng độ & rò rỉ điện môi DIE-201';
    } else if (errorCode.includes('Z') || errorCode === 'AXIS-Z') {
      baseMinutes = 50;
      errorDescription = 'Kẹt cơ khí dẫn hướng & block trượt trục Z';
    }

    // 2. Machine complexity multiplier
    let complexityFactor = 1.0;
    if (machineModel.toLowerCase().includes('makino') || machineModel.toLowerCase().includes('heat')) {
      complexityFactor = 1.05;
    } else if (machineModel.toLowerCase().includes('sodick')) {
      complexityFactor = 1.0;
    } else if (machineModel.toLowerCase().includes('fanuc')) {
      complexityFactor = 0.95;
    } else if (machineType.toLowerCase().includes('sinker')) {
      complexityFactor = 1.0;
    }

    // 3. Technician past efficiency calculation
    const pastRecords = getStoredMaintenanceRecords().filter(
      (r) =>
        r.technicianName.toLowerCase().includes(technician.name.toLowerCase()) ||
        technician.name.toLowerCase().includes(r.technicianName.toLowerCase())
    );

    const similarBrandRecords = pastRecords.filter(
      (r) =>
        r.taskTitle.toLowerCase().includes(machineBrand.toLowerCase()) ||
        r.findingsAndActions.toLowerCase().includes(machineBrand.toLowerCase()) ||
        r.deviceId === device.id
    );

    const techLearnings = learnings.filter(
      (l) =>
        l.discoveredBy.toLowerCase().includes(technician.name.toLowerCase()) ||
        technician.name.toLowerCase().includes(l.discoveredBy.toLowerCase())
    );

    let efficiencyMultiplier = 0.85;
    let pastAverageMinutes = baseMinutes;
    let completedSimilarCount = Math.max(similarBrandRecords.length, techLearnings.length, 1);

    if (similarBrandRecords.length > 0) {
      const totalPastDuration = similarBrandRecords.reduce((sum, r) => sum + (r.durationMinutes || 40), 0);
      pastAverageMinutes = Math.round(totalPastDuration / similarBrandRecords.length);
      const ratio = pastAverageMinutes / baseMinutes;
      efficiencyMultiplier = Math.min(1.2, Math.max(0.65, ratio));
    } else if (technician.role.toLowerCase().includes('chuyên gia') || technician.role.toLowerCase().includes('trưởng')) {
      efficiencyMultiplier = 0.78;
    }

    const rawEstimated = baseMinutes * efficiencyMultiplier * complexityFactor;
    const estimatedMinutes = Math.max(15, Math.round(rawEstimated));
    const rangeMin = Math.max(12, estimatedMinutes - 4);
    const rangeMax = estimatedMinutes + 5;
    const efficiencyPercent = Math.round((1 / efficiencyMultiplier) * 100);

    return {
      baseMinutes,
      errorDescription,
      complexityFactor,
      efficiencyMultiplier,
      efficiencyPercent,
      completedSimilarCount,
      estimatedMinutes,
      rangeMin,
      rangeMax,
      confidenceScore: 92,
    };
  }, [errorCode, machineModel, machineBrand, machineType, technician, device.id, learnings]);

  // Form states
  const [actualRootCause, setActualRootCause] = useState(
    'Đầu dẫn hướng kim cương Diamond Wire Guide bị bám cặn muội than do phôi cắt dày 80mm'
  );
  const [fixSummary, setFixSummary] = useState(
    'Tháo nắp bảo vệ cụm đầu phun trên, dùng que nỉ tẩm dung môi tẩy rửa chuyên dụng lau sạch cặn xỉ trong rãnh dẫn hướng, xỏ lại đoạn dây đồng 0.25mm mới và tăng áp suất xả nước phụ lên 1.35 Bar.'
  );
  const [solutionOutcome, setSolutionOutcome] = useState<
    'RESOLVED_PERMANENTLY' | 'TEMPORARY_BYPASS' | 'TUNED_PARAMETERS' | 'REPLACED_PARTS'
  >('RESOLVED_PERMANENTLY');
  const [aiRecommendationAccuracy, setAiRecommendationAccuracy] = useState<
    'VERY_ACCURATE' | 'PARTIALLY_ACCURATE' | 'INACCURATE' | 'NOT_APPLICABLE'
  >('VERY_ACCURATE');
  const [practicalTipsForAI, setPracticalTipsForAI] = useState(
    'Khi gặp góc lượn sắc R<0.3mm trên phôi SKD11, hãy giảm thông số dòng đỉnh IP 15% trước khi tháo đầu dẫn để tránh đứt dây oan.'
  );
  const [partsReplaced, setPartsReplaced] = useState('Đoạn dây đồng 0.25mm, que nỉ vệ sinh đầu dẫn kim cương');
  const [durationMinutes, setDurationMinutes] = useState<number>(aiEttrAnalysis.estimatedMinutes);
  const [aiRating, setAiRating] = useState(5);
  const [notes, setNotes] = useState('AI gợi ý kiểm tra áp lực nước rất chính xác, tiết kiệm hơn 20 phút chẩn đoán mò!');
  const [submitting, setSubmitting] = useState(false);
  const [appliedEttrToast, setAppliedEttrToast] = useState(false);
  const [checklistProgress, setChecklistProgress] = useState<{
    completed: number;
    total: number;
    items: ChecklistItem[];
  }>({ completed: 0, total: 0, items: [] });

  // Quick apply AI suggestion
  const handleApplyAiEttr = () => {
    setDurationMinutes(aiEttrAnalysis.estimatedMinutes);
    soundManager.playSuccessChime();
    setAppliedEttrToast(true);
    setTimeout(() => setAppliedEttrToast(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/devices/${device.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualRootCause,
          fixSummary,
          partsReplaced: partsReplaced.split(',').map((p) => p.trim()).filter(Boolean),
          durationMinutes: Number(durationMinutes),
          aiHelpfulRating: aiRating,
          technicianNotes: notes,
          solutionOutcome,
          aiRecommendationAccuracy,
          practicalTipsForAI,
          checklistCompleted: checklistProgress.completed,
          checklistTotal: checklistProgress.total,
        }),
      });

      const data = await res.json();
      if (data.success) {
        soundManager.playSuccessChime();
        onSuccess(data.newAILearning);
        onClose();
      }
    } catch (err) {
      console.error('Resolve error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const timeDifference = durationMinutes - aiEttrAnalysis.estimatedMinutes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-emerald-500/50 bg-slate-950 p-5 sm:p-6 shadow-2xl shadow-emerald-950/40">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Brain className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Nghiệm Thu Khắc Phục & Huấn Luyện AI
                </h2>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
                  Human-in-the-Loop Feedback
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Phản hồi của bạn giúp AI học giải pháp thực chiến, ghi nhớ mẹo xử lý và hoàn thiện thuật toán chẩn đoán!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-slate-900 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Machine Info Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/80 px-4 py-2.5 text-xs border border-slate-800">
          <span className="text-slate-400">
            Thiết bị: <strong className="text-white">{device.code} - {device.name}</strong> ({device.model})
          </span>
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 font-mono">
              Mã lỗi: <strong className="text-red-400">{errorCode}</strong>
            </span>
            <span className="text-amber-400 font-mono">
              KTV: {technician.name}
            </span>
          </div>
        </div>

        {/* AI ESTIMATED TIME TO REPAIR (ETTR) PANEL */}
        <div className="mt-4 rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900 p-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
                <Clock className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <span>AI Dự Báo Thời Gian Sửa Chữa (ETTR)</span>
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  </h3>
                  <span className="rounded bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.2 text-[10px] font-mono text-indigo-300">
                    Độ tin cậy {aiEttrAnalysis.confidenceScore}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Dựa trên mã lỗi <strong className="text-amber-300">{errorCode}</strong> và chỉ số hiệu suất quá khứ của KTV <strong className="text-white">{technician.name}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                  ~{aiEttrAnalysis.estimatedMinutes} <span className="text-xs font-normal text-slate-400">phút</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Dải kỳ vọng: {aiEttrAnalysis.rangeMin} - {aiEttrAnalysis.rangeMax}p
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyAiEttr}
                className="flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition"
                title="Tự động điền thời gian dự kiến từ AI vào báo cáo"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Áp Dụng</span>
              </button>
            </div>
          </div>

          {appliedEttrToast && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-2.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Đã áp dụng thời gian AI khuyến nghị ({aiEttrAnalysis.estimatedMinutes} phút) vào biểu mẫu!</span>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Section: Dynamic Model-Specific Maintenance Checklist (SOP) */}
          <ModelMaintenanceChecklist
            device={device}
            onChecklistChange={(completed, total, items) => {
              setChecklistProgress({ completed, total, items });
            }}
            onApplyToReportSummary={(summaryText) => {
              setFixSummary((prev) => (prev ? `${prev}\n\n${summaryText}` : summaryText));
            }}
          />

          {/* Section: AI Feedback & Solution Evaluation */}
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-4 space-y-3">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs border-b border-slate-800 pb-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span>Phản hồi giải pháp cho AI: Độ chính xác & Kết quả thực tế</span>
            </div>

            {/* AI Recommendation Accuracy */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                AI chẩn đoán ban đầu có chuẩn xác không?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'VERY_ACCURATE', label: 'Rất chính xác (100%)', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
                  { id: 'PARTIALLY_ACCURATE', label: 'Đúng một phần', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
                  { id: 'INACCURATE', label: 'Chưa sát thực tế', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                  { id: 'NOT_APPLICABLE', label: 'Không khả dụng', badge: 'bg-slate-800 text-slate-300 border-slate-700' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAiRecommendationAccuracy(item.id as any)}
                    className={`rounded-xl border p-2 text-left transition ${
                      aiRecommendationAccuracy === item.id
                        ? `${item.badge} ring-1 ring-emerald-400 font-bold`
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-[11px] leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Solution Outcome */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Kết quả nghiệm thu giải pháp kỹ thuật viên thực hiện:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'RESOLVED_PERMANENTLY', label: 'Khắc phục triệt để', desc: 'Đảm bảo không tái phát' },
                  { id: 'TEMPORARY_BYPASS', label: 'Bypass tạm thời', desc: 'Chạy gấp kịp đơn' },
                  { id: 'TUNED_PARAMETERS', label: 'Cân chỉnh thông số', desc: 'Chỉnh C-Condition' },
                  { id: 'REPLACED_PARTS', label: 'Thay mới linh kiện', desc: 'Lắp cụm phụ tùng mới' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSolutionOutcome(item.id as any)}
                    className={`rounded-xl border p-2 text-left transition ${
                      solutionOutcome === item.id
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500 font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-[11px] text-white font-medium">{item.label}</span>
                    <span className="block text-[9px] text-slate-400">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actual Root Cause */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              1. Nguyên nhân thực tế phát hiện tại hiện trường:
            </label>
            <input
              type="text"
              required
              value={actualRootCause}
              onChange={(e) => setActualRootCause(e.target.value)}
              placeholder="VD: Cặn muội carbon bịt kín màng rung cảm biến áp lực dầu..."
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actual Fix Applied */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              2. Phương án và giải pháp thực tế đã khắc phục thành công:
            </label>
            <textarea
              required
              rows={2}
              value={fixSummary}
              onChange={(e) => setFixSummary(e.target.value)}
              placeholder="Mô tả cụ thể thao tác: tháo van nào, dùng hóa chất gì, chỉnh thông số C-Condition nào..."
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Practical Tips For AI & Next Technicians */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-1.5">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span>3. Mẹo thực chiến KTV truyền đạt lại cho Bộ Não AI (AI Learning Tips):</span>
            </label>
            <textarea
              rows={2}
              value={practicalTipsForAI}
              onChange={(e) => setPracticalTipsForAI(e.target.value)}
              placeholder="Chia sẻ mẹo kinh nghiệm then chốt: mẹo vệ sinh nhanh, ngưỡng tham số an toàn, cách tránh kẹt dây..."
              className="w-full rounded-xl bg-slate-900/90 border border-amber-500/30 p-2.5 text-xs text-amber-100 placeholder-amber-400/40 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Parts Replaced & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                4. Linh kiện thay thế / Vật tư (phân tách bởi dấu phẩy):
              </label>
              <input
                type="text"
                value={partsReplaced}
                onChange={(e) => setPartsReplaced(e.target.value)}
                placeholder="VD: Cuộn dây 0.25mm, Lọc giấy 3um..."
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  5. Thời gian khắc phục thực tế (phút):
                </label>
                <span className="text-[11px] font-mono text-indigo-300">
                  AI ETTR: ~{aiEttrAnalysis.estimatedMinutes}p
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="600"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {/* Dynamic Comparison with AI ETTR */}
              <div className="mt-1.5">
                {timeDifference < 0 ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                    <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
                    <span>
                      Nhanh hơn dự báo AI {Math.abs(timeDifference)} phút (+{Math.round((Math.abs(timeDifference) / aiEttrAnalysis.estimatedMinutes) * 100)}% tốc độ!)
                    </span>
                  </span>
                ) : timeDifference === 0 ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Chuẩn xác 100% với thời gian AI dự báo!</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                    <span>
                      Vượt dự báo AI {timeDifference} phút (Khó khăn phát sinh sẽ được nạp vào bài học AI)
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Feedback & Rating */}
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-200">
                Đánh giá chất lượng hỗ trợ của AI trong ca này:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setAiRating(star)}
                    className="p-1 text-slate-500 hover:text-amber-400 transition"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= aiRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Góp ý hoàn thiện AI: 'Đề xuất rất sát, nhưng lần sau lưu ý kiểm tra cả khớp nối Q-03'..."
              className="mt-2.5 w-full rounded-xl bg-slate-900/90 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Action Buttons & Checklist Compliance Info */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Tiến độ quy trình SOP:</span>
              <span
                className={`inline-flex items-center gap-1 font-mono font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                  checklistProgress.total > 0 && checklistProgress.completed === checklistProgress.total
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                <CheckSquare className="h-3 w-3" />
                <span>
                  {checklistProgress.completed}/{checklistProgress.total} Hoàn Tất
                </span>
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-amber-300" />
                    <span>AI đang học & tích lũy kinh nghiệm...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Xác Nhận Nghiệm Thu & Nạp Tri Thức Vào AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
