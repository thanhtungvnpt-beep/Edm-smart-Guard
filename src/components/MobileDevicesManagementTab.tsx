import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Battery,
  BatteryCharging,
  Bell,
  CheckCircle2,
  HardDrive,
  Laptop,
  Lock,
  MapPin,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tablet,
  Unlock,
  Trash2,
  UserCheck,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { MobileDevice, Technician } from '../types';

interface MobileDevicesManagementTabProps {
  mobileDevices: MobileDevice[];
  technicians: Technician[];
  onRefresh: () => void;
  onSendTestPush: (deviceId: string) => Promise<void>;
  onPingDevice: (deviceId: string) => Promise<void>;
  onToggleLockDevice: (deviceId: string) => Promise<void>;
  onDeleteDevice: (deviceId: string) => Promise<void>;
  onRegisterDevice: (data: Partial<MobileDevice>) => Promise<void>;
  onBroadcast: (title: string, message: string, urgency: 'INFO' | 'CRITICAL') => Promise<void>;
}

export const MobileDevicesManagementTab: React.FC<MobileDevicesManagementTabProps> = ({
  mobileDevices,
  technicians,
  onRefresh,
  onSendTestPush,
  onPingDevice,
  onToggleLockDevice,
  onDeleteDevice,
  onRegisterDevice,
  onBroadcast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'RUGGED'>('ALL');

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<MobileDevice | null>(null);

  // Register Form State
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<MobileDevice['deviceType']>('SMARTPHONE');
  const [newOs, setNewOs] = useState<'Android' | 'iOS'>('Android');
  const [newOsVersion, setNewOsVersion] = useState('Android 14');
  const [newTechId, setNewTechId] = useState(technicians[0]?.id || '');
  const [newPhone, setNewPhone] = useState(technicians[0]?.phone || '');
  const [newZone, setNewZone] = useState('Khu Vực Máy Cắt Dây EDM-W01 & W02');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastUrgency, setBroadcastUrgency] = useState<'INFO' | 'CRITICAL'>('INFO');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Action loading indicators per device
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Summary Metrics
  const totalCount = mobileDevices.length;
  const onlineCount = mobileDevices.filter((d) => d.status === 'ONLINE' && !d.isLocked).length;
  const offlineCount = mobileDevices.filter((d) => d.status === 'OFFLINE' || d.isLocked).length;
  const pushActiveCount = mobileDevices.filter((d) => d.pushStatus === 'ACTIVE').length;
  const cacheReadyCount = mobileDevices.filter((d) => d.offlineCacheReady).length;

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return mobileDevices.filter((d) => {
      const matchSearch =
        d.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.assignedTechnicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phoneNumber.includes(searchTerm) ||
        d.currentZone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.ipAddress.includes(searchTerm);

      if (!matchSearch) return false;

      if (statusFilter === 'ONLINE') return d.status === 'ONLINE' && !d.isLocked;
      if (statusFilter === 'OFFLINE') return d.status === 'OFFLINE' || d.isLocked;
      if (statusFilter === 'RUGGED')
        return d.deviceType === 'INDUSTRIAL_PDA' || d.deviceType === 'BARCODE_TERMINAL';

      return true;
    });
  }, [mobileDevices, searchTerm, statusFilter]);

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    setIsSubmitting(true);
    try {
      await onRegisterDevice({
        deviceName: newDeviceName.trim(),
        deviceType: newDeviceType,
        os: newOs,
        osVersion: newOsVersion,
        assignedTechnicianId: newTechId,
        phoneNumber: newPhone,
        currentZone: newZone,
      });
      setShowRegisterModal(false);
      setNewDeviceName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;

    setIsBroadcasting(true);
    try {
      await onBroadcast(broadcastTitle.trim(), broadcastBody.trim(), broadcastUrgency);
      setShowBroadcastModal(false);
      setBroadcastTitle('');
      setBroadcastBody('');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const executeAction = async (id: string, actionFn: () => Promise<void>) => {
    setActionLoadingId(id);
    try {
      await actionFn();
    } finally {
      setActionLoadingId(null);
    }
  };

  const getDeviceIcon = (type: MobileDevice['deviceType']) => {
    switch (type) {
      case 'TABLET':
        return <Tablet className="h-5 w-5 text-cyan-400" />;
      case 'INDUSTRIAL_PDA':
      case 'BARCODE_TERMINAL':
        return <Radio className="h-5 w-5 text-amber-400" />;
      default:
        return <Smartphone className="h-5 w-5 text-indigo-400" />;
    }
  };

  const getSignalBadge = (dbm: number) => {
    if (dbm >= -60) {
      return <span className="text-emerald-400 font-mono font-bold flex items-center gap-1"><Wifi className="h-3 w-3" /> {dbm} dBm (Rất Tốt)</span>;
    }
    if (dbm >= -80) {
      return <span className="text-amber-400 font-mono font-bold flex items-center gap-1"><Wifi className="h-3 w-3" /> {dbm} dBm (Ổn định)</span>;
    }
    return <span className="text-red-400 font-mono font-bold flex items-center gap-1"><WifiOff className="h-3 w-3" /> {dbm} dBm (Yếu / Chập chờn)</span>;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30">
                <Smartphone className="h-5 w-5" />
              </span>
              <span className="rounded bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-indigo-300">
                MOBILE FLEET & TERMINAL SCADA
              </span>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                {onlineCount} Máy Đang Kết Nối
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Quản Lý Thiết Bị Di Động Kết Nối Hệ Thống
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Theo dõi trực tiếp điện thoại, máy tính bảng công nghiệp (Rugged PDA) và thiết bị cầm tay của kỹ thuật viên. Quản lý trạng thái thông báo đẩy FCM, bộ nhớ đệm Service Worker ngoại tuyến và gửi tín hiệu thử nghiệm tức thì.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-300 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5 text-amber-400" />
              <span>Phát Thông Báo Toàn Xưởng</span>
            </button>

            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-xl shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Đăng Ký Thiết Bị Mới</span>
            </button>

            <button
              onClick={onRefresh}
              title="Làm mới trạng thái kết nối và ping"
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total & Online */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Thiết bị trực tuyến</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{onlineCount}</span>
            <span className="text-xs text-slate-400 font-mono">/ {totalCount} thiết bị</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            {Math.round((onlineCount / (totalCount || 1)) * 100)}% đội ngũ kỹ thuật đang online
          </p>
        </div>

        {/* Metric 2: Push Notifications */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Web Push / FCM Khẩn cấp</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">{pushActiveCount}</span>
            <span className="text-xs text-slate-400 font-mono">/ {totalCount} thiết bị</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Sẵn sàng nhận còi báo dừng máy khẩn cấp
          </p>
        </div>

        {/* Metric 3: Offline Service Worker Cache */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Bản đệm Offline SCADA</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400 font-mono">{cacheReadyCount}</span>
            <span className="text-xs text-slate-400 font-mono">/ {totalCount} thiết bị</span>
          </div>
          <p className="mt-1 text-[11px] text-cyan-300">
            Đã lưu 6 máy &amp; 6 tài liệu vào đĩa cứng
          </p>
        </div>

        {/* Metric 4: Average Latency */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Độ trễ trung bình Gateway</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Radio className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400 font-mono">24 ms</span>
            <span className="text-xs text-slate-400">Wi-Fi 5GHz</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Độ trễ tối ưu cho phản hồi tức thì 1Hz
          </p>
        </div>
      </div>

      {/* 3. Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-slate-900/60 border border-slate-800 p-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo thiết bị, KTV, số ĐT, khu vực..."
            className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-indigo-400 font-bold border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất cả ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('ONLINE')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition flex items-center gap-1 ${
              statusFilter === 'ONLINE'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Trực Tuyến ({onlineCount})
          </button>
          <button
            onClick={() => setStatusFilter('OFFLINE')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition flex items-center gap-1 ${
              statusFilter === 'OFFLINE'
                ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/40'
                : 'text-slate-400 hover:text-red-300'
            }`}
          >
            <WifiOff className="h-3 w-3" />
            Ngoại Tuyến / Khóa ({offlineCount})
          </button>
          <button
            onClick={() => setStatusFilter('RUGGED')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition flex items-center gap-1 ${
              statusFilter === 'RUGGED'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Radio className="h-3 w-3" />
            Máy Công Nghiệp (Rugged)
          </button>
        </div>
      </div>

      {/* 4. Connected Mobile Devices Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDevices.map((device) => {
          const isOnline = device.status === 'ONLINE' && !device.isLocked;
          const isLoading = actionLoadingId === device.id;

          return (
            <div
              key={device.id}
              className={`rounded-3xl border p-5 transition-all duration-200 flex flex-col justify-between ${
                device.isLocked
                  ? 'border-red-900/60 bg-red-950/20 opacity-80'
                  : isOnline
                  ? 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900/90 shadow-xl'
                  : 'border-slate-800/80 bg-slate-950/70'
              }`}
            >
              {/* Header: Device Name, OS, Online indicator */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700/80 shrink-0 shadow-md">
                      {getDeviceIcon(device.deviceType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">
                          {device.os}
                        </span>
                        <span className="rounded bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.2 text-[10px] font-mono text-indigo-300">
                          {device.appVersion}
                        </span>
                        {device.isLocked && (
                          <span className="rounded bg-red-500/20 border border-red-500/40 px-1.5 py-0.2 text-[10px] font-mono font-bold text-red-300 flex items-center gap-0.5">
                            <Lock className="h-2.5 w-2.5" /> ĐÃ KHÓA
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-sm sm:text-base mt-1 line-clamp-1">
                        {device.deviceName}
                      </h3>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {device.isLocked ? (
                      <span className="rounded-full bg-red-950/60 border border-red-500/50 px-2 py-0.5 text-[10px] font-mono font-bold text-red-400">
                        BỊ KHÓA
                      </span>
                    ) : isOnline ? (
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        ONLINE
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                        OFFLINE
                      </span>
                    )}
                  </div>
                </div>

                {/* Technician Owner Strip */}
                <div className="mt-3.5 flex items-center justify-between rounded-xl bg-slate-950/60 border border-slate-800 p-2.5">
                  <div className="flex items-center gap-2.5">
                    {device.technicianAvatar ? (
                      <img
                        src={device.technicianAvatar}
                        alt={device.assignedTechnicianName}
                        className="h-8 w-8 rounded-lg object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {device.assignedTechnicianName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {device.assignedTechnicianName}
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        {device.technicianRole}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`tel:${device.phoneNumber}`}
                    className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] font-mono text-amber-400 hover:text-amber-300 transition"
                  >
                    {device.phoneNumber}
                  </a>
                </div>

                {/* Telemetry Info Grid */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {/* Battery */}
                  <div className="rounded-xl bg-slate-950/40 border border-slate-800/80 p-2">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      {device.isCharging ? (
                        <BatteryCharging className="h-3 w-3 text-emerald-400 animate-pulse" />
                      ) : (
                        <Battery className="h-3 w-3 text-slate-400" />
                      )}
                      <span>Mức Pin:</span>
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            device.batteryLevel > 50
                              ? 'bg-emerald-500'
                              : device.batteryLevel > 20
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${device.batteryLevel}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-white">
                        {device.batteryLevel}%
                      </span>
                    </div>
                  </div>

                  {/* Wi-Fi RSSI Signal */}
                  <div className="rounded-xl bg-slate-950/40 border border-slate-800/80 p-2">
                    <span className="text-[10px] text-slate-400">Tín hiệu Wi-Fi:</span>
                    <div className="mt-0.5">{getSignalBadge(device.signalStrengthDbm)}</div>
                  </div>

                  {/* Current Zone Location */}
                  <div className="col-span-2 rounded-xl bg-slate-950/40 border border-slate-800/80 p-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                      <span className="truncate">Vị trí: {device.currentZone}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      IP: {device.ipAddress}
                    </span>
                  </div>
                </div>

                {/* Service Worker Offline Storage readiness indicator */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] px-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <HardDrive className="h-3 w-3 text-cyan-400" />
                    <span>Bộ nhớ đệm:</span>
                  </span>
                  <span className="font-mono text-cyan-300 font-semibold">
                    {device.cachedDevicesCount} máy • {device.cachedDocsCount} tài liệu
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5 text-xs">
                {/* Send Test Push Button */}
                <button
                  disabled={isLoading || device.isLocked}
                  onClick={() => executeAction(device.id, () => onSendTestPush(device.id))}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1.5 font-bold text-indigo-300 hover:text-white transition cursor-pointer disabled:opacity-40"
                  title="Gửi tín hiệu thông báo đẩy khẩn cấp kiểm thử tới màn hình điện thoại này"
                >
                  <Bell className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Push Test</span>
                </button>

                {/* Ping Button */}
                <button
                  disabled={isLoading}
                  onClick={() => executeAction(device.id, () => onPingDevice(device.id))}
                  className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 font-semibold text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-40"
                  title="Ping kiểm tra phản hồi từ thiết bị"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Ping</span>
                </button>

                {/* Lock / Unlock Toggle Button */}
                <button
                  disabled={isLoading}
                  onClick={() => executeAction(device.id, () => onToggleLockDevice(device.id))}
                  className={`flex items-center justify-center p-1.5 rounded-xl border transition cursor-pointer disabled:opacity-40 ${
                    device.isLocked
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  }`}
                  title={device.isLocked ? 'Mở khóa quyền truy cập' : 'Khóa từ xa thiết bị này (nếu bị thất lạc)'}
                >
                  {device.isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                </button>

                {/* Delete / Unregister Button */}
                <button
                  disabled={isLoading}
                  onClick={() => executeAction(device.id, () => onDeleteDevice(device.id))}
                  className="flex items-center justify-center p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-500 hover:text-red-400 hover:border-red-500/40 transition cursor-pointer"
                  title="Hủy liên kết thiết bị khỏi hệ thống SCADA"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Modal: Đăng Ký Thiết Bị Di Động Mới */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Đăng Ký Thiết Bị Di Động Kỹ Thuật Mới
                  </h3>
                  <p className="text-xs text-slate-400">
                    Thêm điện thoại, máy tính bảng hoặc máy quét cầm tay vào SCADA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Tên thiết bị / Model máy:</label>
                <input
                  type="text"
                  required
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="Ví dụ: Samsung Galaxy XCover 7, Zebra TC58, iPad Mini 6..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Loại thiết bị:</label>
                  <select
                    value={newDeviceType}
                    onChange={(e) => setNewDeviceType(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SMARTPHONE">Smartphone</option>
                    <option value="TABLET">Tablet / iPad</option>
                    <option value="INDUSTRIAL_PDA">Máy Cầm Tay Rugged IP68</option>
                    <option value="BARCODE_TERMINAL">Đầu Đọc Quét Mã QR/RFID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Hệ điều hành:</label>
                  <select
                    value={newOs}
                    onChange={(e) => {
                      const nextOs = e.target.value as 'Android' | 'iOS';
                      setNewOs(nextOs);
                      setNewOsVersion(nextOs === 'iOS' ? 'iOS 17.5' : 'Android 14');
                    }}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Android">Google Android</option>
                    <option value="iOS">Apple iOS / iPadOS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Kỹ thuật viên phụ trách:</label>
                <select
                  value={newTechId}
                  onChange={(e) => {
                    const tech = technicians.find((t) => t.id === e.target.value);
                    setNewTechId(e.target.value);
                    if (tech) setNewPhone(tech.phone);
                  }}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Số điện thoại nhận Push:</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0983.xxx.xxx"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Phân khu xưởng thường trực:</label>
                  <input
                    type="text"
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    placeholder="Khu Máy Cắt Dây, Khu Máy Xung..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 font-semibold text-slate-300 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 font-bold text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang đăng ký...' : 'Xác Nhận Đăng Ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Phát Thông Báo Đẩy Toàn Xưởng (Broadcast) */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-amber-500/40 bg-slate-900 p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Phát Thông Báo Đẩy Toàn Bộ Thiết Bị Di Động
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gửi tin nhắn khẩn cấp tới {onlineCount} thiết bị di động đang trực tuyến
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Mức độ ưu tiên thông báo:</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      checked={broadcastUrgency === 'INFO'}
                      onChange={() => setBroadcastUrgency('INFO')}
                      className="accent-amber-500"
                    />
                    <span className="font-medium text-slate-200">Thông báo vận hành thông thường</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      checked={broadcastUrgency === 'CRITICAL'}
                      onChange={() => setBroadcastUrgency('CRITICAL')}
                      className="accent-red-500"
                    />
                    <span className="font-bold text-red-400">🚨 Khẩn cấp (Còi hú lớn)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Tiêu đề thông báo:</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra an toàn áp suất bồn dầu, Bắt đầu ca chiều..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nội dung chi tiết thông báo:</label>
                <textarea
                  rows={3}
                  required
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="Nhập nội dung cần truyền đạt tới tất cả kỹ thuật viên trên sàn xưởng..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  Thông báo sẽ được truyền qua kênh Web Push &amp; Service Worker tới cả các máy đang chạy ngầm trên sàn xưởng.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 font-semibold text-slate-300 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 font-bold text-slate-950 shadow-lg shadow-amber-500/30 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isBroadcasting ? 'Đang phát sóng...' : 'Phát Tín Hiệu Ngay'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
