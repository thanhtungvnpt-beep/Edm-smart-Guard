import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Mic,
  MicOff,
  X,
  Sparkles,
  Zap,
  Wrench,
  Play,
  Pause,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Volume2,
  QrCode,
  Contrast,
  Command,
  Info,
} from 'lucide-react';
import { Device } from '../types';

export type VoiceActionType =
  | 'SET_STATUS'
  | 'OPEN_DIAGNOSIS'
  | 'OPEN_DETAILS'
  | 'TOGGLE_CONTRAST'
  | 'SET_FILTER'
  | 'OPEN_QR'
  | 'OPEN_SHORTCUTS'
  | 'OPEN_RCA'
  | 'SEARCH';

export interface ParsedVoiceAction {
  type: VoiceActionType;
  title: string;
  description: string;
  targetDevice?: Device;
  targetStatus?: Device['status'];
  filterValue?: 'ALL' | 'ALARM' | 'RUNNING' | 'MAINTENANCE' | 'IDLE' | 'WIRE_EDM' | 'SINKER_EDM';
  rawTranscript: string;
}

interface VoiceSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  devices: Device[];
  onToast?: (message: string) => void;
  onSetDeviceStatus?: (deviceId: string, status: Device['status'], note?: string) => Promise<void> | void;
  onOpenDiagnosis?: (device: Device) => void;
  onOpenMachineDetails?: (device: Device) => void;
  onOpenQRScanner?: () => void;
  onToggleHighContrast?: () => void;
  isHighContrast?: boolean;
  onSelectFilter?: (filter: any) => void;
  onOpenShortcuts?: () => void;
  onOpenRCA?: (deviceId?: string, errorCode?: string) => void;
}

// Smart device resolver for EDM machines: matches codes like "EDM-01", "EDM-W01", "W01", "máy 1", "Makino", etc.
export function resolveDeviceFromVoice(queryText: string, devices: Device[]): Device | null {
  if (!queryText || devices.length === 0) return null;
  const q = queryText.toLowerCase().trim();

  // 1. Direct code exact match (e.g. 'EDM-W01', 'EDM-S01')
  const directMatch = devices.find(
    (d) =>
      d.code.toLowerCase() === q ||
      d.id.toLowerCase() === q ||
      d.name.toLowerCase() === q
  );
  if (directMatch) return directMatch;

  // 2. Technical Code Normalization
  // "edm 01" / "edm 1" / "edm-01" -> matches EDM-W01 or dev-01
  const numMatch = q.match(/(?:edm\s*[-_]?\s*|máy\s*(?:số\s*)?|w\s*|s\s*)0?([1-9])/i);
  if (numMatch) {
    const digit = numMatch[1];
    const matchByDigit = devices.find((d) => {
      const codeSuffix = d.code.replace(/[^0-9]/g, '');
      const idSuffix = d.id.replace(/[^0-9]/g, '');
      return (
        codeSuffix.endsWith(digit) ||
        codeSuffix.endsWith(`0${digit}`) ||
        idSuffix.endsWith(digit) ||
        idSuffix.endsWith(`0${digit}`)
      );
    });
    if (matchByDigit) return matchByDigit;
  }

  // 3. Match code substrings: 'w01', 'w02', 's01', 'w03', 's02'
  const subCodeMatch = devices.find((d) => {
    const simplifiedCode = d.code.toLowerCase().replace(/[^a-z0-9]/g, '');
    const simplifiedQuery = q.replace(/[^a-z0-9]/g, '');
    return (
      simplifiedQuery.includes(simplifiedCode) ||
      simplifiedCode.includes(simplifiedQuery)
    );
  });
  if (subCodeMatch) return subCodeMatch;

  // 4. Match brand or model
  const brandMatch = devices.find(
    (d) =>
      q.includes(d.brand.toLowerCase()) ||
      q.includes(d.model.toLowerCase()) ||
      q.includes(d.name.toLowerCase())
  );
  if (brandMatch) return brandMatch;

  return null;
}

