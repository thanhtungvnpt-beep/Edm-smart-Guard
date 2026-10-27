import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  WifiOff,
  Radio,
  Zap,
  HardDrive,
  Compass,
  Keyboard,
  Wrench,
  Contrast,
  Sparkles,
  Package,
  Megaphone,
  Shield,
  Gauge,
  BarChart3,
  FileText,
  ChevronDown,
  Settings2,
  CheckCircle2,
  LayoutGrid,
  Flame,
  ArrowRight,
  ShieldAlert,
  Check,
  Info,
} from 'lucide-react';
import { FactoryStats, Device, NotificationLog } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { SystemDocumentationModal } from './SystemDocumentationModal';
import { MainViewMode } from './roles/RoleNavigationHeader';

export type WorkspaceId =
  | 'MONITORING'
  | 'REPORTS'
  | 'ROLES'
  | 'AI_KNOWLEDGE'
  | 'INVENTORY_FLEET'
  | 'GOVERNANCE';

export interface HeaderAlertItem {
  id: string;
  deviceId?: string;
  device?: Device;
  deviceCode: string;
  deviceName: string;
  errorCode: string;
  errorTitle: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  timestamp: string;
  timeAgo: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVING' | 'RESOLVED' | 'SENT' | 'DELIVERED';
  source: 'ACTIVE_INCIDENT' | 'PUSH_LOG';
  isAcknowledged: boolean;
}

interface HeaderProps {
  stats: FactoryStats | null;
  devices?: Device[];
  notifications?: NotificationLog[];
  onOpenDiagnosis?: (device: Device) => void;
  onOpenMachineDetails?: (device: Device) => void;
  onAcknowledgeIncident?: (deviceId: string) => void;
  activeTab:
    | 'devices'
    | 'learnings'
    | 'documents'
    | 'notifications'
    | 'mobile-devices'
    | 'history'
    | 'root-cause-analysis'
    | 'spare-parts';
  setActiveTab: (
    tab:
      | 'devices'
      | 'learnings'
      | 'documents'
      | 'notifications'
      | 'mobile-devices'
      | 'history'
      | 'root-cause-analysis'
      | 'spare-parts'
  ) => void;
  isMuted: boolean;
  toggleMute: () => void;
  pushPermission: NotificationPermission;
  handleRequestPush: () => void;
  onOpenSimulator: () => void;
  onOpenPhoneView: () => void;
  onOpenTechStatus: () => void;
  onDutyTechCount?: number;
  isOnline?: boolean;
  isSimulatedOffline?: boolean;
  onToggleSimulateOffline?: () => void;
  onlineMobileCount?: number;
  onStartTour?: () => void;
  onOpenShortcuts?: () => void;
  shortcutUsageCount?: number;
  isHighContrast?: boolean;
  onToggleHighContrast?: () => void;
  onToggleEmergencyBroadcast?: () => void;
  criticalCount?: number;
  isEmergencyBroadcastOpen?: boolean;
  mainViewMode?: MainViewMode;
  onSelectMainViewMode?: (mode: MainViewMode) => void;
  onOpenQuickReport?: () => void;
}

