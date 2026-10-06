import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 shadow-sm transition active:scale-95 cursor-pointer"
        title="Cài đặt ứng dụng EDM SmartGuard SCADA vào thiết bị"
      >
        <Download className="h-3.5 w-3.5 text-amber-400" />
        <span className="hidden sm:inline">Cài Đặt Ứng Dụng</span>
        <span className="sm:hidden">Cài PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          title="Cài đặt ứng dụng trên iPhone/iPad"
        >
          <Smartphone className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden sm:inline">Cài Đặt iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-amber-400" />
                  Cài Đặt Trên iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                1. Bấm nút <strong>Chia Sẻ (Share)</strong> trên thanh công cụ Safari.<br />
                2. Cuộn xuống và chọn <strong>Thêm vào Màn hình chính (Add to Home Screen)</strong>.<br />
                3. Bấm <strong>Thêm (Add)</strong> để hoàn tất.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-amber-500 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
