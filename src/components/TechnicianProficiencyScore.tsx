import React, { useState, useMemo } from 'react';
import {
  Award,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  ExternalLink,
  Flame,
  Layers,
  Lightbulb,
  Medal,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  User,
  Wrench,
  Zap,
} from 'lucide-react';
import { AILearning, Device, Technician } from '../types';

interface TechnicianProficiencyScoreProps {
  technicians: Technician[];
  learnings: AILearning[];
  devices: Device[];
  selectedTechId?: string | null;
  onSelectTechForDispatch?: (techId: string) => void;
  onNavigateToLearningsTab?: () => void;
  onOpenMachineDetails?: (device: Device) => void;
  onOpenSkillsChart?: () => void;
}

export function matchTechLearnings(tech: Technician, allLearnings: AILearning[]): AILearning[] {
  const normTech = tech.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  const techTokens = normTech.split(' ').filter(Boolean);

  return allLearnings.filter((l) => {
    const normDisc = (l.discoveredBy || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    if (normDisc.includes(normTech)) return true;
    if (techTokens.length >= 2) {
      const lastName = techTokens[techTokens.length - 1];
      const firstName = techTokens[0];
      if (normDisc.includes(lastName) && normDisc.includes(firstName)) return true;
    }
    return false;
  });
}

export const TechnicianProficiencyScore: React.FC<TechnicianProficiencyScoreProps> = ({
  technicians,
  learnings,
  devices,
  selectedTechId,
  onSelectTechForDispatch,
  onNavigateToLearningsTab,
  onOpenMachineDetails,
  onOpenSkillsChart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'SCORE' | 'REPAIRS' | 'IMPACT'>('SCORE');
  const [expandedTechIds, setExpandedTechIds] = useState<Set<string>>(() => {
    // If a specific technician was selected from the main view, expand them by default
    return selectedTechId ? new Set([selectedTechId]) : new Set();
  });
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('ALL');

  // Compute all proficiency metrics
  const proficiencyStats = useMemo(() => {
    const list = technicians.map((tech) => {
      const techLearnings = matchTechLearnings(tech, learnings);
      const completedRepairsCount = techLearnings.length;
      const totalTimesApplied = techLearnings.reduce(
        (sum, l) => sum + (l.timesAppliedSuccessfully || 1),
        0
      );
      const verifiedCount = techLearnings.filter((l) => l.verified).length;

      const modelCounts: Record<string, number> = {};
      techLearnings.forEach((l) => {
        modelCounts[l.machineModel] = (modelCounts[l.machineModel] || 0) + 1;
      });
      const modelsCovered = Object.keys(modelCounts);

      // Proficiency score formula (0-100)
      // 1. Authoring base: up to 35 pts
      const basePoints = Math.min(35, completedRepairsCount * 12);
      // 2. Factory impact (times applied successfully): up to 38 pts
      const impactPoints = Math.min(38, Math.round(totalTimesApplied * 1.05));
      // 3. Machine diversity: up to 15 pts
      const versatilityPoints = Math.min(15, modelsCovered.length * 6);
      // 4. AI verification rate: up to 7 pts
      const verificationBonus =
        completedRepairsCount > 0
          ? Math.min(7, Math.round((verifiedCount / completedRepairsCount) * 7))
          : 0;
      // 5. Seniority baseline
      const roleBonus = tech.role.toLowerCase().includes('trưởng')
        ? 5
        : tech.role.toLowerCase().includes('chuyên viên') ||
          tech.role.toLowerCase().includes('kỹ sư')
        ? 3
        : 0;

      const rawScore = basePoints + impactPoints + versatilityPoints + verificationBonus + roleBonus;
      const proficiencyScore = Math.min(100, Math.max(35, rawScore));

      // Tier classification
      let tier = {
        level: 5,
        title: 'Bậc 5: Chuyên Gia Trưởng EDM',
        badgeBg: 'bg-amber-500/15 border border-amber-500/40 text-amber-300',
        color: 'from-amber-400 to-yellow-500',
        starColor: 'text-amber-400',
      };
      if (proficiencyScore < 60) {
        tier = {
          level: 1,
          title: 'Bậc 1: Kỹ Thuật Viên Tiêu Chuẩn',
          badgeBg: 'bg-slate-700/30 border border-slate-600/40 text-slate-300',
          color: 'from-slate-400 to-slate-500',
          starColor: 'text-slate-400',
        };
      } else if (proficiencyScore < 72) {
        tier = {
          level: 2,
          title: 'Bậc 2: Kỹ Thuật Viên Vận Hành Thực Chiến',
          badgeBg: 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300',
          color: 'from-emerald-400 to-teal-500',
          starColor: 'text-emerald-400',
        };
      } else if (proficiencyScore < 82) {
        tier = {
          level: 3,
          title: 'Bậc 3: Chuyên Viên Xử Lý Sự Cố',
          badgeBg: 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300',
          color: 'from-cyan-400 to-blue-500',
          starColor: 'text-cyan-400',
        };
      } else if (proficiencyScore < 92) {
        tier = {
          level: 4,
          title: 'Bậc 4: Kỹ Sư Công Nghệ Cấp Cao',
          badgeBg: 'bg-indigo-500/15 border border-indigo-500/40 text-indigo-300',
          color: 'from-indigo-400 to-purple-500',
          starColor: 'text-indigo-400',
        };
      }

      return {
        tech,
        learnings: techLearnings,
        completedRepairsCount,
        totalTimesApplied,
        verifiedCount,
        modelsCovered,
        modelCounts,
        proficiencyScore,
        tier,
      };
    });

    // Sort by score first to determine ranks
    const sortedByScore = [...list].sort((a, b) => b.proficiencyScore - a.proficiencyScore);
    return sortedByScore.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [technicians, learnings]);

  // Unique models list
  const allModels = useMemo(() => {
    const set = new Set<string>();
    learnings.forEach((l) => set.add(l.machineModel));
    return ['ALL', ...Array.from(set)];
  }, [learnings]);

  // Filtered and sorted display list
  const filteredTechs = useMemo(() => {
    return proficiencyStats
      .filter((item) => {
        const matchesSearch =
          item.tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tech.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.modelsCovered.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.learnings.some((l) =>
            l.errorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.title.toLowerCase().includes(searchQuery.toLowerCase())
          );

        const matchesModel =
          selectedModelFilter === 'ALL' || item.modelsCovered.includes(selectedModelFilter);

        return matchesSearch && matchesModel;
      })
      .sort((a, b) => {
        if (sortBy === 'SCORE') return b.proficiencyScore - a.proficiencyScore;
        if (sortBy === 'REPAIRS') return b.completedRepairsCount - a.completedRepairsCount;
        if (sortBy === 'IMPACT') return b.totalTimesApplied - a.totalTimesApplied;
        return 0;
      });
  }, [proficiencyStats, searchQuery, selectedModelFilter, sortBy]);

  // Aggregate stats across team
  const aggregateStats = useMemo(() => {
    const totalFleetRepairs = proficiencyStats.reduce(
      (acc, t) => acc + t.completedRepairsCount,
      0
    );
    const totalFleetApplied = proficiencyStats.reduce(
      (acc, t) => acc + t.totalTimesApplied,
      0
    );
    const avgScore = Math.round(
      proficiencyStats.reduce((acc, t) => acc + t.proficiencyScore, 0) /
        Math.max(1, proficiencyStats.length)
    );
    const topPerformer = proficiencyStats[0];

    return {
      totalFleetRepairs,
      totalFleetApplied,
      avgScore,
      topPerformer,
    };
  }, [proficiencyStats]);

  const toggleExpand = (techId: string) => {
    setExpandedTechIds((prev) => {
      const next = new Set(prev);
      if (next.has(techId)) {
        next.delete(techId);
      } else {
        next.add(techId);
      }
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* HERO BANNER & KPI STRIP */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/70 via-purple-950/40 to-slate-900 p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20">
                <Trophy className="h-4 w-4 font-bold" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                AI Knowledge Contributions
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-white">
              Bảng Điểm Thành Thạo Kỹ Thuật Viên
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed max-w-lg">
              Đánh giá năng lực dựa trên số ca khắc phục sự cố thành công được hệ thống AI ghi nhớ và nhân bản hiệu quả cho toàn nhà máy.
            </p>
          </div>

          {aggregateStats.topPerformer && (
            <div className="hidden sm:flex flex-col items-end shrink-0 text-right">
              <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Dẫn đầu xưởng
              </span>
              <span className="text-xs font-bold text-white mt-0.5">
                {aggregateStats.topPerformer.tech.name}
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-300">
                {aggregateStats.topPerformer.proficiencyScore}/100 Điểm
              </span>
            </div>
          )}
        </div>

        {/* Aggregate KPI Grid */}
        <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-indigo-500/20 pt-3">
          <div className="rounded-xl bg-slate-900/60 border border-indigo-500/20 p-2 text-center">
            <span className="text-base sm:text-lg font-bold text-amber-300 font-mono block">
              {aggregateStats.totalFleetRepairs}
            </span>
            <span className="text-[10px] text-slate-400">Ca sửa đã dạy AI</span>
          </div>
          <div className="rounded-xl bg-slate-900/60 border border-indigo-500/20 p-2 text-center">
            <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono block">
              {aggregateStats.totalFleetApplied}
            </span>
            <span className="text-[10px] text-slate-400">Lần áp dụng lại</span>
          </div>
          <div className="rounded-xl bg-slate-900/60 border border-indigo-500/20 p-2 text-center">
            <span className="text-base sm:text-lg font-bold text-cyan-300 font-mono block">
              {aggregateStats.avgScore}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </span>
            <span className="text-[10px] text-slate-400">Điểm TB toàn đội</span>
          </div>
        </div>
      </div>

      {/* QUICK LAUNCHER: RECHARTS SKILLS COMPARISON CHART BANNER */}
      {onOpenSkillsChart && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900 p-3 sm:p-3.5 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h5 className="font-bold text-white text-xs sm:text-sm">
                  Biểu Đồ So Sánh Kỹ Năng Recharts
                </h5>
                <span className="rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 text-[9px] font-mono font-bold">
                  Mới
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Trực quan hóa tỷ lệ hoàn thành sửa chữa (%) trên 5 dòng máy Sodick, Makino, GF Agie, Fanuc...
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSkillsChart}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-600/20 transition active:scale-95"
          >
            <span>Mở Biểu Đồ</span>
            <TrendingUp className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* FILTER & SORT CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên KTV, mã lỗi hoặc dòng máy..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Model Filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedModelFilter}
            onChange={(e) => setSelectedModelFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            title="Lọc theo dòng máy"
          >
            {allModels.map((m) => (
              <option key={m} value={m}>
                {m === 'ALL' ? 'Tất cả dòng máy' : m}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-amber-300 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            title="Sắp xếp danh sách"
          >
            <option value="SCORE">Điểm thành thạo cao nhất</option>
            <option value="REPAIRS">Số ca sửa AI nhiều nhất</option>
            <option value="IMPACT">Lượt áp dụng thực tế cao nhất</option>
          </select>
        </div>
      </div>

      {/* TECHNICIAN PROFICIENCY CARDS LIST */}
      <div className="space-y-3.5">
        {filteredTechs.map((item) => {
          const isExpanded = expandedTechIds.has(item.tech.id);
          const medal =
            item.rank === 1
              ? { icon: '🥇', label: 'Quán Quân', ring: 'ring-2 ring-amber-400/80' }
              : item.rank === 2
              ? { icon: '🥈', label: 'Á Quân', ring: 'ring-1 ring-slate-300/80' }
              : item.rank === 3
              ? { icon: '🥉', label: 'Hạng Ba', ring: 'ring-1 ring-amber-600/70' }
              : { icon: `#${item.rank}`, label: `Hạng ${item.rank}`, ring: '' };

          return (
            <div
              key={item.tech.id}
              className={`rounded-2xl border transition-all duration-200 bg-slate-950/70 ${
                item.rank === 1
                  ? 'border-amber-500/40 shadow-lg shadow-amber-950/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* TOP HEADER ROW: AVATAR, NAME, RANK, SCORE */}
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Avatar with rank medal */}
                    <div className="relative">
                      <img
                        src={item.tech.avatar}
                        alt={item.tech.name}
                        className={`h-12 w-12 rounded-2xl object-cover border border-slate-700 ${medal.ring}`}
                      />
                      <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold shadow border border-slate-700">
                        {medal.icon}
                      </span>
                      <span
                        className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${
                          item.tech.activeStatus === 'ON_DUTY'
                            ? 'bg-emerald-400'
                            : item.tech.activeStatus === 'BUSY'
                            ? 'bg-amber-400'
                            : 'bg-slate-500'
                        }`}
                        title={
                          item.tech.activeStatus === 'ON_DUTY'
                            ? 'Đang trực ca'
                            : item.tech.activeStatus === 'BUSY'
                            ? 'Đang sửa máy'
                            : 'Nghỉ ca'
                        }
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-sm sm:text-base leading-tight">
                          {item.tech.name}
                        </h4>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${item.tier.badgeBg}`}
                        >
                          {item.tier.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.tech.role}</p>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                        <span className="text-amber-400">{item.tech.phone}</span>
                        <span>•</span>
                        <span>{item.tech.shift}</span>
                      </div>
                    </div>
                  </div>

                  {/* PROFICIENCY SCORE NUMBER DISPLAY */}
                  <div className="text-right shrink-0">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500">
                        {item.proficiencyScore}
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-bold">/100</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      ĐIỂM THÀNH THẠO
                    </span>
                  </div>
                </div>

                {/* SCORE PROGRESS BAR */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <TrendingUp className="h-3 w-3 text-amber-400" />
                      <span>Chỉ số đóng góp AI xưởng:</span>
                    </span>
                    <span className="font-mono text-amber-300 font-bold">
                      {item.proficiencyScore >= 90
                        ? 'Xuất Sắc (Master)'
                        : item.proficiencyScore >= 80
                        ? 'Rất Tốt (Senior)'
                        : item.proficiencyScore >= 70
                        ? 'Thành Thạo (Skilled)'
                        : 'Tiêu Chuẩn'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${item.tier.color}`}
                      style={{ width: `${Math.max(10, item.proficiencyScore)}%` }}
                    />
                  </div>
                </div>

                {/* 4-METRIC GRID: REPAIRS, APPLICATIONS, VERIFIED, MODELS */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-2">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Wrench className="h-3 w-3 text-amber-400" />
                      <span>Ca sửa nạp AI:</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-base font-bold font-mono text-white">
                        {item.completedRepairsCount}
                      </span>
                      <span className="text-[10px] text-slate-400">bài học</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-2">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Zap className="h-3 w-3 text-emerald-400" />
                      <span>Lượt áp dụng:</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-base font-bold font-mono text-emerald-300">
                        {item.totalTimesApplied}
                      </span>
                      <span className="text-[10px] text-slate-400">lần thành công</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-2">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <ShieldCheck className="h-3 w-3 text-cyan-400" />
                      <span>Kiểm chứng:</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-base font-bold font-mono text-cyan-300">
                        {item.completedRepairsCount > 0 ? '100%' : 'N/A'}
                      </span>
                      <span className="text-[10px] text-slate-400">chuẩn hoá</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-900/80 border border-slate-800/80 p-2">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Cpu className="h-3 w-3 text-purple-400" />
                      <span>Dòng máy:</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-base font-bold font-mono text-purple-300">
                        {item.modelsCovered.length}
                      </span>
                      <span className="text-[10px] text-slate-400">model EDM</span>
                    </div>
                  </div>
                </div>

                {/* MACHINE MODEL PROFICIENCY DISTRIBUTION PILLS */}
                {item.modelsCovered.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">Dải máy am hiểu:</span>
                    {item.modelsCovered.map((model) => (
                      <span
                        key={model}
                        className="rounded-lg bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300 flex items-center gap-1"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        <span>{model}</span>
                        <span className="text-amber-400 font-bold">({item.modelCounts[model]})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* EXPANDABLE ACCORDION: AI-LOGGED LEARNINGS & REPAIR STORIES */}
              <div className="border-t border-slate-800/80 bg-slate-900/40">
                <button
                  onClick={() => toggleExpand(item.tech.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-300 hover:text-white transition font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-indigo-400" />
                    <span>
                      Chi tiết {item.learnings.length} ca sửa & giải pháp AI đã đúc kết
                    </span>
                  </span>

                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="text-[11px]">{isExpanded ? 'Thu gọn' : 'Xem chi tiết'}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-3 animate-in fade-in duration-200">
                    {item.learnings.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-400">
                        Chưa có ca sửa nào được nạp vào bộ não AI từ KTV này.
                      </div>
                    ) : (
                      item.learnings.map((learning) => (
                        <div
                          key={learning.id}
                          className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2 hover:border-slate-700 transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="rounded bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-red-300">
                                {learning.errorCode}
                              </span>
                              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                                {learning.machineModel}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {learning.learnedAt}
                              </span>
                            </div>

                            <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Đã áp dụng {learning.timesAppliedSuccessfully} lần</span>
                            </span>
                          </div>

                          <h5 className="text-xs sm:text-sm font-bold text-white leading-snug">
                            {learning.title}
                          </h5>

                          {/* Problem & Solution */}
                          <div className="space-y-1.5 text-xs text-slate-300">
                            <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800/80">
                              <span className="font-bold text-amber-400 text-[11px] block mb-0.5">
                                🔧 Giải pháp thực tế của KTV:
                              </span>
                              <p className="text-[11px] text-slate-300 leading-relaxed">
                                {learning.humanSolution}
                              </p>
                            </div>

                            <div className="rounded-lg bg-indigo-950/30 p-2.5 border border-indigo-500/20">
                              <span className="font-bold text-indigo-300 text-[11px] flex items-center gap-1 mb-0.5">
                                <Sparkles className="h-3 w-3 text-indigo-400" />
                                <span>Quy tắc AI đúc kết cho toàn xưởng:</span>
                              </span>
                              <p className="text-[11px] text-indigo-200/90 leading-relaxed italic">
                                &ldquo;{learning.aiSynthesizedRule}&rdquo;
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Quick navigation to full AI Learnings tab */}
                    {onNavigateToLearningsTab && (
                      <div className="pt-1 flex items-center justify-between text-xs">
                        <button
                          onClick={onNavigateToLearningsTab}
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px] font-medium transition"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Mở trong Tab Bộ Não Tri Thức AI</span>
                        </button>

                        {onSelectTechForDispatch && (
                          <button
                            onClick={() => onSelectTechForDispatch(item.tech.id)}
                            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-medium transition"
                          >
                            <span>Điều phối máy theo chuyên môn</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
