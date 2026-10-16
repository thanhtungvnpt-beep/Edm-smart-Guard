import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Sparkles,
  Users,
  Radio,
  Pin,
  PinOff,
  Image as ImageIcon,
  Mic,
  MicOff,
  Paperclip,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ThumbsUp,
  Lightbulb,
  ShieldAlert,
  Flame,
  Gauge,
  Zap,
  Wrench,
  Bot,
  UserCheck,
  ChevronDown,
  RefreshCw,
  Clock,
  ExternalLink,
  HelpCircle,
  Eye,
  Camera,
  X,
} from 'lucide-react';
import { Device, Technician, IncidentChatMessage, ChatParticipant } from '../types';

interface IncidentGroupChatProps {
  device: Device;
  technicians?: Technician[];
  onOpenRepairReport?: (device: Device) => void;
  onOpenInventory?: (partIdOrSku: string) => void;
}

const DEFAULT_PERSONAS: Technician[] = [
  {
    id: 'tech-01',
    name: 'Nguyễn Văn Hùng',
    role: 'Kỹ sư Trưởng Điện - PLC & EDM',
    phone: '0983.124.567',
    email: 'hung.nguyen@factory-edm.vn',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    shift: 'Ca Sáng (06:00 - 14:30)',
    activeStatus: 'ON_DUTY',
    fcmToken: 'fcm_hung',
  },
  {
    id: 'tech-02',
    name: 'Trần Minh Tuấn',
    role: 'Kỹ sư Thủy lực & Khí nén EDM',
    phone: '0912.876.543',
    email: 'tuan.tran@factory-edm.vn',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    shift: 'Ca Sáng (06:00 - 14:30)',
    activeStatus: 'ON_DUTY',
    fcmToken: 'fcm_tuan',
  },
  {
    id: 'tech-03',
    name: 'Lê Hoàng Nam',
    role: 'Chuyên viên Công nghệ Cắt Dây EDM',
    phone: '0904.332.119',
    email: 'nam.le@factory-edm.vn',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    shift: 'Ca Chiều (14:00 - 22:30)',
    activeStatus: 'ON_DUTY',
    fcmToken: 'fcm_nam',
  },
  {
    id: 'tech-04',
    name: 'Phạm Đức Anh',
    role: 'Kỹ thuật viên Vận hành & Bảo trì 4.0',
    phone: '0977.889.001',
    email: 'ducanh.pham@factory-edm.vn',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    shift: 'Ca Đêm (22:00 - 06:30)',
    activeStatus: 'ON_DUTY',
    fcmToken: 'fcm_ducanh',
  },
];

const PRESET_ACTION_TAGS = [
  {
    type: 'SAFE_POWER_CUT',
    label: '⚡ Đã ngắt nguồn điện an toàn (LOTO)',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30',
  },
  {
    type: 'PRESSURE_CHECK',
    label: '💧 Đã đo áp lực nước xả (< 0.6 Bar)',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30',
  },
  {
    type: 'INSULATION_TEST',
    label: '🧪 Đã đo điện trở cách điện bằng Megohmmeter',
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30',
  },
  {
    type: 'SERVO_INSPECT',
    label: '⚙️ Đã kiểm tra giắc encoder & cáp truyền xung Z',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30',
  },
  {
    type: 'NEED_ASSISTANCE',
    label: '🆘 Cần 1 kỹ sư điện hỗ trợ đo sóng dao động',
    color: 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30',
  },
  {
    type: 'PARTS_ARRIVED',
    label: '📦 Đã xuất kho vật tư lõi lọc 3um & que nỉ kim cương',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30',
  },
];

const SAMPLE_ATTACHMENTS = [
  {
    label: 'Sơ đồ mạch cụm bơm xả đáy PT-102',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Ảnh chụp đầu dẫn hướng kim cương Diamond Guide',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Ảnh chụp đồng hồ hiển thị lỗi màn hình CNC',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
  },
];

