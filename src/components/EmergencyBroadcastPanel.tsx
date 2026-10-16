import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  MapPin,
  Radio,
  Send,
  ShieldAlert,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap,
  Activity,
  Maximize2,
  Minimize2,
  Flame,
  Gauge,
  PhoneCall,
  Megaphone,
} from 'lucide-react';
import { Device, Technician } from '../types';
import { soundManager } from '../utils/audio';

interface EmergencyBroadcastPanelProps {
  devices: Device[];
  technicians?: Technician[];
  onAcknowledgeIncident?: (deviceId: string) => void;
  onOpenDiagnosis?: (device: Device) => void;
  onOpenRepairReport?: (device: Device) => void;
  onOpenMachineDetails?: (device: Device) => void;
  onToast?: (message: string) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isExpandedDefault?: boolean;
}

export type ErrorSeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NORMAL';

interface BroadcastMessage {
  id: string;
  timestamp: string;
  sender: string;
  severity: ErrorSeverityLevel;
  content: string;
  zone: string;
}

export const EmergencyBroadcastPanel: React.FC<EmergencyBroadcastPanelProps> = ({
  devices,
  technicians = [],
  onAcknowledgeIncident,
  onOpenDiagnosis,
  onOpenRepairReport,
  onOpenMachineDetails,
  onToast,
  isMuted = false,
  onToggleMute,
  isExpandedDefault = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(isExpandedDefault);
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'ALL' | ErrorSeverityLevel>('ALL');
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [broadcastSeverity, setBroadcastSeverity] = useState<ErrorSeverityLevel>('CRITICAL');
  const [broadcastTargetZone, setBroadcastTargetZone] = useState<string>('TOÀN XƯỞNG (ALL ZONES)');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastSender, setBroadcastSender] = useState<string>('Trực Ban Trưởng Kỹ Thuật');
  const [sendingBroadcast, setSendingBroadcast] = useState<boolean>(false);
  const [isPlayingSiren, setIsPlayingSiren] = useState<boolean>(false);

  // Initial broadcast history
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastMessage[]>([
    {
      id: 'bc-01',
      timestamp: '18:25:10',
      sender: 'Hệ Thống IoT Cảm Biến',
      severity: 'CRITICAL',
      content: 'CẢNH BÁO TỤT ÁP LỰC DUNG DỊCH ĐIỆN MÔI TẠI KHU VỰC A (MÁY SODICK ALC600G). Yêu cầu kỹ thuật viên Nam kiểm tra van PRV-02 ngay!',
      zone: 'Khu Vực A',
    },
    {
      id: 'bc-02',
      timestamp: '17:40:02',
      sender: 'Kỹ sư Trưởng Nguyễn Văn Hùng',
      severity: 'HIGH',
      content: 'Lưu ý ca trực chiều: Dòng điện xung máy Makino U6 tăng đột biến khi gia công phôi SKD11 dày 80mm. Giảm 2 nấc IP nếu góc lượn R<0.3mm.',
      zone: 'Khu Vực A',
    },
  ]);

  // Aggregate devices by severity level
  const severityBreakdown = useMemo(() => {
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let normalCount = 0;

    const criticalDevices: Device[] = [];
    const highDevices: Device[] = [];
    const mediumDevices: Device[] = [];
    const normalDevices: Device[] = [];

    devices.forEach((d) => {
      const isAlarm = d.status === 'ALARM_STOPPED';
      const incidentSev = d.activeIncident?.severity;
      const isElevatedVibe = d.telemetry.vibration > 1.8;
      const isWarning = d.status === 'WARNING';
      const isMaintenance = d.status === 'MAINTENANCE';

      if (isAlarm || incidentSev === 'CRITICAL') {
        criticalCount++;
        criticalDevices.push(d);
      } else if (isWarning || incidentSev === 'HIGH' || isElevatedVibe || d.telemetry.dielectricTemp > 32) {
        highCount++;
        highDevices.push(d);
      } else if (isMaintenance || incidentSev === 'MEDIUM' || d.telemetry.vibration > 1.2) {
        mediumCount++;
        mediumDevices.push(d);
      } else {
        normalCount++;
        normalDevices.push(d);
      }
    });

    const total = devices.length || 1;
    const criticalPercent = Math.round((criticalCount / total) * 100);
    const highPercent = Math.round((highCount / total) * 100);
    const mediumPercent = Math.round((mediumCount / total) * 100);
    const normalPercent = 100 - (criticalPercent + highPercent + mediumPercent);

    return {
      total: devices.length,
      criticalCount,
      highCount,
      mediumCount,
      normalCount,
      criticalPercent,
      highPercent,
      mediumPercent,
      normalPercent: Math.max(0, normalPercent),
      criticalDevices,
      highDevices,
      mediumDevices,
      normalDevices,
    };
  }, [devices]);

  // Zone aggregated breakdown
  const zoneBreakdown = useMemo(() => {
    const zones: Record<string, { total: number; critical: number; high: number; normal: number }> = {
      'Khu Vực A (Cắt Dây Wire EDM)': { total: 0, critical: 0, high: 0, normal: 0 },
      'Khu Vực B (Xung Điện Cực Sinker EDM)': { total: 0, critical: 0, high: 0, normal: 0 },
      'Khu Vực C (Phay CNC & Gia Công)': { total: 0, critical: 0, high: 0, normal: 0 },
    };

    devices.forEach((d) => {
      let zoneKey = 'Khu Vực A (Cắt Dây Wire EDM)';
      if (d.location.toLowerCase().includes('khu vực b') || d.type === 'SINKER_EDM') {
        zoneKey = 'Khu Vực B (Xung Điện Cực Sinker EDM)';
      } else if (d.location.toLowerCase().includes('khu vực c') || d.type === 'CNC_MILLING') {
        zoneKey = 'Khu Vực C (Phay CNC & Gia Công)';
      }

      if (!zones[zoneKey]) {
        zones[zoneKey] = { total: 0, critical: 0, high: 0, normal: 0 };
      }
      zones[zoneKey].total++;
      if (d.status === 'ALARM_STOPPED' || d.activeIncident?.severity === 'CRITICAL') {
        zones[zoneKey].critical++;
      } else if (d.status === 'WARNING' || d.telemetry.vibration > 1.8) {
        zones[zoneKey].high++;
      } else {
        zones[zoneKey].normal++;
      }
    });

    return zones;
  }, [devices]);

  // Filtered devices list based on selected filter
  const displayedEmergencyDevices = useMemo(() => {
    if (selectedSeverityFilter === 'CRITICAL') return severityBreakdown.criticalDevices;
    if (selectedSeverityFilter === 'HIGH') return severityBreakdown.highDevices;
    if (selectedSeverityFilter === 'MEDIUM') return severityBreakdown.mediumDevices;
    if (selectedSeverityFilter === 'NORMAL') return severityBreakdown.normalDevices;
    // ALL: Prioritize critical and high
    return [
      ...severityBreakdown.criticalDevices,
      ...severityBreakdown.highDevices,
      ...severityBreakdown.mediumDevices,
    ];
  }, [selectedSeverityFilter, severityBreakdown]);

  // Test trigger siren sound
  const handlePlaySiren = () => {
    soundManager.playIndustrialAlarm();
    setIsPlayingSiren(true);
    if (onToast) onToast('📢 Đang phát còi báo động khẩn cấp thử nghiệm toàn xưởng!');
    setTimeout(() => setIsPlayingSiren(false), 2500);
  };

  // Submit emergency broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setSendingBroadcast(true);
    try {
      // Send notification log to backend
      await fetch('/api/notifications/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: technicians[0]?.id || 'tech-01',
          customMessage: `[PHÁT THANH KHẨN CẤP - ${broadcastSeverity}] ${broadcastMessage.trim()}`,
        }),
      });

      const newMsg: BroadcastMessage = {
        id: `bc-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        sender: broadcastSender,
        severity: broadcastSeverity,
        content: broadcastMessage.trim(),
        zone: broadcastTargetZone,
      };

      setBroadcastHistory((prev) => [newMsg, ...prev]);
      soundManager.playIndustrialAlarm();
      if (onToast) {
        onToast(`📢 Đã phát lệnh thông báo khẩn [${broadcastSeverity}] tới toàn bộ xưởng & thiết bị di động!`);
      }
      setShowBroadcastModal(false);
      setBroadcastMessage('');
    } catch (err) {
      console.error('Send broadcast error:', err);
    } finally {
      setSendingBroadcast(false);
    }
  };

  const hasCritical = severityBreakdown.criticalCount > 0;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all duration-300 shadow-2xl ${
        hasCritical
          ? 'border-red-500/80 bg-gradient-to-r from-red-950/70 via-slate-950 to-slate-950 shadow-red-950/50 ring-1 ring-red-500/30'
          : severityBreakdown.highCount > 0
          ? 'border-amber-500/60 bg-gradient-to-r from-amber-950/50 via-slate-950 to-slate-950 shadow-amber-950/40 ring-1 ring-amber-500/20'
          : 'border-blue-500/40 bg-gradient-to-r from-slate-950 via-indigo-950/30 to-slate-950 shadow-indigo-950/30'
      }`}
    >
      {/* Top Urgent Pulsing Industrial Beacon Stripe */}
      {hasCritical && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-400 to-red-600 animate-pulse"></div>
      )}

      {/* Main Header Bar */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Title & Live Broadcast Status */}
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-lg ${
                hasCritical
                  ? 'bg-red-600 border-red-400 text-white shadow-red-600/40 animate-pulse'
                  : severityBreakdown.highCount > 0
                  ? 'bg-amber-600 border-amber-400 text-white shadow-amber-600/40'
                  : 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-600/40'
              }`}
            >
              <Megaphone className="h-6 w-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-black tracking-wider uppercase text-white flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        hasCritical
                          ? 'animate-ping bg-red-400'
                          : severityBreakdown.highCount > 0
                          ? 'animate-ping bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    ></span>
                    <span
                      className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                        hasCritical
                          ? 'bg-red-500'
                          : severityBreakdown.highCount > 0
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    ></span>
                  </span>
                  <span>BẢNG PHÁT THANH KHẨN CẤP TOÀN XƯỞNG (EMERGENCY BROADCAST)</span>
                </span>

                <span
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                    hasCritical
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : severityBreakdown.highCount > 0
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {hasCritical
                    ? `🚨 ${severityBreakdown.criticalCount} Sự Cố Dừng Máy`
                    : severityBreakdown.highCount > 0
                    ? `⚠️ ${severityBreakdown.highCount} Cảnh Báo Nguy Cơ`
                    : '🟢 Toàn Xưởng Ổn Định'}
                </span>

                <span className="text-[11px] font-mono text-slate-400">
                  (100% Floor Real-Time Sync)
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Giám sát tình trạng sự cố tức thời theo cấp độ nghiêm trọng, phân vùng xưởng và phát lệnh điều phối kỹ thuật viên.
              </p>
            </div>
          </div>

          {/* Right: Quick Action Buttons & Expand Toggle */}
          <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto shrink-0">
            {/* Siren Audio Test Button */}
            <button
              onClick={handlePlaySiren}
              disabled={isPlayingSiren}
              title="Phát thử nghiệm còi báo động khẩn cấp công nghiệp"
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95 shadow-md ${
                isPlayingSiren
                  ? 'border-red-400 bg-red-600 text-white animate-bounce'
                  : 'border-slate-700 bg-slate-900/90 text-slate-200 hover:border-red-500 hover:text-red-400'
              }`}
            >
              <Volume2 className={`h-4 w-4 ${isPlayingSiren ? 'text-white' : 'text-red-400'}`} />
              <span>{isPlayingSiren ? 'Đang Hú Còi...' : 'Thử Còi Báo Động'}</span>
            </button>

            {/* Broadcast Announce Button */}
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white px-4 py-2 text-xs font-bold shadow-lg shadow-red-600/30 transition"
            >
              <Radio className="h-4 w-4 animate-pulse" />
              <span>Phát Lệnh Khẩn Toàn Xưởng</span>
            </button>

            {/* Expand / Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-2 text-xs font-semibold transition"
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Thu Gọn</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Mở Rộng Bảng</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Aggregated Severity Counts Bar (Always Visible as Overview) */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1. CRITICAL */}
          <button
            onClick={() => {
              setSelectedSeverityFilter(selectedSeverityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL');
              if (!isExpanded) setIsExpanded(true);
            }}
            className={`flex items-center justify-between p-3 rounded-2xl border transition text-left ${
              selectedSeverityFilter === 'CRITICAL'
                ? 'border-red-500 bg-red-950/60 ring-2 ring-red-500/40'
                : severityBreakdown.criticalCount > 0
                ? 'border-red-500/40 bg-red-950/30 hover:border-red-500/60'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {severityBreakdown.criticalCount > 0 && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                  )}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
                <span className="text-[11px] font-mono font-bold text-red-400 uppercase">
                  1. CẤP BÁCH (CRITICAL)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Dừng khẩn cấp / Đứt dây
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-red-400">
                {severityBreakdown.criticalCount}
              </span>
              <span className="text-[10px] text-red-300/80 block font-mono">
                {severityBreakdown.criticalPercent}% xưởng
              </span>
            </div>
          </button>

          {/* 2. HIGH */}
          <button
            onClick={() => {
              setSelectedSeverityFilter(selectedSeverityFilter === 'HIGH' ? 'ALL' : 'HIGH');
              if (!isExpanded) setIsExpanded(true);
            }}
            className={`flex items-center justify-between p-3 rounded-2xl border transition text-left ${
              selectedSeverityFilter === 'HIGH'
                ? 'border-amber-500 bg-amber-950/60 ring-2 ring-amber-500/40'
                : severityBreakdown.highCount > 0
                ? 'border-amber-500/40 bg-amber-950/30 hover:border-amber-500/60'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span className="text-[11px] font-mono font-bold text-amber-400 uppercase">
                  2. CẢNH BÁO (HIGH)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Rung/Nhiệt cao, sụt áp
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-amber-400">
                {severityBreakdown.highCount}
              </span>
              <span className="text-[10px] text-amber-300/80 block font-mono">
                {severityBreakdown.highPercent}% xưởng
              </span>
            </div>
          </button>

          {/* 3. MEDIUM */}
          <button
            onClick={() => {
              setSelectedSeverityFilter(selectedSeverityFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM');
              if (!isExpanded) setIsExpanded(true);
            }}
            className={`flex items-center justify-between p-3 rounded-2xl border transition text-left ${
              selectedSeverityFilter === 'MEDIUM'
                ? 'border-cyan-500 bg-cyan-950/60 ring-2 ring-cyan-500/40'
                : severityBreakdown.mediumCount > 0
                ? 'border-cyan-500/40 bg-cyan-950/30 hover:border-cyan-500/60'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">
                  3. LƯU Ý (MEDIUM)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Đến hạn bảo trì / Sai lệch
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-cyan-400">
                {severityBreakdown.mediumCount}
              </span>
              <span className="text-[10px] text-cyan-300/80 block font-mono">
                {severityBreakdown.mediumPercent}% xưởng
              </span>
            </div>
          </button>

          {/* 4. NORMAL / CLEAR */}
          <button
            onClick={() => {
              setSelectedSeverityFilter(selectedSeverityFilter === 'NORMAL' ? 'ALL' : 'NORMAL');
              if (!isExpanded) setIsExpanded(true);
            }}
            className={`flex items-center justify-between p-3 rounded-2xl border transition text-left ${
              selectedSeverityFilter === 'NORMAL'
                ? 'border-emerald-500 bg-emerald-950/60 ring-2 ring-emerald-500/40'
                : 'border-slate-800 bg-slate-900/60 hover:border-emerald-500/40'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase">
                  4. BÌNH THƯỜNG
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Vận hành ổn định
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {severityBreakdown.normalCount}
              </span>
              <span className="text-[10px] text-emerald-300/80 block font-mono">
                {severityBreakdown.normalPercent}% xưởng
              </span>
            </div>
          </button>
        </div>

        {/* Real-time Health Distribution Segment Bar */}
        <div className="mt-3">
          <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden flex border border-slate-800">
            {severityBreakdown.criticalPercent > 0 && (
              <div
                style={{ width: `${severityBreakdown.criticalPercent}%` }}
                className="bg-red-500 transition-all duration-500"
                title={`Khẩn cấp: ${severityBreakdown.criticalPercent}%`}
              />
            )}
            {severityBreakdown.highPercent > 0 && (
              <div
                style={{ width: `${severityBreakdown.highPercent}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Cảnh báo: ${severityBreakdown.highPercent}%`}
              />
            )}
            {severityBreakdown.mediumPercent > 0 && (
              <div
                style={{ width: `${severityBreakdown.mediumPercent}%` }}
                className="bg-cyan-500 transition-all duration-500"
                title={`Cần lưu ý: ${severityBreakdown.mediumPercent}%`}
              />
            )}
            {severityBreakdown.normalPercent > 0 && (
              <div
                style={{ width: `${severityBreakdown.normalPercent}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Bình thường: ${severityBreakdown.normalPercent}%`}
              />
            )}
          </div>
        </div>
      </div>

      {/* EXPANDABLE SECTION: ZONE BREAKDOWN & ACTIVE EMERGENCY INCIDENT FEED */}
      {isExpanded && (
        <div className="border-t border-slate-800/80 bg-slate-950/80 p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
          {/* Production Zones Aggregation Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>PHÂN BỔ TRẠNG THÁI THEO KHU VỰC SẢN XUẤT (WORKSHOP ZONES)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Tổng 3 phân khu • {severityBreakdown.total} máy giám sát
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(zoneBreakdown).map(([zoneName, zData]) => (
                <div
                  key={zoneName}
                  className={`rounded-2xl border p-3 bg-slate-900/60 transition ${
                    zData.critical > 0
                      ? 'border-red-500/40 bg-red-950/20'
                      : zData.high > 0
                      ? 'border-amber-500/40 bg-amber-950/20'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white leading-tight">
                      {zoneName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {zData.total} máy
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs font-mono">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                      <span className="text-red-400 font-bold">{zData.critical} Lỗi</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span className="text-amber-400 font-bold">{zData.high} Cảnh báo</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      <span className="text-emerald-400 font-bold">{zData.normal} Tốt</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Broadcast Announcements Feed */}
          {broadcastHistory.length > 0 && (
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-1.5">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-amber-400" />
                  <span>Bản Tin Phát Thanh Gần Nhất (Live Broadcast Feed)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Cập nhật tức thời
                </span>
              </div>

              <div className="space-y-2">
                {broadcastHistory.slice(0, 2).map((bc) => (
                  <div
                    key={bc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 text-xs"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-mono font-bold uppercase shrink-0 mt-0.5 ${
                          bc.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {bc.severity}
                      </span>
                      <div>
                        <span className="font-semibold text-white block sm:inline">
                          [{bc.zone}]: {bc.content}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 shrink-0 self-end sm:self-auto">
                      <span>{bc.sender}</span>
                      <span>•</span>
                      <span>{bc.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Emergency Incident Feed by Severity */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                <ShieldAlert className="h-4 w-4 text-red-400" />
                <span>
                  DANH SÁCH THIẾT BỊ CẦN XỬ LÝ (
                  {selectedSeverityFilter === 'ALL'
                    ? 'TẤT CẢ SỰ CỐ'
                    : `CẤP ĐỘ: ${selectedSeverityFilter}`}
                  ) • {displayedEmergencyDevices.length} MÁY
                </span>
              </span>

              {/* Quick Filter Segmented Buttons */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'NORMAL'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedSeverityFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg transition font-medium ${
                      selectedSeverityFilter === filter
                        ? filter === 'CRITICAL'
                          ? 'bg-red-600 text-white font-bold'
                          : filter === 'HIGH'
                          ? 'bg-amber-600 text-white font-bold'
                          : filter === 'MEDIUM'
                          ? 'bg-cyan-600 text-white font-bold'
                          : filter === 'NORMAL'
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter === 'ALL' ? 'Tất cả' : filter}
                  </button>
                ))}
              </div>
            </div>

            {displayedEmergencyDevices.length === 0 ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-emerald-300">
                  Không có sự cố nào thuộc nhóm {selectedSeverityFilter}!
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Tất cả các máy trong phân loại này đang vận hành an toàn trong ngưỡng định mức.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {displayedEmergencyDevices.map((device) => {
                  const isAlarm = device.status === 'ALARM_STOPPED';
                  const incident = device.activeIncident;
                  const severity: ErrorSeverityLevel = isAlarm
                    ? 'CRITICAL'
                    : incident?.severity === 'CRITICAL'
                    ? 'CRITICAL'
                    : device.status === 'WARNING' || device.telemetry.vibration > 1.8
                    ? 'HIGH'
                    : device.status === 'MAINTENANCE' || device.telemetry.vibration > 1.2
                    ? 'MEDIUM'
                    : 'NORMAL';

                  return (
                    <div
                      key={device.id}
                      className={`flex flex-col justify-between rounded-2xl border p-4 transition shadow-md ${
                        severity === 'CRITICAL'
                          ? 'border-red-500/50 bg-red-950/30 hover:border-red-500'
                          : severity === 'HIGH'
                          ? 'border-amber-500/40 bg-amber-950/20 hover:border-amber-500'
                          : severity === 'MEDIUM'
                          ? 'border-cyan-500/40 bg-cyan-950/20 hover:border-cyan-500'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Machine Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-2 py-0.5 text-[11px] font-mono font-bold uppercase ${
                                severity === 'CRITICAL'
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : severity === 'HIGH'
                                  ? 'bg-amber-500 text-slate-950 font-black'
                                  : severity === 'MEDIUM'
                                  ? 'bg-cyan-500 text-slate-950 font-bold'
                                  : 'bg-emerald-500 text-white'
                              }`}
                            >
                              {severity}
                            </span>
                            <strong className="text-sm font-bold text-white">
                              {device.code} - {device.name}
                            </strong>
                          </div>

                          <span className="text-[11px] font-mono text-slate-400">
                            {device.model}
                          </span>
                        </div>

                        {/* Location & Incident */}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="h-3.5 w-3.5 text-amber-400" />
                            <span>{device.location}</span>
                          </span>

                          {incident && (
                            <span className="rounded bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-red-300 font-mono text-[11px] font-bold">
                              MÃ LỖI: {incident.errorCode}
                            </span>
                          )}

                          {device.assignedTechnician && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <User className="h-3 w-3 text-cyan-400" />
                              <span className="text-cyan-300">{device.assignedTechnician.name}</span>
                            </span>
                          )}
                        </div>

                        {/* Error title or Description */}
                        {incident ? (
                          <p className="mt-2 text-xs font-semibold text-red-200 bg-red-950/40 p-2 rounded-xl border border-red-500/30">
                            "{incident.errorTitle}"
                          </p>
                        ) : (
                          <div className="mt-2 flex items-center gap-3 text-xs font-mono text-slate-300">
                            <span>Vibe: <strong className={device.telemetry.vibration > 1.8 ? 'text-amber-400' : 'text-slate-200'}>{device.telemetry.vibration.toFixed(2)} mm/s</strong></span>
                            <span>Áp suất: <strong className="text-slate-200">{device.telemetry.dielectricPressure.toFixed(2)} Bar</strong></span>
                            <span>Nhiệt độ: <strong className="text-slate-200">{device.telemetry.dielectricTemp.toFixed(1)}°C</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Quick Action Button Toolbar for Emergency Machine */}
                      <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-slate-400">
                          Trạng thái: <strong className="text-white">{device.status}</strong>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isAlarm && onAcknowledgeIncident && (
                            <button
                              onClick={() => onAcknowledgeIncident(device.id)}
                              className="rounded-lg bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 text-xs font-bold transition active:scale-95"
                            >
                              Tiếp Nhận
                            </button>
                          )}

                          {isAlarm && onOpenDiagnosis && (
                            <button
                              onClick={() => onOpenDiagnosis(device)}
                              className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 text-xs font-bold transition active:scale-95"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                              <span>AI Chẩn Đoán</span>
                            </button>
                          )}

                          {isAlarm && onOpenRepairReport && (
                            <button
                              onClick={() => onOpenRepairReport(device)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-bold transition active:scale-95"
                            >
                              <Wrench className="h-3.5 w-3.5" />
                              <span>Nghiệm Thu</span>
                            </button>
                          )}

                          {onOpenMachineDetails && (
                            <button
                              onClick={() => onOpenMachineDetails(device)}
                              className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 text-xs transition"
                            >
                              Lý Lịch
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: BROADCAST EMERGENCY ANNOUNCEMENT TO FACTORY FLOOR */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border-2 border-red-500/80 bg-slate-950 p-6 shadow-2xl shadow-red-950/60">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Phát Lệnh Thông Báo Khẩn Cấp Toàn Xưởng
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bản tin sẽ phát loa công nghiệp và gửi push notification tới tất cả thiết bị di động của KTV.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="rounded-full bg-slate-900 p-2 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Templates */}
            <div className="mt-3.5 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Chọn mẫu phát thanh khẩn cấp có sẵn:
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  {
                    label: '🚨 Dừng máy khẩn cấp Khu A',
                    text: 'CẢNH BÁO: Máy EDM-01 tại Khu Vực A đứt dây liên tục E-102. Yêu cầu KTV Nam tiếp nhận và kiểm tra áp lực nước xả!',
                    sev: 'CRITICAL',
                    zone: 'Khu Vực A (Cắt Dây Wire EDM)',
                  },
                  {
                    label: '⚠️ Tụt áp dung dịch điện môi',
                    text: 'CẢNH BÁO KHẨN CẤP: Áp suất dung dịch điện môi máy Sodick ALC600G tụt dưới ngưỡng 0.4 Bar. Ngắt nguồn cao tần để bảo vệ phôi!',
                    sev: 'CRITICAL',
                    zone: 'Khu Vực A (Cắt Dây Wire EDM)',
                  },
                  {
                    label: '📢 Nhắc chuyển ca trực',
                    text: 'THÔNG BÁO CHUYỂN CA: Kỹ thuật viên hoàn tất kiểm tra bồn khử ion và cuộn dây đồng trước giờ bàn giao ca 14:30.',
                    sev: 'MEDIUM',
                    zone: 'TOÀN XƯỞNG (ALL ZONES)',
                  },
                ].map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setBroadcastMessage(tmpl.text);
                      setBroadcastSeverity(tmpl.sev as ErrorSeverityLevel);
                      setBroadcastTargetZone(tmpl.zone);
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 transition"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="mt-3.5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Severity Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mức độ nghiêm trọng (Severity):
                  </label>
                  <select
                    value={broadcastSeverity}
                    onChange={(e) => setBroadcastSeverity(e.target.value as ErrorSeverityLevel)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold"
                  >
                    <option value="CRITICAL">🔴 CRITICAL (Khẩn Cấp Sống Còn)</option>
                    <option value="HIGH">🟡 HIGH (Cảnh Báo Nguy Cơ Cao)</option>
                    <option value="MEDIUM">🔵 MEDIUM (Lưu Ý Vận Hành)</option>
                    <option value="NORMAL">🟢 NORMAL (Thông Báo Thường)</option>
                  </select>
                </div>

                {/* Target Zone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phân khu xưởng nhận thông báo:
                  </label>
                  <select
                    value={broadcastTargetZone}
                    onChange={(e) => setBroadcastTargetZone(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                  >
                    <option value="TOÀN XƯỞNG (ALL ZONES)">🌐 TOÀN XƯỞNG (ALL ZONES)</option>
                    <option value="Khu Vực A (Cắt Dây Wire EDM)">Khu Vực A (Cắt Dây Wire EDM)</option>
                    <option value="Khu Vực B (Xung Điện Cực Sinker EDM)">Khu Vực B (Xung Điện Cực Sinker EDM)</option>
                    <option value="Khu Vực C (Phay CNC & Gia Công)">Khu Vực C (Phay CNC & Gia Công)</option>
                  </select>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nội dung thông điệp phát thanh:
                </label>
                <textarea
                  required
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Nhập nội dung lệnh khẩn cấp gửi tới toàn thể kỹ thuật viên xưởng..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium leading-relaxed"
                />
              </div>

              {/* Sender Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Người phát thanh:
                </label>
                <input
                  type="text"
                  value={broadcastSender}
                  onChange={(e) => setBroadcastSender(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-xl shadow-red-600/40 transition active:scale-95 disabled:opacity-50"
                >
                  {sendingBroadcast ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin text-amber-300" />
                      <span>Đang phát sóng...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Phát Loa & Gửi Push Toàn Xưởng</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
