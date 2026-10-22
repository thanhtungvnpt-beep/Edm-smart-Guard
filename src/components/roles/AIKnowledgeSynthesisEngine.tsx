import React, { useState, useEffect } from 'react';
import {
  Brain,
  BookOpen,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  User,
  Plus,
  RefreshCw,
  Send,
  ThumbsUp,
  Star,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  Tag,
  Clock,
  Layers,
  Wrench,
  Zap,
} from 'lucide-react';
import { TechnicalDocument, AILearning, Device } from '../../types';
import { soundManager } from '../../utils/audio';

interface AIKnowledgeSynthesisEngineProps {
  devices?: Device[];
  onApplyToDiagnosis?: (errorCode: string, targetModel: string) => void;
  onToast?: (message: string) => void;
}

interface SynthesisResponse {
  summary: string;
  confidenceScore: number;
  synthesizedProcedure: string[];
  humanTipsHighlight?: string;
  preventativeGuidelines: string[];
  safetyWarnings: string[];
  recommendedParts?: string[];
  synthesizedAt: string;
  citedDocuments: {
    id: string;
    title: string;
    category: string;
    targetModel: string;
    author: string;
    updatedAt: string;
    summary?: string;
  }[];
  citedHumanLearnings: {
    id: string;
    title: string;
    technicianName: string;
    machineModel: string;
    errorCode: string;
    timesAppliedSuccessfully: number;
    effectivenessRating: number;
    humanFixSummary: string;
    practicalTips?: string;
  }[];
  totalDocsInBrain?: number;
  totalLearningsInBrain?: number;
}