export const IncidentGroupChat: React.FC<IncidentGroupChatProps> = ({
  device,
  technicians = DEFAULT_PERSONAS,
  onOpenRepairReport,
  onOpenInventory,
}) => {
  const [messages, setMessages] = useState<IncidentChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ChatParticipant[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isAiConsulting, setIsAiConsulting] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showActionTags, setShowActionTags] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Active User Persona
  const [currentTech, setCurrentTech] = useState<Technician>(() => {
    if (device.assignedTechnician) return device.assignedTechnician;
    return technicians[0] || DEFAULT_PERSONAS[0];
  });

  // Voice recognition states
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Auto-scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 1. Initial Load from REST API (Guarantees immediate offline & historical messages)
  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`/api/devices/${device.id}/chat`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
        if (data.activeUsers && Array.isArray(data.activeUsers)) {
          setActiveUsers(data.activeUsers);
        }
      }
    } catch (err) {
      console.warn('Initial chat fetch fallback:', err);
    }
  };

  // 2. Setup WebSocket Connection
  useEffect(() => {
    fetchChatHistory();

    let isUnmounted = false;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      if (isUnmounted) return;
      setIsConnecting(true);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          setIsConnected(true);
          setIsConnecting(false);

          // Join incident chat room for this device
          ws.send(
            JSON.stringify({
              type: 'JOIN_ROOM',
              deviceId: device.id,
              user: {
                id: currentTech.id,
                name: currentTech.name,
                role: currentTech.role,
                avatar: currentTech.avatar,
              },
            })
          );
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'ROOM_INIT') {
              if (data.deviceId === device.id) {
                setMessages(data.messages || []);
                if (data.activeUsers) setActiveUsers(data.activeUsers);
              }
            } else if (data.type === 'PRESENCE_UPDATE') {
              if (data.deviceId === device.id && data.activeUsers) {
                setActiveUsers(data.activeUsers);
              }
            } else if (data.type === 'NEW_MESSAGE') {
              if (data.deviceId === device.id && data.message) {
                setMessages((prev) => {
                  const exists = prev.some((m) => m.id === data.message.id);
                  if (exists) return prev;
                  return [...prev, data.message];
                });
                if (data.message.type === 'AI_ADVICE') {
                  setIsAiConsulting(false);
                }
              }
            } else if (data.type === 'USER_TYPING') {
              if (data.deviceId === device.id) {
                setTypingUsers((prev) => {
                  if (data.isTyping) {
                    if (!prev.includes(data.userName)) return [...prev, data.userName];
                    return prev;
                  } else {
                    return prev.filter((name) => name !== data.userName);
                  }
                });
              }
            } else if (data.type === 'MESSAGE_PIN_UPDATED') {
              if (data.deviceId === device.id) {
                setMessages((prev) =>
                  prev.map((m) => (m.id === data.messageId ? { ...m, pinned: data.pinned } : m))
                );
              }
            } else if (data.type === 'MESSAGE_REACTION_UPDATED') {
              if (data.deviceId === device.id) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === data.messageId ? { ...m, reactions: data.reactions } : m
                  )
                );
              }
            }
          } catch (err) {
            console.error('Error handling WebSocket message:', err);
          }
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          setIsConnecting(false);
          // Try to reconnect in 3 seconds
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (err) => {
          console.warn('WebSocket connection error:', err);
          ws.close();
        };
      } catch (err) {
        console.warn('Failed to initialize WebSocket:', err);
        setIsConnecting(false);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [device.id, currentTech]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Handle Typing status broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputContent(e.target.value);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'TYPING',
          deviceId: device.id,
          userName: currentTech.name,
          isTyping: true,
        })
      );

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'TYPING',
              deviceId: device.id,
              userName: currentTech.name,
              isTyping: false,
            })
          );
        }
      }, 1500);
    }
  };

  // 3. Send Message
  const handleSendMessage = async (
    text?: string,
    actionTag?: { type: string; label: string; color: string },
    imageUrl?: string,
    askAIOverride: boolean = false
  ) => {
    const content = text !== undefined ? text : inputContent.trim();
    if (!content && !actionTag && !imageUrl) return;

    const shouldAskAI =
      askAIOverride || (content && (content.toLowerCase().includes('@ai') || content.toLowerCase().includes('hỏi ai')));

    if (shouldAskAI) {
      setIsAiConsulting(true);
    }

    const payload = {
      senderId: currentTech.id,
      senderName: currentTech.name,
      senderRole: currentTech.role,
      senderAvatar: currentTech.avatar,
      content,
      type: actionTag ? 'ACTION_TAKEN' : imageUrl ? 'TEXT' : 'TEXT',
      imageUrl,
      actionTag,
      askAI: shouldAskAI,
    };

    // If WebSocket is open, send via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'SEND_MESSAGE',
          deviceId: device.id,
          incidentErrorCode: device.activeIncident?.errorCode,
          message: payload,
          askAI: shouldAskAI,
        })
      );
    } else {
      // Fallback to HTTP POST
      try {
        const res = await fetch(`/api/devices/${device.id}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.message) {
            setMessages((prev) => [...prev, data.message]);
          }
        }
      } catch (err) {
        console.error('Failed to post message via HTTP:', err);
      }
    }

    setInputContent('');
    setSelectedPhoto(null);
    setShowActionTags(false);
    setShowAttachmentMenu(false);
  };

  // 4. Share Current Machine Telemetry
  const handleShareTelemetry = () => {
    if (!device.telemetry) return;
    const content = `📊 [ĐỒNG BỘ TELEMETRY HIỆN THỜI - MÁY ${device.code}]\n• Áp suất nước xả: ${device.telemetry.dielectricPressure} Bar (Chuẩn: 1.2 - 2.0)\n• Dòng đỉnh IP: ${device.telemetry.peakCurrent} A (Chuẩn: 15 - 28)\n• Điện áp xả: ${device.telemetry.dischargeVoltage} V (Chuẩn: 40 - 55)\n• Độ rung cơ khí: ${device.telemetry.vibration} mm/s\n• Nhiệt độ bồn dầu: ${device.telemetry.dielectricTemp} °C`;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'SEND_MESSAGE',
          deviceId: device.id,
          incidentErrorCode: device.activeIncident?.errorCode,
          message: {
            senderId: currentTech.id,
            senderName: currentTech.name,
            senderRole: currentTech.role,
            senderAvatar: currentTech.avatar,
            content,
            type: 'TELEMETRY_SHARE',
            telemetrySnapshot: device.telemetry,
          },
        })
      );
    } else {
      handleSendMessage(content);
    }
  };

  // 5. Ask AI in Group Chat
  const handleAskAICopilot = () => {
    setIsAiConsulting(true);
    handleSendMessage(
      `@AI Phân tích dữ liệu sự cố và đề xuất hướng xử lý kỹ thuật tối ưu nhất cho kíp trực!`,
      undefined,
      undefined,
      true
    );
  };

  // 6. Toggle Pin Message
  const handleTogglePin = async (messageId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'TOGGLE_PIN',
          deviceId: device.id,
          messageId,
        })
      );
    } else {
      try {
        await fetch(`/api/devices/${device.id}/chat/${messageId}/pin`, { method: 'POST' });
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, pinned: !m.pinned } : m))
        );
      } catch (err) {
        console.error('Error toggling pin:', err);
      }
    }
  };

  // 7. Add Reaction
  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'ADD_REACTION',
          deviceId: device.id,
          messageId,
          emoji,
        })
      );
    } else {
      try {
        await fetch(`/api/devices/${device.id}/chat/${messageId}/reaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
        });
      } catch (err) {
        console.error('Error adding reaction:', err);
      }
    }
  };

  // 8. Voice Recognition
  const toggleVoiceMic = () => {
    if (isVoiceListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsVoiceListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn chưa hỗ trợ Web Speech API. Bạn có thể gõ nội dung bằng bàn phím.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'vi-VN';

      rec.onstart = () => {
        setIsVoiceListening(true);
      };

      rec.onresult = (e: any) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        if (transcript) {
          setInputContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      rec.onerror = () => {
        setIsVoiceListening(false);
      };

      rec.onend = () => {
        setIsVoiceListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setIsVoiceListening(false);
    }
  };

  // Pinned messages list
  const pinnedMessages = useMemo(() => {
    return messages.filter((m) => m.pinned);
  }, [messages]);

  return (
    <div className="flex flex-col h-[680px] max-h-[82vh] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* 1. ROOM HEADER & STATUS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
              <Users className="h-5 w-5" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${
                isConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : isConnecting
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              title={
                isConnected
                  ? 'WebSocket Trực Tuyến - Đồng bộ tức thời'
                  : isConnecting
                  ? 'Đang kết nối lại máy chủ...'
                  : 'Ngoại tuyến'
              }
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Kênh Thảo Luận Kỹ Thuật Sự Cố</span>
                <span className="rounded bg-red-500/20 border border-red-500/40 px-1.5 py-0.5 text-[10px] font-mono font-bold text-red-300">
                  {device.activeIncident?.errorCode || 'E-102'}
                </span>
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                <span>{isConnected ? 'WebSocket Live' : 'Đang đồng bộ...'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{device.name} ({device.code})</span>
              <span>•</span>
              <span className="text-purple-300 font-medium">
                {activeUsers.length > 0 ? `${activeUsers.length} KTV trực tuyến` : '3 KTV đang theo dõi'}
              </span>
            </p>
          </div>
        </div>

        {/* Persona Switcher & Live Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Persona selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center gap-2 rounded-xl bg-slate-800/90 border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700/80 transition"
              title="Thay đổi kỹ thuật viên đang đăng nhập"
            >
              <img
                src={currentTech.avatar}
                alt={currentTech.name}
                className="h-5 w-5 rounded-full object-cover ring-1 ring-purple-500/50"
              />
              <span className="max-w-[110px] sm:max-w-[150px] truncate font-medium">
                {currentTech.name}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Chọn Vai Kỹ Thuật Viên Ca Trực:
                </div>
                <div className="space-y-1 mt-1">
                  {technicians.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setCurrentTech(t);
                        setShowPersonaMenu(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-xs transition ${
                        currentTech.id === t.id
                          ? 'bg-purple-600/30 text-white font-medium border border-purple-500/40'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-600"
                      />
                      <div className="overflow-hidden">
                        <div className="font-semibold truncate">{t.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{t.role}</div>
                      </div>
                      {currentTech.id === t.id && (
                        <CheckCircle2 className="h-4 w-4 text-purple-400 ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ask AI Button */}
          <button
            onClick={handleAskAICopilot}
            disabled={isAiConsulting}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-purple-900/40 transition disabled:opacity-50"
            title="Kêu gọi Trợ lý AI tổng hợp ý kiến và phân tích nhanh"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isAiConsulting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Xin Gợi Ý AI</span>
          </button>
        </div>
      </div>

      {/* 2. PINNED MESSAGES BANNER */}
      {pinnedMessages.length > 0 && (
        <div className="border-b border-amber-500/20 bg-amber-950/20 px-4 py-2 sm:px-6">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-300 mb-1">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Pin className="h-3.5 w-3.5 text-amber-400 fill-amber-400/30" />
              GHI CHÚ CHẨN ĐOÁN QUAN TRỌNG ĐÃ GHIM ({pinnedMessages.length})
            </span>
          </div>
          <div className="space-y-1.5 max-h-20 overflow-y-auto pr-1">
            {pinnedMessages.map((pm) => (
              <div
                key={pm.id}
                className="flex items-start justify-between gap-2 rounded-lg bg-slate-900/80 border border-amber-500/30 px-2.5 py-1.5 text-xs text-slate-200"
              >
                <div className="flex-1 overflow-hidden">
                  <span className="font-bold text-amber-400 mr-1.5">[{pm.senderName}]:</span>
                  <span className="line-clamp-2 text-slate-300">{pm.content}</span>
                </div>
                <button
                  onClick={() => handleTogglePin(pm.id)}
                  className="text-slate-400 hover:text-amber-400 p-0.5"
                  title="Bỏ ghim"
                >
                  <PinOff className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MESSAGE LIST */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isCurrentUser = msg.senderId === currentTech.id;
          const isAI = msg.senderId === 'ai-assistant' || msg.type === 'AI_ADVICE';
          const isSystem = msg.senderId === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="rounded-full bg-slate-900 border border-slate-800 px-4 py-1 text-center text-xs text-slate-400 shadow-sm max-w-[85%]">
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 group ${
                isCurrentUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                {isAI ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/30 ring-2 ring-purple-400/40">
                    <Bot className="h-4 w-4" />
                  </div>
                ) : (
                  <img
                    src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={msg.senderName}
                    className="h-8 w-8 rounded-xl object-cover ring-1 ring-slate-700"
                  />
                )}
              </div>

              {/* Message Bubble Container */}
              <div
                className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                  isCurrentUser ? 'items-end' : 'items-start'
                }`}
              >
                {/* Sender Name & Role */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1 mb-1">
                  <span className={`font-semibold ${isAI ? 'text-purple-400' : 'text-slate-300'}`}>
                    {msg.senderName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">({msg.senderRole})</span>
                  <span className="text-[10px] text-slate-400 font-mono">• {msg.timestamp}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed transition shadow-sm relative ${
                    isCurrentUser
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : isAI
                      ? 'bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/50 text-purple-100 rounded-tl-none shadow-purple-950/40 ring-1 ring-purple-500/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* AI Badge */}
                  {isAI && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400 font-mono uppercase tracking-wider mb-2 border-b border-purple-500/20 pb-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                      <span>PHÂN TÍCH CHUYÊN GIA AI SMARTGUARD</span>
                    </div>
                  )}

                  {/* Action Tag Content */}
                  {msg.actionTag && (
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-lg border bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-emerald-300 border-emerald-500/40 shadow-sm">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span>{msg.actionTag.label}</span>
                    </div>
                  )}

                  {/* Telemetry Snapshot Card if available */}
                  {msg.type === 'TELEMETRY_SHARE' && msg.telemetrySnapshot && (
                    <div className="mb-2 rounded-xl bg-slate-950/80 border border-purple-500/30 p-2.5 font-mono text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 border-b border-slate-800 pb-1">
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-purple-400" />
                          TELEMETRY ĐỒNG BỘ TẠI MÁY
                        </span>
                        <span className="text-slate-400">{device.code}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">Áp suất xả:</span>{' '}
                          <span className="text-amber-400 font-bold">
                            {msg.telemetrySnapshot.dielectricPressure} Bar
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Dòng đỉnh IP:</span>{' '}
                          <span className="text-blue-400 font-bold">
                            {msg.telemetrySnapshot.peakCurrent} A
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Độ rung:</span>{' '}
                          <span className="text-purple-400 font-bold">
                            {msg.telemetrySnapshot.vibration} mm/s
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Điện áp:</span>{' '}
                          <span className="text-emerald-400 font-bold">
                            {msg.telemetrySnapshot.dischargeVoltage} V
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attached Image if any */}
                  {msg.imageUrl && (
                    <div className="mb-2 overflow-hidden rounded-xl border border-slate-700 max-h-56">
                      <img
                        src={msg.imageUrl}
                        alt="Đính kèm sự cố"
                        className="w-full h-full object-cover hover:scale-105 transition cursor-pointer"
                        onClick={() => window.open(msg.imageUrl, '_blank')}
                      />
                    </div>
                  )}

                  {/* Message Text */}
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Reaction counters */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-800/80">
                      {Object.entries(msg.reactions).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => handleAddReaction(msg.id, emoji)}
                          className="flex items-center gap-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 px-2 py-0.5 text-xs text-slate-200 transition"
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px] font-bold text-slate-400">{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message Hover Actions */}
                <div
                  className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <button
                    onClick={() => handleAddReaction(msg.id, '👍')}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Đồng ý / Đã nhận"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => handleAddReaction(msg.id, '⚠️')}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Cảnh báo rủi ro"
                  >
                    ⚠️
                  </button>
                  <button
                    onClick={() => handleAddReaction(msg.id, '💡')}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Giải pháp hay"
                  >
                    💡
                  </button>
                  <button
                    onClick={() => handleTogglePin(msg.id)}
                    className={`p-1 rounded hover:bg-slate-800 transition ${
                      msg.pinned ? 'text-amber-400' : 'text-slate-400 hover:text-white'
                    }`}
                    title={msg.pinned ? 'Bỏ ghim ghi chú' : 'Ghim ghi chú lên đầu phòng chat'}
                  >
                    <Pin className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Thinking Indicator */}
        {isAiConsulting && (
          <div className="flex items-start gap-2.5 animate-pulse">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-slate-900 border border-purple-500/50 p-3 text-xs text-purple-300 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-purple-400" />
              <span>AI đang rà soát dữ liệu sơ đồ máy & trao đổi kíp trực để đưa ra giải pháp...</span>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="text-xs text-slate-400 italic px-2 flex items-center gap-1.5 font-mono">
            <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-ping" />
            <span>{typingUsers.join(', ')} đang nhập tin nhắn...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. PRESET ACTIONS POPOVER BAR */}
      {showActionTags && (
        <div className="border-t border-slate-800 bg-slate-900/90 p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5 text-purple-300">
              <Zap className="h-3.5 w-3.5" />
              Báo Cáo Thao Tác Hiện Trường Nhanh:
            </span>
            <button
              onClick={() => setShowActionTags(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
            {PRESET_ACTION_TAGS.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(undefined, tag)}
                className={`flex items-center gap-2 rounded-xl border p-2 text-left text-xs font-medium transition ${tag.color}`}
              >
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. ATTACHMENT POPOVER */}
      {showAttachmentMenu && (
        <div className="border-t border-slate-800 bg-slate-900/90 p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <ImageIcon className="h-3.5 w-3.5" />
              Chọn Ảnh Hiện Trường / Sơ Đồ Khắc Phục:
            </span>
            <button
              onClick={() => setShowAttachmentMenu(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_ATTACHMENTS.map((att, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(att.label, undefined, att.url)}
                className="flex flex-col gap-1 rounded-xl border border-slate-700 bg-slate-950 p-2 text-left hover:border-purple-500 transition group"
              >
                <div className="h-16 w-full overflow-hidden rounded-lg">
                  <img
                    src={att.url}
                    alt={att.label}
                    className="h-full w-full object-cover group-hover:scale-105 transition"
                  />
                </div>
                <span className="text-[11px] text-slate-300 line-clamp-2">{att.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. CHAT INPUT TOOLBAR */}
      <div className="border-t border-slate-800 bg-slate-900/95 p-3 sm:p-4">
        {/* Quick Toolbar Shortcuts */}
        <div className="flex items-center justify-between gap-2 mb-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowActionTags(!showActionTags)}
              className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-amber-300 transition shrink-0"
              title="Đăng thông báo thao tác kỹ thuật"
            >
              <Zap className="h-3 w-3 text-amber-400" />
              <span>Thao tác nhanh</span>
            </button>

            <button
              type="button"
              onClick={handleShareTelemetry}
              className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-blue-300 transition shrink-0"
              title="Chia sẻ thông số cảm biến máy vào chat"
            >
              <Activity className="h-3 w-3 text-blue-400" />
              <span>Gửi Telemetry</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-indigo-300 transition shrink-0"
              title="Đính kèm ảnh sơ đồ hoặc linh kiện hỏng"
            >
              <ImageIcon className="h-3 w-3 text-indigo-400" />
              <span>Ảnh/Sơ đồ</span>
            </button>
          </div>

          {onOpenRepairReport && (
            <button
              type="button"
              onClick={() => onOpenRepairReport(device)}
              className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium shrink-0"
            >
              <Wrench className="h-3 w-3" />
              <span>Nghiệm Thu Khắc Phục</span>
            </button>
          )}
        </div>

        {/* Input Form with Hands-Free Mic */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputContent}
              onChange={handleInputChange}
              placeholder={
                isVoiceListening
                  ? '🔴 Đang nhận diện giọng nói rảnh tay...'
                  : 'Gõ tin nhắn trao đổi... Nhập @AI để hỏi ý kiến AI Copilot'
              }
              className={`w-full rounded-xl bg-slate-950 border px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                isVoiceListening
                  ? 'border-red-500 ring-2 ring-red-500/40'
                  : 'border-slate-700'
              }`}
            />
            {isVoiceListening && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
              </span>
            )}
          </div>

          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={toggleVoiceMic}
            className={`p-2.5 rounded-xl border transition shadow-sm ${
              isVoiceListening
                ? 'bg-red-600 border-red-500 text-white animate-pulse'
                : 'bg-slate-800 border-slate-700 text-purple-400 hover:text-white hover:bg-purple-600'
            }`}
            title={
              isVoiceListening
                ? 'Dừng thu âm giọng nói'
                : 'Bật micro nói rảnh tay (Speech-to-Text)'
            }
          >
            {isVoiceListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputContent.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-white font-semibold text-xs sm:text-sm transition disabled:opacity-50 shadow-md shadow-purple-900/40"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Gửi</span>
          </button>
        </form>
      </div>
    </div>
  );
};
