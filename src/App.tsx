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
} from 'lucide-react';
import {
  Device,
  FactoryStats,
  NotificationLog,
  TechnicalDocument,
  Technician,
  AILearning,
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
import { EdmSimulatorModal } from './components/EdmSimulatorModal';
import { PerformanceAnalytics } from './components/PerformanceAnalytics';
import { FacilitySummaryCard } from './components/FacilitySummaryCard';
import { MachineDetailsModal } from './components/MachineDetailsModal';
import { TechnicianStatusSidebar } from './components/TechnicianStatusSidebar';
import { QRCodeScannerModal } from './components/QRCodeScannerModal';
import { soundManager } from './utils/audio';
import {
  getPushPermissionStatus,
  requestPushPermission,
  triggerEmergencyPushNotification,
} from './utils/notifications';

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [stats, setStats] = useState<FactoryStats | null>(null);
  const [documents, setDocuments] = useState<TechnicalDocument[]>([]);
  const [learnings, setLearnings] = useState<AILearning[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);

  // Navigation
  const [activeTab, setActiveTab] = useState<'devices' | 'learnings' | 'documents' | 'notifications'>('devices');

  // Filters
  const [deviceFilter, setDeviceFilter] = useState<'ALL' | 'ALARM' | 'RUNNING' | 'WIRE_EDM' | 'SINKER_EDM'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Success Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      const [devRes, statRes, docRes, learnRes, notifRes, techRes] = await Promise.all([
        safeFetchJson('/api/devices'),
        safeFetchJson('/api/stats'),
        safeFetchJson('/api/documents'),
        safeFetchJson('/api/ai/learnings'),
        safeFetchJson('/api/notifications'),
        safeFetchJson('/api/technicians'),
      ]);

      if (devRes && devRes.success && Array.isArray(devRes.data)) {
        setDevices(devRes.data);

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
      }

      if (statRes && statRes.success && statRes.data) setStats(statRes.data);
      if (docRes && docRes.success && Array.isArray(docRes.data)) setDocuments(docRes.data);
      if (learnRes && learnRes.success && Array.isArray(learnRes.data)) setLearnings(learnRes.data);
      if (notifRes && notifRes.success && Array.isArray(notifRes.data)) setNotifications(notifRes.data);
      if (techRes && techRes.success && Array.isArray(techRes.data)) setTechnicians(techRes.data);
    } catch (err) {
      console.warn('Fetch sync warning:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Poll telemetry every 2.5 seconds
    const interval = setInterval(fetchAllData, 2500);
    return () => clearInterval(interval);
  }, []);

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

  // Filtered devices list
  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.assignedTechnician?.name.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    if (deviceFilter === 'ALARM') matchesFilter = d.status === 'ALARM_STOPPED';
    else if (deviceFilter === 'RUNNING') matchesFilter = d.status === 'RUNNING';
    else if (deviceFilter === 'WIRE_EDM') matchesFilter = d.type === 'WIRE_EDM';
    else if (deviceFilter === 'SINKER_EDM') matchesFilter = d.type === 'SINKER_EDM';

    return matchesSearch && matchesFilter;
  });

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
            {/* Facility Key Performance Indicators (Total Active, Average Efficiency, Urgent Repairs) */}
            <FacilitySummaryCard
              devices={devices}
              activeFilter={deviceFilter}
              onSelectFilter={(f) => setDeviceFilter(f)}
            />

            {/* 30-Day Machine Uptime Trends & Recharts Analytics Dashboard */}
            <PerformanceAnalytics devices={devices} />

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-slate-900/60 border border-slate-800 p-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm máy theo mã, model, vị trí, KTV..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Status Filter Buttons and QR Scanner */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <button
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
              </div>
            </div>

            {/* Industrial SCADA Machine Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onOpenDiagnosis={(d) => setDiagnosisDevice(d)}
                  onOpenRepairReport={(d) => setRepairDevice(d)}
                  onTriggerAlarm={(id) => handleTriggerAlarm(id)}
                  onAcknowledge={(id) => handleAcknowledge(id)}
                  onOpenPhoneViewWithIncident={(d) => setPhoneDevice(d)}
                  onOpenMachineDetails={(d) => setDetailsDevice(d)}
                />
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
        onUpdateTechStatus={handleUpdateTechStatus}
        onReassignDevice={handleReassignDevice}
        onOpenPhoneView={(d) => setPhoneDevice(d)}
        onOpenMachineDetails={(d) => setDetailsDevice(d)}
      />

      {/* 8. QR Code Scanner Modal for Physical Machine Stickers */}
      <QRCodeScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        devices={devices}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
}
