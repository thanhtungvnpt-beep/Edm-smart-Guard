import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Zap,
  Clock,
  CheckCircle2,
  TrendingUp,
  Star,
  Users2,
  Calendar,
  Sparkles,
  PhoneCall,
  ThumbsUp,
  ShieldCheck,
  Flame,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Technician, MaintenanceRecord } from '../../types';
import { getStoredMaintenanceRecords } from '../../utils/maintenanceHistoryData';
import { soundManager } from '../../utils/audio';

export type LeaderboardTimeframe = 'WEEK' | 'MONTH' | 'ALL';
export type LeaderboardSortMetric = 'RESOLVED' | 'MTTR' | 'SCORE';

interface TechnicianRepairLeaderboardProps {
  technicians: Technician[];
  viewportMode: 'PC' | 'MOBILE';
  onToast?: (message: string) => void;
  onOpenRepairReport?: (techName: string) => void;
}

export interface TechnicianPerformanceData {
  id: string;
  name: string;
  role: string;
  avatar: string;
  shift: string;
  phone: string;
  resolvedIncidents: number; // Corrective + Preventive done
  emergencyFixedCount: number; // Urgent breakdowns resolved
  avgMttrMinutes: number; // Mean time to repair
  fastestFixMinutes: number; // Best record
  slaComplianceRate: number; // % in SLA
  firstTimePassRate: number; // % quality passed
  commendationsCount: number; // Leader awards
  specialtyTag: string; // Title / Specialty
  score: number; // Overall performance score 0 - 100
  recentSuccessBadge?: string;
}