function formatTimeAgoVi(isoDateString?: string): string {
  if (!isoDateString) return 'Gần đây';
  try {
    const past = new Date(isoDateString).getTime();
    const now = Date.now();
    const diffSec = Math.floor((now - past) / 1000);
    if (diffSec < 30) return 'Vừa xong';
    if (diffSec < 60) return `${diffSec} giây trước`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDays = Math.floor(diffHour / 24);
    return `${diffDays} ngày trước`;
  } catch {
    return 'Gần đây';
  }
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  devices = [],
  notifications = [],
  onOpenDiagnosis,
  onOpenMachineDetails,
  onAcknowledgeIncident,
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
  isOnline = true,
  isSimulatedOffline = false,
  onToggleSimulateOffline,
  onlineMobileCount = 5,
  onStartTour,
  onOpenShortcuts,
  shortcutUsageCount,
  isHighContrast = false,
  onToggleHighContrast,
  onToggleEmergencyBroadcast,
  criticalCount = 0,
  isEmergencyBroadcastOpen = false,
  mainViewMode = 'ROLE_VIEW',
  onSelectMainViewMode,
  onOpenQuickReport,
}) => {
  const [showDocModal, setShowDocModal] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'CRITICAL' | 'UNACKNOWLEDGED'>('ALL');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowToolsDropdown(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // =========================================================================
  // CORE USER REQUIREMENT:
  // Cập nhật logic hiển thị trong Header để ƯU TIÊN hiển thị các máy có lỗi
  // 'CRITICAL' lên hàng đầu trong dropdown hoặc danh sách thông báo, thay vì
  // chỉ hiển thị theo thứ tự thời gian.
  // =========================================================================
  const prioritizedAlerts = useMemo(() => {
    const list: HeaderAlertItem[] = [];

    // 1. Process active machines with incidents or stop alarms
    devices.forEach((d) => {
      if (d.activeIncident) {
        list.push({
          id: d.activeIncident.incidentId || `incident-${d.id}`,
          deviceId: d.id,
          device: d,
          deviceCode: d.code,
          deviceName: d.name,
          errorCode: d.activeIncident.errorCode,
          errorTitle: d.activeIncident.errorTitle || 'Sự cố dừng máy khẩn cấp',
          severity: d.activeIncident.severity || 'CRITICAL',
          timestamp: d.activeIncident.triggeredAt || new Date().toISOString(),
          timeAgo: formatTimeAgoVi(d.activeIncident.triggeredAt),
          status: d.activeIncident.status || 'ACTIVE',
          source: 'ACTIVE_INCIDENT',
          isAcknowledged: !!d.activeIncident.acknowledgedAt,
        });
      } else if (d.status === 'ALARM_STOPPED') {
        list.push({
          id: `alarm-${d.id}`,
          deviceId: d.id,
          device: d,
          deviceCode: d.code,
          deviceName: d.name,
          errorCode: 'E-STOP',
          errorTitle: 'Máy phát tín hiệu dừng khẩn cấp (Emergency Stop)',
          severity: 'CRITICAL',
          timestamp: d.lastEdmSignalTime || new Date().toISOString(),
          timeAgo: formatTimeAgoVi(d.lastEdmSignalTime),
          status: 'ACTIVE',
          source: 'ACTIVE_INCIDENT',
          isAcknowledged: false,
        });
      }
    });

    // 2. Process notifications logs
    notifications.forEach((log) => {
      const matchedDevice = devices.find(
        (d) => d.id === log.deviceId || d.code === log.deviceId
      );
      // Determine if log is CRITICAL
      const isCritical =
        matchedDevice?.activeIncident?.severity === 'CRITICAL' ||
        log.errorCode?.includes('102') ||
        log.errorCode?.includes('205') ||
        log.channel === 'URGENT_AUDIO';

      // Avoid exact duplicate if machine already has active incident with same errorCode
      const isDuplicate = list.some(
        (item) => item.deviceId === log.deviceId && item.errorCode === log.errorCode
      );

      if (!isDuplicate) {
        list.push({
          id: log.id,
          deviceId: log.deviceId,
          device: matchedDevice,
          deviceCode: matchedDevice?.code || log.deviceName,
          deviceName: matchedDevice?.name || log.deviceName,
          errorCode: log.errorCode,
          errorTitle: log.previewText || `Thông báo cảnh báo máy ${log.deviceName}`,
          severity: isCritical ? 'CRITICAL' : 'HIGH',
          timestamp: log.timestamp,
          timeAgo: formatTimeAgoVi(log.timestamp),
          status: log.status,
          source: 'PUSH_LOG',
          isAcknowledged: log.status === 'ACKNOWLEDGED',
        });
      }
    });

    // 3. PRIORITY SORT LOGIC:
    // Items with 'CRITICAL' severity are prioritized at the top of the list!
    // Within the same severity level, sort by timestamp descending (newest first).
    return list.sort((a, b) => {
      const getSeverityPriority = (sev: string) => {
        if (sev === 'CRITICAL') return 3;
        if (sev === 'HIGH') return 2;
        if (sev === 'MEDIUM') return 1;
        return 0;
      };

      const priorityDiff = getSeverityPriority(b.severity) - getSeverityPriority(a.severity);
      if (priorityDiff !== 0) {
        return priorityDiff; // Higher priority (CRITICAL) comes first!
      }

      // Secondary sorting: within same severity, newest first
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  }, [devices, notifications]);

  // Filtered alert list inside the dropdown
  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'CRITICAL') {
      return prioritizedAlerts.filter((a) => a.severity === 'CRITICAL');
    }
    if (alertFilter === 'UNACKNOWLEDGED') {
      return prioritizedAlerts.filter((a) => !a.isAcknowledged);
    }
    return prioritizedAlerts;
  }, [prioritizedAlerts, alertFilter]);

  const totalCriticalCount = useMemo(
    () => prioritizedAlerts.filter((a) => a.severity === 'CRITICAL').length,
    [prioritizedAlerts]
  );

  const unacknowledgedCount = useMemo(
    () => prioritizedAlerts.filter((a) => !a.isAcknowledged).length,
    [prioritizedAlerts]
  );

  // Determine active workspace
  const activeWorkspace: WorkspaceId = (() => {
    if (mainViewMode === 'REPORTS_HUB') return 'REPORTS';
    if (mainViewMode === 'ROLE_VIEW' || mainViewMode === 'CONTROL_TOWER') return 'ROLES';
    if (
      mainViewMode === 'DATA_TRUST' ||
      mainViewMode === 'AUDIT_RBAC' ||
      mainViewMode === 'HITL_WORKFLOW' ||
      mainViewMode === 'ALERT_GOVERNANCE'
    ) {
      return 'GOVERNANCE';
    }
    if (
      activeTab === 'learnings' ||
      activeTab === 'documents' ||
      activeTab === 'root-cause-analysis'
    ) {
      return 'AI_KNOWLEDGE';
    }
    if (
      activeTab === 'spare-parts' ||
      activeTab === 'mobile-devices' ||
      activeTab === 'history' ||
      activeTab === 'notifications'
    ) {
      return 'INVENTORY_FLEET';
    }
    return 'MONITORING';
  })();

  const handleSelectWorkspace = (ws: WorkspaceId) => {
    switch (ws) {
      case 'MONITORING':
        onSelectMainViewMode?.('FLEET_GRID');
        setActiveTab('devices');
        break;
      case 'REPORTS':
        onSelectMainViewMode?.('REPORTS_HUB');
        break;
      case 'ROLES':
        onSelectMainViewMode?.('ROLE_VIEW');
        break;
      case 'AI_KNOWLEDGE':
        onSelectMainViewMode?.('FLEET_GRID');
        if (
          activeTab !== 'learnings' &&
          activeTab !== 'documents' &&
          activeTab !== 'root-cause-analysis'
        ) {
          setActiveTab('learnings');
        }
        break;
      case 'INVENTORY_FLEET':
        onSelectMainViewMode?.('FLEET_GRID');
        if (
          activeTab !== 'spare-parts' &&
          activeTab !== 'mobile-devices' &&
          activeTab !== 'history' &&
          activeTab !== 'notifications'
        ) {
          setActiveTab('spare-parts');
        }
        break;
      case 'GOVERNANCE':
        onSelectMainViewMode?.('DATA_TRUST');
        break;
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-200 ${
        isHighContrast
          ? 'border-yellow-400 bg-black'
          : 'border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-lg shadow-black/40'
      }`}
    >
      {/* Top Banner: Industrial IoT Telemetry Header & Priority Quick Actions */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand & Live SCADA Indicator */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => handleSelectWorkspace('MONITORING')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 shadow-lg shadow-orange-500/20 cursor-pointer active:scale-95 transition"
            title="Về màn hình giám sát trung tâm"
          >
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                onClick={() => handleSelectWorkspace('MONITORING')}
                className="text-lg font-bold tracking-tight text-white sm:text-xl cursor-pointer hover:text-amber-400 transition"
              >
                EDM <span className="text-amber-400 font-extrabold">SmartGuard</span>
              </h1>
              <span className="hidden rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-amber-400 border border-amber-500/20 sm:inline-block">
                SCADA AI 4.0
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="truncate">Hệ thống giám sát vận hành &amp; chẩn đoán tức thời</span>
              {/* Online indicator */}
              <span className="hidden md:inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 border-l border-slate-800 pl-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span>ONLINE 1Hz</span>
              </span>
            </div>
          </div>
        </div>

        {/* Priority Quick Actions: Reports, Prioritized Notification Bell, Alarms, Mobile & Tools */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* HIGH IMPACT: Quick Reports Button (DỄ BÁO CÁO) */}
          <button
            onClick={() => {
              if (onOpenQuickReport) {
                onOpenQuickReport();
              } else {
                handleSelectWorkspace('REPORTS');
              }
            }}
            title="Trung tâm báo cáo nhanh: Biên bản giao ca, sự cố MTTR, xuất PDF &amp; CSV"
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-md active:scale-95 ${
              activeWorkspace === 'REPORTS'
                ? 'bg-indigo-600 text-white shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
            }`}
          >
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            <span className="font-bold hidden sm:inline">Báo Cáo &amp; Xuất File</span>
            <span className="sm:hidden font-bold">Báo Cáo</span>
            <span className="hidden sm:inline-block rounded bg-indigo-500/30 px-1.5 py-0.2 text-[10px] font-mono font-bold text-amber-300">
              Mới
            </span>
          </button>

          {/* ========================================================================= */}
          {/* NOTIFICATION & ALARM DROPDOWN (ƯU TIÊN LỖI CRITICAL LÊN HÀNG ĐẦU)        */}
          {/* ========================================================================= */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              onClick={() => setShowNotificationDropdown((prev) => !prev)}
              title={
                totalCriticalCount > 0
                  ? `⚡ Có ${totalCriticalCount} máy có lỗi CRITICAL cần xử lý ngay!`
                  : `Danh sách thông báo & cảnh báo máy (${prioritizedAlerts.length})`
              }
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition active:scale-95 shadow-sm ${
                totalCriticalCount > 0
                  ? 'border-red-500 bg-red-600/30 text-red-300 ring-2 ring-red-500/40 shadow-red-950/60'
                  : showNotificationDropdown
                  ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className="relative">
                <Bell className={`h-4 w-4 ${totalCriticalCount > 0 ? 'text-red-400 animate-bounce' : 'text-slate-300'}`} />
                {totalCriticalCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </div>
              <span className="hidden md:inline">
                {totalCriticalCount > 0 ? 'Lỗi Nguy Cấp' : 'Thông Báo'}
              </span>
              {prioritizedAlerts.length > 0 && (
                <span
                  className={`flex items-center rounded-full px-1.5 py-0.2 text-[10px] font-mono font-black ${
                    totalCriticalCount > 0
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {totalCriticalCount > 0 ? `${totalCriticalCount} CRITICAL` : prioritizedAlerts.length}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotificationDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-700 bg-slate-950/98 p-3 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 space-y-2.5 text-slate-100">
                {/* Header & Filter Tabs */}
                <div className="border-b border-slate-800/80 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className={`h-4 w-4 ${totalCriticalCount > 0 ? 'text-red-400' : 'text-amber-400'}`} />
                      <span className="font-bold text-xs text-white">Cảnh Báo &amp; Thông Báo Máy</span>
                    </div>
                    {totalCriticalCount > 0 && (
                      <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-red-300 border border-red-500/30 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
                        Ưu tiên CRITICAL
                      </span>
                    )}
                  </div>

                  {/* Filter Tabs */}
                  <div className="mt-2 flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setAlertFilter('ALL')}
                      className={`flex-1 py-1 rounded font-semibold transition ${
                        alertFilter === 'ALL'
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Tất cả ({prioritizedAlerts.length})
                    </button>
                    <button
                      onClick={() => setAlertFilter('CRITICAL')}
                      className={`flex-1 py-1 rounded font-semibold transition ${
                        alertFilter === 'CRITICAL'
                          ? 'bg-red-600 text-white font-bold shadow-sm'
                          : 'text-red-400 hover:text-red-300'
                      }`}
                    >
                      Khẩn cấp ({totalCriticalCount})
                    </button>
                    <button
                      onClick={() => setAlertFilter('UNACKNOWLEDGED')}
                      className={`flex-1 py-1 rounded font-semibold transition ${
                        alertFilter === 'UNACKNOWLEDGED'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'text-amber-400 hover:text-amber-300'
                      }`}
                    >
                      Chưa tiếp nhận ({unacknowledgedCount})
                    </button>
                  </div>
                </div>

                {/* Prioritized Alert Cards List */}
                <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                  {filteredAlerts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                      <p className="font-semibold text-slate-300">Không có cảnh báo nào cần xử lý</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Tất cả thiết bị EDM đang vận hành trong ngưỡng chuẩn</p>
                    </div>
                  ) : (
                    filteredAlerts.map((item) => {
                      const isCritical = item.severity === 'CRITICAL';
                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border p-2.5 transition text-xs ${
                            isCritical
                              ? 'border-red-500/60 bg-red-950/30 hover:bg-red-950/50 shadow-sm'
                              : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/90'
                          }`}
                        >
                          {/* Machine & Error Header */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-white text-[11px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                {item.deviceCode}
                              </span>
                              {isCritical ? (
                                <span className="inline-flex items-center gap-1 rounded bg-red-500/30 border border-red-500/50 px-1.5 py-0.2 text-[9px] font-black text-red-300 animate-pulse">
                                  <Flame className="h-2.5 w-2.5 text-red-400" />
                                  CRITICAL
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                                  HIGH
                                </span>
                              )}
                              <span className="font-mono text-red-400 font-bold text-[11px]">
                                {item.errorCode}
                              </span>
                            </div>

                            <span className="font-mono text-[10px] text-slate-400 shrink-0">
                              {item.timeAgo}
                            </span>
                          </div>

                          {/* Machine Name & Error Title */}
                          <div className="mt-1">
                            <div className="font-semibold text-slate-200 text-xs truncate">
                              {item.deviceName}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                              {item.errorTitle}
                            </p>
                          </div>

                          {/* Interactive Action Buttons */}
                          <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                            <div className="text-[10px] font-mono">
                              {item.isAcknowledged ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Đã tiếp nhận
                                </span>
                              ) : (
                                <span className="text-amber-400">Chờ tiếp nhận</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* AI Diagnosis Trigger */}
                              {item.device && onOpenDiagnosis && (
                                <button
                                  onClick={() => {
                                    onOpenDiagnosis(item.device!);
                                    setShowNotificationDropdown(false);
                                  }}
                                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-2 py-1 text-[10px] font-bold text-white transition active:scale-95 shadow-sm"
                                  title="Xem chẩn đoán AI & hướng dẫn sửa máy"
                                >
                                  <Sparkles className="h-3 w-3 text-amber-300" />
                                  <span>Chẩn Đoán AI</span>
                                </button>
                              )}

                              {/* Acknowledge Button */}
                              {!item.isAcknowledged && item.deviceId && onAcknowledgeIncident && (
                                <button
                                  onClick={() => onAcknowledgeIncident(item.deviceId!)}
                                  className="flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 px-2 py-1 text-[10px] font-bold text-slate-950 transition active:scale-95"
                                  title="Xác nhận KTV đã tiếp nhận xử lý sự cố"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Tiếp Nhận</span>
                                </button>
                              )}

                              {/* Machine Details Trigger */}
                              {item.device && onOpenMachineDetails && (
                                <button
                                  onClick={() => {
                                    onOpenMachineDetails(item.device!);
                                    setShowNotificationDropdown(false);
                                  }}
                                  className="rounded-lg bg-slate-800 hover:bg-slate-700 p-1 text-slate-300 hover:text-white transition"
                                  title="Xem lý lịch máy"
                                >
                                  <Info className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Link */}
                <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => {
                      handleSelectWorkspace('INVENTORY_FLEET');
                      setActiveTab('notifications');
                      setShowNotificationDropdown(false);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
                  >
                    <span>Xem toàn bộ nhật ký bắn Push &amp; SMS</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                  <kbd className="rounded bg-slate-800 px-1.5 py-0.2 font-mono text-[10px] text-slate-400">
                    Alt+4
                  </kbd>
                </div>
              </div>
            )}
          </div>

          {/* Emergency Broadcast Toggle */}
          {onToggleEmergencyBroadcast && (
            <button
              onClick={onToggleEmergencyBroadcast}
              title="Mở Bảng Phát Thanh Khẩn Cấp Toàn Xưởng (Emergency Broadcast)"
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-sm active:scale-95 ${
                criticalCount > 0
                  ? 'border-red-500 bg-red-600/30 text-red-300 ring-2 ring-red-500/40 animate-pulse'
                  : isEmergencyBroadcastOpen
                  ? 'border-indigo-500 bg-indigo-600/30 text-indigo-300 font-extrabold'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-red-500/50 hover:text-red-300'
              }`}
            >
              <Megaphone className={`h-4 w-4 ${criticalCount > 0 ? 'text-red-400' : 'text-amber-400'}`} />
              <span className="hidden sm:inline">Phát Thanh Khẩn</span>
              {criticalCount > 0 && (
                <span className="flex items-center rounded-full bg-red-600 px-1.5 py-0.2 text-[10px] font-mono font-black text-white">
                  {criticalCount}
                </span>
              )}
            </button>
          )}

          {/* Simulate Breakdown Button */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-red-600/20 transition active:scale-95"
            title="Mô phỏng sự cố dừng máy EDM để diễn tập quy trình chẩn đoán AI"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Mô Phỏng Dừng Máy</span>
          </button>

          {/* Phone View Button */}
          <button
            onClick={onOpenPhoneView}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-indigo-300 hover:border-indigo-500/40 transition active:scale-95"
            title="Mô phỏng giao diện điện thoại thông minh KTV tại hiện trường"
          >
            <Smartphone className="h-4 w-4 text-indigo-400" />
            <span className="hidden md:inline">Mobile KTV</span>
          </button>

          {/* Consolidated Tools & KTV Menu Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowToolsDropdown((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95"
              title="Công cụ kỹ thuật & cài đặt tiện ích"
            >
              <Settings2 className="h-4 w-4 text-slate-400" />
              <span className="hidden lg:inline">Tiện Ích</span>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </button>

            {/* Dropdown Menu Popover */}
            {showToolsDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-700 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-md z-50 animate-in fade-in slide-in-from-top-2 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Công Cụ &amp; Trợ Giúp KTV
                </div>

                {/* Tech Status Sidebar */}
                <button
                  onClick={() => {
                    onOpenTechStatus();
                    setShowToolsDropdown(false);
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900 hover:text-purple-300 transition"
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-400" />
                    <span>Trực Ca Kỹ Thuật Viên</span>
                  </span>
                  {onDutyTechCount !== undefined && (
                    <span className="rounded-full bg-purple-500/20 px-1.5 py-0.2 text-[10px] font-mono font-bold text-purple-300">
                      {onDutyTechCount} đang trực
                    </span>
                  )}
                </button>

                {/* Audio Alarm Toggle */}
                <button
                  onClick={() => {
                    toggleMute();
                    setShowToolsDropdown(false);
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900 hover:text-amber-300 transition"
                >
                  <span className="flex items-center gap-2">
                    {isMuted ? <VolumeX className="h-4 w-4 text-slate-400" /> : <Volume2 className="h-4 w-4 text-amber-400" />}
                    <span>Âm Còi Báo Động</span>
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${isMuted ? 'text-slate-400' : 'text-amber-400'}`}>
                    {isMuted ? 'Tắt' : 'Bật'}
                  </span>
                </button>

                {/* High Contrast Mode */}
                {onToggleHighContrast && (
                  <button
                    onClick={() => {
                      onToggleHighContrast();
                      setShowToolsDropdown(false);
                    }}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900 hover:text-yellow-400 transition"
                  >
                    <span className="flex items-center gap-2">
                      <Contrast className="h-4 w-4 text-yellow-400" />
                      <span>Chế Độ Tương Phản Cao</span>
                    </span>
                    <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                      Alt+C
                    </kbd>
                  </button>
                )}

                {/* Keyboard Shortcuts */}
                {onOpenShortcuts && (
                  <button
                    onClick={() => {
                      onOpenShortcuts();
                      setShowToolsDropdown(false);
                    }}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900 hover:text-amber-300 transition"
                  >
                    <span className="flex items-center gap-2">
                      <Keyboard className="h-4 w-4 text-amber-400" />
                      <span>Bảng Phím Tắt SCADA</span>
                    </span>
                    <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                      Alt+K
                    </kbd>
                  </button>
                )}

                {/* Onboarding Tour */}
                {onStartTour && (
                  <button
                    onClick={() => {
                      onStartTour();
                      setShowToolsDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900 hover:text-amber-300 transition"
                  >
                    <Compass className="h-4 w-4 text-amber-400" />
                    <span>Hướng Dẫn Cho KTV Mới</span>
                  </button>
                )}

                {/* System Docs */}
                <button
                  onClick={() => {
                    setShowDocModal(true);
                    setShowToolsDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900 hover:text-blue-300 transition"
                >
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  <span>Tài Liệu Toàn Diện Hệ Thống</span>
                </button>

                {/* Web Push */}
                <button
                  onClick={() => {
                    handleRequestPush();
                    setShowToolsDropdown(false);
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-900 hover:text-emerald-300 transition"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-emerald-400" />
                    <span>Thông Báo Trình Duyệt</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {pushPermission === 'granted' ? 'Đã bật' : 'Chưa bật'}
                  </span>
                </button>

                {/* PWA Install */}
                <div className="pt-1 border-t border-slate-800/80 px-2 pb-1">
                  <PWAInstallButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Navigation Workspaces (6 Organized Hubs) */}
      <div className="mx-auto flex max-w-7xl items-center justify-between border-t border-slate-800/80 px-4 py-1.5 sm:px-6">
        <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none py-0.5">
          {/* 1. Monitoring Workspace */}
          <button
            onClick={() => handleSelectWorkspace('MONITORING')}
            title="Lưới Giám Sát Toàn Bộ Đội Máy EDM (Alt+1)"
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition shrink-0 ${
              activeWorkspace === 'MONITORING'
                ? 'bg-slate-800 text-amber-400 shadow-md border border-slate-700'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>Giám Sát Vận Hành</span>
            {stats && stats.alarmCount > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white animate-pulse">
                {stats.alarmCount} dừng
              </span>
            )}
          </button>

          {/* 2. Reports Hub (KEY USER FOCUS) */}
          <button
            onClick={() => handleSelectWorkspace('REPORTS')}
            title="Trung Tâm Báo Cáo: Giao ca, sự cố MTTR, xu hướng năng lượng & xuất hồ sơ"
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition shrink-0 ${
              activeWorkspace === 'REPORTS'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/40 border border-indigo-400/50'
                : 'text-indigo-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4 text-amber-300" />
            <span>Trung Tâm Báo Cáo</span>
            <span className="rounded bg-indigo-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-300 border border-indigo-400/30">
              Xuất File
            </span>
          </button>

          {/* 3. Role Command Views */}
          <button
            onClick={() => handleSelectWorkspace('ROLES')}
            title="Giao Diện Phân Quyền Theo Vai Trò (Giám Đốc, EQM Leader, Kỹ Thuật Viên, Control Tower)"
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition shrink-0 ${
              activeWorkspace === 'ROLES'
                ? 'bg-gradient-to-r from-amber-500/25 via-blue-500/25 to-emerald-500/25 text-white border border-amber-400/50 shadow-md shadow-amber-950/40 ring-1 ring-amber-400/30'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Shield className="h-4 w-4 text-amber-400" />
            <span>Điều Hành Vai Trò</span>
            <span className="rounded bg-black/40 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">
              4 Cấp
            </span>
          </button>

          {/* 4. AI & Engineering Knowledge */}
          <button
            onClick={() => handleSelectWorkspace('AI_KNOWLEDGE')}
            title="Trí Tuệ Kỹ Thuật AI: Bài học thực tế, SOP/OEM & Phân tích nguyên nhân gốc rễ (RCA)"
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition shrink-0 ${
              activeWorkspace === 'AI_KNOWLEDGE'
                ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-200 border border-purple-500/50 shadow-md'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Brain className="h-4 w-4 text-purple-400" />
            <span>Trí Tuệ Kỹ Thuật AI</span>
          </button>

          {/* 5. Inventory & Mobile Fleet */}
          <button
            onClick={() => handleSelectWorkspace('INVENTORY_FLEET')}
            title="Kho Phụ Tùng, Quản Lý Thiết Bị Di Động & Lịch Sử Sửa Chữa"
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition shrink-0 ${
              activeWorkspace === 'INVENTORY_FLEET'
                ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-200 border border-cyan-500/50 shadow-md'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Package className="h-4 w-4 text-cyan-400" />
            <span>Phụ Tùng &amp; Thiết Bị</span>
          </button>

          {/* 6. Governance & Trust */}
          <button
            onClick={() => handleSelectWorkspace('GOVERNANCE')}
            title="Quản Trị Dữ Liệu Đáng Tin Cậy & Nhật Ký Kiểm Toán (Audit Log)"
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition shrink-0 ${
              activeWorkspace === 'GOVERNANCE'
                ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-200 border border-emerald-500/50 shadow-md'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <HardDrive className="h-4 w-4 text-emerald-400" />
            <span>Quản Trị &amp; Bảo Mật</span>
          </button>
        </nav>

        {/* Real-time KPI Bar */}
        {stats && (
          <div className="hidden xl:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Đang chạy: {stats.runningCount}/{stats.totalDevices}</span>
            </div>
            {stats.alarmCount > 0 ? (
              <div className="flex items-center gap-1.5 text-red-400 font-bold animate-pulse">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span>DỪNG: {stats.alarmCount}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                <span>Sự cố: 0</span>
              </div>
            )}
            <div className="text-slate-400 border-l border-slate-800 pl-3">
              OEE: <span className="font-semibold text-amber-400">{stats.avgOee}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Contextual Sub-Nav Bar for Workspaces with Multiple Sections */}
      {activeWorkspace === 'AI_KNOWLEDGE' && (
        <div className="bg-slate-900/80 border-t border-slate-800/60 px-4 py-1.5 sm:px-6 flex items-center gap-2 text-xs overflow-x-auto scrollbar-none">
          <span className="text-slate-500 font-mono text-[11px] mr-1">Chuyên mục AI:</span>
          <button
            onClick={() => setActiveTab('learnings')}
            className={`rounded-lg px-3 py-1 font-semibold transition ${
              activeTab === 'learnings'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Bộ Não Tri Thức AI ({stats?.totalLearnings || 0} bài học)
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`rounded-lg px-3 py-1 font-semibold transition ${
              activeTab === 'documents'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Kho Tài Liệu SOP/OEM ({stats?.totalDocuments || 0})
          </button>
          <button
            onClick={() => setActiveTab('root-cause-analysis')}
            className={`rounded-lg px-3 py-1 font-semibold transition ${
              activeTab === 'root-cause-analysis'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Phân Tích Gốc Rễ (RCA AI)
          </button>
        </div>
      )}

      {activeWorkspace === 'INVENTORY_FLEET' && (
        <div className="bg-slate-900/80 border-t border-slate-800/60 px-4 py-1.5 sm:px-6 flex items-center gap-2 text-xs overflow-x-auto scrollbar-none">
          <span className="text-slate-500 font-mono text-[11px] mr-1">Kho &amp; Đội Thiết Bị:</span>
          <button
            onClick={() => setActiveTab('spare-parts')}
            className={`rounded-lg px-3 py-1 font-semibold transition ${
              activeTab === 'spare-parts'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Kho Phụ Tùng Linh Kiện
          </button>
          <button
            onClick={() => setActiveTab('mobile-devices')}
            className={`rounded-lg px-3 py-1 font-semibold transition ${
              activeTab === 'mobile-devices'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Thiết Bị Di Động ({onlineMobileCount} online)
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`rounded-lg px-3 py-1 font-semibold transition ${
              activeTab === 'history'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Lịch Sử Sửa Chữa
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`rounded-lg px-3 py-1 font-semibold transition ${
              activeTab === 'notifications'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Nhật Ký Thông Báo
          </button>
        </div>
      )}

      {activeWorkspace === 'GOVERNANCE' && (
        <div className="bg-slate-900/80 border-t border-slate-800/60 px-4 py-1.5 sm:px-6 flex items-center gap-2 text-xs overflow-x-auto scrollbar-none">
          <span className="text-slate-500 font-mono text-[11px] mr-1">Quản trị &amp; Kiểm toán:</span>
          <button
            onClick={() => onSelectMainViewMode?.('DATA_TRUST')}
            className={`rounded-lg px-3 py-1 font-semibold transition ${
              mainViewMode === 'DATA_TRUST'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Data Trust Center (Chất Lượng Dữ Liệu)
          </button>
          <button
            onClick={() => onSelectMainViewMode?.('AUDIT_RBAC')}
            className={`rounded-lg px-3 py-1 font-semibold transition ${
              mainViewMode === 'AUDIT_RBAC'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Audit Log Bất Biến &amp; RBAC 8 Vai Trò
          </button>
          <button
            onClick={() => onSelectMainViewMode?.('HITL_WORKFLOW')}
            className={`rounded-lg px-3 py-1 font-semibold transition ${
              mainViewMode === 'HITL_WORKFLOW'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            HITL Workflow (Con Người Giám Sát AI)
          </button>
          <button
            onClick={() => onSelectMainViewMode?.('ALERT_GOVERNANCE')}
            className={`rounded-lg px-3 py-1 font-semibold transition ${
              mainViewMode === 'ALERT_GOVERNANCE'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Alert Governance (Quản Trị Báo Động)
          </button>
        </div>
      )}

      {/* Official System Documentation Viewer Modal */}
      <SystemDocumentationModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
      />
    </header>
  );
};
