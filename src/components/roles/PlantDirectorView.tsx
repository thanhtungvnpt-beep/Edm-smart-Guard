import React, { useState, useMemo } from 'react';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  FileText,
  PhoneCall,
  Sparkles,
  Download,
  ShieldCheck,
  ChevronRight,
  Activity,
  Layers,
  Award,
  Zap,
  Calendar,
  Eye,
  Check,
  X,
  Send,
  PieChart as PieIcon,
  BarChart3,
  Wrench,
} from 'lucide-react';
import { Device, FactoryStats, Technician, ExecutiveAIProposal } from '../../types';
import { soundManager } from '../../utils/audio';

interface PlantDirectorViewProps {
  devices: Device[];
  technicians: Technician[];
  stats: FactoryStats | null;
  currentPlant: string;
  viewportMode: 'PC' | 'MOBILE';
  onOpenDeviceDetails: (device: Device) => void;
  onOpenDiagnosis: (device: Device) => void;
  onOpenWeeklyReport?: () => void;
}

const INITIAL_PROPOSALS: ExecutiveAIProposal[] = [
  {
    id: 'app-01',
    type: 'CAPEX_PURCHASE',
    title: 'Duyệt mua khẩn cấp 10 lõi lọc áp lực 3µm & 4 cặp tiếp điện Carbide Sodick/Makino',
    targetDeviceCode: 'EDM-W01',
    requestedBy: 'Trần Minh Tuấn (Leader EQM)',
    amountUSD: 1420,
    urgency: 'HIGH',
    confidenceScore: 94,
    aiEvidenceSummary: 'Áp lực bơm xả Dielectric tụt dốc 35% trong 3 ca liên tiếp. Đã phát hiện 14 lần chớp hồ quang thứ cấp trên phôi khuôn SKD11 do cặn xỉ thoát chậm.',
    riskHypothesis: 'Nếu trì hoãn quá 24 giờ: Nguy cơ đứt dây phôi khuôn giá trị cao ($18,000) và cháy tấm dẫn hướng trên.',
    alternativeOptions: [
      'Giảm 30% tốc độ cắt và dừng gia công chi tiết dung sai < 0.005mm',
      'Chuyển phôi gấp sang máy Makino U6 số 2 phân xưởng B',
    ],
    missingDataNotes: 'Đã xác minh số đo áp suất thực tế 1.4 Bar và kiểm tra kho linh kiện hiện đã hết màng lọc 3µm.',
    status: 'PENDING',
    timestamp: '18:15 hôm nay',
  },
  {
    id: 'app-02',
    type: 'MAINTENANCE_DOWNTIME',
    title: 'Kế hoạch bảo trì phòng ngừa 250h & căn chỉnh laser trục Z máy Makino U6 Chủ Nhật',
    targetDeviceCode: 'EDM-W02',
    requestedBy: 'Nguyễn Văn Hùng (Kỹ sư Trưởng)',
    downtimeHours: 2.5,
    urgency: 'MEDIUM',
    confidenceScore: 91,
    aiEvidenceSummary: 'Biên độ rung động trục chính đạt 3.4 mm/s (tiệm cận ngưỡng báo động 3.5 mm/s). Sai lệch bước vitme bi trục Z sau 248 giờ vận hành đo được 0.0035mm.',
    riskHypothesis: 'Gây sai lệch dung sai độ sâu rãnh khuôn ép nhựa và tăng độ nhám bề mặt vượt Ra 0.8µm.',
    alternativeOptions: [
      'Bảo trì trong ca đêm thứ Bảy để không ảnh hưởng sản lượng ban ngày',
      'Chạy phôi thô không yêu cầu bề mặt bóng gương',
    ],
    status: 'PENDING',
    timestamp: '16:30 hôm nay',
  },
  {
    id: 'app-03',
    type: 'PARAMETER_OVERRIDE',
    title: 'Hiệu chỉnh xung T_OFF (32µs -> 38µs) & Tăng áp xối phụ cho máy Sodick ALC600G',
    targetDeviceCode: 'EDM-W03',
    requestedBy: 'AI Copilot System',
    urgency: 'MEDIUM',
    confidenceScore: 88,
    aiEvidenceSummary: 'Dung môi làm mát đang dao động quanh 24.3°C. Tăng thời gian nghỉ T_OFF thêm 6µs sẽ hạ nhiệt khe hở phóng điện 1.8°C mà chỉ giảm 4% tốc độ cắt.',
    riskHypothesis: 'Nếu không điều chỉnh, nhiệt độ Chiller tiếp tục chạm ngưỡng ngắt an toàn 25°C làm dừng máy.',
    alternativeOptions: [
      'Vệ sinh gấp giàn giải nhiệt Chiller trong 15 phút nghỉ giữa ca',
    ],
    status: 'PENDING',
    timestamp: '15:10 hôm nay',
  },
];

