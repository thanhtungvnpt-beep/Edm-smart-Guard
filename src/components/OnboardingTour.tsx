import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass,
  QrCode,
  SlidersHorizontal,
  Mic,
  Activity,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  HelpCircle,
  Wrench,
  Users,
} from 'lucide-react';

export interface TourStep {
  id: string;
  targetSelector: string; // CSS selector e.g. '#tour-qr-scanner'
  title: string;
  description: string;
  icon: React.ReactNode;
  placement: 'top' | 'bottom' | 'left' | 'right';
  badgeText?: string;
}

export const ONBOARDING_TOUR_STEPS: TourStep[] = [
  {
    id: 'voice-search',
    targetSelector: '#tour-voice-search',
    title: 'Tìm Kiếm Bằng Giọng Nói Rảnh Tay',
    description:
      'Kỹ thuật viên đang trực tiếp sửa máy có thể bấm biểu tượng Micro để đọc to tên máy (EDM-W01), mã lỗi (E-102), hoặc tên KTV mà không cần tháo găng tay gõ phím.',
    icon: <Mic className="h-5 w-5 text-amber-400" />,
    placement: 'bottom',
    badgeText: 'Bước 1/6 • Voice-to-Text',
  },
  {
    id: 'qr-scanner',
    targetSelector: '#tour-qr-scanner',
    title: 'Quét Mã QR Máy Nhanh Chóng',
    description:
      'Bấm nút "Quét QR Máy" và hướng camera vào tem QR dán trên thân máy EDM/CNC để mở ngay lập tức hồ sơ kỹ thuật, thông số cảm biến và chẩn đoán sự cố.',
    icon: <QrCode className="h-5 w-5 text-orange-400" />,
    placement: 'bottom',
    badgeText: 'Bước 2/6 • QR Scanner',
  },
  {
    id: 'advanced-filter',
    targetSelector: '#tour-advanced-filter',
    title: 'Bộ Lọc Nâng Cao Theo Vận Hành & Khẩn Cấp',
    description:
      'Lọc máy đa tiêu chí: nhiệt độ quá ngưỡng an toàn (> 24°C), công suất điện tiêu thụ cao (≥ 8kW), máy chạy liên tục dài ca (> 18h) và kịch bản 1-chạm "Cần bảo trì cấp bách".',
    icon: <SlidersHorizontal className="h-5 w-5 text-amber-400" />,
    placement: 'bottom',
    badgeText: 'Bước 3/6 • Bộ Lọc Vận Hành',
  },
  {
    id: 'device-card',
    targetSelector: '#tour-first-device-card',
    title: 'Thẻ Máy SCADA & Đo Độ Tin Cậy (Arc Gauge)',
    description:
      'Mỗi thẻ hiển thị trạng thái thời gian thực, đồng hồ cung tròn Health Score (độ tin cậy máy), công suất điện kW, chu kỳ chạy liên tục và nút kích hoạt AI Chẩn Đoán.',
    icon: <Activity className="h-5 w-5 text-cyan-400" />,
    placement: 'top',
    badgeText: 'Bước 4/6 • Thẻ Máy Thông Minh',
  },
  {
    id: 'tech-status',
    targetSelector: '#tour-tech-status-btn',
    title: 'Trực Ca KTV & Biểu Đồ Kỹ Năng Recharts',
    description:
      'Theo dõi trạng thái ca trực, điều phối máy, bảng điểm thành thạo AI (Proficiency Score) và biểu đồ phân tích năng lực giải quyết sự cố theo từng dòng máy bằng Recharts.',
    icon: <Users className="h-5 w-5 text-purple-400" />,
    placement: 'bottom',
    badgeText: 'Bước 5/6 • Đội Ngũ Kỹ Thuật',
  },
  {
    id: 'ai-features',
    targetSelector: '#tour-ai-brain-tab',
    title: 'Bộ Não Tri Thức AI & SOP Kỹ Thuật',
    description:
      'Kho bài học kinh nghiệm tự học từ con người (Human-in-the-Loop) và hàng trăm tài liệu OEM/SOP giúp chẩn đoán tự động và hướng dẫn thao tác an toàn.',
    icon: <Sparkles className="h-5 w-5 text-indigo-400" />,
    placement: 'bottom',
    badgeText: 'Bước 6/6 • AI Assistant',
  },
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = ONBOARDING_TOUR_STEPS[currentStepIndex];

  // Calculate position of current target element
  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !step) return;

    const el = document.querySelector(step.targetSelector);
    if (el) {
      // Scroll into view if needed
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      // Fallback center of screen
      setTargetRect(null);
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) return;

    // Small delay to allow layout
    const timer = setTimeout(() => {
      updateTargetPosition();
    }, 150);

    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [isOpen, currentStepIndex, updateTargetPosition]);

  if (!isOpen) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === ONBOARDING_TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('smartguard_onboarding_completed', 'true');
    if (onComplete) onComplete();
    onClose();
  };

  // Compute tooltip position relative to target
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
  };

  const tooltipWidth = 360;
  const padding = 16;

  if (targetRect) {
    let top = 0;
    let left = 0;

    if (step.placement === 'bottom') {
      top = targetRect.bottom + 12;
      left = Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, targetRect.left + targetRect.width / 2 - tooltipWidth / 2));
    } else if (step.placement === 'top') {
      top = Math.max(padding, targetRect.top - 240);
      left = Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, targetRect.left + targetRect.width / 2 - tooltipWidth / 2));
    } else if (step.placement === 'left') {
      top = targetRect.top;
      left = Math.max(padding, targetRect.left - tooltipWidth - 12);
    } else {
      // right
      top = targetRect.top;
      left = Math.min(window.innerWidth - tooltipWidth - padding, targetRect.right + 12);
    }

    // Keep within viewport height
    if (top + 280 > window.innerHeight) {
      top = window.innerHeight - 290;
    }

    tooltipStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 9999,
    };
  } else {
    // Center fallback
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${tooltipWidth}px`,
      zIndex: 9999,
    };
  }

  return (
    <div className="fixed inset-0 z-[9990] overflow-hidden pointer-events-auto">
      {/* Dark backdrop with cutout effect */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Target Highlight Box (Pulsing Spotlight Ring) */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 ease-out z-[9995] rounded-xl border-2 border-amber-400 bg-amber-400/10 shadow-[0_0_35px_rgba(251,191,36,0.45)] ring-4 ring-amber-400/30"
          style={{
            top: `${targetRect.top - 4}px`,
            left: `${targetRect.left - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
        />
      )}

      {/* Lightweight Tooltip Card */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="rounded-2xl border border-amber-500/40 bg-slate-900/98 p-5 text-white shadow-2xl shadow-slate-950/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              {step.icon}
            </div>
            <div>
              <span className="inline-block rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                {step.badgeText || `Bước ${currentStepIndex + 1}/${ONBOARDING_TOUR_STEPS.length}`}
              </span>
              <h4 className="mt-0.5 font-bold text-white text-sm sm:text-base leading-snug">
                {step.title}
              </h4>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Bỏ qua hướng dẫn"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <p className="mt-3 text-xs text-slate-300 leading-relaxed">
          {step.description}
        </p>

        {/* Step Indicator Dots & Navigation Buttons */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3.5">
          <div className="flex items-center gap-1.5">
            {ONBOARDING_TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-5 bg-amber-400'
                    : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Chuyển tới bước ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Trước</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/25 transition active:scale-95"
            >
              <span>{isLast ? 'Hoàn Tất Tour' : 'Tiếp Theo'}</span>
              {isLast ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
