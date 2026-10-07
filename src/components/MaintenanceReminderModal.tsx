import React, { useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Bell,
  BellOff,
  BellPlus,
  BellRing,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Droplets,
  Filter,
  Layers,
  Play,
  Plus,
  Radio,
  Send,
  Trash2,
  User,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { Device, MaintenanceReminder } from '../types';
import {
  getDeviceMaintenanceReminders,
  saveMaintenanceReminder,
  deleteMaintenanceReminder,
  toggleReminderActive,
  calculateNextDueDate,
} from '../utils/maintenanceReminderData';

interface MaintenanceReminderModalProps {
  device: Device;
  onClose: () => void;
  onToast?: (message: string) => void;
}

const PRESET_COMPONENTS = [
  {
    id: 'filter',
    name: 'Lõi lọc nước ion & giấy 3-micron',
    type: 'FILTER' as const,
    defaultDays: 14,
    defaultPriority: 'HIGH' as const,
    icon: Filter,
    desc: 'Lọc hạt xỉ kim loại và duy trì độ trong suốt nước điện môi',
    instructions: 'Kiểm tra chênh lệch áp suất qua bình lọc (>0.25 MPa thì thay).',
  },
  {
    id: 'pump',
    name: 'Bơm nước làm mát & dung môi cao áp',
    type: 'PUMP' as const,
    defaultDays: 30,
    defaultPriority: 'CRITICAL' as const,
    icon: Droplets,
    desc: 'Bơm tuần hoàn dung môi cao áp xả phoi và giải nhiệt đầu cắt',
    instructions: 'Kiểm tra độ rung motor, rò rỉ phớt gốm và áp lực xả đạt 1.8 MPa.',
  },
  {
    id: 'guide',
    name: 'Cụm dẫn hướng kim cương trên/dưới',
    type: 'GUIDE' as const,
    defaultDays: 21,
    defaultPriority: 'HIGH' as const,
    icon: Zap,
    desc: 'Định vị chính xác dây cắt EDM 0.25mm với độ đảo < 0.002mm',
    instructions: 'Rửa siêu âm, kiểm tra mòn lỗ kim cương và rà góc nghiêng U/V.',
  },
  {
    id: 'contact',
    name: 'Khối tiếp điện cacbua phóng tia lửa',
    type: 'CONTACT' as const,
    defaultDays: 10,
    defaultPriority: 'HIGH' as const,
    icon: Cpu,
    desc: 'Truyền tải xung điện cao tần từ máy phát tới dây cắt',
    instructions: 'Xoay mặt tiếp xúc cacbua mới hoặc mài phẳng vết lõm mòn.',
  },
  {
    id: 'lubrication',
    name: 'Bơm mỡ bôi trơn trục vít me & ray trượt',
    type: 'LUBRICATION' as const,
    defaultDays: 45,
    defaultPriority: 'MEDIUM' as const,
    icon: Wrench,
    desc: 'Bảo vệ cơ cấu chuyển động cơ khí chính xác trục X/Y/Z',
    instructions: 'Bơm mỡ chuyên dụng Kluber Isoflex, lau sạch bụi xỉ bám thanh ray.',
  },
  {
    id: 'spindle',
    name: 'Động cơ servo Z & van xả đáy bể',
    type: 'SPINDLE' as const,
    defaultDays: 30,
    defaultPriority: 'HIGH' as const,
    icon: Layers,
    desc: 'Hệ thống servo nâng hạ đầu điện cực và đóng mở van ngâm',
    instructions: 'Kiểm tra phản hồi servo, gioăng làm kín nắp buồng gia công.',
  },
];

export const MaintenanceReminderModal: React.FC<MaintenanceReminderModalProps> = ({
  device,
  onClose,
  onToast,
}) => {
  const [reminders, setReminders] = useState<MaintenanceReminder[]>(() =>
    getDeviceMaintenanceReminders(device.id)
  );

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  // Form states for creating custom recurring reminder
  const [selectedPreset, setSelectedPreset] = useState<string>('filter');
  const [customName, setCustomName] = useState<string>('Lõi lọc nước ion & giấy 3-micron');
  const [componentType, setComponentType] = useState<MaintenanceReminder['componentType']>('FILTER');
  const [intervalDays, setIntervalDays] = useState<number>(14);
  const [intervalMode, setIntervalMode] = useState<'DAYS' | 'HOURS'>('DAYS');
  const [intervalHours, setIntervalHours] = useState<number>(250);
  const [priority, setPriority] = useState<MaintenanceReminder['priority']>('HIGH');
  const [channel, setChannel] = useState<MaintenanceReminder['notificationChannel']>('PUSH_NOTIFICATION');
  const [technicianName, setTechnicianName] = useState<string>(
    device.assignedTechnician?.name || 'Lê Hoàng Nam (Chuyên gia EDM)'
  );
  const [instructions, setInstructions] = useState<string>(
    'Kiểm tra chênh lệch áp suất qua bình lọc (>0.25 MPa thì thay).'
  );
  const [testAlertSuccess, setTestAlertSuccess] = useState<string | null>(null);

  // Play audio sound when alert is triggered
  const playAlertChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Ignore audio failure
    }
  };

  const handleSelectPreset = (preset: (typeof PRESET_COMPONENTS)[0]) => {
    setSelectedPreset(preset.id);
    setCustomName(preset.name);
    setComponentType(preset.type);
    setIntervalDays(preset.defaultDays);
    setPriority(preset.defaultPriority);
    setInstructions(preset.instructions);
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const nextDue = calculateNextDueDate(todayStr, intervalMode === 'DAYS' ? intervalDays : Math.round(intervalHours / 16));

    const newReminder: MaintenanceReminder = {
      id: `remind-${Date.now()}`,
      deviceId: device.id,
      deviceCode: device.code,
      deviceName: device.name,
      componentName: customName.trim(),
      componentType,
      intervalType: intervalMode === 'DAYS' ? 'CALENDAR_DAYS' : 'OPERATING_HOURS',
      intervalValue: intervalMode === 'DAYS' ? intervalDays : intervalHours,
      lastServicedDate: todayStr,
      nextDueDate: nextDue,
      currentOperatingHours: 4250,
      dueOperatingHours: 4250 + (intervalMode === 'HOURS' ? intervalHours : intervalDays * 16),
      priority,
      notificationChannel: channel,
      assignedTechnicianName: technicianName.trim() || 'Kỹ thuật viên phụ trách',
      instructions: instructions.trim() || 'Tiến hành kiểm tra và bảo dưỡng định kỳ linh kiện này theo tiêu chuẩn OEM.',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updated = saveMaintenanceReminder(newReminder);
    setReminders(updated.filter((r) => r.deviceId === device.id));
    setActiveTab('list');

    playAlertChime();
    const msg = `Đã kích hoạt nhắc nhở định kỳ cho: ${newReminder.componentName} (Mỗi ${newReminder.intervalValue} ${intervalMode === 'DAYS' ? 'ngày' : 'giờ'})`;
    if (onToast) onToast(msg);
  };

  const handleToggleActive = (id: string) => {
    const updated = toggleReminderActive(id);
    setReminders(updated.filter((r) => r.deviceId === device.id));
  };

  const handleDelete = (id: string, name: string) => {
    const updated = deleteMaintenanceReminder(id);
    setReminders(updated.filter((r) => r.deviceId === device.id));
    if (onToast) onToast(`Đã xóa nhắc nhở bảo dưỡng: ${name}`);
  };

  const handleTestTrigger = (reminder: MaintenanceReminder) => {
    playAlertChime();
    setTestAlertSuccess(reminder.id);
    setTimeout(() => setTestAlertSuccess(null), 3000);

    const msg = `🔔 Đã gửi cảnh báo thử nghiệm [${reminder.componentName}] tới thiết bị di động của ${reminder.assignedTechnicianName}`;
    if (onToast) onToast(msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden my-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Thiết Lập Nhắc Nhở Bảo Dưỡng Linh Kiện
                </h3>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400">
                  {device.code}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tạo thông báo định kỳ tự động cho các linh kiện như lõi lọc, bơm nước làm mát, cụm kim cương
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Đóng cửa sổ"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* TABS */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-5 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
                activeTab === 'list'
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Đang Kích Hoạt ({reminders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
                activeTab === 'create'
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Tạo Nhắc Nhở Định Kỳ Mới</span>
            </button>
          </div>

          {activeTab === 'list' && (
            <button
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm Nhắc Nhở</span>
            </button>
          )}
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB: LIST OF ACTIVE REMINDERS */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {reminders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
                    <BellOff className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Chưa có nhắc nhở định kỳ nào</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Hãy tạo nhắc nhở định kỳ cho các linh kiện quan trọng như lõi lọc nước ion hoặc bơm áp suất cao để không bao giờ bỏ lỡ kỳ bảo trì.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Thiết Lập Nhắc Nhở Đầu Tiên</span>
                  </button>
                </div>
              ) : (
                reminders.map((item) => {
                  const today = new Date();
                  const dueDate = new Date(item.nextDueDate);
                  const diffTime = dueDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isUrgent = diffDays <= 3;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border transition p-4 space-y-3 ${
                        item.isActive
                          ? isUrgent
                            ? 'border-amber-500/50 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950'
                            : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                          : 'border-slate-800/50 bg-slate-950/30 opacity-60'
                      }`}
                    >
                      {/* Reminder Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs ${
                              item.componentType === 'FILTER'
                                ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400'
                                : item.componentType === 'PUMP'
                                ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
                                : item.componentType === 'GUIDE'
                                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                                : 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                            }`}
                          >
                            {item.componentType === 'FILTER' ? (
                              <Filter className="h-4 w-4" />
                            ) : item.componentType === 'PUMP' ? (
                              <Droplets className="h-4 w-4" />
                            ) : item.componentType === 'GUIDE' ? (
                              <Zap className="h-4 w-4" />
                            ) : (
                              <Wrench className="h-4 w-4" />
                            )}
                          </span>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">
                                {item.componentName}
                              </h4>
                              {item.priority === 'CRITICAL' ? (
                                <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[9px] font-bold text-red-400">
                                  KHẨN CẤP
                                </span>
                              ) : item.priority === 'HIGH' ? (
                                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                                  ƯU TIÊN CAO
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] text-slate-400">
                                  TIÊU CHUẨN
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Lặp lại: <strong className="text-slate-200">mỗi {item.intervalValue} {item.intervalType === 'CALENDAR_DAYS' ? 'ngày' : 'giờ máy'}</strong> • Kênh: {item.notificationChannel === 'PUSH_NOTIFICATION' ? 'Thông báo đẩy (Push)' : 'Còi báo SCADA'}
                            </span>
                          </div>
                        </div>

                        {/* Status Switch & Actions */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            onClick={() => handleToggleActive(item.id)}
                            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition border ${
                              item.isActive
                                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                                : 'border-slate-700 bg-slate-800 text-slate-400'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                item.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                              }`}
                            ></span>
                            <span>{item.isActive ? 'Đang Bật' : 'Tạm Dừng'}</span>
                          </button>

                          {/* Test push trigger button */}
                          <button
                            onClick={() => handleTestTrigger(item)}
                            className="flex items-center gap-1 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 text-xs text-indigo-300 transition"
                            title="Bấm để phát thử nghiệm thông báo đẩy tới điện thoại kỹ thuật viên"
                          >
                            <Send className="h-3 w-3" />
                            <span>Thử Chuông</span>
                          </button>

                          <button
                            onClick={() => handleDelete(item.id, item.componentName)}
                            className="rounded-xl border border-slate-700 bg-slate-800/80 p-1.5 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition"
                            title="Xóa nhắc nhở này"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Reminder Details Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          <span>
                            Đến hạn kế tiếp:{' '}
                            <strong className="text-white font-mono">{new Date(item.nextDueDate).toLocaleDateString('vi-VN')}</strong>
                            {item.isActive && (
                              <span className={`ml-1.5 font-bold ${isUrgent ? 'text-amber-400' : 'text-emerald-400'}`}>
                                ({diffDays <= 0 ? 'Hôm nay' : `còn ${diffDays} ngày`})
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-300">
                          <User className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                          <span>
                            Người phụ trách: <strong className="text-white">{item.assignedTechnicianName}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Instructions snippet */}
                      <p className="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-slate-700 pl-2.5">
                        "{item.instructions}"
                      </p>

                      {testAlertSuccess === item.id && (
                        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>Đã phát lệnh cảnh báo Push Notification thử nghiệm thành công tới thiết bị kỹ thuật viên!</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB: CREATE NEW RECURRING REMINDER */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateReminder} className="space-y-4">
              {/* PRESETS SELECTION */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                  1. Chọn Nhanh Linh Kiện Cần Nhắc Nhở Định Kỳ:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_COMPONENTS.map((preset) => {
                    const isSelected = selectedPreset === preset.id;
                    const Icon = preset.icon;

                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`text-left p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/15 shadow-sm shadow-amber-500/20'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {preset.id === 'filter' ? 'Lõi Lọc Nước Ion' : preset.id === 'pump' ? 'Bơm Nước Làm Mát' : preset.id === 'guide' ? 'Dẫn Hướng Kim Cương' : preset.id === 'contact' ? 'Khối Tiếp Điện' : preset.id === 'lubrication' ? 'Bơm Mỡ Trục Vít' : 'Động Cơ Servo Z'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Định kỳ: ~{preset.defaultDays} ngày
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* COMPONENT NAME & DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Tên linh kiện / Cụm chi tiết máy *
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="VD: Lõi lọc nước ion & giấy 3-micron"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Phân loại linh kiện
                  </label>
                  <select
                    value={componentType}
                    onChange={(e) => setComponentType(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="FILTER">Bộ Lọc (Lõi lọc giấy, ion, than hoạt tính)</option>
                    <option value="PUMP">Bơm (Bơm cao áp, tuần hoàn, nước làm mát)</option>
                    <option value="GUIDE">Cụm Dẫn Hướng (Kim cương, con lăn kéo dây)</option>
                    <option value="CONTACT">Khối Tiếp Điện (Carbide Power Contacts)</option>
                    <option value="LUBRICATION">Bôi Trơn (Vít me bi, thanh trượt THK)</option>
                    <option value="SPINDLE">Trục Chính & Servo (Spindle, Servo Z)</option>
                    <option value="CUSTOM">Linh kiện đặc thù khác</option>
                  </select>
                </div>
              </div>

              {/* RECURRENCE INTERVAL */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>2. Chu Kỳ Lặp Lại Nhắc Nhở (Recurrence Interval):</span>
                  </label>

                  <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setIntervalMode('DAYS')}
                      className={`px-2 py-0.5 rounded transition ${
                        intervalMode === 'DAYS' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                      }`}
                    >
                      Theo Ngày Lịch
                    </button>
                    <button
                      type="button"
                      onClick={() => setIntervalMode('HOURS')}
                      className={`px-2 py-0.5 rounded transition ${
                        intervalMode === 'HOURS' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                      }`}
                    >
                      Theo Giờ Chạy Máy
                    </button>
                  </div>
                </div>

                {intervalMode === 'DAYS' ? (
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {[7, 14, 21, 30, 45, 60, 90].map((d) => (
                        <button
                          type="button"
                          key={d}
                          onClick={() => setIntervalDays(d)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-mono transition border ${
                            intervalDays === d
                              ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                              : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          Mỗi {d} ngày
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Hoặc tùy chỉnh số ngày:</span>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={intervalDays}
                        onChange={(e) => setIntervalDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-20 rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-white font-mono text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span>ngày/lần</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {[100, 250, 500, 1000, 2000].map((h) => (
                        <button
                          type="button"
                          key={h}
                          onClick={() => setIntervalHours(h)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-mono transition border ${
                            intervalHours === h
                              ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                              : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          Mỗi {h} giờ máy
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Hoặc tùy chỉnh số giờ chạy:</span>
                      <input
                        type="number"
                        min="10"
                        max="10000"
                        value={intervalHours}
                        onChange={(e) => setIntervalHours(Math.max(10, parseInt(e.target.value, 10) || 10))}
                        className="w-24 rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-white font-mono text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span>giờ vận hành</span>
                    </div>
                  </div>
                )}
              </div>

              {/* PRIORITY, CHANNEL, ASSIGNEE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Mức độ ưu tiên</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="CRITICAL">🚨 Khẩn Cấp (Dừng máy nếu trễ)</option>
                    <option value="HIGH">⚠️ Ưu Tiên Cao (Ảnh hưởng sai số)</option>
                    <option value="MEDIUM">ℹ️ Tiêu Chuẩn (Bảo dưỡng thường)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Kênh gửi thông báo</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="PUSH_NOTIFICATION">📲 Push Notification (App/PWA)</option>
                    <option value="AUDIO_ALARM">🔊 Chuông Báo Động SCADA</option>
                    <option value="SMS">💬 Tin Nhắn SMS Trực Tiếp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Kỹ thuật viên phụ trách</label>
                  <input
                    type="text"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="Tên kỹ thuật viên"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* INSTRUCTIONS */}
              <div className="text-xs">
                <label className="block text-slate-300 mb-1 font-medium">
                  Hướng dẫn kiểm tra & nghiệm thu định kỳ
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Ghi rõ thao tác, thông số áp suất hoặc dụng cụ đo..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* SUBMIT BUTTONS */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Quay Lại Danh Sách
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition"
                >
                  Lưu & Kích Hoạt Nhắc Nhở
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
