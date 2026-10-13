import React, { useState, useEffect, useMemo } from 'react';
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
  Wrench,
  BarChart3,
  Flame,
  Clock,
  Download,
  AlertTriangle,
  Award,
  Zap,
  TrendingUp,
  FileSpreadsheet,
  RefreshCw,
  Info,
  Contrast,
} from 'lucide-react';
import {
  ShortcutTelemetryState,
  ShortcutTelemetryItem,
} from '../types';
import {
  evaluateTechnicianAdoption,
  exportShortcutTelemetryCSV,
  createInitialSeedTelemetry,
} from '../utils/shortcutTelemetry';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: 'devices' | 'learnings' | 'documents' | 'notifications' | 'mobile-devices' | 'history') => void;
  telemetry: ShortcutTelemetryState;
  onRecordShortcut?: (shortcutId: string) => void;
  onResetTelemetry?: () => void;
  onSetTelemetry?: (newTelemetry: ShortcutTelemetryState) => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  telemetry,
  onRecordShortcut,
  onResetTelemetry,
  onSetTelemetry,
}) => {
  const [activeView, setActiveView] = useState<'cheat-sheet' | 'telemetry-analytics'>('cheat-sheet');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'navigation' | 'operation'>('ALL');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [justTriggeredKey, setJustTriggeredKey] = useState<string | null>(null);

  // Evaluate adoption metrics
  const evalData = useMemo(() => evaluateTechnicianAdoption(telemetry), [telemetry]);

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

  // Flash indicator when lastRecordedShortcut changes
  useEffect(() => {
    if (telemetry.lastRecordedShortcut) {
      setJustTriggeredKey(telemetry.lastRecordedShortcut);
      const timer = setTimeout(() => {
        setJustTriggeredKey(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [telemetry.lastRecordedShortcut, telemetry.totalCount]);

  if (!isOpen) return null;

  const tabShortcuts = [
    {
      id: 'alt_1',
      key: 'Alt + 1',
      tabId: 'devices' as const,
      title: 'Giám Sát EDM Trực Tuyến',
      desc: 'Theo dõi thời gian thực các máy EDM, telemetry nhiệt độ, áp suất, độ dẫn điện, dừng máy',
      icon: Activity,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    },
    {
      id: 'alt_2',
      key: 'Alt + 2',
      tabId: 'learnings' as const,
      title: 'Bộ Não Tri Thức AI',
      desc: 'Tra cứu bài học khắc phục sự cố, nguyên nhân gốc rễ và trợ lý kỹ thuật AI EDM',
      icon: Brain,
      color: 'text-purple-400',
      badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    },
    {
      id: 'alt_3',
      key: 'Alt + 3',
      tabId: 'documents' as const,
      title: 'Kho Tài Liệu Kỹ Thuật (SOP/OEM)',
      desc: 'Cẩm nang vận hành, sơ đồ mạch điện tử, bảo dưỡng định kỳ Makino, Sodick, GF Agie',
      icon: BookOpen,
      color: 'text-blue-400',
      badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    },
    {
      id: 'alt_4',
      key: 'Alt + 4',
      tabId: 'notifications' as const,
      title: 'Nhật Ký Bắn Push',
      desc: 'Lịch sử cảnh báo đẩy khẩn cấp, thời gian tiếp nhận và kỹ thuật viên phụ trách',
      icon: Radio,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'alt_5',
      key: 'Alt + 5',
      tabId: 'mobile-devices' as const,
      title: 'Thiết Bị Di Động KTV',
      desc: 'Quản lý thiết bị cầm tay, trạng thái pin, đồng bộ và chế độ khẩn cấp',
      icon: Smartphone,
      color: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'alt_6',
      key: 'Alt + 6',
      tabId: 'history' as const,
      title: 'Lịch Sử Sửa Chữa & Bảo Trì',
      desc: 'Lưu trữ, tra cứu và lọc sự cố, hành động sửa chữa, linh kiện thay thế và KTV theo từng máy',
      icon: Wrench,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    },
  ];

  const actionShortcuts = [
    {
      id: 'shift_r',
      key: 'Shift + R / Alt + R',
      title: 'Đồng Bộ / Làm Mới Dữ Liệu',
      desc: 'Gọi lại hàm fetchAllData để cập nhật dữ liệu telemetry thời gian thực từ EDM Gateway ở mọi màn hình',
      icon: RotateCcw,
      color: 'text-emerald-400',
    },
    {
      id: 'alt_e',
      key: 'Alt + E',
      title: 'Chẩn Đoán AI Khẩn Cấp',
      desc: 'Tự động mở Trợ Lý AI Chẩn Đoán cho thiết bị đang bị lỗi hoặc cảnh báo gần nhất để xử lý cấp bách',
      icon: Sparkles,
      color: 'text-rose-400',
    },
    {
      id: 'alt_c',
      key: 'Alt + C',
      title: 'Tương Phản Cao (High Contrast)',
      desc: 'Bật / Tắt chế độ tương phản cao hỗ trợ KTV làm việc khi xưởng thiếu sáng hoặc chói sáng',
      icon: Contrast,
      color: 'text-yellow-400',
    },
    {
      id: 'alt_q',
      key: 'Alt + Q',
      title: 'Quét QR Máy EDM',
      desc: 'Mở camera quét mã tem QR dán trên thân máy để mở hồ sơ chẩn đoán',
      icon: QrCode,
      color: 'text-orange-400',
    },
    {
      id: 'alt_t',
      key: 'Alt + T',
      title: 'Trực Ca Kỹ Thuật Viên',
      desc: 'Bật thanh bên theo dõi nhân sự trực ca và điều phối máy gia công',
      icon: Users,
      color: 'text-purple-400',
    },
    {
      id: 'alt_m',
      key: 'Alt + M',
      title: 'Bật / Tắt Âm Báo Động',
      desc: 'Chuyển đổi âm còi công nghiệp (Siren Mute / Unmute)',
      icon: Volume2,
      color: 'text-amber-400',
    },
    {
      id: 'alt_f',
      key: 'Alt + F / S',
      title: 'Tìm Kiếm Thiết Bị / Lỗi',
      desc: 'Tập trung con trỏ vào ô tìm kiếm mã máy, model, vị trí hoặc mã lỗi E-102...',
      icon: Search,
      color: 'text-cyan-400',
    },
    {
      id: 'alt_k',
      key: 'Alt + K / ?',
      title: 'Mở Bảng Phím Tắt Này',
      desc: 'Tra cứu nhanh danh sách phím tắt bất kỳ lúc nào',
      icon: Keyboard,
      color: 'text-emerald-400',
    },
    {
      id: 'escape',
      key: 'Esc',
      title: 'Đóng Cửa Sổ Modal',
      desc: 'Đóng modal chi tiết, chẩn đoán AI hoặc báo cáo đang mở',
      icon: X,
      color: 'text-slate-400',
    },
  ];

  // Helper to get usage badge
  const renderUsageBadge = (shortcutId: string) => {
    const item = telemetry.items[shortcutId];
    const count = item ? item.count : 0;
    const isJustTriggered = justTriggeredKey === shortcutId;

    if (count === 0) {
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-slate-900 border border-slate-800 ${
            isJustTriggered ? 'ring-2 ring-amber-400 animate-pulse' : ''
          }`}
          title="Kỹ thuật viên chưa từng dùng phím này"
        >
          <span>0 lần</span>
        </span>
      );
    }

    let badgeClass = 'bg-slate-800/80 text-slate-300 border-slate-700';
    let icon = <Clock className="h-2.5 w-2.5 text-slate-400" />;

    if (count >= 10) {
      badgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      icon = <Flame className="h-2.5 w-2.5 text-emerald-400 animate-pulse" />;
    } else if (count >= 5) {
      badgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      icon = <Zap className="h-2.5 w-2.5 text-amber-400" />;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold border ${badgeClass} transition-all duration-300 ${
          isJustTriggered ? 'ring-2 ring-amber-400 scale-105' : ''
        }`}
        title={`Đã kích hoạt ${count} lần (Telemetry)`}
      >
        {icon}
        <span>{count} lần</span>
      </span>
    );
  };

  const handleTestShortcut = (shortcutId: string, callback?: () => void) => {
    if (onRecordShortcut) {
      onRecordShortcut(shortcutId);
    }
    if (callback) {
      callback();
    }
  };

  const handleReset = () => {
    if (onResetTelemetry) {
      onResetTelemetry();
    }
    setShowResetConfirm(false);
  };

  const handleSeedShiftData = () => {
    if (onSetTelemetry) {
      const seeded = createInitialSeedTelemetry();
      onSetTelemetry(seeded);
    }
  };

  // Filtered telemetry items for the table
  const allTelemetryList = Object.values(telemetry.items).filter((item) => {
    const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchQuery =
      !searchQuery ||
      item.combo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.action.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-slate-950/95 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header with Telemetry Status & View Switcher */}
        <div className="border-b border-slate-800 bg-slate-950/80 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
                <Keyboard className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">Quản Lý Phím Tắt & Giám Sát Telemetry</h2>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                    IPC & Telemetry Logger
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ghi lại tần suất thao tác phím (telemetry) để Quản lý Kỹ thuật đánh giá mức độ tận dụng của KTV
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Telemetry Count Summary Pill */}
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300">
                <span className="text-slate-400">Đã ghi nhận:</span>
                <span className="font-mono font-bold text-amber-400">{telemetry.totalCount} lượt</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Điểm:</span>
                <span className={`font-mono font-bold ${evalData.tierColor}`}>{evalData.score}/100</span>
              </div>

              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation View Switcher (Tabs inside modal) */}
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('cheat-sheet')}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeView === 'cheat-sheet'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Keyboard className="h-3.5 w-3.5" />
                <span>Bảng Phím Tắt Công Nghiệp</span>
                <span className="rounded bg-black/20 px-1.5 py-0.2 text-[10px] font-mono font-bold">
                  {Object.keys(telemetry.items).length}
                </span>
              </button>

              <button
                onClick={() => setActiveView('telemetry-analytics')}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeView === 'telemetry-analytics'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Đánh Giá Tận Dụng & Telemetry Quản Lý</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                    activeView === 'telemetry-analytics' ? 'bg-black/20 text-slate-950' : evalData.badgeBg
                  }`}
                >
                  {evalData.tier}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportShortcutTelemetryCSV(telemetry)}
                title="Xuất file CSV thống kê telemetry phím tắt"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-amber-500/50 hover:text-amber-300 transition"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden md:inline">Xuất CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* ======================================================== */}
          {/* VIEW 1: CHEAT SHEET & QUICK TEST WITH LIVE TELEMETRY     */}
          {/* ======================================================== */}
          {activeView === 'cheat-sheet' && (
            <div className="space-y-6">
              {/* Telemetry Summary Banner for Technicians */}
              <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Hệ thống Telemetry đang hoạt động liên tục</span>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Mỗi lần bạn bấm phím tắt thực tế trên bàn phím, biến trạng thái cục bộ sẽ tự động tăng số lần kích hoạt tương ứng.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">KTV tận dụng</div>
                      <div className="text-sm font-bold font-mono text-amber-400">
                        {evalData.activeCount} / {evalData.totalAvailable} phím ({evalData.activePercentage}%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 1: Tab Navigation Hotkeys */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Chuyển Đổi Tab Chính (Navigation Hotkeys)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Hỗ trợ phím số 1–6 và bàn phím phụ Numpad 1–6
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {tabShortcuts.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={item.key}
                        onClick={() => {
                          handleTestShortcut(item.id, () => {
                            if (onSelectTab) {
                              onSelectTab(item.tabId);
                              onClose();
                            }
                          });
                        }}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-800/90 bg-slate-950/50 p-3 hover:border-amber-500/40 hover:bg-slate-800/60 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 ${item.color}`}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {renderUsageBadge(item.id)}
                          <kbd className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-mono font-bold text-amber-300 shadow-sm group-hover:border-amber-500/50">
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
                  <span className="text-[11px] text-slate-400 font-mono">Bấm thử phím bất kỳ</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {actionShortcuts.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={item.key}
                        onClick={() => handleTestShortcut(item.id)}
                        className="group flex items-start justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 hover:border-cyan-500/40 hover:bg-slate-800/40 transition cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 ${item.color}`}
                          >
                            <IconComponent className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-slate-400 leading-relaxed mt-0.5 line-clamp-2">
                              {item.desc}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          <kbd className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-200 group-hover:border-cyan-500/50">
                            {item.key}
                          </kbd>
                          {renderUsageBadge(item.id)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Industrial Note */}
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent p-3.5 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Ghi chú vận hành tại xưởng cơ khí chính xác EDM:</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Bàn phím công nghiệp (IPC) đặt cạnh bể chứa dầu EDM thường trang bị phím bấm màng cao su chống bám bẩn.
                  KTV có thể thao tác hoàn toàn bằng phím tắt mà không cần tháo găng tay dính dầu mỡ để cầm chuột.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: MANAGER ANALYTICS & TELEMETRY EVALUATION VIEW    */}
          {/* ======================================================== */}
          {activeView === 'telemetry-analytics' && (
            <div className="space-y-6">
              {/* KPI CARDS GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Điểm số thành thạo */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-medium">Điểm Thành Thạo KTV</span>
                    <Award className={`h-4 w-4 ${evalData.tierColor}`} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-black font-mono text-white">{evalData.score}</div>
                    <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold border ${evalData.badgeBg}`}>
                      {evalData.tier}
                    </span>
                  </div>
                </div>

                {/* 2. Tổng số lượt bấm phím */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-medium">Tổng Lượt Phím Tắt</span>
                    <Flame className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-400">{telemetry.totalCount}</div>
                  <div className="text-[10px] text-slate-400 mt-2 truncate">
                    Phiên ca: {new Date(telemetry.sessionStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* 3. Tỷ lệ bao phủ phím tắt */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-medium">Độ Phủ Phím Tắt</span>
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-cyan-400">{evalData.activePercentage}%</div>
                  <div className="text-[10px] text-slate-400 mt-2">
                    Đã dùng {evalData.activeCount} / {evalData.totalAvailable} phím
                  </div>
                </div>

                {/* 4. Thời gian tiết kiệm ước tính */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-medium">Thời Gian Tiết Kiệm</span>
                    <Clock className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    ~{evalData.estimatedTimeSavedMinutes} <span className="text-sm font-normal">phút</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2">
                    Tiết kiệm ~3.5s / lần so với chuột
                  </div>
                </div>
              </div>

              {/* MANAGER QUALITATIVE RECOMMENDATION BOX */}
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/80 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-28 w-28 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Info className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Đánh Giá & Khuyến Nghị Dành Cho Quản Lý Kỹ Thuật
                      </h4>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
                        Manager Insight
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mt-1">
                      {evalData.summaryNote}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">
                      {evalData.managerRecommendation}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-[11px]">
                      {evalData.mostUsed && (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <span className="text-slate-500">Phím dùng nhiều nhất:</span>
                          <kbd className="rounded bg-slate-900 border border-slate-700 px-1.5 py-0.2 text-[10px] font-mono text-amber-300 font-bold">
                            {evalData.mostUsed.combo}
                          </kbd>
                          <span className="text-slate-400">({evalData.mostUsed.count} lần - {evalData.mostUsed.action})</span>
                        </div>
                      )}
                      {evalData.leastUsed.length > 0 && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span className="text-rose-400">Chưa tận dụng:</span>
                          <span className="text-slate-300">
                            {evalData.leastUsed.map((u) => u.combo).slice(0, 3).join(', ')}
                            {evalData.leastUsed.length > 3 ? ` và ${evalData.leastUsed.length - 3} phím khác` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* TELEMETRY BREAKDOWN TABLE */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                <div className="p-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Bảng Thống Kê Chi Tiết Tần Suất Telemetry Từng Phím
                    </h4>
                  </div>

                  {/* Filters & Search */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm phím / thao tác..."
                        className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none w-36 sm:w-44"
                      />
                    </div>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as any)}
                      className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 focus:border-amber-500/50 focus:outline-none"
                    >
                      <option value="ALL">Tất cả nhóm</option>
                      <option value="navigation">Điều hướng tab</option>
                      <option value="operation">Thao tác vận hành</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px]">
                        <th className="py-2.5 px-3 font-semibold">Tổ Hợp Phím</th>
                        <th className="py-2.5 px-3 font-semibold">Chức Năng Điều Khiển</th>
                        <th className="py-2.5 px-3 font-semibold">Nhóm</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Số Lần Dùng</th>
                        <th className="py-2.5 px-3 font-semibold">Tỷ Lệ Đóng Góp</th>
                        <th className="py-2.5 px-3 font-semibold">Lần Dùng Gần Nhất</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {allTelemetryList.map((item) => {
                        const total = Math.max(1, telemetry.totalCount);
                        const pct = Math.round((item.count / total) * 100);
                        const isJustTriggered = justTriggeredKey === item.id;

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-800/40 transition ${
                              isJustTriggered ? 'bg-amber-500/10' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <kbd className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
                                {item.combo}
                              </kbd>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-200">
                              {item.action}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                                  item.category === 'navigation'
                                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                                }`}
                              >
                                {item.category === 'navigation' ? 'Điều hướng' : 'Vận hành'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-center">
                              <span className="font-mono font-bold text-white text-xs">
                                {item.count}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap w-36">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full bg-amber-400 rounded-full"
                                    style={{ width: `${Math.min(100, pct)}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[10px] text-slate-400 w-8">{pct}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-slate-400">
                              {item.lastUsedAt ? (
                                <span title={new Date(item.lastUsedAt).toLocaleString('vi-VN')}>
                                  {new Date(item.lastUsedAt).toLocaleTimeString('vi-VN')}
                                </span>
                              ) : (
                                <span className="text-slate-600 italic">Chưa kích hoạt</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-right">
                              <button
                                onClick={() => handleTestShortcut(item.id)}
                                className="rounded px-2 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-slate-800 transition"
                              >
                                Thử phím
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RECENT TELEMETRY LOGS (LIVE FEED) */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Nhật Ký Thao Tác Phím Thời Gian Thực (Live Telemetry Event Log)
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Lưu trữ {telemetry.recentLogs.length} sự kiện gần nhất
                  </span>
                </div>

                {telemetry.recentLogs.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Chưa có sự kiện thao tác nào trong phiên này. Hãy bấm một phím tắt để ghi log!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {telemetry.recentLogs.slice(0, 10).map((log, index) => (
                      <div
                        key={log.id}
                        className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs border ${
                          index === 0
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <kbd className="rounded bg-slate-950 border border-slate-700 px-1.5 py-0.2 font-mono text-[10px] font-bold text-amber-300">
                            {log.combo}
                          </kbd>
                          <span className="text-xs truncate">{log.action}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                          {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MANAGER ACTIONS BAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-white">Thao tác Quản lý Kỹ thuật:</span> Đặt lại dữ liệu khi bắt đầu ca trực mới hoặc xuất file CSV đánh giá kỹ năng KTV.
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSeedShiftData}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Nạp Dữ Liệu Mẫu Ca Trực</span>
                  </button>

                  <button
                    onClick={() => exportShortcutTelemetryCSV(telemetry)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>Xuất Báo Cáo CSV</span>
                  </button>

                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Đặt Lại Bộ Đếm</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-5 py-3">
          <span className="text-xs text-slate-400">
            Mẹo: Nhấn <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">Esc</kbd> để đóng cửa sổ
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>

        {/* RESET CONFIRMATION MODAL */}
        {showResetConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-sm font-bold text-white">Xác Nhận Đặt Lại Telemetry?</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tất cả số lần kích hoạt phím tắt ({telemetry.totalCount} lượt) và nhật ký thao tác trong phiên làm việc hiện tại sẽ được đặt về 0 để chuẩn bị cho ca làm việc hoặc đợt đánh giá KTV mới.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  onClick={handleReset}
                  className="rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-rose-600/30 transition"
                >
                  Đặt Lại Về 0
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
