import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  HardDrive,
  Info,
  RefreshCw,
  ServerOff,
  ShieldCheck,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { OfflineCacheInfo } from '../utils/offlineManager';

interface OfflineConnectivityBannerProps {
  isOnline: boolean;
  isSimulated: boolean;
  cacheInfo: OfflineCacheInfo;
  onToggleSimulate: () => void;
  onRefresh: () => void;
}

export const OfflineConnectivityBanner: React.FC<OfflineConnectivityBannerProps> = ({
  isOnline,
  isSimulated,
  cacheInfo,
  onToggleSimulate,
  onRefresh,
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const formattedSyncTime = cacheInfo.lastSyncTime
    ? new Date(cacheInfo.lastSyncTime).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Chưa đồng bộ';

  return (
    <>
      {/* 1. Main Status Strip (Shows warning banner when offline, or subtle indicator when online) */}
      {!isOnline ? (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 shadow-xl border-b border-amber-500/50">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/20 font-bold shrink-0">
                <WifiOff className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded text-[10px]">
                    {isSimulated ? 'Mô Phỏng Ngoại Tuyến' : 'Mất Kết Nối Xưởng (Offline)'}
                  </span>
                  <span className="font-bold">
                    Service Worker đang kích hoạt bản đệm dữ liệu SCADA
                  </span>
                </div>
                <p className="text-[11px] text-amber-100/90 mt-0.5">
                  Kỹ thuật viên vẫn có thể tra cứu thông số máy, lịch sử sự cố và tài liệu chẩn đoán bình thường
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="rounded bg-black/25 px-2.5 py-1 text-[11px] font-mono text-amber-100 flex items-center gap-1.5">
                <HardDrive className="h-3 w-3" />
                <span>
                  Đã lưu đệm: <strong>{cacheInfo.deviceCount} máy</strong> • <strong>{cacheInfo.documentCount} tài liệu</strong>
                </span>
              </span>

              <button
                onClick={() => setShowDetails(true)}
                className="rounded-lg bg-white/20 hover:bg-white/30 px-2.5 py-1 text-[11px] font-bold text-white transition cursor-pointer"
              >
                Chi tiết
              </button>

              <button
                onClick={onToggleSimulate}
                className="rounded-lg bg-black/40 hover:bg-black/60 px-2.5 py-1 text-[11px] font-bold text-amber-200 transition cursor-pointer"
              >
                {isSimulated ? 'Tắt Mô Phỏng' : 'Thử Kết Nối'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. Detailed Cache Inspection Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Trạng Thái Bộ Nhớ Đệm Ngoại Tuyến (Offline SCADA Cache)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cơ chế Service Worker & Bộ đệm dữ liệu phục vụ vận hành xưởng mất mạng
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>Trạng thái kết nối</span>
                </span>
                <div className="mt-1 font-bold text-sm">
                  {isOnline ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Wifi className="h-3.5 w-3.5" /> Trực tuyến (Online)
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <WifiOff className="h-3.5 w-3.5" /> Ngoại tuyến (Offline)
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">
                  {isSimulated ? 'Đang bật chế độ kiểm thử' : 'Theo cảm biến trình duyệt'}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Lần đồng bộ gần nhất</span>
                </span>
                <div className="mt-1 font-mono text-sm font-bold text-white">
                  {formattedSyncTime}
                </div>
                <span className="text-[10px] text-slate-500">Tự động làm mới khi có mạng</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-blue-400" />
                  <span>Hồ sơ máy đã lưu</span>
                </span>
                <div className="mt-1 font-mono text-xl font-extrabold text-blue-400">
                  {cacheInfo.deviceCount} thiết bị
                </div>
                <span className="text-[10px] text-slate-400">Gồm telemetry &amp; cảnh báo sự cố</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-purple-400" />
                  <span>Tài liệu &amp; SOP kỹ thuật</span>
                </span>
                <div className="mt-1 font-mono text-xl font-extrabold text-purple-400">
                  {cacheInfo.documentCount} tài liệu
                </div>
                <span className="text-[10px] text-slate-400">Sơ đồ máy, quy trình khắc phục</span>
              </div>
            </div>

            {/* Explanation box */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Cơ chế bảo vệ dữ liệu khi đi vào vùng mất sóng (Dead Zone)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Khi kỹ thuật viên mang máy tính bảng hoặc điện thoại vào góc khuất xưởng cơ khí khuôn mẫu bị mất sóng WiFi, Service Worker sẽ tự động chuyển hướng các lệnh gọi API sang <strong>Bộ nhớ đệm đĩa cứng</strong> để không làm gián đoạn việc xem hướng dẫn khắc phục sự cố, tra cứu mã lỗi E-102, ALARM-204 hay kiểm tra độ căng dây cắt.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={onToggleSimulate}
                className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                {isSimulated ? 'Tắt Chế Độ Mô Phỏng Mất Mạng' : 'Bật Mô Phỏng Mất Mạng Xưởng'}
              </button>

              <button
                onClick={() => setShowDetails(false)}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-950 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
