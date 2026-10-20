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
import { Device, FactoryStats, Technician } from '../../types';
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

interface ExecutiveApprovalItem {
  id: string;
  type: 'CAPEX_PURCHASE' | 'MAINTENANCE_DOWNTIME' | 'SPECIAL_SHIFT';
  title: string;
  requestedBy: string;
  amountUSD?: number;
  downtimeHours?: number;
  urgency: 'HIGH' | 'MEDIUM';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: string;
}

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
  // Executive Approvals State
  const [approvals, setApprovals] = useState<ExecutiveApprovalItem[]>([
    {
      id: 'app-01',
      type: 'CAPEX_PURCHASE',
      title: 'Duyệt mua khẩn cấp 10 lõi lọc áp lực 3µm & 4 cặp tiếp điện Carbide Sodick/Makino',
      requestedBy: 'Trần Minh Tuấn (Leader EQM)',
      amountUSD: 1420,
      urgency: 'HIGH',
      status: 'PENDING',
      timestamp: '18:15 hôm nay',
    },
    {
      id: 'app-02',
      type: 'MAINTENANCE_DOWNTIME',
      title: 'Kế hoạch bảo trì phòng ngừa 250h & căn chỉnh laser trục Z máy Makino U6 Chủ Nhật',
      requestedBy: 'Nguyễn Văn Hùng (Kỹ sư Trưởng)',
      downtimeHours: 2.5,
      urgency: 'MEDIUM',
      status: 'PENDING',
      timestamp: '16:30 hôm nay',
    },
  ]);

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

  const handleApprove = (id: string, title: string) => {
    soundManager.playSuccessChime();
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'APPROVED' } : item))
    );
    setApprovedToast(`Đã ký duyệt: ${title}`);
    setTimeout(() => setApprovedToast(null), 3000);
  };

  const handleReject = (id: string) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'REJECTED' } : item))
    );
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
                <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Yêu cầu bởi: {app.requestedBy}</span>
                  <span>•</span>
                  <span>{app.timestamp}</span>
                </div>

                {app.status === 'PENDING' ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(app.id, app.title)}
                      className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-1.5 text-xs font-bold text-white transition flex items-center justify-center gap-1 shadow-md shadow-emerald-900/30"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Ký Duyệt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(app.id)}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
                    >
                      Từ Chối
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] font-bold text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Đã phê duyệt điện tử</span>
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
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Khu Vực Phê Duyệt Của Giám Đốc</span>
              </h3>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
                {approvals.filter((a) => a.status === 'PENDING').length} Chờ Duyệt
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {approvals.map((app) => (
                <div
                  key={app.id}
                  className={`rounded-xl border p-3.5 text-xs transition ${
                    app.status === 'APPROVED'
                      ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
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

                  <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{app.requestedBy}</span>
                    <span>•</span>
                    <span>{app.timestamp}</span>
                  </div>

                  {app.status === 'PENDING' ? (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(app.id, app.title)}
                        className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-2 text-xs font-bold text-white transition flex items-center justify-center gap-1 shadow-md shadow-emerald-950/40"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Ký Duyệt Ngay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(app.id)}
                        className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white transition"
                      >
                        Từ Chối
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Đã hoàn tất ký số điện tử</span>
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
    </div>
  );
};
