import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  Clock,
  Sparkles,
  Star,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { Device } from '../types';
import { soundManager } from '../utils/audio';

interface RepairReportModalProps {
  device: Device | null;
  onClose: () => void;
  onSuccess: (newLearning?: any) => void;
}

export const RepairReportModal: React.FC<RepairReportModalProps> = ({
  device,
  onClose,
  onSuccess,
}) => {
  if (!device) return null;

  const [actualRootCause, setActualRootCause] = useState(
    'Đầu dẫn hướng kim cương Diamond Wire Guide bị bám cặn muội than do phôi cắt dày 80mm'
  );
  const [fixSummary, setFixSummary] = useState(
    'Tháo nắp bảo vệ cụm đầu phun trên, dùng que gỗ vi sợi tẩm dung môi tẩy rửa Makino Cleaner lau sạch cặn xỉ trong khe dẫn hướng, thay đoạn dây đồng mới và tăng áp suất xả nước phụ lên 1.3 Bar.'
  );
  const [partsReplaced, setPartsReplaced] = useState('Đoạn dây cắt 0.25mm, que nỉ vệ sinh');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [aiRating, setAiRating] = useState(5);
  const [notes, setNotes] = useState('Không cần thay cả cụm đầu dẫn kim cương mới, chỉ cần lau sạch là chạy ổn định.');
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-emerald-500/50 bg-slate-950 p-6 shadow-2xl shadow-emerald-950/40">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Brain className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Nghiệm Thu Khắc Phục & Dạy Cho AI
                </h2>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
                  Human-in-the-Loop
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kinh nghiệm của bạn sẽ được AI tổng hợp và ghi nhớ để giúp các ca sửa sau nhanh hơn!
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Machine Info Bar */}
          <div className="flex items-center justify-between rounded-xl bg-slate-900/80 px-4 py-2 text-xs border border-slate-800">
            <span className="text-slate-400">
              Thiết bị: <strong className="text-white">{device.code} - {device.name}</strong>
            </span>
            <span className="text-amber-400 font-mono">
              KTV: {device.assignedTechnician?.name || 'Kỹ thuật viên'}
            </span>
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
              2. Phương án và mẹo kỹ thuật bạn đã áp dụng thành công (AI sẽ học phần này):
            </label>
            <textarea
              required
              rows={3}
              value={fixSummary}
              onChange={(e) => setFixSummary(e.target.value)}
              placeholder="Mô tả cụ thể thao tác: tháo van nào, dùng hóa chất gì, chỉnh thông số C-Condition nào..."
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Parts Replaced & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                3. Linh kiện thay thế / Vật tư (phân tách bởi dấu phẩy):
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                4. Thời gian khắc phục thực tế (phút):
              </label>
              <input
                type="number"
                min="1"
                max="600"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* AI Feedback & Rating */}
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-200">
                Đánh giá chất lượng đề xuất của AI lần này:
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
              placeholder="Ghi chú thêm cho AI: VD: 'Đề xuất rất sát, nhưng lần sau lưu ý kiểm tra cả khớp nối Q-03'..."
              className="mt-2.5 w-full rounded-xl bg-slate-900/90 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
                  <span>Xác Nhận Sửa Xong & Nạp Tri Thức Vào AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