export const TechnicianRepairLeaderboard: React.FC<TechnicianRepairLeaderboardProps> = ({
  technicians,
  viewportMode,
  onToast,
  onOpenRepairReport,
}) => {
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('MONTH');
  const [sortBy, setSortBy] = useState<LeaderboardSortMetric>('SCORE');
  const [commendations, setCommendations] = useState<Record<string, number>>({
    'tech-03': 12, // Lê Hoàng Nam
    'tech-01': 10, // Nguyễn Văn Hùng
    'tech-02': 7,  // Trần Minh Tuấn
    'tech-04': 5,  // Phạm Đức Anh
  });
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  // Read stored maintenance records to enrich statistics
  const storedRecords: MaintenanceRecord[] = useMemo(() => {
    try {
      return getStoredMaintenanceRecords();
    } catch {
      return [];
    }
  }, []);

  // Compute live technician ranking metrics
  const performanceData: TechnicianPerformanceData[] = useMemo(() => {
    // Multipliers based on timeframe
    const multiplier = timeframe === 'WEEK' ? 0.35 : timeframe === 'MONTH' ? 1.0 : 2.5;

    // Baselines mapped by technician
    const baselineStats: Record<
      string,
      {
        resolvedBase: number;
        emergencyBase: number;
        avgMttr: number;
        fastestFix: number;
        sla: number;
        firstTime: number;
        specialty: string;
        recentBadge: string;
      }
    > = {
      'tech-03': {
        // Lê Hoàng Nam
        resolvedBase: 26,
        emergencyBase: 11,
        avgMttr: 21.4,
        fastestFix: 14,
        sla: 98.5,
        firstTime: 99.1,
        specialty: 'Bàn Tay Vàng Cắt Dây EDM (Makino/Sodick)',
        recentBadge: 'Kỷ Lục Khắc Phục E-102 (14 phút)',
      },
      'tech-01': {
        // Nguyễn Văn Hùng
        resolvedBase: 29,
        emergencyBase: 14,
        avgMttr: 25.8,
        fastestFix: 16,
        sla: 97.4,
        firstTime: 98.2,
        specialty: 'Bậc Thầy Chẩn Đoán Bo Mạch & PLC CNC',
        recentBadge: 'Giải Cứu Trục Z Makino EDAF3',
      },
      'tech-02': {
        // Trần Minh Tuấn
        resolvedBase: 21,
        emergencyBase: 8,
        avgMttr: 30.6,
        fastestFix: 19,
        sla: 95.8,
        firstTime: 96.5,
        specialty: 'Chuyên Gia Thủy Lực & Áp Lực Nước Xả',
        recentBadge: 'Xử Lý Màng Áp Lực Sodick ALC',
      },
      'tech-04': {
        // Phạm Đức Anh
        resolvedBase: 17,
        emergencyBase: 6,
        avgMttr: 34.2,
        fastestFix: 22,
        sla: 94.0,
        firstTime: 95.0,
        specialty: 'Kỹ Thuật Viên Vận Hành & Khắc Phục Ca Đêm',
        recentBadge: 'Hoàn Thành 100% Checklist PM 500h',
      },
    };

    return technicians.map((tech) => {
      const base = baselineStats[tech.id] || {
        resolvedBase: 15,
        emergencyBase: 5,
        avgMttr: 32.0,
        fastestFix: 20,
        sla: 94.0,
        firstTime: 95.0,
        specialty: 'Kỹ Thuật Viên Cơ Điện',
        recentBadge: 'Bảo Dưỡng Định Kỳ Đạt Chuẩn',
      };

      // Count dynamic records completed by this technician in storedRecords
      const normTechName = tech.name.toLowerCase().trim();
      const techRecords = storedRecords.filter((r) =>
        r.technicianName?.toLowerCase().includes(normTechName)
      );

      const dynamicCount = techRecords.length;
      const dynamicMttrSum = techRecords.reduce((sum, r) => sum + (r.durationMinutes || 30), 0);
      const dynamicMttrAvg = dynamicCount > 0 ? dynamicMttrSum / dynamicCount : base.avgMttr;

      const finalResolved = Math.max(1, Math.round(base.resolvedBase * multiplier) + dynamicCount);
      const finalEmergency = Math.max(1, Math.round(base.emergencyBase * multiplier));
      const finalMttr = Math.round(((base.avgMttr * 3 + dynamicMttrAvg) / 4) * 10) / 10;
      const currentCommend = commendations[tech.id] || 0;

      // Score formula: (Resolved * 1.8) + (max(0, 50 - MTTR) * 1.5) + (SLA * 0.3) + Commendations
      const calculatedScore = Math.min(
        100,
        Math.round(
          (finalResolved / (30 * multiplier)) * 40 +
            Math.max(0, 45 - finalMttr) * 1.2 +
            (base.sla - 80) * 1.2 +
            currentCommend * 0.8
        )
      );

      return {
        id: tech.id,
        name: tech.name,
        role: tech.role,
        avatar: tech.avatar,
        shift: tech.shift,
        phone: tech.phone,
        resolvedIncidents: finalResolved,
        emergencyFixedCount: finalEmergency,
        avgMttrMinutes: finalMttr,
        fastestFixMinutes: base.fastestFix,
        slaComplianceRate: base.sla,
        firstTimePassRate: base.firstTime,
        commendationsCount: currentCommend,
        specialtyTag: base.specialty,
        score: calculatedScore,
        recentSuccessBadge: base.recentBadge,
      };
    });
  }, [technicians, storedRecords, timeframe, commendations]);

  // Sort performance data based on chosen metric
  const sortedData = useMemo(() => {
    return [...performanceData].sort((a, b) => {
      if (sortBy === 'RESOLVED') {
        return b.resolvedIncidents - a.resolvedIncidents;
      }
      if (sortBy === 'MTTR') {
        // Lowest MTTR is the best/fastest
        return a.avgMttrMinutes - b.avgMttrMinutes;
      }
      // Default: SCORE
      return b.score - a.score;
    });
  }, [performanceData, sortBy]);

  // Handle Leader Commendation (Tuyên Dương)
  const handleCommend = (techId: string, techName: string) => {
    soundManager.playSuccessChime();
    setCommendations((prev) => ({
      ...prev,
      [techId]: (prev[techId] || 0) + 1,
    }));
    const message = `🏆 Leader EQM đã tuyên dương kỹ thuật viên ${techName} vì thành tích xử lý sự cố xuất sắc!`;
    if (onToast) {
      onToast(message);
    }
  };

  // Target standard shopfloor MTTR threshold
  const TARGET_MTTR = 30.0; // Minutes

  // Total incidents resolved by all team members
  const teamTotalResolved = useMemo(
    () => sortedData.reduce((sum, item) => sum + item.resolvedIncidents, 0),
    [sortedData]
  );
  const teamAvgMttr = useMemo(() => {
    if (sortedData.length === 0) return 26.5;
    const sum = sortedData.reduce((acc, item) => acc + item.avgMttrMinutes, 0);
    return Math.round((sum / sortedData.length) * 10) / 10;
  }, [sortedData]);

  /* ------------------------------------------------------------- */
  /* RENDER 1: MOBILE VIEW (TOUCH OPTIMIZED RANKINGS)             */
  /* ------------------------------------------------------------- */
  if (viewportMode === 'MOBILE') {
    return (
      <div className="space-y-4">
        {/* Mobile Header with Trophy */}
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-950 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-950/50">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  Bảng Xếp Hạng Kíp Trực
                </span>
                <h3 className="text-sm font-bold text-white">Thành Tích Sửa Chữa & MTTR</h3>
              </div>
            </div>

            <div className="text-right">
              <span className="block text-xs font-mono font-bold text-emerald-400">
                {teamTotalResolved} Ca Đã Xong
              </span>
              <span className="text-[10px] font-mono text-cyan-300">
                MTTR TB: {teamAvgMttr}m
              </span>
            </div>
          </div>

          {/* Timeframe & Sort Toggle Bar */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {/* Timeframe */}
            <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setTimeframe('WEEK')}
                className={`flex-1 rounded-lg py-1 text-[11px] font-semibold transition ${
                  timeframe === 'WEEK'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400'
                }`}
              >
                Tuần
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('MONTH')}
                className={`flex-1 rounded-lg py-1 text-[11px] font-semibold transition ${
                  timeframe === 'MONTH'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400'
                }`}
              >
                Tháng
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('ALL')}
                className={`flex-1 rounded-lg py-1 text-[11px] font-semibold transition ${
                  timeframe === 'ALL'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400'
                }`}
              >
                Tất cả
              </button>
            </div>

            {/* Sort Metric */}
            <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setSortBy('SCORE')}
                className={`flex-1 rounded-lg py-1 text-[11px] font-semibold transition ${
                  sortBy === 'SCORE' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                }`}
                title="Sắp xếp theo Điểm Tổng Hợp"
              >
                Điểm
              </button>
              <button
                type="button"
                onClick={() => setSortBy('RESOLVED')}
                className={`flex-1 rounded-lg py-1 text-[11px] font-semibold transition ${
                  sortBy === 'RESOLVED' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                }`}
                title="Sắp xếp theo Số Sự Cố"
              >
                Số Ca
              </button>
              <button
                type="button"
                onClick={() => setSortBy('MTTR')}
                className={`flex-1 rounded-lg py-1 text-[11px] font-semibold transition ${
                  sortBy === 'MTTR' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'
                }`}
                title="Sắp xếp theo MTTR Tốc Độ"
              >
                MTTR
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Ranked Cards */}
        <div className="space-y-3">
          {sortedData.map((item, index) => {
            const isRank1 = index === 0;
            const isRank2 = index === 1;
            const isRank3 = index === 2;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-3.5 space-y-2.5 transition shadow-lg ${
                  isRank1
                    ? 'border-amber-500/70 bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-900 ring-1 ring-amber-400/50'
                    : isRank2
                    ? 'border-slate-400/50 bg-gradient-to-br from-slate-950 via-slate-800/20 to-slate-900'
                    : isRank3
                    ? 'border-orange-600/40 bg-gradient-to-br from-slate-950 via-orange-950/15 to-slate-900'
                    : 'border-slate-800 bg-slate-950'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Rank Badge */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono font-extrabold text-xs shadow-md ${
                        isRank1
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950'
                          : isRank2
                          ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950'
                          : isRank3
                          ? 'bg-gradient-to-br from-orange-500 to-amber-700 text-white'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {isRank1 ? '🥇 1' : isRank2 ? '🥈 2' : isRank3 ? '🥉 3' : `#${index + 1}`}
                    </div>

                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-700 shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-xs">{item.name}</span>
                        {isRank1 && (
                          <span className="rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.2 border border-amber-500/40">
                            TOP 1
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-1 block">
                        {item.role}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold font-mono text-amber-400 block">
                      {item.score} <span className="text-[10px] text-slate-400">điểm</span>
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400">
                      SLA {item.slaComplianceRate}%
                    </span>
                  </div>
                </div>

                {/* Mobile Metrics Strip */}
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 p-2 text-center font-mono">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Đã Khắc Phục</span>
                    <span className="text-xs font-bold text-white">
                      {item.resolvedIncidents} ca
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">MTTR TB</span>
                    <span
                      className={`text-xs font-bold ${
                        item.avgMttrMinutes <= TARGET_MTTR
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {item.avgMttrMinutes}m
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Nhanh Nhất</span>
                    <span className="text-xs font-bold text-cyan-400">
                      {item.fastestFixMinutes}m
                    </span>
                  </div>
                </div>

                {/* Specialty Pill */}
                <div className="text-[10px] text-slate-300 flex items-center justify-between">
                  <span className="truncate text-indigo-300 font-medium">
                    ⚡ {item.specialtyTag}
                  </span>
                  <span className="text-amber-400 font-mono text-[9px] shrink-0 flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {item.commendationsCount}
                  </span>
                </div>

                {/* Mobile Action: Commend or Call */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => handleCommend(item.id, item.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 py-1.5 text-xs font-bold text-amber-300 transition active:scale-95"
                  >
                    <ThumbsUp className="h-3.5 w-3.5 text-amber-400" />
                    <span>Tuyên Dương (+1)</span>
                  </button>

                  <a
                    href={`tel:${item.phone}`}
                    className="flex items-center justify-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 font-medium transition"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Gọi</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* RENDER 2: PC DESKTOP VIEW (EXECUTIVE LEADERBOARD & PODIUM)   */
  /* ------------------------------------------------------------- */
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl space-y-6">
      {/* 1. Header Bar with Timeframe & Sorting Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 text-white shadow-xl shadow-amber-950/50">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Bảng Xếp Hạng Thành Tích Sửa Chữa Kỹ Thuật Viên (Technician Repair Leaderboard)
              </h3>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-300">
                MTTR & Incident Resolvers
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tuyên dương và đánh giá hiệu suất khắc phục sự cố máy cắt dây / xung điện EDM dựa trên số lượng sự cố xử lý thành công, tốc độ MTTR và cam kết chất lượng SLA.
            </p>
          </div>
        </div>

        {/* Filters: Timeframe & Metric Selector */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
          {/* Timeframe Selector */}
          <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-1 text-xs">
            <span className="text-slate-500 px-2 font-mono flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
              <span>Thời gian:</span>
            </span>
            <button
              type="button"
              onClick={() => setTimeframe('WEEK')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                timeframe === 'WEEK'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tuần Này
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('MONTH')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                timeframe === 'MONTH'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tháng Này
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('ALL')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                timeframe === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Toàn Bộ
            </button>
          </div>

          {/* Sort By Metric */}
          <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-1 text-xs">
            <span className="text-slate-500 px-2 font-mono flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-indigo-400" />
              <span>Xếp theo:</span>
            </span>
            <button
              type="button"
              onClick={() => setSortBy('SCORE')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                sortBy === 'SCORE'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Điểm Tổng Hợp
            </button>
            <button
              type="button"
              onClick={() => setSortBy('RESOLVED')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                sortBy === 'RESOLVED'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Số Sự Cố
            </button>
            <button
              type="button"
              onClick={() => setSortBy('MTTR')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                sortBy === 'MTTR'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              MTTR Nhanh Nhất
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top 3 Podium (Bục Vinh Danh Top 1 - 2 - 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* RANK 2: SILVER */}
        {sortedData[1] && (
          <div className="rounded-2xl border border-slate-400/40 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-5 shadow-xl relative flex flex-col items-center text-center order-2 md:order-1 mt-0 md:mt-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-300 text-slate-950 font-mono font-extrabold text-xs px-3 py-0.5 shadow-md flex items-center gap-1">
              <Medal className="h-3.5 w-3.5 text-slate-800" />
              <span>HẠNG 2 • BẠC</span>
            </div>

            <img
              src={sortedData[1].avatar}
              alt={sortedData[1].name}
              className="h-16 w-16 rounded-full object-cover ring-4 ring-slate-400/50 mt-2 shadow-lg"
            />

            <h4 className="font-bold text-white text-base mt-2.5">{sortedData[1].name}</h4>
            <span className="text-xs text-slate-400">{sortedData[1].role}</span>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 w-full mt-4 bg-slate-950/80 rounded-xl p-2.5 border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Sự Cố Đã Khắc Phục</span>
                <span className="text-sm font-bold text-white">
                  {sortedData[1].resolvedIncidents} ca
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">MTTR Trung Bình</span>
                <span className="text-sm font-bold text-emerald-400">
                  {sortedData[1].avgMttrMinutes} phút
                </span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-indigo-300 font-medium">
              ⚡ {sortedData[1].specialtyTag}
            </div>

            {/* Commend Button */}
            <button
              type="button"
              onClick={() => handleCommend(sortedData[1].id, sortedData[1].name)}
              className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 text-xs font-bold text-slate-200 transition active:scale-95"
            >
              <ThumbsUp className="h-3.5 w-3.5 text-amber-400" />
              <span>Tuyên Dương ({sortedData[1].commendationsCount})</span>
            </button>
          </div>
        )}

        {/* RANK 1: GOLD CHAMPION (TALLER PODIUM) */}
        {sortedData[0] && (
          <div className="rounded-2xl border-2 border-amber-500/80 bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 p-6 shadow-2xl relative flex flex-col items-center text-center order-1 md:order-2 ring-2 ring-amber-400/40">
            {/* Glowing Crown Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 text-slate-950 font-mono font-extrabold text-xs px-4 py-1 shadow-lg shadow-amber-950/80 flex items-center gap-1.5 animate-pulse">
              <Trophy className="h-4 w-4 text-slate-950" />
              <span>🥇 QUÁN QUÂN • VÀNG</span>
            </div>

            <div className="relative mt-2">
              <img
                src={sortedData[0].avatar}
                alt={sortedData[0].name}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-amber-400 mt-2 shadow-2xl"
              />
              <span className="absolute bottom-0 right-0 rounded-full bg-amber-500 text-slate-950 p-1 text-xs font-extrabold shadow">
                ★
              </span>
            </div>

            <h4 className="font-extrabold text-white text-lg mt-3 flex items-center gap-1.5">
              <span>{sortedData[0].name}</span>
            </h4>
            <span className="text-xs text-amber-300/80 font-medium">{sortedData[0].role}</span>

            {/* Performance Score Pill */}
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-xs font-mono font-bold text-amber-300">
              <span>Điểm Hiệu Suất: {sortedData[0].score}/100</span>
            </div>

            {/* Main Metrics */}
            <div className="grid grid-cols-3 gap-2 w-full mt-4 bg-slate-950 rounded-xl p-3 border border-amber-500/30 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Khắc Phục</span>
                <span className="text-base font-extrabold text-amber-400">
                  {sortedData[0].resolvedIncidents} ca
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">MTTR Tốc Độ</span>
                <span className="text-base font-extrabold text-emerald-400">
                  {sortedData[0].avgMttrMinutes}m
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">SLA Đúng Hạn</span>
                <span className="text-base font-extrabold text-cyan-400">
                  {sortedData[0].slaComplianceRate}%
                </span>
              </div>
            </div>

            <div className="mt-3 text-xs text-amber-200 font-semibold flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>{sortedData[0].recentSuccessBadge}</span>
            </div>

            {/* Commend Button Gold */}
            <button
              type="button"
              onClick={() => handleCommend(sortedData[0].id, sortedData[0].name)}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 py-2.5 text-xs font-extrabold text-slate-950 transition shadow-lg shadow-amber-950/60 active:scale-95"
            >
              <ThumbsUp className="h-4 w-4 text-slate-950" />
              <span>Tuyên Dương Quán Quân ({sortedData[0].commendationsCount})</span>
            </button>
          </div>
        )}

        {/* RANK 3: BRONZE */}
        {sortedData[2] && (
          <div className="rounded-2xl border border-orange-600/40 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-5 shadow-xl relative flex flex-col items-center text-center order-3 mt-0 md:mt-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-600 text-white font-mono font-extrabold text-xs px-3 py-0.5 shadow-md flex items-center gap-1">
              <Award className="h-3.5 w-3.5" />
              <span>HẠNG 3 • ĐỒNG</span>
            </div>

            <img
              src={sortedData[2].avatar}
              alt={sortedData[2].name}
              className="h-16 w-16 rounded-full object-cover ring-4 ring-orange-600/50 mt-2 shadow-lg"
            />

            <h4 className="font-bold text-white text-base mt-2.5">{sortedData[2].name}</h4>
            <span className="text-xs text-slate-400">{sortedData[2].role}</span>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 w-full mt-4 bg-slate-950/80 rounded-xl p-2.5 border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Sự Cố Đã Khắc Phục</span>
                <span className="text-sm font-bold text-white">
                  {sortedData[2].resolvedIncidents} ca
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">MTTR Trung Bình</span>
                <span className="text-sm font-bold text-amber-400">
                  {sortedData[2].avgMttrMinutes} phút
                </span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-indigo-300 font-medium">
              ⚡ {sortedData[2].specialtyTag}
            </div>

            {/* Commend Button */}
            <button
              type="button"
              onClick={() => handleCommend(sortedData[2].id, sortedData[2].name)}
              className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 text-xs font-bold text-slate-200 transition active:scale-95"
            >
              <ThumbsUp className="h-3.5 w-3.5 text-amber-400" />
              <span>Tuyên Dương ({sortedData[2].commendationsCount})</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Detailed Full Rankings Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Users2 className="h-4 w-4 text-indigo-400" />
            <span>Bảng Chi Tiết Toàn Bộ Kỹ Thuật Viên Ca Trực ({sortedData.length})</span>
          </h4>
          <span className="text-xs font-mono text-slate-400">
            Chuẩn MTTR Mục Tiêu Xưởng: <strong className="text-emerald-400">&le; 30 phút</strong>
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="px-4 py-3 text-center">Hạng</th>
                <th className="px-4 py-3">Kỹ Thuật Viên</th>
                <th className="px-4 py-3 text-center">Số Ca Đã Khắc Phục</th>
                <th className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Thời Gian MTTR (TB)</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center">SLA Đúng Hạn</th>
                <th className="px-4 py-3 text-center">Điểm Đánh Giá</th>
                <th className="px-4 py-3 text-right">Thao Tác Leader</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium">
              {sortedData.map((item, index) => {
                const isSelected = selectedTechId === item.id;
                const isRank1 = index === 0;

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedTechId(isSelected ? null : item.id)}
                    className={`hover:bg-slate-900/60 transition cursor-pointer ${
                      isSelected ? 'bg-slate-900/80 ring-1 ring-indigo-500/30' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-xl font-mono font-bold text-xs ${
                          index === 0
                            ? 'bg-amber-400 text-slate-950'
                            : index === 1
                            ? 'bg-slate-300 text-slate-950'
                            : index === 2
                            ? 'bg-orange-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>

                    {/* Technician Name & Avatar */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-700 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {isRank1 && (
                              <span className="rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold px-1.5 py-0.2 border border-amber-500/30">
                                TOP RESOLVER
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{item.role}</div>
                          <div className="text-[10px] text-indigo-400 font-mono mt-0.5">
                            Ca: {item.shift}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Resolved Count */}
                    <td className="px-4 py-3.5 text-center font-mono">
                      <div className="text-sm font-bold text-white">
                        {item.resolvedIncidents}{' '}
                        <span className="text-xs font-normal text-slate-400">sự cố</span>
                      </div>
                      <span className="text-[10px] text-red-400">
                        ({item.emergencyFixedCount} ca khẩn cấp P0)
                      </span>
                    </td>

                    {/* MTTR Progress & Indicator */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1.5 min-w-[140px]">
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span
                            className={`font-bold ${
                              item.avgMttrMinutes <= TARGET_MTTR
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {item.avgMttrMinutes} phút
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (Nhanh nhất: {item.fastestFixMinutes}m)
                          </span>
                        </div>

                        {/* MTTR Bar against 45m scale */}
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.avgMttrMinutes <= 25
                                ? 'bg-emerald-500'
                                : item.avgMttrMinutes <= TARGET_MTTR
                                ? 'bg-cyan-500'
                                : 'bg-amber-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(15, (item.avgMttrMinutes / 45) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* SLA Compliance */}
                    <td className="px-4 py-3.5 text-center font-mono">
                      <div className="text-xs font-bold text-cyan-300">
                        {item.slaComplianceRate}%
                      </div>
                      <span className="text-[10px] text-emerald-400">
                        Đạt nghiệm thu: {item.firstTimePassRate}%
                      </span>
                    </td>

                    {/* Performance Score */}
                    <td className="px-4 py-3.5 text-center font-mono">
                      <div className="text-base font-extrabold text-amber-400">
                        {item.score}
                      </div>
                      <div className="flex items-center justify-center gap-0.5 text-amber-400 text-[10px]">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{item.commendationsCount} sao</span>
                      </div>
                    </td>

                    {/* Quick Action Buttons */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCommend(item.id, item.name);
                          }}
                          className="flex items-center gap-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1.5 text-xs font-bold text-amber-300 transition active:scale-95 shadow-sm"
                          title="Tuyên dương thành tích kỹ thuật viên"
                        >
                          <ThumbsUp className="h-3.5 w-3.5 text-amber-400" />
                          <span>Tuyên Dương</span>
                        </button>

                        <a
                          href={`tel:${item.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 font-medium transition"
                          title="Gọi bộ đàm / điện thoại"
                        >
                          <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="hidden sm:inline">Gọi</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Team Operational Highlights Footer Strip */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Tổng Sự Cố Đã Giải Quyết</span>
            <span className="text-sm font-bold text-white">{teamTotalResolved} sự cố</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">MTTR Trung Bình Toàn Kíp</span>
            <span className="text-sm font-bold text-cyan-400">{teamAvgMttr} phút</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Kỷ Lục Xử Lý Nhanh Nhất</span>
            <span className="text-sm font-bold text-amber-400">14 phút (Lê Hoàng Nam)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Tỷ Lệ Nghiệm Thu Đạt Chuẩn</span>
            <span className="text-sm font-bold text-purple-300">97.8% Lần Đầu</span>
          </div>
        </div>
      </div>
    </div>
  );
};
