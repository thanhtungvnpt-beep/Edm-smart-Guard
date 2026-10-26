import React, { useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
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
  Bookmark,
  SlidersHorizontal,
  Keyboard,
  Users2,
  Trophy,
  Brain,
  StickyNote,
  Crown,
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
    { id: 'leader-view', title: '4. Trung Tâm Điều Hành EQM Leader (PC & Mobile)', icon: Users2 },
    { id: 'leaderboard', title: '5. Bảng Xếp Hạng KTV & Top 1 Crown', icon: Trophy },
    { id: 'radar-chart', title: '6. Hồ Sơ KTV & Radar 5 Dòng Máy EDM', icon: Award },
    { id: 'ai-synthesis', title: '7. Bộ Não Tổng Hợp Tri Thức AI Kép', icon: Brain },
    { id: 'quick-notes', title: '8. Ghi Chú Nhanh & Tìm Kiếm Đa Năng', icon: StickyNote },
    { id: 'analytics', title: '9. Factory Health Trend & OEE 7 Ngày', icon: Gauge },
    { id: 'ai-voice', title: '10. AI Chẩn Đoán & Voice-to-Text', icon: Mic },
    { id: 'smart-history', title: '11. Chẩn Đoán Dựa Trên Lịch Sử Máy', icon: History },
    { id: 'copilot-audio', title: '12. Trợ Lý Copilot & Audio SOP', icon: Volume2 },
    { id: 'repair-ettr', title: '13. Nghiệm Thu & AI Dự Báo ETTR', icon: Clock },
    { id: 'maintenance-sched', title: '14. Lập Lịch & Nhắc Bảo Dưỡng', icon: Calendar },
    { id: 'mobile-reports', title: '15. Mobile Sync, PDF & CSV', icon: FileText },
    { id: 'community', title: '16. Cộng Đồng Liên Nhà Máy (COM-01 → 06)', icon: Sparkles },
    { id: 'approvals', title: '17. Phê Duyệt & Audit Trail Quản Đốc (MGR-03)', icon: ShieldCheck },
    { id: 'phase2-suite', title: '18. Giai Đoạn 2 — Control Tower & 4 Engines (P2-01 → P2-09)', icon: Activity },
    { id: 'phase1-trust', title: '19. Giai Đoạn 1 — Trusted AI Foundation (Mô-đun 1 → 6)', icon: ShieldCheck },
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
                    <Keyboard className="h-4 w-4 text-emerald-400" />
                    <span>Phím Tắt Bàn Phím Công Nghiệp (Industrial Keyboard Hotkeys: Alt+1..5, Alt+K)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Tối ưu hóa thao tác cho kỹ thuật viên khi đang <strong>đeo găng tay cách điện / bảo hộ</strong> hoặc đứng thao tác trên màn hình điều khiển công nghiệp (IPC). Hỗ trợ chuyển đổi tức thì giữa các tab với tổ hợp <strong>Alt+1</strong> (Giám sát máy), <strong>Alt+2</strong> (Bộ não AI), <strong>Alt+3</strong> (Tài liệu kỹ thuật), <strong>Alt+4</strong> (Nhật ký Push), <strong>Alt+5</strong> (Thiết bị di động). Tích hợp phím số thường và <strong>Numpad 1..5</strong>, phím tắt <strong>Shift+R</strong> (Làm mới & đồng bộ toàn bộ dữ liệu xưởng EDM), <strong>Alt+Q</strong> (Quét QR máy), <strong>Alt+T</strong> (Trực ca KTV), <strong>Alt+M</strong> (Tắt/Bật còi) và <strong>Alt+K / ?</strong> mở bảng tra cứu phím tắt kèm âm thanh xúc giác (tactile audio feedback).
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3.5">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-amber-400" />
                    <span>Bộ Lọc Nâng Cao & Quản Lý Lọc Nhanh Tùy Chỉnh (Custom Quick Filters)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Tích hợp trong <code>AdvancedFilterPanel</code> cho phép phân loại thiết bị đa chiều theo <strong>Ca làm việc</strong> (Ca Sáng 06:00-14:30, Ca Chiều 14:00-22:30, Ca Đêm 22:00-06:30, hoặc tự động nhận diện theo giờ thực tế), nhiệt độ dung môi (°C), công suất tiêu thụ điện (kW), và thời gian vận hành liên tục (Uptime &gt;18h / &gt;24h). Đặc biệt hỗ trợ kỹ thuật viên <strong>lưu trữ không giới hạn các cấu hình bộ lọc tùy chỉnh</strong> (như <em>"Kiểm tra khẩn cấp ca sáng"</em>, <em>"Máy trực ca chiều"</em>, <em>"Máy trực ca đêm"</em>) kèm thẻ màu và biểu tượng nhận diện, lưu vĩnh viễn trên LocalStorage, và áp dụng lại tức thì chỉ với một chạm kèm âm thanh thông báo.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3.5">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span>Menu Tác Vụ Nhanh (Quick Actions Menu: Reset Counter, Calibrate Sensor, Force Sync)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Tích hợp trực tiếp trên mỗi thẻ máy (DeviceCard), cho phép kỹ thuật viên thực thi tức thời 3 tác vụ phổ biến nhất mà không cần mở toàn bộ modal chi tiết: <strong>Đặt lại bộ đếm bảo dưỡng (Reset Service Counter)</strong> chu kỳ 500h hoặc phụ tùng thay thế; <strong>Hiệu chuẩn cảm biến (Calibrate Sensor)</strong> với quy trình khử trôi điểm 0 (Zero-offset) và chuẩn hóa Span Gain 4 giai đoạn; và <strong>Cưỡng bức đồng bộ PLC (Force Sync)</strong> qua Modbus TCP/IP với đo kiểm độ trễ mili-giây.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3.5">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-cyan-400" />
                    <span>Factory Health Trend & Dự Báo Uptime (Tích hợp Recharts)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Trực quan hóa chỉ số OEE trung bình 7 ngày qua của toàn phân xưởng hoặc theo từng thiết bị đơn lẻ bằng Recharts ComposedChart. Phân tách chi tiết 3 trụ cột OEE (Sẵn Sàng A, Hiệu Suất P, Chất Lượng Q), đối sánh đường chuẩn World-Class 85%, cùng các khuyến nghị vận hành chiến lược cho giám sát viên và xuất báo cáo CSV.
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
                    <BarChart3 className="h-4 w-4 text-indigo-400" />
                    <span>Biểu Đồ Cột Tần Suất Mã Lỗi 30 Ngày & Đánh Giá Phân Tích Gốc Rễ (Deeper RCA)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Tích hợp biểu đồ cột Recharts trong AIDiagnosisModal hiển thị tần suất xuất hiện của từng mã lỗi qua 30 ngày gần nhất. Tự động tính chu kỳ lặp lại trung bình (MTBF), nhận diện xu hướng tái diễn dày đặc (≥4 lần/tháng) và đưa ra phán quyết bắt buộc kích hoạt phân tích nguyên nhân gốc rễ chuyên sâu (Deeper RCA - 5 Whys & Ishikawa) kèm danh mục kiểm tra cơ khí / điện tử chi tiết.
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

                <div className="rounded-xl bg-slate-950/70 border border-blue-500/30 p-3.5 bg-gradient-to-r from-blue-950/20 to-slate-950/60">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-blue-400" />
                    <span>Trung Tâm Điều Hành EQM Leader (EqmLeaderView - PC & Mobile Dual Viewport)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Hệ thống điều hành kép: Bảng điều khiển PC toàn cảnh giám sát sự cố mở, SLA, phân công KTV 1-chạm, duyệt xuất kho phụ tùng khẩn cấp và phát thông báo bộ đàm; cùng phiên bản Mobile Pocket Companion hiện trường với 4 tab chuyên biệt (Điều phối, Kíp KTV, Xếp hạng, Bộ não AI).
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-amber-500/30 p-3.5 bg-gradient-to-r from-amber-950/20 to-slate-950/60">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <span>Bảng Xếp Hạng Kỹ Thuật Viên & Tuyên Dương Đẩy Di Động (Push Commendation)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Đo lường thành tích sửa chữa theo Tuần/Tháng/Năm dựa trên số ca khắc phục, MTTR và tỷ lệ Pass lần đầu. Bục vinh danh Top 1-2-3 với vương miện Top 1 (Crown) và tính năng gửi thông báo đẩy trực tiếp tới điện thoại KTV khi được tuyên dương qua API <code>/api/mobile-devices/push-commendation</code>.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-purple-500/30 p-3.5 bg-gradient-to-r from-purple-950/20 to-slate-950/60">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-400" />
                    <span>Hồ Sơ KTV & Biểu Đồ Radar Đa Chiều Năng Lực 5 Dòng Máy EDM (Spider Chart)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Trực quan hóa phân bổ kỹ năng trên 5 dòng máy EDM công nghiệp hàng đầu (Makino U6, Sodick ALC, Makino EDAF3, Fanuc C600iB, Mitsubishi EA12V). Tích hợp thống kê số giờ làm việc, lịch sử phiếu sửa chữa và dòng thời gian huy hiệu thành tích (Milestone Timeline).
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-indigo-500/30 p-3.5 bg-gradient-to-r from-indigo-950/20 to-slate-950/60">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-indigo-400" />
                    <span>Bộ Não Tổng Hợp Tri Thức AI Kép (AI Knowledge Synthesis Engine)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Cơ chế tự học hỏi song song từ 2 trụ cột: Tài liệu kỹ thuật SOP OEM và Báo cáo nghiệm thu thực chiến của con người qua API <code>/api/ai/synthesize-knowledge</code>. Xuất thẻ trích dẫn nguồn có thể kiểm chứng (Verifiable Citations) đảm bảo tính chính xác và an toàn phân xưởng.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-emerald-500/30 p-3.5 bg-gradient-to-r from-emerald-950/20 to-slate-950/60">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-emerald-400" />
                    <span>Ghi Chú Nhanh (Quick Notes) & Thanh Tìm Kiếm / Sắp Xếp Đa Năng</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Thanh tìm kiếm theo tên, ca trực, chuyên môn, số điện thoại hoặc nội dung ghi chú. Sắp xếp linh hoạt theo Điểm kỹ năng, Tên A-Z, Tải việc. Trưởng nhóm có thể gắn ghi chú nhắc việc nhanh nội dòng với phân loại mức độ ưu tiên (Bình thường / Khẩn cấp ⚠️) và tự động ghim lời nhắc lên phiếu điều phối sự cố.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-purple-500/30 p-3.5 bg-gradient-to-r from-purple-950/20 to-slate-950/60">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span>Cộng Đồng Kỹ Thuật Viên Liên Nhà Máy (COM-01 → COM-06)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Mạng lưới tri thức kết nối KTV 3 nhà máy (Bắc Ninh, Hà Nội, TP.HCM). Tự động kích hoạt bộ lọc bảo mật ẩn danh hóa (Anonymization Sanitizer) các số seri và dữ liệu độc quyền trước khi đăng; AI Copilot phân tích tiền lệ và cảnh báo an toàn; bảng vinh danh chuyên gia theo từng dòng máy EDM; và quy trình 5 bước nghiêm ngặt chuyển hóa thảo luận thành SOP chính hãng.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-amber-500/30 p-3.5 bg-gradient-to-r from-amber-950/20 to-slate-950/60">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-400" />
                    <span>Thẩm Định Đề Xuất & Sổ Lưu Vết Quản Đốc (Human in the Loop - MGR-03)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Cơ chế Human-in-the-Loop bắt buộc: AI chỉ đề xuất, giải trình bằng chứng (AI Evidence) và rủi ro (Risk Hypothesis). Quản đốc nhà máy có toàn quyền Ký Duyệt, Từ Chối, Yêu Cầu Bổ Sung Dữ Liệu hoặc Chuyển Giao Trực Tiếp cho Leader. Toàn bộ quyết định được lưu vết điện tử (Audit Trail) phục vụ truy vết và nâng cao chất lượng tri thức.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/70 border border-indigo-500/40 p-3.5 bg-gradient-to-r from-indigo-950/30 to-purple-950/20">
                  <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-400" />
                    <span>Giai Đoạn 2: AI Performance Control Tower & Liên Kết 4 Engine (P2-01 → P2-09)</span>
                  </h4>
                  <p className="mt-1 text-slate-300 text-xs">
                    Kiến trúc liên kết 4 Engine: <strong>Bảo Dưỡng Dự Đoán (Engine A)</strong> với Risk Timeline 5 nấc → <strong>Tối Ưu Sản Xuất (Engine C)</strong> giải quyết nghẽn bottleneck với 5 kịch bản mô phỏng → <strong>Dự Báo Chất Lượng (Engine D)</strong> phát hiện rỗ và trôi dung sai → <strong>Phân Tích Nguyên Nhân Gốc (Engine B)</strong> với bằng chứng xác thực. Tích hợp cổng kiểm định dữ liệu <strong>Data Quality Gate (94.8%)</strong> và vòng lặp học tập <strong>AI Learning Loop (P2-08)</strong> đo lường kết quả thực tế.
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
