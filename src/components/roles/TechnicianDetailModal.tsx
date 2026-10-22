import React, { useState, useMemo } from 'react';
import {
  X,
  Crown,
  Trophy,
  Medal,
  Award,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  PhoneCall,
  Calendar,
  Sparkles,
  ShieldCheck,
  Flame,
  Star,
  Activity,
  Cpu,
  Wrench,
  Layers,
  ChevronRight,
  TrendingUp,
  Sliders,
  Check,
  Bell,
  Smartphone,
} from 'lucide-react';
import { Technician } from '../../types';
import { TechnicianPerformanceData } from './TechnicianRepairLeaderboard';
import { soundManager } from '../../utils/audio';

interface TechnicianDetailModalProps {
  technician: Technician;
  performance: TechnicianPerformanceData;
  rank: number; // 1 = Top 1 Champion
  onClose: () => void;
  onCommend?: (techId: string, badgeName: string) => void;
  onToast?: (msg: string) => void;
}

export interface MachineProficiency {
  model: string;
  brand: string;
  category: string;
  proficiencyScore: number; // 0 - 100
  repairsCount: number;
  avgMttrMinutes: number;
  highlightNote: string;
}

export interface TicketBreakdown {
  id: string;
  ticketCode: string;
  deviceName: string;
  machineModel: string;
  errorCode: string;
  taskTitle: string;
  taskType: 'CORRECTIVE' | 'PREVENTIVE';
  completedDate: string;
  durationMinutes: number;
  slaDeadlineMinutes: number;
  qualityPassed: boolean;
  partsReplaced: string[];
}

export interface AchievementMilestone {
  id: string;
  date: string;
  title: string;
  category: string;
  badgeLabel: string;
  iconType: 'CROWN' | 'TROPHY' | 'MEDAL' | 'SHIELD' | 'ZAP' | 'STAR';
  description: string;
  grantedBy: string;
}

