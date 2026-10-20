import React, { useState, useMemo } from 'react';
import {
  Users2,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  UserCheck,
  UserX,
  Package,
  Calendar,
  Sparkles,
  PhoneCall,
  Search,
  Check,
  X,
  ShieldAlert,
  Layers,
  ChevronRight,
  Flame,
  ArrowRight,
  RefreshCw,
  Bell,
  SlidersHorizontal,
  Bot,
  Trophy,
} from 'lucide-react';
import { Device, Technician } from '../../types';
import { soundManager } from '../../utils/audio';
import { TechnicianRepairLeaderboard } from './TechnicianRepairLeaderboard';

interface EqmLeaderViewProps {
  devices: Device[];
  technicians: Technician[];
  viewportMode: 'PC' | 'MOBILE';
  onOpenDiagnosis: (device: Device) => void;
  onOpenRepairReport: (device: Device) => void;
  onOpenDeviceDetails: (device: Device) => void;
  onOpenInventory?: (partIdOrSku: string) => void;
}

interface DispatchTicket {
  id: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  model: string;
  errorCode: string;
  errorTitle: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  reportedAt: string;
  slaDeadlineMinutes: number;
  assignedTechId?: string;
  assignedTechName?: string;
  assignedTechAvatar?: string;
  status: 'PENDING_DISPATCH' | 'IN_PROGRESS' | 'RESOLVED';
}

interface PartRequisitionRequest {
  id: string;
  partSku: string;
  partName: string;
  quantity: number;
  requestedBy: string;
  targetMachine: string;
  urgency: 'URGENT' | 'STANDARD';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const EqmLeaderView: React.FC<EqmLeaderViewProps> = ({
  devices,
  technicians,
  viewportMode,
  onOpenDiagnosis,
  onOpenRepairReport,
  onOpenDeviceDetails,
  onOpenInventory,
}) => {
  // Live Incident Tickets for EQM Dispatch
  const [tickets, setTickets] = useState<DispatchTicket[]>(() => {
    return [
      {
        id: 'tick-01',
        deviceId: 'dev-01',
        deviceCode: 'EDM-W01',
        deviceName: 'Máy Cắt Dây CNC Makino U6 H.E.A.T',
        model: 'Makino U6 H.E.A.T',
        errorCode: 'E-102',
        errorTitle: 'Đứt dây liên tục & tụt áp suất nước xả bồn cao áp',
        severity: 'CRITICAL',
        reportedAt: '18:42 hôm nay',
        slaDeadlineMinutes: 45,
        assignedTechId: 'tech-03',
        assignedTechName: 'Lê Hoàng Nam',
        assignedTechAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        status: 'IN_PROGRESS',
      },
      {
        id: 'tick-02',
        deviceId: 'dev-02',
        deviceCode: 'EDM-W02',
        deviceName: 'Máy Cắt Dây CNC Sodick ALC600G iGroove+',
        model: 'Sodick ALC600G',
        errorCode: 'ALARM-204',
        errorTitle: 'Cảnh báo màng rung cảm biến áp lực dầu S-104 bám muội',
        severity: 'HIGH',
        reportedAt: '19:10 hôm nay',
        slaDeadlineMinutes: 60,
        status: 'PENDING_DISPATCH',
      },
    ];
  });

  // Spare Parts Requisition Requests
  const [requisitions, setRequisitions] = useState<PartRequisitionRequest[]>([
    {
      id: 'req-01',
      partSku: 'FLT-EDM-300',
      partName: 'Lõi lọc áp lực 3µm máy cắt dây EDM',
      quantity: 2,
      requestedBy: 'Lê Hoàng Nam',
      targetMachine: 'EDM-W01 (Makino U6)',
      urgency: 'URGENT',
      status: 'PENDING',
    },
    {
      id: 'req-02',
      partSku: 'MK-U6-GD25',
      partName: 'Bạc cấp điện Carbide trên/dưới',
      quantity: 1,
      requestedBy: 'Nguyễn Văn Hùng',
      targetMachine: 'EDM-W02 (Sodick ALC)',
      urgency: 'STANDARD',
      status: 'PENDING',
    },
  ]);

  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastToast, setBroadcastToast] = useState<string | null>(null);
  const [selectedTechForDispatch, setSelectedTechForDispatch] = useState<string>('tech-01');

