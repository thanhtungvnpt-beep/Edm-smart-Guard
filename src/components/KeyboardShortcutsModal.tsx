import React, { useEffect } from 'react';
import {
  Keyboard,
  X,
  Activity,
  Brain,
  BookOpen,
  Radio,
  Smartphone,
  QrCode,
  Users,
  Volume2,
  Search,
  CheckCircle2,
  Sparkles,
  Command,
  RotateCcw,
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: 'devices' | 'learnings' | 'documents' | 'notifications' | 'mobile-devices') => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabShortcuts = [
    {
      key: 'Alt + 1',
      tabId: 'devices' as const,
      title: 'Giám Sát EDM Trực Tuyến',
      desc: 'Theo dõi thời gian thực các máy EDM, telemetry nhiệt độ, áp suất, độ dẫn điện, dừng máy',
      icon: Activity,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    },
    {
      key: 'Alt + 2',
      tabId: 'learnings' as const,
      title: 'Bộ Não Tri Thức AI',
      desc: 'Tra cứu bài học khắc phục sự cố, nguyên nhân gốc rễ và trợ lý kỹ thuật AI EDM',
      icon: Brain,
      color: 'text-purple-400',
      badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    },
    {
      key: 'Alt + 3',
      tabId: 'documents' as const,
      title: 'Kho Tài Liệu Kỹ Thuật (SOP/OEM)',
      desc: 'Cẩm nang vận hành, sơ đồ mạch điện tử, bảo dưỡng định kỳ Makino, Sodick, GF Agie',
      icon: BookOpen,
      color: 'text-blue-400',
      badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    },
    {
      key: 'Alt + 4',
      tabId: 'notifications' as const,
      title: 'Nhật Ký Bắn Push',
      desc: 'Lịch sử cảnh báo đẩy khẩn cấp, thời gian tiếp nhận và kỹ thuật viên phụ trách',
      icon: Radio,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    },
    {
      key: 'Alt + 5',
      tabId: 'mobile-devices' as const,
      title: 'Thiết Bị Di Động KTV',
      desc: 'Quản lý thiết bị cầm tay, trạng thái pin, đồng bộ và chế độ khẩn cấp',
      icon: Smartphone,
      color: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    },
  ];

  const actionShortcuts = [
    {
      key: 'Shift + R',
      title: 'Đồng Bộ / Làm Mới Dữ Liệu',
      desc: 'Gọi lại hàm fetchAllData để cập nhật dữ liệu telemetry thời gian thực từ EDM Gateway ở mọi màn hình',
      icon: RotateCcw,
      color: 'text-emerald-400',
    },
    {
      key: 'Alt + Q',
      title: 'Quét QR Máy EDM',
      desc: 'Mở camera quét mã tem QR dán trên thân máy để mở hồ sơ chẩn đoán',
      icon: QrCode,
      color: 'text-orange-400',
    },
    {
      key: 'Alt + T',
      title: 'Trực Ca Kỹ Thuật Viên',
      desc: 'Bật thanh bên theo dõi nhân sự trực ca và điều phối máy gia công',
      icon: Users,
      color: 'text-purple-400',
    },
    {
      key: 'Alt + M',
      title: 'Bật / Tắt Âm Báo Động',
      desc: 'Chuyển đổi âm còi công nghiệp (Siren Mute / Unmute)',
      icon: Volume2,
      color: 'text-amber-400',
    },
    {
      key: 'Alt + F / S',
      title: 'Tìm Kiếm Thiết Bị / Lỗi',
      desc: 'Tập trung con trỏ vào ô tìm kiếm mã máy, model, vị trí hoặc mã lỗi E-102...',
      icon: Search,
      color: 'text-cyan-400',
    },
    {
      key: 'Alt + K / ?',
      title: 'Mở Bảng Phím Tắt Này',
      desc: 'Tra cứu nhanh danh sách phím tắt bất kỳ lúc nào',
      icon: Keyboard,
      color: 'text-emerald-400',
    },
    {
      key: 'Esc',
      title: 'Đóng Cửa Sổ Modal',
      desc: 'Đóng modal chi tiết, chẩn đoán AI hoặc báo cáo đang mở',
      icon: X,
      color: 'text-slate-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-slate-950/90 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Phím Tắt Bàn Phím Công Nghiệp</span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                  IPC & Operator Console
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Thao tác nhanh 1 chạm khi kỹ thuật viên đeo găng tay hoặc thao tác trên bảng điều khiển xưởng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Tab Navigation Hotkeys */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Chuyển Đổi Tab Chính (Navigation Hotkeys)</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Bấm trực tiếp hoặc bấm Alt+Số</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {tabShortcuts.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      if (onSelectTab) {
                        onSelectTab(item.tabId);
                        onClose();
                      }
                    }}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-slate-800/90 bg-slate-950/50 p-3 hover:border-amber-500/40 hover:bg-slate-800/60 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 ${item.color}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{item.desc}</div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <kbd className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-mono font-bold text-amber-300 shadow-sm group-hover:border-amber-500/50">
                        {item.key}
                      </kbd>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Industrial Operation Hotkeys */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Command className="h-3.5 w-3.5 text-cyan-400" />
                <span>Thao Tác Vận Hành Công Nghiệp (Quick Actions)</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {actionShortcuts.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 ${item.color}`}>
                        <IconComponent className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{item.title}</div>
                        <div className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                    <kbd className="shrink-0 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-200">
                      {item.key}
                    </kbd>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Industrial Tip Note */}
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent p-3.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>Ghi chú vận hành tại xưởng cơ khí chính xác EDM:</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Các phím tắt hỗ trợ cả dãy phím số phía trên (<span className="text-amber-300 font-mono">1–5</span>) lẫn bàn phím số phụ (<span className="text-amber-300 font-mono">Numpad 1–5</span>) thường trang bị trên các máy tính công nghiệp (IPC) đặt cạnh máy EDM.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-5 py-3">
          <span className="text-xs text-slate-400">
            Mẹo: Nhấn <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">Esc</kbd> để đóng cửa sổ
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            Đã Hiểu (Đóng)
          </button>
        </div>
      </div>
    </div>
  );
};
