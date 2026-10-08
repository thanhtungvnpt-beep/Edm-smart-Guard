import React, { useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Download,
  FileText,
  Gauge,
  History,
  Layers,
  MessageSquare,
  Mic,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

interface SystemDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemDocumentationModal: React.FC<SystemDocumentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeSection, setActiveSection] = useState<string>('overview');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopyDoc = async () => {
    try {
      const res = await fetch('/TAI_LIEU_GIOI_THIEU_CHUC_NANG_HE_THONG.md');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/TAI_LIEU_GIOI_THIEU_CHUC_NANG_HE_THONG.md';
    link.download = 'TAI_LIEU_GIOI_THIEU_CHUC_NANG_HE_THONG_EDM_SMARTGUARD.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sections = [
    { id: 'overview', title: '1. Tổng Quan & Tầm Nhìn', icon: BookOpen },
    { id: 'tech-stack', title: '2. Kiến Trúc Kỹ Thuật', icon: Cpu },
    { id: 'telemetry', title: '3. Giám Sát Cảm Biến IoT', icon: Activity },
    { id: 'dashboard', title: '4. Tùy Biến Dashboard Kéo Thả', icon: Layers },
    { id: 'analytics', title: '5. Dự Báo Vận Hành 7 Ngày (Recharts)', icon: Gauge },
    { id: 'ai-voice', title: '6. AI Chẩn Đoán & Voice-to-Text', icon: Mic },
    { id: 'smart-history', title: '7. Chẩn Đoán Dựa Trên Lịch Sử Máy', icon: History },
    { id: 'copilot-audio', title: '8. Trợ Lý Copilot & Audio SOP', icon: Volume2 },
    { id: 'repair-ettr', title: '9. Nghiệm Thu & AI Dự Báo ETTR', icon: Clock },
    { id: 'proficiency', title: '10. Bảng Điểm Thành Thạo KTV', icon: Award },
    { id: 'maintenance-sched', title: '11. Lập Lịch & Nhắc Bảo Dưỡng', icon: Calendar },
    { id: 'mobile-reports', title: '12. Mobile Sync, PDF & CSV', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col h-[94vh] max-h-[900px] w-full max-w-5xl overflow-hidden rounded-3xl border border-blue-500/50 bg-slate-950 shadow-2xl shadow-blue-950/40">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <BookOpen className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Tài Liệu Giới Thiệu Chức Năng Hệ Thống EDM SmartGuard AI
                </h2>
                <span className="rounded bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-300">
                  v2.5.0 Industrial Edition
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sổ tay mô tả nghiệp vụ toàn diện, kiến trúc công nghệ & hướng dẫn vận hành xưởng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
              title="Tải file markdown (.md) về máy tính"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              <span>Tải File .md</span>
            </button>

            <button
              onClick={handleCopyDoc}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
              title="Sao chép toàn bộ nội dung tài liệu"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã Sao Chép!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Sao Chép</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body Layout: Sidebar + Main Viewer */}
        <div className="flex flex-1 overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="hidden md:block w-72 border-r border-slate-800 bg-slate-900/40 p-4 overflow-y-auto space-y-1 text-xs">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              MỤC LỤC TÀI LIỆU
            </div>
            {sections.map((sec) => {
              const IconComp = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-medium transition ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <IconComp className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span className="truncate">{sec.title}</span>
                </button>
              );
            })}
          </div>

