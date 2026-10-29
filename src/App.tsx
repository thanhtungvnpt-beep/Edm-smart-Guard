/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  CheckSquare,
  FileText,
  Filter,
  Layers,
  QrCode,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
  SlidersHorizontal,
  Bookmark,
  Smartphone,
  Building2,
  Users2,
  Users,
  Wrench,
} from 'lucide-react';
import {
  Device,
  FactoryStats,
  NotificationLog,
  TechnicalDocument,
  Technician,
  AILearning,
  MobileDevice,
} from './types';
import { Header } from './components/Header';
import { DeviceCard } from './components/DeviceCard';
import { EmergencyModal } from './components/EmergencyModal';
import { EmergencyBroadcastPanel } from './components/EmergencyBroadcastPanel';
import { PhoneSimulatorModal } from './components/PhoneSimulatorModal';
import { AIDiagnosisModal } from './components/AIDiagnosisModal';
import { RepairReportModal } from './components/RepairReportModal';
import { AILearningsTab } from './components/AILearningsTab';
import { DocumentsTab } from './components/DocumentsTab';
import { NotificationsTab } from './components/NotificationsTab';
import { MobileDevicesManagementTab } from './components/MobileDevicesManagementTab';
import { MaintenanceHistoryTab } from './components/MaintenanceHistoryTab';
import { AIRootCauseAnalysisModule } from './components/AIRootCauseAnalysisModule';
import { SparePartsInventoryTab } from './components/SparePartsInventoryTab';
import { FloatingBatchActionBar } from './components/FloatingBatchActionBar';
import { EdmSimulatorModal } from './components/EdmSimulatorModal';
import { PerformanceAnalytics } from './components/PerformanceAnalytics';
import { FacilitySummaryCard } from './components/FacilitySummaryCard';
import { WorkshopHeatmap } from './components/WorkshopHeatmap';
import { PredictiveMaintenanceAlerts } from './components/PredictiveMaintenanceAlerts';
import { AIPredictiveMaintenanceScheduleBanner } from './components/AIPredictiveMaintenanceScheduleBanner';
import { AIVibrationCurrentPredictiveModal } from './components/AIVibrationCurrentPredictiveModal';
import { MachineDetailsModal } from './components/MachineDetailsModal';
import { MachineTelemetryHistoryModal } from './components/MachineTelemetryHistoryModal';
import { TechnicianStatusSidebar } from './components/TechnicianStatusSidebar';
import { QRCodeScannerModal } from './components/QRCodeScannerModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ShortcutTelemetryState } from './types';
import {
  getInitialShortcutTelemetry,
  recordShortcutUse,
  resetShortcutTelemetry,
} from './utils/shortcutTelemetry';
import { OfflineConnectivityBanner } from './components/OfflineConnectivityBanner';
import { DashboardCardsContainer } from './components/DashboardCardsContainer';
import {
  AdvancedFilterPanel,
  AdvancedFilterCriteria,
  DEFAULT_ADVANCED_FILTERS,
  areCriteriaEqual,
  getSavedQuickPresets,
  matchesShift,
} from './components/AdvancedFilterPanel';
import { VoiceSearchBar } from './components/VoiceSearchBar';
import { OnboardingTour } from './components/OnboardingTour';
import { getDeviceOperationalMetrics } from './utils/operationalMetrics';
import {
  TopLevelCardId,
  getStoredDashboardCardsOrder,
} from './utils/dashboardLayoutStorage';
import { useOfflineStatus } from './hooks/useOfflineStatus';
import { cacheOfflineSnapshot, getOfflineSnapshot } from './utils/offlineManager';
import { soundManager } from './utils/audio';
import { getPushPermissionStatus, requestPushPermission, triggerEmergencyPushNotification } from './utils/notifications';
import { RoleNavigationHeader, UserRole, ViewportMode, MainViewMode, PLANTS } from './components/roles/RoleNavigationHeader';
import { PlantDirectorView } from './components/roles/PlantDirectorView';
import { EqmLeaderView } from './components/roles/EqmLeaderView';
import { FieldTechnicianView } from './components/roles/FieldTechnicianView';
import { CrossFactoryCommunityView } from './components/roles/CrossFactoryCommunityView';
import { AiPerformanceControlTower } from './components/phase2/AiPerformanceControlTower';
import { WeeklyIncidentReportModal } from './components/WeeklyIncidentReportModal';
import { getStoredMaintenanceRecords } from './utils/maintenanceHistoryData';
import { DataTrustCenter } from './components/trust/DataTrustCenter';
import { AuditLogAndRbacCenter } from './components/trust/AuditLogAndRbacCenter';
import { EnhancedAlertManagementCenter } from './components/trust/EnhancedAlertManagementCenter';
import { HitlWorkflowManagementCenter } from './components/trust/HitlWorkflowManagementCenter';
import { UnifiedReportsHub } from './components/UnifiedReportsHub';
import { IndustrialControlTowerPro } from './components/IndustrialControlTowerPro';
import { ControlTowerLayout } from './components/ControlTowerLayout';
import { TechnicianSkillsComparisonChart } from './components/TechnicianSkillsComparisonChart';
import { AIVibrationFailurePredictionModal } from './components/AIVibrationFailurePredictionModal';

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [mobileDevices, setMobileDevices] = useState<MobileDevice[]>([]);
  const [stats, setStats] = useState<FactoryStats | null>(null);
  const [documents, setDocuments] = useState<TechnicalDocument[]>([]);
  const [learnings, setLearnings] = useState<AILearning[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);

  // Role-Based Views: Director, EQM Leader, Field Technician & PC/Mobile Viewport Modes
  const [currentRole, setCurrentRole] = useState<UserRole>('DIRECTOR');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('PC');
  const [currentPlant, setCurrentPlant] = useState<string>('plant-01');
  const [mainViewMode, setMainViewMode] = useState<MainViewMode>('ROLE_VIEW');
  const [phoneFramePreview, setPhoneFramePreview] = useState<boolean>(true);
  const [showWeeklyReportModal, setShowWeeklyReportModal] = useState<boolean>(false);

  // Navigation
  const [activeNav, setActiveNav] = useState<string>('overview');
  const [activeTab, setActiveTab] = useState<
    'devices' | 'learnings' | 'documents' | 'notifications' | 'mobile-devices' | 'history' | 'root-cause-analysis' | 'spare-parts'
  >('devices');
  const [rcaDeviceTargetId, setRcaDeviceTargetId] = useState<string>('ALL');
  const [rcaErrorCodeTarget, setRcaErrorCodeTarget] = useState<string>('E-102');
  const [inventoryTargetPartId, setInventoryTargetPartId] = useState<string>('');

  // Filters
  const [deviceFilter, setDeviceFilter] = useState<'ALL' | 'ALARM' | 'RUNNING' | 'MAINTENANCE' | 'MAINTENANCE_SCHEDULED' | 'IDLE' | 'WIRE_EDM' | 'SINKER_EDM'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterCriteria>(DEFAULT_ADVANCED_FILTERS);

  // Audio & Notification Permissions
  const [isMuted, setIsMuted] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(getPushPermissionStatus());

  // Modals
  const [emergencyDevice, setEmergencyDevice] = useState<Device | null>(null);
  const [diagnosisDevice, setDiagnosisDevice] = useState<Device | null>(null);
  const [phoneDevice, setPhoneDevice] = useState<Device | null>(null);
  const [repairDevice, setRepairDevice] = useState<Device | null>(null);
  const [detailsDevice, setDetailsDevice] = useState<Device | null>(null);
  const [predictiveDevice, setPredictiveDevice] = useState<Device | null>(null);
  const [telemetryHistoryDevice, setTelemetryHistoryDevice] = useState<Device | null>(null);
  const [d3FailureDevice, setD3FailureDevice] = useState<Device | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showTechSidebar, setShowTechSidebar] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showEmergencyBroadcast, setShowEmergencyBroadcast] = useState<boolean>(true);

  const criticalAlarmCount = useMemo(() => {
    return devices.filter((d) => d.status === 'ALARM_STOPPED' || d.activeIncident?.severity === 'CRITICAL').length;
  }, [devices]);

  // Industrial Keyboard Shortcuts Telemetry State (Local State tracking usage frequency)
  const [shortcutTelemetry, setShortcutTelemetry] = useState<ShortcutTelemetryState>(() =>
    getInitialShortcutTelemetry()
  );

  const recordShortcut = useCallback((shortcutId: string) => {
    setShortcutTelemetry((prev) => recordShortcutUse(prev, shortcutId));
  }, []);
  const [showOnboardingTour, setShowOnboardingTour] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('smartguard_onboarding_completed');
      return completed !== 'true';
    }
    return false;
  });

  // Success Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fleet Maintenance Notifications Silencing State
  const [maintenanceNotificationsEnabled, setMaintenanceNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartguard_fleet_maintenance_notifications_enabled');
      return saved !== 'false';
    }
    return true;
  });

  const handleToggleMaintenanceNotifications = (enabled: boolean) => {
    setMaintenanceNotificationsEnabled(enabled);
    localStorage.setItem('smartguard_fleet_maintenance_notifications_enabled', String(enabled));
    if (enabled) {
      showToast('Đã BẬT thông báo bảo dưỡng dự đoán toàn bộ hạm đội máy trong xưởng.');
    } else {
      showToast('Đã TẮT thông báo bảo dưỡng dự đoán toàn xưởng (Chế độ yên lặng hạm đội).');
    }
  };

  // High Contrast Mode for Workshop Glare and Dim Light
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem('edm_high_contrast_mode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isHighContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    } catch {}
  }, [isHighContrast]);

  const toggleHighContrast = () => {
    setIsHighContrast((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('edm_high_contrast_mode', String(next));
      } catch {}
      soundManager.playBeep();
      showToast(
        next
          ? '👁️ [High Contrast] Đã BẬT chế độ tương phản cao cho xưởng thiếu sáng & chói sáng'
          : '👁️ [High Contrast] Đã TẮT chế độ tương phản cao'
      );
      return next;
    });
  };

  // Dashboard Top-Level Cards Layout Order (Drag-and-Drop Customizable)
  const [dashboardCardOrder, setDashboardCardOrder] = useState<TopLevelCardId[]>(() =>
    getStoredDashboardCardsOrder()
  );

  // Offline State & Intermittent Connectivity Management
  const { isOnline, isSimulated, cacheInfo, toggleSimulateOffline, refreshCacheInfo } =
    useOfflineStatus();

  // Track previously alarmed devices to prevent redundant siren triggers
  const previousAlarmIdsRef = useRef<Set<string>>(new Set());

  // Batch Machine Selection State for 'Devices' Tab (Simultaneous Operations Toolbar)
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

  const handleToggleSelectDevice = (deviceId: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleQRScanSuccess = (device: Device) => {
    setDetailsDevice(device);
    showToast(`Đã nhận diện mã QR máy ${device.code}! Mở hồ sơ kỹ thuật & lịch sử chẩn đoán.`);
  };

  // Supervisor actions: Update technician shift status & reassign machine load
  const handleUpdateTechStatus = async (techId: string, status: Technician['activeStatus']) => {
    setTechnicians((prev) =>
      prev.map((t) => (t.id === techId ? { ...t, activeStatus: status } : t))
    );
    try {
      await fetch(`/api/technicians/${techId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeStatus: status }),
      });
    } catch (err) {
      console.error('Failed to update technician status on server:', err);
    }
    const tech = technicians.find((t) => t.id === techId);
    showToast(`Đã chuyển trạng thái KTV ${tech?.name || techId} sang "${status}"`);
  };

  const handleReassignDevice = async (deviceId: string, techId: string) => {
    const targetTech = technicians.find((t) => t.id === techId);
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, assignedTechnicianId: techId, assignedTechnician: targetTech }
          : d
      )
    );
    try {
      await fetch(`/api/devices/${deviceId}/assign-technician`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: techId }),
      });
    } catch (err) {
      console.error('Failed to reassign device technician:', err);
    }
    const dev = devices.find((d) => d.id === deviceId);
    showToast(`Đã điều phối máy ${dev?.code || deviceId} cho KTV ${targetTech?.name || techId}!`);
  };

  // Helper for safe fetch without crashing on network hiccup
  const safeFetchJson = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return { success: false };
      return await res.json();
    } catch {
      return { success: false };
    }
  };

  // --- FETCH DATA ---
  const fetchAllData = async () => {
    try {
      const [devRes, statRes, docRes, learnRes, notifRes, techRes, mobRes] = await Promise.all([
        safeFetchJson('/api/devices'),
        safeFetchJson('/api/stats'),
        safeFetchJson('/api/documents'),
        safeFetchJson('/api/ai/learnings'),
        safeFetchJson('/api/notifications'),
        safeFetchJson('/api/technicians'),
        safeFetchJson('/api/mobile-devices'),
      ]);

      if (devRes && devRes.success && Array.isArray(devRes.data)) {
        setDevices(devRes.data);

        // Cache fresh snapshot to Service Worker and LocalStorage for offline viewing
        const freshDocs =
          docRes && docRes.success && Array.isArray(docRes.data) ? docRes.data : documents;
        const freshLearnings =
          learnRes && learnRes.success && Array.isArray(learnRes.data) ? learnRes.data : learnings;
        cacheOfflineSnapshot(devRes.data, freshDocs, freshLearnings);
        refreshCacheInfo();

        // Check for new alarms
        const currentAlarms = devRes.data.filter((d: Device) => d.status === 'ALARM_STOPPED');
        currentAlarms.forEach((d: Device) => {
          if (!previousAlarmIdsRef.current.has(d.id)) {
            // New alarm detected!
            previousAlarmIdsRef.current.add(d.id);
            soundManager.playIndustrialAlarm();
            if (d.activeIncident && d.assignedTechnician) {
              triggerEmergencyPushNotification(
                d.code,
                d.name,
                d.activeIncident.errorCode,
                d.activeIncident.errorTitle,
                d.assignedTechnician.name
              );
            }
            // Auto open emergency popup if not already viewing one
            setEmergencyDevice((prev) => prev || d);
          }
        });

        // Clean up resolved alarms from tracked set
        const activeAlarmIds = new Set<string>(currentAlarms.map((d: Device) => d.id));
        previousAlarmIdsRef.current = activeAlarmIds;
      } else {
        // Fallback to offline cached snapshot if server is unreachable
        const offlineData = getOfflineSnapshot();
        if (offlineData.devices.length > 0) {
          setDevices((curr) => (curr.length > 0 ? curr : offlineData.devices));
          if (offlineData.documents.length > 0) {
            setDocuments((curr) => (curr.length > 0 ? curr : offlineData.documents));
          }
          if (offlineData.learnings.length > 0) {
            setLearnings((curr) => (curr.length > 0 ? curr : offlineData.learnings));
          }
        }
      }

      if (statRes && statRes.success && statRes.data) setStats(statRes.data);
      if (docRes && docRes.success && Array.isArray(docRes.data)) setDocuments(docRes.data);
      if (learnRes && learnRes.success && Array.isArray(learnRes.data)) setLearnings(learnRes.data);
      if (notifRes && notifRes.success && Array.isArray(notifRes.data)) setNotifications(notifRes.data);
      if (techRes && techRes.success && Array.isArray(techRes.data)) setTechnicians(techRes.data);
      if (mobRes && mobRes.success && Array.isArray(mobRes.data)) setMobileDevices(mobRes.data);
    } catch (err) {
      console.warn('Fetch sync warning (operating in offline fallback):', err);
      // Fallback to offline cached snapshot
      const offlineData = getOfflineSnapshot();
      if (offlineData.devices.length > 0) {
        setDevices((curr) => (curr.length > 0 ? curr : offlineData.devices));
        if (offlineData.documents.length > 0) {
          setDocuments((curr) => (curr.length > 0 ? curr : offlineData.documents));
        }
      }
    }
  };

  // --- MOBILE DEVICE FLEET HANDLERS ---
  const handleSendMobileTestPush = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/mobile-devices/${deviceId}/push-test`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.data) {
        setNotifications((prev) => [data.data, ...prev]);
        showToast(data.message || 'Đã gửi thông báo đẩy kiểm thử tới thiết bị!');
      }
    } catch (err) {
      console.error('Failed to send test push to mobile device:', err);
    }
  };

  const handlePingMobileDevice = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/mobile-devices/${deviceId}/ping`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMobileDevices((prev) =>
          prev.map((m) => (m.id === deviceId ? data.data : m))
        );
        showToast(data.message || 'Ping phản hồi thành công!');
      }
    } catch (err) {
      console.error('Failed to ping mobile device:', err);
    }
  };

  const handleToggleLockMobileDevice = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/mobile-devices/${deviceId}/toggle-lock`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMobileDevices((prev) =>
          prev.map((m) => (m.id === deviceId ? data.data : m))
        );
        showToast(data.message);
      }
    } catch (err) {
      console.error('Failed to toggle device lock:', err);
    }
  };

  const handleDeleteMobileDevice = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/mobile-devices/${deviceId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMobileDevices((prev) => prev.filter((m) => m.id !== deviceId));
        showToast(data.message);
      }
    } catch (err) {
      console.error('Failed to delete mobile device:', err);
    }
  };

  const handleRegisterMobileDevice = async (newDevData: Partial<MobileDevice>) => {
    try {
      const res = await fetch('/api/mobile-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDevData),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMobileDevices((prev) => [data.data, ...prev]);
        showToast(data.message || 'Đăng ký thiết bị di động mới thành công!');
      }
    } catch (err) {
      console.error('Failed to register mobile device:', err);
    }
  };

  const handleBroadcastMobile = async (
    title: string,
    message: string,
    urgency: 'INFO' | 'CRITICAL'
  ) => {
    try {
      const res = await fetch('/api/mobile-devices/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageTitle: title, messageBody: message, urgency }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setNotifications((prev) => [data.data, ...prev]);
        showToast(data.message || 'Đã phát thông báo toàn xưởng thành công!');
      }
    } catch (err) {
      console.error('Failed to broadcast to mobile devices:', err);
    }
  };

  useEffect(() => {
    // Initial immediate rehydration from offline storage
    const offlineData = getOfflineSnapshot();
    if (offlineData.devices.length > 0) {
      setDevices(offlineData.devices);
      if (offlineData.documents.length > 0) setDocuments(offlineData.documents);
      if (offlineData.learnings.length > 0) setLearnings(offlineData.learnings);
    }

    fetchAllData();
    // Poll telemetry every 2.5 seconds when online
    const interval = setInterval(() => {
      if (isOnline) {
        fetchAllData();
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [isOnline]);

  // --- AUDIO & PUSH HANDLERS ---
  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    soundManager.setMuted(nextState);
  };

  const handleRequestPush = async () => {
    const perm = await requestPushPermission();
    setPushPermission(perm);
    if (perm === 'granted') {
      showToast('Đã kích hoạt thông báo đẩy trình duyệt thành công!');
    }
  };

  // --- INDUSTRIAL KEYBOARD SHORTCUTS LISTENER ---
  // Optimized for technicians wearing gloves or working on IPC operator consoles
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditingText =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);

      // 1. Alt + Number (1-5): Fast Tab Switching
      // Supports standard digit keys (1-5) and industrial numeric keypads (Numpad1-5)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
          e.preventDefault();
          recordShortcut('alt_1');
          setActiveTab('devices');
          soundManager.playBeep();
          showToast('⚡ [Alt+1] Chuyển tab: Giám Sát EDM Trực Tuyến');
          return;
        }
        if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
          e.preventDefault();
          recordShortcut('alt_2');
          setActiveTab('learnings');
          soundManager.playBeep();
          showToast('⚡ [Alt+2] Chuyển tab: Bộ Não Tri Thức AI');
          return;
        }
        if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
          e.preventDefault();
          recordShortcut('alt_3');
          setActiveTab('documents');
          soundManager.playBeep();
          showToast('⚡ [Alt+3] Chuyển tab: Kho Tài Liệu Kỹ Thuật (SOP/OEM)');
          return;
        }
        if (e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4') {
          e.preventDefault();
          recordShortcut('alt_4');
          setActiveTab('notifications');
          soundManager.playBeep();
          showToast('⚡ [Alt+4] Chuyển tab: Nhật Ký Bắn Push');
          return;
        }
        if (e.key === '5' || e.code === 'Digit5' || e.code === 'Numpad5') {
          e.preventDefault();
          recordShortcut('alt_5');
          setActiveTab('mobile-devices');
          soundManager.playBeep();
          showToast('⚡ [Alt+5] Chuyển tab: Quản Lý Thiết Bị Di Động');
          return;
        }
        if (e.key === '6' || e.code === 'Digit6' || e.code === 'Numpad6') {
          e.preventDefault();
          recordShortcut('alt_6');
          setActiveTab('history');
          soundManager.playBeep();
          showToast('⚡ [Alt+6] Chuyển tab: Hồ Sơ Lịch Sử Sửa Chữa & Bảo Trì');
          return;
        }
        if (e.key === '7' || e.code === 'Digit7' || e.code === 'Numpad7') {
          e.preventDefault();
          recordShortcut('alt_7');
          setActiveTab('root-cause-analysis');
          soundManager.playBeep();
          showToast('⚡ [Alt+7] Chuyển tab: Module AI Phân Tích Nguyên Nhân Gốc Rễ (RCA)');
          return;
        }
        if (e.key === '8' || e.code === 'Digit8' || e.code === 'Numpad8') {
          e.preventDefault();
          recordShortcut('alt_8');
          setActiveTab('spare-parts');
          soundManager.playBeep();
          showToast('⚡ [Alt+8] Chuyển tab: Quản Lý Kho Phụ Tùng & Vật Tư');
          return;
        }

        // Alt + B: Toggle Emergency Broadcast Command Center
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          recordShortcut('alt_b');
          if (activeTab !== 'devices') {
            setActiveTab('devices');
            setShowEmergencyBroadcast(true);
          } else {
            setShowEmergencyBroadcast((prev) => !prev);
          }
          soundManager.playBeep();
          showToast('⚡ [Alt+B] Bật/Tắt Bảng Phát Thanh Khẩn Cấp Toàn Xưởng');
          return;
        }

        // Alt + K or Alt + /: Toggle Industrial Keyboard Shortcuts Cheat Sheet
        if (e.key === 'k' || e.key === 'K' || e.key === '/' || e.key === '?') {
          e.preventDefault();
          recordShortcut('alt_k');
          setShowKeyboardShortcuts((prev) => !prev);
          soundManager.playBeep();
          return;
        }

        // Alt + E: Emergency AI Diagnosis for machine with recent error or warning
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          recordShortcut('alt_e');
          soundManager.playBeep();

          const targetDev =
            devices.find((d) => d.status === 'ALARM_STOPPED') ||
            devices.find((d) => d.status === 'WARNING') ||
            (emergencyDevice ? devices.find((d) => d.id === emergencyDevice.id) : null) ||
            devices.find((d) => d.status !== 'RUNNING') ||
            devices[0];

          if (targetDev) {
            setDiagnosisDevice(targetDev);
            showToast(`⚡ [Alt+E] Kích hoạt khẩn: Trợ Lý AI Chẩn Đoán cho ${targetDev.name} (${targetDev.code})`);
          } else {
            showToast('⚡ [Alt+E] Chưa có máy EDM nào trong hệ thống');
          }
          return;
        }

        // Alt + C: Toggle High Contrast Mode (Anti-Glare / Low-Light Workshop)
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          recordShortcut('alt_c');
          toggleHighContrast();
          return;
        }

        // Alt + Q: Fast Open Physical Machine QR Code Scanner
        if (e.key === 'q' || e.key === 'Q') {
          e.preventDefault();
          recordShortcut('alt_q');
          setShowQRScanner((prev) => !prev);
          soundManager.playBeep();
          showToast('⚡ [Alt+Q] Mở camera quét mã QR thiết bị EDM');
          return;
        }

        // Alt + T: Fast Open Technician On-Duty & Shift Sidebar
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          recordShortcut('alt_t');
          setShowTechSidebar((prev) => !prev);
          soundManager.playBeep();
          return;
        }

        // Alt + M: Fast Mute / Unmute Siren Alarm
        if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          recordShortcut('alt_m');
          toggleMute();
          showToast(isMuted ? '⚡ [Alt+M] Đã BẬT còi báo động công nghiệp' : '⚡ [Alt+M] Đã TẮT còi báo động');
          return;
        }

        // Alt + F / Alt + S: Focus Machine / Error Code Search Box
        if (e.key === 'f' || e.key === 'F' || e.key === 's' || e.key === 'S') {
          e.preventDefault();
          recordShortcut('alt_f');
          setActiveTab('devices');
          setTimeout(() => {
            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
              searchInput.select();
            }
          }, 80);
          showToast('⚡ [Alt+F] Ô tìm kiếm máy EDM / mã lỗi chẩn đoán');
          return;
        }

        // Alt + R: Fast Refresh Data (fetchAllData)
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          recordShortcut('shift_r');
          soundManager.playBeep();
          fetchAllData();
          showToast('⚡ [Alt+R] Đã làm mới & đồng bộ dữ liệu toàn xưởng EDM!');
          return;
        }
      }

      // 2. Shift + R: Fast Refresh Data (fetchAllData) across any screen
      if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'r' || e.key === 'R' || e.code === 'KeyR')) {
        if (!isEditingText) {
          e.preventDefault();
          recordShortcut('shift_r');
          soundManager.playBeep();
          fetchAllData();
          showToast('⚡ [Shift+R] Đã làm mới & đồng bộ dữ liệu thời gian thực từ EDM Gateway!');
          return;
        }
      }

      // Standalone '?' key or Shift + '/' to view cheat sheet when not editing text
      if (!isEditingText && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
        e.preventDefault();
        recordShortcut('alt_k');
        setShowKeyboardShortcuts((prev) => !prev);
        soundManager.playBeep();
      }

      // Escape key tracking (telemetry for modal dismissals and clearing batch selection)
      if (e.key === 'Escape') {
        recordShortcut('escape');
        setSelectedDeviceIds([]);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isMuted, recordShortcut, devices, emergencyDevice, isHighContrast, selectedDeviceIds]);

  // --- TRIGGER EDM ALARM ---
  const handleTriggerAlarm = async (deviceId: string, errorCode: string = 'E-102', errorTitle: string = 'Sự cố đứt dây & sụt áp phóng điện') => {
    try {
      const res = await fetch('/api/edm/trigger-alarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, errorCode, errorTitle }),
      });
      const data = await res.json();
      if (data.success) {
        soundManager.playIndustrialAlarm();
        fetchAllData();
        const alarmedDev = devices.find((d) => d.id === deviceId);
        if (alarmedDev) {
          const tech = alarmedDev.assignedTechnician || technicians[0];
          triggerEmergencyPushNotification(
            alarmedDev.code,
            alarmedDev.name,
            errorCode,
            errorTitle,
            tech.name
          );
          setEmergencyDevice({
            ...alarmedDev,
            status: 'ALARM_STOPPED',
            activeIncident: data.incident,
          });
        }
        showToast(data.message);
      }
    } catch (e) {
      console.error('Alarm trigger failed:', e);
    }
  };

  // --- ACKNOWLEDGE INCIDENT ---
  const handleAcknowledge = async (deviceId: string) => {
    try {
      const dev = devices.find((d) => d.id === deviceId);
      const techName = dev?.assignedTechnician?.name || 'Kỹ thuật viên phụ trách';

      const res = await fetch(`/api/devices/${deviceId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianName: techName }),
      });
      const data = await res.json();
      if (data.success) {
        soundManager.playSuccessChime();
        fetchAllData();
        showToast(`Kỹ thuật viên ${techName} đã tiếp nhận xử lý!`);
      }
    } catch (e) {
      console.error('Acknowledge failed:', e);
    }
  };

  // --- REPAIR COMPLETED CALLBACK ---
  const handleRepairSuccess = (newLearning?: AILearning) => {
    fetchAllData();
    if (newLearning) {
      setLearnings((prev) => [newLearning, ...prev]);
      showToast(`Máy đã phục hồi! AI vừa học bài học mới: "${newLearning.title}"`);
    } else {
      showToast('Khắc phục sự cố thành công! Máy đã trở lại vận hành bình thường.');
    }
  };

  // --- QUICK ACTIONS CALLBACK ---
  const handleQuickActionSuccess = (updatedDevice: Device, message: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === updatedDevice.id ? { ...d, ...updatedDevice } : d))
    );
    showToast(message);
    fetchAllData();
  };

  const handleQuickSyncDirect = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/quick-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force-sync' }),
      });
      const data = await res.json();
      if (data.success && data.device) {
        setDevices((prev) =>
          prev.map((d) => (d.id === data.device.id ? { ...d, ...data.device } : d))
        );
        showToast(data.message);
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetDeviceStatus = async (
    deviceId: string,
    status: Device['status'],
    note?: string
  ) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          technicianName: 'Kỹ thuật viên (Khẩu lệnh giọng nói)',
          note: note || 'Cập nhật qua khẩu lệnh rảnh tay Voice Assistant',
        }),
      });
      const data = await res.json();
      if (data.success && data.device) {
        setDevices((prev) =>
          prev.map((d) => (d.id === data.device.id ? { ...d, ...data.device } : d))
        );
        showToast(`🎙️ ${data.message}`);
        soundManager.playBeep();
        fetchAllData();
      } else {
        showToast(data.message || 'Cập nhật trạng thái thất bại');
      }
    } catch (e) {
      console.error('Error updating status via voice:', e);
      // Fallback local update
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, status } : d))
      );
      showToast(`🎙️ Đã cập nhật trạng thái máy sang ${status} (Cục bộ)`);
    }
  };

  // Filtered devices list with both basic and advanced telemetry filters
  const filteredDevices = devices.filter((d) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      d.name.toLowerCase().includes(term) ||
      d.code.toLowerCase().includes(term) ||
      d.model.toLowerCase().includes(term) ||
      d.brand.toLowerCase().includes(term) ||
      d.location.toLowerCase().includes(term) ||
      d.assignedTechnician?.name.toLowerCase().includes(term) ||
      // Match active error code and incident title
      (d.activeIncident && (
        d.activeIncident.errorCode.toLowerCase().includes(term) ||
        d.activeIncident.errorTitle.toLowerCase().includes(term)
      )) ||
      // Also match error codes in common known incidents like E-102, SPW-303, ALARM-204
      (term.includes('e-102') || term.includes('e102') ? (d.code === 'EDM-W01' || d.code === 'EDM-W02') : false) ||
      (term.includes('spw-303') || term.includes('spw303') ? (d.code === 'EDM-W03') : false) ||
      (term.includes('alarm-204') || term.includes('alarm204') ? (d.code === 'EDM-S01') : false);

    let matchesFilter = true;
    if (deviceFilter === 'ALARM') matchesFilter = d.status === 'ALARM_STOPPED';
    else if (deviceFilter === 'RUNNING') matchesFilter = d.status === 'RUNNING';
    else if (deviceFilter === 'MAINTENANCE') matchesFilter = d.status === 'MAINTENANCE' || d.status === 'MAINTENANCE_SCHEDULED';
    else if (deviceFilter === 'MAINTENANCE_SCHEDULED') matchesFilter = d.status === 'MAINTENANCE_SCHEDULED';
    else if (deviceFilter === 'IDLE') matchesFilter = d.status === 'IDLE';
    else if (deviceFilter === 'WIRE_EDM') matchesFilter = d.type === 'WIRE_EDM';
    else if (deviceFilter === 'SINKER_EDM') matchesFilter = d.type === 'SINKER_EDM';

    if (!matchesSearch || !matchesFilter) return false;

    // Advanced Telemetry Filters
    const opMetrics = getDeviceOperationalMetrics(d);

    // 1. Temperature Threshold Filter
    if (advancedFilters.tempMode === 'OVERHEATING') {
      if (opMetrics.tempStatus !== 'OVERHEATING' && opMetrics.temperature < 24) return false;
    } else if (advancedFilters.tempMode === 'ELEVATED') {
      if (opMetrics.tempStatus === 'NORMAL') return false;
    } else if (advancedFilters.tempMode === 'CUSTOM_MIN') {
      if (opMetrics.temperature < advancedFilters.minTempThreshold) return false;
    }

    // 2. Power Consumption Status Filter
    if (advancedFilters.powerStatusMode === 'HIGH_DRAW') {
      if (opMetrics.powerKw < advancedFilters.minPowerKw) return false;
    } else if (advancedFilters.powerStatusMode === 'OVERCONSUMPTION') {
      if (opMetrics.powerStatus !== 'OVERCONSUMPTION') return false;
    } else if (advancedFilters.powerStatusMode === 'IDLE_SAVING') {
      if (opMetrics.powerKw > 2.0 && opMetrics.powerStatus !== 'IDLE_SAVING') return false;
    }

    // 3. Continuous Uptime (Runtime) Filter
    if (advancedFilters.uptimeMode === 'OVER_24H') {
      if (opMetrics.continuousUptimeHours < 24) return false;
    } else if (advancedFilters.uptimeMode === 'OVER_18H') {
      if (opMetrics.continuousUptimeHours < 18) return false;
    } else if (advancedFilters.uptimeMode === 'OVER_12H') {
      if (opMetrics.continuousUptimeHours < 12) return false;
    } else if (advancedFilters.uptimeMode === 'CUSTOM_HOURS') {
      if (opMetrics.continuousUptimeHours < advancedFilters.minUptimeHours) return false;
    }

    // 4. Shift Schedule Filter (Ca làm việc: Morning, Afternoon, Night)
    if (advancedFilters.shiftMode && !matchesShift(d, advancedFilters.shiftMode)) {
      return false;
    }

    // 5. Urgent Maintenance Priority Filter
    if (advancedFilters.urgentMaintenanceOnly) {
      if (!opMetrics.isUrgentMaintenanceNeeded) return false;
    }

    return true;
  });

  const activeAdvancedFilterCount =
    (advancedFilters.tempMode !== 'ALL' ? 1 : 0) +
    (advancedFilters.powerStatusMode !== 'ALL' ? 1 : 0) +
    (advancedFilters.uptimeMode !== 'ALL' ? 1 : 0) +
    (advancedFilters.shiftMode !== 'ALL' ? 1 : 0) +
    (advancedFilters.urgentMaintenanceOnly ? 1 : 0);

  const matchedQuickPreset = useMemo(() => {
    return getSavedQuickPresets().find((p) => areCriteriaEqual(p.criteria, advancedFilters));
  }, [advancedFilters]);

  // Batch Machine Selection & Simultaneous Operations Handlers
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredDevices.map((d) => d.id);
    const allAlreadySelected =
      filteredIds.length > 0 && filteredIds.every((id) => selectedDeviceIds.includes(id));
    if (allAlreadySelected) {
      setSelectedDeviceIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedDeviceIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSelectByStatus = (status: Device['status']) => {
    const targetIds = filteredDevices.filter((d) => d.status === status).map((d) => d.id);
    setSelectedDeviceIds((prev) => Array.from(new Set([...prev, ...targetIds])));
  };

  const handleBatchActionSuccess = (updatedDevices: Device[], message: string) => {
    setDevices((prev) =>
      prev.map((d) => {
        const match = updatedDevices.find((u) => u.id === d.id);
        return match ? { ...d, ...match } : d;
      })
    );
    showToast(message);
    fetchAllData();
  };

  return (
    <div className={`min-h-screen bg-[#F3F7FB] text-[#19324D] flex flex-col font-sans transition-colors duration-200 ${isHighContrast ? 'high-contrast' : ''}`}>
      <ControlTowerLayout
        activeNav={activeNav}
        onSelectNav={(navId) => {
          setActiveNav(navId);
          if (navId === 'devices') {
            setActiveTab('devices');
            setMainViewMode('FLEET_GRID');
          } else if (navId === 'maintenance') {
            setActiveTab('history');
            setMainViewMode('FLEET_GRID');
          } else if (navId === 'knowledge') {
            setActiveTab('learnings');
            setMainViewMode('FLEET_GRID');
          } else if (navId === 'documents') {
            setActiveTab('documents');
            setMainViewMode('FLEET_GRID');
          } else if (navId === 'ai-diagnosis') {
            setActiveTab('root-cause-analysis');
            setMainViewMode('FLEET_GRID');
          } else if (navId === 'mobile') {
            setActiveTab('mobile-devices');
            setMainViewMode('FLEET_GRID');
          } else if (navId === 'reports') {
            setMainViewMode('REPORTS_HUB');
          } else if (navId === 'notifications') {
            setMainViewMode('ALERT_GOVERNANCE');
          } else if (navId === 'data-trust') {
            setMainViewMode('DATA_TRUST');
          } else if (navId === 'hitl') {
            setMainViewMode('HITL_WORKFLOW');
          } else if (navId === 'audit') {
            setMainViewMode('AUDIT_RBAC');
          }
          soundManager.playBeep();
        }}
        currentPlant={currentPlant}
        onSelectPlant={(plant) => {
          setCurrentPlant(plant);
          soundManager.playBeep();
          const pObj = PLANTS.find((p) => p.id === plant);
          if (pObj) showToast(`Chuyển sang ${pObj.name}`);
        }}
        onSearch={(term) => setSearchTerm(term)}
        notificationCount={notifications.length || 12}
        alertCount={criticalAlarmCount || 3}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onOpenSimulator={() => setShowSimulator(true)}
        onOpenShortcuts={() => setShowKeyboardShortcuts(true)}
        onOpenQuickReport={() => {
          setActiveNav('reports');
          setMainViewMode('REPORTS_HUB');
          soundManager.playBeep();
        }}
      >
        {/* Offline Connectivity Banner */}
        <OfflineConnectivityBanner
          isOnline={isOnline}
          isSimulated={isSimulated}
          cacheInfo={cacheInfo}
          onToggleSimulate={toggleSimulateOffline}
          onRefresh={fetchAllData}
        />

        {/* TOAST POPUP */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-[#16D9A0] px-5 py-3 text-sm font-bold text-[#061522] shadow-2xl shadow-[#16D9A0]/40 animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="h-5 w-5" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: OVERVIEW CONTROL TOWER PRO (PRIMARY DASHBOARD)         */}
        {/* ============================================================== */}
        {activeNav === 'overview' && (
          <IndustrialControlTowerPro
            devices={devices}
            technicians={technicians}
            stats={stats}
            notifications={notifications}
            currentPlant={currentPlant}
            onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
            onOpenMachineDetails={(d) => setDetailsDevice(d)}
            onOpenRepairReport={(d) => setRepairDevice(d)}
            onOpenTelemetryHistory={(d) => setTelemetryHistoryDevice(d)}
            onOpenPredictiveModal={(d) => setPredictiveDevice(d)}
            onOpenFailurePrediction={(d) => setD3FailureDevice(d)}
            onAcknowledgeIncident={(id) => handleAcknowledge(id)}
            onOpenWeeklyReport={() => setShowWeeklyReportModal(true)}
            onNavigateToTab={(tab) => {
              setActiveNav(tab);
              if (tab === 'devices') {
                setActiveTab('devices');
                setMainViewMode('FLEET_GRID');
              } else if (tab === 'maintenance') {
                setActiveTab('history');
                setMainViewMode('FLEET_GRID');
              } else if (tab === 'knowledge') {
                setActiveTab('learnings');
                setMainViewMode('FLEET_GRID');
              } else if (tab === 'documents') {
                setActiveTab('documents');
                setMainViewMode('FLEET_GRID');
              } else if (tab === 'ai-diagnosis') {
                setActiveTab('root-cause-analysis');
                setMainViewMode('FLEET_GRID');
              } else if (tab === 'reports') {
                setMainViewMode('REPORTS_HUB');
              } else if (tab === 'notifications') {
                setMainViewMode('ALERT_GOVERNANCE');
              } else if (tab === 'technician-eval') {
                setActiveNav('technician-eval');
              }
              soundManager.playBeep();
            }}
            onToast={(msg) => showToast(msg)}
          />
        )}

        {/* VIEW 2: TECHNICIAN EVALUATION */}
        {activeNav === 'technician-eval' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#15324C]">
              <h1 className="text-sm font-bold text-[#EAF5FF] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#16D9A0]" />
                Đánh Giá Năng Lực & Ma Trận Kỹ Năng Kỹ Thuật Viên
              </h1>
              <button
                onClick={() => setActiveNav('overview')}
                className="px-3 py-1 text-xs rounded bg-[#0D2940] hover:text-[#00C8F0] border border-[#15324C]"
              >
                ← Về Tổng Quan
              </button>
            </div>
            <div className="bg-[#0A2032] border border-[#15324C] rounded-xl p-4 shadow-xl">
              <TechnicianSkillsComparisonChart
                technicians={technicians}
                learnings={learnings}
                devices={devices}
                onOpenMachineDetails={(d) => setDetailsDevice(d)}
              />
            </div>
          </div>
        )}

        {/* VIEW 3: COMMUNITY KNOWLEDGE */}
        {activeNav === 'community' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#15324C]">
              <h1 className="text-sm font-bold text-[#EAF5FF] flex items-center gap-2">
                <Users2 className="w-4 h-4 text-[#168BFF]" />
                Diễn Đàn & SOP Tri Thức Kỹ Thuật Liên Xưởng
              </h1>
              <button
                onClick={() => setActiveNav('overview')}
                className="px-3 py-1 text-xs rounded bg-[#0D2940] hover:text-[#00C8F0] border border-[#15324C]"
              >
                ← Về Tổng Quan
              </button>
            </div>
            <div className="bg-[#0A2032] border border-[#15324C] rounded-xl p-4 shadow-xl">
              <CrossFactoryCommunityView
                currentPlant={currentPlant}
                viewportMode={viewportMode}
                onApplyKnowledgeToRepair={(post) => {
                  const matched = devices.find((d) => d.model.toLowerCase().includes(post.targetModel.toLowerCase().split(' ')[0])) || devices[0];
                  if (matched) {
                    setRepairDevice(matched);
                    showToast(`Đã áp dụng SOP "${post.title}" vào ca sửa máy ${matched.code}!`);
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* VIEW 4: SETTINGS */}
        {activeNav === 'settings' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#15324C]">
              <h1 className="text-sm font-bold text-[#EAF5FF] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#00C8F0]" />
                Cấu Hình & Thiết Lập Hệ Thống
              </h1>
              <button
                onClick={() => setActiveNav('overview')}
                className="px-3 py-1 text-xs rounded bg-[#0D2940] hover:text-[#00C8F0] border border-[#15324C]"
              >
                ← Về Tổng Quan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0A2032] border border-[#15324C] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-[#00C8F0] uppercase tracking-wider">Tùy Chọn Hiển Thị & Âm Thanh</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-[#15324C]/60">
                    <span>Chế độ tương phản cao (High-Contrast)</span>
                    <button
                      onClick={toggleHighContrast}
                      className={`px-2.5 py-1 rounded font-bold ${isHighContrast ? 'bg-[#FFB547] text-black' : 'bg-[#0D2940] text-[#9CB4C8]'}`}
                    >
                      {isHighContrast ? 'BẬT' : 'TẮT'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#15324C]/60">
                    <span>Âm thanh cảnh báo (Audio Siren & Beeps)</span>
                    <button
                      onClick={toggleMute}
                      className={`px-2.5 py-1 rounded font-bold ${!isMuted ? 'bg-[#16D9A0] text-black' : 'bg-[#FF5263] text-white'}`}
                    >
                      {!isMuted ? 'BẬT' : 'TẮT'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Phím tắt công nghiệp (Keyboard Shortcuts)</span>
                    <button
                      onClick={() => setShowKeyboardShortcuts(true)}
                      className="px-2.5 py-1 rounded bg-[#168BFF] text-white font-bold"
                    >
                      Mở bảng phím tắt
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#0A2032] border border-[#15324C] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-[#00C8F0] uppercase tracking-wider">Chế Độ Vai Trò & Mô Phỏng</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-[#15324C]/60">
                    <span>Chuyển sang góc nhìn phân quyền (Director / EQM / Tech)</span>
                    <button
                      onClick={() => {
                        setMainViewMode('ROLE_VIEW');
                        setActiveNav('role-view');
                      }}
                      className="px-2.5 py-1 rounded bg-[#0D2940] hover:bg-[#168BFF] text-[#EAF5FF] font-semibold border border-[#15324C]"
                    >
                      Mở Role View
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#15324C]/60">
                    <span>Mô phỏng điện thoại kỹ thuật viên (Phone View)</span>
                    <button
                      onClick={() => setPhoneDevice(devices[0] || null)}
                      className="px-2.5 py-1 rounded bg-[#0D2940] hover:bg-[#168BFF] text-[#EAF5FF] font-semibold border border-[#15324C]"
                    >
                      Mở Phone Simulator
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Mô phỏng sự cố EDM (Incident Injector)</span>
                    <button
                      onClick={() => setShowSimulator(true)}
                      className="px-2.5 py-1 rounded bg-[#FF5263]/20 text-[#FF5263] border border-[#FF5263]/40 font-bold"
                    >
                      Bộ kích hoạt sự cố
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: OTHER NAVIGATION SCREENS WHEN NOT OVERVIEW/TECH/COMMUNITY/SETTINGS */}
        {activeNav !== 'overview' && activeNav !== 'technician-eval' && activeNav !== 'community' && activeNav !== 'settings' && (
          <div className="space-y-6">
            {/* Context Back button */}
            <div className="flex items-center justify-between pb-2 border-b border-[#15324C]">
              <span className="text-xs font-mono text-[#00C8F0]">
                EDM SMARTGUARD AI • {activeNav.toUpperCase()}
              </span>
              <button
                onClick={() => setActiveNav('overview')}
                className="px-3 py-1 text-xs rounded bg-[#0D2940] hover:text-[#00C8F0] border border-[#15324C]"
              >
                ← Về Tổng Quan
              </button>
            </div>
        {/* ============================================================== */}
        {mainViewMode === 'REPORTS_HUB' ? (
          <UnifiedReportsHub
            devices={devices}
            technicians={technicians}
            stats={stats}
            currentPlant={currentPlant}
            onOpenMachineDetails={(d) => setDetailsDevice(d)}
            onOpenTelemetryHistory={(d) => setTelemetryHistoryDevice(d)}
            onOpenWeeklyExecutiveReport={() => setShowWeeklyReportModal(true)}
            onToast={(msg) => showToast(msg)}
          />
        ) : mainViewMode === 'CONTROL_TOWER' ? (
          viewportMode === 'MOBILE' && phoneFramePreview ? (
            /* Smartphone Frame Shell for Control Tower */
            <div className="flex flex-col items-center justify-center py-2 sm:py-4">
              <div className="text-center mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-300">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Mobile AI Operations (P2-09 Pocket Control Tower)</span>
                </span>
              </div>
              <div className="relative w-full max-w-[420px] rounded-[52px] border-[10px] border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-indigo-950/40 ring-2 ring-slate-700/60 overflow-hidden">
                <div className="max-h-[750px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-slate-700">
                  <AiPerformanceControlTower
                    devices={devices}
                    technicians={technicians}
                    stats={stats}
                    currentPlant={currentPlant}
                    viewportMode="MOBILE"
                    onOpenDeviceDetails={(d) => setDetailsDevice(d)}
                    onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
                    onOpenWorkOrderDraft={(devCode, action) => {
                      const dev = devices.find((d) => d.code === devCode) || devices[0];
                      if (dev) {
                        setRepairDevice(dev);
                        showToast(`Đã tự động khởi tạo Work Order cho máy ${devCode}: "${action}"`);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <AiPerformanceControlTower
              devices={devices}
              technicians={technicians}
              stats={stats}
              currentPlant={currentPlant}
              viewportMode={viewportMode}
              onOpenDeviceDetails={(d) => setDetailsDevice(d)}
              onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
              onOpenWorkOrderDraft={(devCode, action) => {
                const dev = devices.find((d) => d.code === devCode) || devices[0];
                if (dev) {
                  setRepairDevice(dev);
                  showToast(`Đã tự động khởi tạo Work Order cho máy ${devCode}: "${action}"`);
                }
              }}
            />
          )
        ) : mainViewMode === 'DATA_TRUST' ? (
          /* ============================================================== */
          /* PHASE 1 - MÔ-ĐUN 2: DATA TRUST CENTER                          */
          /* ============================================================== */
          <DataTrustCenter onToast={(msg) => showToast(msg)} />
        ) : mainViewMode === 'HITL_WORKFLOW' ? (
          /* ============================================================== */
          /* PHASE 1 - MÔ-ĐUN 3: HUMAN-IN-THE-LOOP WORKFLOW                 */
          /* ============================================================== */
          <HitlWorkflowManagementCenter
            onToast={(msg) => showToast(msg)}
            currentUserRole={currentRole}
          />
        ) : mainViewMode === 'AUDIT_RBAC' ? (
          /* ============================================================== */
          /* PHASE 1 - MÔ-ĐUN 4 & 5: AUDIT LOG & RBAC 8 VAI TRÒ             */
          /* ============================================================== */
          <AuditLogAndRbacCenter onToast={(msg) => showToast(msg)} />
        ) : mainViewMode === 'ALERT_GOVERNANCE' ? (
          /* ============================================================== */
          /* PHASE 1 - MÔ-ĐUN 6: ALERT GOVERNANCE                           */
          /* ============================================================== */
          <EnhancedAlertManagementCenter onToast={(msg) => showToast(msg)} />
        ) : mainViewMode === 'ROLE_VIEW' ? (
          <div className="space-y-6">
            {viewportMode === 'MOBILE' && phoneFramePreview ? (
              /* Beautiful Centered Smartphone Bezel Simulator on Desktop */
              <div className="flex flex-col items-center justify-center py-2 sm:py-4">
                <div className="text-center mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 px-3 py-1 text-xs font-semibold text-purple-300">
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Mô Phỏng Giao Diện Điện Thoại Di Động Thực Tế (Mobile Shell)</span>
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Giao diện được thiết kế tối ưu cho màn hình cảm ứng, nút bấm to, thao tác 1 chạm tại xưởng
                  </p>
                </div>

                {/* Smartphone Shell with Bezel & Dynamic Notch */}
                <div className="relative w-full max-w-[420px] rounded-[52px] border-[10px] border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-purple-950/40 ring-2 ring-slate-700/60 overflow-hidden">
                  {/* Speaker & Dynamic Island Notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-between gap-3 rounded-full bg-black px-4 py-1.5 shadow-md">
                    <div className="h-2 w-2 rounded-full bg-slate-700"></div>
                    <div className="h-2.5 w-12 rounded-full bg-slate-800"></div>
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500/40 border border-blue-400"></div>
                  </div>

                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-4 pt-1 pb-2">
                    <span>08:45</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-400">5G • 100%</span>
                  </div>

                  {/* Mobile Screen Content */}
                  <div className="max-h-[750px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-slate-700">
                    {currentRole === 'DIRECTOR' && (
                      <PlantDirectorView
                        devices={devices}
                        technicians={technicians}
                        stats={stats}
                        currentPlant={currentPlant}
                        viewportMode="MOBILE"
                        onOpenDeviceDetails={(d) => setDetailsDevice(d)}
                        onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
                        onOpenWeeklyReport={() => setShowWeeklyReportModal(true)}
                      />
                    )}
                    {currentRole === 'EQM_LEADER' && (
                      <EqmLeaderView
                        devices={devices}
                        technicians={technicians}
                        viewportMode="MOBILE"
                        onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
                        onOpenRepairReport={(d) => setRepairDevice(d)}
                        onOpenDeviceDetails={(d) => setDetailsDevice(d)}
                        onOpenInventory={(partSku) => {
                          setInventoryTargetPartId(partSku);
                          setActiveTab('spare-parts');
                          setMainViewMode('FLEET_GRID');
                        }}
                      />
                    )}
                    {currentRole === 'TECHNICIAN' && (
                      <FieldTechnicianView
                        devices={devices}
                        technicians={technicians}
                        viewportMode="MOBILE"
                        onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
                        onOpenRepairReport={(d) => setRepairDevice(d)}
                        onOpenQRScanner={() => setShowQRScanner(true)}
                        onOpenDeviceDetails={(d) => setDetailsDevice(d)}
                        onOpenInventory={(partSku) => {
                          setInventoryTargetPartId(partSku);
                          setActiveTab('spare-parts');
                          setMainViewMode('FLEET_GRID');
                        }}
                      />
                    )}
                    {currentRole === 'COMMUNITY' && (
                      <CrossFactoryCommunityView
                        currentPlant={currentPlant}
                        viewportMode="MOBILE"
                        onApplyKnowledgeToRepair={(post) => {
                          const matched = devices.find((d) => d.model.toLowerCase().includes(post.targetModel.toLowerCase().split(' ')[0])) || devices[0];
                          if (matched) {
                            setRepairDevice(matched);
                            showToast(`Đã áp dụng SOP "${post.title}" vào ca sửa máy ${matched.code}!`);
                          }
                        }}
                      />
                    )}
                  </div>

                  {/* Home Indicator bar */}
                  <div className="flex justify-center pt-2 pb-1">
                    <div className="h-1 w-28 rounded-full bg-slate-700"></div>
                  </div>
                </div>
              </div>
            ) : (
              /* Full Width (PC or Fluid Mobile) */
              <>
                {currentRole === 'DIRECTOR' && (
                  <PlantDirectorView
                    devices={devices}
                    technicians={technicians}
                    stats={stats}
                    currentPlant={currentPlant}
                    viewportMode={viewportMode}
                    onOpenDeviceDetails={(d) => setDetailsDevice(d)}
                    onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
                    onOpenWeeklyReport={() => setShowWeeklyReportModal(true)}
                  />
                )}
                {currentRole === 'EQM_LEADER' && (
                  <EqmLeaderView
                    devices={devices}
                    technicians={technicians}
                    viewportMode={viewportMode}
                    onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
                    onOpenRepairReport={(d) => setRepairDevice(d)}
                    onOpenDeviceDetails={(d) => setDetailsDevice(d)}
                    onOpenInventory={(partSku) => {
                      setInventoryTargetPartId(partSku);
                      setActiveTab('spare-parts');
                      setMainViewMode('FLEET_GRID');
                    }}
                  />
                )}
                {currentRole === 'TECHNICIAN' && (
                  <FieldTechnicianView
                    devices={devices}
                    technicians={technicians}
                    viewportMode={viewportMode}
                    onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
                    onOpenRepairReport={(d) => setRepairDevice(d)}
                    onOpenQRScanner={() => setShowQRScanner(true)}
                    onOpenDeviceDetails={(d) => setDetailsDevice(d)}
                    onOpenInventory={(partSku) => {
                      setInventoryTargetPartId(partSku);
                      setActiveTab('spare-parts');
                      setMainViewMode('FLEET_GRID');
                    }}
                  />
                )}
                {currentRole === 'COMMUNITY' && (
                  <CrossFactoryCommunityView
                    currentPlant={currentPlant}
                    viewportMode={viewportMode}
                    onApplyKnowledgeToRepair={(post) => {
                      const matched = devices.find((d) => d.model.toLowerCase().includes(post.targetModel.toLowerCase().split(' ')[0])) || devices[0];
                      if (matched) {
                        setRepairDevice(matched);
                        showToast(`Đã áp dụng SOP "${post.title}" vào ca sửa máy ${matched.code}!`);
                      }
                    }}
                  />
                )}
              </>
            )}
          </div>
        ) : (
          /* ============================================================== */
          /* VIEW MODE 2: FLEET GRID & STANDARD TABS                        */
          /* ============================================================== */
          <>
            {/* TAB 1: REAL-TIME DEVICES & TELEMETRY */}
            {activeTab === 'devices' && (
          <div className="space-y-6">
            {/* Custom Drag-and-Drop Reorderable Top-Level Cards Container */}
            <DashboardCardsContainer
              cardOrder={dashboardCardOrder}
              onOrderChange={(newOrder) => setDashboardCardOrder(newOrder)}
              onToast={(msg) => showToast(msg)}
              renderCard={(cardId) => {
                switch (cardId) {
                  case 'facility-summary':
                    return (
                      <FacilitySummaryCard
                        devices={devices}
                        activeFilter={deviceFilter}
                        onSelectFilter={(f) => setDeviceFilter(f)}
                      />
                    );
                  case 'workshop-heatmap':
                    return (
                      <WorkshopHeatmap
                        devices={devices}
                        onOpenMachineDetails={(device) => setDetailsDevice(device)}
                        onOpenDiagnosis={(device) => setDiagnosisDevice(device)}
                      />
                    );
                  case 'predictive-alerts':
                    return (
                      <PredictiveMaintenanceAlerts
                        devices={devices}
                        onOpenMachineDetails={(device) => setDetailsDevice(device)}
                        maintenanceNotificationsEnabled={maintenanceNotificationsEnabled}
                        onToggleMaintenanceNotifications={handleToggleMaintenanceNotifications}
                      />
                    );
                  case 'performance-analytics':
                    return <PerformanceAnalytics devices={devices} />;
                  default:
                    return null;
                }
              }}
            />

            {/* Filter and Search Bar with Voice-to-Text Microphone Integration */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-slate-900/60 border border-slate-800 p-3">
              <VoiceSearchBar
                value={searchTerm}
                onChange={(val) => setSearchTerm(val)}
                devices={devices}
                onToast={(msg) => showToast(msg)}
                onSetDeviceStatus={handleSetDeviceStatus}
                onOpenDiagnosis={(device) => setDiagnosisDevice(device)}
                onOpenMachineDetails={(device) => setDetailsDevice(device)}
                onOpenQRScanner={() => setShowQRScanner(true)}
                onToggleHighContrast={toggleHighContrast}
                isHighContrast={isHighContrast}
                onSelectFilter={(f) => setDeviceFilter(f)}
                onOpenShortcuts={() => setShowKeyboardShortcuts(true)}
                onOpenRCA={(devId, errCode) => {
                  if (devId) setRcaDeviceTargetId(devId);
                  if (errCode) setRcaErrorCodeTarget(errCode);
                  setActiveTab('root-cause-analysis');
                }}
              />

              {/* Status Filter Buttons and QR Scanner */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <button
                  id="tour-qr-scanner"
                  onClick={() => setShowQRScanner(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-3 py-1 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95 shrink-0"
                  title="Quét mã QR dán trên thân máy để mở ngay chi tiết & chẩn đoán"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Quét QR Máy</span>
                </button>

                <button
                  onClick={() => setDeviceFilter('ALL')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    deviceFilter === 'ALL'
                      ? 'bg-slate-800 text-amber-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tất cả ({devices.length})
                </button>
                <button
                  onClick={() => setDeviceFilter('ALARM')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    deviceFilter === 'ALARM'
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  Sự Cố Dừng ({devices.filter((d) => d.status === 'ALARM_STOPPED').length})
                </button>
                <button
                  onClick={() => setDeviceFilter('MAINTENANCE')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    deviceFilter === 'MAINTENANCE'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-blue-400 hover:bg-blue-500/10'
                  }`}
                >
                  Bảo Trì ({devices.filter((d) => d.status === 'MAINTENANCE').length})
                </button>
                <button
                  onClick={() => setDeviceFilter('MAINTENANCE_SCHEDULED')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    deviceFilter === 'MAINTENANCE_SCHEDULED'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-indigo-400 hover:bg-indigo-500/10'
                  }`}
                >
                  Lịch Hẹn ({devices.filter((d) => d.status === 'MAINTENANCE_SCHEDULED').length})
                </button>
                <button
                  onClick={() => setDeviceFilter('RUNNING')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    deviceFilter === 'RUNNING'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  Đang Chạy ({devices.filter((d) => d.status === 'RUNNING').length})
                </button>
                <button
                  onClick={() => setDeviceFilter('WIRE_EDM')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    deviceFilter === 'WIRE_EDM'
                      ? 'bg-slate-800 text-amber-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cắt Dây Wire-cut
                </button>
                <button
                  onClick={() => setDeviceFilter('SINKER_EDM')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    deviceFilter === 'SINKER_EDM'
                      ? 'bg-slate-800 text-amber-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Xung Sinker
                </button>

                {/* ADVANCED FILTER TOGGLE BUTTON */}
                <button
                  id="tour-advanced-filter"
                  onClick={() => setShowAdvancedFilter((prev) => !prev)}
                  title="Mở bộ lọc nâng cao theo nhiệt độ vận hành, công suất tiêu thụ & thời gian chạy liên tục"
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition shadow-sm ${
                    showAdvancedFilter || activeAdvancedFilterCount > 0
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                      : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
                  <span>Bộ Lọc Nâng Cao</span>
                  {activeAdvancedFilterCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-mono font-bold text-slate-950">
                      {activeAdvancedFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* EXPANDABLE ADVANCED FILTER PANEL */}
            <AdvancedFilterPanel
              isOpen={showAdvancedFilter}
              onClose={() => setShowAdvancedFilter(false)}
              criteria={advancedFilters}
              onChange={(nextCriteria) => setAdvancedFilters(nextCriteria)}
              onReset={() => {
                setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
                showToast('Đã xóa tất cả bộ lọc nâng cao!');
              }}
              devices={devices}
              filteredCount={filteredDevices.length}
              onToast={(msg) => showToast(msg)}
            />

            {/* Active Filters Summary Strip if panel is closed but filters applied */}
            {!showAdvancedFilter && activeAdvancedFilterCount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-950/20 px-3.5 py-2 text-xs text-amber-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-amber-300 flex items-center gap-1">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Đang áp dụng bộ lọc nâng cao ({activeAdvancedFilterCount}):
                  </span>
                  {matchedQuickPreset && (
                    <span className="rounded-md bg-amber-500/30 border border-amber-500/60 px-2 py-0.5 text-[11px] font-bold text-amber-200 flex items-center gap-1 shadow-sm">
                      <Bookmark className="h-3 w-3 text-amber-400" />
                      Lọc nhanh: {matchedQuickPreset.name}
                    </span>
                  )}
                  {advancedFilters.urgentMaintenanceOnly && (
                    <span className="rounded-md bg-red-500/30 border border-red-500/50 px-2 py-0.5 text-[11px] font-semibold text-red-200">
                      🚨 Cần bảo trì cấp bách
                    </span>
                  )}
                  {advancedFilters.tempMode !== 'ALL' && (
                    <span className="rounded-md bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
                      Nhiệt độ: {advancedFilters.tempMode === 'OVERHEATING' ? '> 24°C' : `>= ${advancedFilters.minTempThreshold}°C`}
                    </span>
                  )}
                  {advancedFilters.powerStatusMode !== 'ALL' && (
                    <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                      Điện năng: {advancedFilters.powerStatusMode === 'HIGH_DRAW' ? `>= ${advancedFilters.minPowerKw} kW` : advancedFilters.powerStatusMode}
                    </span>
                  )}
                  {advancedFilters.uptimeMode !== 'ALL' && (
                    <span className="rounded-md bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
                      Uptime: {advancedFilters.uptimeMode === 'OVER_24H' ? '> 24h' : advancedFilters.uptimeMode === 'OVER_18H' ? '> 18h' : `>= ${advancedFilters.minUptimeHours}h`}
                    </span>
                  )}
                  {advancedFilters.shiftMode !== 'ALL' && (
                    <span className="rounded-md bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[11px] font-semibold text-purple-300">
                      Ca: {advancedFilters.shiftMode === 'MORNING' ? 'Ca Sáng (06:00-14:30)' : advancedFilters.shiftMode === 'AFTERNOON' ? 'Ca Chiều (14:00-22:30)' : 'Ca Đêm (22:00-06:30)'}
                    </span>
                  )}
                  <span className="font-mono text-slate-300">
                    ({filteredDevices.length} máy hiển thị)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAdvancedFilter(true)}
                    className="text-xs text-amber-400 underline hover:text-amber-300"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
                      showToast('Đã xóa bộ lọc nâng cao!');
                    }}
                    className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-xs text-slate-300"
                  >
                    Bỏ lọc
                  </button>
                </div>
              </div>
            )}

            {/* 0. LIVE FACTORY FLOOR EMERGENCY BROADCAST PANEL */}
            {showEmergencyBroadcast && (
              <EmergencyBroadcastPanel
                devices={devices}
                technicians={technicians}
                onAcknowledgeIncident={handleAcknowledge}
                onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
                onOpenRepairReport={(d) => setRepairDevice(d)}
                onOpenMachineDetails={(d) => setDetailsDevice(d)}
                onToast={(msg) => showToast(msg)}
                isMuted={isMuted}
                onToggleMute={toggleMute}
                isExpandedDefault={criticalAlarmCount > 0}
              />
            )}

            {/* AI PREDICTIVE MAINTENANCE SCHEDULE (Vibration & Sensor Current) */}
            <AIPredictiveMaintenanceScheduleBanner
              devices={devices}
              onOpenPredictiveDetails={(device) => setPredictiveDevice(device)}
              onSetMaintenance={(id) => handleSetDeviceStatus(id, 'MAINTENANCE', 'Lên lịch bảo trì từ dự báo rung & dòng điện AI')}
              onQuickSyncDirect={(id) => handleQuickSyncDirect(id)}
              onToast={(msg) => showToast(msg)}
            />

            {/* Batch Selection Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSelectAllFiltered}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-semibold transition active:scale-95 ${
                    filteredDevices.length > 0 &&
                    filteredDevices.every((d) => selectedDeviceIds.includes(d.id))
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40 font-bold'
                      : selectedDeviceIds.length > 0
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                  }`}
                  title="Chọn tất cả các máy đang hiển thị trong bộ lọc"
                >
                  <CheckSquare className="h-3.5 w-3.5 text-amber-400" />
                  <span>
                    {filteredDevices.length > 0 &&
                    filteredDevices.every((d) => selectedDeviceIds.includes(d.id))
                      ? `Đã chọn tất cả (${filteredDevices.length})`
                      : `Chọn tất cả (${filteredDevices.length})`}
                  </span>
                </button>

                {selectedDeviceIds.length > 0 && (
                  <button
                    onClick={() => setSelectedDeviceIds([])}
                    className="rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 px-3 py-1.5 text-slate-400 hover:text-white transition"
                    title="Bỏ chọn toàn bộ máy"
                  >
                    Bỏ chọn ({selectedDeviceIds.length})
                  </button>
                )}

                <span className="hidden sm:inline text-slate-700">|</span>
                <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
                  Chọn nhanh:
                </span>
                <button
                  onClick={() => handleSelectByStatus('ALARM_STOPPED')}
                  className="rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-2 py-1 text-[11px] font-semibold text-red-300 transition"
                  title="Chọn tất cả máy đang có sự cố dừng"
                >
                  Sự cố ({filteredDevices.filter((d) => d.status === 'ALARM_STOPPED').length})
                </button>
                <button
                  onClick={() => handleSelectByStatus('MAINTENANCE')}
                  className="rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2 py-1 text-[11px] font-semibold text-blue-300 transition"
                  title="Chọn tất cả máy đang trong trạng thái bảo trì"
                >
                  Bảo trì ({filteredDevices.filter((d) => d.status === 'MAINTENANCE').length})
                </button>
                <button
                  onClick={() => handleSelectByStatus('RUNNING')}
                  className="rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2 py-1 text-[11px] font-semibold text-emerald-300 transition"
                  title="Chọn tất cả máy đang hoạt động bình thường"
                >
                  Đang chạy ({filteredDevices.filter((d) => d.status === 'RUNNING').length})
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                {selectedDeviceIds.length > 0 ? (
                  <span className="text-amber-300 font-bold flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    Thanh tác vụ hàng loạt đang nổi ở cuối màn hình
                  </span>
                ) : (
                  <span>Tick vào ô chọn ở góc thẻ máy để kích hoạt thao tác hàng loạt</span>
                )}
              </div>
            </div>

            {/* Industrial SCADA Machine Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDevices.map((device, idx) => (
                <div key={device.id} id={idx === 0 ? 'tour-first-device-card' : undefined}>
                  <DeviceCard
                    device={device}
                    isSelected={selectedDeviceIds.includes(device.id)}
                    onToggleSelect={handleToggleSelectDevice}
                    onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
                    onOpenRepairReport={(d) => setRepairDevice(d)}
                    onTriggerAlarm={(id) => handleTriggerAlarm(id)}
                    onAcknowledge={(id) => handleAcknowledge(id)}
                    onOpenPhoneViewWithIncident={(d) => setPhoneDevice(d)}
                    onOpenMachineDetails={(d) => setDetailsDevice(d)}
                    onQuickActionSuccess={(updated, msg) => handleQuickActionSuccess(updated, msg)}
                    onQuickSyncDirect={(id) => handleQuickSyncDirect(id)}
                    onOpenPredictiveDetails={(d) => setPredictiveDevice(d)}
                    onOpenTelemetryHistory={(d) => setTelemetryHistoryDevice(d)}
                    onOpenFailurePrediction={(d) => setD3FailureDevice(d)}
                  />
                </div>
              ))}
            </div>

            {/* Floating Action Toolbar for Simultaneous Operations */}
            <FloatingBatchActionBar
              selectedDeviceIds={selectedDeviceIds}
              devices={devices}
              onClearSelection={() => setSelectedDeviceIds([])}
              onSelectAll={() => setSelectedDeviceIds(filteredDevices.map((d) => d.id))}
              onBatchActionSuccess={handleBatchActionSuccess}
              onToast={(msg) => showToast(msg)}
            />
          </div>
        )}

        {/* TAB 2: AI BRAIN & HUMAN-LEARNED KNOWLEDGE */}
        {activeTab === 'learnings' && (
          <AILearningsTab
            learnings={learnings}
            onLearningAdded={(newLearning) => {
              setLearnings((prev) => [newLearning, ...prev]);
              showToast(`Đã thêm bài học "${newLearning.title}" vào Bộ Não Tri Thức AI!`);
            }}
          />
        )}

        {/* TAB 3: TECHNICAL MANUALS & SOPS HUB */}
        {activeTab === 'documents' && (
          <DocumentsTab
            documents={documents}
            onDocumentAdded={(newDoc) => {
              setDocuments((prev) => [newDoc, ...prev]);
              showToast(`Đã nạp tài liệu "${newDoc.title}" vào cơ sở dữ liệu AI!`);
            }}
          />
        )}

        {/* TAB 4: INSTANT PUSH NOTIFICATION LOGS */}
        {activeTab === 'notifications' && (
          <NotificationsTab
            logs={notifications}
            technicians={technicians}
            onTestPushSuccess={(newLog) => {
              setNotifications((prev) => [newLog, ...prev]);
              showToast(`Đã bắn Push Notification tới ${newLog.recipientName} (${newLog.recipientPhone})`);
            }}
          />
        )}

        {/* TAB 5: MOBILE FLEET & TERMINAL MANAGEMENT */}
        {activeTab === 'mobile-devices' && (
          <MobileDevicesManagementTab
            mobileDevices={mobileDevices}
            technicians={technicians}
            onRefresh={fetchAllData}
            onSendTestPush={handleSendMobileTestPush}
            onPingDevice={handlePingMobileDevice}
            onToggleLockDevice={handleToggleLockMobileDevice}
            onDeleteDevice={handleDeleteMobileDevice}
            onRegisterDevice={handleRegisterMobileDevice}
            onBroadcast={handleBroadcastMobile}
          />
        )}

        {/* TAB 6: MAINTENANCE & REPAIR HISTORY HUB */}
        {activeTab === 'history' && (
          <MaintenanceHistoryTab
            devices={devices}
            technicians={technicians}
            onOpenMachineDetails={(device) => setDetailsDevice(device)}
            onOpenRCA={(devId, errCode) => {
              if (devId) setRcaDeviceTargetId(devId);
              if (errCode) setRcaErrorCodeTarget(errCode);
              setActiveTab('root-cause-analysis');
              showToast('⚡ Chuyển tới Module AI Phân Tích Nguyên Nhân Gốc Rễ (RCA)');
            }}
            onToast={(msg) => showToast(msg)}
          />
        )}

        {/* TAB 7: AI INDUSTRIAL ROOT CAUSE ANALYSIS & STOPPAGE RESOLUTION MODULE */}
        {activeTab === 'root-cause-analysis' && (
          <AIRootCauseAnalysisModule
            devices={devices}
            technicians={technicians}
            initialDeviceId={rcaDeviceTargetId}
            initialErrorCode={rcaErrorCodeTarget}
            onOpenMachineDetails={(device) => setDetailsDevice(device)}
            onOpenRepairReport={(device) => setRepairDevice(device)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onToast={(msg) => showToast(msg)}
          />
        )}

        {/* TAB 8: SPARE PARTS INVENTORY & SHORTAGE MANAGEMENT */}
        {activeTab === 'spare-parts' && (
          <SparePartsInventoryTab
            devices={devices}
            onOpenMachineDetails={(device) => setDetailsDevice(device)}
            initialFilterPartId={inventoryTargetPartId}
            onToast={(msg) => showToast(msg)}
          />
        )}
          </>
        )}
          </div>
        )}
      </ControlTowerLayout>

      {/* --- POPUP MODALS --- */}

      {/* 1. Urgent Breakdown Emergency Modal */}
      {emergencyDevice && (
        <EmergencyModal
          device={emergencyDevice}
          onClose={() => setEmergencyDevice(null)}
          onAcknowledge={(id) => handleAcknowledge(id)}
          onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
          onOpenPhoneView={(d) => setPhoneDevice(d)}
        />
      )}

      {/* 2. Technician Smartphone Push View Modal */}
      {phoneDevice && (
        <PhoneSimulatorModal
          device={phoneDevice}
          onClose={() => setPhoneDevice(null)}
          onAcknowledge={(id) => handleAcknowledge(id)}
          onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
        />
      )}

      {/* 3. AI Diagnosis & Copilot Chat Modal */}
      {diagnosisDevice && (
        <AIDiagnosisModal
          device={diagnosisDevice}
          technicians={technicians}
          onClose={() => setDiagnosisDevice(null)}
          onOpenRepairReport={(d) => setRepairDevice(d)}
          onOpenRCA={(devId, errCode) => {
            if (devId) setRcaDeviceTargetId(devId);
            if (errCode) setRcaErrorCodeTarget(errCode);
            setActiveTab('root-cause-analysis');
            showToast('⚡ Mở Module AI Phân Tích Nguyên Nhân Gốc Rễ (RCA)');
          }}
          onOpenInventory={(partIdOrSku) => {
            if (partIdOrSku) setInventoryTargetPartId(partIdOrSku);
            setDiagnosisDevice(null);
            setActiveTab('spare-parts');
            showToast('⚡ Chuyển tới Module Quản Lý Kho Phụ Tùng');
          }}
        />
      )}

      {/* 4. Repair Report & Human Teaching AI Modal */}
      {repairDevice && (
        <RepairReportModal
          device={repairDevice}
          technicians={technicians}
          learnings={learnings}
          onClose={() => setRepairDevice(null)}
          onSuccess={handleRepairSuccess}
        />
      )}

      {/* 5. EDM Breakdown Simulation Modal */}
      {showSimulator && (
        <EdmSimulatorModal
          devices={devices}
          onClose={() => setShowSimulator(false)}
          onTriggerAlarm={(deviceId, code, title) => handleTriggerAlarm(deviceId, code, title)}
        />
      )}

      {/* 6. Machine Details & Maintenance History Modal */}
      {detailsDevice && (
        <MachineDetailsModal
          device={detailsDevice}
          onClose={() => setDetailsDevice(null)}
          onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
          onTriggerAlarm={(id) => handleTriggerAlarm(id)}
        />
      )}

      {/* 7. Technician Status & Dispatch Sidebar */}
      <TechnicianStatusSidebar
        isOpen={showTechSidebar}
        onClose={() => setShowTechSidebar(false)}
        technicians={technicians}
        devices={devices}
        learnings={learnings}
        onUpdateTechStatus={handleUpdateTechStatus}
        onReassignDevice={handleReassignDevice}
        onOpenPhoneView={(d) => setPhoneDevice(d)}
        onOpenMachineDetails={(d) => setDetailsDevice(d)}
        onNavigateToLearningsTab={() => {
          setActiveTab('learnings');
          setShowTechSidebar(false);
        }}
      />

      {/* 8. QR Code Scanner Modal for Physical Machine Stickers */}
      <QRCodeScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        devices={devices}
        onScanSuccess={handleQRScanSuccess}
      />

      {/* 9. Interactive Onboarding Tour for New Technicians */}
      <OnboardingTour
        isOpen={showOnboardingTour}
        onClose={() => setShowOnboardingTour(false)}
        onComplete={() => {
          showToast('Chúc mừng bạn đã hoàn thành Tour hướng dẫn kỹ thuật viên mới!');
        }}
      />

      {/* 10. Industrial Keyboard Shortcuts Modal & Telemetry Logger */}
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          soundManager.playBeep();
        }}
        telemetry={shortcutTelemetry}
        onRecordShortcut={recordShortcut}
        onResetTelemetry={() => setShortcutTelemetry(resetShortcutTelemetry())}
        onSetTelemetry={setShortcutTelemetry}
      />

      {/* 11. AI Vibration & Sensor Current Predictive Maintenance Modal */}
      {predictiveDevice && (
        <AIVibrationCurrentPredictiveModal
          device={predictiveDevice}
          onClose={() => setPredictiveDevice(null)}
          onSetMaintenance={(id) => {
            handleSetDeviceStatus(id, 'MAINTENANCE', 'Chuyển sang bảo trì từ dự báo rung & dòng điện AI');
            setPredictiveDevice(null);
          }}
          onCalibrateSensors={(id) => handleQuickSyncDirect(id)}
          onToast={(msg) => showToast(msg)}
        />
      )}

      {/* 12. Weekly Incident & Executive Report Modal for Plant Directors */}
      <WeeklyIncidentReportModal
        isOpen={showWeeklyReportModal}
        onClose={() => setShowWeeklyReportModal(false)}
        records={getStoredMaintenanceRecords()}
        devices={devices}
        technicians={technicians}
        onToast={(msg) => showToast(msg)}
      />

      {/* 13. Historical Telemetry & Power/Temp Degradation Trend Modal (Recharts) */}
      {telemetryHistoryDevice && (
        <MachineTelemetryHistoryModal
          device={telemetryHistoryDevice}
          onClose={() => setTelemetryHistoryDevice(null)}
          onScheduleMaintenance={(d, reason) => {
            handleSetDeviceStatus(
              d.id,
              'MAINTENANCE',
              reason || 'Khắc phục cảnh báo suy thoái công suất và nhiệt độ 7 ngày'
            );
            setTelemetryHistoryDevice(null);
            showToast(
              `⚡ Đã chuyển máy ${d.code} (${d.name}) sang chế độ Bảo Trì: ${reason || 'Suy thoái nhiệt & công suất'}`
            );
          }}
        />
      )}

      {/* 14. D3.js AI Vibration Failure Probability 7-Day Trend Modal */}
      {d3FailureDevice && (
        <AIVibrationFailurePredictionModal
          device={d3FailureDevice}
          isOpen={Boolean(d3FailureDevice)}
          onClose={() => setD3FailureDevice(null)}
          onScheduleMaintenance={(d, reason) => {
            handleSetDeviceStatus(
              d.id,
              'MAINTENANCE',
              reason || 'Khắc phục cảnh báo xác suất hỏng hóc độ rung D3.js'
            );
            setD3FailureDevice(null);
            showToast(
              `⚡ Đã chuyển máy ${d.code} (${d.name}) sang chế độ Bảo Trì: ${reason || 'Dự báo rung chấn D3.js'}`
            );
          }}
        />
      )}
    </div>
  );
}