// Action intent parser
export function parseVoiceAction(transcript: string, devices: Device[]): ParsedVoiceAction {
  const text = transcript.toLowerCase().trim();

  // 1. Action: Put machine into MAINTENANCE ("Đặt máy EDM-01 vào trạng thái bảo trì", "Chuyển sang bảo trì", etc.)
  if (
    text.includes('bảo trì') ||
    text.includes('maintenance') ||
    text.includes('bảo dưỡng')
  ) {
    // Check if it's a filter command: "lọc máy bảo trì"
    if (text.startsWith('lọc') || text.includes('xem máy')) {
      return {
        type: 'SET_FILTER',
        title: 'Lọc Thiết Bị Bảo Trì',
        description: 'Lọc danh sách hiển thị các máy đang trong trạng thái bảo dưỡng',
        filterValue: 'MAINTENANCE',
        rawTranscript: transcript,
      };
    }

    const dev = resolveDeviceFromVoice(text, devices) || devices[0];
    return {
      type: 'SET_STATUS',
      title: `Đặt ${dev?.code || 'Máy'} Vào Trạng Thái Bảo Trì`,
      description: `Chuyển máy ${dev?.name || ''} (${dev?.code || ''}) sang chế độ BẢO TRÌ KỸ THUẬT (MAINTENANCE)`,
      targetDevice: dev,
      targetStatus: 'MAINTENANCE',
      rawTranscript: transcript,
    };
  }

  // 2. Action: Restore machine to RUNNING ("Đặt máy EDM-01 chạy lại", "Khôi phục máy EDM-01", "Vận hành lại")
  if (
    text.includes('chạy lại') ||
    text.includes('khôi phục') ||
    text.includes('vận hành lại') ||
    text.includes('tiếp tục chạy') ||
    text.includes('đang chạy') ||
    text.includes('start machine') ||
    text.includes('set to running')
  ) {
    if (text.startsWith('lọc') || text.includes('xem máy')) {
      return {
        type: 'SET_FILTER',
        title: 'Lọc Máy Đang Chạy',
        description: 'Lọc danh sách các máy đang hoạt động bình thường',
        filterValue: 'RUNNING',
        rawTranscript: transcript,
      };
    }

    const dev = resolveDeviceFromVoice(text, devices) || devices[0];
    return {
      type: 'SET_STATUS',
      title: `Khôi Phục ${dev?.code || 'Máy'} Hoạt Động (RUNNING)`,
      description: `Đưa máy ${dev?.name || ''} (${dev?.code || ''}) trở lại chu trình gia công tự động`,
      targetDevice: dev,
      targetStatus: 'RUNNING',
      rawTranscript: transcript,
    };
  }

  // 3. Action: Set machine to IDLE ("Tạm dừng máy", "Đặt máy sang trạng thái chờ", "chờ phôi")
  if (
    text.includes('tạm dừng') ||
    text.includes('trạng thái chờ') ||
    text.includes('chờ phôi') ||
    text.includes('set to idle') ||
    text.includes('dừng chờ')
  ) {
    const dev = resolveDeviceFromVoice(text, devices) || devices[0];
    return {
      type: 'SET_STATUS',
      title: `Chuyển ${dev?.code || 'Máy'} Sang Trạng Thái Chờ (IDLE)`,
      description: `Chuyển máy ${dev?.name || ''} (${dev?.code || ''}) sang chế độ tạm dừng chờ lệnh hoặc gá phôi`,
      targetDevice: dev,
      targetStatus: 'IDLE',
      rawTranscript: transcript,
    };
  }

  // 4. Action: Open AI Diagnosis ("Mở chẩn đoán AI máy EDM-01", "Chẩn đoán máy", "AI diagnosis")
  if (
    text.includes('chẩn đoán') ||
    text.includes('diagnosis') ||
    text.includes('kiểm tra lỗi') ||
    text.includes('hướng dẫn sửa')
  ) {
    const dev =
      resolveDeviceFromVoice(text, devices) ||
      devices.find((d) => d.status === 'ALARM_STOPPED') ||
      devices.find((d) => d.status === 'WARNING') ||
      devices[0];

    return {
      type: 'OPEN_DIAGNOSIS',
      title: `Mở AI Chẩn Đoán Cho ${dev?.code || 'Thiết Bị'}`,
      description: `Khởi chạy Trợ Lý AI Chẩn Đoán Căn Nguyên & Hướng Dẫn Kỹ Thuật cho ${dev?.name || ''}`,
      targetDevice: dev,
      rawTranscript: transcript,
    };
  }

  // 5. Action: Open Machine Details / Notes ("Xem chi tiết máy EDM-01", "Mở thông số máy")
  if (
    text.includes('chi tiết') ||
    text.includes('thông số') ||
    text.includes('ghi chú máy') ||
    text.includes('bàn giao ca') ||
    text.includes('open details')
  ) {
    const dev = resolveDeviceFromVoice(text, devices) || devices[0];
    return {
      type: 'OPEN_DETAILS',
      title: `Mở Chi Tiết Máy ${dev?.code || ''}`,
      description: `Xem bảng điều khiển kỹ thuật số, lịch sử bảo dưỡng & Sổ ghi chú nhanh ca trực của ${dev?.name || ''}`,
      targetDevice: dev,
      rawTranscript: transcript,
    };
  }

  // 5.5 Action: AI Root Cause Analysis ("Phân tích nguyên nhân gốc rễ", "Mở module RCA", "Phân tích dừng máy")
  if (
    text.includes('gốc rễ') ||
    text.includes('root cause') ||
    text.includes('rca') ||
    (text.includes('nguyên nhân') && (text.includes('dừng') || text.includes('sự cố') || text.includes('lỗi'))) ||
    text.includes('phân tích sự cố')
  ) {
    const dev =
      resolveDeviceFromVoice(text, devices) ||
      devices.find((d) => d.status === 'ALARM_STOPPED') ||
      devices.find((d) => d.status === 'WARNING') ||
      devices[0];

    return {
      type: 'OPEN_RCA',
      title: dev ? `Phân Tích Nguyên Nhân Gốc Rễ ${dev.code}` : 'Mở Module AI Phân Tích Nguyên Nhân Gốc Rễ',
      description: 'Khởi chạy phân tích 5-Whys, Ishikawa và giải pháp khắc phục sự cố dừng máy',
      targetDevice: dev || undefined,
      rawTranscript: transcript,
    };
  }

  // 6. Action: High Contrast Mode ("Bật chế độ tương phản cao", "Tắt tương phản cao", "High contrast")
  if (
    text.includes('tương phản') ||
    text.includes('contrast') ||
    text.includes('chói sáng') ||
    text.includes('thiếu sáng')
  ) {
    return {
      type: 'TOGGLE_CONTRAST',
      title: 'Chuyển Đổi Giao Diện Tương Phản Cao',
      description: 'Chuyển đổi chế độ màu sắc tương phản cao (Vàng - Đen công nghiệp) cho điều kiện xưởng khắt khe',
      rawTranscript: transcript,
    };
  }

  // 7. Action: Filter devices ("Lọc máy đang dừng", "Lọc sự cố", "Lọc tất cả máy")
  if (
    text.includes('lọc') ||
    text.includes('danh sách máy') ||
    text.includes('hiển thị máy')
  ) {
    if (text.includes('dừng') || text.includes('sự cố') || text.includes('lỗi') || text.includes('alarm')) {
      return {
        type: 'SET_FILTER',
        title: 'Lọc Máy Bị Sự Cố Dừng',
        description: 'Chỉ hiển thị các máy đang gặp báo động dừng khẩn cấp (ALARM_STOPPED)',
        filterValue: 'ALARM',
        rawTranscript: transcript,
      };
    }
    if (text.includes('cắt dây') || text.includes('wire')) {
      return {
        type: 'SET_FILTER',
        title: 'Lọc Máy Cắt Dây (Wire EDM)',
        description: 'Chỉ hiển thị các dòng máy cắt dây EDM',
        filterValue: 'WIRE_EDM',
        rawTranscript: transcript,
      };
    }
    if (text.includes('xung') || text.includes('sinker')) {
      return {
        type: 'SET_FILTER',
        title: 'Lọc Máy Xung Điện Định Hình (Sinker EDM)',
        description: 'Chỉ hiển thị các dòng máy xung điện định hình',
        filterValue: 'SINKER_EDM',
        rawTranscript: transcript,
      };
    }
    if (text.includes('tất cả') || text.includes('toàn bộ')) {
      return {
        type: 'SET_FILTER',
        title: 'Hiển Thị Toàn Bộ Máy',
        description: 'Xóa bộ lọc trạng thái và hiển thị tất cả thiết bị xưởng',
        filterValue: 'ALL',
        rawTranscript: transcript,
      };
    }
  }

  // 8. Action: QR Code Scanner ("Quét mã QR", "Mở quét QR")
  if (text.includes('quét') || text.includes('qr') || text.includes('barcode')) {
    return {
      type: 'OPEN_QR',
      title: 'Khởi Động Quét Mã QR Thân Máy',
      description: 'Bật máy ảnh để nhận diện mã QR dán trên thân máy thực tế',
      rawTranscript: transcript,
    };
  }

  // 9. Action: Keyboard Shortcuts
  if (text.includes('phím tắt') || text.includes('shortcut')) {
    return {
      type: 'OPEN_SHORTCUTS',
      title: 'Mở Bảng Phím Tắt Công Nghiệp',
      description: 'Hiển thị các tổ hợp phím tắt nhanh và thống kê hiệu suất KTV',
      rawTranscript: transcript,
    };
  }

  // 10. Default: Normal search term query
  return {
    type: 'SEARCH',
    title: `Tìm Kiếm Dữ Liệu: "${transcript}"`,
    description: `Lọc máy móc, mã lỗi, model hoặc KTV theo từ khóa "${transcript}"`,
    rawTranscript: transcript,
  };
}

