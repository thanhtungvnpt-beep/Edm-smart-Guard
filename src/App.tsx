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
  const [showSimulator, setShowSimulator] = useState(false);

  // Success Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Track previously alarmed devices to prevent redundant siren triggers
  const previousAlarmIdsRef = useRef<Set<string>>(new Set());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // --- FETCH DATA ---
  const fetchAllData = async () => {
    try {
      const [devRes, statRes, docRes, learnRes, notifRes, techRes] = await Promise.all([
        fetch('/api/devices').then((r) => r.json()),
        fetch('/api/stats').then((r) => r.json()),
        fetch('/api/documents').then((r) => r.json()),
        fetch('/api/ai/learnings').then((r) => r.json()),
        fetch('/api/notifications').then((r) => r.json()),
        fetch('/api/technicians').then((r) => r.json()),
      ]);

      if (devRes.success) {
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

      if (statRes.success) setStats(statRes.data);
      if (docRes.success) setDocuments(docRes.data);
      if (learnRes.success) setLearnings(learnRes.data);
      if (notifRes.success) setNotifications(notifRes.data);
      if (techRes.success) setTechnicians(techRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
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

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
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
    </div>
  );
}
