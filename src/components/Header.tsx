import React from 'react';
import {
  Activity,
  AlertTriangle,
  Volume2,
  VolumeX,
  Bell,
  Smartphone,
  BookOpen,
  Brain,
  Users,
  Wifi,
  Radio,
  Zap,
} from 'lucide-react';
import { FactoryStats } from '../types';

interface HeaderProps {
  stats: FactoryStats | null;
  activeTab: 'devices' | 'learnings' | 'documents' | 'notifications';
  setActiveTab: (tab: 'devices' | 'learnings' | 'documents' | 'notifications') => void;
  isMuted: boolean;
  toggleMute: () => void;
  pushPermission: NotificationPermission;
  handleRequestPush: () => void;
  onOpenSimulator: () => void;
  onOpenPhoneView: () => void;
  onOpenTechStatus: () => void;
  onDutyTechCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  activeTab,
  setActiveTab,
  isMuted,
  toggleMute,
  pushPermission,
  handleRequestPush,
  onOpenSimulator,
  onOpenPhoneView,
  onOpenTechStatus,
  onDutyTechCount,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      {/* Top Banner: Industrial IoT Telemetry Header */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 shadow-lg shadow-orange-500/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                EDM <span className="text-amber-400 font-extrabold">SmartGuard</span>
              </h1>
              <span className="hidden rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-amber-400 border border-amber-500/20 sm:inline-block">
                Industrial AI 4.0
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Hệ thống giám sát thiết bị & AI trợ lý khắc phục sự cố tức thì</span>
            </p>
          </div>
        </div>

        {/* Live IoT Gateway Status & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* EDM Gateway Sync Indicator */}
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-mono text-slate-400">EDM Gateway:</span>
            <span className="font-semibold text-emerald-400">CONNECTED (1Hz)</span>
          </div>

          {/* Sound Alarm Toggle */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Bật âm còi báo động công nghiệp' : 'Tắt âm báo'}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              isMuted
                ? 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-amber-400 animate-pulse" />}
            <span className="hidden sm:inline">{isMuted ? 'Âm thanh: Tắt' : 'Âm còi: Bật'}</span>
          </button>

          {/* Web Push Notification Request */}
          <button
            onClick={handleRequestPush}
            title="Đăng ký nhận thông báo đẩy khẩn cấp của trình duyệt"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              pushPermission === 'granted'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 animate-bounce'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">
              {pushPermission === 'granted' ? 'Push Web: Sẵn sàng' : 'Kích hoạt Push Web'}
            </span>
          </button>

          {/* Phone Push Simulator Button */}
          <button
            onClick={onOpenPhoneView}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition shadow-sm"
          >
            <Smartphone className="h-4 w-4 text-indigo-400" />
            <span className="hidden sm:inline">Điện thoại KTV</span>
          </button>

          {/* Technician Status & Dispatch Sidebar Button */}
          <button
            onClick={onOpenTechStatus}
            title="Bảng theo dõi trạng thái trực ca và tải phân công của kỹ thuật viên"
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition shadow-sm"
          >
            <Users className="h-4 w-4 text-purple-400" />
            <span className="hidden sm:inline">Trực Ca KTV</span>
            {onDutyTechCount !== undefined && (
              <span className="ml-0.5 rounded-full bg-purple-500/20 px-1.5 py-0.2 text-[10px] font-mono font-bold text-purple-300">
                {onDutyTechCount}
              </span>
            )}
          </button>

          {/* Simulate EDM Breakdown Button */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition active:scale-95"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Mô phỏng Dừng máy</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs & KPI Counters */}
      <div className="mx-auto flex max-w-7xl items-center justify-between border-t border-slate-800/80 px-4 py-1.5 sm:px-6">
        <nav className="flex space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
              activeTab === 'devices'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Giám Sát EDM Trực Tuyến</span>
            {stats && stats.alarmCount > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white animate-pulse">
                {stats.alarmCount} dừng
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('learnings')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
              activeTab === 'learnings'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Brain className="h-4 w-4 text-purple-400" />
            <span>Bộ Não Tri Thức AI</span>
            {stats && (
              <span className="rounded bg-purple-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-purple-300">
                {stats.totalLearnings} bài học
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
              activeTab === 'documents'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4 text-blue-400" />
            <span>Kho Tài Liệu Kỹ Thuật (SOP/OEM)</span>
            {stats && (
              <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-blue-300">
                {stats.totalDocuments}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
              activeTab === 'notifications'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Radio className="h-4 w-4 text-emerald-400" />
            <span>Nhật Ký Bắn Push</span>
          </button>
        </nav>

        {/* Real-time KPI Bar */}
        {stats && (
          <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Đang chạy: {stats.runningCount}/{stats.totalDevices}</span>
            </div>
            {stats.alarmCount > 0 ? (
              <div className="flex items-center gap-1.5 text-red-400 font-bold animate-pulse">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span>DỪNG MÁY: {stats.alarmCount}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                <span>Sự cố: 0</span>
              </div>
            )}
            <div className="text-slate-400 border-l border-slate-800 pl-3">
              OEE TB: <span className="font-semibold text-amber-400">{stats.avgOee}%</span>
            </div>
            <div className="text-slate-400">
              MTTR: <span className="font-semibold text-cyan-400">{stats.mttrMinutes}m</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
