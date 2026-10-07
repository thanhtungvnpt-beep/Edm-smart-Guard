import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Copy,
  MessageSquare,
  Mic,
  MicOff,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
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

// Preset real-world symptoms commonly observed during EDM breakdown
const PRESET_VOICE_SYMPTOMS = [
  'Có tiếng rít cơ khí ở cụm dẫn hướng trục Z khi hạ xuống',
  'Áp suất dầu xả yếu và xuất hiện nhiều bọt khí li ti',
  'Dây cắt bị chùng và đứt liên tục khi cắt góc bán kính R < 0.2mm',
  'Mùi khét nhẹ ở biến áp xung phía sau tủ điện khi tải cao',
  'Đầu gá System 3R bị kẹt phoi thép không tự động rút điện cực về',
];

export const AIDiagnosisModal: React.FC<AIDiagnosisModalProps> = ({
  device,
  onClose,
  onOpenRepairReport,
}) => {
  if (!device) return null;

  const [diagnosis, setDiagnosis] = useState<AIDiagnosis | null>(
    device.activeIncident?.aiDiagnosis || null
  );
  const [loading, setLoading] = useState(false);
  const [matchedDocs, setMatchedDocs] = useState<any[]>([]);
  const [matchedLearnings, setMatchedLearnings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'chat'>('diagnosis');

  // Voice-to-Text States
  const [voiceSymptoms, setVoiceSymptoms] = useState<string>('');
  const [appliedVoiceSymptoms, setAppliedVoiceSymptoms] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isChatListening, setIsChatListening] = useState<boolean>(false);
  const [speechLang, setSpeechLang] = useState<'vi-VN' | 'en-US'>('vi-VN');
  const [recordTimer, setRecordTimer] = useState<number>(0);
  const [micStatusMsg, setMicStatusMsg] = useState<string>('');
  const [ttsReading, setTtsReading] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const chatRecognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Chat Copilot State
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'ai'; text: string; time: string }[]
  >([
    {
      role: 'ai',
      text: `Xin chào! Tôi là Trợ lý AI Kỹ thuật viên EDM. Tôi đã đọc sơ đồ máy ${device.model} và dữ liệu sự cố. Anh có thể bật Micro nói rảnh tay hoặc hỏi thêm bất kỳ bước thao tác nào tại hiện trường.`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Play audio chirp when mic activates or deactivates
  const playMicChime = (start: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      if (start) {
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.2);
      } else {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch {
      // Ignore audio sandbox restrictions
    }
  };

  // Timer while recording
  useEffect(() => {
    if (isListening || isChatListening) {
      setRecordTimer(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordTimer((t) => t + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isListening, isChatListening]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
      if (chatRecognitionRef.current) {
        try {
          chatRecognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Fetch AI Diagnosis (with optional voice symptoms incorporated)
  const fetchDiagnosis = async (overrideSymptoms?: string) => {
    setLoading(true);
    const symptomsToSend =
      overrideSymptoms !== undefined ? overrideSymptoms : voiceSymptoms;

    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device.id,
          incidentId: device.activeIncident?.incidentId,
          voiceSymptoms: symptomsToSend.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDiagnosis(data.data);
        setMatchedDocs(data.sourceDocs || []);
        setMatchedLearnings(data.sourceLearnings || []);
        if (symptomsToSend.trim()) {
          setAppliedVoiceSymptoms(symptomsToSend.trim());
        }
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

  // --- VOICE-TO-TEXT: SYMPTOMS RECORDER ---
  const startVoiceRecognition = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      // Simulate voice input if browser does not support SpeechRecognition
      simulateVoiceInput();
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = speechLang;

      rec.onstart = () => {
        setIsListening(true);
        playMicChime(true);
        setMicStatusMsg(`Đang lắng nghe mô tả triệu chứng (${speechLang})... Hãy nói rõ ràng.`);
      };

      rec.onresult = (event: any) => {
        let finalTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTrans) {
          setVoiceSymptoms((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalTrans.trim()}` : finalTrans.trim();
          });
        }
      };

      rec.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicStatusMsg('Không có quyền truy cập Micro. Đang chuyển sang chế độ mô phỏng giọng nói.');
          simulateVoiceInput();
        } else {
          setMicStatusMsg(`Lỗi nhận diện âm thanh (${event.error}). Vui lòng nói lại.`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        playMicChime(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('Failed to start SpeechRecognition:', err);
      simulateVoiceInput();
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
    playMicChime(false);
    setMicStatusMsg('Đã dừng ghi âm. Bấm "AI Tái Chẩn Đoán" để tích hợp triệu chứng.');
  };

  // Simulated voice recognition fallback (when mic not available or for demo testing)
  const simulateVoiceInput = (presetText?: string) => {
    setIsListening(true);
    playMicChime(true);
    const chosen =
      presetText ||
      PRESET_VOICE_SYMPTOMS[Math.floor(Math.random() * PRESET_VOICE_SYMPTOMS.length)];
    setMicStatusMsg('Đang mô phỏng nhận diện giọng nói rảnh tay tại xưởng...');

    let current = '';
    const words = chosen.split(' ');
    let idx = 0;

    const interval = setInterval(() => {
      if (idx < words.length) {
        current = current ? `${current} ${words[idx]}` : words[idx];
        setVoiceSymptoms((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${words[idx]}` : words[idx];
        });
        idx++;
      } else {
        clearInterval(interval);
        setIsListening(false);
        playMicChime(false);
        setMicStatusMsg('Đã nhận diện xong triệu chứng qua giọng nói! Bấm "Tái Chẩn Đoán AI" để áp dụng.');
      }
    }, 240);
  };

  // --- VOICE-TO-TEXT: CHAT INPUT BAR ---
  const toggleChatMic = () => {
    if (isChatListening) {
      if (chatRecognitionRef.current) {
        try {
          chatRecognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsChatListening(false);
      playMicChime(false);
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      // Simulate chat question via voice
      setIsChatListening(true);
      playMicChime(true);
      const sampleQuestion = 'Hướng dẫn tôi cách xả e bọt khí và căn chỉnh áp suất bơm Rexroth 1.4 Bar.';
      let current = '';
      const words = sampleQuestion.split(' ');
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < words.length) {
          current = current ? `${current} ${words[idx]}` : words[idx];
          setInputMsg(current);
          idx++;
        } else {
          clearInterval(interval);
          setIsChatListening(false);
          playMicChime(false);
        }
      }, 200);
      return;
    }

    try {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = speechLang;

      rec.onstart = () => {
        setIsChatListening(true);
        playMicChime(true);
      };

      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputMsg(transcript);
        }
      };

      rec.onerror = () => {
        setIsChatListening(false);
      };

      rec.onend = () => {
        setIsChatListening(false);
        playMicChime(false);
      };

      chatRecognitionRef.current = rec;
      rec.start();
    } catch {
      setIsChatListening(false);
    }
  };

  // Text-To-Speech (TTS) Readout for step-by-step repair guide
  const toggleTtsReadout = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (ttsReading) {
      window.speechSynthesis.cancel();
      setTtsReading(false);
      return;
    }

    if (!diagnosis || !diagnosis.stepByStepGuide || diagnosis.stepByStepGuide.length === 0) return;

    const fullText = `Quy trình khắc phục sự cố máy ${device.name}. Nguyên nhân chính: ${
      diagnosis.rootCause
    }. ${diagnosis.stepByStepGuide.join('. ')}`;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = speechLang;
    utterance.rate = 0.95;

    utterance.onend = () => setTtsReading(false);
    utterance.onerror = () => setTtsReading(false);

    setTtsReading(true);
    window.speechSynthesis.speak(utterance);
  };

  // Handle Send Chat
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

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col h-[92vh] max-h-[850px] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl">
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
                <span className="hidden sm:inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                  <Mic className="h-3 w-3" />
                  Voice-to-Text Sẵn Sàng
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thiết bị:{' '}
                <strong className="text-slate-200">
                  {device.code} - {device.name}
                </strong>{' '}
                ({device.model})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDiagnosis()}
              disabled={loading}
              title="Phân tích lại sự cố với dữ liệu mới nhất"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-300 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`}
              />
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
              Live Voice
            </span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'diagnosis' ? (
            <>
              {/* HANDS-FREE VOICE-TO-TEXT SYMPTOMS INPUT CARD */}
              <div
                className={`rounded-2xl border transition-all duration-300 p-4.5 sm:p-5 ${
                  isListening
                    ? 'border-red-500/80 bg-red-950/20 shadow-xl shadow-red-950/40 ring-2 ring-red-500/40'
                    : 'border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-slate-900 shadow-lg'
                }`}
              >
                {/* Voice Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`relative flex h-9 w-9 items-center justify-center rounded-xl text-white transition ${
                        isListening
                          ? 'bg-red-600 animate-pulse'
                          : 'bg-purple-600 shadow-md shadow-purple-600/30'
                      }`}
                    >
                      {isListening ? (
                        <Radio className="h-5 w-5 animate-spin" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                      {isListening && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white">
                          Nhập Triệu Chứng Sự Cố Bằng Giọng Nói (Hands-Free)
                        </h3>
                        <span className="rounded bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-300">
                          Rảnh Tay Thao Tác
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Nói trực tiếp để mô tả âm thanh lạ, mùi, áp lực dầu hoặc hiện tượng phôi khi đang bận tay sửa máy
                      </p>
                    </div>
                  </div>

                  {/* Recording Status & Language Toggle */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isListening && (
                      <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/40 px-2.5 py-1 text-xs font-mono font-bold text-red-300 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-red-500"></span>
                        <span>ĐANG NGHE: {formatTimer(recordTimer)}</span>
                      </span>
                    )}

                    <select
                      value={speechLang}
                      onChange={(e) => setSpeechLang(e.target.value as any)}
                      className="rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      title="Chọn ngôn ngữ nhận diện giọng nói"
                    >
                      <option value="vi-VN">🇻🇳 Tiếng Việt</option>
                      <option value="en-US">🇺🇸 English</option>
                    </select>
                  </div>
                </div>

                {/* Animated Audio Visualizer Bar when listening */}
                {isListening && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 py-1 px-4 bg-slate-950/60 rounded-xl border border-red-500/30">
                    <span className="text-[11px] font-mono text-red-400 font-bold mr-2">
                      Microphone Active:
                    </span>
                    {[24, 40, 16, 56, 32, 48, 64, 20, 36, 52, 28, 44, 60, 24].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-gradient-to-t from-red-500 to-amber-400 animate-pulse"
                        style={{
                          height: `${Math.max(8, (h * ((recordTimer % 4) + 1)) / 3)}px`,
                          animationDelay: `${i * 70}ms`,
                          animationDuration: '600ms',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Transcribed Text Display & Textarea */}
                <div className="mt-3 relative">
                  <textarea
                    rows={2}
                    value={voiceSymptoms}
                    onChange={(e) => setVoiceSymptoms(e.target.value)}
                    placeholder="Bấm nút Micro bên dưới và nói để mô tả triệu chứng máy: ví dụ tiếng rít lạ ở trục Z, áp suất dầu sụt giảm, tia nước xả bị lệch, mùi khét biến áp..."
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-800 p-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans leading-relaxed resize-none"
                  />

                  {voiceSymptoms && (
                    <button
                      onClick={() => setVoiceSymptoms('')}
                      className="absolute right-2.5 top-2.5 rounded-lg p-1 text-slate-400 hover:text-red-400 transition"
                      title="Xóa nội dung mô tả"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {micStatusMsg && (
                  <p className="mt-1.5 text-[11px] text-amber-300 flex items-center gap-1 italic">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    <span>{micStatusMsg}</span>
                  </p>
                )}

                {/* Voice Control Buttons Strip */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Primary Large Microphone Toggle Button */}
                    <button
                      onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-md active:scale-95 ${
                        isListening
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-4 w-4" />
                          <span>Dừng Thu Âm ({formatTimer(recordTimer)})</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          <span>Bật Micro Nói Rảnh Tay</span>
                        </>
                      )}
                    </button>

                    {/* AI Re-Diagnose Button with Voice Input */}
                    <button
                      onClick={() => fetchDiagnosis(voiceSymptoms)}
                      disabled={loading || !voiceSymptoms.trim()}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition active:scale-95"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>AI Tái Chẩn Đoán Theo Giọng Nói</span>
                    </button>
                  </div>

                  {/* Applied Voice Badge */}
                  {appliedVoiceSymptoms && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] text-emerald-300 font-mono">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate max-w-[240px]">
                        Đã nạp: "{appliedVoiceSymptoms}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Hands-Free Symptom Presets (One-tap for testing or quick injection) */}
                <div className="mt-3 pt-2.5 border-t border-purple-500/20">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1.5 font-mono">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>Mẫu triệu chứng thực chiến phổ biến (Bấm để thử nghiệm):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_VOICE_SYMPTOMS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => simulateVoiceInput(preset)}
                        className="rounded-lg bg-slate-900/90 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/40 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1"
                      >
                        <Volume2 className="h-3 w-3 text-purple-400 shrink-0" />
                        <span className="truncate max-w-[260px]">{preset}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-400 mb-4">
                    <Sparkles className="h-8 w-8 animate-spin" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-500"></span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Gemini AI đang phân tích dữ liệu EDM & triệu chứng giọng nói...
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-md bg-purple-600 px-2 py-0.5 text-xs font-bold text-white font-mono">
                          CHẨN ĐOÁN NGUYÊN NHÂN GỐC RỄ
                        </span>
                        {appliedVoiceSymptoms && (
                          <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1">
                            <Mic className="h-3 w-3" />
                            Đã Tích Hợp Giọng Nói
                          </span>
                        )}
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
                          <span className="font-mono font-bold text-emerald-400">
                            {diagnosis.confidenceScore}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-lg font-bold text-white leading-snug">
                        {diagnosis.rootCause}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                        💡 <strong>Cơ chế hỏng hóc (Failure Mechanism):</strong>{' '}
                        {diagnosis.failureMechanism}
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
                        <span>
                          Tham khảo {diagnosis.matchedLearningsCount} kinh nghiệm thực chiến từ KTV
                        </span>
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

                  {/* STEP-BY-STEP REPAIR SOP WITH HANDS-FREE TTS READOUT */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <Wrench className="h-4 w-4 text-emerald-400" />
                        <span>CÁC BƯỚC KHẮC PHỤC SỰ CỐ NHANH CHÓNG (STEP-BY-STEP):</span>
                      </div>

                      {/* Text-to-Speech Hands-Free Readout Button */}
                      <button
                        onClick={toggleTtsReadout}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                          ttsReading
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                        title="Đọc to quy trình các bước sửa chữa rảnh tay"
                      >
                        {ttsReading ? (
                          <>
                            <VolumeX className="h-3.5 w-3.5 text-amber-400" />
                            <span>Dừng Đọc To</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3.5 w-3.5 text-purple-400" />
                            <span>Đọc To Hướng Dẫn (Hands-Free Audio)</span>
                          </>
                        )}
                      </button>
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
              ) : null}
            </>
          ) : (
            /* COPILOT CHAT VIEW WITH INTEGRATED HANDS-FREE VOICE INPUT */
            <div className="flex flex-col h-full space-y-4">
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
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

              {/* Chat Input Bar with Voice-to-Text Button */}
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 pt-2 border-t border-slate-800"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    placeholder={
                      isChatListening
                        ? '🔴 Đang lắng nghe câu hỏi qua giọng nói...'
                        : 'Hỏi AI hoặc nhấn micro để nói rảnh tay...'
                    }
                    className={`w-full rounded-xl bg-slate-900 border px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isChatListening
                        ? 'border-red-500/60 ring-2 ring-red-500/30'
                        : 'border-slate-700'
                    }`}
                  />
                  {isChatListening && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
                    </span>
                  )}
                </div>

                {/* Microphone Toggle for Chat */}
                <button
                  type="button"
                  onClick={toggleChatMic}
                  className={`p-2.5 rounded-xl border transition shadow-sm ${
                    isChatListening
                      ? 'bg-red-600 border-red-500 text-white animate-pulse'
                      : 'bg-slate-800 border-slate-700 text-purple-400 hover:text-white hover:bg-purple-600'
                  }`}
                  title={
                    isChatListening
                      ? 'Dừng thu âm giọng nói'
                      : 'Bật nhận diện giọng nói rảnh tay (Voice-to-Text)'
                  }
                >
                  {isChatListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>

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