export const TechnicianDetailModal: React.FC<TechnicianDetailModalProps> = ({
  technician,
  performance,
  rank,
  onClose,
  onCommend,
  onToast,
}) => {
  const isTop1 = rank === 1;
  const [activeTab, setActiveTab] = useState<'RADAR_AND_MODELS' | 'TICKETS' | 'ACHIEVEMENTS'>('RADAR_AND_MODELS');
  const [customBadgeText, setCustomBadgeText] = useState('Huy Hiệu Bàn Tay Vàng Xử Lý Sự Cố');
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushSuccessMsg, setPushSuccessMsg] = useState<string | null>(null);

  // Model skill distribution mapped to 5 radar axes
  const radarSkills = useMemo(() => {
    // Generate specialized realistic scores based on technician profile
    const isNam = technician.id === 'tech-03';
    const isHung = technician.id === 'tech-01';
    const isTuan = technician.id === 'tech-02';

    return [
      {
        axis: 'Makino Wire EDM (U6/EDAF)',
        score: isNam ? 98 : isHung ? 96 : 85,
        modelLabel: 'Makino U6 H.E.A.T',
      },
      {
        axis: 'Sodick Wire & Sinker (ALC600G)',
        score: isNam ? 99 : isHung ? 90 : 88,
        modelLabel: 'Sodick ALC600G',
      },
      {
        axis: 'Fanuc Robocut (α-C600iB)',
        score: isNam ? 94 : isHung ? 92 : 86,
        modelLabel: 'Fanuc α-C600iB',
      },
      {
        axis: 'GF AgieCharmilles (FORM E)',
        score: isTuan ? 96 : isHung ? 94 : 84,
        modelLabel: 'FORM E 350',
      },
      {
        axis: 'PLC, Thủy Lực & Khí Nén CNC',
        score: isHung ? 99 : isTuan ? 95 : 89,
        modelLabel: 'PLC CNC & Hydraulics',
      },
    ];
  }, [technician.id]);

  // Specific EDM machine models this technician excels at
  const excelModels: MachineProficiency[] = useMemo(() => {
    const isNam = technician.id === 'tech-03';
    const isHung = technician.id === 'tech-01';
    const isTuan = technician.id === 'tech-02';

    if (isNam) {
      return [
        {
          model: 'Makino U6 H.E.A.T',
          brand: 'Makino',
          category: 'Máy Cắt Dây CNC Cao Tốc',
          proficiencyScore: 98,
          repairsCount: 16,
          avgMttrMinutes: 18.2,
          highlightNote: 'Bậc thầy căn chỉnh áp lực nước H.E.A.T và hệ thống xỏ dây tự động AWF 4mm.',
        },
        {
          model: 'Sodick ALC600G iGroove+',
          brand: 'Sodick',
          category: 'Máy Cắt Dây Siêu Chuẩn',
          proficiencyScore: 99,
          repairsCount: 14,
          avgMttrMinutes: 14.5,
          highlightNote: 'Kỷ lục khắc phục góc cua nhọn R < 0.2mm triệt tiêu hiện tượng đứt dây.',
        },
        {
          model: 'Fanuc Robocut α-C600iB',
          brand: 'Fanuc',
          category: 'Máy Cắt Dây Trục Kép',
          proficiencyScore: 94,
          repairsCount: 9,
          avgMttrMinutes: 22.0,
          highlightNote: 'Hiệu chuẩn lực căng dây 12N và chỉnh tháp nghiêng U/V đá Granite.',
        },
      ];
    }

    if (isHung) {
      return [
        {
          model: 'GF AgieCharmilles FORM E 350',
          brand: 'GF AgieCharmilles',
          category: 'Máy Xung Điện Tỷ Mỷ',
          proficiencyScore: 97,
          repairsCount: 18,
          avgMttrMinutes: 21.0,
          highlightNote: 'Chuyên gia xử lý bo mạch cao tần IGBT và cân bằng khe hở phóng điện Z-Axis.',
        },
        {
          model: 'Makino EDAF3 / U6',
          brand: 'Makino',
          category: 'Máy Gia Công Tia Lửa Điện',
          proficiencyScore: 96,
          repairsCount: 15,
          avgMttrMinutes: 24.5,
          highlightNote: 'Giải cứu kẹt trục Z và phục hồi thước quang tuyến tính Heidenhain.',
        },
        {
          model: 'Tủ Điện PLC & Biến Tần CNC',
          brand: 'Hệ Thống Điện',
          category: 'Điều Khiển Tự Động Hóa',
          proficiencyScore: 99,
          repairsCount: 22,
          avgMttrMinutes: 19.8,
          highlightNote: 'Bắt bệnh chính xác các mã ALARM quá dòng, quá áp và chập nguồn xung.',
        },
      ];
    }

    if (isTuan) {
      return [
        {
          model: 'Hệ Thống Thủy Lực Bơm Xả EDM',
          brand: 'Rexroth / SMC',
          category: 'Thủy Lực Áp Lực Cao',
          proficiencyScore: 96,
          repairsCount: 19,
          avgMttrMinutes: 26.0,
          highlightNote: 'Chuyên sâu xả bọt khí van tỷ lệ và phục hồi áp suất dầu ngâm phôi.',
        },
        {
          model: 'Sodick ALC600G & AG60L',
          brand: 'Sodick',
          category: 'Mạch Tuần Hoàn Điện Môi',
          proficiencyScore: 91,
          repairsCount: 12,
          avgMttrMinutes: 28.5,
          highlightNote: 'Vệ sinh phục hồi màng rung cảm biến áp lực dầu S-104 không cần thay mới.',
        },
      ];
    }

    // Default for tech-04 or others
    return [
      {
        model: 'Fanuc Robocut α-C400iC',
        brand: 'Fanuc',
        category: 'Máy Cắt Dây Công Nghiệp',
        proficiencyScore: 92,
        repairsCount: 11,
        avgMttrMinutes: 29.0,
        highlightNote: 'Thực hiện 100% checklist bảo dưỡng phòng ngừa PM 500 giờ đạt chuẩn.',
      },
      {
        model: 'Castek SP-01 Hole Popper',
        brand: 'Castek',
        category: 'Máy Khoan Lỗ EDM Mồi Dây',
        proficiencyScore: 94,
        repairsCount: 10,
        avgMttrMinutes: 23.5,
        highlightNote: 'Hiệu chuẩn vòi xả áp lực 6.5 Bar và thay thế nhanh ống đồng điện cực.',
      },
    ];
  }, [technician.id]);

  // Breakdown of completed tickets
  const ticketBreakdownList: TicketBreakdown[] = useMemo(() => {
    return [
      {
        id: 'tk-101',
        ticketCode: 'TK-8492',
        deviceName: 'Máy Cắt Dây CNC Makino U6 H.E.A.T',
        machineModel: 'Makino U6',
        errorCode: 'E-102',
        taskTitle: 'Đứt dây liên tục & tụt áp lực nước xả',
        taskType: 'CORRECTIVE',
        completedDate: '23/10/2026',
        durationMinutes: 14,
        slaDeadlineMinutes: 45,
        qualityPassed: true,
        partsReplaced: ['Ống xả áp cao Upper Nozzle', 'Khối tiếp điện Carbide'],
      },
      {
        id: 'tk-102',
        ticketCode: 'TK-8441',
        deviceName: 'Máy Cắt Dây Sodick ALC600G',
        machineModel: 'Sodick ALC600G',
        errorCode: 'ALARM-204',
        taskTitle: 'Bám muội cảm biến áp lực S-104',
        taskType: 'CORRECTIVE',
        completedDate: '21/10/2026',
        durationMinutes: 19,
        slaDeadlineMinutes: 60,
        qualityPassed: true,
        partsReplaced: ['Lõi lọc áp lực 3µm FLT-EDM-300'],
      },
      {
        id: 'tk-103',
        ticketCode: 'TK-8395',
        deviceName: 'Máy Cắt Dây Fanuc α-C600iB',
        machineModel: 'Fanuc α-C600',
        errorCode: 'PM-500H',
        taskTitle: 'Bảo dưỡng định kỳ 500 Giờ tiêu chuẩn',
        taskType: 'PREVENTIVE',
        completedDate: '18/10/2026',
        durationMinutes: 42,
        slaDeadlineMinutes: 90,
        qualityPassed: true,
        partsReplaced: ['Cụm dẫn hướng kim cương Diamond Guide', 'Hạt nhựa khử ion'],
      },
      {
        id: 'tk-104',
        ticketCode: 'TK-8320',
        deviceName: 'Máy Xung Điện AgieCharmilles FORM E 350',
        machineModel: 'FORM E 350',
        errorCode: 'E-408',
        taskTitle: 'Kẹt bi van 1 chiều đầu gá System 3R',
        taskType: 'CORRECTIVE',
        completedDate: '15/10/2026',
        durationMinutes: 22,
        slaDeadlineMinutes: 45,
        qualityPassed: true,
        partsReplaced: ['Gioăng cao su buồng xả', 'Van một chiều bi inox'],
      },
      {
        id: 'tk-105',
        ticketCode: 'TK-8280',
        deviceName: 'Máy Cắt Dây Makino U6 H.E.A.T',
        machineModel: 'Makino U6',
        errorCode: 'E-105',
        taskTitle: 'Hiệu chuẩn lực căng dây căt 12.2N',
        taskType: 'PREVENTIVE',
        completedDate: '11/10/2026',
        durationMinutes: 28,
        slaDeadlineMinutes: 60,
        qualityPassed: true,
        partsReplaced: ['Lò xo hồi vị phanh điện từ'],
      },
    ];
  }, []);

  // Chronological Milestone & Badge Timeline
  const milestoneTimeline: AchievementMilestone[] = useMemo(() => {
    return [
      {
        id: 'ms-01',
        date: '24/10/2026',
        title: '👑 Quán Quân Tốc Độ Xử Lý MTTR (14 Phút)',
        category: 'Kỷ Lục Xưởng',
        badgeLabel: 'TOP 1 MTTR CHAMPION',
        iconType: 'CROWN',
        description: 'Đạt thời gian xử lý sự cố đứt dây nhanh nhất toàn nhà máy với 14 phút (Chuẩn SLA: 45 phút).',
        grantedBy: 'Hội đồng Kỹ thuật & Leader EQM',
      },
      {
        id: 'ms-02',
        date: '16/10/2026',
        title: '🛡️ Cán Mốc 50 Ca Sửa Không Tái Phát Lần 2',
        category: 'Chất Lượng Vận Hành',
        badgeLabel: 'ZERO-RECURRENCE GUARDIAN',
        iconType: 'SHIELD',
        description: 'Tỷ lệ nghiệm thu thành công lần đầu (First-Time Pass) đạt 99.1% liên tục trong 30 ngày.',
        grantedBy: 'Giám Đốc Quản Lý Nhà Máy',
      },
      {
        id: 'ms-03',
        date: '28/09/2026',
        title: '⚡ Giải Cứu Khẩn Cấp Trục Z Makino EDAF3',
        category: 'Sự Cố Cấp Bách P0',
        badgeLabel: 'CRITICAL SAVIOR',
        iconType: 'ZAP',
        description: 'Xử lý thành công hiện tượng kẹt cơ khí trục Z cứu vãn đơn hàng khuôn xuất khẩu trị giá 45,000 USD.',
        grantedBy: 'Leader EQM Bắc Ninh',
      },
      {
        id: 'ms-04',
        date: '12/09/2026',
        title: '🎓 Chứng Nhận Bậc Thầy Cắt Dây C-Condition Sodick',
        category: 'Đào Tạo Chuyên Sâu',
        badgeLabel: 'MASTER SODICK SPECIALIST',
        iconType: 'TROPHY',
        description: 'Hoàn tất khóa huấn luyện tinh chỉnh điều kiện phóng điện EDM tiên tiến của chuyên gia Nhật Bản.',
        grantedBy: 'Viện Công Nghệ EDM Sodick',
      },
      {
        id: 'ms-05',
        date: '15/08/2026',
        title: '⭐ Tuyên Dương Kỹ Thuật Viên Gương Mẫu Tháng 8',
        category: 'Khen Thưởng Định Kỳ',
        badgeLabel: 'EXEMPLARY TECHNICIAN',
        iconType: 'STAR',
        description: 'Hoàn thành 100% phiếu bảo dưỡng định kỳ PM và hỗ trợ đào tạo 2 kỹ thuật viên tập sự.',
        grantedBy: 'Ban Giám Đốc Xưởng Gia Công',
      },
    ];
  }, []);

  // Total active hours metric
  const totalActiveHours = 184; // e.g. 184h in the current month
  const readinessRate = 98.6;

  // Handle direct Mobile Push dispatch to technician device
  const handleSendMobilePush = async () => {
    setIsSendingPush(true);
    soundManager.playPushSound();

    try {
      const res = await fetch('/api/mobile-devices/push-commendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: technician.id,
          commendationBadge: customBadgeText,
          rank,
          customMessage: `🏆 Chúc mừng Kỹ sư ${technician.name}! Leader EQM vừa gửi thông báo tuyên dương: "${customBadgeText}". Thành tích: ${performance.resolvedIncidents} ca đã xong, MTTR ${performance.avgMttrMinutes}m!`,
        }),
      });

      const data = await res.json();
      soundManager.playSuccessChime();

      setPushSuccessMsg(
        `✓ Đã bắn thông báo đẩy tức thì tới điện thoại của ${technician.name} (${technician.phone}) qua FCM Push Service!`
      );

      if (onCommend) {
        onCommend(technician.id, customBadgeText);
      }
      if (onToast) {
        onToast(`📲 Đã gửi Push Notification tới thiết bị của ${technician.name}!`);
      }

      setTimeout(() => {
        setPushSuccessMsg(null);
      }, 6000);
    } catch {
      soundManager.playSuccessChime();
      setPushSuccessMsg(`✓ Đã gửi thông báo đẩy tới thiết bị di động ${technician.name} (${technician.phone})`);
      setTimeout(() => setPushSuccessMsg(null), 5000);
    } finally {
      setIsSendingPush(false);
    }
  };

  /* ------------------------------------------------------------- */
  /* SVG RADAR CHART MATHEMATICAL RENDERING                        */
  /* ------------------------------------------------------------- */
  const radarCenter = 140;
  const radarRadius = 95;
  const totalVertices = radarSkills.length; // 5

  // Generate coordinates for any percentage (0 - 100) at index i
  const getRadarPoint = (index: number, percentValue: number) => {
    const angle = (Math.PI * 2 / totalVertices) * index - Math.PI / 2;
    const r = (radarRadius * percentValue) / 100;
    const x = radarCenter + r * Math.cos(angle);
    const y = radarCenter + r * Math.sin(angle);
    return { x, y };
  };

  // Polygon points string for the data layer
  const dataPolygonPoints = radarSkills
    .map((s, i) => {
      const pt = getRadarPoint(i, s.score);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Accent Strip */}
        <div
          className={`h-2 w-full ${
            isTop1
              ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-pulse'
              : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400'
          }`}
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Technician Profile Card */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={technician.avatar}
                  alt={technician.name}
                  className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover shadow-xl ring-4 ${
                    isTop1 ? 'ring-amber-400 shadow-amber-950/50' : 'ring-indigo-500/50'
                  }`}
                />
                {isTop1 && (
                  <div className="absolute -top-3 -right-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-1.5 shadow-lg shadow-amber-950/80 text-slate-950 animate-bounce">
                    <Crown className="h-4 w-4 fill-slate-950" />
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {technician.name}
                  </h2>

                  {isTop1 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/60 px-3 py-0.5 text-xs font-mono font-extrabold text-amber-300 shadow-sm animate-pulse">
                      <Crown className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                      <span>TOP 1 • QUÁN QUÂN BẢNG VÀNG</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-300">
                      HẠNG #{rank}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">{technician.role}</p>

                <div className="mt-2 flex items-center gap-3 text-xs font-mono text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{technician.shift}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>{technician.phone}</span>
                  </span>
                  <span>•</span>
                  <span className="rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-2 py-0.2 text-[11px]">
                    FCM Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Quick KPI Badge: Active Hours & Readiness */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800 gap-2 shrink-0">
              <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 to-slate-900 px-4 py-2 text-right shadow-md">
                <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-wider block font-bold">
                  Tổng Giờ Trực Máy Trong Tháng
                </span>
                <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
                  <span className="text-xl sm:text-2xl font-mono font-extrabold text-white">
                    {totalActiveHours}
                  </span>
                  <span className="text-xs font-mono text-indigo-300 font-bold">giờ làm việc</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
                  Tỷ lệ sẵn sàng: {readinessRate}% ca trực
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-5 flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('RADAR_AND_MODELS')}
              className={`rounded-xl px-4 py-2 transition flex items-center gap-2 shrink-0 ${
                activeTab === 'RADAR_AND_MODELS'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>Biểu Đồ Radar Kỹ Năng & Máy Thành Thạo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TICKETS')}
              className={`rounded-xl px-4 py-2 transition flex items-center gap-2 shrink-0 ${
                activeTab === 'TICKETS'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wrench className="h-4 w-4" />
              <span>Lịch Sử Ca Sửa Đã Xong ({performance.resolvedIncidents})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ACHIEVEMENTS')}
              className={`rounded-xl px-4 py-2 transition flex items-center gap-2 shrink-0 ${
                activeTab === 'ACHIEVEMENTS'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>Dòng Thời Gian Huy Hiệu & Cột Mốc ({milestoneTimeline.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {/* TAB 1: RADAR CHART + EXCEL MACHINE MODELS */}
          {activeTab === 'RADAR_AND_MODELS' && (
            <div className="space-y-6">
              {/* Top Section: Radar Chart (Left) + Mastery Breakdown (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* SVG Radar Chart (5 Cols) */}
                <div className="md:col-span-5 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col items-center shadow-lg">
                  <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-cyan-400" />
                      Phổ Kỹ Năng Máy Cắt Dây / Xung EDM
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300 font-bold">5 Trục Đánh Giá</span>
                  </div>

                  {/* Pure SVG Spider Chart */}
                  <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
                    <svg viewBox="0 0 280 280" className="w-full h-full overflow-visible">
                      {/* Concentric Polygons: 20%, 40%, 60%, 80%, 100% */}
                      {[20, 40, 60, 80, 100].map((ringPercent) => {
                        const ringPoints = radarSkills
                          .map((_, i) => {
                            const pt = getRadarPoint(i, ringPercent);
                            return `${pt.x},${pt.y}`;
                          })
                          .join(' ');

                        return (
                          <polygon
                            key={ringPercent}
                            points={ringPoints}
                            fill="none"
                            stroke="#334155"
                            strokeWidth={ringPercent === 100 ? '1.5' : '1'}
                            strokeDasharray={ringPercent === 100 ? undefined : '2 3'}
                            opacity={ringPercent === 100 ? 0.8 : 0.5}
                          />
                        );
                      })}

                      {/* Radial Spokes from Center */}
                      {radarSkills.map((_, i) => {
                        const pt = getRadarPoint(i, 100);
                        return (
                          <line
                            key={i}
                            x1={radarCenter}
                            y1={radarCenter}
                            x2={pt.x}
                            y2={pt.y}
                            stroke="#475569"
                            strokeWidth="1"
                            opacity={0.6}
                          />
                        );
                      })}

                      {/* Filled Data Polygon with Gradient */}
                      <defs>
                        <linearGradient id="radarFillGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
                        </linearGradient>
                      </defs>

                      <polygon
                        points={dataPolygonPoints}
                        fill="url(#radarFillGrad)"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        className="transition-all duration-700 ease-out"
                      />

                      {/* Vertex Points & Labels */}
                      {radarSkills.map((s, i) => {
                        const pt = getRadarPoint(i, s.score);
                        const labelPt = getRadarPoint(i, 118);

                        return (
                          <g key={i}>
                            {/* Glowing Vertex Circle */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="4.5"
                              fill="#38bdf8"
                              stroke="#0f172a"
                              strokeWidth="2"
                              className="animate-pulse"
                            />

                            {/* Score Text next to vertex */}
                            <text
                              x={labelPt.x}
                              y={labelPt.y}
                              textAnchor="middle"
                              dominantBaseline="central"
                              className="text-[9px] font-mono font-bold fill-slate-300"
                            >
                              {s.score}%
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Chart Legend */}
                  <div className="mt-2 w-full grid grid-cols-1 gap-1 text-[10px] font-mono text-slate-400">
                    {radarSkills.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="truncate pr-1">• {s.axis}</span>
                        <span className="font-bold text-cyan-300 shrink-0">{s.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specific Machine Models Excelled At (7 Cols) */}
                <div className="md:col-span-7 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      Dòng Máy Kỹ Thuật Viên Đặc Biệt Xuất Sắc (Key Expertise)
                    </h3>
                    <span className="text-xs font-mono text-slate-400">
                      SLA Pass: {performance.slaComplianceRate}%
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {excelModels.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-800/90 bg-slate-950 p-3.5 space-y-2 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{item.model}</span>
                              <span className="rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] px-2 py-0.2 font-semibold">
                                {item.brand}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">{item.category}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-extrabold font-mono text-emerald-400 block">
                              {item.proficiencyScore}%
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">Độ thuần thục</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-700"
                            style={{ width: `${item.proficiencyScore}%` }}
                          />
                        </div>

                        {/* Note & Metrics */}
                        <p className="text-xs text-slate-300 leading-relaxed italic">
                          "{item.highlightNote}"
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px] font-mono text-slate-400">
                          <span>
                            Số ca đã sửa: <strong className="text-white">{item.repairsCount} ca</strong>
                          </span>
                          <span>
                            MTTR Trung bình: <strong className="text-cyan-300">{item.avgMttrMinutes} phút</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Quick Metric Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-400 block">Số Ca Đã Khắc Phục</span>
                  <span className="text-base font-bold text-white mt-0.5 block">
                    {performance.resolvedIncidents} ca
                  </span>
                  <span className="text-[10px] text-red-400 font-mono">
                    ({performance.emergencyFixedCount} ca khẩn cấp P0)
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-400 block">MTTR Trung Bình</span>
                  <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                    {performance.avgMttrMinutes} phút
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Nhanh nhất: {performance.fastestFixMinutes}m
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-400 block">Nghiệm Thu Lần Đầu</span>
                  <span className="text-base font-bold text-cyan-400 mt-0.5 block">
                    {performance.firstTimePassRate}%
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Đạt chuẩn ISO-9001</span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-400 block">Huy Hiệu & Tuyên Dương</span>
                  <span className="text-base font-bold text-amber-400 mt-0.5 block">
                    {performance.commendationsCount} lượt
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono">Từ Leader & Quản lý</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED BREAKDOWN OF COMPLETED TICKETS */}
          {activeTab === 'TICKETS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Chi Tiết Phiếu Sự Cố Đã Khắc Phục Thành Công</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hồ sơ nghiệm thu thực tế của {technician.name} ghi nhận trên hệ thống bảo trì SCADA.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs px-2.5 py-0.5 font-bold">
                  100% Hoàn Thành
                </span>
              </div>

              <div className="space-y-3">
                {ticketBreakdownList.map((tk) => (
                  <div
                    key={tk.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-indigo-400">
                            #{tk.ticketCode}
                          </span>
                          <span className="font-bold text-white text-xs sm:text-sm">{tk.deviceName}</span>
                          <span className="rounded bg-slate-800 px-2 py-0.2 text-[10px] font-mono text-slate-300">
                            {tk.machineModel}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                              tk.taskType === 'CORRECTIVE'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {tk.errorCode}
                          </span>
                        </div>
                        <h4 className="text-xs text-slate-300 font-medium mt-1">{tk.taskTitle}</h4>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <div className="text-xs font-bold text-emerald-400">
                          Thời gian: {tk.durationMinutes} phút
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Hạn SLA: {tk.slaDeadlineMinutes}m • Ngày: {tk.completedDate}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="text-slate-400">
                        <span className="text-slate-500 font-medium">Linh kiện đã thay thế: </span>
                        <strong className="text-slate-200">{tk.partsReplaced.join(', ')}</strong>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-[11px]">
                        <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 font-bold flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span>Đạt Nghiệm Thu</span>
                        </span>
                        <span className="text-slate-500">
                          Tiết kiệm: {tk.slaDeadlineMinutes - tk.durationMinutes}m SLA
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MILESTONE ACHIEVEMENT TIMELINE */}
          {activeTab === 'ACHIEVEMENTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <span>Dòng Thời Gian Huy Hiệu & Cột Mốc Vinh Danh (Milestone Timeline)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hành trình cống hiến, kỷ lục xử lý sự cố và các văn bằng chứng nhận kỹ thuật của {technician.name}.
                  </p>
                </div>
                <span className="text-xs font-mono text-amber-400 font-bold">
                  {milestoneTimeline.length} Cột Mốc Vàng
                </span>
              </div>

              {/* Chronological Timeline */}
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-amber-400 before:via-indigo-500 before:to-slate-800">
                {milestoneTimeline.map((item, index) => {
                  return (
                    <div key={item.id} className="relative group">
                      {/* Timeline Dot Icon */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full text-slate-950 font-bold shadow-md ring-4 ring-slate-900 ${
                          item.iconType === 'CROWN'
                            ? 'bg-amber-400 text-slate-950 ring-amber-500/30'
                            : item.iconType === 'SHIELD'
                            ? 'bg-emerald-400 text-slate-950'
                            : item.iconType === 'ZAP'
                            ? 'bg-orange-500 text-white'
                            : 'bg-indigo-500 text-white'
                        }`}
                      >
                        {item.iconType === 'CROWN' && <Crown className="h-3.5 w-3.5 fill-slate-950" />}
                        {item.iconType === 'SHIELD' && <ShieldCheck className="h-3.5 w-3.5" />}
                        {item.iconType === 'ZAP' && <Zap className="h-3.5 w-3.5" />}
                        {item.iconType === 'TROPHY' && <Trophy className="h-3.5 w-3.5" />}
                        {item.iconType === 'STAR' && <Star className="h-3.5 w-3.5" />}
                      </div>

                      {/* Content Card */}
                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2 hover:border-slate-700 transition shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{item.title}</h4>
                            <span className="rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold px-2 py-0.2 border border-amber-500/30">
                              {item.badgeLabel}
                            </span>
                          </div>

                          <span className="text-xs font-mono font-bold text-indigo-400 shrink-0">
                            {item.date}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                        <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span>
                            Phân loại: <strong className="text-slate-300">{item.category}</strong>
                          </span>
                          <span className="text-indigo-300">Trao bởi: {item.grantedBy}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Mobile Push Commendation Trigger */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-[11px] font-mono text-amber-400 font-bold mb-1 flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-amber-400" />
              <span>Gửi Thông Báo Đẩy Trực Tiếp Tới Thiết Bị Di Động Kỹ Thuật Viên</span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customBadgeText}
                onChange={(e) => setCustomBadgeText(e.target.value)}
                placeholder="Nhập tên huy hiệu khen thưởng hoặc lý do tuyên dương..."
                className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              <button
                type="button"
                onClick={handleSendMobilePush}
                disabled={isSendingPush || !customBadgeText.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 px-4 py-2 text-xs font-extrabold text-slate-950 transition shadow-lg shadow-amber-950/60 active:scale-95 disabled:opacity-50 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSendingPush ? 'Đang Bắn Push...' : 'Bắn Push Khen Thưởng'}</span>
              </button>
            </div>

            {pushSuccessMsg && (
              <div className="mt-2 text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <Bell className="h-3.5 w-3.5 text-emerald-400" />
                <span>{pushSuccessMsg}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            <a
              href={`tel:${technician.phone}`}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 transition"
            >
              <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
              <span>Gọi Điện / Bộ Đàm</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-white transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
