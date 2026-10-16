import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Download,
  FileCode,
  FileText,
  Plus,
  Search,
  Sparkles,
  Tag,
  UploadCloud,
  X,
  Layers,
  Cpu,
  Sliders,
  Send,
  HelpCircle,
  FileImage,
  Table,
  Wrench,
  Zap,
  ArrowRight,
  ShieldAlert,
  Check,
  RotateCcw,
} from 'lucide-react';
import { TechnicalDocument } from '../types';
import { SystemDocumentationModal } from './SystemDocumentationModal';

interface DocumentsTabProps {
  documents: TechnicalDocument[];
  onDocumentAdded: (newDoc: TechnicalDocument) => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  onDocumentAdded,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSystemDocModal, setShowSystemDocModal] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TechnicalDocument['category']>('SCHEMATICS');
  const [targetModel, setTargetModel] = useState('Makino U6 H.E.A.T');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('EDM, Sơ đồ, Mạch xung, IGBT');
  const [fileType, setFileType] = useState<'PDF' | 'IMAGE_SCHEMATIC' | 'TEXT' | 'CSV_SPECS' | 'MANUAL'>('IMAGE_SCHEMATIC');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // AI Knowledge Retrieval (Q&A) states
  const [qaQuery, setQaQuery] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaResult, setQaResult] = useState<{
    answer: string;
    actionSteps?: string[];
    safetyWarning?: string;
    confidenceScore?: number;
    citedDocuments?: Array<{ id: string; title: string; category: string; targetModel: string }>;
    citedLearnings?: Array<{ id: string; title: string; discoveredBy: string; errorCode: string }>;
  } | null>(null);

  const filtered = documents.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.targetModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    if (file.type.startsWith('image/')) {
      setFileType('IMAGE_SCHEMATIC');
      setCategory('SCHEMATICS');
      if (!title) setTitle(`Sơ đồ kỹ thuật: ${file.name.replace(/\.[^/.]+$/, '')}`);
      const reader = new FileReader();
      reader.onload = () => {
        setImageData(reader.result as string);
        setContent(
          `Bản vẽ sơ đồ kỹ thuật (Hình ảnh đã tải lên: ${file.name}). AI sẽ quét quang học nhận diện các khối mạch, linh kiện bán dẫn và điểm đo test-point.`
        );
      };
      reader.readAsDataURL(file);
    } else {
      // Text, Markdown, CSV or JSON
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        setContent(text.slice(0, 5000));
        if (file.name.endsWith('.csv')) {
          setFileType('CSV_SPECS');
          setCategory('TECHNICAL_SPECS');
        } else if (file.name.endsWith('.pdf')) {
          setFileType('PDF');
        }
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
      };
      reader.readAsText(file);
    }
  };

  // Preset demo uploads
  const handleApplyPreset = (type: 'schematic_makino' | 'manual_sodick' | 'specs_fanuc') => {
    if (type === 'schematic_makino') {
      setTitle('Sơ đồ nguyên lý khối phát xung công suất IGBT & Cụm van xả áp Makino U6 H.E.A.T');
      setCategory('SCHEMATICS');
      setFileType('IMAGE_SCHEMATIC');
      setTargetModel('Makino U6 H.E.A.T');
      setFileName('Makino_U6_Generator_Schematic_Rev4.dwg.png');
      setFileSize('1.4 MB');
      setContent(`SƠ ĐỒ KHỐI ĐIỆN TỬ NGUỒN XUNG PHÁT TIA LỬA ĐIỆN MAKINO U6 H.E.A.T (REV.4):
- Khối 1: Nguồn cấp DC Bus 280V qua cầu chỉnh lưu 3 pha và tụ lọc 4700uF/450V.
- Khối 2: Cầu H bán dẫn IGBT công suất cao (Mitsubishi CM100DY-24NF) điều xung tần số 100kHz - 500kHz.
- Khối 3: Mạch bảo vệ chống ngắn mạch hồ quang (Arc Detection Circuit) kết nối trực tiếp với cảm biến điện áp khe hở Spark Gap S-02.
- Khối 4: Cụm điều áp van xả dung dịch điện môi áp lực cao High-Pressure Flushing Solenoid SV-102 (điện áp kích 24VDC, áp suất làm việc 1.2 - 1.8 MPa).
- Điểm kiểm tra Test Point TP-10: Điện áp xung chuẩn 56V - 62V tại đầu cực gá dây cắt trên.`);
      setTags('Makino, Sơ đồ, Mạch xung, IGBT, Van xả áp, Schematics');
    } else if (type === 'manual_sodick') {
      setTitle('Sổ tay quy trình sửa chữa & cân chỉnh dao cắt nhiệt xỏ dây tự động AWF Sodick ALC600G');
      setCategory('MAINTENANCE_GUIDE');
      setFileType('MANUAL');
      setTargetModel('Sodick ALC600G');
      setFileName('Sodick_AWF_Cutter_Troubleshooting_Guide.pdf');
      setFileSize('3.2 MB');
      setContent(`HƯỚNG DẪN BẢO TRÌ VÀ KHẮC PHỤC SỰ CỐ CỤM XỎ DÂY TỰ ĐỘNG AWF (AUTOMATIC WIRE FEEDING):
1. Mã lỗi AWF-02: Dây đồng không qua được ống Jet Nozzle do đầu cắt nhiệt bị xơ hoặc ba-via.
2. Quy trình kiểm tra định kỳ:
   - Dùng thước căn lá 0.05mm kiểm tra khe hở giữa hai lưỡi dao cắt nhiệt Annealing Cutter.
   - Đo điện trở sợi đốt dây nhiệt (điện trở chuẩn 2.2 - 2.8 Ohm).
   - Vệ sinh mạt cháy bám trên điện cực nung bằng que gốm tẩm cồn công nghiệp IPA 99%.
3. Lưu ý an toàn: Tắt công tắc cấp nhiệt Anneal Heater trước khi dùng tay chạm vào cụm xỏ dây.
4. Mẹo hiện trường: Nếu dây đồng bị quăn gập sau khi cắt nhiệt, hãy giảm thông số Annealing Current từ mức 6 xuống mức 4 trên màn hình CNC.`);
      setTags('Sodick, AWF, Cắt nhiệt, Sửa chữa, SOP, Bảo trì');
    } else if (type === 'specs_fanuc') {
      setTitle('Bảng thông số kỹ thuật chế độ phóng điện & lực căng dây phôi thép khuôn SKD11 Fanuc Robocut');
      setCategory('TECHNICAL_SPECS');
      setFileType('CSV_SPECS');
      setTargetModel('Fanuc Robocut α-C400iC');
      setFileName('Fanuc_Cutting_Condition_SKD11_Parameters.csv');
      setFileSize('480 KB');
      setContent(`BẢNG THÔNG SỐ CÔNG NGHỆ GIA CÔNG CẮT DÂY (CUTTING CONDITION TABLE) - VẬT LIỆU THÉP SKD11 (ĐỘ CỨNG 58-62 HRC):
| Độ dày phôi (mm) | Dòng đỉnh IP (A) | Điện áp hở mạch (V) | Thời gian xung ON (us) | Lực căng dây WT (N) | Áp suất nước xả (MPa) | Tốc độ cắt (mm/min) |
|------------------|-------------------|----------------------|------------------------|---------------------|-----------------------|---------------------|
| 20mm             | 18 A              | 52 V                 | 12 us                  | 11.5 N              | 0.8 MPa               | 3.8 mm/min          |
| 40mm             | 24 A              | 56 V                 | 16 us                  | 12.5 N              | 1.1 MPa               | 2.4 mm/min          |
| 60mm             | 28 A              | 58 V                 | 22 us                  | 13.5 N              | 1.35 MPa              | 1.7 mm/min          |
| 80mm             | 32 A              | 60 V                 | 28 us                  | 14.5 N              | 1.55 MPa              | 1.2 mm/min          |
| 100mm            | 36 A              | 62 V                 | 32 us                  | 15.0 N              | 1.70 MPa              | 0.9 mm/min          |
Ghi chú: Dung môi điện môi sử dụng nước khử ion độ dẫn 4.0 - 5.5 uS/cm. Sử dụng dây đồng Brass Wire đường kính 0.25mm dung sai h6.`);
      setTags('Fanuc, Thông số kỹ thuật, C-Condition, SKD11, Cắt dây, Dòng đỉnh');
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          targetModel: targetModel.trim(),
          content: content.trim(),
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          fileType,
          fileName: fileName || `${title.slice(0, 25)}.doc`,
          fileSize: fileSize || '350 KB',
          imageData: imageData || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        onDocumentAdded(data.data);
        setShowAddModal(false);
        setTitle('');
        setContent('');
        setImageData(null);
        setFileName('');
      }
    } catch (e) {
      console.error('Add doc error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  // AI Knowledge Retrieval Q&A submit
  const handleKnowledgeQuery = async (queryText?: string) => {
    const q = queryText || qaQuery;
    if (!q.trim()) return;

    setQaLoading(true);
    try {
      const res = await fetch('/api/ai/knowledge/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q.trim(),
          filterCategory: selectedCategory,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setQaResult(data.data);
      }
    } catch (err) {
      console.error('Knowledge query error:', err);
    } finally {
      setQaLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Technical Documentation Hub */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/40 bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/40">
                <BookOpen className="h-5 w-5" />
              </span>
              <span className="rounded bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-300">
                TECHNICAL KNOWLEDGE BASE (RAG)
              </span>
              <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Đồng Bộ Tức Thời Với AI
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Cập Nhật Tài Liệu Kỹ Thuật Cho Cơ Sở Tri Thức AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tải lên các tài liệu kỹ thuật mới (<strong>hướng dẫn sửa chữa</strong>, <strong>sơ đồ mạch điện/thủy lực</strong>, <strong>thông số kỹ thuật</strong>). AI sẽ tự động đọc, quét linh kiện, lập chỉ mục RAG và áp dụng chính xác vào các tình huống phân tích sự cố và tư vấn kỹ thuật viên!
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-5 py-3 font-bold text-white shadow-xl shadow-blue-600/30 transition active:scale-95 shrink-0"
            >
              <UploadCloud className="h-5 w-5" />
              <span>Tải Lên Tài Liệu Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI KNOWLEDGE RETRIEVAL & Q&A WIDGET (RAG TESTER) */}
      <div className="rounded-3xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Trợ Lý Tra Cứu & Hỏi Đáp Cơ Sở Tri Thức AI</span>
                <span className="rounded bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                  Grounded in Docs + Learnings
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Kiểm chứng trực tiếp cách AI kết hợp tài liệu kỹ thuật vừa tải lên và kinh nghiệm KTV để giải đáp sự cố!
              </p>
            </div>
          </div>
        </div>

        {/* Query Input Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
            <input
              type="text"
              value={qaQuery}
              onChange={(e) => setQaQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleKnowledgeQuery()}
              placeholder="VD: Kiểm tra khối IGBT và van xả áp trong sơ đồ Makino U6 như thế nào? Hoặc thông số cắt phôi SKD11 dày 60mm..."
              className="w-full rounded-2xl bg-slate-950/80 border border-indigo-500/40 pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
            />
          </div>
          <button
            onClick={() => handleKnowledgeQuery()}
            disabled={qaLoading || !qaQuery.trim()}
            className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 shrink-0"
          >
            {qaLoading ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin text-amber-300" />
                <span>AI đang tra cứu...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Tra Cứu</span>
              </>
            )}
          </button>
        </div>

        {/* Sample Question Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Gợi ý câu hỏi kiểm chứng:</span>
          {[
            'Sơ đồ Makino: nguồn xung IGBT và van xả áp hoạt động ra sao?',
            'Thông số Fanuc: cắt phôi thép SKD11 60mm đặt dòng đỉnh và áp lực bao nhiêu?',
            'Hướng dẫn Sodick: mẹo xử lý kẹt dao xỏ dây AWF và căn chỉnh khe hở?',
          ].map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQaQuery(sample);
                handleKnowledgeQuery(sample);
              }}
              className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/40 px-2.5 py-1 text-[11px] text-indigo-200 transition text-left"
            >
              "{sample}"
            </button>
          ))}
        </div>

        {/* QA Result Card */}
        {qaResult && (
          <div className="rounded-2xl border border-emerald-500/40 bg-slate-950/90 p-4.5 sm:p-5 space-y-3.5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">
                  Kết Quả Phân Tích Từ Cơ Sở Tri Thức AI (Độ tin cậy: {qaResult.confidenceScore || 95}%)
                </span>
              </div>
              <button
                onClick={() => setQaResult(null)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                Đóng
              </button>
            </div>

            {/* Answer */}
            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
              {qaResult.answer}
            </p>

            {/* Action Steps */}
            {qaResult.actionSteps && qaResult.actionSteps.length > 0 && (
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 text-xs space-y-1.5">
                <span className="font-semibold text-cyan-300 block">Quy trình các bước khuyến nghị:</span>
                {qaResult.actionSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-600/30 text-cyan-300 font-mono text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Safety Warning */}
            {qaResult.safetyWarning && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-950/30 border border-amber-500/30 px-3 py-2 text-xs text-amber-200">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{qaResult.safetyWarning}</span>
              </div>
            )}

            {/* Citations Box */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="font-mono text-purple-300 font-semibold">Căn cứ trích dẫn:</span>
              {qaResult.citedDocuments?.map((doc) => (
                <span key={doc.id} className="rounded bg-blue-950/40 border border-blue-500/30 px-2 py-0.5 text-blue-300">
                  📄 {doc.title}
                </span>
              ))}
              {qaResult.citedLearnings?.map((l) => (
                <span key={l.id} className="rounded bg-purple-950/40 border border-purple-500/30 px-2 py-0.5 text-purple-300">
                  🧠 KTV {l.discoveredBy} ({l.errorCode})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'Tất cả tài liệu' },
            { id: 'SCHEMATICS', label: '⚡ Sơ đồ kỹ thuật' },
            { id: 'TECHNICAL_SPECS', label: '📊 Thông số kỹ thuật' },
            { id: 'MAINTENANCE_GUIDE', label: '🔧 Hướng dẫn sửa chữa' },
            { id: 'OEM_ERROR_CODES', label: 'Bảng mã lỗi' },
            { id: 'SOP', label: 'Quy trình SOP' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                selectedCategory === cat.id
                  ? 'border-blue-500 bg-blue-600/30 text-blue-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên máy, mã lỗi, linh kiện..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-3.5">
        {filtered.map((doc) => {
          const isExpanded = expandedDocId === doc.id;
          const isSchematic = doc.category === 'SCHEMATICS' || doc.fileType === 'IMAGE_SCHEMATIC';
          const isSpecs = doc.category === 'TECHNICAL_SPECS' || doc.fileType === 'CSV_SPECS';
          const isGuide = doc.category === 'MAINTENANCE_GUIDE' || doc.category === 'OPERATING_MANUAL' || doc.category === 'SOP';

          return (
            <div
              key={doc.id}
              className={`rounded-2xl border p-4 sm:p-5 transition shadow-lg ${
                isSchematic
                  ? 'border-amber-500/30 bg-slate-900/70 hover:border-amber-500/50'
                  : isSpecs
                  ? 'border-cyan-500/30 bg-slate-900/70 hover:border-cyan-500/50'
                  : 'border-slate-800 bg-slate-900/60 hover:border-blue-500/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                      isSchematic
                        ? 'bg-amber-600/20 border-amber-500/40 text-amber-400'
                        : isSpecs
                        ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-400'
                        : 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                    }`}
                  >
                    {isSchematic ? (
                      <Layers className="h-5 w-5" />
                    ) : isSpecs ? (
                      <Table className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {doc.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="font-mono text-amber-400 font-semibold">{doc.targetModel}</span>
                      <span>• Cập nhật: {doc.updatedAt}</span>
                      <span>• Tác giả: {doc.author}</span>
                      {doc.fileName && (
                        <span className="font-mono text-slate-500 text-[11px]">[{doc.fileName}]</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-lg border px-2.5 py-0.5 text-[11px] font-mono font-medium ${
                      isSchematic
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : isSpecs
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    }`}
                  >
                    {doc.category}
                  </span>
                  <button
                    onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                    className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-200 transition font-medium"
                  >
                    {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                  </button>
                </div>
              </div>

              {/* AI Index Summary */}
              <div className="mt-3 rounded-xl bg-slate-950/70 border border-slate-800/80 p-3 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 font-semibold text-purple-300 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Chỉ mục RAG AI trích xuất:</span>
                </div>
                <p className="leading-relaxed">{doc.summary}</p>
              </div>

              {/* Schematic Components Chips */}
              {doc.schematicComponents && doc.schematicComponents.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-amber-400 font-mono text-[10px] flex items-center gap-1">
                    <Cpu className="h-3 w-3" /> Linh kiện bóc tách:
                  </span>
                  {doc.schematicComponents.map((comp, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 text-amber-200 font-mono"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              )}

              {/* Technical Parameters Chips */}
              {doc.extractedParameters && Object.keys(doc.extractedParameters).length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-cyan-400 font-mono text-[10px] flex items-center gap-1">
                    <Sliders className="h-3 w-3" /> Thông số trích xuất:
                  </span>
                  {Object.entries(doc.extractedParameters).map(([k, v], idx) => (
                    <span
                      key={idx}
                      className="rounded bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 text-cyan-200 font-mono"
                    >
                      {k}: <strong className="text-white">{String(v)}</strong>
                    </span>
                  ))}
                </div>
              )}

              {/* Full Content if expanded */}
              {isExpanded && (
                <div className="mt-3.5 rounded-xl bg-black/60 border border-slate-800 p-4 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed animate-in fade-in">
                  {doc.content}
                </div>
              )}

              {/* Tags */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
                {doc.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-slate-400 border border-slate-700/60"
                  >
                    <Tag className="h-2.5 w-2.5 text-slate-400" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: UPLOAD NEW TECHNICAL DOCUMENT (MANUAL, SCHEMATIC, SPECS) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-blue-500/50 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Tải Lên Tài Liệu Kỹ Thuật Mới Cho AI
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hỗ trợ Sổ tay sửa chữa, Sơ đồ mạch điện/thủy lực và Bảng thông số kỹ thuật.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-full bg-slate-900 p-2 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div className="mt-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/30 p-3 space-y-2">
              <span className="text-xs font-semibold text-blue-200 block">
                Nạp nhanh dữ liệu mẫu thực tế xưởng (1-Click Presets):
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('schematic_makino')}
                  className="rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 px-2.5 py-1 text-amber-200 text-[11px] font-medium transition"
                >
                  ⚡ Sơ đồ nguồn xung Makino U6
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('manual_sodick')}
                  className="rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/40 px-2.5 py-1 text-blue-200 text-[11px] font-medium transition"
                >
                  🔧 Sổ tay sửa AWF Sodick ALC600G
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('specs_fanuc')}
                  className="rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 px-2.5 py-1 text-cyan-200 text-[11px] font-medium transition"
                >
                  📊 Bảng thông số Fanuc (SKD11)
                </button>
              </div>
            </div>

            <form onSubmit={handleAddDocument} className="mt-4 space-y-3.5">
              {/* File Upload Drop Zone */}
              <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-4 text-center hover:border-blue-500 transition">
                <input
                  type="file"
                  id="tech-file-input"
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.svg,.txt,.csv,.json,.md"
                  className="hidden"
                />
                <label
                  htmlFor="tech-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                >
                  <UploadCloud className="h-8 w-8 text-blue-400 animate-pulse" />
                  <span className="text-xs font-semibold text-white">
                    Bấm để chọn tệp hoặc kéo thả tệp tài liệu kỹ thuật vào đây
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Hỗ trợ: PDF (.pdf), Sơ đồ bản vẽ (.png, .jpg), Bảng thông số (.csv, .json), Sổ tay (.md, .txt)
                  </span>
                </label>

                {fileName && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Đã chọn tệp: <strong>{fileName}</strong> ({fileSize})</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tiêu đề tài liệu / Mã bản vẽ:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Sơ đồ khối nguồn xung cao tần Makino U6..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dòng máy áp dụng:
                  </label>
                  <input
                    type="text"
                    required
                    value={targetModel}
                    onChange={(e) => setTargetModel(e.target.value)}
                    placeholder="VD: Makino U6, Sodick ALC600G..."
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phân loại tài liệu:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SCHEMATICS">⚡ Sơ Đồ Mạch Điện / Thủy Lực / Khí Nén</option>
                    <option value="TECHNICAL_SPECS">📊 Bảng Thông Số Kỹ Thuật (C-Condition)</option>
                    <option value="MAINTENANCE_GUIDE">🔧 Hướng Dẫn Sửa Chữa & Bảo Trì</option>
                    <option value="OPERATING_MANUAL">Sổ Tay Vận Hành Máy</option>
                    <option value="OEM_ERROR_CODES">Bảng Mã Lỗi Nhà Sản Xuất (OEM)</option>
                    <option value="SOP">Quy Trình Chuẩn (SOP Vận Hành)</option>
                  </select>
                </div>
              </div>

              {/* Content textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nội dung chi tiết / Thông số / Ghi chú kỹ thuật:
                </label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập thông số, mô tả khối mạch, quy trình thao tác hoặc dán nội dung vào đây..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Thẻ từ khóa tra cứu (Tags):
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="EDM, Cắt dây, Áp suất, Sơ đồ, Thông số..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      <span>AI đang bóc tách & lập chỉ mục...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Nạp & Cập Nhật Cơ Sở Tri Thức AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official System Documentation Viewer Modal */}
      <SystemDocumentationModal
        isOpen={showSystemDocModal}
        onClose={() => setShowSystemDocModal(false)}
      />
    </div>
  );
};