          {/* Main Viewer */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
            {/* Quick Header Banner */}
            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-950 p-5 shadow-lg">
              <span className="rounded bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-blue-300">
                INDUSTRIAL INTERNET OF THINGS & PREDICTIVE MAINTENANCE
              </span>
              <h1 className="mt-2 text-lg sm:text-xl font-black text-white">
                HỆ THỐNG QUẢN LÝ THIẾT BỊ EDM SMARTGUARD AI
              </h1>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                Giải pháp số hóa toàn diện dành cho các xưởng gia công khuôn mẫu chính xác, cắt dây Wire-cut EDM, xung điện Sinker EDM và phay CNC tốc độ cao.
              </p>
            </div>

            {/* SECTION 1: OVERVIEW */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-white">
                <BookOpen className="h-5 w-5 text-blue-400" />
                <span>1. Tổng Quan & Tầm Nhìn Hệ Thống</span>
              </div>
              <p>
                <strong>EDM SmartGuard AI</strong> là hệ thống quản trị dữ liệu thiết bị công nghiệp (Equipment Data Management - EDM) tích hợp trí tuệ nhân tạo (Gemini AI). Hệ thống giải quyết bài toán cốt lõi của nhà máy cơ khí chính xác:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li><strong>Giảm thiểu thời gian dừng máy (Downtime):</strong> Phát hiện sớm hiện tượng đứt dây cắt, tụt áp suất nước xả cao áp và quá nhiệt khối công suất IGBT trước khi xảy ra sự cố vỡ phôi.</li>
                <li><strong>Rút ngắn thời gian chẩn đoán:</strong> Thay thế việc tra cứu sổ tay dày hàng trăm trang bằng đề xuất giải pháp của AI trong vòng 3 giây.</li>
                <li><strong>Bảo tồn và kế thừa tri thức phân xưởng:</strong> Quy trình Human-in-the-Loop lưu giữ mẹo sửa chữa của các kỹ sư trưởng để truyền lại cho toàn bộ đội ngũ.</li>
              </ul>
            </div>

            {/* SECTION 2: TECH STACK */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-white">
                <Cpu className="h-5 w-5 text-purple-400" />
                <span>2. Kiến Trúc Kỹ Thuật & Công Nghệ Cốt Lõi</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
                  <strong className="text-white block font-mono text-cyan-400 mb-1">Frontend</strong>
                  <span>React 18 SPA, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts Analytics.</span>
                </div>
                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
                  <strong className="text-white block font-mono text-purple-400 mb-1">AI Diagnostic Engine</strong>
                  <span>Google Gemini 3.8 Flash, RAG đối chiếu tài liệu SOP OEM và tri thức thực chiến con người.</span>
                </div>
                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
                  <strong className="text-white block font-mono text-emerald-400 mb-1">Speech & Audio AI</strong>
                  <span>Web Speech API (nhận diện giọng nói rảnh tay tiếng Việt) & Text-to-Speech đọc to hướng dẫn thao tác.</span>
                </div>
                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3">
                  <strong className="text-white block font-mono text-amber-400 mb-1">Offline & Sync</strong>
                  <span>Progressive Web App (PWA), Service Worker, LocalStorage Persistence, Push Notification Simulator.</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: KEY MODULES */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-white">
                <Layers className="h-5 w-5 text-emerald-400" />
                <span>3. Danh Mục Các Phân Hệ & Tính Năng Chuyên Sâu</span>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3.5">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    <span>Giám Sát IoT Telemetry & Sparkline</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Theo dõi 9 chỉ số cảm biến công nghiệp theo thời gian thực: Điện áp phóng điện (V), Dòng đỉnh xung (A), Áp suất dung dịch điện môi (Bar), Nhiệt độ (°C), Sức căng dây (N), Độ rung (mm/s), Độ dẫn điện (µS/cm), Tốc độ dây và OEE.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3.5">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-cyan-400" />
                    <span>Dự Báo Hiệu Suất Vận Hành 7 Ngày (Tích hợp Recharts)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Phân tích chuỗi thời gian telemetry và lịch sử dừng máy để vẽ biểu đồ dự báo tỷ lệ Uptime vận hành cho 7 ngày tới. Hỗ trợ nút trích xuất dữ liệu phân tích ra định dạng file CSV chuẩn.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3.5">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Mic className="h-4 w-4 text-purple-400" />
                    <span>AI Chẩn Đoán & Nhập Liệu Giọng Nói Rảnh Tay (Hands-Free Voice-to-Text)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Kỹ thuật viên tại hiện trường chỉ cần bật micro và mô tả âm thanh, mùi khét hoặc hiện tượng phôi. AI lập tức tích hợp triệu chứng này vào prompt của Gemini để tái chẩn đoán sự cố chính xác.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3.5">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <History className="h-4 w-4 text-amber-400" />
                    <span>Chẩn Đoán Thông Minh Dựa Trên Lịch Sử Bảo Dưỡng Định Kỳ (Smart History)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Tự động đối chiếu các kỳ bảo dưỡng định kỳ (Preventive) và sửa chữa đột xuất trước đó của chính máy đó. AI nhận diện linh kiện đã sắp chạm ngưỡng chu kỳ hao mòn (như cụm dẫn hướng kim cương P-104 đã chạy 380h/500h) để gợi ý nguyên nhân gốc rễ và mức độ tương quan (%).
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3.5">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    <span>Nghiệm Thu Sửa Chữa & AI Dự Báo Thời Gian (AI ETTR)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Tính toán thời gian mục tiêu hoàn thành (Estimated Time to Repair) dựa trên mã lỗi thực tế kết hợp với chỉ số hiệu suất quá khứ của kỹ thuật viên được giao việc trên dòng máy đó. Cung cấp nút một chạm áp dụng thời gian và so sánh chênh lệch thực tế.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3.5">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span>Đội Ngũ Kỹ Thuật Viên & Bảng Điểm Thành Thạo (Proficiency Score)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Đo lường năng lực thực chiến dựa trên số ca sửa chữa đã giải quyết thành công và số lần bài học do KTV đóng góp được hệ thống tái áp dụng thành công trên toàn xưởng.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3.5">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span>Lập Lịch Bảo Dưỡng & Nhắc Việc Định Kỳ (Maintenance Reminders)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Lịch trực quan theo dõi các mốc bảo dưỡng 250h, 500h, 1000h, 2000h và cho phép thiết lập thông báo nhắc việc định kỳ cho từng linh kiện hao mòn cụ thể (như bộ lọc, phớt bơm, dây curoa).
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 4: STANDARD WORKFLOW */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-white">
                <Wrench className="h-5 w-5 text-amber-400" />
                <span>4. Quy Trình Vận Hành Tiêu Chuẩn Tại Hiện Trường</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 font-bold font-mono">1</span>
                  <span><strong>Phát hiện dừng máy:</strong> Thẻ máy chuyển đỏ `CRITICAL_STOP`. Bấm nút "AI Chẩn Đoán".</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 font-bold font-mono">2</span>
                  <span><strong>Mô tả triệu chứng bằng giọng nói:</strong> Bấm micro, nói mô tả hiện tượng ("tiếng rít ở trục Z, nước xả yếu").</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 font-bold font-mono">3</span>
                  <span><strong>Đối chiếu lịch sử máy:</strong> Xem tương quan chu kỳ hao mòn và bấm "AI Tái Chẩn Đoán Cùng Lịch Sử".</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 font-bold font-mono">4</span>
                  <span><strong>Nghe hướng dẫn rảnh tay:</strong> Bấm "Đọc To Hướng Dẫn" và tiến hành thao tác sửa chữa an toàn.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 font-bold font-mono">5</span>
                  <span><strong>Nghiệm thu & dạy AI:</strong> Mở Repair Report, xem AI ETTR, áp dụng thời gian và bấm lưu bài học mới vào AI.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-6 py-3.5 text-xs text-slate-400">
          <span>Tài liệu phát hành nội bộ • Bản quyền hệ thống EDM SmartGuard AI</span>
          <button
            onClick={onClose}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 font-bold shadow-lg shadow-blue-600/30 transition"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
