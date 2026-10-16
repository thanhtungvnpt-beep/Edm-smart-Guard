import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  History,
  Layers,
  MessageSquare,
  Mic,
  MicOff,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Users,
  PackageCheck,
  Hourglass,
  Package,
  ShoppingCart,
  ArrowDownRight,
  AlertOctagon,
  MapPin,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { AIDiagnosis, Device, RepairEtaAnalysis, SparePart } from '../types';
import { getDeviceMaintenanceHistory } from '../utils/maintenanceHistoryData';
import {
  get30DayErrorCodeFrequency,
  COMMON_EDM_ERROR_CODES,
  ErrorCodeDayBucket,
} from '../utils/errorCodeFrequency';
import { estimateRepairEtaWithAI, EtaEstimationOptions } from '../utils/repairEtaEstimator';
import {
  getStoredSpareParts,
  matchRecommendedPartToInventory,
  createQuickPurchaseOrder,
  issueSparePart,
} from '../utils/sparePartsStorage';

import { IncidentGroupChat } from './IncidentGroupChat';

interface AIDiagnosisModalProps {
  device: Device | null;
  onClose: () => void;
  onOpenRepairReport: (device: Device) => void;
  onOpenRCA?: (deviceId?: string, errorCode?: string) => void;
  onOpenInventory?: (partIdOrSku?: string) => void;
  technicians?: Technician[];
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
  onOpenRCA,
  onOpenInventory,
  technicians,
}) => {
  if (!device) return null;

  const [diagnosis, setDiagnosis] = useState<AIDiagnosis | null>(
    device.activeIncident?.aiDiagnosis || null
  );
  const [loading, setLoading] = useState(false);
  const [matchedDocs, setMatchedDocs] = useState<any[]>([]);
  const [matchedLearnings, setMatchedLearnings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'group_chat' | 'chat'>('diagnosis');

  // Smart History-Based Diagnosis States
  const [useHistoryDiagnostic, setUseHistoryDiagnostic] = useState<boolean>(true);
  const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(true);
  const maintenanceHistory = useMemo(() => getDeviceMaintenanceHistory(device.id), [device.id]);

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

  // 30-Day Error Code Frequency & Deeper Root Cause Analysis (RCA) States
  const [selectedErrorCode, setSelectedErrorCode] = useState<string>(
    device.activeIncident?.errorCode || 'E-102'
  );
  const [showRcaGuidance, setShowRcaGuidance] = useState<boolean>(true);
  const [rcaCopySuccess, setRcaCopySuccess] = useState<boolean>(false);

  // AI Repair ETA & Historical Benchmark States
  const [etaAssistantsCount, setEtaAssistantsCount] = useState<number>(1);
  const [etaHasSpareParts, setEtaHasSpareParts] = useState<boolean>(true);
  const [showEtaCustomizer, setShowEtaCustomizer] = useState<boolean>(false);
  const [etaCopySuccess, setEtaCopySuccess] = useState<boolean>(false);

  // Live Repair Stopwatch Tracker
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const stopwatchIntervalRef = useRef<any>(null);

  // Spare Parts Inventory State & Real-time Shortage Alerts
  const [sparePartsList, setSparePartsList] = useState<SparePart[]>(() => getStoredSpareParts());
  const [inventoryActionNotice, setInventoryActionNotice] = useState<string | null>(null);

  // Sync inventory when modal is opened
  useEffect(() => {
    setSparePartsList(getStoredSpareParts());
  }, []);

  // Map each recommended part to inventory item & stock status
  const inventoryMatches = useMemo(() => {
    if (!diagnosis || !diagnosis.recommendedParts || diagnosis.recommendedParts.length === 0) {
      return [];
    }
    return diagnosis.recommendedParts.map((partStr) => {
      const match = matchRecommendedPartToInventory(partStr, sparePartsList);
      return {
        originalStr: partStr,
        ...match,
      };
    });
  }, [diagnosis, sparePartsList]);

  const outOfStockParts = useMemo(() => {
    return inventoryMatches.filter((m) => m.stockStatus === 'OUT_OF_STOCK');
  }, [inventoryMatches]);

  const lowStockParts = useMemo(() => {
    return inventoryMatches.filter((m) => m.stockStatus === 'LOW_STOCK');
  }, [inventoryMatches]);

  const inStockParts = useMemo(() => {
    return inventoryMatches.filter((m) => m.stockStatus === 'IN_STOCK');
  }, [inventoryMatches]);

  // Bulk order missing parts
  const handleOrderAllMissingParts = () => {
    if (outOfStockParts.length === 0) return;
    let count = 0;
    outOfStockParts.forEach((m) => {
      if (m.part) {
        createQuickPurchaseOrder(
          m.part.id,
          m.part.minSafetyStock * 2 || 4,
          'Kỹ thuật viên ca trực',
          device.code,
          `Đặt khẩn cấp từ AI Diagnosis cho máy ${device.code} (${device.name})`
        );
        count++;
      }
    });
    setSparePartsList(getStoredSpareParts());
    setInventoryActionNotice(`✓ Đã tạo đơn đặt hàng khẩn cấp (PO) cho ${count} linh kiện thiếu hụt!`);
    setTimeout(() => setInventoryActionNotice(null), 5000);
  };

  // Quick issue part (-1) for this machine
  const handleQuickIssuePart = (part: SparePart) => {
    const res = issueSparePart(
      part.id,
      1,
      'Kỹ thuật viên sửa chữa',
      device.code,
      `Xuất cho sự cố ${device.activeIncident?.errorCode || 'EDM'} trên máy ${device.code}`
    );
    if (res.success) {
      setSparePartsList(getStoredSpareParts());
      setInventoryActionNotice(`✓ ${res.message}`);
      setTimeout(() => setInventoryActionNotice(null), 4000);
    } else {
      setInventoryActionNotice(`❌ ${res.message}`);
      setTimeout(() => setInventoryActionNotice(null), 4000);
    }
  };

  // Quick single part PO order
  const handleQuickOrderSinglePart = (part: SparePart) => {
    const res = createQuickPurchaseOrder(
      part.id,
      part.minSafetyStock * 2 || 3,
      'Kỹ thuật viên ca trực',
      device.code,
      `Yêu cầu đặt khẩn cấp từ AI Diagnosis cho máy ${device.code}`
    );
    if (res.success) {
      setSparePartsList(getStoredSpareParts());
      setInventoryActionNotice(`✓ ${res.message}`);
      setTimeout(() => setInventoryActionNotice(null), 5000);
    }
  };

  // Computed AI Repair ETA Analysis
  const repairEtaAnalysis: RepairEtaAnalysis = useMemo(() => {
    if (
      diagnosis?.repairEtaAnalysis &&
      etaAssistantsCount === 1 &&
      etaHasSpareParts &&
      selectedErrorCode === (device.activeIncident?.errorCode || 'E-102')
    ) {
      return diagnosis.repairEtaAnalysis;
    }

    return estimateRepairEtaWithAI(device, selectedErrorCode, {
      technicianName: device.assignedTechnician?.name,
      assistantsCount: etaAssistantsCount,
      hasSparePartsReady: etaHasSpareParts,
      voiceSymptoms: appliedVoiceSymptoms || voiceSymptoms,
    });
  }, [
    diagnosis?.repairEtaAnalysis,
    device,
    selectedErrorCode,
    etaAssistantsCount,
    etaHasSpareParts,
    appliedVoiceSymptoms,
    voiceSymptoms,
  ]);

  // Live Stopwatch Effect
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    }
    return () => {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    };
  }, [isStopwatchRunning]);

  const handleResetStopwatch = () => {
    setIsStopwatchRunning(false);
    setStopwatchSeconds(0);
  };

  const handleCopyEtaReport = () => {
    const text = `=== BÁO CÁO DỰ BÁO THỜI GIAN SỬA CHỮA (AI REPAIR ETA) ===
Thiết bị: ${device.code} - ${device.name} (${device.model})
Mã sự cố: [${selectedErrorCode}]
Thời gian ước tính hoàn tất (ETA): ~${repairEtaAnalysis.estimatedMinutes} phút
Dự kiến bàn giao máy: ${repairEtaAnalysis.estimatedCompletionTime}
Độ phức tạp kỹ thuật: ${repairEtaAnalysis.complexityLevel}
Độ tin cậy AI: ${repairEtaAnalysis.confidenceScore}% (${repairEtaAnalysis.confidenceLevel})

ĐỐI CHIẾU LỊCH SỬ XƯỞNG:
- Số ca sửa tương tự: ${repairEtaAnalysis.historicalBenchmark.sampleCount} lần
- Thời gian trung bình quá khứ: ${repairEtaAnalysis.historicalBenchmark.averageMinutes} phút
- Nhanh nhất từng đạt: ${repairEtaAnalysis.historicalBenchmark.minMinutes} phút (${repairEtaAnalysis.historicalBenchmark.fastestTechnician || 'KTV'})
- Lâu nhất từng ghi nhận: ${repairEtaAnalysis.historicalBenchmark.maxMinutes} phút
- Linh kiện thường thay: ${repairEtaAnalysis.historicalBenchmark.mostFrequentPartsReplaced.join(', ')}

PHÂN BỔ THỜI GIAN THEO GIAI ĐOẠN:
${repairEtaAnalysis.stagedBreakdown.map((s) => `- ${s.stageName}: ~${s.durationMinutes} phút\n  Thao tác: ${s.description}`).join('\n')}

LƯU Ý RỦI RO & MẸO RÚT NGẮN TIẾN ĐỘ:
${repairEtaAnalysis.aiAccelerationTips.map((tip) => `⚡ ${tip}`).join('\n')}
${repairEtaAnalysis.riskDelayFactors.map((r) => `⚠️ ${r}`).join('\n')}
Thời gian khởi tạo: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}
`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setEtaCopySuccess(true);
      setTimeout(() => setEtaCopySuccess(false), 2500);
    }
  };

  // Keep selected error code synchronized if device active incident changes
  useEffect(() => {
    if (device.activeIncident?.errorCode) {
      setSelectedErrorCode(device.activeIncident.errorCode);
    }
  }, [device.activeIncident?.errorCode, device.id]);

  // Compute 30-day frequency and deep root cause analysis data
  const frequencySummary = useMemo(() => {
    return get30DayErrorCodeFrequency(
      device.id,
      selectedErrorCode,
      device.activeIncident?.errorCode
    );
  }, [device.id, selectedErrorCode, device.activeIncident?.errorCode]);

  // Handler to copy 30-day RCA summary to clipboard
  const handleCopyRcaSummary = () => {
    const text = `=== BÁO CÁO TẦN SUẤT MÃ LỖI 30 NGÀY & ĐÁNH GIÁ RCA ===
Thiết bị: ${device.code} - ${device.name} (${device.model})
Mã lỗi đang chọn: [${frequencySummary.errorCode}] - ${frequencySummary.errorTitle}
Tổng số lần dừng máy trong 30 ngày: ${frequencySummary.totalOccurrences30Days} lần
Chu kỳ lặp lại trung bình (MTBF): ${frequencySummary.daysBetweenOccurrences} ngày/sự cố
Xu hướng: ${frequencySummary.trend === 'INCREASING' ? 'Gia tăng' : frequencySummary.trend === 'DECREASING' ? 'Giảm dần' : 'Ổn định'}
Đánh giá mức độ can thiệp: ${
      frequencySummary.requiresDeepRca
        ? '🔴 BẮT BUỘC PHÂN TÍCH GỐC RỄ CHUYÊN SÂU (DEEP RCA REQUIRED)'
        : frequencySummary.rcaUrgency === 'MODERATE_MONITOR'
        ? '🟡 CẢNH BÁO LẶP LẠI - CẦN GIÁM SÁT'
        : '🟢 SỰ CỐ ĐƠN LẺ - KHÔNG CẦN RCA SÂU'
    }
Nhận định AI:
${frequencySummary.rcaRationale}

Khuyến nghị hành động kỹ thuật chuyên sâu:
${frequencySummary.rootCauseRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
Ngày trích xuất: ${new Date().toLocaleDateString('vi-VN')}
`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setRcaCopySuccess(true);
      setTimeout(() => setRcaCopySuccess(false), 2500);
    }
  };

  // Handler to send 30-day recurrence analysis request to AI Copilot
  const handleAskCopilotAboutRca = () => {
    const promptText = `Máy ${device.code} (${device.model}) vừa ghi nhận mã lỗi [${frequencySummary.errorCode}] lặp lại ${frequencySummary.totalOccurrences30Days} lần trong 30 ngày qua (trung bình cứ ${frequencySummary.daysBetweenOccurrences} ngày/sự cố, xu hướng ${frequencySummary.trend === 'INCREASING' ? 'gia tăng mạnh' : 'dày đặc'}). Nhờ AI Copilot phân tích nguyên nhân gốc rễ chuyên sâu (Root Cause Analysis - 5 Whys & Biểu đồ Ishikawa) và đề xuất phương án bảo dưỡng triệt để để tránh tiếp tục dừng máy?`;
    setActiveTab('chat');
    setInputMsg(promptText);
  };

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

  // Fetch AI Diagnosis (with optional voice symptoms & periodic maintenance history incorporated)
  const fetchDiagnosis = async (overrideSymptoms?: string, forceHistory?: boolean) => {
    setLoading(true);
    const symptomsToSend =
      overrideSymptoms !== undefined ? overrideSymptoms : voiceSymptoms;
    const includeHistory =
      forceHistory !== undefined ? forceHistory : useHistoryDiagnostic;

    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device.id,
          incidentId: device.activeIncident?.incidentId,
          voiceSymptoms: symptomsToSend.trim() || undefined,
          maintenanceHistory: includeHistory && maintenanceHistory.length > 0 ? maintenanceHistory : undefined,
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

        {/* Tab switchers: Diagnosis SOP vs Real-time Group Chat vs Field Copilot Chat */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-6 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 transition shrink-0 ${
              activeTab === 'diagnosis'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Kết Quả Chẩn Đoán & Quy Trình Khắc Phục</span>
          </button>

          <button
            onClick={() => setActiveTab('group_chat')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 transition shrink-0 ${
              activeTab === 'group_chat'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-4 w-4 text-purple-400" />
            <span>Thảo Luận Nhóm Sự Cố Thời Gian Thực</span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-mono border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Chat
            </span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 transition shrink-0 ${
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
          {activeTab === 'group_chat' ? (
            <IncidentGroupChat
              device={device}
              technicians={technicians}
              onOpenRepairReport={onOpenRepairReport}
              onOpenInventory={onOpenInventory}
            />
          ) : activeTab === 'diagnosis' ? (
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

              {/* SMART HISTORY-BASED DIAGNOSIS PANEL (Chẩn đoán thông minh dựa trên lịch sử bảo dưỡng định kỳ) */}
              <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 p-4.5 sm:p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600/30 border border-amber-500/40 text-amber-400">
                      <History className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>Chẩn Đoán Thông Minh Dựa Trên Lịch Sử Bảo Dưỡng</span>
                          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        </h3>
                        <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                          {maintenanceHistory.length} Kỳ Bảo Dưỡng
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        AI tự động đối chiếu tiền sử hỏng hóc, linh kiện đã thay và chu kỳ hao mòn của chính máy <strong className="text-amber-300">{device.code}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:border-amber-500/50 transition">
                      <input
                        type="checkbox"
                        checked={useHistoryDiagnostic}
                        onChange={(e) => setUseHistoryDiagnostic(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5"
                      />
                      <span className="font-mono text-[11px]">Bật đối chiếu</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowHistoryPanel((prev) => !prev)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800"
                      title={showHistoryPanel ? 'Thu gọn' : 'Mở rộng'}
                    >
                      {showHistoryPanel ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {showHistoryPanel && (
                  <div className="mt-3.5 space-y-3">
                    {/* Recent Maintenance Dossier Strip */}
                    {maintenanceHistory.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar className="h-3 w-3 text-amber-400" />
                              Kỳ gần nhất: {new Date(maintenanceHistory[0].completedAt).toLocaleDateString('vi-VN')}
                            </span>
                            <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-emerald-400 font-mono">
                              {maintenanceHistory[0].taskType}
                            </span>
                          </div>
                          <strong className="text-white text-xs block leading-snug">
                            {maintenanceHistory[0].taskTitle}
                          </strong>
                          <p className="mt-1 text-[11px] text-slate-300 line-clamp-2">
                            {maintenanceHistory[0].findingsAndActions}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {maintenanceHistory[0].partsReplaced?.map((part, pIdx) => (
                              <span
                                key={pIdx}
                                className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-200 font-mono"
                              >
                                🔩 {part}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Lifecycle wear and correlation summary */}
                        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                              <span className="font-mono text-cyan-300 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Chu kỳ hao mòn linh kiện
                              </span>
                              <span className="font-mono text-slate-400 text-[10px]">
                                Ngưỡng: 500h
                              </span>
                            </div>
                            <div className="space-y-1.5 mt-2">
                              <div>
                                <div className="flex justify-between text-[10px] font-mono text-slate-300 mb-0.5">
                                  <span>Dẫn hướng kim cương & Vòi phun</span>
                                  <span className="text-amber-400 font-bold">380h / 500h (76%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full" style={{ width: '76%' }}></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-[10px] font-mono text-slate-300 mb-0.5">
                                  <span>Lõi lọc giấy ion 3-micron</span>
                                  <span className="text-red-400 font-bold">420h / 500h (84%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-emerald-500 to-red-500 rounded-full" style={{ width: '84%' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800">
                            <span className="text-[11px] text-slate-400 font-mono">
                              KTV phụ trách: {maintenanceHistory[0].technicianName}
                            </span>
                            <button
                              type="button"
                              onClick={() => fetchDiagnosis(undefined, true)}
                              disabled={loading}
                              className="flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 text-[11px] font-bold shadow transition active:scale-95 disabled:opacity-50"
                            >
                              <Sparkles className="h-3 w-3" />
                              <span>AI Tái Chẩn Đoán Cùng Lịch Sử</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Chưa có dữ liệu bảo dưỡng định kỳ trước đây cho máy này.
                      </p>
                    )}
                  </div>
                )}
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
                    Gemini AI đang phân tích dữ liệu EDM, lịch sử bảo dưỡng & triệu chứng giọng nói...
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mt-1.5">
                    Đang đối chiếu thông số cảm biến với dữ liệu bảo dưỡng định kỳ của chính máy {device.code} và sổ tay vận hành xưởng.
                  </p>
                </div>
              ) : diagnosis ? (
                <>
                  {/* 30-DAY ERROR CODE FREQUENCY & DEEP ROOT CAUSE ANALYSIS (RCA) BAR CHART */}
                  <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/35 via-slate-900 to-slate-950 p-4.5 sm:p-5 shadow-xl">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>Tần Suất Mã Lỗi 30 Ngày & Đánh Giá Phân Tích Gốc Rễ (RCA)</span>
                              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                            </h3>
                            <span className="rounded bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300">
                              30-Day Frequency
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            Theo dõi tần suất xuất hiện của mã lỗi trong 30 ngày qua trên máy <strong className="text-indigo-300">{device.code}</strong> để đánh giá mức độ cần thiết phân tích nguyên nhân gốc rễ chuyên sâu.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleCopyRcaSummary}
                          className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500/50 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition font-mono"
                          title="Sao chép báo cáo tần suất và đánh giá RCA"
                        >
                          {rcaCopySuccess ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-300 font-bold">Đã chép!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-indigo-400" />
                              <span>Sao Chép</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowRcaGuidance((prev) => !prev)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800"
                          title={showRcaGuidance ? 'Thu gọn' : 'Mở rộng'}
                        >
                          {showRcaGuidance ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Error Code Selector Bar */}
                    <div className="mt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Search className="h-3 w-3 text-indigo-400" />
                          <span>Mã lỗi đang chọn:</span>
                        </span>
                        <select
                          value={selectedErrorCode}
                          onChange={(e) => setSelectedErrorCode(e.target.value)}
                          className="rounded-lg bg-slate-900 border border-indigo-500/40 text-indigo-200 font-mono text-xs px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {COMMON_EDM_ERROR_CODES.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                              {opt.code} - {opt.title.slice(0, 42)}...
                            </option>
                          ))}
                        </select>

                        {device.activeIncident?.errorCode && device.activeIncident.errorCode !== selectedErrorCode && (
                          <button
                            type="button"
                            onClick={() => setSelectedErrorCode(device.activeIncident!.errorCode)}
                            className="rounded-lg bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-red-300 hover:bg-red-500/25 transition flex items-center gap-1"
                          >
                            <Zap className="h-3 w-3 text-red-400" />
                            <span>Về lỗi hiện tại: {device.activeIncident.errorCode}</span>
                          </button>
                        )}
                      </div>

                      {/* Quick Pill Filter Buttons */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {COMMON_EDM_ERROR_CODES.slice(0, 4).map((item) => (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => setSelectedErrorCode(item.code)}
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-mono font-bold transition flex items-center gap-1 ${
                              selectedErrorCode === item.code
                                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            {item.code === device.activeIncident?.errorCode && (
                              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse"></span>
                            )}
                            <span>{item.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Summary KPI Cards Grid (3 Cards) */}
                    <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Card 1: 30-Day Occurrences */}
                      <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>Tổng tần suất (30 ngày)</span>
                          <span className={`flex items-center gap-0.5 font-mono text-[10px] font-bold ${
                            frequencySummary.trend === 'INCREASING' ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            <TrendingUp className="h-3 w-3" />
                            {frequencySummary.trend === 'INCREASING' ? 'Tăng gần đây' : frequencySummary.trend === 'DECREASING' ? 'Giảm dần' : 'Ổn định'}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className={`text-2xl font-bold font-mono ${
                            frequencySummary.requiresDeepRca ? 'text-red-400' : frequencySummary.totalOccurrences30Days >= 2 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {frequencySummary.totalOccurrences30Days}
                          </span>
                          <span className="text-xs text-slate-400">lần dừng máy</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          Mã lỗi: <strong className="text-indigo-300">{frequencySummary.errorCode}</strong>
                        </p>
                      </div>

                      {/* Card 2: Average Days Between Failures */}
                      <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>Chu kỳ lặp lại (MTBF)</span>
                          <Clock className="h-3.5 w-3.5 text-cyan-400" />
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-bold font-mono text-cyan-400">
                            ~{frequencySummary.daysBetweenOccurrences}
                          </span>
                          <span className="text-xs text-slate-400">ngày / sự cố</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          {frequencySummary.totalOccurrences30Days > 1 ? 'Lặp lại định kỳ' : 'Sự cố hiếm gặp'}
                        </p>
                      </div>

                      {/* Card 3: Deep RCA Verdict Badge Card */}
                      <div className={`rounded-xl border p-3 flex flex-col justify-between ${
                        frequencySummary.requiresDeepRca
                          ? 'bg-red-950/30 border-red-500/40 ring-1 ring-red-500/20'
                          : frequencySummary.rcaUrgency === 'MODERATE_MONITOR'
                          ? 'bg-amber-950/30 border-amber-500/40'
                          : 'bg-emerald-950/30 border-emerald-500/40'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold uppercase tracking-wider text-[10px] font-mono text-slate-300">
                            Đánh giá can thiệp gốc rễ
                          </span>
                          {frequencySummary.requiresDeepRca ? (
                            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          )}
                        </div>
                        <div className="mt-1">
                          <span className={`text-xs sm:text-[13px] font-bold block leading-snug ${
                            frequencySummary.requiresDeepRca
                              ? 'text-red-300'
                              : frequencySummary.rcaUrgency === 'MODERATE_MONITOR'
                              ? 'text-amber-300'
                              : 'text-emerald-300'
                          }`}>
                            {frequencySummary.requiresDeepRca
                              ? 'CẦN PHÂN TÍCH GỐC RỄ CHUYÊN SÂU'
                              : frequencySummary.rcaUrgency === 'MODERATE_MONITOR'
                              ? 'THEO DÕI XU HƯỚNG TÁI DIỄN'
                              : 'SỰ CỐ ĐƠN LẺ / NGẪU NHIÊN'}
                          </span>
                        </div>
                        <p className="text-[10px] mt-1 font-mono text-slate-400">
                          {frequencySummary.requiresDeepRca
                            ? 'Bắt buộc mở hồ sơ RCA L2'
                            : 'Không yêu cầu phân tích sâu'}
                        </p>
                      </div>
                    </div>

                    {/* SMALL RECHARTS BAR CHART AREA */}
                    <div className="mt-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white font-mono">
                              Biểu Đồ Tần Suất 30 Ngày Qua ({frequencySummary.dayBuckets[0]?.displayDate} - {frequencySummary.dayBuckets[29]?.displayDate})
                            </span>
                            <span className="text-[10px] text-indigo-400 font-mono">
                              [{frequencySummary.errorCode}]
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-md">
                            {frequencySummary.errorTitle}
                          </p>
                        </div>

                        {/* Chart Legend Pills */}
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                            <span>≥2 lần/ngày (Dày đặc)</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                            <span>1 lần</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                            <span>Hôm nay</span>
                          </span>
                        </div>
                      </div>

                      {/* Small Recharts BarChart container */}
                      <div className="h-[145px] w-full pt-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={frequencySummary.dayBuckets}
                            margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                            <XAxis
                              dataKey="displayDate"
                              interval={4}
                              tick={{ fill: '#94a3b8', fontSize: 10 }}
                              tickLine={{ stroke: '#475569' }}
                              axisLine={{ stroke: '#475569' }}
                            />
                            <YAxis
                              allowDecimals={false}
                              domain={[0, Math.max(2, frequencySummary.highestDailyCount + 1)]}
                              tick={{ fill: '#94a3b8', fontSize: 10 }}
                              tickLine={{ stroke: '#475569' }}
                              axisLine={{ stroke: '#475569' }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload as ErrorCodeDayBucket;
                                  return (
                                    <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 shadow-2xl backdrop-blur-md text-xs z-50 min-w-[200px]">
                                      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5 mb-1.5">
                                        <span className="font-mono font-bold text-slate-200 flex items-center gap-1">
                                          <Calendar className="h-3 w-3 text-indigo-400" />
                                          {data.fullDateLabel}
                                        </span>
                                        {data.dayOffset === 0 && (
                                          <span className="rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 text-[10px] font-mono font-bold">
                                            Hôm nay
                                          </span>
                                        )}
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-slate-400">Số lần dừng máy:</span>
                                          <span
                                            className={`font-mono font-bold ${
                                              data.count > 1
                                                ? 'text-red-400'
                                                : data.count === 1
                                                ? 'text-amber-400'
                                                : 'text-slate-500'
                                            }`}
                                          >
                                            {data.count} lần
                                          </span>
                                        </div>
                                        {data.shift && (
                                          <div className="flex items-center justify-between gap-3">
                                            <span className="text-slate-400">Ca vận hành:</span>
                                            <span className="font-mono text-cyan-300 text-[11px]">
                                              {data.shift}
                                            </span>
                                          </div>
                                        )}
                                        {data.incidentDetails ? (
                                          <p className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-800">
                                            💡 {data.incidentDetails}
                                          </p>
                                        ) : (
                                          <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-800">
                                            Vận hành bình thường, không ghi nhận sự cố.
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <ReferenceLine
                              y={1}
                              stroke="#f59e0b"
                              strokeDasharray="3 3"
                              strokeOpacity={0.6}
                            />
                            <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={12}>
                              {frequencySummary.dayBuckets.map((entry, index) => {
                                let fill = '#334155';
                                if (entry.count >= 2) fill = '#ef4444';
                                else if (entry.count === 1) {
                                  fill = entry.dayOffset === 0 ? '#f43f5e' : '#8b5cf6';
                                }
                                return (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={fill}
                                    fillOpacity={entry.count > 0 ? 1 : 0.15}
                                  />
                                );
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-800/80">
                        <span>Trục hoành: 30 ngày liên tục</span>
                        <span>Đường đứt nét cam: Ngưỡng cảnh báo lặp lại (1 lần/ngày)</span>
                      </div>
                    </div>

                    {/* DEEPER ROOT CAUSE ANALYSIS ASSESSMENT PANEL */}
                    {showRcaGuidance && (
                      <div className={`mt-3.5 rounded-xl border p-3.5 text-xs transition-all ${
                        frequencySummary.requiresDeepRca
                          ? 'border-red-500/40 bg-red-950/20'
                          : frequencySummary.rcaUrgency === 'MODERATE_MONITOR'
                          ? 'border-amber-500/40 bg-amber-950/20'
                          : 'border-slate-800 bg-slate-900/60'
                      }`}>
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-1.5 font-bold font-mono">
                            {frequencySummary.requiresDeepRca ? (
                              <>
                                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                                <span className="text-red-300">
                                  KẾT LUẬN RCA: MÁY CẦN PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ CHUYÊN SÂU
                                </span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span className="text-slate-200">
                                  ĐÁNH GIÁ MỨC ĐỘ CAN THIỆP GỐC RỄ
                                </span>
                              </>
                            )}
                          </div>

                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold border ${
                            frequencySummary.requiresDeepRca
                              ? 'bg-red-500/20 border-red-500/40 text-red-300'
                              : frequencySummary.rcaUrgency === 'MODERATE_MONITOR'
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          }`}>
                            {frequencySummary.requiresDeepRca
                              ? 'Cần Deep RCA Cấp Độ 2'
                              : 'Sự cố trong định mức'}
                          </span>
                        </div>

                        <p className="text-slate-300 leading-relaxed">
                          {frequencySummary.rcaRationale}
                        </p>

                        {/* Action Checklist for Deeper RCA */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800">
                          <div className="text-[11px] font-mono font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                            <Wrench className="h-3 w-3 text-amber-400" />
                            <span>Khuyến nghị các bước phân tích chuyên sâu cho KTV & Giám sát xưởng:</span>
                          </div>
                          <ul className="space-y-1 text-[11px] text-slate-300">
                            {frequencySummary.rootCauseRecommendations.map((rec, rIdx) => (
                              <li key={rIdx} className="flex items-start gap-1.5">
                                <span className="text-indigo-400 font-bold">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Interactive Buttons Strip */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleAskCopilotAboutRca}
                            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-xs font-bold shadow-md shadow-indigo-600/20 transition active:scale-95"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-amber-300" />
                            <span>Hỏi AI Copilot Phân Tích Gốc Rễ Chuyên Sâu (5 Whys)</span>
                          </button>

                          <span className="text-[10px] text-slate-400 font-mono">
                            Dữ liệu thống kê 30 ngày máy {device.code}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

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
                        {diagnosis.historyCorrelation && (
                          <span className="rounded-md bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1">
                            <History className="h-3 w-3" />
                            Đối Chiếu Lịch Sử Máy ({diagnosis.historyCorrelation.correlationPercentage}%)
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

                      {/* DEDICATED HISTORY CORRELATION INSIGHT HIGHLIGHT */}
                      {diagnosis.historyCorrelation && (
                        <div className="mt-3.5 rounded-xl border border-amber-500/35 bg-gradient-to-br from-amber-950/30 to-slate-900/80 p-3.5 text-xs">
                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono">
                              <History className="h-4 w-4 text-amber-400" />
                              <span>GỢI Ý NGUYÊN NHÂN TỪ LỊCH SỬ BẢO DƯỠNG CỦA {device.code}:</span>
                            </div>
                            <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono text-amber-300 font-bold">
                              Mức tương quan: {diagnosis.historyCorrelation.correlationPercentage}%
                            </span>
                          </div>
                          <p className="text-slate-200 leading-relaxed font-normal">
                            {diagnosis.historyCorrelation.riskHypothesis}
                          </p>
                          {diagnosis.historyCorrelation.preventiveActionAdvised && (
                            <p className="mt-2 text-[11px] text-amber-200/90 font-mono flex items-center gap-1.5 pt-1.5 border-t border-amber-500/20">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              <span>Khuyến nghị phòng ngừa: {diagnosis.historyCorrelation.preventiveActionAdvised}</span>
                            </p>
                          )}
                        </div>
                      )}
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

                  {/* ========================================================================= */}
                  {/* AI REPAIR ETA & HISTORICAL BENCHMARK ANALYSIS HUB */}
                  {/* ========================================================================= */}
                  <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-slate-900 to-slate-950 p-5 shadow-2xl space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400">
                          <Timer className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                              <span>Ước Tính Thời Gian Sửa Chữa (AI Repair ETA)</span>
                              <Sparkles className="h-4 w-4 text-cyan-400" />
                            </h3>
                            <span className="rounded bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                              Mã Lỗi: [{selectedErrorCode}]
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">
                            Phân tích đối chiếu dữ liệu lịch sử sự cố xưởng & cảm biến hiện trường để dự báo chính xác thời điểm hoàn tất.
                          </p>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setShowEtaCustomizer((prev) => !prev)}
                          className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                            showEtaCustomizer
                              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                          title="Tùy chỉnh số lượng KTV và điều kiện phụ tùng để AI tính lại ETA"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Tùy Chỉnh Hiện Trường</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyEtaReport}
                          className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition font-mono"
                          title="Sao chép báo cáo dự báo ETA gửi Quản lý ca trực"
                        >
                          {etaCopySuccess ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-300 font-bold">Đã chép!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-cyan-400" />
                              <span>Sao Chép ETA</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* HERO ETA STATS ROW */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Big ETA Countdown Stat */}
                      <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-cyan-300">
                          <span className="font-semibold">Thời Gian Dự Kiến (ETA):</span>
                          <Clock className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                            <span>~{repairEtaAnalysis.estimatedMinutes}</span>
                            <span className="text-sm font-normal text-cyan-300">Phút</span>
                          </div>
                          <div className="text-[11px] text-cyan-200/90 font-mono mt-0.5">
                            Dự kiến xong: <strong>{repairEtaAnalysis.estimatedCompletionTime}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Confidence Score */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Độ Tin Cậy AI:</span>
                          <Brain className="h-4 w-4 text-purple-400" />
                        </div>
                        <div className="mt-2">
                          <div className="text-xl font-bold text-emerald-400 font-mono flex items-center gap-2">
                            <span>{repairEtaAnalysis.confidenceScore}%</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {repairEtaAnalysis.confidenceLevel === 'VERY_HIGH' ? 'RẤT CAO' : 'CAO'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Dựa trên {repairEtaAnalysis.historicalBenchmark.sampleCount} ca sửa chữa trong lịch sử
                          </p>
                        </div>
                      </div>

                      {/* Complexity Level */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Độ Phức Tạp:</span>
                          <Wrench className="h-4 w-4 text-amber-400" />
                        </div>
                        <div className="mt-2">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                            repairEtaAnalysis.complexityLevel === 'SIMPLE'
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : repairEtaAnalysis.complexityLevel === 'STANDARD'
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-red-500/20 border-red-500/40 text-red-300'
                          }`}>
                            {repairEtaAnalysis.complexityLevel === 'SIMPLE'
                              ? 'ĐƠN GIẢN (≤30p)'
                              : repairEtaAnalysis.complexityLevel === 'STANDARD'
                              ? 'TIÊU CHUẨN (30-50p)'
                              : 'PHỨC TẠP (>50p)'}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1 truncate">
                            {repairEtaAnalysis.stagedBreakdown.length} giai đoạn thao tác
                          </p>
                        </div>
                      </div>

                      {/* Historical Average MTTR Comparison */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Trung Bình Lịch Sử:</span>
                          <History className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div className="mt-2">
                          <div className="text-xl font-bold text-white font-mono">
                            {repairEtaAnalysis.historicalBenchmark.averageMinutes} <span className="text-xs text-slate-400 font-normal">phút</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">Kỷ lục: {repairEtaAnalysis.historicalBenchmark.minMinutes}p</span>
                            <span>•</span>
                            <span className="text-slate-400">Tối đa: {repairEtaAnalysis.historicalBenchmark.maxMinutes}p</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* LIVE REPAIR STOPWATCH WIDGET */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                          isStopwatchRunning
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          <Hourglass className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">Đồng Hồ Bấm Giờ Thao Tác Sửa Chữa (Live Stopwatch)</span>
                            {isStopwatchRunning && (
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Bấm đếm giờ khi KTV bắt đầu thao tác tại máy để theo dõi tiến độ thực tế so với ETA của AI.
                          </p>
                        </div>
                      </div>

                      {/* Stopwatch Controls & Counter */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="font-mono text-xl font-black text-amber-300 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
                          {Math.floor(stopwatchSeconds / 60).toString().padStart(2, '0')}:{(stopwatchSeconds % 60).toString().padStart(2, '0')}
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsStopwatchRunning((prev) => !prev)}
                          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm active:scale-95 ${
                            isStopwatchRunning
                              ? 'bg-amber-600 hover:bg-amber-500 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {isStopwatchRunning ? (
                            <>
                              <Pause className="h-3.5 w-3.5" />
                              <span>Tạm Dừng</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5" />
                              <span>Bắt Đầu</span>
                            </>
                          )}
                        </button>

                        {stopwatchSeconds > 0 && (
                          <button
                            type="button"
                            onClick={handleResetStopwatch}
                            className="p-1.5 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition"
                            title="Đặt lại đồng hồ về 0"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress against ETA */}
                    {stopwatchSeconds > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                          <span>
                            Tiến độ thực tế:{' '}
                            <strong className="text-amber-300">
                              {(stopwatchSeconds / 60).toFixed(1)} / {repairEtaAnalysis.estimatedMinutes} phút
                            </strong>{' '}
                            ({Math.min(100, Math.round(((stopwatchSeconds / 60) / repairEtaAnalysis.estimatedMinutes) * 100))}%)
                          </span>
                          <span className={
                            stopwatchSeconds / 60 > repairEtaAnalysis.estimatedMinutes
                              ? 'text-red-400 font-bold'
                              : 'text-emerald-400 font-bold'
                          }>
                            {stopwatchSeconds / 60 > repairEtaAnalysis.estimatedMinutes
                              ? '⚠️ Đã vượt quá ETA dự kiến'
                              : '🟢 Tiến độ trong tầm kiểm soát'}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              stopwatchSeconds / 60 > repairEtaAnalysis.estimatedMinutes
                                ? 'bg-red-500'
                                : stopwatchSeconds / 60 > repairEtaAnalysis.estimatedMinutes * 0.8
                                ? 'bg-amber-400'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(100, ((stopwatchSeconds / 60) / repairEtaAnalysis.estimatedMinutes) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* ON-SITE CONDITIONS CUSTOMIZER DRAWER (Adjust Technicians & Parts) */}
                    {showEtaCustomizer && (
                      <div className="rounded-xl border border-cyan-500/30 bg-slate-950 p-3.5 space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            <span>Điều Kiện Hiện Trường & Tài Nguyên Thực Tế</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            AI tự động tái ước tính ETA khi thay đổi
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* Technician Count Option */}
                          <div>
                            <label className="block text-slate-400 font-medium mb-1">
                              Số lượng kỹ thuật viên xử lý:
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEtaAssistantsCount(1)}
                                className={`flex-1 rounded-lg border py-1.5 px-2 font-semibold transition ${
                                  etaAssistantsCount === 1
                                    ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                1 KTV Độc Lập
                              </button>
                              <button
                                type="button"
                                onClick={() => setEtaAssistantsCount(2)}
                                className={`flex-1 rounded-lg border py-1.5 px-2 font-semibold transition ${
                                  etaAssistantsCount === 2
                                    ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                2 KTV Phối Hợp (-20% time)
                              </button>
                            </div>
                          </div>

                          {/* Spare Parts Availability Option */}
                          <div>
                            <label className="block text-slate-400 font-medium mb-1">
                              Tình trạng phụ tùng thay thế:
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEtaHasSpareParts(true)}
                                className={`flex-1 rounded-lg border py-1.5 px-2 font-semibold transition ${
                                  etaHasSpareParts
                                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                Sẵn Trong Tủ Line (-8p)
                              </button>
                              <button
                                type="button"
                                onClick={() => setEtaHasSpareParts(false)}
                                className={`flex-1 rounded-lg border py-1.5 px-2 font-semibold transition ${
                                  !etaHasSpareParts
                                    ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                Chưa Xuất Kho (+12p)
                              </button>
                            </div>

                            {/* Inventory Shortage Warning Badge within ETA */}
                            {outOfStockParts.length > 0 && (
                              <div className="mt-2 rounded-lg bg-red-950/40 border border-red-500/40 p-2 text-[11px] text-red-300 flex items-center gap-1.5 animate-pulse">
                                <AlertOctagon className="h-3.5 w-3.5 text-red-400 shrink-0" />
                                <span>
                                  🚨 Cảnh báo kho: Có {outOfStockParts.length} linh kiện hết hàng trong kho. Kỹ thuật viên không thể bắt đầu thay thế ngay (chờ giao hàng ~{outOfStockParts[0].leadTimeDays} ngày).
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STAGED REPAIR DURATION TIMELINE (4 STAGES) */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Layers className="h-4 w-4 text-cyan-400" />
                          <span>Phân Bổ Thời Gian Theo Giai Đoạn Thao Tác:</span>
                        </h4>
                        <span className="text-[11px] font-mono text-cyan-300">
                          Tổng cộng: {repairEtaAnalysis.estimatedMinutes} phút
                        </span>
                      </div>

                      {/* Visual Proportional Duration Bar */}
                      <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-800 gap-0.5">
                        {repairEtaAnalysis.stagedBreakdown.map((stage, idx) => {
                          const percentage = Math.round((stage.durationMinutes / repairEtaAnalysis.estimatedMinutes) * 100);
                          const colors = ['bg-indigo-500', 'bg-cyan-500', 'bg-amber-500', 'bg-emerald-500'];
                          return (
                            <div
                              key={idx}
                              title={`${stage.stageName}: ~${stage.durationMinutes} phút (${percentage}%)`}
                              className={`${colors[idx % colors.length]} h-full transition-all hover:opacity-80`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          );
                        })}
                      </div>

                      {/* Stage Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                        {repairEtaAnalysis.stagedBreakdown.map((stage, idx) => {
                          const badgeColors = [
                            'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
                            'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                            'bg-amber-500/20 text-amber-300 border-amber-500/30',
                            'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                          ];
                          return (
                            <div
                              key={idx}
                              className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-3 space-y-1.5 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-white truncate">{stage.stageName}</span>
                                <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColors[idx % badgeColors.length]}`}>
                                  ~{stage.durationMinutes} phút
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed">
                                {stage.description}
                              </p>
                              {stage.recommendedTools && stage.recommendedTools.length > 0 && (
                                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 pt-1 border-t border-slate-800/60">
                                  <Wrench className="h-3 w-3 text-slate-500 shrink-0" />
                                  <span className="truncate">{stage.recommendedTools.join(' • ')}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* HISTORICAL BENCHMARK & RISK/TIPS ROW */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                      {/* Left: Historical Correlation Rationale */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
                        <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono">
                          <History className="h-4 w-4" />
                          <span>Đối Chiếu Dữ Liệu Lịch Sử Sửa Chữa Xưởng:</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          {repairEtaAnalysis.historicalCorrelationRationale}
                        </p>
                        <div className="pt-2 border-t border-slate-800/80 space-y-1">
                          <span className="text-[11px] text-slate-400 font-semibold">Các yếu tố AI phân tích:</span>
                          <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                            {repairEtaAnalysis.influencingFactors.map((factor, i) => (
                              <li key={i}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Right: AI Speed-Up Tips & Delay Risks */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5">
                        <div>
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Mẹo AI Rút Ngắn Thời Gian Sửa Chữa:</span>
                          </div>
                          <ul className="space-y-1 text-[11px] text-emerald-200/90">
                            {repairEtaAnalysis.aiAccelerationTips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-400 font-bold">⚡</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80">
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Rủi Ro Tiềm Ẩn Gây Trễ Hạn (Từ Lịch Sử):</span>
                          </div>
                          <ul className="space-y-1 text-[11px] text-amber-200/90">
                            {repairEtaAnalysis.riskDelayFactors.map((risk, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-400 font-bold">•</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
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
                  {/* REQUIRED TOOLS */}
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

                  {/* REAL-TIME SPARE PARTS INVENTORY & SHORTAGE ALERTS MODULE */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
                    {/* Header with Title & Real-Time Stock Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold uppercase text-white tracking-wider">
                              Vật Tư & Phụ Tùng Dự Phòng (Khả Dụng Trong Kho)
                            </h4>
                            <span className="rounded bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.2 text-[10px] font-mono text-cyan-300 font-bold hidden sm:inline-block">
                              Live Inventory Check
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Đối chiếu linh kiện AI đề xuất với lượng tồn thực tế trong kho phụ tùng xưởng
                          </p>
                        </div>
                      </div>

                      {/* Overall Stock Status Indicator */}
                      <div className="shrink-0 flex items-center gap-2">
                        {outOfStockParts.length > 0 ? (
                          <span className="rounded-full bg-red-500/20 border border-red-500/50 px-3 py-1 text-[11px] font-mono font-black text-red-300 animate-pulse flex items-center gap-1.5 shadow-md shadow-red-950/40">
                            <AlertOctagon className="h-3.5 w-3.5" />
                            CÓ {outOfStockParts.length} MÃ HẾT HÀNG!
                          </span>
                        ) : lowStockParts.length > 0 ? (
                          <span className="rounded-full bg-amber-500/20 border border-amber-500/50 px-3 py-1 text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {lowStockParts.length} MÃ DƯỚI NGƯỠNG AN TOÀN
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[11px] font-mono font-semibold text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            ĐỦ VẬT TƯ THAY THẾ
                          </span>
                        )}

                        {onOpenInventory && (
                          <button
                            type="button"
                            onClick={() => onOpenInventory()}
                            className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Mở tab Quản Lý Kho Phụ Tùng"
                          >
                            <Package className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="hidden sm:inline">Mở Kho</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action Toast Feedback Banner */}
                    {inventoryActionNotice && (
                      <div className="rounded-xl bg-cyan-950/60 border border-cyan-500/40 px-3.5 py-2 text-xs text-cyan-200 flex items-center justify-between gap-2 shadow-md animate-fadeIn">
                        <span className="font-semibold">{inventoryActionNotice}</span>
                        <button
                          onClick={() => setInventoryActionNotice(null)}
                          className="text-cyan-400 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* CRITICAL SHORTAGE ALERT BANNER */}
                    {(outOfStockParts.length > 0 || lowStockParts.length > 0) && (
                      <div className="rounded-2xl border border-red-500/50 bg-gradient-to-r from-red-950/40 via-slate-900 to-red-950/20 p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-400 shrink-0 mt-0.5">
                            <AlertOctagon className="h-5 w-5 animate-pulse" />
                          </div>
                          <div>
                            <h5 className="font-bold text-red-300 text-sm">
                              CẢNH BÁO THIẾU HỤT KHO VẬT TƯ SỬA CHỮA (SPARE PARTS SHORTAGE)
                            </h5>
                            <p className="text-slate-300 mt-1 leading-relaxed">
                              {outOfStockParts.length > 0 ? (
                                <>
                                  Có <strong className="text-red-400">{outOfStockParts.length} phụ tùng HẾT HÀNG</strong> trong kho ({outOfStockParts.map((o) => o.part?.partNumber || o.originalStr.split('(')[0].trim()).join(', ')}). Thời gian khắc phục sự cố (MTTR) thực tế sẽ bị kéo dài thêm do phải chờ giao hàng từ nhà cung cấp!
                                </>
                              ) : (
                                <>
                                  Có <strong className="text-amber-400">{lowStockParts.length} phụ tùng dưới ngưỡng an toàn</strong>. Sau khi xuất thay thế cho sự cố này, kho xưởng sẽ cạn kiệt mã vật tư tương ứng.
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {outOfStockParts.length > 0 && (
                          <button
                            type="button"
                            onClick={handleOrderAllMissingParts}
                            className="shrink-0 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 font-bold px-3.5 py-2 text-xs transition shadow-lg shadow-red-500/30 flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            <span>Đặt Hàng Khẩn Cấp ({outOfStockParts.length} mã)</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* LIST OF DETAILED RECOMMENDED PARTS CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {inventoryMatches.map((item, idx) => {
                        const isOut = item.stockStatus === 'OUT_OF_STOCK';
                        const isLow = item.stockStatus === 'LOW_STOCK';
                        const isIn = item.stockStatus === 'IN_STOCK';

                        return (
                          <div
                            key={idx}
                            className={`rounded-2xl border p-4 transition flex flex-col justify-between ${
                              isOut
                                ? 'border-red-500/60 bg-gradient-to-br from-red-950/25 via-slate-900 to-slate-950 shadow-md ring-1 ring-red-500/20'
                                : isLow
                                ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/15 via-slate-900 to-slate-950'
                                : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                            }`}
                          >
                            {/* Card Top: Name, SKU, Status Badge */}
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  {item.part ? (
                                    <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">
                                      {item.part.partNumber}
                                    </span>
                                  ) : (
                                    <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                      OEM Part
                                    </span>
                                  )}
                                  <h5 className="font-bold text-white text-xs sm:text-sm mt-1.5 line-clamp-1 leading-snug">
                                    {item.part?.name || item.originalStr}
                                  </h5>
                                </div>

                                <div className="shrink-0">
                                  {isOut ? (
                                    <span className="rounded-full bg-red-500/20 border border-red-500/50 px-2.5 py-0.5 text-[10px] font-mono font-black text-red-300 animate-pulse flex items-center gap-1">
                                      <AlertOctagon className="h-3 w-3" />
                                      HẾT HÀNG (0/{item.minSafe} {item.unit})
                                    </span>
                                  ) : isLow ? (
                                    <span className="rounded-full bg-amber-500/20 border border-amber-500/50 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      TỒN THẤP ({item.stockCount}/{item.minSafe} {item.unit})
                                    </span>
                                  ) : isIn ? (
                                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-300 flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                      SẴN HÀNG ({item.stockCount} {item.unit})
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[10px] font-mono text-slate-400">
                                      Chưa đăng ký kho
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Inventory Location & Details */}
                              <div className="mt-3 rounded-xl bg-slate-900/60 border border-slate-800/80 p-2.5 space-y-1 text-xs">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                                    <span>Vị trí kho:</span>
                                  </span>
                                  <span className="font-mono font-bold text-slate-200 truncate">
                                    {item.binLocation}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-amber-400 shrink-0" />
                                    <span>Thời gian đặt hàng (Lead time):</span>
                                  </span>
                                  <span className={`font-mono font-bold ${isOut ? 'text-red-400' : 'text-slate-300'}`}>
                                    ~{item.leadTimeDays} ngày làm việc
                                  </span>
                                </div>

                                {item.part?.supplier && (
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-400">Nhà cung cấp:</span>
                                    <span className="text-slate-300 truncate">{item.part.supplier}</span>
                                  </div>
                                )}
                              </div>

                              {/* Shortage Note for technician */}
                              {isOut && (
                                <p className="mt-2 text-[11px] text-red-300 font-medium leading-relaxed bg-red-950/30 border border-red-500/30 p-2 rounded-lg">
                                  ⚠️ Không thể thay thế ngay lập tức. Cần tạo đơn đặt hàng khẩn cấp hoặc điều chuyển phụ tùng từ máy dự phòng.
                                </p>
                              )}
                              {isLow && (
                                <p className="mt-2 text-[11px] text-amber-300/90 leading-relaxed bg-amber-950/20 border border-amber-500/30 p-2 rounded-lg">
                                  ℹ️ Còn {item.stockCount} {item.unit} đủ để thay thế, nhưng cần đặt hàng bổ sung ngay để duy trì mức an toàn.
                                </p>
                              )}
                            </div>

                            {/* Actions on this part */}
                            <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                              {/* If Out of stock: Quick PO Button */}
                              {isOut && item.part && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickOrderSinglePart(item.part!)}
                                  className="flex-1 rounded-xl py-1.5 px-2 bg-red-500 hover:bg-red-400 text-slate-950 font-bold transition flex items-center justify-center gap-1 shadow-md shadow-red-500/20 cursor-pointer"
                                >
                                  <ShoppingCart className="h-3.5 w-3.5" />
                                  <span>Đặt Hàng Khẩn Cấp (+{item.minSafe * 2 || 4} {item.unit})</span>
                                </button>
                              )}

                              {/* If Low stock: Both Issue and Reorder */}
                              {isLow && item.part && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickIssuePart(item.part!)}
                                    className="flex-1 rounded-xl py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                    title="Xuất 1 đơn vị dùng cho máy này"
                                  >
                                    <ArrowDownRight className="h-3.5 w-3.5" />
                                    <span>Xuất Dùng (-1)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickOrderSinglePart(item.part!)}
                                    className="flex-1 rounded-xl py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                    title="Tạo đơn PO đặt bổ sung kho"
                                  >
                                    <ShoppingCart className="h-3.5 w-3.5" />
                                    <span>Đặt Bổ Sung</span>
                                  </button>
                                </>
                              )}

                              {/* If In Stock: Issue for this machine */}
                              {isIn && item.part && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickIssuePart(item.part!)}
                                  className="flex-1 rounded-xl py-1.5 px-2 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/30"
                                >
                                  <ArrowDownRight className="h-3.5 w-3.5" />
                                  <span>Xuất Kho Cho Máy {device.code} (-1 {item.unit})</span>
                                </button>
                              )}

                              {/* Direct navigation to inventory tab */}
                              {onOpenInventory && (
                                <button
                                  type="button"
                                  onClick={() => onOpenInventory(item.part?.partNumber || item.originalStr)}
                                  className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                                  title="Xem chi tiết linh kiện này trong kho"
                                >
                                  <span>Chi tiết</span>
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
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

            {onOpenRCA && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRCA(device.id, device.activeIncident?.errorCode || frequencySummary?.errorCode || 'E-102');
                }}
                className="flex items-center gap-1.5 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-950/90 to-slate-900 hover:from-cyan-900/90 hover:to-slate-800 px-4 py-2 text-xs font-bold text-cyan-300 shadow-md shadow-cyan-500/20 transition active:scale-95"
              >
                <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                <span>Phân Tích Gốc Rễ Đa Chiều (5-Whys & RCA)</span>
              </button>
            )}

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

