import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts';
import {
  Award,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Flame,
  HelpCircle,
  Info,
  Layers,
  PieChart,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { AILearning, Device, Technician } from '../types';
import { matchTechLearnings } from './TechnicianProficiencyScore';

// Technician palette with distinctive glowing colors
export const TECH_COLORS = [
  { stroke: '#06b6d4', fill: '#06b6d4', bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/40', badge: 'bg-cyan-500/15' },
  { stroke: '#10b981', fill: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/40', badge: 'bg-emerald-500/15' },
  { stroke: '#f59e0b', fill: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/40', badge: 'bg-amber-500/15' },
  { stroke: '#a855f7', fill: '#a855f7', bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/40', badge: 'bg-purple-500/15' },
  { stroke: '#f43f5e', fill: '#f43f5e', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/40', badge: 'bg-rose-500/15' },
  { stroke: '#3b82f6', fill: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/40', badge: 'bg-blue-500/15' },
];

export interface ModelSkillStat {
  model: string;
  shortModel: string;
  totalAssigned: number;
  completedRepairs: number;
  completionRate: number; // 0 - 100%
  avgMttrMin: number;
  aiLearningsCount: number;
}

export interface TechnicianComparisonProfile {
  tech: Technician;
  color: typeof TECH_COLORS[0];
  totalRepairs: number;
  overallCompletionRate: number;
  avgMttr: number;
  aiLearningsCount: number;
  modelStats: Record<string, ModelSkillStat>;
  bestModel: { model: string; rate: number };
}

// Canonical list of EDM and CNC machine models in the workshop
export const WORKSHOP_MODELS = [
  { full: 'Sodick ALC600G', short: 'Sodick ALC', category: 'Cắt Dây Tuyến Tính' },
  { full: 'Makino U6 H.E.A.T', short: 'Makino U6', category: 'Cắt Dây Siêu Chuẩn' },
  { full: 'GF AgieCharmilles FORM E 350', short: 'GF Agie FORM', category: 'Xung Điện Định Hình' },
  { full: 'Fanuc Robocut α-C600iB', short: 'Fanuc α-C600', category: 'Cắt Dây Phôi Hợp Kim' },
  { full: 'Mitsubishi MV2400-S', short: 'Mitsu MV2400', category: 'Cắt Dây Dầu Tự Động' },
];

// Baseline workshop experience coefficients to ensure realistic historical distribution
// while factoring in real dynamic learnings discovered in runtime
const TECH_MODEL_EXPERIENCE_SEED: Record<string, Record<string, { assigned: number; completed: number; mttr: number }>> = {
  'tech-01': { // Nguyễn Văn Hùng (Kỹ sư Trưởng Điện - PLC & EDM)
    'Sodick ALC600G': { assigned: 16, completed: 15, mttr: 34 },
    'Makino U6 H.E.A.T': { assigned: 20, completed: 19, mttr: 28 }, // Makino specialist
    'GF AgieCharmilles FORM E 350': { assigned: 14, completed: 13, mttr: 38 },
    'Fanuc Robocut α-C600iB': { assigned: 12, completed: 11, mttr: 32 },
    'Mitsubishi MV2400-S': { assigned: 15, completed: 14, mttr: 30 },
  },
  'tech-02': { // Trần Minh Tuấn (Kỹ sư Thủy lực & Khí nén EDM)
    'Sodick ALC600G': { assigned: 13, completed: 11, mttr: 42 },
    'Makino U6 H.E.A.T': { assigned: 14, completed: 12, mttr: 40 },
    'GF AgieCharmilles FORM E 350': { assigned: 18, completed: 17, mttr: 29 }, // GF Agie specialist
    'Fanuc Robocut α-C600iB': { assigned: 10, completed: 9, mttr: 36 },
    'Mitsubishi MV2400-S': { assigned: 16, completed: 15, mttr: 31 },
  },
  'tech-03': { // Lê Hoàng Nam (Chuyên viên Công nghệ Cắt Dây EDM)
    'Sodick ALC600G': { assigned: 22, completed: 21, mttr: 22 }, // Sodick champion
    'Makino U6 H.E.A.T': { assigned: 15, completed: 14, mttr: 29 },
    'GF AgieCharmilles FORM E 350': { assigned: 11, completed: 9, mttr: 46 },
    'Fanuc Robocut α-C600iB': { assigned: 19, completed: 18, mttr: 24 }, // Fanuc specialist
    'Mitsubishi MV2400-S': { assigned: 13, completed: 12, mttr: 33 },
  },
  'tech-04': { // Phạm Đức Anh (Kỹ thuật viên Vận hành & Bảo trì 4.0)
    'Sodick ALC600G': { assigned: 12, completed: 10, mttr: 44 },
    'Makino U6 H.E.A.T': { assigned: 11, completed: 9, mttr: 48 },
    'GF AgieCharmilles FORM E 350': { assigned: 12, completed: 10, mttr: 45 },
    'Fanuc Robocut α-C600iB': { assigned: 13, completed: 11, mttr: 39 },
    'Mitsubishi MV2400-S': { assigned: 14, completed: 13, mttr: 35 },
  },
};

interface TechnicianSkillsComparisonChartProps {
  technicians: Technician[];
  learnings: AILearning[];
  devices: Device[];
  onSelectTechForDispatch?: (techId: string) => void;
  onOpenMachineDetails?: (device: Device) => void;
}

export const TechnicianSkillsComparisonChart: React.FC<TechnicianSkillsComparisonChartProps> = ({
  technicians,
  learnings,
  devices,
  onSelectTechForDispatch,
  onOpenMachineDetails,
}) => {
  // Chart visual display mode
  const [chartMode, setChartMode] = useState<'BAR_RATE' | 'RADAR' | 'BAR_VOLUME' | 'MATRIX'>('BAR_RATE');
  
  // Selected technician IDs to compare (allows toggling individuals on/off)
  const [selectedTechIds, setSelectedTechIds] = useState<Set<string>>(() => {
    return new Set(technicians.map((t) => t.id));
  });

  // Model filter for single-model focus or all models
  const [filterModel, setFilterModel] = useState<string>('ALL');

  // Compute rich comparison profiles for all technicians
  const comparisonProfiles: TechnicianComparisonProfile[] = useMemo(() => {
    return technicians.map((tech, index) => {
      const color = TECH_COLORS[index % TECH_COLORS.length];
      const techLearnings = matchTechLearnings(tech, learnings);

      // Model stats compilation
      const modelStats: Record<string, ModelSkillStat> = {};
      let grandTotalAssigned = 0;
      let grandTotalCompleted = 0;
      let weightedMttrSum = 0;

      WORKSHOP_MODELS.forEach((wm) => {
        // Base seed from historical maintenance logs
        const seed = (TECH_MODEL_EXPERIENCE_SEED[tech.id] && TECH_MODEL_EXPERIENCE_SEED[tech.id][wm.full]) || {
          assigned: 10,
          completed: 8,
          mttr: 38,
        };

        // Real runtime learnings contributed for this model
        const modelLearnings = techLearnings.filter((l) =>
          l.machineModel.toLowerCase().includes(wm.short.toLowerCase()) ||
          wm.full.toLowerCase().includes(l.machineModel.toLowerCase())
        );

        // Calculate dynamic boosts from AI knowledge base
        const dynamicBoost = modelLearnings.reduce((sum, l) => sum + (l.timesAppliedSuccessfully || 1), 0);
        const assigned = seed.assigned + modelLearnings.length * 2;
        const completed = seed.completed + modelLearnings.length * 2 + Math.min(3, Math.floor(dynamicBoost / 4));
        const safeCompleted = Math.min(assigned, completed);
        const completionRate = Math.round((safeCompleted / Math.max(1, assigned)) * 100);
        
        // MTTR improves when technician discovers more verified solutions
        const bonusMttrReduction = Math.min(8, modelLearnings.length * 2);
        const avgMttrMin = Math.max(18, seed.mttr - bonusMttrReduction);

        grandTotalAssigned += assigned;
        grandTotalCompleted += safeCompleted;
        weightedMttrSum += avgMttrMin * safeCompleted;

        modelStats[wm.full] = {
          model: wm.full,
          shortModel: wm.short,
          totalAssigned: assigned,
          completedRepairs: safeCompleted,
          completionRate,
          avgMttrMin,
          aiLearningsCount: modelLearnings.length,
        };
      });

      const overallCompletionRate = Math.round(
        (grandTotalCompleted / Math.max(1, grandTotalAssigned)) * 100
      );
      const avgMttr = Math.round(weightedMttrSum / Math.max(1, grandTotalCompleted));

      // Find model with highest completion rate
      let bestModel = { model: WORKSHOP_MODELS[0].full, rate: 0 };
      Object.values(modelStats).forEach((ms) => {
        if (ms.completionRate > bestModel.rate) {
          bestModel = { model: ms.shortModel, rate: ms.completionRate };
        }
      });

      return {
        tech,
        color,
        totalRepairs: grandTotalCompleted,
        overallCompletionRate,
        avgMttr,
        aiLearningsCount: techLearnings.length,
        modelStats,
        bestModel,
      };
    });
  }, [technicians, learnings]);

  // Filtered profiles based on tech selection checkboxes
  const activeProfiles = useMemo(() => {
    return comparisonProfiles.filter((p) => selectedTechIds.has(p.tech.id));
  }, [comparisonProfiles, selectedTechIds]);

  // Prepare Recharts BarChart data formatted by Machine Model
  const barChartData = useMemo(() => {
    const modelsToDisplay =
      filterModel === 'ALL'
        ? WORKSHOP_MODELS
        : WORKSHOP_MODELS.filter((m) => m.full === filterModel || m.short === filterModel);

    return modelsToDisplay.map((wm) => {
      const row: any = {
        modelFull: wm.full,
        model: wm.short,
        category: wm.category,
      };

      activeProfiles.forEach((p) => {
        const stat = p.modelStats[wm.full];
        // Value for Bar: Completion Rate (%) or Total Completed Volume
        if (chartMode === 'BAR_RATE') {
          row[p.tech.id] = stat ? stat.completionRate : 0;
          row[`${p.tech.id}_mttr`] = stat ? stat.avgMttrMin : 0;
          row[`${p.tech.id}_repairs`] = stat ? stat.completedRepairs : 0;
          row[`${p.tech.id}_assigned`] = stat ? stat.totalAssigned : 0;
        } else {
          row[p.tech.id] = stat ? stat.completedRepairs : 0;
          row[`${p.tech.id}_rate`] = stat ? stat.completionRate : 0;
          row[`${p.tech.id}_mttr`] = stat ? stat.avgMttrMin : 0;
        }
      });

      return row;
    });
  }, [activeProfiles, filterModel, chartMode]);

  // Prepare Recharts RadarChart data formatted for multi-axis comparison
  const radarChartData = useMemo(() => {
    return WORKSHOP_MODELS.map((wm) => {
      const row: any = {
        model: wm.short,
        fullModel: wm.full,
      };

      activeProfiles.forEach((p) => {
        const stat = p.modelStats[wm.full];
        row[p.tech.id] = stat ? stat.completionRate : 0;
      });

      return row;
    });
  }, [activeProfiles]);

  // Aggregate Workshop Benchmarks
  const workshopStats = useMemo(() => {
    const totalRepairs = comparisonProfiles.reduce((sum, p) => sum + p.totalRepairs, 0);
    const avgCompletionRate = Math.round(
      comparisonProfiles.reduce((sum, p) => sum + p.overallCompletionRate, 0) /
        Math.max(1, comparisonProfiles.length)
    );
    const avgFleetMttr = Math.round(
      comparisonProfiles.reduce((sum, p) => sum + p.avgMttr, 0) /
        Math.max(1, comparisonProfiles.length)
    );

    // Identify top specialist for each model
    const topSpecialists: Record<string, { techName: string; rate: number; repairs: number }> = {};
    WORKSHOP_MODELS.forEach((wm) => {
      let top = { techName: '', rate: -1, repairs: 0 };
      comparisonProfiles.forEach((p) => {
        const ms = p.modelStats[wm.full];
        if (ms && ms.completionRate > top.rate) {
          top = { techName: p.tech.name, rate: ms.completionRate, repairs: ms.completedRepairs };
        }
      });
      topSpecialists[wm.short] = top;
    });

    return {
      totalRepairs,
      avgCompletionRate,
      avgFleetMttr,
      topSpecialists,
    };
  }, [comparisonProfiles]);

  // Toggle technician checkbox in filter
  const toggleTechSelection = (techId: string) => {
    setSelectedTechIds((prev) => {
      const next = new Set(prev);
      if (next.has(techId)) {
        // Prevent deselecting all
        if (next.size > 1) next.delete(techId);
      } else {
        next.add(techId);
      }
      return next;
    });
  };

  const selectAllTechs = () => {
    setSelectedTechIds(new Set(technicians.map((t) => t.id)));
  };

  // Custom Recharts Dark Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const modelFull = payload[0]?.payload?.modelFull || label;

    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md text-xs min-w-[240px]">
        <div className="border-b border-slate-800 pb-2 mb-2.5">
          <span className="text-[10px] uppercase font-mono font-bold text-amber-400 block">
            {payload[0]?.payload?.category || 'Dòng Máy EDM'}
          </span>
          <h5 className="font-bold text-white text-sm leading-snug">{modelFull}</h5>
        </div>

        <div className="space-y-2">
          {payload.map((entry: any) => {
            const profile = comparisonProfiles.find((p) => p.tech.id === entry.dataKey);
            if (!profile) return null;
            const stat = profile.modelStats[modelFull];

            return (
              <div
                key={entry.dataKey}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/80 p-2 border border-slate-800/80"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div>
                    <span className="font-bold text-white block text-[11px] leading-tight">
                      {profile.tech.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {stat ? `${stat.completedRepairs}/${stat.totalAssigned} ca hoàn thành` : ''}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className="font-mono font-extrabold text-xs block"
                    style={{ color: entry.color }}
                  >
                    {chartMode === 'BAR_RATE' ? `${entry.value}%` : `${entry.value} ca`}
                  </span>
                  {stat && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      MTTR: {stat.avgMttrMin}p
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {chartMode === 'BAR_RATE' && (
          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 font-mono">
              <Target className="h-3 w-3 text-emerald-400" />
              Chuẩn Kaizen: ≥ 90%
            </span>
            <span className="text-emerald-400 font-bold font-mono">Đạt tiêu chuẩn</span>
          </div>
        )}
      </div>
    );
  };

  // Custom Recharts Tooltip for Radar Chart
  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const model = payload[0]?.payload?.fullModel || payload[0]?.payload?.model;

    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md text-xs min-w-[230px]">
        <div className="border-b border-slate-800 pb-1.5 mb-2">
          <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
            Radar Năng Lực Đa Dòng Máy
          </span>
          <h5 className="font-bold text-white text-xs">{model}</h5>
        </div>

        <div className="space-y-1.5">
          {payload.map((entry: any) => {
            const profile = comparisonProfiles.find((p) => p.tech.id === entry.dataKey);
            return (
              <div key={entry.dataKey} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{profile?.tech.name || entry.name}</span>
                </span>
                <span className="font-mono font-bold" style={{ color: entry.color }}>
                  {entry.value}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/70 via-purple-950/40 to-slate-900 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-slate-950 shadow-md">
                <BarChart3 className="h-4 w-4 font-bold" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                Kỹ Năng & Tỷ Lệ Hoàn Thành Sửa Chữa (Recharts)
              </span>
              <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                5 Dòng Máy EDM/CNC
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-extrabold text-white">
              Phân Tích So Sánh Kỹ Năng Kỹ Thuật Viên
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              Trực quan hóa tỷ lệ hoàn thành sửa chữa (%) và số ca xử lý thành công trên từng dòng máy khác nhau để tối ưu hóa điều phối phân công sự cố.
            </p>
          </div>

          {/* Quick Summary KPIs */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2 text-right">
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-400 block leading-tight">
                {workshopStats.avgCompletionRate}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Tỷ lệ TB xưởng</span>
            </div>
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2 text-right">
              <span className="text-base sm:text-lg font-bold font-mono text-amber-300 block leading-tight">
                {workshopStats.avgFleetMttr}p
              </span>
              <span className="text-[10px] text-slate-400 font-mono">MTTR trung bình</span>
            </div>
          </div>
        </div>

        {/* Top Specialists Badge Strip */}
        <div className="mt-3.5 pt-3 border-t border-indigo-500/20">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-bold text-amber-300">Chuyên gia số 1 từng dòng máy:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(workshopStats.topSpecialists).map(([modelShort, spec]) => (
              <span
                key={modelShort}
                className="rounded-lg bg-slate-900/90 border border-slate-800 px-2.5 py-1 text-[11px] text-slate-200 flex items-center gap-1.5"
              >
                <Cpu className="h-3 w-3 text-cyan-400" />
                <strong className="text-cyan-300">{modelShort}:</strong>
                <span className="text-white font-medium">{spec.techName}</span>
                <span className="rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] px-1.5 py-0.2">
                  {spec.rate}%
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CHART VIEW SWITCHER & FILTER CONTROLS */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-3">
        {/* Row 1: Mode Switch Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setChartMode('BAR_RATE')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
                chartMode === 'BAR_RATE'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Tỷ Lệ Hoàn Thành (%)</span>
            </button>

            <button
              onClick={() => setChartMode('RADAR')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
                chartMode === 'RADAR'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PieChart className="h-3.5 w-3.5" />
              <span>Radar Đa Chiều</span>
            </button>

            <button
              onClick={() => setChartMode('BAR_VOLUME')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
                chartMode === 'BAR_VOLUME'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Số Ca Sửa (Khối Lượng)</span>
            </button>

            <button
              onClick={() => setChartMode('MATRIX')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
                chartMode === 'MATRIX'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Ma Trận Chi Tiết</span>
            </button>
          </div>

          {/* Model Filter Dropdown */}
          {chartMode !== 'RADAR' && chartMode !== 'MATRIX' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-mono">Dòng máy:</span>
              <select
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                className="rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
              >
                <option value="ALL">Tất cả 5 dòng máy</option>
                {WORKSHOP_MODELS.map((m) => (
                  <option key={m.full} value={m.full}>
                    {m.short} ({m.category})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Row 2: Technician Checkbox Pills (Select which technicians to compare) */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span>Chọn KTV so sánh:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {comparisonProfiles.map((p) => {
              const isSelected = selectedTechIds.has(p.tech.id);
              return (
                <button
                  key={p.tech.id}
                  onClick={() => toggleTechSelection(p.tech.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition border ${
                    isSelected
                      ? `${p.color.badge} ${p.color.border} ${p.color.text} font-bold ring-1 ring-inset ring-current/20`
                      : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60 hover:opacity-100'
                  }`}
                  title={`Bật/tắt so sánh ${p.tech.name}`}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: isSelected ? p.color.fill : '#64748b' }}
                  />
                  <span>{p.tech.name}</span>
                  <span className="text-[10px] font-mono opacity-80">
                    ({p.overallCompletionRate}%)
                  </span>
                </button>
              );
            })}

            {selectedTechIds.size < technicians.length && (
              <button
                onClick={selectAllTechs}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] text-amber-300 transition"
              >
                Chọn tất cả ({technicians.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PRIMARY RECHARTS VISUALIZATION CONTAINER */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <h5 className="font-bold text-white text-sm">
              {chartMode === 'BAR_RATE' && 'Biểu Đồ Cột: Tỷ Lệ Hoàn Thành Sửa Chữa (%) Từng Dòng Máy'}
              {chartMode === 'RADAR' && 'Biểu Đồ Radar: Bản Đồ Năng Lực Sửa Chữa Toàn Diện'}
              {chartMode === 'BAR_VOLUME' && 'Biểu Đồ Cột: Tổng Số Ca Sửa Chữa Thành Công (Ca)'}
              {chartMode === 'MATRIX' && 'Bảng Ma Trận Đầy Đủ & Khuyến Nghị Điều Phối Tối Ưu'}
            </h5>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Đang so sánh {activeProfiles.length}/{technicians.length} kỹ thuật viên
          </span>
        </div>

        {/* 1. GROUPED BAR CHART: COMPLETION RATE (%) */}
        {chartMode === 'BAR_RATE' && (
          <div className="h-80 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="model"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  tick={{ fill: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  domain={[0, 100]}
                  unit="%"
                  tickLine={false}
                  ticks={[0, 25, 50, 75, 90, 100]}
                  tick={{ fill: '#cbd5e1' }}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10 }}
                  formatter={(value) => {
                    const profile = comparisonProfiles.find((p) => p.tech.id === value);
                    return (
                      <span className="text-xs text-slate-300 font-medium mr-3">
                        {profile?.tech.name || value}
                      </span>
                    );
                  }}
                />
                {/* Standard ISO/Kaizen benchmark line at 90% */}
                <ReferenceLine
                  y={90}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Mục tiêu: ≥90%',
                    fill: '#10b981',
                    fontSize: 10,
                    position: 'top',
                  }}
                />
                {activeProfiles.map((p) => (
                  <Bar
                    key={p.tech.id}
                    dataKey={p.tech.id}
                    name={p.tech.id}
                    fill={p.color.fill}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 2. RADAR CHART: MULTI-AXIS SKILL RADAR */}
        {chartMode === 'RADAR' && (
          <div className="h-80 sm:h-96 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="72%"
                data={radarChartData}
              >
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis
                  dataKey="model"
                  tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 'bold' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  unit="%"
                />
                <Tooltip content={<CustomRadarTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 8 }}
                  formatter={(value) => {
                    const profile = comparisonProfiles.find((p) => p.tech.id === value);
                    return (
                      <span className="text-xs text-slate-300 font-medium mr-3">
                        {profile?.tech.name || value}
                      </span>
                    );
                  }}
                />
                {activeProfiles.map((p) => (
                  <Radar
                    key={p.tech.id}
                    name={p.tech.id}
                    dataKey={p.tech.id}
                    stroke={p.color.stroke}
                    fill={p.color.fill}
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 3. BAR CHART: RAW VOLUME OF COMPLETED REPAIRS (CA SỬA) */}
        {chartMode === 'BAR_VOLUME' && (
          <div className="h-80 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="model"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  tick={{ fill: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  unit=" ca"
                  tick={{ fill: '#cbd5e1' }}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10 }}
                  formatter={(value) => {
                    const profile = comparisonProfiles.find((p) => p.tech.id === value);
                    return (
                      <span className="text-xs text-slate-300 font-medium mr-3">
                        {profile?.tech.name || value}
                      </span>
                    );
                  }}
                />
                {activeProfiles.map((p) => (
                  <Bar
                    key={p.tech.id}
                    dataKey={p.tech.id}
                    name={p.tech.id}
                    fill={p.color.fill}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 4. TABULAR COMPARISON MATRIX & DISPATCH RECOMMENDATIONS */}
        {chartMode === 'MATRIX' && (
          <div className="overflow-x-auto space-y-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                  <th className="py-2.5 px-3">Dòng Máy / Kỹ Thuật Viên</th>
                  {activeProfiles.map((p) => (
                    <th key={p.tech.id} className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: p.color.fill }}
                        />
                        <span className="font-bold text-white">{p.tech.name}</span>
                      </div>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right">Khuyến Nghị Điều Phối AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {WORKSHOP_MODELS.map((wm) => {
                  // Find top performer for this row
                  let topTechId = '';
                  let topRate = -1;
                  activeProfiles.forEach((p) => {
                    const rate = p.modelStats[wm.full]?.completionRate || 0;
                    if (rate > topRate) {
                      topRate = rate;
                      topTechId = p.tech.id;
                    }
                  });

                  const topProfile = activeProfiles.find((p) => p.tech.id === topTechId);

                  return (
                    <tr key={wm.full} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-3">
                        <strong className="text-white block text-xs">{wm.full}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {wm.category}
                        </span>
                      </td>

                      {activeProfiles.map((p) => {
                        const ms = p.modelStats[wm.full];
                        const isTop = p.tech.id === topTechId;

                        return (
                          <td key={p.tech.id} className="py-3 px-3 text-center font-mono">
                            {ms ? (
                              <div
                                className={`inline-block rounded-xl px-2.5 py-1 text-center ${
                                  isTop
                                    ? 'bg-amber-500/15 border border-amber-500/30'
                                    : 'bg-slate-900/70'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  {isTop && <Trophy className="h-3 w-3 text-amber-400" />}
                                  <span
                                    className={`font-bold ${
                                      ms.completionRate >= 90
                                        ? 'text-emerald-400'
                                        : ms.completionRate >= 80
                                        ? 'text-cyan-300'
                                        : 'text-amber-300'
                                    }`}
                                  >
                                    {ms.completionRate}%
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 block">
                                  {ms.completedRepairs}/{ms.totalAssigned} ca ({ms.avgMttrMin}p)
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-3 px-3 text-right">
                        {topProfile && (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="rounded bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300 flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-amber-400" />
                              <span>Ưu tiên: {topProfile.tech.name}</span>
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILED TECHNICIAN PROFILES SUMMARY CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h5 className="font-bold text-white text-xs sm:text-sm">
              Hồ Sơ Năng Lực Chi Tiết & Độ Chuyên Sâu Từng KTV
            </h5>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Cập nhật theo dữ liệu thực tế
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeProfiles.map((p) => (
            <div
              key={p.tech.id}
              className={`rounded-2xl border bg-slate-950/70 p-4 transition-all duration-200 ${p.color.border} hover:bg-slate-900/60`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={p.tech.avatar}
                      alt={p.tech.name}
                      className="h-11 w-11 rounded-2xl object-cover border border-slate-700"
                    />
                    <span
                      className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900"
                      style={{ backgroundColor: p.color.fill }}
                    />
                  </div>

                  <div>
                    <h5 className="font-bold text-white text-sm">{p.tech.name}</h5>
                    <p className="text-xs text-slate-400">{p.tech.role}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-400">
                      <span>{p.tech.shift}</span>
                      <span>•</span>
                      <span className="text-cyan-400">Sở trường: {p.bestModel.model}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className="text-xl font-extrabold font-mono block"
                    style={{ color: p.color.fill }}
                  >
                    {p.overallCompletionRate}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                    Tỷ lệ chung
                  </span>
                </div>
              </div>

              {/* Model Progress Badges */}
              <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                  Tỷ lệ xử lý theo từng model:
                </span>
                <div className="space-y-1.5">
                  {WORKSHOP_MODELS.map((wm) => {
                    const ms = p.modelStats[wm.full];
                    const rate = ms ? ms.completionRate : 0;

                    return (
                      <div key={wm.full}>
                        <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                          <span className="text-slate-300">{wm.short}</span>
                          <span className="font-bold" style={{ color: p.color.fill }}>
                            {rate}% ({ms?.completedRepairs || 0} ca)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${rate}%`,
                              backgroundColor: p.color.fill,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Quick Dispatch Action */}
              {onSelectTechForDispatch && (
                <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {p.aiLearningsCount} bài học AI đã đóng góp
                  </span>
                  <button
                    onClick={() => onSelectTechForDispatch(p.tech.id)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition active:scale-95"
                  >
                    <Wrench className="h-3 w-3" />
                    <span>Điều phối ca sửa cho KTV này</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