  // Handle Dispatch Assignment
  const handleAssignTicket = (ticketId: string, techId: string) => {
    soundManager.playSuccessChime();
    const tech = technicians.find((t) => t.id === techId);
    if (!tech) return;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              assignedTechId: tech.id,
              assignedTechName: tech.name,
              assignedTechAvatar: tech.avatar,
              status: 'IN_PROGRESS',
            }
          : t
      )
    );
  };

  // Handle Spare Part Approval
  const handleApproveRequisition = (id: string, partName: string) => {
    soundManager.playSuccessChime();
    setRequisitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r))
    );
    setBroadcastToast(`Đã duyệt xuất kho: ${partName}`);
    setTimeout(() => setBroadcastToast(null), 3000);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    soundManager.playEmergencyBroadcastChime();
    setBroadcastToast(`Đã phát thanh tới 4 KTV ca trực: "${broadcastText}"`);
    setBroadcastText('');
    setTimeout(() => setBroadcastToast(null), 3500);
  };

  // Technician Workload Summary
  const techWorkload = useMemo(() => {
    return technicians.map((t) => {
      const activeTaskCount = tickets.filter(
        (tick) => tick.assignedTechId === t.id && tick.status === 'IN_PROGRESS'
      ).length;
      return {
        ...t,
        activeTasks: activeTaskCount,
        proficiency: t.role.includes('Trưởng') ? 98 : t.role.includes('Chuyên gia') ? 95 : 88,
        statusLabel: activeTaskCount > 0 ? 'Đang Xử Lý' : 'Sẵn Sàng Tiếp Nhận',
      };
    });
  }, [technicians, tickets]);

  /* ------------------------------------------------------------- */
  /* RENDER 1: MOBILE VIEW (LEADER DISPATCH POCKET COMPANION)     */
  /* ------------------------------------------------------------- */
  if (viewportMode === 'MOBILE') {
    return (
      <div className="mx-auto max-w-md p-3 sm:p-4 space-y-4">
        {/* Mobile Header Banner */}
        <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-950 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400">
                <Users2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                  Bảng Điều Phối Hiện Trường (Mobile)
                </span>
                <h2 className="text-sm font-bold text-white">Leader EQM</h2>
              </div>
            </div>

            <div className="text-right">
              <span className="block text-xs font-mono font-bold text-blue-300">
                {techWorkload.filter((t) => t.activeTasks === 0).length} KTV Rảnh
              </span>
              <span className="text-[10px] text-slate-400 font-medium">SLA: 96.2%</span>
            </div>
          </div>
        </div>

        {/* Live Incident Dispatch Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-white px-1">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Lệnh Điều Phối Sự Cố Đang Mở ({tickets.length})
            </span>
          </div>

          {tickets.map((tick) => (
            <div
              key={tick.id}
              className={`rounded-2xl border p-4 space-y-3 shadow-lg ${
                tick.severity === 'CRITICAL'
                  ? 'border-red-500/60 bg-red-950/20'
                  : 'border-slate-800 bg-slate-900/90'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{tick.deviceCode}</span>
                    <span className="rounded bg-red-500/30 text-red-300 font-mono text-[10px] px-1.5 py-0.2 font-bold">
                      {tick.errorCode}
                    </span>
                  </div>
                  <h4 className="text-xs text-slate-200 font-medium mt-0.5 line-clamp-1">
                    {tick.deviceName}
                  </h4>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-amber-400 block">
                    SLA: {tick.slaDeadlineMinutes}p
                  </span>
                  <span className="text-[9px] text-slate-400">{tick.reportedAt}</span>
                </div>
              </div>

              {/* Assigned Technician or 1-Tap Assign */}
              {tick.assignedTechName ? (
                <div className="flex items-center justify-between rounded-xl bg-slate-950 p-2.5 text-xs border border-slate-800">
                  <div className="flex items-center gap-2">
                    <img
                      src={tick.assignedTechAvatar}
                      alt={tick.assignedTechName}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <span className="text-slate-200 font-medium">
                      KTV: <strong>{tick.assignedTechName}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    ĐANG XỬ LÝ
                  </span>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-950 p-2.5 border border-amber-500/40 space-y-2">
                  <span className="text-[11px] font-bold text-amber-300 block">
                    Chưa phân công KTV: Chọn KTV tiếp nhận
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {technicians.slice(0, 2).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleAssignTicket(tick.id, t.id)}
                        className="rounded-lg bg-blue-600 hover:bg-blue-500 p-2 text-xs font-bold text-white text-center transition"
                      >
                        Giao cho {t.name.split(' ').pop()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    const dev = devices.find((d) => d.id === tick.deviceId);
                    if (dev) onOpenDiagnosis(dev);
                  }}
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-slate-200 transition text-center"
                >
                  Mở Chẩn Đoán AI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dev = devices.find((d) => d.id === tick.deviceId);
                    if (dev) onOpenRepairReport(dev);
                  }}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-bold text-white transition text-center shadow-md shadow-emerald-900/30"
                >
                  Nghiệm Thu SOP
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Fast Spare Part Approvals */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Package className="h-4 w-4 text-purple-400" />
              <span>Duyệt Xuất Kho Phụ Tùng Khẩn</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">1-Tap Duyệt</span>
          </div>

          <div className="space-y-2">
            {requisitions.map((req) => (
              <div
                key={req.id}
                className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-white block">{req.partName}</span>
                    <span className="text-[10px] text-slate-400">
                      Cho máy: {req.targetMachine} • Số lượng: <strong>{req.quantity}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 font-bold">
                    {req.requestedBy}
                  </span>
                </div>

                {req.status === 'PENDING' ? (
                  <button
                    type="button"
                    onClick={() => handleApproveRequisition(req.id, req.partName)}
                    className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-1.5 text-xs font-bold text-white transition flex items-center justify-center gap-1 shadow-md shadow-emerald-900/30"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Duyệt Xuất Kho Ngay</span>
                  </button>
                ) : (
                  <div className="text-emerald-400 font-bold font-mono text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Đã cấp phát vật tư</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Shift Broadcast */}
        <form onSubmit={handleBroadcast} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1">
              <Bell className="h-3.5 w-3.5 text-amber-400" />
              <span>Phát Thông Báo Bộ Đàm Ca Trực</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder="VD: Anh Nam chuẩn bị đổi dây Makino ca đêm..."
              className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!broadcastText.trim()}
              className="rounded-xl bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-bold text-white transition disabled:opacity-50"
            >
              Phát
            </button>
          </div>
        </form>

        {broadcastToast && (
          <div className="rounded-xl bg-blue-950/80 border border-blue-500/40 p-2.5 text-xs text-blue-200">
            {broadcastToast}
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* RENDER 2: PC DESKTOP VIEW (EQM DISPATCH CONTROL BOARD)        */
  /* ------------------------------------------------------------- */
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* 1. EQM Leader Operational Banner */}
      <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/20 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/50">
              <Users2 className="h-7 w-7" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Bảng Điều Phối Thiết Bị & Kíp Trực Kỹ Thuật (EQM Leader Command)
                </h2>
                <span className="rounded-full bg-blue-500/20 border border-blue-500/40 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-300">
                  Equipment Management Hub
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-mono text-emerald-300">
                  4/4 KTV Đang Trong Ca
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Điều phối lệnh sửa chữa thời gian thực, cân bằng tải công việc kíp trực, theo dõi hạn định SLA,
                phê duyệt xuất kho linh kiện phụ tùng và kiểm soát kế hoạch bảo trì phòng ngừa (PM) toàn xưởng.
              </p>
            </div>
          </div>

          {/* Quick Broadcast Form */}
          <form onSubmit={handleBroadcast} className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder="Gửi tin nhắn bộ đàm kíp trực..."
              className="rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white placeholder-slate-500 w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!broadcastText.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-900/40 transition disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Phát Loa</span>
            </button>
          </form>
        </div>

        {broadcastToast && (
          <div className="mt-4 rounded-xl bg-blue-950/60 border border-blue-500/40 p-2.5 text-xs text-blue-200 flex items-center gap-2 animate-in fade-in">
            <Bell className="h-4 w-4 text-blue-400 shrink-0" />
            <span>{broadcastToast}</span>
          </div>
        )}
      </div>

      {/* 2. Dispatch Board (Active Tickets) + Technician Roster Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 2 Columns - Real-Time Incident Dispatch Board */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Bảng Điều Phối Lệnh Sự Cố Thời Gian Thực (Active Dispatch Board)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                SLA Chuẩn: &lt; 45 phút / sự cố
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {tickets.map((tick) => (
                <div
                  key={tick.id}
                  className={`rounded-2xl border p-4 transition ${
                    tick.severity === 'CRITICAL'
                      ? 'border-red-500/60 bg-red-950/20 shadow-md shadow-red-950/20'
                      : 'border-slate-800 bg-slate-950'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{tick.deviceName}</span>
                        <span className="rounded bg-slate-800 px-2 py-0.2 text-xs font-mono font-bold text-slate-300">
                          {tick.deviceCode}
                        </span>
                        <span className="rounded bg-red-500/20 border border-red-500/40 px-2 py-0.2 text-xs font-mono font-bold text-red-300">
                          {tick.errorCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{tick.errorTitle}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-amber-400">
                        Hạn SLA: {tick.slaDeadlineMinutes} phút
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">Báo cáo: {tick.reportedAt}</div>
                    </div>
                  </div>

                  {/* Technician Assignment Controller */}
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {tick.assignedTechName ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={tick.assignedTechAvatar}
                            alt={tick.assignedTechName}
                            className="h-8 w-8 rounded-full object-cover ring-2 ring-emerald-500/40"
                          />
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{tick.assignedTechName}</span>
                              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                Đang Xử Lý
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">Đã nhận nhiệm vụ tại xưởng</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold bg-amber-950/40 border border-amber-500/40 rounded-xl px-3 py-1.5">
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                          <span>Chưa có KTV: Vui lòng phân công ngay!</span>
                        </div>
                      )}
                    </div>

                    {/* Reassign / Dispatch Action Buttons */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={selectedTechForDispatch}
                          onChange={(e) => setSelectedTechForDispatch(e.target.value)}
                          className="rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                        >
                          {technicians.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.shift})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleAssignTicket(tick.id, selectedTechForDispatch)}
                          className="rounded-xl bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition shadow-sm"
                        >
                          Giao Việc
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const dev = devices.find((d) => d.id === tick.deviceId);
                          if (dev) onOpenDiagnosis(dev);
                        }}
                        className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition"
                      >
                        Chẩn Đoán AI
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const dev = devices.find((d) => d.id === tick.deviceId);
                          if (dev) onOpenRepairReport(dev);
                        }}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition shadow-sm"
                      >
                        Nghiệm Thu
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spare Parts Approval Queue */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">
                  Hàng Đợi Ký Duyệt Xuất Kho Phụ Tùng (Spare Parts Requisition Queue)
                </h3>
              </div>
              <span className="text-xs font-mono text-purple-300">
                {requisitions.filter((r) => r.status === 'PENDING').length} Phiếu Chờ Duyệt
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-800">
              {requisitions.map((req) => (
                <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs sm:text-sm">{req.partName}</span>
                      <span className="rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono px-2 py-0.2">
                        SKU: {req.partSku}
                      </span>
                      {req.urgency === 'URGENT' && (
                        <span className="rounded bg-red-500/20 text-red-300 text-[10px] font-bold px-1.5 py-0.2">
                          KHẨN CẤP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Máy đích: <strong className="text-slate-300">{req.targetMachine}</strong> • Số lượng: <strong className="text-white">{req.quantity}</strong> • Yêu cầu bởi: <span className="text-indigo-300">{req.requestedBy}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {req.status === 'PENDING' ? (
                      <button
                        type="button"
                        onClick={() => handleApproveRequisition(req.id, req.partName)}
                        className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Duyệt Xuất Kho</span>
                      </button>
                    ) : (
                      <div className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Đã Cấp Phát</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: 1 Column - Live Technician Roster & Workload Map */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-400" />
                <span>Kíp Trực Kỹ Thuật & Tải Công Việc</span>
              </h3>
              <span className="text-xs font-mono text-emerald-400 font-bold">Live</span>
            </div>

            <div className="mt-3 space-y-3">
              {techWorkload.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl bg-slate-950 border border-slate-800/80 p-3 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <div className="font-bold text-white">{t.name}</div>
                        <div className="text-[10px] text-slate-400">{t.role}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        t.activeTasks > 0
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {t.statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                    <span>Ca làm việc: <strong className="text-slate-300">{t.shift}</strong></span>
                    <span className="font-mono text-indigo-300 font-bold">
                      Skill Score: {t.proficiency}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preventive Maintenance Schedule Quick Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span>Lịch Bảo Dưỡng Định Kỳ (PM Schedule)</span>
            </h3>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>Máy Cắt Dây Fanuc α-C600iB</span>
                  <span className="font-mono text-amber-400">Còn 48h</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  PM 500 Giờ: Thay hạt nhựa khử ion & hiệu chuẩn dao cắt dây AWT
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>Máy Bắn Điện Makino EDAF3</span>
                  <span className="font-mono text-emerald-400">Đã Hoàn Tất</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  PM 1000 Giờ: Kiểm định an toàn bình dập lửa CO2 & đầu gá 3R
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
