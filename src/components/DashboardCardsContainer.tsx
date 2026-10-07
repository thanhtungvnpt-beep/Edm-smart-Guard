import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GripVertical,
  LayoutGrid,
  Move,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  TopLevelCardId,
  TOP_LEVEL_CARDS_META,
  DEFAULT_TOP_LEVEL_CARDS_ORDER,
  saveDashboardCardsOrder,
  resetDashboardCardsOrder,
} from '../utils/dashboardLayoutStorage';
import { CustomizeDashboardModal } from './CustomizeDashboardModal';

interface DashboardCardsContainerProps {
  cardOrder: TopLevelCardId[];
  onOrderChange: (newOrder: TopLevelCardId[]) => void;
  onToast?: (message: string) => void;
  renderCard: (cardId: TopLevelCardId) => React.ReactNode;
}

export const DashboardCardsContainer: React.FC<DashboardCardsContainerProps> = ({
  cardOrder,
  onOrderChange,
  onToast,
  renderCard,
}) => {
  const [isCustomizeMode, setIsCustomizeMode] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [draggedCardId, setDraggedCardId] = useState<TopLevelCardId | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<TopLevelCardId | null>(null);

  const isCustomized =
    JSON.stringify(cardOrder) !== JSON.stringify(DEFAULT_TOP_LEVEL_CARDS_ORDER);

  const moveCard = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cardOrder.length) return;

    const updated = [...cardOrder];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    onOrderChange(updated);
    saveDashboardCardsOrder(updated);

    const movedMeta = TOP_LEVEL_CARDS_META[moved];
    if (onToast) onToast(`Đã di chuyển "${movedMeta.shortName}" đến vị trí #${targetIndex + 1}`);
  };

  const handleDragStart = (e: React.DragEvent, cardId: TopLevelCardId) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
  };

  const handleDragOver = (e: React.DragEvent, cardId: TopLevelCardId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCardId !== cardId) {
      setDragOverCardId(cardId);
    }
  };

  const handleDragLeave = (cardId: TopLevelCardId) => {
    if (dragOverCardId === cardId) {
      setDragOverCardId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetCardId: TopLevelCardId) => {
    e.preventDefault();
    if (!draggedCardId || draggedCardId === targetCardId) {
      setDraggedCardId(null);
      setDragOverCardId(null);
      return;
    }

    const currentIndex = cardOrder.indexOf(draggedCardId);
    const targetIndex = cardOrder.indexOf(targetCardId);

    if (currentIndex === -1 || targetIndex === -1) return;

    const updated = [...cardOrder];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);

    onOrderChange(updated);
    saveDashboardCardsOrder(updated);

    setDraggedCardId(null);
    setDragOverCardId(null);

    const movedMeta = TOP_LEVEL_CARDS_META[moved];
    if (onToast) {
      onToast(`Đã sắp xếp: "${movedMeta.shortName}" đặt ở vị trí #${targetIndex + 1}`);
    }
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  const handleResetLayout = () => {
    const defaultOrder = resetDashboardCardsOrder();
    onOrderChange(defaultOrder);
    if (onToast) onToast('Đã khôi phục bố cục Dashboard mặc định!');
  };

  return (
    <div className="space-y-4">
      {/* CUSTOMIZE DASHBOARD TOOLBAR HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs">
          <LayoutGrid className="h-4 w-4 text-amber-400" />
          <span className="font-semibold text-slate-200">Bố Cục Bảng Điều Khiển:</span>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 overflow-x-auto">
            {cardOrder.map((id, idx) => (
              <span key={id} className="flex items-center gap-1">
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                  #{idx + 1} {TOP_LEVEL_CARDS_META[id].shortName}
                </span>
                {idx < cardOrder.length - 1 && <span className="text-slate-600">→</span>}
              </span>
            ))}
          </div>
          {isCustomized && (
            <span className="hidden md:inline-flex rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[9px] font-mono font-bold text-cyan-300">
              Đã tùy biến
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isCustomized && (
            <button
              onClick={handleResetLayout}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer"
              title="Khôi phục thứ tự các thẻ về mặc định ban đầu"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Khôi Phục Mặc Định</span>
            </button>
          )}

          {/* Customize Dashboard Toggle Button */}
          <button
            onClick={() => setIsCustomizeMode(!isCustomizeMode)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer shadow-sm ${
              isCustomizeMode
                ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-amber-500/20'
                : 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white'
            }`}
            title="Bật/Tắt chế độ kéo thả sắp xếp thứ tự các thẻ Dashboard"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{isCustomizeMode ? 'Hoàn Tất Sắp Xếp' : 'Customize Dashboard'}</span>
          </button>

          {/* Quick Reorder Modal Button */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 p-1.5 text-slate-300 hover:text-white transition"
            title="Mở danh sách sắp xếp thứ tự nhanh dạng hộp thoại"
          >
            <Move className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* CUSTOMIZE MODE PROMPT BANNER */}
      {isCustomizeMode && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 p-3.5 text-xs animate-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Move className="h-4 w-4 animate-pulse" />
              </span>
              <div>
                <h4 className="font-bold text-white">
                  Đang Bật Chế Độ Tùy Chỉnh Kéo Thả (Drag &amp; Drop)
                </h4>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Nắm giữ thanh tiêu đề của từng thẻ bên dưới để kéo thả đổi vị trí, hoặc bấm nút mũi tên ↑ / ↓. Thứ tự mới sẽ tự động lưu vào bộ nhớ trình duyệt (localStorage).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isCustomized && (
                <button
                  onClick={handleResetLayout}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-[11px] text-slate-300 hover:text-white"
                >
                  Khôi Phục
                </button>
              )}
              <button
                onClick={() => setIsCustomizeMode(false)}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 text-[11px] shadow-md transition active:scale-95"
              >
                Xong &amp; Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAGGABLE CARDS LIST */}
      <div className="space-y-6">
        {cardOrder.map((cardId, index) => {
          const meta = TOP_LEVEL_CARDS_META[cardId];
          const isDragging = draggedCardId === cardId;
          const isDragOver = dragOverCardId === cardId;

          return (
            <div
              key={cardId}
              draggable={isCustomizeMode}
              onDragStart={(e) => handleDragStart(e, cardId)}
              onDragOver={(e) => handleDragOver(e, cardId)}
              onDragLeave={() => handleDragLeave(cardId)}
              onDrop={(e) => handleDrop(e, cardId)}
              onDragEnd={handleDragEnd}
              className={`relative rounded-3xl transition duration-200 ${
                isDragging
                  ? 'opacity-40 scale-[0.99] border-2 border-dashed border-amber-500 shadow-2xl'
                  : isDragOver
                  ? 'ring-2 ring-amber-500 shadow-2xl shadow-amber-500/20 scale-[1.005]'
                  : ''
              }`}
            >
              {/* DRAG HANDLE BAR ON TOP OF EACH CARD */}
              <div
                className={`flex items-center justify-between px-4 py-2 rounded-t-2xl border-t border-x transition select-none ${
                  isCustomizeMode
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:bg-slate-900/60'
                }`}
              >
                <div
                  className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => handleDragStart(e, cardId)}
                  title="Nhấn giữ và kéo thả để thay đổi thứ tự hiển thị của thẻ này"
                >
                  <GripVertical className={`h-4 w-4 ${isCustomizeMode ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 text-amber-300 font-mono text-[10px] font-bold">
                    #{index + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {meta.shortName}
                  </span>
                  <span className="hidden sm:inline text-[10px] text-slate-400 font-normal">
                    — {meta.category}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="hidden md:inline text-[10px] text-slate-400 font-mono pr-1">
                    Kéo thả để đổi chỗ
                  </span>

                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveCard(index, 'UP')}
                    className="p-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                    title="Di chuyển thẻ này lên vị trí phía trên"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>

                  <button
                    type="button"
                    disabled={index === cardOrder.length - 1}
                    onClick={() => moveCard(index, 'DOWN')}
                    className="p-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                    title="Di chuyển thẻ này xuống vị trí phía dưới"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* CARD CONTENT */}
              <div className="rounded-b-2xl overflow-hidden">
                {renderCard(cardId)}
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK REORDER MODAL */}
      {showModal && (
        <CustomizeDashboardModal
          cardOrder={cardOrder}
          onSaveOrder={(newOrder) => {
            onOrderChange(newOrder);
            saveDashboardCardsOrder(newOrder);
            if (onToast) onToast('Đã lưu thứ tự bố cục Dashboard mới!');
          }}
          onResetOrder={handleResetLayout}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};
