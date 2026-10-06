import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileCode,
  FileText,
  Plus,
  Search,
  Sparkles,
  Tag,
  UploadCloud,
  X,
} from 'lucide-react';
import { TechnicalDocument } from '../types';

interface DocumentsTabProps {
  documents: TechnicalDocument[];
  onDocumentAdded: (newDoc: TechnicalDocument) => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  onDocumentAdded,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TechnicalDocument['category']>('OEM_ERROR_CODES');
  const [targetModel, setTargetModel] = useState('Makino U6 H.E.A.T');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('EDM, Cắt dây, Áp suất, SOP');
  const [submitting, setSubmitting] = useState(false);

  const filtered = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.targetModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        }),
      });

      const data = await res.json();
      if (data.success) {
        onDocumentAdded(data.data);
        setShowAddModal(false);
        setTitle('');
        setContent('');
      }
    } catch (e) {
      console.error('Add doc error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyTemplate = (type: 'sodick' | 'makino' | 'fanuc') => {
    if (type === 'sodick') {
      setTitle('Quy chuẩn cân chỉnh cảm biến điện môi & Bộ lọc DI Deionization Sodick');
      setCategory('MAINTENANCE_GUIDE');
      setTargetModel('Sodick ALC600G');
      setContent(`HƯỚNG DẪN CÂN CHỈNH HỆ THỐNG LỌC ION & DUNG DỊCH ĐIỆN MÔI:
1. Độ dẫn điện chuẩn: 3.5 - 5.5 uS/cm.
2. Nếu màn hình báo lỗi RESIN EXHAUSTED: Thay ngay hạt nhựa khử ion (Deionization Resin Bag 25L).
3. Tuyệt đối không để độ dẫn điện > 12 uS/cm vì sẽ gây phóng điện thứ cấp phân tán làm rỗ bề mặt sản phẩm.
4. Kiểm tra áp lực đồng hồ bơm nước xả áp cao High-Flush: Ngưỡng an toàn 1.4 - 1.8 MPa.`);
      setTags('Sodick, Hạt nhựa ion, Điện môi, Cân chỉnh');
    } else if (type === 'fanuc') {
      setTitle('Sổ tay xử lý lỗi luồn dây tự động AWF (Automatic Wire Feeding) Fanuc Robocut');
      setCategory('OPERATING_MANUAL');
      setTargetModel('Fanuc Robocut α-C400iC');
      setContent(`QUY TRÌNH XỬ LÝ LỖI MẤT DÂY VÀ KHÔNG XỎ ĐƯỢC DÂY TỰ ĐỘNG:
- Mã lỗi AWF-01: Dây bị cong gãy trước khi vào ống dẫn Jet Pipe.
- Khắc phục:
  1. Kiểm tra dao cắt nhiệt Annealing Wire Cutter có bị dính mạt cháy không. Dùng giũa kim cương mịn mài phẳng mặt tiếp xúc nhiệt.
  2. Bật vòi thổi khí khô áp lực 0.5 Bar để làm sạch lỗ dẫn hướng dẫn kim cương dưới đáy bồn.
  3. Đảm bảo dùng dây đồng đường kính 0.20mm - 0.25mm đạt chuẩn dung sai h6.`);
      setTags('Fanuc, AWF, Xỏ dây, Dao cắt nhiệt');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Technical Manuals Management */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/40 bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/40">
                <BookOpen className="h-5 w-5" />
              </span>
              <span className="rounded bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-300">
                TECHNICAL DOCUMENTATION HUB
              </span>
              <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Lưu Đệm Ngoại Tuyến (Offline Ready)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Cập Nhật Tài Liệu Kỹ Thuật Cho AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Kỹ thuật viên có thể bổ sung sổ tay vận hành, sơ đồ mạch điện, bảng mã lỗi của hãng (Makino, Sodick, Fanuc, GF) và quy trình chuẩn SOP. AI sẽ tự động đọc, lập chỉ mục và áp dụng chính xác vào các tình huống phân tích sự cố.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-5 py-3 font-bold text-white shadow-xl shadow-blue-600/30 transition active:scale-95 shrink-0"
          >
            <Plus className="h-5 w-5" />
            <span>Nạp Thêm Tài Liệu Mới</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm tài liệu theo tên máy, mã lỗi, từ khóa kỹ thuật..."
          className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {filtered.map((doc) => {
          const isExpanded = expandedDocId === doc.id;
          return (
            <div
              key={doc.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 hover:border-slate-700 transition shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-blue-400">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {doc.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="font-mono text-amber-400 font-semibold">{doc.targetModel}</span>
                      <span>• Cập nhật: {doc.updatedAt}</span>
                      <span>• Tác giả: {doc.author}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-lg bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[11px] font-mono font-medium text-blue-300">
                    {doc.category}
                  </span>
                  <button
                    onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                    className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1 text-xs text-slate-200 transition font-medium"
                  >
                    {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                  </button>
                </div>
              </div>

              {/* AI Index Summary */}
              <div className="mt-3 rounded-xl bg-slate-950/70 border border-slate-800/80 p-3 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 font-semibold text-purple-300 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Chỉ mục tóm tắt AI trích xuất:</span>
                </div>
                <p className="leading-relaxed">{doc.summary}</p>
              </div>

              {/* Full Content if expanded */}
              {isExpanded && (
                <div className="mt-3 rounded-xl bg-black/60 border border-slate-800 p-4 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed animate-in fade-in">
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

      {/* Modal: Add New Technical Document */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-blue-500/50 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Nạp Tài Liệu Kỹ Thuật Mới Cho AI
                  </h3>
                  <p className="text-xs text-slate-400">
                    AI sẽ tự động đọc, tóm tắt và ghi vào cơ sở dữ liệu tri thức RAG.
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

            {/* Quick Templates */}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-slate-400">Chọn mẫu nhanh:</span>
              <button
                type="button"
                onClick={() => handleApplyTemplate('sodick')}
                className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-slate-300 text-[11px]"
              >
                + Mẫu Sodick ALC600G
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate('fanuc')}
                className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-slate-300 text-[11px]"
              >
                + Mẫu Fanuc Robocut
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="mt-3 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tiêu đề tài liệu / Mã SOP:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Sổ tay hướng dẫn thay lõi lọc cao áp Makino U6..."
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
                    <option value="OEM_ERROR_CODES">Bảng Mã Lỗi Nhà Sản Xuất (OEM)</option>
                    <option value="SOP">Quy Trình Chuẩn (SOP Vận Hành)</option>
                    <option value="MAINTENANCE_GUIDE">Hướng Dẫn Bảo Dưỡng Định Kỳ</option>
                    <option value="SCHEMATICS">Sơ Đồ Mạch Điện / Khí Nén</option>
                    <option value="OPERATING_MANUAL">Sổ Tay Vận Hành Máy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nội dung chi tiết (Quy trình, thông số, nguyên nhân, cách sửa):
                </label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập hoặc dán nội dung hướng dẫn kỹ thuật vào đây..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Thẻ từ khóa (Tags):
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="EDM, Cắt dây, Áp suất, SOP..."
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
                      <span>AI đang lập chỉ mục...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Lưu & Huấn Luyện AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