export const AIKnowledgeSynthesisEngine: React.FC<AIKnowledgeSynthesisEngineProps> = ({
  devices,
  onApplyToDiagnosis,
  onToast,
}) => {
  const [query, setQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState<SynthesisResponse | null>(null);

  // Modal: Add New Technical Document
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocModel, setNewDocModel] = useState('Makino U6 H.E.A.T');
  const [newDocCategory, setNewDocCategory] = useState<'SOP' | 'MAINTENANCE_GUIDE' | 'OEM_ERROR_CODES'>('SOP');
  const [newDocAuthor, setNewDocAuthor] = useState('Nguyễn Văn Hùng (Kỹ sư Trưởng)');
  const [newDocContent, setNewDocContent] = useState('');
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  // Modal: Add New Human Repair Procedure
  const [showAddLearningModal, setShowAddLearningModal] = useState(false);
  const [newLearnTitle, setNewLearnTitle] = useState('');
  const [newLearnErrorCode, setNewLearnErrorCode] = useState('E-102');
  const [newLearnModel, setNewLearnModel] = useState('Makino U6 H.E.A.T');
  const [newLearnTech, setNewLearnTech] = useState('Lê Hoàng Nam (Chuyên gia Cắt Dây)');
  const [newLearnFix, setNewLearnFix] = useState('');
  const [newLearnTips, setNewLearnTips] = useState('');
  const [isSubmittingLearning, setIsSubmittingLearning] = useState(false);

  // Preset query shortcuts for shopfloor convenience
  const PRESET_QUERIES = [
    { label: '⚡ Đứt dây góc nhọn R<0.2 (E-102)', code: 'E-102', model: 'Sodick ALC600G' },
    { label: '💧 Tụt áp suất màng cảm biến (ALARM-204)', code: 'ALARM-204', model: 'Makino U6 H.E.A.T' },
    { label: '🔧 Kẹt bi van 1 chiều Chuck 3R (E-408)', code: 'E-408', model: 'FORM E 350' },
    { label: '🔥 Quá nhiệt IGBT tủ phát xung (ALARM-501)', code: 'ALARM-501', model: 'Makino U6 H.E.A.T' },
    { label: '📏 Hiệu chuẩn độ thẳng tháp U/V đá Granite (E-303)', code: 'E-303', model: 'Fanuc α-C600iB' },
  ];

  // Perform AI Knowledge Synthesis
  const handleSynthesize = async (overrideQuery?: string, overrideModel?: string, overrideCode?: string) => {
    const qToSend = overrideQuery !== undefined ? overrideQuery : query;
    const modelToSend = overrideModel !== undefined ? overrideModel : selectedModel;
    const codeToSend = overrideCode !== undefined ? overrideCode : '';

    setLoading(true);
    soundManager.playBeep();

    try {
      const res = await fetch('/api/ai/synthesize-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: qToSend,
          machineModel: modelToSend,
          errorCode: codeToSend,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSynthesisResult(data.data);
        soundManager.playSuccessChime();
        if (onToast) {
          onToast('⚡ AI đã tổng hợp thành công tri thức từ tài liệu SOP và kinh nghiệm thợ!');
        }
      }
    } catch (e) {
      console.error('Synthesis failed:', e);
      if (onToast) {
        onToast('❌ Không thể kết nối với Bộ Não Tri Thức AI');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial synthesis run on load
  useEffect(() => {
    handleSynthesize('Quy trình xử lý sự cố đứt dây và tụt áp suất nước xả', 'Makino U6 H.E.A.T', 'E-102');
  }, []);

  // Submit new SOP Document to AI Knowledge Base
  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim()) return;

    setIsSubmittingDoc(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDocTitle.trim(),
          category: newDocCategory,
          targetModel: newDocModel,
          author: newDocAuthor,
          content: newDocContent.trim(),
          summary: newDocContent.slice(0, 150) + '...',
          tags: ['SOP_MỚI', newDocModel, newDocCategory],
        }),
      });

      const data = await res.json();
      if (data.success) {
        soundManager.playSuccessChime();
        setShowAddDocModal(false);
        setNewDocTitle('');
        setNewDocContent('');
        if (onToast) {
          onToast(`✓ Đã nạp tài liệu "${newDocTitle}" vào Bộ Não AI! AI đã học tri thức mới.`);
        }
        // Refresh synthesis with new knowledge
        handleSynthesize(newDocTitle, newDocModel);
      }
    } catch {
      if (onToast) onToast('❌ Lỗi khi tải tài liệu lên');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  // Submit new Human Repair Learning
  const handleSaveLearning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLearnTitle.trim() || !newLearnFix.trim()) return;

    setIsSubmittingLearning(true);
    try {
      const res = await fetch('/api/ai/learnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newLearnTitle.trim(),
          errorCode: newLearnErrorCode.trim(),
          machineModel: newLearnModel.trim(),
          discoveredBy: newLearnTech.trim(),
          problemStatement: newLearnTitle.trim(),
          humanSolution: newLearnFix.trim(),
          practicalTips: newLearnTips.trim(),
          effectivenessRating: 5,
        }),
      });

      const data = await res.json();
      if (data.success) {
        soundManager.playSuccessChime();
        setShowAddLearningModal(false);
        setNewLearnTitle('');
        setNewLearnFix('');
        setNewLearnTips('');
        if (onToast) {
          onToast(`✓ Đã ghi nhớ mẹo thực chiến của ${newLearnTech} vào cơ sở tri thức AI!`);
        }
        handleSynthesize(newLearnTitle, newLearnModel, newLearnErrorCode);
      }
    } catch {
      if (onToast) onToast('❌ Lỗi lưu bài học');
    } finally {
      setIsSubmittingLearning(false);
    }
  };

  return (
    <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-950 p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Header with Title & Action Upload Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-950/50">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold block">
                Cơ Chế Học Hỏi & Truy Vấn Tri Thức Kỹ Thuật (Knowledge Synthesis Engine)
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Bộ Não Tri Thức AI: Học Từ Tài Liệu SOP & Quy Trình Thợ Thực Chiến
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            AI tự động hấp thu mọi tài liệu kỹ thuật cập nhật (SOP/OEM) và các biên bản sửa chữa thực tế của kỹ thuật viên. Khi có sự cố, AI truy vấn và tổng hợp cả lý thuyết lẫn kinh nghiệm thực tế kèm trích dẫn đối chứng.
          </p>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAddDocModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 transition shadow-sm"
          >
            <BookOpen className="h-3.5 w-3.5 text-blue-400" />
            <span>+ Nạp Tài Liệu SOP Mới</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddLearningModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white transition shadow-md shadow-indigo-950/50"
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-300" />
            <span>+ Đóng Góp Mẹo Sửa Chữa</span>
          </button>
        </div>
      </div>

      {/* Interactive Query & Search Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Machine Filter Dropdown */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0 font-medium"
          >
            <option value="ALL">Toàn Bộ Dòng Máy EDM</option>
            <option value="Makino U6">Makino U6 H.E.A.T (Wire)</option>
            <option value="Sodick ALC600G">Sodick ALC600G (Wire)</option>
            <option value="Fanuc">Fanuc Robocut α-C600iB</option>
            <option value="AgieCharmilles">GF AgieCharmilles FORM E</option>
            <option value="PLC">Tủ Điện PLC & Thủy Lực</option>
          </select>

          {/* Search Query Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSynthesize();
              }}
              placeholder="Nhập triệu chứng, mã lỗi (E-102, ALARM-204) hoặc thao tác cần AI tổng hợp..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <button
            type="button"
            onClick={() => handleSynthesize()}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-5 py-2 text-xs font-bold text-white transition shadow-lg shadow-indigo-950/60 disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Đang Truy Vấn Tri Thức...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>AI Truy Vấn & Tổng Hợp</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Click Shortcut Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
          <span className="text-slate-500 shrink-0 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            <span>Chủ đề nhanh:</span>
          </span>
          {PRESET_QUERIES.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(p.label);
                setSelectedModel(p.model);
                handleSynthesize(p.label, p.model, p.code);
              }}
              className="rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 text-slate-300 hover:text-white transition shrink-0"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Synthesis Result Display */}
      {synthesisResult && (
        <div className="space-y-4 rounded-2xl border border-indigo-500/40 bg-slate-950/90 p-5 shadow-xl animate-in fade-in">
          {/* Result Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Kết Quả Tổng Hợp Tri Thức Kỹ Thuật AI (Synthesized Knowledge)</span>
                  <span className="rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold px-2 py-0.2 border border-indigo-500/40">
                    Độ tin cậy: {synthesisResult.confidenceScore}%
                  </span>
                </h3>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Tổng hợp từ: <strong className="text-blue-300">{synthesisResult.citedDocuments.length} tài liệu SOP</strong> & <strong className="text-amber-300">{synthesisResult.citedHumanLearnings.length} mẹo thực chiến thợ</strong>
            </div>
          </div>

          {/* Synthesis Core Summary */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 font-mono uppercase">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Phương Án Khắc Phục Tối Ưu Kết Hợp Lý Thuyết & Thực Tế:</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {synthesisResult.summary}
            </p>
          </div>

          {/* Human Tips Highlight Banner */}
          {synthesisResult.humanTipsHighlight && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3.5 flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-300 block font-mono">
                  Mẹo Thực Chiến Quý Giá Từ Kỹ Thuật Viên Đã Được AI Đúc Kết:
                </span>
                <p className="text-xs text-amber-100/90 mt-0.5 leading-relaxed">
                  {synthesisResult.humanTipsHighlight}
                </p>
              </div>
            </div>
          )}

          {/* Two-Column Grid: Step-by-Step Procedure & Cited Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left (7 Cols): Synthesized Procedure */}
            <div className="lg:col-span-7 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-blue-400" />
                <span>Quy Trình Sửa Chữa Từng Bước Đã Chuẩn Hóa:</span>
              </h4>

              <div className="space-y-2">
                {synthesisResult.synthesizedProcedure.map((step, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-slate-900/80 border border-slate-800 p-3 text-xs flex items-start gap-2.5 text-slate-200"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>

              {/* Preventative Guidelines */}
              <div className="pt-2">
                <span className="text-[11px] font-mono text-emerald-400 font-bold block mb-1.5 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Biện Pháp Phòng Ngừa Tái Phát (Preventative Actions):</span>
                </span>
                <div className="space-y-1.5">
                  {synthesisResult.preventativeGuidelines.map((guideline, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{guideline}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right (5 Cols): Verifiable Citations (Documents & Human Procedures) */}
            <div className="lg:col-span-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>Bằng Chứng & Nguồn Trích Dẫn (Verifiable Citations):</span>
              </h4>

              {/* Cited Documents */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-blue-400 font-bold block uppercase">
                  Tài Liệu SOP / Cẩm Nang Hãng Trích Dẫn:
                </span>
                {synthesisResult.citedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-xl bg-blue-950/20 border border-blue-500/30 p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-200">{doc.title}</span>
                      <span className="text-[9px] font-mono text-blue-300 bg-blue-500/20 px-1.5 py-0.2 rounded">
                        {doc.category}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                      <span>Máy: {doc.targetModel}</span>
                      <span>Tác giả: {doc.author}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cited Human Learnings */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono text-amber-400 font-bold block uppercase">
                  Bài Học Thực Chiến Của Kỹ Thuật Viên:
                </span>
                {synthesisResult.citedHumanLearnings.map((learn) => (
                  <div
                    key={learn.id}
                    className="rounded-xl bg-amber-950/20 border border-amber-500/30 p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-200">{learn.title}</span>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold">
                        Đã áp dụng: {learn.timesAppliedSuccessfully} lần
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">
                      {learn.humanFixSummary}
                    </p>
                    <div className="text-[10px] text-amber-300/80 font-mono flex items-center justify-between pt-1 border-t border-amber-500/20">
                      <span>KTV: {learn.technicianName}</span>
                      <span>Mã lỗi: {learn.errorCode}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW SOP DOCUMENT */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-400" />
                <span>Nạp Tài Liệu SOP / Cẩm Nang Kỹ Thuật Mới Vào AI</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tiêu đề tài liệu:</label>
                <input
                  type="text"
                  required
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Ví dụ: Quy trình hiệu chuẩn tháp cắt U-V chuẩn đá Granite"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Dòng máy áp dụng:</label>
                  <input
                    type="text"
                    required
                    value={newDocModel}
                    onChange={(e) => setNewDocModel(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phân loại:</label>
                  <select
                    value={newDocCategory}
                    onChange={(e: any) => setNewDocCategory(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="SOP">Quy trình chuẩn SOP</option>
                    <option value="MAINTENANCE_GUIDE">Cẩm nang bảo trì OEM</option>
                    <option value="OEM_ERROR_CODES">Bảng mã lỗi nhà sản xuất</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tác giả / Kỹ sư phụ trách:</label>
                <input
                  type="text"
                  required
                  value={newDocAuthor}
                  onChange={(e) => setNewDocAuthor(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nội dung kỹ thuật chi tiết:</label>
                <textarea
                  rows={5}
                  required
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  placeholder="Mô tả cụ thể thông số cài đặt, các bước kiểm tra, giá trị đo lường và cảnh báo..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-slate-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDoc}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-white font-bold transition flex items-center gap-1.5"
                >
                  {isSubmittingDoc ? 'Đang Nạp...' : 'Nạp Vào Bộ Não AI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW HUMAN REPAIR PROCEDURE */}
      {showAddLearningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span>Đóng Góp Mẹo Thực Chiến Thợ Cho Bộ Não AI Học Hỏi</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddLearningModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLearning} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tên bài học kinh nghiệm:</label>
                <input
                  type="text"
                  required
                  value={newLearnTitle}
                  onChange={(e) => setNewLearnTitle(e.target.value)}
                  placeholder="Ví dụ: Giảm dòng đỉnh IP 15% khi cắt góc nhọn R<0.2mm"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Mã lỗi liên quan:</label>
                  <input
                    type="text"
                    required
                    value={newLearnErrorCode}
                    onChange={(e) => setNewLearnErrorCode(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Dòng máy áp dụng:</label>
                  <input
                    type="text"
                    required
                    value={newLearnModel}
                    onChange={(e) => setNewLearnModel(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Kỹ thuật viên đúc kết:</label>
                <input
                  type="text"
                  required
                  value={newLearnTech}
                  onChange={(e) => setNewLearnTech(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Quy trình xử lý thực tế:</label>
                <textarea
                  rows={3}
                  required
                  value={newLearnFix}
                  onChange={(e) => setNewLearnFix(e.target.value)}
                  placeholder="Các thao tác cụ thể mà bạn đã làm để xử lý dứt điểm sự cố..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mẹo thực chiến cho AI ghi nhớ:</label>
                <textarea
                  rows={2}
                  value={newLearnTips}
                  onChange={(e) => setNewLearnTips(e.target.value)}
                  placeholder="Lưu ý đặc biệt, mẹo rút ngắn thời gian thao tác..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddLearningModal(false)}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-slate-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLearning}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 px-4 py-2 text-slate-950 font-bold transition flex items-center gap-1.5"
                >
                  {isSubmittingLearning ? 'Đang Lưu...' : 'Lưu Bài Học Cho AI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
