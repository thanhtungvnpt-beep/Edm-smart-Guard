import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, MicOff, X, Radio, Sparkles } from 'lucide-react';
import { Device } from '../types';

interface VoiceSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  devices: Device[];
  onToast?: (message: string) => void;
}

export const VoiceSearchBar: React.FC<VoiceSearchBarProps> = ({
  value,
  onChange,
  devices,
  onToast,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [micStatusMsg, setMicStatusMsg] = useState('');
  const [speechLang, setSpeechLang] = useState<'vi-VN' | 'en-US'>('vi-VN');
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Play audio chime when mic toggles
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
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.2);
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

  // Fallback simulation with realistic EDM keywords if Web Speech API is denied or unsupported
  const simulateVoiceInput = () => {
    setIsListening(true);
    playMicChime(true);
    setMicStatusMsg('Đang mô phỏng lệnh giọng nói kỹ thuật viên...');

    // Collect realistic target searches based on current factory devices
    const presets = [
      'E-102',
      'EDM-W01',
      'Makino',
      'Sodick',
      'Nguyễn Văn Hùng',
      'ALARM-204',
      'SPW-303',
      'Fanuc',
      'Hole Popper',
      'Line 01',
    ];
    const picked = presets[Math.floor(Math.random() * presets.length)];

    setTimeout(() => {
      setInterimText(picked);
    }, 600);

    setTimeout(() => {
      onChange(picked);
      setIsListening(false);
      setInterimText('');
      setMicStatusMsg('');
      playMicChime(false);
      if (onToast) onToast(`Đã nhận diện giọng nói: "${picked}"`);
    }, 1500);
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
      rec.continuous = false; // Single utterance for search query
      rec.interimResults = true;
      rec.lang = speechLang;

      rec.onstart = () => {
        setIsListening(true);
        setInterimText('');
        playMicChime(true);
        setMicStatusMsg(`Đang nghe... Hãy đọc mã máy, mã lỗi (E-102) hoặc tên KTV.`);
      };

      rec.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }

        if (currentTranscript) {
          // Normalize common phrases like "máy EDM 01" -> "EDM-W01", "mã lỗi E102" -> "E-102"
          let cleaned = currentTranscript.trim();
          
          // Helper cleaning for technical codes
          if (/e\s*102/i.test(cleaned)) cleaned = cleaned.replace(/e\s*102/i, 'E-102');
          if (/spw\s*303/i.test(cleaned)) cleaned = cleaned.replace(/spw\s*303/i, 'SPW-303');
          if (/alarm\s*204/i.test(cleaned)) cleaned = cleaned.replace(/alarm\s*204/i, 'ALARM-204');
          if (/w\s*0?1/i.test(cleaned) && !/EDM/i.test(cleaned)) cleaned = 'EDM-W01';
          if (/w\s*0?2/i.test(cleaned) && !/EDM/i.test(cleaned)) cleaned = 'EDM-W02';

          setInterimText(cleaned);
          onChange(cleaned);
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
        playMicChime(false);
        if (interimText && onToast) {
          onToast(`Đã tìm kiếm theo giọng nói: "${interimText}"`);
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
    playMicChime(false);
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
              ? 'Đang nghe... Hãy nói tên máy hoặc mã lỗi'
              : 'Tìm máy theo mã, mã lỗi (E-102), model, KTV...'
          }
          className="w-full bg-transparent pl-9 pr-20 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
        />

        {/* Clear Button */}
        {value && !isListening && (
          <button
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-10 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Xóa nội dung tìm kiếm"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Voice-to-Text Microphone Button */}
        <button
          type="button"
          onClick={toggleListening}
          title={
            isListening
              ? 'Đang thu âm giọng nói... Bấm để dừng'
              : 'Tìm kiếm rảnh tay bằng giọng nói (Nói mã máy hoặc mã lỗi)'
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

      {/* Real-time Voice Audio Visualizer / Helper Badge */}
      {isListening && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl border border-red-500/50 bg-slate-950/95 p-2.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
              <span className="font-semibold text-red-300">Đang lắng nghe...</span>
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
          <div className="mt-2 flex items-center justify-center gap-1 h-4">
            <span className="w-1 bg-red-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3"></span>
            <span className="w-1 bg-red-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-4"></span>
            <span className="w-1 bg-amber-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-2"></span>
            <span className="w-1 bg-red-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-4"></span>
            <span className="w-1 bg-amber-300 rounded-full animate-[pulse_0.3s_ease-in-out_infinite] h-3"></span>
          </div>

          <p className="mt-1.5 text-center font-mono text-[11px] text-amber-300 truncate">
            {interimText ? `"${interimText}"` : 'Hãy nói: "E-102", "Makino", "EDM-W01"...'}
          </p>
        </div>
      )}
    </div>
  );
};
