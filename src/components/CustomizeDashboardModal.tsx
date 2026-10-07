import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GripVertical,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  TopLevelCardId,
  TOP_LEVEL_CARDS_META,
  DEFAULT_TOP_LEVEL_CARDS_ORDER,
} from '../utils/dashboardLayoutStorage';

interface CustomizeDashboardModalProps {
  cardOrder: TopLevelCardId[];
  onSaveOrder: (newOrder: TopLevelCardId[]) => void;
  onResetOrder: () => void;
  onClose: () => void;
}

export const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({
  cardOrder,
  onSaveOrder,
  onResetOrder,
  onClose,
}) => {
  const [items, setItems] = useState<TopLevelCardId[]>([...cardOrder]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const moveItem = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setItems(updated);
    onSaveOrder(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...items];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setItems(updated);
    onSaveOrder(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleReset = () => {
    setItems([...DEFAULT_TOP_LEVEL_CARDS_ORDER]);
    onResetOrder();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Tùy Chỉnh Thứ Tự Bố Cục Dashboard
              </h3>
              <p className="text-xs text-slate-400">
                Kéo thả hoặc dùng nút mũi tên để sắp xếp thứ tự 3 thẻ giám sát hàng đầu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 space-y-3">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Danh sách khối chức năng (Vị trí 1 đến 3):</span>
            <span className="font-mono text-[11px] text-amber-400">Tự động lưu vào trình duyệt</span>
          </div>

          <div className="space-y-2.5">
            {items.map((cardId, index) => {
              const meta = TOP_LEVEL_CARDS_META[cardId];
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <div
                  key={cardId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition cursor-grab active:cursor-grabbing select-none ${
                    isDragging
                      ? 'opacity-40 border-dashed border-amber-500 bg-amber-950/20 scale-[0.98]'
                      : isDragOver
                      ? 'border-amber-500 bg-amber-950/30 ring-2 ring-amber-500/50'
                      : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-500 hover:text-amber-400 p-1">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 font-mono text-xs font-bold shrink-0">
                      #{index + 1}
                    </span>

                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                        {meta.shortName}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveItem(index, 'UP');
                      }}
                      className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Di chuyển lên trên"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveItem(index, 'DOWN');
                      }}
                      className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Di chuyển xuống dưới"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-5 py-3 text-xs">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Khôi Phục Mặc Định</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 shadow-md transition active:scale-95"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Hoàn Tất & Lưu Bố Cục</span>
          </button>
        </div>
      </div>
    </div>
  );
};