export const VoiceSearchBar: React.FC<VoiceSearchBarProps> = ({
  value,
  onChange,
  devices,
  onToast,
  onSetDeviceStatus,
  onOpenDiagnosis,
  onOpenMachineDetails,
  onOpenQRScanner,
  onToggleHighContrast,
  isHighContrast,
  onSelectFilter,
  onOpenShortcuts,
  onOpenRCA,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [micStatusMsg, setMicStatusMsg] = useState('');
  const [speechLang, setSpeechLang] = useState<'vi-VN' | 'en-US'>('vi-VN');
  const [showCommandCheatSheet, setShowCommandCheatSheet] = useState(false);
  const [lastExecutedAction, setLastExecutedAction] = useState<ParsedVoiceAction | null>(null);
  const [detectedActionPreview, setDetectedActionPreview] = useState<ParsedVoiceAction | null>(null);

  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Play audio chime when mic toggles or command executes
  const playMicChime = (tone: 'start' | 'stop' | 'success' | 'action') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (tone === 'start') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (tone === 'action') {
        // High industrial double beep for successful action execution
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.24);
      } else if (tone === 'success') {
        osc.frequency.setValueAtTime(659, now);
        osc.frequency.exponentialRampToValueAtTime(1046, now + 0.15);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.22);
      } else {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch {
      // Audio sandbox fallback
    }
  };

  // Execute detected voice action
  const executeParsedAction = async (action: ParsedVoiceAction) => {
    setLastExecutedAction(action);
    setDetectedActionPreview(null);
    playMicChime('action');

    switch (action.type) {
      case 'SET_STATUS':
        if (action.targetDevice && action.targetStatus && onSetDeviceStatus) {
          await onSetDeviceStatus(
            action.targetDevice.id,
            action.targetStatus,
            `Cập nhật qua khẩu lệnh: "${action.rawTranscript}"`
          );
        } else if (onToast) {
          onToast(`🎙️ Đã nhận lệnh: ${action.title}`);
        }
        break;

      case 'OPEN_DIAGNOSIS':
        if (action.targetDevice && onOpenDiagnosis) {
          onOpenDiagnosis(action.targetDevice);
          if (onToast) {
            onToast(`⚡ [Giọng Nói] Đã mở AI Chẩn Đoán cho ${action.targetDevice.name} (${action.targetDevice.code})`);
          }
        }
        break;

      case 'OPEN_DETAILS':
        if (action.targetDevice && onOpenMachineDetails) {
          onOpenMachineDetails(action.targetDevice);
          if (onToast) {
            onToast(`📋 [Giọng Nói] Đã mở Chi Tiết cho ${action.targetDevice.name} (${action.targetDevice.code})`);
          }
        }
        break;

      case 'TOGGLE_CONTRAST':
        if (onToggleHighContrast) {
          onToggleHighContrast();
        }
        break;

      case 'SET_FILTER':
        if (action.filterValue && onSelectFilter) {
          onSelectFilter(action.filterValue);
          if (onToast) {
            onToast(`🔍 [Giọng Nói] ${action.title}`);
          }
        }
        break;

      case 'OPEN_QR':
        if (onOpenQRScanner) {
          onOpenQRScanner();
          if (onToast) {
            onToast(`📷 [Giọng Nói] Đang mở Quét Mã QR Thân Máy`);
          }
        }
        break;

      case 'OPEN_SHORTCUTS':
        if (onOpenShortcuts) {
          onOpenShortcuts();
          if (onToast) {
            onToast(`⌨️ [Giọng Nói] Đã mở Bảng Phím Tắt`);
          }
        }
        break;

      case 'OPEN_RCA':
        if (onOpenRCA) {
          onOpenRCA(action.targetDevice?.id, action.targetDevice?.activeIncident?.errorCode || 'E-102');
          if (onToast) {
            onToast(`⚡ [Giọng Nói] Đã mở Module AI Phân Tích Nguyên Nhân Gốc Rễ (RCA)`);
          }
        }
        break;

      case 'SEARCH':
      default:
        onChange(action.rawTranscript);
        if (onToast) {
          onToast(`🔍 Đã tìm kiếm: "${action.rawTranscript}"`);
        }
        break;
    }
  };

  // Process transcript once speech recognition yields a final or candidate result
  const handleFinalSpeechTranscript = (transcript: string) => {
    const cleaned = transcript.trim();
    if (!cleaned) return;

    const action = parseVoiceAction(cleaned, devices);
    executeParsedAction(action);
  };

  // Fallback simulation with realistic EDM keywords & commands if Web Speech API is denied or unsupported
  const simulateVoiceInput = (customCommand?: string) => {
    setIsListening(true);
    playMicChime('start');
    setMicStatusMsg('Đang mô phỏng khẩu lệnh giọng nói kỹ thuật viên...');

    const sampleCommands = [
      'Đặt máy EDM-01 vào trạng thái bảo trì',
      'Khôi phục máy EDM-01 đang chạy',
      'Chuyển máy EDM-02 sang trạng thái chờ',
      'Mở chẩn đoán AI máy EDM-01',
      'Xem chi tiết máy EDM-01',
      'Chuyển chế độ tương phản cao',
      'Lọc máy bị sự cố dừng',
      'Quét mã QR máy',
      'ALARM-204',
      'Makino',
      'SPW-303',
    ];

    const picked = customCommand || sampleCommands[Math.floor(Math.random() * sampleCommands.length)];

    setTimeout(() => {
      setInterimText(picked);
      const preview = parseVoiceAction(picked, devices);
      setDetectedActionPreview(preview);
    }, 500);

    setTimeout(() => {
      setIsListening(false);
      setInterimText('');
      setMicStatusMsg('');
      handleFinalSpeechTranscript(picked);
    }, 1200);
  };

  const startVoiceSearch = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      simulateVoiceInput();
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognitionAPI();
      rec.continuous = false; // Single command utterance
      rec.interimResults = true;
      rec.lang = speechLang;

      rec.onstart = () => {
        setIsListening(true);
        setInterimText('');
        setDetectedActionPreview(null);
        playMicChime('start');
        setMicStatusMsg(`Đang nghe... Hãy ra lệnh: "Đặt máy EDM-01 vào trạng thái bảo trì", "Mở chẩn đoán AI", hoặc nói mã lỗi.`);
      };

      rec.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }

        if (currentTranscript) {
          let cleaned = currentTranscript.trim();
          // Normalize technical speech phrases
          if (/e\s*102/i.test(cleaned)) cleaned = cleaned.replace(/e\s*102/i, 'E-102');
          if (/spw\s*303/i.test(cleaned)) cleaned = cleaned.replace(/spw\s*303/i, 'SPW-303');
          if (/alarm\s*204/i.test(cleaned)) cleaned = cleaned.replace(/alarm\s*204/i, 'ALARM-204');

          setInterimText(cleaned);

          // Real-time preview of action intent
          const preview = parseVoiceAction(cleaned, devices);
          setDetectedActionPreview(preview);
        }
      };

      rec.onerror = (event: any) => {
        console.warn('SpeechRecognition search error:', event.error);
        if (event.error === 'not-allowed') {
          simulateVoiceInput();
        } else {
          setMicStatusMsg(`Lỗi thu âm: ${event.error}`);
          setIsListening(false);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        setMicStatusMsg('');
        playMicChime('stop');
        if (interimText) {
          handleFinalSpeechTranscript(interimText);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('SpeechRecognition failed to start:', err);
      simulateVoiceInput();
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
    setMicStatusMsg('');
    playMicChime('stop');
  };

  const toggleListening = () => {
    if (isListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  };

  // Clean up
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  // Quick Preset Sample Commands for Industrial Hands-Free Workshop
  const sampleVoicePresets: { label: string; command: string; icon: any; color: string }[] = [
    {
      label: 'Đặt EDM-01 vào bảo trì',
      command: 'Đặt máy EDM-01 vào trạng thái bảo trì',
      icon: Wrench,
      color: 'border-blue-500/40 text-blue-300 hover:bg-blue-500/10',
    },
    {
      label: 'Khôi phục EDM-01 chạy lại',
      command: 'Khôi phục máy EDM-01 đang chạy',
      icon: Play,
      color: 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10',
    },
    {
      label: 'Mở chẩn đoán AI máy EDM-01',
      command: 'Mở chẩn đoán AI máy EDM-01',
      icon: Sparkles,
      color: 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10',
    },
    {
      label: 'Chuyển EDM-02 sang trạng thái chờ',
      command: 'Chuyển máy EDM-02 sang trạng thái chờ',
      icon: Pause,
      color: 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10',
    },
    {
      label: 'Đổi chế độ tương phản cao',
      command: 'Chuyển chế độ tương phản cao',
      icon: Contrast,
      color: 'border-yellow-400/50 text-yellow-300 hover:bg-yellow-400/10',
    },
    {
      label: 'Xem chi tiết máy EDM-01',
      command: 'Xem chi tiết máy EDM-01',
      icon: Info,
      color: 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10',
    },
    {
      label: 'Lọc máy dừng sự cố',
      command: 'Lọc máy bị sự cố dừng',
      icon: AlertTriangle,
      color: 'border-red-500/40 text-red-300 hover:bg-red-500/10',
    },
    {
      label: 'Quét mã QR máy',
      command: 'Quét mã QR máy',
      icon: QrCode,
      color: 'border-orange-500/40 text-orange-300 hover:bg-orange-500/10',
    },
  ];

  return (
    <div id="tour-voice-search" className="relative w-full sm:w-80 md:w-96">
      {/* Search Input Container */}
      <div
        className={`relative flex items-center w-full rounded-xl bg-slate-950 border transition shadow-inner ${
          isListening
            ? 'border-red-500 ring-2 ring-red-500/50 shadow-red-950/40 bg-slate-900/90'
            : value
            ? 'border-amber-500/60 ring-1 ring-amber-500/30'
            : 'border-slate-800 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/30'
        }`}
      >
        <Search
          className={`absolute left-3 h-4 w-4 transition-colors ${
            isListening ? 'text-red-400 animate-pulse' : value ? 'text-amber-400' : 'text-slate-400'
          }`}
        />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            isListening
              ? 'Đang nghe... Ra lệnh: "Đặt máy EDM-01 vào trạng thái bảo trì"'
              : 'Tìm kiếm hoặc ra lệnh giọng nói (Ví dụ: Đặt máy vào bảo trì)...'
          }
          className="w-full bg-transparent pl-9 pr-24 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
        />

        {/* Clear Search Input */}
        {value && !isListening && (
          <button
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-16 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Xóa nội dung tìm kiếm"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Voice Command Helper Trigger Button */}
        <button
          type="button"
          onClick={() => setShowCommandCheatSheet((prev) => !prev)}
          title="Xem danh sách khẩu lệnh giọng nói công nghiệp & thử nghiệm"
          className={`absolute right-9 flex h-6 w-6 items-center justify-center rounded-lg border text-[11px] font-bold transition ${
            showCommandCheatSheet
              ? 'border-amber-500 bg-amber-500/20 text-amber-300'
              : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
        </button>

        {/* Voice-to-Text / Action Microphone Button */}
        <button
          type="button"
          onClick={toggleListening}
          title={
            isListening
              ? 'Đang thu âm giọng nói... Bấm để dừng'
              : 'Ra lệnh giọng nói rảnh tay: "Đặt máy EDM-01 vào trạng thái bảo trì", "Khôi phục máy", "Mở chẩn đoán AI"...'
          }
          className={`absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg transition active:scale-90 ${
            isListening
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 animate-pulse'
              : 'bg-slate-800/90 text-slate-300 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 border border-slate-700/60'
          }`}
        >
          {isListening ? (
            <MicOff className="h-3.5 w-3.5 text-white animate-spin" />
          ) : (
            <Mic className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Real-time Voice Audio Visualizer & Detected Action Preview */}
      {isListening && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-red-500/50 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
              <span className="font-semibold text-red-300">Đang lắng nghe khẩu lệnh...</span>
            </div>

            {/* Language toggle: vi-VN / en-US */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSpeechLang('vi-VN')}
                className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold transition ${
                  speechLang === 'vi-VN'
                    ? 'bg-red-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => setSpeechLang('en-US')}
                className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold transition ${
                  speechLang === 'en-US'
                    ? 'bg-red-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Sound Wave Animation */}
          <div className="mt-2.5 flex items-center justify-center gap-1 h-4">
            <span className="w-1 bg-red-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3"></span>
            <span className="w-1 bg-red-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-4"></span>
            <span className="w-1 bg-amber-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-2"></span>
            <span className="w-1 bg-red-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-4"></span>
            <span className="w-1 bg-amber-300 rounded-full animate-[pulse_0.3s_ease-in-out_infinite] h-3"></span>
          </div>

          {/* Current Speech Transcript */}
          <p className="mt-2 text-center font-mono text-xs text-amber-300 truncate font-semibold">
            {interimText ? `"${interimText}"` : 'Ví dụ: "Đặt máy EDM-01 vào trạng thái bảo trì"'}
          </p>

          {/* Real-time Detected Action Preview Badge */}
          {detectedActionPreview && detectedActionPreview.type !== 'SEARCH' && (
            <div className="mt-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-2 text-left animate-in fade-in">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                <Zap className="h-3 w-3 text-emerald-400 animate-pulse" />
                <span>Nhận diện khẩu lệnh: {detectedActionPreview.title}</span>
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-tight">
                {detectedActionPreview.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Last Executed Action Banner (Sticky feedback after action executes) */}
      {lastExecutedAction && !isListening && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl border border-emerald-500/40 bg-slate-950/95 p-2 shadow-xl backdrop-blur-md animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{lastExecutedAction.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setLastExecutedAction(null)}
              className="text-slate-400 hover:text-white transition text-[10px]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Industrial Voice Command Cheat Sheet Popover */}
      {showCommandCheatSheet && (
        <div className="absolute left-0 right-0 sm:left-auto sm:right-0 sm:w-96 top-full mt-2 z-50 rounded-2xl border border-slate-700 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Mic className="h-3.5 w-3.5" />
              </div>
              <h4 className="text-xs font-bold text-white">Khẩu Lệnh Giọng Nói Rảnh Tay</h4>
            </div>
            <button
              type="button"
              onClick={() => setShowCommandCheatSheet(false)}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Hỗ trợ KTV ra lệnh trực tiếp khi đang thao tác máy trong xưởng. Bạn có thể nhấn trực tiếp vào các nút bên dưới để mô phỏng và thực thi khẩu lệnh tức thì:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1">
            {sampleVoicePresets.map((preset, idx) => {
              const Icon = preset.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setShowCommandCheatSheet(false);
                    simulateVoiceInput(preset.command);
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-medium transition active:scale-95 ${preset.color}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{preset.label}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Cú pháp khẩu lệnh thông dụng:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-300">
              <li><code className="text-amber-300">"Đặt máy [mã máy] vào trạng thái bảo trì"</code></li>
              <li><code className="text-emerald-300">"Khôi phục máy [mã máy] đang chạy"</code></li>
              <li><code className="text-amber-300">"Mở chẩn đoán AI máy [mã máy]"</code></li>
              <li><code className="text-yellow-300">"Chuyển chế độ tương phản cao"</code></li>
              <li><code className="text-red-300">"Lọc máy bị sự cố dừng"</code></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
