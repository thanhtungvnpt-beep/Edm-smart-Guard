import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { AIDiagnosis, Device } from '../types';

interface AIDiagnosisModalProps {
  device: Device | null;
  onClose: () => void;
  onOpenRepairReport: (device: Device) => void;
}

export const AIDiagnosisModal: React.FC<AIDiagnosisModalProps> = ({
  device,
  onClose,
  onOpenRepairReport,
}) => {
  if (!device) return null;

  const [diagnosis, setDiagnosis] = useState<AIDiagnosis | null>(device.activeIncident?.aiDiagnosis || null);
  const [loading, setLoading] = useState(false);
  const [matchedDocs, setMatchedDocs] = useState<any[]>([]);
  const [matchedLearnings, setMatchedLearnings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'chat'>('diagnosis');

  // Chat Copilot State
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string; time: string }[]>([
    {
      role: 'ai',
      text: `Xin chào! Tôi là Trợ lý AI Kỹ thuật viên EDM. Tôi đã đọc sơ đồ máy ${device.model} và dữ liệu sự cố. Anh có thể hỏi thêm bất kỳ bước thao tác nào tại hiện trường.`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchDiagnosis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device.id,
          incidentId: device.activeIncident?.incidentId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDiagnosis(data.data);
        setMatchedDocs(data.sourceDocs || []);
        setMatchedLearnings(data.sourceLearnings || []);
      }
    } catch (e) {
      console.error('Diagnosis failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!diagnosis) {
      fetchDiagnosis();
    }
  }, [device.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || sendingMsg) return;

    const userText = inputMsg.trim();
    setInputMsg('');
    const userMsgObj = {
      role: 'user' as const,
      text: userText,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsgObj]);
    setSendingMsg(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          deviceId: device.id,
          incidentContext: device.activeIncident,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: data.reply,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'Lỗi kết nối tới máy chủ AI. Vui lòng kiểm tra lại.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col h-[90vh] max-h-[820px] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  AI Trợ Lý Phân Tích & Đề Xuất Sửa Chữa Nhanh
                </h2>
                <span className="rounded bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-purple-300">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thiết bị: <strong className="text-slate-200">{device.code} - {device.name}</strong> ({device.model})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDiagnosis}
              disabled={loading}
              title="Phân tích lại sự cố với dữ liệu mới nhất"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-300 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              <span className="hidden sm:inline">Chẩn Đoán Lại</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab switchers: Diagnosis SOP vs Field Copilot Chat */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 transition ${
              activeTab === 'diagnosis'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Kết Quả Chẩn Đoán & Quy Trình Khắc Phục</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 transition ${
              activeTab === 'chat'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat Trực Tuyến Với AI Hiện Trường</span>
            <span className="rounded-full bg-purple-500/20 px-1.5 text-[10px] text-purple-300 font-mono">
              Live
            </span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'diagnosis' ? (
            loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-400 mb-4">
                  <Sparkles className="h-8 w-8 animate-spin" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-500"></span>
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Gemini AI đang phân tích dữ liệu EDM & tài liệu kỹ thuật...
                </h3>
                <p className="text-xs text-slate-400 max-w-md mt-1.5">
                  Đang đối chiếu thông số cảm biến thời điểm dừng máy với các bài học sửa chữa trước đây và sổ tay vận hành nhà máy.
                </p>
              </div>
            ) : diagnosis ? (
              <>
                {/* ROOT CAUSE SUMMARY CARD */}
                <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 p-5 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-purple-600 px-2 py-0.5 text-xs font-bold text-white font-mono">
                        CHẨN ĐOÁN NGUYÊN NHÂN GỐC RỄ
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {new Date(diagnosis.generatedAt).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">Độ tin cậy AI:</span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full"
                            style={{ width: `${diagnosis.confidenceScore}%` }}
                          ></div>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">{diagnosis.confidenceScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-white leading-snug">
                      {diagnosis.rootCause}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                      💡 <strong>Cơ chế hỏng hóc (Failure Mechanism):</strong> {diagnosis.failureMechanism}
                    </p>
                  </div>

                  {/* MTTR & Source Reference Badges */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-mono">
                    <div className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 text-cyan-300">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Ước tính MTTR: {diagnosis.estimatedMttrMinutes} phút</span>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 text-purple-300">
                      <Brain className="h-3.5 w-3.5" />
                      <span>Tham khảo {diagnosis.matchedLearningsCount} kinh nghiệm thực chiến từ KTV</span>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 text-blue-300">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{diagnosis.matchedDocsCount} tài liệu SOP/OEM</span>
                    </div>
                  </div>
                </div>

                {/* SAFETY PROTOCOLS (MANDATORY) */}
                <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <ShieldAlert className="h-4 w-4" />
                    <span>QUY TRÌNH AN TOÀN BẮT BUỘC TRƯỚC KHI THAO TÁC</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-amber-200">
                    {diagnosis.safetyWarnings.map((warn, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{warn}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* STEP-BY-STEP REPAIR SOP */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                    <Wrench className="h-4 w-4 text-emerald-400" />
                    <span>CÁC BƯỚC KHẮC PHỤC SỰ CỐ NHANH CHÓNG (STEP-BY-STEP):</span>
                  </div>
                  <div className="space-y-3">
                    {diagnosis.stepByStepGuide.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-xl bg-slate-950/70 border border-slate-800/80 p-3 hover:border-purple-500/40 transition"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-purple-600/20 text-purple-300 font-mono text-xs font-bold border border-purple-500/30">
                          {idx + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* REQUIRED TOOLS & SPARE PARTS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tools */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-slate-300 tracking-wider mb-2.5">
                      <Wrench className="h-4 w-4 text-amber-400" />
                      <span>Dụng Cụ Cần Chuẩn Bị</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {diagnosis.requiredTools.map((t, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-200 border border-slate-700"
                        >
                          🔧 {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Spare Parts */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-slate-300 tracking-wider mb-2.5">
                      <Zap className="h-4 w-4 text-cyan-400" />
                      <span>Vật Tư / Phụ Tùng Dự Phòng</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {diagnosis.recommendedParts.map((p, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-cyan-950/50 border border-cyan-500/30 px-2.5 py-1 text-xs text-cyan-200"
                        >
                          📦 {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : null
          ) : (
            /* COPILOT CHAT VIEW */
            <div className="flex flex-col h-full space-y-4">
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-slate-900 border border-slate-800 text-slate-200'
                      }`}
                    >
                      {msg.role === 'ai' && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1 font-mono">
                          <Sparkles className="h-3 w-3" />
                          <span>EDM AI COPILOT</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <span className="mt-1 text-[10px] font-mono text-slate-400 px-1">
                      {msg.time}
                    </span>
                  </div>
                ))}
                {sendingMsg && (
                  <div className="flex items-center gap-2 text-xs text-purple-400 italic py-2">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                    <span>AI đang phân tích câu hỏi của bạn...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Hỏi AI thêm về cách kiểm tra van, đo thông số, rắc cắm..."
                  className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim() || sendingMsg}
                  className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-white font-medium text-xs transition disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Gửi</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-6 py-3.5">
          <p className="text-xs text-slate-400 hidden sm:block">
            Sau khi khắc phục xong, hãy nhấn "Nghiệm Thu & Dạy AI" để lưu kinh nghiệm thực tế.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
            >
              Đóng
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenRepairReport(device);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Đã Sửa Xong • Nghiệm Thu & Dạy AI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
