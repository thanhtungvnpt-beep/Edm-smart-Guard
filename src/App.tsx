/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
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
import { PhoneSimulatorModal } from './components/PhoneSimulatorModal';
import { AIDiagnosisModal } from './components/AIDiagnosisModal';
import { RepairReportModal } from './components/RepairReportModal';
import { AILearningsTab } from './components/AILearningsTab';
import { DocumentsTab } from './components/DocumentsTab';
import { NotificationsTab } from './components/NotificationsTab';
import { MobileDevicesManagementTab } from './components/MobileDevicesManagementTab';
import { EdmSimulatorModal } from './components/EdmSimulatorModal';
import { PerformanceAnalytics } from './components/PerformanceAnalytics';
import { FacilitySummaryCard } from './components/FacilitySummaryCard';
import { PredictiveMaintenanceAlerts } from './components/PredictiveMaintenanceAlerts';
import { MachineDetailsModal } from './components/MachineDetailsModal';
import { TechnicianStatusSidebar } from './components/TechnicianStatusSidebar';
import { QRCodeScannerModal } from './components/QRCodeScannerModal';
import { OfflineConnectivityBanner } from './components/OfflineConnectivityBanner';
import { DashboardCardsContainer } from './components/DashboardCardsContainer';
import {
  AdvancedFilterPanel,
  AdvancedFilterCriteria,
  DEFAULT_ADVANCED_FILTERS,
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
import {
  getPushPermissionStatus,
  requestPushPermission,
  triggerEmergencyPushNotification,
} from './utils/notifications';

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [mobileDevices, setMobileDevices] = useState<MobileDevice[]>([]);
  const [stats, setStats] = useState<FactoryStats | null>(null);
  const [documents, setDocuments] = useState<TechnicalDocument[]>([]);
  const [learnings, setLearnings] = useState<AILearning[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);

  // Navigation
  const [activeTab, setActiveTab] = useState<
    'devices' | 'learnings' | 'documents' | 'notifications' | 'mobile-devices'
  >('devices');

  // Filters
  const [deviceFilter, setDeviceFilter] = useState<'ALL' | 'ALARM' | 'RUNNING' | 'WIRE_EDM' | 'SINKER_EDM'>('ALL');
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
  const [showSimulator, setShowSimulator] = useState(false);
  const [showTechSidebar, setShowTechSidebar] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
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

  // Dashboard Top-Level Cards Layout Order (Drag-and-Drop Customizable)
  const [dashboardCardOrder, setDashboardCardOrder] = useState<TopLevelCardId[]>(() =>
    getStoredDashboardCardsOrder()
  );

  // Offline State & Intermittent Connectivity Management
  const { isOnline, isSimulated, cacheInfo, toggleSimulateOffline, refreshCacheInfo } =
    useOfflineStatus();

  // Track previously alarmed devices to prevent redundant siren triggers
  const previousAlarmIdsRef = useRef<Set<string>>(new Set());

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

    // 4. Urgent Maintenance Priority Filter
    if (advancedFilters.urgentMaintenanceOnly) {
      if (!opMetrics.isUrgentMaintenanceNeeded) return false;
    }

    return true;
  });

  const activeAdvancedFilterCount =
    (advancedFilters.tempMode !== 'ALL' ? 1 : 0) +
    (advancedFilters.powerStatusMode !== 'ALL' ? 1 : 0) +
    (advancedFilters.uptimeMode !== 'ALL' ? 1 : 0) +
    (advancedFilters.urgentMaintenanceOnly ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Header
        stats={stats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMuted={isMuted}
        toggleMute={toggleMute}
        pushPermission={pushPermission}
        handleRequestPush={handleRequestPush}
        onOpenSimulator={() => setShowSimulator(true)}
        onOpenPhoneView={() => setPhoneDevice(devices[0] || null)}
        onOpenTechStatus={() => setShowTechSidebar(true)}
        onDutyTechCount={technicians.filter((t) => t.activeStatus === 'ON_DUTY').length}
        isOnline={isOnline}
        isSimulatedOffline={isSimulated}
        onToggleSimulateOffline={toggleSimulateOffline}
        onlineMobileCount={mobileDevices.filter((m) => m.status === 'ONLINE' && !m.isLocked).length}
        onStartTour={() => {
          setActiveTab('devices');
          setShowOnboardingTour(true);
        }}
      />

      {/* Offline Connectivity Banner */}
      <OfflineConnectivityBanner
        isOnline={isOnline}
        isSimulated={isSimulated}
        cacheInfo={cacheInfo}
        onToggleSimulate={toggleSimulateOffline}
        onRefresh={fetchAllData}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {/* TOAST POPUP */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-2xl shadow-emerald-950/80 animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="h-5 w-5" />
            <span>{toastMessage}</span>
          </div>
        )}

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
            />

            {/* Active Filters Summary Strip if panel is closed but filters applied */}
            {!showAdvancedFilter && activeAdvancedFilterCount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-950/20 px-3.5 py-2 text-xs text-amber-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-amber-300 flex items-center gap-1">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Đang áp dụng bộ lọc nâng cao ({activeAdvancedFilterCount}):
                  </span>
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

            {/* Industrial SCADA Machine Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDevices.map((device, idx) => (
                <div key={device.id} id={idx === 0 ? 'tour-first-device-card' : undefined}>
                  <DeviceCard
                    device={device}
                    onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
                    onOpenRepairReport={(d) => setRepairDevice(d)}
                    onTriggerAlarm={(id) => handleTriggerAlarm(id)}
                    onAcknowledge={(id) => handleAcknowledge(id)}
                    onOpenPhoneViewWithIncident={(d) => setPhoneDevice(d)}
                    onOpenMachineDetails={(d) => setDetailsDevice(d)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: AI BRAIN & HUMAN-LEARNED KNOWLEDGE */}
        {activeTab === 'learnings' && <AILearningsTab learnings={learnings} />}

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
      </main>

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
          onClose={() => setDiagnosisDevice(null)}
          onOpenRepairReport={(d) => setRepairDevice(d)}
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
    </div>
  );
}
