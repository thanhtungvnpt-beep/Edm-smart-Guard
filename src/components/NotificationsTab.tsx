import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Phone,
  Radio,
  Send,
  Smartphone,
  Sparkles,
  Settings,
  Moon,
  Sun,
  ShieldAlert,
  Volume2,
  VolumeX,
  Vibrate,
  AlertTriangle,
  Info,
  Sliders,
  Check,
  RefreshCw,
} from 'lucide-react';
import { NotificationLog, Technician, PushNotificationFilterConfig, PushNotificationSeverityFilter } from '../types';
import { soundManager } from '../utils/audio';
import {
  getStoredPushFilterConfig,
  savePushFilterConfig,
  determineActivePushThreshold,
  shouldDeliverPushNotification,
  DEFAULT_PUSH_FILTER_CONFIG,
} from '../utils/pushFilterConfig';

interface NotificationsTabProps {
  logs: NotificationLog[];
  technicians: Technician[];
  onTestPushSuccess: (newLog: NotificationLog) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  logs,
  technicians,
  onTestPushSuccess,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'console' | 'settings'>('console');
  const [selectedTechId, setSelectedTechId] = useState<string>(technicians[0]?.id || '');
  const [customMsg, setCustomMsg] = useState('');
  const [testSeverity, setTestSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('CRITICAL');
  const [sending, setSending] = useState(false);
  const [config, setConfig] = useState<PushNotificationFilterConfig>(getStoredPushFilterConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Status computation
  const statusInfo = determineActivePushThreshold(config);

  const handleSaveConfig = (newConfig: PushNotificationFilterConfig) => {
    setConfig(newConfig);
    savePushFilterConfig(newConfig);
    setSaveSuccess(true);
    soundManager.playBeep();
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    handleSaveConfig(DEFAULT_PUSH_FILTER_CONFIG);
  };

  const handleSendTestPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const selectedTech = technicians.find((t) => t.id === selectedTechId) || technicians[0];
      const checkResult = shouldDeliverPushNotification(testSeverity, 'EDM-W01', config);

      const res = await fetch('/api/notifications/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: selectedTechId,
          customMessage: customMsg.trim() || undefined,
          severity: testSeverity,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (config.soundAlarmEnabled) {
          soundManager.playPushSound();
        }
        onTestPushSuccess(data.data);
        setCustomMsg('');
      }
    } catch (err) {
      console.error('Test push error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Navigation: Console vs Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('console')}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
              activeSubTab === 'console'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>Kênh Phát & Nhật Ký Bắn Push ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
              activeSubTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Cài Đặt Ngưỡng Cảnh Báo & Ca Trực Đêm</span>
            {config.nightShiftMode && (
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Quick Night Shift Pill Indicator */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 px-3.5 py-1.5 text-xs">
          {statusInfo.isNightShiftActive ? (
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Moon className="h-3.5 w-3.5 animate-pulse" />
              <span>Ca Trực Đêm Đang Bật</span>
              <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
                {config.nightShiftSeverityFilter === 'CRITICAL_ONLY' ? 'Chỉ Critical' : config.nightShiftSeverityFilter}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Sun className="h-3.5 w-3.5" />
              <span>Chế Độ Tiêu Chuẩn (Ca Ngày)</span>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-mono text-amber-300">
                {config.severityFilter === 'ALL' ? 'Tất Cả' : config.severityFilter === 'HIGH_AND_CRITICAL' ? 'High & Critical' : 'Chỉ Critical'}
              </span>
            </div>
          )}
        </div>
      </div>

      {activeSubTab === 'console' ? (
        <>
          {/* Test Push Sender Console */}
          <div className="rounded-3xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-950 p-6 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Kênh Phát Tín Hiệu Thông Báo Đẩy Điện Thoại (EDM Push Gateway)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kiểm tra đường truyền push notification tức thì tới thiết bị di động của kỹ thuật viên phụ trách.
                  </p>
                </div>
              </div>

              {/* Status pill */}
              <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-slate-900/90 border border-slate-800 px-3 py-1.5 text-[11px] text-slate-300">
                <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
                <span>Ngưỡng đang áp dụng: <strong className="text-white">{statusInfo.activeFilter}</strong></span>
              </div>
            </div>

            <form onSubmit={handleSendTestPush} className="mt-4 flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Kỹ thuật viên nhận thông báo:
                  </label>
                  <select
                    value={selectedTechId}
                    onChange={(e) => setSelectedTechId(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.phone}) - {t.shift}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Mức độ nghiêm trọng (Severity):
                  </label>
                  <select
                    value={testSeverity}
                    onChange={(e) => setTestSeverity(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  >
                    <option value="CRITICAL">🚨 CRITICAL (Khẩn Cấp - Dừng Máy)</option>
                    <option value="HIGH">⚠️ HIGH (Cảnh Báo Nguy Cơ Cao)</option>
                    <option value="MEDIUM">ℹ️ MEDIUM (Thông Báo Vận Hành / Nhẹ)</option>
                  </select>
                </div>

                <div className="sm:col-span-5 flex flex-col justify-end">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Nội dung tùy biến (Tùy chọn):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customMsg}
                      onChange={(e) => setCustomMsg(e.target.value)}
                      placeholder="Nội dung thông báo (để trống sẽ dùng tin mẫu)..."
                      className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 active:scale-95 shrink-0"
                    >
                      <Send className="h-4 w-4" />
                      <span>{sending ? 'Đang gửi...' : 'Bắn Push'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery Filter Prediction Badge */}
              {(() => {
                const check = shouldDeliverPushNotification(testSeverity, 'EDM-W01', config);
                return (
                  <div className={`mt-2 flex items-center justify-between rounded-xl px-3.5 py-2 text-xs border ${
                    check.allowed
                      ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                      : 'border-amber-500/30 bg-amber-950/30 text-amber-300'
                  }`}>
                    <span className="flex items-center gap-1.5 font-medium">
                      {check.allowed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                      <span>{check.reason}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('settings')}
                      className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>Điều chỉnh ngưỡng</span>
                    </button>
                  </div>
                );
              })()}
            </form>
          </div>

          {/* History Log Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-indigo-400" />
                <span>Lịch Sử Thông Báo Đẩy Đã Gửi Đến Điện Thoại ({logs.length})</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Kênh: Firebase Cloud Messaging / WebSocket Push
              </span>
            </div>

            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 text-xs hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-red-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                        {log.errorCode}
                      </span>
                      <span className="font-bold text-slate-200">{log.deviceName}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-400">
                        {new Date(log.timestamp).toLocaleString('vi-VN')}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{log.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Message preview */}
                  <p className="mt-2 text-slate-300 bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80 font-mono text-[11px] leading-relaxed">
                    {log.previewText}
                  </p>

                  {/* Recipient Details */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Phone className="h-3 w-3" />
                      <span>KTV tiếp nhận: {log.recipientName} ({log.recipientPhone})</span>
                    </div>
                    <span className="text-indigo-400">Kênh: {log.channel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* ================= SETTINGS SUB-TAB: PUSH THRESHOLDS & NIGHT SHIFT MODE ================= */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Status banner */}
          <div className="rounded-3xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Cấu Hình Ngưỡng Cảnh Báo Đẩy & Chế Độ Giảm Nhiễu Ca Đêm
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Tùy biến mức độ nghiêm trọng cần thiết để kích hoạt thông báo đẩy tới điện thoại của kỹ thuật viên.
                    Đặc biệt hữu ích trong ca trực đêm (22:00 - 06:00) nhằm loại bỏ các cảnh báo không cấp bách,
                    đảm bảo KTV chỉ bị đánh thức bởi các sự cố <strong>Critical</strong> (dừng máy đột ngột, đứt dây, tụt áp phóng điện).
                  </p>
                </div>
              </div>

              {saveSuccess && (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-300 animate-in fade-in">
                  <Check className="h-4 w-4" />
                  <span>Đã lưu cấu hình thành công!</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD 1: TIÊU CHUẨN (BAN NGÀY / CA BÌNH THƯỜNG) */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        Ngưỡng Cảnh Báo Tiêu Chuẩn (Ca Ngày)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Áp dụng trong các ca làm việc ban ngày hoặc khi tắt chế độ ca đêm
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  {[
                    {
                      id: 'ALL' as PushNotificationSeverityFilter,
                      title: 'Nhận Tất Cả Thông Báo (All Alerts)',
                      desc: 'Nhận cả sự cố Critical, cảnh báo High, và nhắc nhở bảo trì Medium/Low.',
                      badge: 'Toàn diện',
                      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
                    },
                    {
                      id: 'HIGH_AND_CRITICAL' as PushNotificationSeverityFilter,
                      title: 'Chỉ Nhận High & Critical',
                      desc: 'Lọc bỏ thông báo nhắc nhở thông thường, chỉ nhận các sự cố từ mức High trở lên.',
                      badge: 'Khuyên dùng',
                      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    },
                    {
                      id: 'CRITICAL_ONLY' as PushNotificationSeverityFilter,
                      title: 'Chỉ Nhận Cảnh Báo Khẩn Cấp (Critical Only)',
                      desc: 'Chỉ rung chuông khi máy dừng khẩn cấp (Emergency Stop, Đứt dây, Cháy nguồn).',
                      badge: 'Nghiêm ngặt',
                      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
                    },
                  ].map((item) => (
                    <label
                      key={item.id}
                      onClick={() => handleSaveConfig({ ...config, severityFilter: item.id })}
                      className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                        config.severityFilter === item.id
                          ? 'border-indigo-500 bg-indigo-950/30 text-white shadow-md shadow-indigo-500/10'
                          : 'border-slate-800/80 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="standard_severity"
                        checked={config.severityFilter === item.id}
                        onChange={() => {}}
                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">{item.title}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* CARD 2: CHẾ ĐỘ CA TRỰC ĐÊM (NIGHT SHIFT QUIET MODE) */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                      <Moon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        Chế Độ Giảm Nhiễu Ca Trực Đêm (Night Shift Quiet Mode)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Tự động siết chặt ngưỡng cảnh báo vào ban đêm để KTV tập trung xử lý sự cố sống còn
                      </p>
                    </div>
                  </div>

                  {/* Night Shift Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.nightShiftMode}
                      onChange={(e) =>
                        handleSaveConfig({ ...config, nightShiftMode: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>

                {config.nightShiftMode ? (
                  <div className="space-y-4 mt-4">
                    {/* Time Window Settings */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <label className="block text-xs font-bold text-slate-200 mb-2">
                        Khung giờ ca trực đêm:
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono">Bắt đầu lúc:</span>
                          <select
                            value={config.nightShiftStartHour}
                            onChange={(e) =>
                              handleSaveConfig({
                                ...config,
                                nightShiftStartHour: parseInt(e.target.value, 10),
                              })
                            }
                            className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white font-mono"
                          >
                            {[20, 21, 22, 23, 0].map((h) => (
                              <option key={h} value={h}>
                                {h.toString().padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono">Kết thúc lúc:</span>
                          <select
                            value={config.nightShiftEndHour}
                            onChange={(e) =>
                              handleSaveConfig({
                                ...config,
                                nightShiftEndHour: parseInt(e.target.value, 10),
                              })
                            }
                            className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white font-mono"
                          >
                            {[5, 6, 7, 8].map((h) => (
                              <option key={h} value={h}>
                                {h.toString().padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <p className="text-[10px] text-cyan-400 mt-2 font-mono">
                        ⏰ Khung giờ hiện tại: {config.nightShiftStartHour}:00 đến {config.nightShiftEndHour}:00 hàng ngày.
                      </p>
                    </div>

                    {/* Night Shift Severity Target */}
                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-2">
                        Ngưỡng cảnh báo bắt buộc trong ca đêm:
                      </label>
                      <div className="space-y-2">
                        {[
                          {
                            id: 'CRITICAL_ONLY' as PushNotificationSeverityFilter,
                            title: '🚨 Chỉ Cảnh Báo Critical (Khuyên dùng cho ca đêm)',
                            desc: 'Chặn hoàn toàn thông báo High và Medium. Chỉ đẩy khi dừng máy hoặc sự cố hỏng hóc nghiêm trọng.',
                          },
                          {
                            id: 'HIGH_AND_CRITICAL' as PushNotificationSeverityFilter,
                            title: '⚠️ Cả High & Critical',
                            desc: 'Cho phép sự cố cấp bách và cảnh báo rủi ro cao.',
                          },
                        ].map((opt) => (
                          <label
                            key={opt.id}
                            onClick={() =>
                              handleSaveConfig({
                                ...config,
                                nightShiftSeverityFilter: opt.id,
                              })
                            }
                            className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition ${
                              config.nightShiftSeverityFilter === opt.id
                                ? 'border-cyan-500 bg-cyan-950/30 text-white'
                                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="night_severity"
                              checked={config.nightShiftSeverityFilter === opt.id}
                              onChange={() => {}}
                              className="mt-0.5 text-cyan-600 focus:ring-cyan-500"
                            />
                            <div>
                              <span className="font-bold text-xs">{opt.title}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                                {opt.desc}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-5 text-center text-xs text-slate-400">
                    <Moon className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <span>Chế độ ca đêm đang tắt. Hệ thống sẽ luôn dùng ngưỡng cảnh báo tiêu chuẩn bất kể thời gian trong ngày.</span>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 3: CẤU HÌNH CÒI BÁO ĐỘNG & RUNG */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Âm Thanh & Rung Phản Hồi</h4>
                  <p className="text-[11px] text-slate-400">Cấu hình chuông báo và phản hồi rung trên thiết bị di động</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Sound toggle */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-indigo-400">
                      {config.soundAlarmEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-white">Âm Thanh Báo Động (Sound Alarm)</span>
                      <p className="text-[10px] text-slate-400">Phát âm thanh còi công nghiệp khi nhận được push notification</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.soundAlarmEnabled}
                      onChange={(e) => handleSaveConfig({ ...config, soundAlarmEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Vibration toggle */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-purple-400">
                      <Vibrate className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-white">Rung Điện Thoại (Haptic Vibration)</span>
                      <p className="text-[10px] text-slate-400">Rung thiết bị cầm tay theo nhịp khẩn cấp khi có thông báo</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.vibrationEnabled}
                      onChange={(e) => handleSaveConfig({ ...config, vibrationEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Mute idle alarms toggle */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-amber-400">
                      <VolumeX className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-white">Tắt Chuông Cho Máy Đang Chờ (Mute Idle Alarms)</span>
                      <p className="text-[10px] text-slate-400">Không rung chuông khi máy dừng theo kế hoạch hoặc chờ phôi</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.muteIdleAlarms}
                      onChange={(e) => handleSaveConfig({ ...config, muteIdleAlarms: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* CARD 4: MÔ PHỎNG HIỆU QUẢ GIẢM NHIỄU & ĐẶT LẠI */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Hiệu Quả Giảm Nhiễu Ca Trực</h4>
                    <p className="text-[11px] text-slate-400">Đánh giá tác động của bộ lọc đối với chất lượng ca trực KTV</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Tỷ lệ giảm thông báo rác:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {config.nightShiftMode && config.nightShiftSeverityFilter === 'CRITICAL_ONLY'
                        ? '~75% - 85%'
                        : config.severityFilter === 'CRITICAL_ONLY'
                        ? '~80%'
                        : config.severityFilter === 'HIGH_AND_CRITICAL'
                        ? '~45%'
                        : '0% (Nhận đủ)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Độ trễ phản hồi sự cố khẩn cấp:</span>
                    <span className="font-mono font-bold text-indigo-400">&lt; 3.2 giây</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Trạng thái đường truyền:</span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>FCM Gateway Sẵn Sàng</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Info className="h-4 w-4 text-cyan-400 shrink-0" />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Mọi thay đổi cấu hình sẽ được lưu vào thiết bị và đồng bộ tự động ngay lập tức với Gateway thông báo đẩy.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Khôi phục mặc định</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('console')}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition"
                >
                  <span>Thử nghiệm bắn Push</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

