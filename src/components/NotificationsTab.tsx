import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Phone,
  Radio,
  Send,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { NotificationLog, Technician } from '../types';
import { soundManager } from '../utils/audio';

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
  const [selectedTechId, setSelectedTechId] = useState<string>(technicians[0]?.id || '');
  const [customMsg, setCustomMsg] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendTestPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const res = await fetch('/api/notifications/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: selectedTechId,
          customMessage: customMsg.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        soundManager.playPushSound();
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
      {/* Test Push Sender Console */}
      <div className="rounded-3xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
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

        <form onSubmit={handleSendTestPush} className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-64 shrink-0">
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.phone})
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            placeholder="Nội dung thông báo (để trống sẽ dùng tin nhắn mẫu EDM cảnh báo)..."
            className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={sending}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 active:scale-95 shrink-0"
          >
            <Send className="h-4 w-4" />
            <span>{sending ? 'Đang gửi...' : 'Bắn Push Ngay'}</span>
          </button>
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
    </div>
  );
};