export const PlantDirectorView: React.FC<PlantDirectorViewProps> = ({
  devices,
  technicians,
  stats,
  currentPlant,
  viewportMode,
  onOpenDeviceDetails,
  onOpenDiagnosis,
  onOpenWeeklyReport,
}) => {
  // Executive Approvals State (Human in the loop - MGR-03)
  const [approvals, setApprovals] = useState<ExecutiveAIProposal[]>(INITIAL_PROPOSALS);
  const [selectedProposal, setSelectedProposal] = useState<ExecutiveAIProposal | null>(null);
  const [decisionReason, setDecisionReason] = useState<string>('');
  const [delegateTechId, setDelegateTechId] = useState<string>('tech-01');
  const [showAuditTrailModal, setShowAuditTrailModal] = useState<boolean>(false);
  const [approvedToast, setApprovedToast] = useState<string | null>(null);

  // Compute Plant Executive Metrics
  const alarmDevices = useMemo(() => devices.filter((d) => d.status === 'ALARM_STOPPED'), [devices]);
  const runningDevices = useMemo(() => devices.filter((d) => d.status === 'RUNNING'), [devices]);
  const maintenanceDevices = useMemo(() => devices.filter((d) => d.status === 'MAINTENANCE'), [devices]);

  const totalOee = useMemo(() => {
    if (devices.length === 0) return 88.5;
    const sum = devices.reduce((acc, d) => acc + (d.telemetry?.oee || 85), 0);
    return Math.round((sum / devices.length) * 10) / 10;
  }, [devices]);

  const availabilityRate = useMemo(() => {
    if (devices.length === 0) return 94.2;
    return Math.round(((devices.length - alarmDevices.length) / devices.length) * 1000) / 10;
  }, [devices, alarmDevices]);

  // Executive Downtime Financial Impact: $120/hour per EDM machine stoppage
  const downtimeHoursThisMonth = 14.8;
  const estimatedDowntimeCost = Math.round(downtimeHoursThisMonth * 125);
  const costSavingsByAI = 4250;

  // Human-in-the-Loop Approval Action (MGR-03)
  const handleApproveProposal = (proposal: ExecutiveAIProposal) => {
    soundManager.playSuccessChime();
    const updated: ExecutiveAIProposal = {
      ...proposal,
      status: 'APPROVED',
      auditTrail: {
        actionBy: 'Lê Đức Trọng (Giám Đốc Kỹ Thuật Nhà Máy)',
        actionAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' hôm nay',
        decisionReason: decisionReason.trim() || 'Phê duyệt dựa trên khuyến nghị đầy đủ bằng chứng của AI Copilot và xác nhận hiện trường.',
        delegatedTo: delegateTechId ? technicians.find((t) => t.id === delegateTechId)?.name : undefined,
      },
    };

    setApprovals((prev) => prev.map((p) => (p.id === proposal.id ? updated : p)));
    setSelectedProposal(null);
    setDecisionReason('');
    setApprovedToast(`Đã ký duyệt có ghi vết quyết định: "${proposal.title}"`);
    setTimeout(() => setApprovedToast(null), 3500);
  };

  const handleRejectProposal = (proposal: ExecutiveAIProposal) => {
    soundManager.playBeep();
    const updated: ExecutiveAIProposal = {
      ...proposal,
      status: 'REJECTED',
      auditTrail: {
        actionBy: 'Lê Đức Trọng (Giám Đốc Kỹ Thuật Nhà Máy)',
        actionAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' hôm nay',
        decisionReason: decisionReason.trim() || 'Từ chối: Chưa đủ căn cứ dừng máy trong giờ cao điểm đơn hàng.',
      },
    };

    setApprovals((prev) => prev.map((p) => (p.id === proposal.id ? updated : p)));
    setSelectedProposal(null);
    setDecisionReason('');
    setApprovedToast(`Đã từ chối đề xuất: "${proposal.title}"`);
    setTimeout(() => setApprovedToast(null), 3500);
  };

  const handleRequestMoreInfo = (proposal: ExecutiveAIProposal) => {
    soundManager.playBeep();
    const updated: ExecutiveAIProposal = {
      ...proposal,
      status: 'REQUEST_MORE_INFO',
      auditTrail: {
        actionBy: 'Lê Đức Trọng (Giám Đốc Kỹ Thuật Nhà Máy)',
        actionAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' hôm nay',
        decisionReason: decisionReason.trim() || 'Yêu cầu Kíp Trưởng đo kiểm lại độ mòn thực tế trước khi đặt mua mới.',
      },
    };

    setApprovals((prev) => prev.map((p) => (p.id === proposal.id ? updated : p)));
    setSelectedProposal(null);
    setDecisionReason('');
    setApprovedToast(`Đã gửi yêu cầu bổ sung số liệu: "${proposal.title}"`);
    setTimeout(() => setApprovedToast(null), 3500);
  };

  // Workshop Grouping for Executive View
  const workshops = [
    {
      id: 'ws-a',
      name: 'Phân Xưởng A - Cắt Dây CNC Công Suất Cao',
      location: 'Khu A (Nhà Xưởng Phía Đông)',
      totalMachines: 6,
      runningCount: runningDevices.length > 2 ? runningDevices.length - 1 : 4,
      alarmCount: alarmDevices.length > 0 ? 1 : 0,
      oee: 89.2,
      leader: 'Trần Minh Tuấn (Leader EQM)',
      keyOrder: 'Đơn hàng khuôn vỏ điện thoại Flagship 2026',
    },
    {
      id: 'ws-b',
      name: 'Phân Xưởng B - Bắn Điện Xung Chìm EDM (Sinker)',
      location: 'Khu B (Nhà Xưởng Trung Tâm)',
      totalMachines: 4,
      runningCount: 4,
      alarmCount: 0,
      oee: 92.4,
      leader: 'Nguyễn Văn Hùng (Kỹ sư Trưởng)',
      keyOrder: 'Lòng khuôn lốp ô tô & chi tiết y tế PEEK',
    },
    {
      id: 'ws-c',
      name: 'Phân Xưởng C - Gia Công Khuôn Mẫu Vi Sai Micro',
      location: 'Khu C (Phòng Sạch Cấp 10,000)',
      totalMachines: 2,
      runningCount: 1,
      alarmCount: 0,
      oee: 86.8,
      leader: 'Lê Hoàng Nam (Chuyên gia Cắt Dây)',
      keyOrder: 'Cắt dây điện cực vi hình Micro R0.08mm',
    },
  ];

  /* ------------------------------------------------------------- */
  /* RENDER 1: MOBILE VIEW (POCKET EXECUTIVE COMPANION)           */
  /* ------------------------------------------------------------- */
  if (viewportMode === 'MOBILE') {
    return (
      <div className="mx-auto max-w-md p-3 sm:p-4 space-y-4">
        {/* Mobile Executive Header Bar */}
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-950 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Bảng Điều Hành Bỏ Túi (Mobile)
                </span>
                <h2 className="text-sm font-bold text-white">Giám Đốc Nhà Máy</h2>
              </div>
            </div>

            <div className="text-right">
              <span className="block text-xs font-mono font-bold text-emerald-400">
                OEE {totalOee}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Khả dụng: {availabilityRate}%</span>
            </div>
          </div>

          {/* Health Score Pill */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-950/80 border border-slate-800 p-2.5">
            <span className="text-xs text-slate-300">Điểm Sức Khỏe Nhà Máy:</span>
            <div className="flex items-center gap-1.5 font-bold font-mono text-emerald-400 text-xs">
              <ShieldCheck className="h-4 w-4" />
              <span>94 / 100 (RẤT TỐT)</span>
            </div>
          </div>
        </div>

        {/* Urgent Plant Alert Card if any device is in ALARM */}
        {alarmDevices.length > 0 ? (
          <div className="rounded-2xl border border-red-500/80 bg-red-950/30 p-4 shadow-lg ring-1 ring-red-500/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-red-300">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
                CẢNH BÁO DỪNG MÁY KHẨN CẤP ({alarmDevices.length})
              </span>
              <span className="font-mono text-[10px] bg-red-500/30 px-2 py-0.5 rounded text-red-200">
                Ưu tiên P0
              </span>
            </div>

            {alarmDevices.map((d) => (
              <div key={d.id} className="rounded-xl bg-slate-950/80 border border-red-500/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{d.code} - {d.name}</span>
                  <span className="font-mono text-xs text-red-400 font-bold">
                    {d.activeIncident?.errorCode || 'E-102'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                  {d.activeIncident?.errorTitle || 'Sự cố tụt áp béc xả cao áp & đứt dây'}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenDiagnosis(d)}
                    className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2 text-xs font-bold text-white text-center transition"
                  >
                    Xem AI Chẩn Đoán
                  </button>

                  <a
                    href="tel:0912876543"
                    className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-emerald-400 border border-slate-700 transition"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>Gọi EQM</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>Toàn bộ 12 máy cắt dây & bắn điện đang hoạt động ổn định, không có dừng khẩn!</span>
          </div>
        )}

        {/* Mobile Fast Executive Sign-off Approvals */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Hàng Đợi Ký Duyệt Cấp Giám Đốc</span>
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono text-amber-300">
                {approvals.filter((a) => a.status === 'PENDING').length}
              </span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">1-Tap Fast Approval</span>
          </div>

          <div className="space-y-2.5">
            {approvals.map((app) => (
              <div
                key={app.id}
                className={`rounded-xl border p-3 text-xs transition ${
                  app.status === 'APPROVED'
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                    : app.status === 'REJECTED'
                    ? 'border-red-500/40 bg-red-950/20 text-red-300'
                    : 'border-slate-800 bg-slate-950 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-white leading-snug">{app.title}</div>
                  {app.amountUSD && (
                    <span className="font-mono font-bold text-amber-400 shrink-0">
                      ${app.amountUSD}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-2 flex-wrap text-[10px]">
                  <span className="rounded bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 font-mono">
                    AI Tin Cậy: {app.confidenceScore}%
                  </span>
                  {app.targetDeviceCode && (
                    <span className="rounded bg-slate-800 text-slate-300 px-1.5 py-0.2 font-mono">
                      {app.targetDeviceCode}
                    </span>
                  )}
                  <span className="text-slate-400">{app.timestamp}</span>
                </div>

                <p className="mt-1.5 text-[11px] text-slate-400 line-clamp-2 italic">
                  &quot;{app.aiEvidenceSummary}&quot;
                </p>

                {app.status === 'PENDING' ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProposal(app)}
                      className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-1.5 text-xs font-bold text-white transition flex items-center justify-center gap-1 shadow-md shadow-indigo-900/30"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>Xem Bằng Chứng & Ký Duyệt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectProposal(app)}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition"
                    >
                      Từ Chối
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] font-bold text-emerald-400 flex items-center justify-between font-mono">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{app.status === 'APPROVED' ? 'Đã phê duyệt điện tử' : 'Đã từ chối'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedProposal(app)}
                      className="text-xs text-indigo-400 underline"
                    >
                      Lưu vết
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Executive Summary Financials */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <span className="text-[10px] text-slate-400 block">Downtime Cost Tháng Này</span>
            <div className="text-base font-bold font-mono text-amber-400 mt-1">
              ${estimatedDowntimeCost}
            </div>
            <span className="text-[10px] text-emerald-400 mt-0.5 block font-mono">
              -18% so với tháng trước
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <span className="text-[10px] text-slate-400 block">Tiết Kiệm Nhờ AI Dự Báo</span>
            <div className="text-base font-bold font-mono text-emerald-400 mt-1">
              +${costSavingsByAI}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
              Tránh đứt dây chuyền
            </span>
          </div>
        </div>

        {/* 1-Tap Call to Key Leaders */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 space-y-2">
          <span className="text-xs font-bold text-slate-300 block">Liên Hệ Nhanh Kíp Trực Ca</span>
          <div className="space-y-1.5">
            {technicians.slice(0, 2).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-slate-950 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <img src={t.avatar} alt={t.name} className="h-7 w-7 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold text-white">{t.name}</div>
                    <div className="text-[10px] text-slate-400">{t.role}</div>
                  </div>
                </div>

                <a
                  href={`tel:${t.phone}`}
                  className="rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 p-2 hover:bg-emerald-600/30 transition"
                  title="Gọi ngay"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Weekly Executive Report Quick Action */}
        {onOpenWeeklyReport && (
          <button
            type="button"
            onClick={onOpenWeeklyReport}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 p-3 text-xs font-bold text-indigo-200 transition shadow-sm"
          >
            <FileText className="h-4 w-4 text-indigo-400" />
            <span>Xem Báo Cáo Điều Hành & Sự Cố Tuần (PDF/Email)</span>
          </button>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* RENDER 2: PC DESKTOP VIEW (EXECUTIVE COMMAND CENTER)          */
  /* ------------------------------------------------------------- */
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Executive Top Briefing Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/20 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-950/50">
              <Building2 className="h-7 w-7" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Trung Tâm Điều Hành Ban Giám Đốc Nhà Máy
                </h2>
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-300">
                  Executive Suite 2026
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-mono text-emerald-300 flex items-center gap-1">
                  <Activity className="h-3 w-3 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Giám sát bức tranh toàn cảnh hiệu suất tổng thể thiết bị (OEE), chỉ số tin cậy máy móc (MTBF/MTTR),
                ước tính tổn thất dừng máy và phê duyệt kế hoạch bảo dưỡng định kỳ & vật tư khẩn cấp.
              </p>
            </div>
          </div>

          {/* Quick PDF Report Export & Actions */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
            {onOpenWeeklyReport && (
              <button
                type="button"
                onClick={onOpenWeeklyReport}
                className="flex items-center gap-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 px-3.5 py-2.5 text-xs font-bold text-indigo-200 transition shadow-sm"
              >
                <FileText className="h-4 w-4 text-indigo-400" />
                <span>Báo Cáo Sự Cố Tuần</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundManager.playSuccessChime();
                alert('Đang trích xuất báo cáo tổng quan Ban Giám Đốc định dạng Executive PDF...');
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-orange-950/40 transition active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Xuất Báo Cáo Điều Hành</span>
            </button>
          </div>
        </div>

        {approvedToast && (
          <div className="mt-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 p-2.5 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{approvedToast}</span>
          </div>
        )}
      </div>

      {/* 2. Executive 5-Pillar KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: OEE */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">OEE Toàn Xưởng</span>
            <Gauge className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
            {totalOee}%
          </div>
          <div className="mt-1 text-[11px] text-slate-300 flex items-center gap-1 font-mono">
            <span className="text-emerald-400 font-bold">▲ +2.4%</span>
            <span>vs mục tiêu (85%)</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-400" style={{ width: `${totalOee}%` }} />
          </div>
        </div>

        {/* KPI 2: Machine Availability */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Độ Khả Dụng (Availability)</span>
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
            {availabilityRate}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            {runningDevices.length}/{devices.length} máy đang gia công
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${availabilityRate}%` }} />
          </div>
        </div>

        {/* KPI 3: Downtime Financial Impact */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Chi Phí Dừng Máy Tháng</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">
            ${estimatedDowntimeCost}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            <span>Giảm $1,800 so kỳ trước</span>
          </div>
        </div>

        {/* KPI 4: MTBF (Mean Time Between Failures) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Chỉ Số MTBF (Độ Bền)</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-300">
            176 <span className="text-xs font-normal text-slate-400">giờ</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Chu kỳ chạy ổn định TB
          </div>
        </div>

        {/* KPI 5: MTTR (Mean Time To Repair) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Chỉ Số MTTR (Tốc Độ)</span>
            <Wrench className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-300">
            25.4 <span className="text-xs font-normal text-slate-400">phút</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-mono">
            Nhanh hơn 35% nhờ AI SOP
          </div>
        </div>
      </div>

      {/* 3. Multi-Workshop Comparative Matrix & Executive Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 2 Columns - Workshops Comparative Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-400" />
                  <span>Tình Trạng Năng Suất & Sức Khỏe Các Phân Xưởng</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đánh giá phân luồng theo 3 xưởng gia công chuyên biệt
                </p>
              </div>

              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-mono text-slate-300">
                Tổng 12 Máy EDM
              </span>
            </div>

            <div className="divide-y divide-slate-800 mt-2">
              {workshops.map((ws) => (
                <div key={ws.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{ws.name}</h4>
                      {ws.alarmCount > 0 ? (
                        <span className="rounded bg-red-500/20 border border-red-500/40 px-2 py-0.2 text-[10px] font-bold text-red-300 font-mono">
                          1 Máy Dừng
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.2 text-[10px] font-bold text-emerald-300 font-mono">
                          100% Hoạt Động
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{ws.location}</span>
                      <span>•</span>
                      <span>Kỹ sư trưởng: <strong className="text-slate-300">{ws.leader}</strong></span>
                    </div>
                    <div className="text-xs text-indigo-300 font-mono">
                      Đơn hàng trọng điểm: <strong>{ws.keyOrder}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">OEE Phân Xưởng</div>
                      <div className="text-lg font-bold font-mono text-emerald-400">{ws.oee}%</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Máy Chạy</div>
                      <div className="text-sm font-bold font-mono text-white">
                        {ws.runningCount} / {ws.totalMachines}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic AI Predictive Risk Radar */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-slate-900 to-slate-950 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Radar Dự Báo Nguy Cơ Dừng Máy 7 Ngày Tới (AI Risk Radar)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cảnh báo gián đoạn sớm dựa trên telemetry rung động & chu kỳ hao mòn
                  </p>
                </div>
              </div>
              <span className="rounded bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-xs font-mono text-indigo-300">
                Độ nhạy AI 98.4%
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-950/80 border border-amber-500/30 p-3">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-1">
                  <span>Máy Cắt Dây Makino U6 (EDM-W01)</span>
                  <span className="font-mono text-red-400">Nguy cơ 68%</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Áp lực bơm xả có xu hướng tụt dốc vào cuối ca chạy. Đề xuất: Thay màng lọc 3µm trước ca chạy phôi lớn tối nay.
                </p>
              </div>

              <div className="rounded-xl bg-slate-950/80 border border-emerald-500/30 p-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300 mb-1">
                  <span>Máy Bắn Điện Makino EDAF3 (EDM-S01)</span>
                  <span className="font-mono text-emerald-400">Rủi ro Thấp (&lt;10%)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Đầu gá điện cực System 3R đạt độ đồng tâm hoàn hảo 0.001mm. Hệ thống dập lửa CO2 và dầu điện môi chuẩn 100%.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 1 Column - Executive Approval Gate & Plant Contacts */}
        <div className="space-y-4">
          {/* Executive Approval Gate */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Khu Vực Phê Duyệt Của Giám Đốc (MGR-03)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cơ chế Human-in-the-Loop: AI đề xuất & giải trình, Giám đốc ký duyệt
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAuditTrailModal(true)}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs text-indigo-300 font-semibold border border-slate-700 transition"
                  title="Xem lịch sử ký duyệt & lý do"
                >
                  Sổ Lưu Vết ({approvals.filter((a) => a.auditTrail).length})
                </button>
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
                  {approvals.filter((a) => a.status === 'PENDING').length} Chờ Duyệt
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {approvals.map((app) => (
                <div
                  key={app.id}
                  className={`rounded-xl border p-3.5 text-xs transition ${
                    app.status === 'APPROVED'
                      ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                      : app.status === 'REJECTED'
                      ? 'border-red-500/40 bg-red-950/20 text-red-300'
                      : 'border-slate-800 bg-slate-950 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-white leading-snug">{app.title}</span>
                    {app.amountUSD && (
                      <span className="font-mono font-bold text-amber-400 text-sm shrink-0">
                        ${app.amountUSD}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                    <span className="rounded bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 font-mono">
                      AI Tin Cậy {app.confidenceScore}%
                    </span>
                    {app.targetDeviceCode && (
                      <span className="rounded bg-slate-800 text-slate-300 px-1.5 py-0.2 font-mono">
                        {app.targetDeviceCode}
                      </span>
                    )}
                    <span>•</span>
                    <span>{app.requestedBy}</span>
                    <span>•</span>
                    <span>{app.timestamp}</span>
                  </div>

                  <p className="mt-1.5 text-[11px] text-slate-400 line-clamp-2 italic">
                    &quot;{app.aiEvidenceSummary}&quot;
                  </p>

                  {app.status === 'PENDING' ? (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProposal(app)}
                        className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 py-2 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950/40"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                        <span>Xem Bằng Chứng AI & Ký Duyệt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectProposal(app)}
                        className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white transition"
                      >
                        Từ Chối
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{app.status === 'APPROVED' ? 'Đã hoàn tất ký số điện tử' : 'Đã từ chối đề xuất'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedProposal(app)}
                        className="text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Xem vết ký
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Plant Leader Direct Contact Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <PhoneCall className="h-4 w-4 text-indigo-400" />
              <span>Đường Dây Nóng Kíp Trưởng Ca Trực</span>
            </h3>

            <div className="mt-3 space-y-2.5">
              {technicians.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl bg-slate-950 p-3 text-xs border border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <img src={t.avatar} alt={t.name} className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-700" />
                    <div>
                      <div className="font-bold text-white">{t.name}</div>
                      <div className="text-[11px] text-slate-400">{t.role}</div>
                    </div>
                  </div>

                  <a
                    href={`tel:${t.phone}`}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 text-xs font-medium hover:bg-emerald-600/30 transition"
                  >
                    <PhoneCall className="h-3 w-3" />
                    <span>{t.phone}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: PROPOSAL REVIEW & HUMAN-IN-THE-LOOP APPROVAL (MGR-03) */}
      {/* ============================================================== */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 space-y-5 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Thẩm Định & Ký Duyệt Đề Xuất Của AI</h3>
                  <div className="text-xs text-slate-400">Quy trình Human in the Loop (MGR-03) • Mã: {selectedProposal.id}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Proposal Details Card */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white leading-snug">{selectedProposal.title}</h4>
                  <span className="rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 text-xs font-mono font-bold shrink-0">
                    AI Tin Cậy: {selectedProposal.confidenceScore}%
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-3">
                  <span>Yêu cầu bởi: <strong className="text-slate-200">{selectedProposal.requestedBy}</strong></span>
                  {selectedProposal.amountUSD && (
                    <span>• Chi phí dự kiến: <strong className="text-amber-400 font-mono">${selectedProposal.amountUSD}</strong></span>
                  )}
                  {selectedProposal.downtimeHours && (
                    <span>• Dừng máy: <strong className="text-amber-400 font-mono">{selectedProposal.downtimeHours} giờ</strong></span>
                  )}
                </div>
              </div>

              {/* 1. Bằng chứng AI & Cảm biến */}
              <div className="rounded-2xl bg-indigo-950/20 border border-indigo-500/30 p-4 space-y-2">
                <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span>1. Bằng Chứng Dữ Liệu & Chẩn Đoán AI (AI Evidence):</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedProposal.aiEvidenceSummary}
                </p>
              </div>

              {/* 2. Rủi ro nếu không duyệt */}
              <div className="rounded-2xl bg-red-950/20 border border-red-500/30 p-4 space-y-2">
                <div className="text-xs font-bold text-red-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span>2. Rủi Ro Dự Kiến Nếu Trì Hoãn Quyết Định (Risk Hypothesis):</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedProposal.riskHypothesis}
                </p>
              </div>

              {/* 3. Phương án thay thế */}
              {selectedProposal.alternativeOptions && (
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    3. Phương Án Thay Thế Nếu Không Ký Duyệt:
                  </div>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                    {selectedProposal.alternativeOptions.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Decision Input & Delegation Selector */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Lý Do Phê Duyệt / Chỉ Đạo Kỹ Thuật (Lưu vết Audit Log):
                  </label>
                  <textarea
                    rows={2}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Nhập ghi chú chỉ đạo kỹ thuật của Quản đốc..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Ủy Quyền & Giao Việc Xử Lý Trực Tiếp Cho Kíp Trưởng (MGR-02):
                  </label>
                  <select
                    value={delegateTechId}
                    onChange={(e) => setDelegateTechId(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.role} ({t.shift})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Historical Audit Trail if already decided */}
              {selectedProposal.auditTrail && (
                <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/40 p-3 text-xs space-y-1">
                  <div className="font-bold text-emerald-400">Đã Ghi Vết Quyết Định Điện Tử:</div>
                  <div className="text-slate-300">Người ký: <strong>{selectedProposal.auditTrail.actionBy}</strong></div>
                  <div className="text-slate-300">Thời gian: <strong>{selectedProposal.auditTrail.actionAt}</strong></div>
                  <div className="text-slate-300">Lý do: &quot;{selectedProposal.auditTrail.decisionReason}&quot;</div>
                  {selectedProposal.auditTrail.delegatedTo && (
                    <div className="text-indigo-300">Giao nhiệm vụ cho: <strong>{selectedProposal.auditTrail.delegatedTo}</strong></div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRequestMoreInfo(selectedProposal)}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-amber-300 border border-amber-500/30 transition"
                >
                  Yêu Cầu Bổ Sung
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectProposal(selectedProposal)}
                  className="rounded-xl bg-red-950/50 hover:bg-red-900 border border-red-500/40 px-3.5 py-2 text-xs font-bold text-red-300 transition"
                >
                  Từ Chối
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveProposal(selectedProposal)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition"
                >
                  <Check className="h-4 w-4" />
                  <span>Ký Duyệt Quyết Định</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: DECISION AUDIT TRAIL LOGS (MGR-03)                    */}
      {/* ============================================================== */}
      {showAuditTrailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Sổ Lưu Vết Quyết Định Ban Giám Đốc (Audit Trail)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditTrailModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {approvals.map((app) => (
                <div key={app.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{app.title}</span>
                    <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                      app.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                      app.status === 'REJECTED' ? 'bg-red-500/20 text-red-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  {app.auditTrail ? (
                    <div className="space-y-1 text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div>Người ký: <strong className="text-white">{app.auditTrail.actionBy}</strong></div>
                      <div>Thời điểm: <strong className="text-white">{app.auditTrail.actionAt}</strong></div>
                      <div>Lý do: &quot;{app.auditTrail.decisionReason}&quot;</div>
                      {app.auditTrail.delegatedTo && (
                        <div>Người tiếp nhận xử lý: <strong className="text-indigo-400">{app.auditTrail.delegatedTo}</strong></div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">Đang chờ Giám đốc xem xét & quyết định.</div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAuditTrailModal(false)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

