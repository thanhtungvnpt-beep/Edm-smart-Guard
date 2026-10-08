import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  Mail,
  Phone,
  Radio,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  UserCheck,
  UserCog,
  Users,
  UserX,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { AILearning, Device, Technician } from '../types';
import {
  TechnicianProficiencyScore,
  matchTechLearnings,
} from './TechnicianProficiencyScore';
import { TechnicianSkillsComparisonChart } from './TechnicianSkillsComparisonChart';

interface TechnicianStatusSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  devices: Device[];
  learnings?: AILearning[];
  onUpdateTechStatus: (techId: string, status: Technician['activeStatus']) => void;
  onReassignDevice: (deviceId: string, techId: string) => void;
  onOpenPhoneView?: (device: Device) => void;
  onOpenMachineDetails?: (device: Device) => void;
  onFilterByDevice?: (deviceId: string) => void;
  onNavigateToLearningsTab?: () => void;
}

export const TechnicianStatusSidebar: React.FC<TechnicianStatusSidebarProps> = ({
  isOpen,
  onClose,
  technicians,
  devices,
  learnings = [],
  onUpdateTechStatus,
  onReassignDevice,
  onOpenPhoneView,
  onOpenMachineDetails,
  onFilterByDevice,
  onNavigateToLearningsTab,
}) => {
  const [sidebarMode, setSidebarMode] = useState<'DISPATCH' | 'PROFICIENCY' | 'SKILLS_CHART'>('DISPATCH');
  const [selectedTechForProficiency, setSelectedTechForProficiency] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ON_DUTY' | 'BUSY' | 'OFF_DUTY'>('ALL');
  const [selectedTechForReassign, setSelectedTechForReassign] = useState<string | null>(null);
  const [selectedMachineToMove, setSelectedMachineToMove] = useState<string>('');
  const [reassignSuccess, setReassignSuccess] = useState<string | null>(null);

  // Compute machine load and alarm burden for each technician
  const techLoadStats = useMemo(() => {
    return technicians.map((tech) => {
      const assigned = devices.filter((d) => d.assignedTechnicianId === tech.id);
      const alarmMachines = assigned.filter((d) => d.status === 'ALARM_STOPPED');
      const runningMachines = assigned.filter((d) => d.status === 'RUNNING');
      const totalFactoryDevices = Math.max(1, devices.length);
      const loadPercentage = Math.round((assigned.length / totalFactoryDevices) * 100);

      // Score for routing emergency: lower load + ON_DUTY = higher priority recommendation
      let routingScore = 100 - assigned.length * 25 - alarmMachines.length * 40;
      if (tech.activeStatus === 'OFF_DUTY') routingScore = -100;
      if (tech.activeStatus === 'BUSY') routingScore -= 30;

      return {
        ...tech,
        assignedDevices: assigned,
        alarmDevices: alarmMachines,
        runningDevices: runningMachines,
        loadPercentage,
        routingScore,
      };
    });
  }, [technicians, devices]);

  // Quick proficiency score map for chips on dispatch cards
  const techProficiencyMap = useMemo(() => {
    const map: Record<string, { score: number; repairsCount: number; appliedCount: number }> = {};
    technicians.forEach((tech) => {
      const techLearnings = matchTechLearnings(tech, learnings);
      const repairsCount = techLearnings.length;
      const appliedCount = techLearnings.reduce(
        (acc, l) => acc + (l.timesAppliedSuccessfully || 1),
        0
      );
      const modelsCount = new Set(techLearnings.map((l) => l.machineModel)).size;
      const verifiedCount = techLearnings.filter((l) => l.verified).length;

      const basePoints = Math.min(35, repairsCount * 12);
      const impactPoints = Math.min(38, Math.round(appliedCount * 1.05));
      const versatilityPoints = Math.min(15, modelsCount * 6);
      const verificationBonus =
        repairsCount > 0 ? Math.min(7, Math.round((verifiedCount / repairsCount) * 7)) : 0;
      const roleBonus = tech.role.toLowerCase().includes('trưởng')
        ? 5
        : tech.role.toLowerCase().includes('chuyên viên') ||
          tech.role.toLowerCase().includes('kỹ sư')
        ? 3
        : 0;

      const score = Math.min(
        100,
        Math.max(35, basePoints + impactPoints + versatilityPoints + verificationBonus + roleBonus)
      );
      map[tech.id] = { score, repairsCount, appliedCount };
    });
    return map;
  }, [technicians, learnings]);

  // Find the most available on-duty technician for quick dispatch recommendation
  const recommendedTech = useMemo(() => {
    const onDutyTechs = techLoadStats.filter((t) => t.activeStatus === 'ON_DUTY');
    if (onDutyTechs.length === 0) return techLoadStats[0] || null;
    return [...onDutyTechs].sort((a, b) => b.routingScore - a.routingScore)[0];
  }, [techLoadStats]);

  // Overall counters
  const onDutyCount = technicians.filter((t) => t.activeStatus === 'ON_DUTY').length;
  const busyCount = technicians.filter((t) => t.activeStatus === 'BUSY').length;
  const offDutyCount = technicians.filter((t) => t.activeStatus === 'OFF_DUTY').length;

  // Filtered list
  const filteredTechs = useMemo(() => {
    if (filterTab === 'ALL') return techLoadStats;
    return techLoadStats.filter((t) => t.activeStatus === filterTab);
  }, [techLoadStats, filterTab]);

  // Handle reassigning a machine to a different technician
  const handleExecuteReassign = (targetTechId: string) => {
    if (!selectedMachineToMove) return;
    onReassignDevice(selectedMachineToMove, targetTechId);
    const targetTech = technicians.find((t) => t.id === targetTechId);
    const dev = devices.find((d) => d.id === selectedMachineToMove);
    setReassignSuccess(`Đã điều chuyển ${dev?.code || 'thiết bị'} cho KTV ${targetTech?.name || 'mới'}!`);
    setSelectedTechForReassign(null);
    setSelectedMachineToMove('');
    setTimeout(() => setReassignSuccess(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full ${
          sidebarMode === 'SKILLS_CHART'
            ? 'max-w-md sm:max-w-2xl md:max-w-3xl lg:max-w-4xl'
            : sidebarMode === 'PROFICIENCY'
            ? 'max-w-md sm:max-w-xl md:max-w-2xl'
            : 'max-w-md sm:max-w-lg'
        } h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-right`}
      >
        {/* SIDEBAR HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg ${
                sidebarMode === 'SKILLS_CHART'
                  ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-cyan-500/20'
                  : sidebarMode === 'PROFICIENCY'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'
              }`}
            >
              {sidebarMode === 'SKILLS_CHART' ? (
                <BarChart3 className="h-5 w-5" />
              ) : sidebarMode === 'PROFICIENCY' ? (
                <Trophy className="h-5 w-5" />
              ) : (
                <Users className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg">
                  {sidebarMode === 'SKILLS_CHART'
                    ? 'So Sánh Kỹ Năng KTV (Recharts)'
                    : sidebarMode === 'PROFICIENCY'
                    ? 'Bảng Điểm Thành Thạo KTV'
                    : 'Trạng Thái & Điều Phối KTV'}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                    sidebarMode === 'SKILLS_CHART'
                      ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300'
                      : sidebarMode === 'PROFICIENCY'
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                      : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {sidebarMode === 'SKILLS_CHART'
                    ? `${technicians.length} Kỹ Thuật Viên`
                    : sidebarMode === 'PROFICIENCY'
                    ? `${learnings.length} Bài Học AI`
                    : `${onDutyCount}/${technicians.length} Trực Ca`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {sidebarMode === 'SKILLS_CHART'
                  ? 'Trực quan hóa tỷ lệ hoàn thành sửa chữa (%) trên 5 dòng máy EDM/CNC'
                  : sidebarMode === 'PROFICIENCY'
                  ? 'Năng lực xử lý sự cố & kinh nghiệm đã nạp vào bộ não tri thức AI'
                  : 'Giám sát tải phân công máy & tối ưu hóa điều phối sự cố khẩn cấp'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Đóng bảng điều phối"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PRIMARY VIEW TABS SWITCHER: 3-TAB SYSTEM (DISPATCH, PROFICIENCY, RECHARTS SKILLS CHART) */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 px-3 py-2 gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              setSidebarMode('DISPATCH');
              setSelectedTechForProficiency(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-2.5 text-xs font-bold transition ${
              sidebarMode === 'DISPATCH'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-indigo-400" />
            <span>Trực Ca & Tải</span>
          </button>

          <button
            onClick={() => setSidebarMode('PROFICIENCY')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-2.5 text-xs font-bold transition ${
              sidebarMode === 'PROFICIENCY'
                ? 'bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900/60'
            }`}
          >
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>Điểm AI</span>
          </button>

          <button
            onClick={() => setSidebarMode('SKILLS_CHART')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-2.5 text-xs font-bold transition ${
              sidebarMode === 'SKILLS_CHART'
                ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-600/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900/60'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Biểu Đồ Kỹ Năng</span>
            <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.2 text-[9px] font-mono font-bold text-cyan-300">
              Recharts
            </span>
          </button>
        </div>

        {/* REASSIGN SUCCESS TOAST */}
        {reassignSuccess && (
          <div className="bg-emerald-600 px-4 py-2 text-xs font-bold text-white flex items-center gap-2 animate-in slide-in-from-top">
            <CheckCircle2 className="h-4 w-4" />
            <span>{reassignSuccess}</span>
          </div>
        )}

        {/* CONTENT SWITCH: SKILLS CHART VIEW */}
        {sidebarMode === 'SKILLS_CHART' ? (
          <TechnicianSkillsComparisonChart
            technicians={technicians}
            learnings={learnings}
            devices={devices}
            onSelectTechForDispatch={(techId) => {
              setSelectedTechForReassign(techId);
              setSidebarMode('DISPATCH');
            }}
            onOpenMachineDetails={onOpenMachineDetails}
          />
        ) : sidebarMode === 'PROFICIENCY' ? (
          <TechnicianProficiencyScore
            technicians={technicians}
            learnings={learnings}
            devices={devices}
            selectedTechId={selectedTechForProficiency}
            onSelectTechForDispatch={(techId) => {
              setSelectedTechForReassign(techId);
              setSidebarMode('DISPATCH');
            }}
            onNavigateToLearningsTab={onNavigateToLearningsTab}
            onOpenMachineDetails={onOpenMachineDetails}
            onOpenSkillsChart={() => setSidebarMode('SKILLS_CHART')}
          />
        ) : (
          /* CONTENT SWITCH: DISPATCH & LOAD BALANCING VIEW */
          <>
            {/* SUPERVISOR EMERGENCY DISPATCH RECOMMENDATION BOX */}
            {recommendedTech && (
              <div className="border-b border-slate-800 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                      <span>Khuyến Nghị Điều Phối Sự Cố Tiếp Theo</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <img
                        src={recommendedTech.avatar}
                        alt={recommendedTech.name}
                        className="h-8 w-8 rounded-full object-cover border border-indigo-400/50"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {recommendedTech.name}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Đang phụ trách {recommendedTech.assignedDevices.length} máy • Sẵn sàng tiếp nhận tức thì
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`tel:${recommendedTech.phone}`}
                    className="shrink-0 flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition active:scale-95"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Gọi KTV</span>
                  </a>
                </div>
              </div>
            )}

            {/* SHIFT STATUS FILTER TABS */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/50 px-4 py-2">
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setFilterTab('ALL')}
                  className={`rounded-lg px-2.5 py-1 font-medium transition ${
                    filterTab === 'ALL'
                      ? 'bg-slate-800 text-amber-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tất cả ({technicians.length})
                </button>
                <button
                  onClick={() => setFilterTab('ON_DUTY')}
                  className={`rounded-lg px-2.5 py-1 font-medium transition ${
                    filterTab === 'ON_DUTY'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Trong ca ({onDutyCount})
                </button>
                <button
                  onClick={() => setFilterTab('BUSY')}
                  className={`rounded-lg px-2.5 py-1 font-medium transition ${
                    filterTab === 'BUSY'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Đang sửa ({busyCount})
                </button>
                <button
                  onClick={() => setFilterTab('OFF_DUTY')}
                  className={`rounded-lg px-2.5 py-1 font-medium transition ${
                    filterTab === 'OFF_DUTY'
                      ? 'bg-slate-800 text-slate-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Nghỉ ca ({offDutyCount})
                </button>
              </div>
            </div>

            {/* TECHNICIANS LIST & LOAD CARDS */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {filteredTechs.map((tech) => (
                <div
                  key={tech.id}
                  className={`rounded-2xl border p-4 transition-all duration-200 ${
                    tech.alarmDevices.length > 0
                      ? 'border-red-500/60 bg-red-950/20 shadow-lg shadow-red-950/40 ring-1 ring-red-500/30'
                      : tech.activeStatus === 'ON_DUTY'
                      ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      : 'border-slate-800/60 bg-slate-950/30 opacity-75'
                  }`}
                >
                  {/* Technician Profile Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <img
                          src={tech.avatar}
                          alt={tech.name}
                          className="h-11 w-11 rounded-2xl object-cover border border-slate-700"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${
                            tech.activeStatus === 'ON_DUTY'
                              ? 'bg-emerald-400'
                              : tech.activeStatus === 'BUSY'
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-slate-500'
                          }`}
                        ></span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm sm:text-base leading-tight">
                            {tech.name}
                          </h4>
                          {/* Active Status Badge */}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                              tech.activeStatus === 'ON_DUTY'
                                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                : tech.activeStatus === 'BUSY'
                                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {tech.activeStatus === 'ON_DUTY'
                              ? 'Đang Trực Ca'
                              : tech.activeStatus === 'BUSY'
                              ? 'Đang Sửa Máy'
                              : 'Nghỉ Ca'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mt-0.5">{tech.role}</p>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono text-amber-400">
                            <Phone className="h-3 w-3" />
                            {tech.phone}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-300">
                            <Clock className="h-3 w-3 text-cyan-400" />
                            {tech.shift}
                          </span>
                        </div>

                        {/* PROFICIENCY SCORE QUICK-LINK BADGE */}
                        {techProficiencyMap[tech.id] && (
                          <div className="mt-2">
                            <button
                              onClick={() => {
                                setSelectedTechForProficiency(tech.id);
                                setSidebarMode('PROFICIENCY');
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[11px] font-mono text-amber-300 transition group"
                              title="Bấm để xem Bảng Điểm Thành Thạo KTV dựa trên bài học AI"
                            >
                              <Trophy className="h-3 w-3 text-amber-400 group-hover:scale-110 transition-transform" />
                              <span>
                                Điểm Thành Thạo:{' '}
                                <strong className="text-amber-200">
                                  {techProficiencyMap[tech.id].score}/100
                                </strong>
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({techProficiencyMap[tech.id].repairsCount} ca sửa AI)
                              </span>
                              <ArrowRight className="h-3 w-3 text-amber-400/70 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Supervisor Status Toggle Select */}
                    <div className="shrink-0 text-right">
                      <select
                        value={tech.activeStatus}
                        onChange={(e) =>
                          onUpdateTechStatus(tech.id, e.target.value as Technician['activeStatus'])
                        }
                        className="rounded-xl bg-slate-900 border border-slate-700 px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                        title="Chuyển trạng thái trực ca của KTV"
                      >
                        <option value="ON_DUTY">🟢 Sẵn Sàng (On-Duty)</option>
                        <option value="BUSY">🟡 Đang Xử Lý (Busy)</option>
                        <option value="OFF_DUTY">⚪ Nghỉ Ca (Off-Duty)</option>
                      </select>
                    </div>
                  </div>

                  {/* Machine Load Progress Bar */}
                  <div className="mt-3.5 space-y-1.5 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Cpu className="h-3.5 w-3.5 text-amber-400" />
                        <span>Tải máy phụ trách:</span>
                        <strong className="text-white font-mono">
                          {tech.assignedDevices.length} thiết bị
                        </strong>
                      </span>

                      <span
                        className={`font-mono text-[11px] font-bold ${
                          tech.assignedDevices.length >= 3
                            ? 'text-red-400'
                            : tech.assignedDevices.length === 2
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {tech.loadPercentage}% Công suất
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          tech.alarmDevices.length > 0
                            ? 'bg-red-500'
                            : tech.assignedDevices.length >= 3
                            ? 'bg-amber-500'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(12, tech.loadPercentage))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Assigned Machine Chips */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {tech.assignedDevices.length === 0 ? (
                      <span className="text-[11px] italic text-slate-400">
                        Chưa phân công máy (Sẵn sàng nhận lệnh điều phối)
                      </span>
                    ) : (
                      tech.assignedDevices.map((dev) => (
                        <div
                          key={dev.id}
                          onClick={() => onOpenMachineDetails && onOpenMachineDetails(dev)}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition cursor-pointer ${
                            dev.status === 'ALARM_STOPPED'
                              ? 'bg-red-500/20 border border-red-500/50 text-red-300 animate-pulse hover:bg-red-500/30'
                              : 'bg-slate-900 border border-slate-700/80 text-slate-200 hover:border-amber-500 hover:text-amber-300'
                          }`}
                          title={`${dev.name} - Bấm để xem chi tiết`}
                        >
                          {dev.status === 'ALARM_STOPPED' ? (
                            <AlertTriangle className="h-3 w-3 text-red-400" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                          )}
                          <span>{dev.code}</span>
                          {dev.status === 'ALARM_STOPPED' && (
                            <span className="text-[9px] font-bold text-red-400 uppercase">
                              Dừng!
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Supervisor Reassign Machine Action Drawer */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    {selectedTechForReassign === tech.id ? (
                      <div className="w-full flex items-center gap-2 animate-in fade-in">
                        <select
                          value={selectedMachineToMove}
                          onChange={(e) => setSelectedMachineToMove(e.target.value)}
                          className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-white font-mono"
                        >
                          <option value="">-- Chọn máy cần chuyển cho {tech.name.split(' ')[0]} --</option>
                          {devices.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.code} - {d.name} ({d.status === 'ALARM_STOPPED' ? '🚨 DỪNG' : 'Đang chạy'})
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleExecuteReassign(tech.id)}
                          disabled={!selectedMachineToMove}
                          className="rounded-xl bg-amber-500 disabled:opacity-50 hover:bg-amber-400 px-3 py-1 text-xs font-bold text-slate-950"
                        >
                          Chuyển
                        </button>

                        <button
                          onClick={() => setSelectedTechForReassign(null)}
                          className="rounded-xl border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectedTechForReassign(tech.id)}
                          className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 text-[11px] transition"
                        >
                          <UserCog className="h-3.5 w-3.5" />
                          <span>Điều phối / Nhận thêm máy</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {tech.alarmDevices.length > 0 && onOpenPhoneView && (
                            <button
                              onClick={() => onOpenPhoneView(tech.alarmDevices[0])}
                              className="flex items-center gap-1 rounded bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-semibold text-red-300 hover:bg-red-500/30"
                              title="Xem thông báo gửi tới điện thoại của KTV này"
                            >
                              <span>Xem Push Điện Thoại</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* SIDEBAR FOOTER */}
        <div className="border-t border-slate-800 bg-slate-950/90 p-4 flex items-center justify-between text-xs text-slate-400">
          <span>
            {sidebarMode === 'PROFICIENCY'
              ? 'Hệ thống chuẩn hoá năng lực KTV theo chuẩn Human-in-the-Loop AI'
              : 'Hệ thống giám sát phân quyền & điều phối xưởng EDM 4.0'}
          </span>
          <div className="flex items-center gap-2">
            {sidebarMode === 'PROFICIENCY' && (
              <button
                onClick={() => setSidebarMode('DISPATCH')}
                className="rounded-xl border border-slate-700 hover:border-slate-600 px-3 py-1.5 font-medium text-slate-300 transition"
              >
                Về Điều Phối Ca
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-semibold text-white transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

