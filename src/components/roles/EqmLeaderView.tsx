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
  Brain,
  Crown,
  ArrowUpDown,
  Phone,
  Filter,
  Star,
  StickyNote,
  Edit2,
  Trash2,
  Pin,
  Plus,
} from 'lucide-react';
import { Device, Technician } from '../../types';
import { soundManager } from '../../utils/audio';
import { TechnicianRepairLeaderboard, TechnicianPerformanceData } from './TechnicianRepairLeaderboard';
import { TechnicianDetailModal } from './TechnicianDetailModal';
import { AIKnowledgeSynthesisEngine } from './AIKnowledgeSynthesisEngine';

export type TechSortOption =
  | 'SCORE_DESC'
  | 'SCORE_ASC'
  | 'NAME_ASC'
  | 'NAME_DESC'
  | 'TASKS_ASC'
  | 'TASKS_DESC'
  | 'AVAILABILITY';

export type TechStatusFilter = 'ALL' | 'READY' | 'BUSY' | 'TOP_SKILL' | 'HAS_NOTE';

export interface TechQuickNote {
  text: string;
  updatedAt: string;
  priority: 'NORMAL' | 'URGENT';
}

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
  const [mobileTab, setMobileTab] = useState<'DISPATCH' | 'ROSTER' | 'LEADERBOARD' | 'AI_KNOWLEDGE'>('DISPATCH');
  const [techSearchQuery, setTechSearchQuery] = useState('');
  const [techSortOption, setTechSortOption] = useState<TechSortOption>('SCORE_DESC');
  const [techStatusFilter, setTechStatusFilter] = useState<TechStatusFilter>('ALL');

  const [inspectingTechnician, setInspectingTechnician] = useState<{
    tech: Technician;
    perf: TechnicianPerformanceData;
    rank: number;
  } | null>(null);

  // Quick Notes / Short-term Reminders for Technicians (persisted in localStorage)
  const [techNotes, setTechNotes] = useState<Record<string, TechQuickNote>>(() => {
    try {
      const saved = localStorage.getItem('eqm_technician_quick_notes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      'tech-03': {
        text: 'Bàn giao chìa khóa tủ linh kiện và kiểm tra mức dầu EDM cho ca đêm trước 21h',
        updatedAt: '19:30',
        priority: 'NORMAL',
      },
      'tech-01': {
        text: 'Ưu tiên kiểm tra bo xung máy Sodick ALC sau khi giải quyết ticket #102',
        updatedAt: '19:15',
        priority: 'URGENT',
      },
    };
  });

  const [editingNoteTechId, setEditingNoteTechId] = useState<string | null>(null);
  const [noteDraftText, setNoteDraftText] = useState<string>('');
  const [noteDraftPriority, setNoteDraftPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');

  const handleShowToast = (msg: string) => {
    setBroadcastToast(msg);
    setTimeout(() => setBroadcastToast(null), 4000);
  };

  const handleSaveNote = (techId: string, text: string, priority: 'NORMAL' | 'URGENT' = 'NORMAL') => {
    if (!text.trim()) {
      handleDeleteNote(techId);
      return;
    }
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const updated: Record<string, TechQuickNote> = {
      ...techNotes,
      [techId]: {
        text: text.trim(),
        updatedAt: `${timeStr} hôm nay`,
        priority,
      },
    };
    setTechNotes(updated);
    try {
      localStorage.setItem('eqm_technician_quick_notes', JSON.stringify(updated));
    } catch {}
    setEditingNoteTechId(null);
    soundManager.playSuccessChime();
    const tech = technicians.find((t) => t.id === techId);
    handleShowToast(`📌 Đã lưu ghi chú cho KTV ${tech ? tech.name : techId}`);
  };

  const handleDeleteNote = (techId: string) => {
    const updated = { ...techNotes };
    delete updated[techId];
    setTechNotes(updated);
    try {
      localStorage.setItem('eqm_technician_quick_notes', JSON.stringify(updated));
    } catch {}
    if (editingNoteTechId === techId) {
      setEditingNoteTechId(null);
    }
    soundManager.playBeep();
    const tech = technicians.find((t) => t.id === techId);
    handleShowToast(`🗑️ Đã xóa ghi chú của KTV ${tech ? tech.name : techId}`);
  };

  const handleStartEditNote = (techId: string, currentNote?: TechQuickNote, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingNoteTechId(techId);
    setNoteDraftText(currentNote ? currentNote.text : '');
    setNoteDraftPriority(currentNote ? currentNote.priority : 'NORMAL');
  };

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

  // Baseline mapping for comprehensive technician performance & ranking metrics
  const baselineStatsMap: Record<
    string,
    {
      score: number;
      resolved: number;
      avgMttr: number;
      fastestFix: number;
      specialty: string;
      recentBadge: string;
      rank: number;
    }
  > = useMemo(
    () => ({
      'tech-03': {
        score: 98,
        resolved: 26,
        avgMttr: 21.4,
        fastestFix: 14,
        specialty: 'Bàn Tay Vàng Cắt Dây EDM (Makino/Sodick)',
        recentBadge: 'Kỷ Lục Khắc Phục E-102 (14 phút)',
        rank: 1,
      },
      'tech-01': {
        score: 94,
        resolved: 29,
        avgMttr: 25.8,
        fastestFix: 16,
        specialty: 'Bậc Thầy Chẩn Đoán Bo Mạch & PLC CNC',
        recentBadge: 'Giải Cứu Trục Z Makino EDAF3',
        rank: 2,
      },
      'tech-02': {
        score: 87,
        resolved: 21,
        avgMttr: 30.6,
        fastestFix: 19,
        specialty: 'Chuyên Gia Thủy Lực & Áp Lực Nước Xả',
        recentBadge: 'Xử Lý Màng Áp Lực Sodick ALC',
        rank: 3,
      },
      'tech-04': {
        score: 82,
        resolved: 17,
        avgMttr: 34.2,
        fastestFix: 22,
        specialty: 'Kỹ Thuật Viên Vận Hành & Khắc Phục Ca Đêm',
        recentBadge: 'Hoàn Thành 100% Checklist PM 500h',
        rank: 4,
      },
    }),
    []
  );

  // Enriched Technician Workload & Performance Summary
  const enrichedTechWorkload = useMemo(() => {
    return technicians.map((t, idx) => {
      const activeTaskCount = tickets.filter(
        (tick) => tick.assignedTechId === t.id && tick.status === 'IN_PROGRESS'
      ).length;
      const base = baselineStatsMap[t.id] || {
        score: t.role.includes('Trưởng') ? 98 : t.role.includes('Chuyên gia') ? 95 : 85,
        resolved: 18,
        avgMttr: 28.5,
        fastestFix: 18,
        specialty: t.role,
        recentBadge: 'Kỹ Thuật Viên Cơ Điện Đạt Chuẩn',
        rank: idx + 1,
      };

      const perf: TechnicianPerformanceData = {
        id: t.id,
        name: t.name,
        role: t.role,
        avatar: t.avatar,
        shift: t.shift,
        phone: t.phone,
        resolvedIncidents: base.resolved,
        emergencyFixedCount: Math.round(base.resolved * 0.4),
        avgMttrMinutes: base.avgMttr,
        fastestFixMinutes: base.fastestFix,
        slaComplianceRate: 96.5,
        firstTimePassRate: 97.0,
        commendationsCount: t.id === 'tech-03' ? 12 : t.id === 'tech-01' ? 10 : 6,
        specialtyTag: base.specialty,
        score: base.score,
        recentSuccessBadge: base.recentBadge,
      };

      return {
        ...t,
        activeTasks: activeTaskCount,
        proficiency: base.score,
        performanceScore: base.score,
        rank: base.rank,
        specialty: base.specialty,
        recentBadge: base.recentBadge,
        statusLabel: activeTaskCount > 0 ? 'Đang Xử Lý' : 'Sẵn Sàng Tiếp Nhận',
        perf,
      };
    });
  }, [technicians, tickets, baselineStatsMap]);

  // Alias for backward compatibility
  const techWorkload = enrichedTechWorkload;

  // Filtered and Sorted Technician Roster
  const filteredAndSortedTechs = useMemo(() => {
    const query = techSearchQuery.toLowerCase().trim();

    const filtered = enrichedTechWorkload.filter((t) => {
      // Status filter
      if (techStatusFilter === 'READY' && t.activeTasks > 0) return false;
      if (techStatusFilter === 'BUSY' && t.activeTasks === 0) return false;
      if (techStatusFilter === 'TOP_SKILL' && t.performanceScore < 90) return false;
      if (techStatusFilter === 'HAS_NOTE' && !techNotes[t.id]) return false;

      // Search query filter (matches name, role, shift, phone, specialty, status, or note)
      if (!query) return true;
      const matchName = t.name.toLowerCase().includes(query);
      const matchRole = t.role.toLowerCase().includes(query);
      const matchShift = t.shift.toLowerCase().includes(query);
      const matchPhone = t.phone.toLowerCase().includes(query);
      const matchSpecialty = t.specialty.toLowerCase().includes(query);
      const matchStatus = t.statusLabel.toLowerCase().includes(query);
      const matchNote = (techNotes[t.id]?.text || '').toLowerCase().includes(query);
      return matchName || matchRole || matchShift || matchPhone || matchSpecialty || matchStatus || matchNote;
    });

    return [...filtered].sort((a, b) => {
      switch (techSortOption) {
        case 'SCORE_DESC':
          return b.performanceScore - a.performanceScore;
        case 'SCORE_ASC':
          return a.performanceScore - b.performanceScore;
        case 'NAME_ASC':
          return a.name.localeCompare(b.name, 'vi');
        case 'NAME_DESC':
          return b.name.localeCompare(a.name, 'vi');
        case 'TASKS_ASC':
          return a.activeTasks - b.activeTasks || b.performanceScore - a.performanceScore;
        case 'TASKS_DESC':
          return b.activeTasks - a.activeTasks || b.performanceScore - a.performanceScore;
        case 'AVAILABILITY':
          return (a.activeTasks === 0 ? -1 : 1) - (b.activeTasks === 0 ? -1 : 1);
        default:
          return b.performanceScore - a.performanceScore;
      }
    });
  }, [enrichedTechWorkload, techSearchQuery, techSortOption, techStatusFilter, techNotes]);

  const readyCount = useMemo(
    () => enrichedTechWorkload.filter((t) => t.activeTasks === 0).length,
    [enrichedTechWorkload]
  );
  const busyCount = useMemo(
    () => enrichedTechWorkload.filter((t) => t.activeTasks > 0).length,
    [enrichedTechWorkload]
  );
  const topSkillCount = useMemo(
    () => enrichedTechWorkload.filter((t) => t.performanceScore >= 90).length,
    [enrichedTechWorkload]
  );
  const withNotesCount = useMemo(
    () => enrichedTechWorkload.filter((t) => !!techNotes[t.id]).length,
    [enrichedTechWorkload, techNotes]
  );

  const handleOpenTechnicianModal = (techId: string) => {
    const item = enrichedTechWorkload.find((t) => t.id === techId);
    if (!item) return;
    const tech = technicians.find((t) => t.id === techId) || item;
    setInspectingTechnician({
      tech,
      perf: item.perf,
      rank: item.rank,
    });
  };

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

        {/* Mobile Sub-Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold shadow-inner">
          <button
            type="button"
            onClick={() => setMobileTab('DISPATCH')}
            className={`rounded-xl py-2 transition flex items-center justify-center gap-1 ${
              mobileTab === 'DISPATCH' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[10.5px]">Điều Phối</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('ROSTER')}
            className={`rounded-xl py-2 transition flex items-center justify-center gap-1 ${
              mobileTab === 'ROSTER' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[10.5px]">Kíp KTV</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('LEADERBOARD')}
            className={`rounded-xl py-2 transition flex items-center justify-center gap-1 ${
              mobileTab === 'LEADERBOARD' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[10.5px]">Xếp Hạng</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('AI_KNOWLEDGE')}
            className={`rounded-xl py-2 transition flex items-center justify-center gap-1 ${
              mobileTab === 'AI_KNOWLEDGE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[10.5px]">Bộ Não AI</span>
          </button>
        </div>

        {/* SUBTAB 1: LIVE DISPATCH & APPROVALS */}
        {mobileTab === 'DISPATCH' && (
          <div className="space-y-4">
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
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={tick.assignedTechAvatar}
                      alt={tick.assignedTechName}
                      className="h-6 w-6 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-slate-200 font-medium block">
                        KTV: <strong>{tick.assignedTechName}</strong>
                      </span>
                      {tick.assignedTechId && techNotes[tick.assignedTechId] && (
                        <span className="text-[10px] text-blue-300 flex items-center gap-0.5 truncate max-w-[200px]">
                          <Pin className="h-2.5 w-2.5 text-blue-400 shrink-0" />
                          {techNotes[tick.assignedTechId].text}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
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
          </div>
        )}

        {/* SUBTAB 2: LIVE TECHNICIAN ROSTER & WORKLOAD MAP (MOBILE) */}
        {mobileTab === 'ROSTER' && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Kíp Trực Kỹ Thuật Hiện Trường
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    {filteredAndSortedTechs.length}/{technicians.length} KTV
                  </span>
                </div>
              </div>

              {/* Mobile Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={techSearchQuery}
                  onChange={(e) => setTechSearchQuery(e.target.value)}
                  placeholder="Tìm KTV theo tên, ca, SĐT, chuyên môn..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {techSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTechSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded transition"
                    title="Xóa tìm kiếm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Sort Selector & Filter Chips */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <ArrowUpDown className="h-3 w-3 text-blue-400" />
                    <span>Sắp xếp:</span>
                  </div>
                  <select
                    value={techSortOption}
                    onChange={(e) => setTechSortOption(e.target.value as TechSortOption)}
                    className="rounded-lg bg-slate-950 border border-slate-800 text-white text-[11px] px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
                  >
                    <option value="SCORE_DESC">Điểm kỹ năng (Cao → Thấp)</option>
                    <option value="SCORE_ASC">Điểm kỹ năng (Thấp → Cao)</option>
                    <option value="NAME_ASC">Tên KTV (A → Z)</option>
                    <option value="NAME_DESC">Tên KTV (Z → A)</option>
                    <option value="TASKS_ASC">Tải việc (Rảnh rỗi trước)</option>
                    <option value="TASKS_DESC">Tải việc (Bận nhiều nhất)</option>
                    <option value="AVAILABILITY">Sẵn sàng tiếp nhận trước</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setTechStatusFilter('ALL')}
                    className={`rounded-lg px-2.5 py-1 transition shrink-0 font-medium ${
                      techStatusFilter === 'ALL'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Tất cả ({technicians.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTechStatusFilter('READY')}
                    className={`rounded-lg px-2.5 py-1 transition shrink-0 font-medium ${
                      techStatusFilter === 'READY'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    🟢 Sẵn sàng ({readyCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTechStatusFilter('BUSY')}
                    className={`rounded-lg px-2.5 py-1 transition shrink-0 font-medium ${
                      techStatusFilter === 'BUSY'
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    🟠 Đang xử lý ({busyCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTechStatusFilter('TOP_SKILL')}
                    className={`rounded-lg px-2.5 py-1 transition shrink-0 font-medium ${
                      techStatusFilter === 'TOP_SKILL'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    👑 Top Kỹ Năng ({topSkillCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTechStatusFilter('HAS_NOTE')}
                    className={`rounded-lg px-2.5 py-1 transition shrink-0 font-medium ${
                      techStatusFilter === 'HAS_NOTE'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    📝 Có lưu ý ({withNotesCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Technician List */}
            {filteredAndSortedTechs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-6 text-center space-y-2">
                <Search className="h-6 w-6 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">Không tìm thấy kỹ thuật viên phù hợp</p>
                {techSearchQuery && (
                  <p className="text-[11px] text-slate-500">Khớp từ khóa: "{techSearchQuery}"</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setTechSearchQuery('');
                    setTechStatusFilter('ALL');
                  }}
                  className="text-xs text-blue-400 hover:underline font-bold"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredAndSortedTechs.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleOpenTechnicianModal(t.id)}
                    className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 p-3.5 space-y-2.5 transition active:scale-[0.99] cursor-pointer shadow-lg relative overflow-hidden"
                  >
                    {t.rank === 1 && (
                      <div className="absolute top-0 right-0 h-10 w-10 overflow-hidden pointer-events-none">
                        <div className="absolute transform rotate-45 bg-gradient-to-r from-amber-500 to-yellow-400 text-[8px] font-black text-slate-950 py-0.5 right-[-24px] top-[8px] w-[80px] text-center shadow-sm">
                          TOP 1
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={t.avatar}
                            alt={t.name}
                            className={`h-10 w-10 rounded-full object-cover ring-2 ${
                              t.activeTasks > 0 ? 'ring-amber-500/60' : 'ring-emerald-500/60'
                            }`}
                          />
                          {t.rank === 1 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow">
                              <Crown className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span>{t.name}</span>
                            {t.rank === 1 && (
                              <span className="text-[10px] text-amber-400 font-mono font-bold">#1</span>
                            )}
                          </div>
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

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                      <div>
                        Ca: <strong className="text-slate-300">{t.shift}</strong>
                      </div>
                      <div className="text-right">
                        Hiệu suất: <strong className="text-amber-300 font-mono">{t.performanceScore}đ</strong>
                      </div>
                    </div>

                    {/* Quick Note / Short-term Reminder Field */}
                    <div
                      className="mt-2 pt-2 border-t border-slate-800/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {editingNoteTechId === t.id ? (
                        <div className="rounded-xl bg-slate-950 border border-blue-500/50 p-2.5 space-y-2 shadow-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1">
                              <StickyNote className="h-3.5 w-3.5 text-blue-400" />
                              <span>Ghi chú cho {t.name.split(' ').pop()}:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setNoteDraftPriority((prev) => (prev === 'URGENT' ? 'NORMAL' : 'URGENT'))}
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
                                noteDraftPriority === 'URGENT'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {noteDraftPriority === 'URGENT' ? '⚠️ Khẩn cấp' : 'Bình thường'}
                            </button>
                          </div>

                          <input
                            type="text"
                            value={noteDraftText}
                            onChange={(e) => setNoteDraftText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveNote(t.id, noteDraftText, noteDraftPriority);
                              } else if (e.key === 'Escape') {
                                setEditingNoteTechId(null);
                              }
                            }}
                            placeholder="Nhập nhắc nhở nhanh (Enter để lưu)..."
                            autoFocus
                            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />

                          {/* Quick Presets */}
                          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[10px]">
                            {[
                              '🔑 Bàn giao chìa khóa tủ',
                              '⚠️ Ưu tiên máy Makino U6',
                              '💧 Kiểm tra bù dầu EDM',
                              '⏱️ Báo cáo trước đổi ca',
                            ].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setNoteDraftText(preset)}
                                className="rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-1.5 py-0.5 shrink-0 transition"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingNoteTechId(null)}
                              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] text-slate-300 transition"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveNote(t.id, noteDraftText, noteDraftPriority)}
                              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1 text-[11px] font-bold text-white transition flex items-center gap-1 shadow-md shadow-blue-900/30"
                            >
                              <Check className="h-3 w-3" />
                              <span>Lưu</span>
                            </button>
                          </div>
                        </div>
                      ) : techNotes[t.id] ? (
                        <div
                          className={`rounded-xl p-2 text-xs flex items-start justify-between gap-2 border transition ${
                            techNotes[t.id].priority === 'URGENT'
                              ? 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                              : 'bg-blue-950/20 border-blue-500/30 text-blue-200'
                          }`}
                        >
                          <div className="flex items-start gap-1.5 min-w-0">
                            <Pin
                              className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                                techNotes[t.id].priority === 'URGENT' ? 'text-amber-400' : 'text-blue-400'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                                  Lưu ý Leader ({techNotes[t.id].updatedAt})
                                </span>
                                {techNotes[t.id].priority === 'URGENT' && (
                                  <span className="text-[9px] bg-amber-500/30 text-amber-300 font-bold px-1 rounded">
                                    Khẩn
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-medium leading-relaxed mt-0.5 break-words">
                                "{techNotes[t.id].text}"
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={(e) => handleStartEditNote(t.id, techNotes[t.id], e)}
                              title="Sửa ghi chú"
                              className="p-1 rounded hover:bg-slate-800/80 text-slate-400 hover:text-white transition"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(t.id);
                              }}
                              title="Xóa ghi chú"
                              className="p-1 rounded hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px]">
                          <button
                            type="button"
                            onClick={(e) => handleStartEditNote(t.id, undefined, e)}
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-blue-400 font-medium transition py-0.5"
                          >
                            <StickyNote className="h-3 w-3" />
                            <span>+ Thêm ghi chú nhắc việc</span>
                          </button>
                          <span className="text-[10px] text-slate-500">Chưa có lưu ý</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-900">
                      <span className="text-slate-400 truncate max-w-[200px]">{t.specialty}</span>
                      <span className="text-blue-400 font-bold flex items-center gap-0.5">
                        Xem Radar <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: TECHNICIAN REPAIR LEADERBOARD (MOBILE) */}
        {mobileTab === 'LEADERBOARD' && (
          <TechnicianRepairLeaderboard
            technicians={technicians}
            viewportMode="MOBILE"
            onToast={handleShowToast}
            onSelectTechnician={(tech, perf) => {
              const r = tech.id === 'tech-03' ? 1 : tech.id === 'tech-01' ? 2 : tech.id === 'tech-02' ? 3 : 4;
              setInspectingTechnician({ tech, perf, rank: r });
            }}
          />
        )}

        {/* SUBTAB 3: AI KNOWLEDGE SYNTHESIS ENGINE (MOBILE) */}
        {mobileTab === 'AI_KNOWLEDGE' && (
          <AIKnowledgeSynthesisEngine
            devices={devices}
            onToast={handleShowToast}
          />
        )}

        {/* Technician Detail Modal */}
        {inspectingTechnician && (
          <TechnicianDetailModal
            technician={inspectingTechnician.tech}
            performance={inspectingTechnician.perf}
            rank={inspectingTechnician.rank}
            onClose={() => setInspectingTechnician(null)}
            onToast={handleShowToast}
          />
        )}

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
                            {tick.assignedTechId && techNotes[tick.assignedTechId] && (
                              <div className="mt-1 flex items-center gap-1 text-[10.5px] text-blue-300 bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-500/30">
                                <Pin className="h-3 w-3 text-blue-400 shrink-0" />
                                <span className="truncate max-w-[280px]">
                                  Lưu ý Leader: {techNotes[tick.assignedTechId].text}
                                </span>
                              </div>
                            )}
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
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Kíp Trực Kỹ Thuật & Tải Công Việc</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Điều phối ca trực & năng lực EDM</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {filteredAndSortedTechs.length}/{technicians.length} KTV
                </span>
              </div>
            </div>

            {/* Quick Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={techSearchQuery}
                onChange={(e) => setTechSearchQuery(e.target.value)}
                placeholder="Tìm KTV theo tên, ca, chuyên môn, SĐT..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition shadow-inner"
              />
              {techSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTechSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded transition"
                  title="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sorting Options & Filter Chips */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <ArrowUpDown className="h-3.5 w-3.5 text-blue-400" />
                  <span>Sắp xếp:</span>
                </div>
                <select
                  value={techSortOption}
                  onChange={(e) => setTechSortOption(e.target.value as TechSortOption)}
                  className="rounded-lg bg-slate-950 border border-slate-800 text-white text-[11px] px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
                >
                  <option value="SCORE_DESC">Điểm kỹ năng (Cao → Thấp)</option>
                  <option value="SCORE_ASC">Điểm kỹ năng (Thấp → Cao)</option>
                  <option value="NAME_ASC">Tên KTV (A → Z)</option>
                  <option value="NAME_DESC">Tên KTV (Z → A)</option>
                  <option value="TASKS_ASC">Tải việc (Rảnh rỗi trước)</option>
                  <option value="TASKS_DESC">Tải việc (Bận nhiều nhất)</option>
                  <option value="AVAILABILITY">Sẵn sàng tiếp nhận trước</option>
                </select>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                <button
                  type="button"
                  onClick={() => setTechStatusFilter('ALL')}
                  className={`rounded-lg px-2.5 py-1 transition shrink-0 font-medium ${
                    techStatusFilter === 'ALL'
                      ? 'bg-blue-600 text-white font-bold shadow'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  Tất cả ({technicians.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTechStatusFilter('READY')}
                  className={`rounded-lg px-2.5 py-1 transition shrink-0 font-medium ${
                    techStatusFilter === 'READY'
                      ? 'bg-emerald-600 text-white font-bold shadow'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  🟢 Sẵn sàng ({readyCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTechStatusFilter('BUSY')}
                  className={`rounded-lg px-2.5 py-1 transition shrink-0 font-medium ${
                    techStatusFilter === 'BUSY'
                      ? 'bg-amber-600 text-white font-bold shadow'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  🟠 Đang xử lý ({busyCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTechStatusFilter('TOP_SKILL')}
                  className={`rounded-lg px-2.5 py-1 transition shrink-0 font-medium ${
                    techStatusFilter === 'TOP_SKILL'
                      ? 'bg-indigo-600 text-white font-bold shadow'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  👑 Top Kỹ Năng ({topSkillCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTechStatusFilter('HAS_NOTE')}
                  className={`rounded-lg px-2.5 py-1 transition shrink-0 font-medium ${
                    techStatusFilter === 'HAS_NOTE'
                      ? 'bg-purple-600 text-white font-bold shadow'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  📝 Có lưu ý ({withNotesCount})
                </button>
              </div>
            </div>

            {/* Technician Cards List */}
            {filteredAndSortedTechs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/60 p-6 text-center space-y-2">
                <Search className="h-6 w-6 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">Không tìm thấy kỹ thuật viên phù hợp</p>
                {techSearchQuery && (
                  <p className="text-[11px] text-slate-500">Khớp từ khóa: "{techSearchQuery}"</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setTechSearchQuery('');
                    setTechStatusFilter('ALL');
                  }}
                  className="text-xs text-blue-400 hover:underline font-bold"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedTechs.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleOpenTechnicianModal(t.id)}
                    className="rounded-xl bg-slate-950 border border-slate-800/80 hover:border-blue-500/60 hover:bg-slate-900/90 p-3.5 text-xs space-y-2.5 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden"
                  >
                    {t.rank === 1 && (
                      <div className="absolute top-0 right-0 h-10 w-10 overflow-hidden pointer-events-none">
                        <div className="absolute transform rotate-45 bg-gradient-to-r from-amber-500 to-yellow-400 text-[8px] font-black text-slate-950 py-0.5 right-[-24px] top-[8px] w-[80px] text-center shadow-sm">
                          TOP 1
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <img
                            src={t.avatar}
                            alt={t.name}
                            className={`h-9 w-9 rounded-full object-cover ring-2 ${
                              t.activeTasks > 0 ? 'ring-amber-500/60' : 'ring-emerald-500/60'
                            }`}
                          />
                          {t.rank === 1 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow">
                              <Crown className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-blue-300 transition flex items-center gap-1.5">
                            <span>{t.name}</span>
                            {t.rank === 1 && (
                              <span className="text-[10px] text-amber-400 font-mono font-bold">#1</span>
                            )}
                          </div>
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

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1.5 border-t border-slate-900">
                      <div>
                        Ca: <strong className="text-slate-300">{t.shift}</strong>
                      </div>
                      <div className="text-right">
                        Hiệu suất: <strong className="text-amber-300 font-mono">{t.performanceScore}đ</strong>
                      </div>
                    </div>

                    {/* Quick Note / Short-term Reminder Field */}
                    <div
                      className="mt-2 pt-2 border-t border-slate-900/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {editingNoteTechId === t.id ? (
                        <div className="rounded-xl bg-slate-900 border border-blue-500/50 p-2.5 space-y-2 shadow-lg animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1">
                              <StickyNote className="h-3.5 w-3.5 text-blue-400" />
                              <span>Ghi chú cho {t.name.split(' ').pop()}:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setNoteDraftPriority((prev) => (prev === 'URGENT' ? 'NORMAL' : 'URGENT'))}
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
                                noteDraftPriority === 'URGENT'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {noteDraftPriority === 'URGENT' ? '⚠️ Khẩn cấp' : 'Bình thường'}
                            </button>
                          </div>

                          <input
                            type="text"
                            value={noteDraftText}
                            onChange={(e) => setNoteDraftText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveNote(t.id, noteDraftText, noteDraftPriority);
                              } else if (e.key === 'Escape') {
                                setEditingNoteTechId(null);
                              }
                            }}
                            placeholder="Nhập nhắc nhở nhanh (Enter để lưu)..."
                            autoFocus
                            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />

                          {/* Quick presets for 1-tap entry */}
                          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[10px]">
                            {[
                              '🔑 Bàn giao chìa khóa tủ linh kiện',
                              '⚠️ Ưu tiên xử lý sự cố máy U6',
                              '💧 Kiểm tra bù dầu & áp lực nước',
                              '⏱️ Báo cáo trước khi đổi ca',
                            ].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setNoteDraftText(preset)}
                                className="rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-1.5 py-0.5 shrink-0 transition"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingNoteTechId(null)}
                              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] text-slate-300 transition"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveNote(t.id, noteDraftText, noteDraftPriority)}
                              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1 text-[11px] font-bold text-white transition flex items-center gap-1 shadow-md shadow-blue-900/30"
                            >
                              <Check className="h-3 w-3" />
                              <span>Lưu</span>
                            </button>
                          </div>
                        </div>
                      ) : techNotes[t.id] ? (
                        <div
                          className={`rounded-xl p-2 text-xs flex items-start justify-between gap-2 border transition ${
                            techNotes[t.id].priority === 'URGENT'
                              ? 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                              : 'bg-blue-950/20 border-blue-500/30 text-blue-200'
                          }`}
                        >
                          <div className="flex items-start gap-1.5 min-w-0">
                            <Pin
                              className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                                techNotes[t.id].priority === 'URGENT' ? 'text-amber-400' : 'text-blue-400'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                                  Lưu ý Leader ({techNotes[t.id].updatedAt})
                                </span>
                                {techNotes[t.id].priority === 'URGENT' && (
                                  <span className="text-[9px] bg-amber-500/30 text-amber-300 font-bold px-1 rounded">
                                    Khẩn
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-medium leading-relaxed mt-0.5 break-words">
                                "{techNotes[t.id].text}"
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={(e) => handleStartEditNote(t.id, techNotes[t.id], e)}
                              title="Sửa ghi chú"
                              className="p-1 rounded hover:bg-slate-800/80 text-slate-400 hover:text-white transition"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(t.id);
                              }}
                              title="Xóa ghi chú"
                              className="p-1 rounded hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px]">
                          <button
                            type="button"
                            onClick={(e) => handleStartEditNote(t.id, undefined, e)}
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-400 font-medium transition py-0.5 group/note"
                          >
                            <StickyNote className="h-3 w-3 group-hover/note:scale-110 transition-transform" />
                            <span>+ Thêm ghi chú nhắc việc</span>
                          </button>
                          <span className="text-[10px] text-slate-600">Chưa có lưu ý</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] pt-1 border-t border-slate-900/80">
                      <span className="text-slate-400 truncate max-w-[170px]" title={t.specialty}>
                        {t.specialty}
                      </span>
                      <span className="text-blue-400 group-hover:text-blue-300 font-bold flex items-center gap-0.5 shrink-0 transition">
                        Xem Radar <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* 3. Technician Repair Performance & MTTR Leaderboard */}
      <div className="pt-2">
        <TechnicianRepairLeaderboard
          technicians={technicians}
          viewportMode="PC"
          onToast={handleShowToast}
          onSelectTechnician={(tech, perf) => {
            const r = tech.id === 'tech-03' ? 1 : tech.id === 'tech-01' ? 2 : tech.id === 'tech-02' ? 3 : 4;
            setInspectingTechnician({ tech, perf, rank: r });
          }}
        />
      </div>

      {/* 4. AI Knowledge Synthesis Engine (Cơ Chế Học Hỏi & Tổng Hợp Tri Thức AI) */}
      <div className="pt-4">
        <AIKnowledgeSynthesisEngine
          devices={devices}
          onToast={handleShowToast}
        />
      </div>

      {/* Technician Detail Modal with Radar Chart & Milestone Timeline */}
      {inspectingTechnician && (
        <TechnicianDetailModal
          technician={inspectingTechnician.tech}
          performance={inspectingTechnician.perf}
          rank={inspectingTechnician.rank}
          onClose={() => setInspectingTechnician(null)}
          onToast={handleShowToast}
        />
      )}
    </div>
  );
};
