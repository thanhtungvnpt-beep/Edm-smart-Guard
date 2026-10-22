import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.resolve(__dirname, 'public')));

// Service Worker route with root scope permission
app.get('/sw.js', (req, res) => {
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.resolve(__dirname, 'public', 'sw.js'));
});

// Initialize Google Gemini AI SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// --- IN-MEMORY DATABASE ---
export interface Technician {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  avatar: string;
  shift: string;
  activeStatus: 'ON_DUTY' | 'OFF_DUTY' | 'BUSY';
  fcmToken: string;
}

export interface MachineTelemetry {
  dischargeVoltage: number; // V
  peakCurrent: number; // A
  dielectricPressure: number; // Bar
  dielectricTemp: number; // °C
  wireTension: number; // N
  wireSpeed: number; // m/min
  vibration: number; // mm/s
  conductivity: number; // uS/cm
  oee: number; // %
}

export interface Incident {
  incidentId: string;
  deviceId: string;
  errorCode: string;
  errorTitle: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  triggeredAt: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVING' | 'RESOLVED';
  telemetrySnapshot: MachineTelemetry;
  assignedTechnician: Technician;
  pushDelivered: boolean;
  pushDeliveredAt?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  aiDiagnosis?: AIDiagnosis;
  humanResolution?: HumanResolution;
}

export interface AIDiagnosis {
  rootCause: string;
  confidenceScore: number;
  failureMechanism: string;
  stepByStepGuide: string[];
  safetyWarnings: string[];
  requiredTools: string[];
  recommendedParts: string[];
  estimatedMttrMinutes: number;
  matchedLearningsCount: number;
  matchedDocsCount: number;
  generatedAt: string;
}

export interface HumanResolution {
  resolvedAt: string;
  technicianName: string;
  actualRootCause: string;
  fixSummary: string;
  partsReplaced: string[];
  durationMinutes: number;
  aiHelpfulRating: number; // 1-5
  technicianNotes: string;
  submittedToBrain: boolean;
  solutionOutcome?: 'RESOLVED_PERMANENTLY' | 'TEMPORARY_BYPASS' | 'TUNED_PARAMETERS' | 'REPLACED_PARTS';
  aiRecommendationAccuracy?: 'VERY_ACCURATE' | 'PARTIALLY_ACCURATE' | 'INACCURATE' | 'NOT_APPLICABLE';
  practicalTipsForAI?: string;
  verifiedRootCause?: string;
  checklistCompleted?: number;
  checklistTotal?: number;
}

export interface Device {
  id: string;
  code: string;
  name: string;
  model: string;
  brand: string;
  type: 'WIRE_EDM' | 'SINKER_EDM' | 'CNC_MILLING' | 'HOLE_POPPER';
  location: string;
  status: 'RUNNING' | 'ALARM_STOPPED' | 'WARNING' | 'IDLE' | 'MAINTENANCE';
  assignedTechnicianId: string;
  telemetry: MachineTelemetry;
  nominalRanges: {
    dischargeVoltage: [number, number];
    peakCurrent: [number, number];
    dielectricPressure: [number, number];
    dielectricTemp: [number, number];
    wireTension: [number, number];
    vibration: [number, number];
  };
  lastEdmSignalTime: string;
  activeIncident?: Incident;
  incidentHistoryCount: number;
  lastCalibrationTime?: string;
  serviceCounterResetAt?: string;
  serviceHoursSinceLastReset?: number;
  lastSyncTime?: string;
  lastSyncLatencyMs?: number;
}

export interface TechnicalDocument {
  id: string;
  title: string;
  category: 'OPERATING_MANUAL' | 'OEM_ERROR_CODES' | 'SOP' | 'SCHEMATICS' | 'MAINTENANCE_GUIDE' | 'TECHNICAL_SPECS';
  targetModel: string;
  author: string;
  updatedAt: string;
  summary: string;
  content: string;
  tags: string[];
  fileType?: 'PDF' | 'IMAGE_SCHEMATIC' | 'TEXT' | 'CSV_SPECS' | 'MANUAL';
  fileName?: string;
  fileSize?: string;
  thumbnailUrl?: string;
  extractedParameters?: Record<string, string | number>;
  indexedNodes?: string[];
  schematicComponents?: string[];
}

export interface AILearning {
  id: string;
  title: string;
  errorCode: string;
  machineModel: string;
  discoveredBy: string;
  learnedAt: string;
  problemStatement: string;
  humanSolution: string;
  aiSynthesizedRule: string;
  timesAppliedSuccessfully: number;
  verified: boolean;
  practicalTips?: string;
  effectivenessRating?: number; // 1-5
  technicianFeedback?: string;
  verifiedBy?: string[];
  partsInvolved?: string[];
  feedbackCount?: number;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  deviceId: string;
  deviceName: string;
  errorCode: string;
  recipientPhone: string;
  recipientName: string;
  channel: 'PUSH_NOTIFICATION' | 'SMS' | 'URGENT_AUDIO' | 'EMAIL';
  status: 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED';
  previewText: string;
}

export interface IncidentChatMessage {
  id: string;
  deviceId: string;
  incidentErrorCode?: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  type?: 'TEXT' | 'TELEMETRY_SHARE' | 'AI_ADVICE' | 'ACTION_TAKEN' | 'SOLUTION_PINNED' | 'VOICE_TRANSCRIPT';
  telemetrySnapshot?: {
    dischargeVoltage?: number;
    peakCurrent?: number;
    dielectricPressure?: number;
    dielectricTemp?: number;
    wireTension?: number;
    vibration?: number;
  };
  pinned?: boolean;
  reactions?: Record<string, number>;
  imageUrl?: string;
  actionTag?: {
    type: string;
    label: string;
    color: string;
    icon?: string;
  };
}

export interface MobileDevice {
  id: string;
  deviceName: string;
  deviceType: 'SMARTPHONE' | 'TABLET' | 'INDUSTRIAL_PDA' | 'BARCODE_TERMINAL';
  os: 'Android' | 'iOS';
  osVersion: string;
  assignedTechnicianId: string;
  assignedTechnicianName: string;
  technicianRole: string;
  technicianAvatar?: string;
  phoneNumber: string;
  status: 'ONLINE' | 'OFFLINE' | 'STANDBY';
  lastPingTime: string;
  batteryLevel: number;
  isCharging: boolean;
  appVersion: string;
  isPWAInstalled: boolean;
  pushStatus: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  fcmToken?: string;
  offlineCacheReady: boolean;
  cachedDevicesCount: number;
  cachedDocsCount: number;
  signalStrengthDbm: number;
  currentZone: string;
  ipAddress: string;
  macAddress?: string;
  registeredAt: string;
  isLocked?: boolean;
}

// Helper to call Gemini with retry and fallback (supports text prompts or multimodal contents)
async function callGeminiWithFallback(contents: any, schema?: any): Promise<string> {
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const config: any = {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      };
      if (schema) {
        config.responseMimeType = 'application/json';
        config.responseSchema = schema;
      }
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed with:`, err.message || err);
      lastError = err;
      // Wait 400ms before fallback model
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  throw lastError;
}

// Initial Technicians
const technicians: Technician[] = [
  {
    id: 'tech-01',
    name: 'Nguyễn Văn Hùng',
    role: 'Kỹ sư Trưởng Điện - PLC & EDM',
    phone: '0983.124.567',
    email: 'hung.nguyen@factory-edm.vn',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    shift: 'Ca Sáng (06:00 - 14:30)',
    activeStatus: 'ON_DUTY',
    fcmToken: 'fcm_phone_hung_pixel8_pro',
  },
  {
    id: 'tech-02',
    name: 'Trần Minh Tuấn',
    role: 'Kỹ sư Thủy lực & Khí nén EDM',
    phone: '0912.876.543',
    email: 'tuan.tran@factory-edm.vn',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    shift: 'Ca Sáng (06:00 - 14:30)',
    activeStatus: 'ON_DUTY',
    fcmToken: 'fcm_phone_tuan_galaxy_s24',
  },
  {
    id: 'tech-03',
    name: 'Lê Hoàng Nam',
    role: 'Chuyên viên Công nghệ Cắt Dây EDM',
    phone: '0904.332.119',
    email: 'nam.le@factory-edm.vn',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    shift: 'Ca Chiều (14:00 - 22:30)',
    activeStatus: 'ON_DUTY',
    fcmToken: 'fcm_phone_nam_iphone15',
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
    fcmToken: 'fcm_phone_ducanh_xiaomi14',
  },
];

// Initial Connected Mobile Devices (Technicians' smartphones, tablets, and rugged PDAs)
let mobileDevices: MobileDevice[] = [
  {
    id: 'mob-01',
    deviceName: 'Samsung Galaxy XCover Pro 6 (Rugged IP68)',
    deviceType: 'INDUSTRIAL_PDA',
    os: 'Android',
    osVersion: 'Android 14 Enterprise',
    assignedTechnicianId: 'tech-01',
    assignedTechnicianName: 'Nguyễn Văn Hùng',
    technicianRole: 'Kỹ sư Trưởng Điện - PLC & EDM',
    phoneNumber: '0983.124.567',
    status: 'ONLINE',
    lastPingTime: new Date().toISOString(),
    batteryLevel: 86,
    isCharging: false,
    appVersion: 'v2.4.1 (PWA Standalone)',
    isPWAInstalled: true,
    pushStatus: 'ACTIVE',
    fcmToken: 'fcm_phone_hung_pixel8_pro',
    offlineCacheReady: true,
    cachedDevicesCount: 6,
    cachedDocsCount: 6,
    signalStrengthDbm: -52,
    currentZone: 'Khu Vực Máy Cắt Dây EDM-W01 & W02',
    ipAddress: '192.168.10.142',
    macAddress: '48:5F:99:A2:3C:11',
    registeredAt: '2026-08-10T08:00:00.000Z',
    isLocked: false,
  },
  {
    id: 'mob-02',
    deviceName: 'iPhone 15 Pro Max (Trạm Giám Sát Ca Trực)',
    deviceType: 'SMARTPHONE',
    os: 'iOS',
    osVersion: 'iOS 17.5.1',
    assignedTechnicianId: 'tech-03',
    assignedTechnicianName: 'Lê Hoàng Nam',
    technicianRole: 'Chuyên viên Công nghệ Cắt Dây EDM',
    phoneNumber: '0904.332.119',
    status: 'ONLINE',
    lastPingTime: new Date().toISOString(),
    batteryLevel: 74,
    isCharging: true,
    appVersion: 'v2.4.1 (PWA Standalone)',
    isPWAInstalled: true,
    pushStatus: 'ACTIVE',
    fcmToken: 'fcm_phone_nam_iphone15',
    offlineCacheReady: true,
    cachedDevicesCount: 6,
    cachedDocsCount: 6,
    signalStrengthDbm: -64,
    currentZone: 'Trạm Lập Trình CAM & Đo Kiểm Phôi 3D',
    ipAddress: '192.168.10.158',
    macAddress: 'BC:D0:74:88:E1:9F',
    registeredAt: '2026-08-15T09:30:00.000Z',
    isLocked: false,
  },
  {
    id: 'mob-03',
    deviceName: 'Zebra TC58 Touch Computer (Đầu Đọc QR/RFID Kho)',
    deviceType: 'BARCODE_TERMINAL',
    os: 'Android',
    osVersion: 'Android 13 AOSP Industrial',
    assignedTechnicianId: 'tech-02',
    assignedTechnicianName: 'Trần Minh Tuấn',
    technicianRole: 'Kỹ sư Thủy lực & Khí nén EDM',
    phoneNumber: '0912.876.543',
    status: 'ONLINE',
    lastPingTime: new Date().toISOString(),
    batteryLevel: 92,
    isCharging: false,
    appVersion: 'v2.4.1 (PWA Standalone)',
    isPWAInstalled: true,
    pushStatus: 'ACTIVE',
    fcmToken: 'fcm_zebra_tc58_tuan',
    offlineCacheReady: true,
    cachedDevicesCount: 6,
    cachedDocsCount: 6,
    signalStrengthDbm: -48,
    currentZone: 'Kho Linh Kiện Lõi Lọc & Bạc Cấp Điện',
    ipAddress: '192.168.10.165',
    macAddress: '00:07:4D:23:45:90',
    registeredAt: '2026-08-20T07:15:00.000Z',
    isLocked: false,
  },
  {
    id: 'mob-04',
    deviceName: 'iPad Pro 11" M2 (Bảng SCADA Xưởng)',
    deviceType: 'TABLET',
    os: 'iOS',
    osVersion: 'iPadOS 17.4',
    assignedTechnicianId: 'tech-04',
    assignedTechnicianName: 'Phạm Đức Anh',
    technicianRole: 'Kỹ thuật viên Vận hành & Bảo trì 4.0',
    phoneNumber: '0977.889.001',
    status: 'ONLINE',
    lastPingTime: new Date().toISOString(),
    batteryLevel: 62,
    isCharging: false,
    appVersion: 'v2.4.1 (PWA Standalone)',
    isPWAInstalled: true,
    pushStatus: 'ACTIVE',
    fcmToken: 'fcm_ipad_pro_ducanh',
    offlineCacheReady: true,
    cachedDevicesCount: 6,
    cachedDocsCount: 6,
    signalStrengthDbm: -59,
    currentZone: 'Bàn Kỹ Thuật Máy Xung GF FORM E 350',
    ipAddress: '192.168.10.177',
    macAddress: 'F0:18:98:C3:7E:22',
    registeredAt: '2026-09-01T10:00:00.000Z',
    isLocked: false,
  },
  {
    id: 'mob-05',
    deviceName: 'Xiaomi Redmi Note 13 (Điện Thoại Ca Đêm)',
    deviceType: 'SMARTPHONE',
    os: 'Android',
    osVersion: 'Android 14 HyperOS',
    assignedTechnicianId: 'tech-04',
    assignedTechnicianName: 'Phạm Đức Anh',
    technicianRole: 'Kỹ thuật viên Vận hành & Bảo trì 4.0',
    phoneNumber: '0977.889.001',
    status: 'STANDBY',
    lastPingTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    batteryLevel: 45,
    isCharging: true,
    appVersion: 'v2.4.0 (PWA Browser)',
    isPWAInstalled: false,
    pushStatus: 'ACTIVE',
    fcmToken: 'fcm_redmi_nightshift',
    offlineCacheReady: true,
    cachedDevicesCount: 6,
    cachedDocsCount: 6,
    signalStrengthDbm: -78,
    currentZone: 'Phòng Nghỉ Giữa Ca & Tủ Sạc Pin',
    ipAddress: '192.168.10.191',
    macAddress: '9C:28:B3:65:10:DA',
    registeredAt: '2026-09-12T14:30:00.000Z',
    isLocked: false,
  },
  {
    id: 'mob-06',
    deviceName: 'Honeywell ScanPal EDA52 (Máy Cầm Tay Chuyên Dụng)',
    deviceType: 'INDUSTRIAL_PDA',
    os: 'Android',
    osVersion: 'Android 11 Industrial',
    assignedTechnicianId: 'tech-02',
    assignedTechnicianName: 'Trần Minh Tuấn',
    technicianRole: 'Kỹ sư Thủy lực & Khí nén EDM',
    phoneNumber: '0912.876.543',
    status: 'OFFLINE',
    lastPingTime: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    batteryLevel: 19,
    isCharging: false,
    appVersion: 'v2.3.8',
    isPWAInstalled: true,
    pushStatus: 'INACTIVE',
    offlineCacheReady: true,
    cachedDevicesCount: 6,
    cachedDocsCount: 5,
    signalStrengthDbm: -92,
    currentZone: 'Vùng Góc Khuất Hầm Thu Dung Môi Cũ',
    ipAddress: '192.168.10.199',
    macAddress: 'E4:A7:C5:11:82:70',
    registeredAt: '2026-07-28T09:00:00.000Z',
    isLocked: false,
  },
];

// Initial Technical Documents (Knowledge Base for RAG context)
let technicalDocuments: TechnicalDocument[] = [
  {
    id: 'doc-00',
    title: 'Tài Liệu Tổng Quan Giới Thiệu Chức Năng Hệ Thống EDM SmartGuard AI',
    category: 'OPERATING_MANUAL',
    targetModel: 'Toàn Bộ Hệ Thống EDM SmartGuard AI',
    author: 'Ban Quản Trị & Kiến Trúc Sư Hệ Thống EDM SmartGuard',
    updatedAt: '2026-10-06',
    summary: 'Tài liệu toàn diện giới thiệu 12 phân hệ chính của hệ thống EDM SmartGuard AI: IoT Telemetry, AI Diagnosis với Voice-to-Text & Smart History, Human-in-the-Loop, ETTR, Bảng điểm KTV và Lịch bảo dưỡng.',
    content: `TÀI LIỆU GIỚI THIỆU CHỨC NĂNG HỆ THỐNG EDM SMARTGUARD AI
Hệ thống Quản lý Giám sát, Bảo trì Dự đoán & Chẩn đoán Sự cố Thiết bị EDM/CNC tích hợp Trí tuệ Nhân tạo.

1. GIỚI THIỆU TỔNG QUAN:
EDM SmartGuard AI là nền tảng quản trị và vận hành thiết bị số hóa cho xưởng gia công khuôn mẫu chính xác (Wire EDM, Sinker EDM, High-speed CNC). Hệ thống tích hợp cảm biến IoT thời gian thực, mô hình Gemini AI, quy trình Human-in-the-Loop và cơ chế Offline-First PWA.

2. CÁC TÍNH NĂNG CHÍNH:
- Giám sát Cảm biến Thời gian Thực (IoT Telemetry): Đo điện áp phóng điện (V), dòng đỉnh xung (A), áp suất dung dịch (Bar), nhiệt độ (°C), lực căng dây (N), độ rung (mm/s), độ dẫn điện (uS/cm), OEE (%).
- Bảng điều khiển Tùy biến Kéo Thả (Customize Dashboard): Sắp xếp vị trí FacilitySummaryCard, PredictiveMaintenanceAlerts, PerformanceAnalytics và lưu vào localStorage.
- Dự báo Hiệu suất Vận hành 7 ngày (Recharts): Dự báo uptime và xu hướng rủi ro kèm nút xuất file CSV.
- Chẩn đoán Sự cố Khẩn cấp bằng AI (Gemini Engine): Nhận diện lỗi máy tức thời, sinh quy trình SOP khắc phục step-by-step.
- Nhập Triệu Chứng Rảnh Tay Bằng Giọng Nói (Hands-Free Voice-to-Text): Cho phép kỹ thuật viên nói trực tiếp bằng tiếng Việt tại hiện trường.
- Chẩn Đoán Thông Minh Dựa Trên Lịch Sử Bảo Dưỡng (Smart History-Based Diagnosis): Đối chiếu dữ liệu bảo dưỡng định kỳ và các đợt sửa chữa trước đây của chính thiết bị đó để tìm nguyên nhân gốc rễ.
- Trợ lý Kỹ thuật Hiện trường (AI Copilot Chat & TTS Audio Readout): Đọc to hướng dẫn thao tác an toàn cho KTV đang đeo găng tay.
- Nghiệm Thu Khắc Phục, Dạy Cho AI & Dự Báo Thời Gian Sửa Chữa (AI ETTR): Tự động tính toán thời gian mục tiêu tối ưu (ETTR) dựa trên mã lỗi và hiệu suất quá khứ của KTV trên dòng máy tương tự.
- Đội Ngũ Kỹ Thuật Viên & Bảng Điểm Thành Thạo (Technician Proficiency Score): Chấm điểm kỹ năng dựa trên số ca sửa chữa thực tế và tri thức AI được tái sử dụng thành công.
- Lịch Bảo Dưỡng Định Kỳ (Service Schedule Calendar) & Nhắc Lịch (Maintenance Reminders).
- Quản trị Thiết bị Di động (MDM) & Mô phỏng Push Notifications.
- Xuất Phiếu Lý Lịch Thiết Bị (Machine Dossier PDF) và Dữ Liệu Vận Hành (CSV).`,
    tags: ['Tổng quan', 'Hệ thống', 'EDM SmartGuard', 'SOP', 'Tài liệu hướng dẫn'],
  },
  {
    id: 'doc-01',
    title: 'Sổ tay xử lý lỗi đứt dây và điện áp phóng điện Makino U6 H.E.A.T Wire EDM',
    category: 'OEM_ERROR_CODES',
    targetModel: 'Makino U6 H.E.A.T',
    author: 'Phòng Kỹ thuật & Makino Japan OEM',
    updatedAt: '2026-08-15',
    summary: 'Chẩn đoán hiện tượng đứt dây liên tục do tụt áp suất nước xả cao áp (High Pressure Flush) hoặc bẩn đầu dẫn hướng kim cương Diamond Wire Guide.',
    content: `
Mã lỗi E-102: SPARK GAP SHORT-CIRCUIT & WIRE BREAKAGE
Hiện tượng: EDM báo dừng khẩn cấp, dòng phóng điện vọt lên >45A trong khi điện áp sụt xuống dưới 20V.
Nguyên nhân phổ biến:
1. Đầu dẫn hướng dây (Upper/Lower Wire Guide) bị tích tụ muội than và xỉ kim loại gia công.
2. Áp suất vòi phun dung dịch điện môi áp lực cao (Nozzle Pressure) không đủ 1.2 MPa, khiến xỉ không được thổi bay khỏi khe hở phóng điện (Spark Gap).
3. Dây cắt bị giãn hoặc cuộn cấp dây bị kẹt phanh cơ học (Brake tension motor roller).
Quy trình khắc phục:
- Bước 1: Khóa an toàn nguồn phát xung (Discharge Generator OFF).
- Bước 2: Dùng kính lúp kiểm tra lỗ dẫn hướng kim cương, lau sạch cặn bằng que nỉ chuyên dụng tẩm dung dịch tẩy muội cặn Makino Cleaner.
- Bước 3: Kiểm tra đồng hồ đo lưu lượng nước xả qua đầu trên và dưới. Nếu áp suất < 0.8 MPa, tiến hành thay lõi lọc giấy 3-micron.
- Bước 4: Kiểm tra lực căng dây cài đặt (chuẩn: 12N - 15N đối với dây đồng 0.25mm Brass Wire).
`,
    tags: ['Makino U6', 'E-102', 'Đứt dây', 'Spark Gap', 'Dung dịch điện môi'],
  },
  {
    id: 'doc-02',
    title: 'SOP-EDM-04: Xử lý tụt áp suất dầu điện môi & Lỗi bọt khí hệ thống bơm áp',
    category: 'SOP',
    targetModel: 'Chung cho máy EDM Xung & Dây',
    author: 'Kỹ sư Trưởng Nguyễn Văn Hùng',
    updatedAt: '2026-09-02',
    summary: 'Quy trình chuẩn xử lý sự cố áp suất dung dịch điện môi sụt giảm đột ngột dưới ngưỡng an toàn 0.4 bar, ngăn ngừa cháy đầu điện cực.',
    content: `
QUY TRÌNH CHUẨN SOP-EDM-04:
Khi hệ thống EDM phát tín hiệu cảnh báo ALARM-204 (Dielectric Fluid Low Pressure Alert):
1. Hệ thống an toàn sẽ tự động ngắt phóng điện để tránh cháy phôi và nổ tia lửa hở.
2. Kiểm tra mức dung dịch trong bể lọc trung gian (Intermediate Reservoir Level).
3. Kiểm tra van an toàn hồi dầu (Pressure Relief Valve PRV-02).
4. Lưu ý đặc biệt: Sau 120 giờ gia công vật liệu Inconel hoặc Thép khuôn SKD11 độ cứng >55HRC, mạt sắt rất mịn có thể bám vào cánh bơm tuần hoàn tạo bọt khí xâm thực (Cavitation).
5. Biện pháp: Thực hiện xả air (Bleed Valve) trên thân bơm chính trước khi tiến hành tháo rỡ cụm van.
`,
    tags: ['SOP', 'ALARM-204', 'Áp suất dung dịch', 'Bơm áp lực', 'Bảo trì'],
  },
  {
    id: 'doc-03',
    title: 'Sổ tay bảo dưỡng hệ thống xung điện Sodick ALC600G & Bảng mã lỗi SPW',
    category: 'OPERATING_MANUAL',
    targetModel: 'Sodick ALC600G',
    author: 'Sodick Technical Service',
    updatedAt: '2026-07-10',
    summary: 'Đặc tính động cơ tuyến tính Linear Motor và bộ nguồn phát xung kỹ thuật số SPW Circuit. Hướng dẫn sửa lỗi quá nhiệt biến tần và cảm biến chập tia.',
    content: `
Mã lỗi SPW-303: GENERATOR OVERTEMPERATURE / IGBT THERMAL TRIP
Nguyên nhân: Nhiệt độ tản nhiệt khối công suất IGBT vượt quá 75°C.
Kiểm tra:
- Quạt hút gió làm mát tủ điện nguồn xung có chạy không (quạt 24VDC Sunon).
- Tấm lọc bụi khí nén tủ điều khiển bị nghẹt bụi xưởng cơ khí.
- Chế độ cắt gia công thô (Roughing) với xung ON > 32us liên tục vượt quá chu kỳ làm việc 85%.
Khắc phục: Cho máy dừng nghỉ 15 phút, vệ sinh lưới lọc tủ điện bằng súng xịt khí khô, đo điện trở cảm biến nhiệt PT100.
`,
    tags: ['Sodick', 'SPW-303', 'IGBT', 'Nhiệt độ', 'Linear Motor'],
  },
  {
    id: 'doc-04',
    title: 'Sơ đồ nguyên lý van điện từ và cụm xả phôi tự động AgieCharmilles FORM E 350',
    category: 'SCHEMATICS',
    targetModel: 'GF AgieCharmilles FORM E 350',
    author: 'Phòng Cơ điện xưởng 1',
    updatedAt: '2026-08-20',
    summary: 'Bản vẽ chi tiết cụm xả xung điện cực Z-Axis và hệ thống điều áp Servo van khí nén FESTO.',
    content: `
Hệ thống điều khiển Z-axis Die-sinking EDM:
- Áp suất khí nén cấp chuẩn: 6.0 Bar +/- 0.5 Bar.
- Cụm van điện từ Y1, Y2 điều khiển nâng hạ nhanh đầu điện cực graphite.
- Khi gặp lỗi E-408 (Z-Axis Servo Lag / Following Error): Kiểm tra thanh trượt dẫn hướng bi THK và cụm phanh từ Z-brake. Không được tự ý mở ốc hãm đối trọng khi chưa chèn khối gỗ an toàn dưới đầu Z.
`,
    tags: ['AgieCharmilles', 'E-408', 'Trục Z', 'Khí nén', 'Sơ đồ'],
  },
];

// Initial Human Learned Knowledge (AI Learnings)
let aiLearnings: AILearning[] = [
  {
    id: 'learn-01',
    title: 'Mẹo xử lý cặn muội carbon bám cảm biến áp lực dầu EDM-02',
    errorCode: 'ALARM-204',
    machineModel: 'Makino U6 H.E.A.T',
    discoveredBy: 'Nguyễn Văn Hùng (Kỹ sư Trưởng)',
    learnedAt: '2026-09-18',
    problemStatement: 'EDM báo dừng lỗi ALARM-204 dù mức nước và bơm vẫn chạy. Hướng dẫn của hãng thường bắt thay cả cụm cảm biến áp suất 800$.',
    humanSolution: 'Thực tế chỉ cần tháo đầu nối rắc ren của cảm biến S-104, dùng dung môi xịt rửa chế hòa khí (Carb cleaner) xịt rửa màng rung áp lực bị cặn nhớt dầu bám sau 200h phôi SKD11, lau khô bằng khăn vi sợi rồi lắp lại là áp suất đo chuẩn ngay.',
    aiSynthesizedRule: 'Nếu máy báo ALARM-204 và bơm chính vẫn rung hoạt động: Ưu tiên xịt rửa màng rung cảm biến S-104 trước khi đặt mua linh kiện thay thế. Tiết kiệm 45 phút và chi phí phụ tùng.',
    timesAppliedSuccessfully: 14,
    verified: true,
  },
  {
    id: 'learn-02',
    title: 'Xử lý đứt dây đồng lặp lại tại vị trí góc nhọn R < 0.2mm trên Sodick ALC600G',
    errorCode: 'E-102',
    machineModel: 'Sodick ALC600G',
    discoveredBy: 'Lê Hoàng Nam (Chuyên gia Cắt Dây)',
    learnedAt: '2026-09-24',
    problemStatement: 'Máy cắt dây thường xuyên bị đứt dây tại góc lượn sắc R0.15 khi cắt thép tôi dày 90mm, EDM dừng liên tục 5 lần trong ca đêm.',
    humanSolution: 'Tại trang điều khiển C-Condition: Giảm thông số IP (Peak Current) xuống 2 nấc khi dao cắt tiến vào bán kính cong R < 0.3mm, đồng thời tăng áp lực nước vòi trên lên nấc High. Dây không còn bị nhiệt quá tải tại điểm xoay trục.',
    aiSynthesizedRule: 'Khi gặp lỗi E-102 lặp lại tại biên dạng góc hẹp (Corner cutting): Giảm dòng đỉnh IP 15% và kích hoạt chế độ "Corner Slowdown" với áp lực xả nước tối đa.',
    timesAppliedSuccessfully: 12,
    verified: true,
  },
  {
    id: 'learn-03',
    title: 'Sửa lỗi lệch điểm 0 đầu điện cực máy xung AgieCharmilles FORM E 350',
    errorCode: 'E-408',
    machineModel: 'GF AgieCharmilles FORM E 350',
    discoveredBy: 'Trần Minh Tuấn (Kỹ sư Cơ điện)',
    learnedAt: '2026-09-28',
    problemStatement: 'Trục Z thỉnh thoảng báo quá tải gia số vị trí khi phóng điện xung sâu > 40mm.',
    humanSolution: 'Kiểm tra đường hồi dầu của đầu gá Chuck điện cực 3R, van 1 chiều bi sắt bị hạt phôi kẹt nhẹ khiến điện cực không rút về kịp chu kỳ xung. Tháo chốt nam châm chữ U hút sạch mạt thép là hết lỗi.',
    aiSynthesizedRule: 'Lỗi E-408 khi gia công xung sâu: Kiểm tra bi van một chiều tại đầu gá System 3R xem có dính mạt kim loại làm chậm phản ứng rụt điện cực.',
    timesAppliedSuccessfully: 8,
    verified: true,
  },
  {
    id: 'learn-04',
    title: 'Tẩy cặn và thay thế nhanh quạt tản nhiệt biến tần IGBT tủ phát xung',
    errorCode: 'ALARM-501',
    machineModel: 'Makino U6 H.E.A.T',
    discoveredBy: 'Nguyễn Văn Hùng (Kỹ sư Trưởng)',
    learnedAt: '2026-09-08',
    problemStatement: 'Tủ điện báo quá nhiệt khối công suất phóng tia lửa (Overheat IGBT 72°C) khi cắt thô dòng 35A liên tục trong ca trưa.',
    humanSolution: 'Tháo tấm lọc bụi phía sau cánh tủ, thổi khí nén sạch khô ngược chiều và tra dầu silicon chịu nhiệt vào trục bi quạt Sunon 24VDC. Nhiệt độ hạ xuống 41°C ổn định.',
    aiSynthesizedRule: 'ALARM-501 quá nhiệt khối nguồn: Làm sạch màng lọc và bảo dưỡng quạt hút cưỡng bức tủ điện trước khi can thiệp vào bo mạch công suất.',
    timesAppliedSuccessfully: 16,
    verified: true,
  },
  {
    id: 'learn-05',
    title: 'Hiệu chuẩn lực căng dây cắt 12N và chỉnh khe từ động cơ AWF Fanuc',
    errorCode: 'E-105',
    machineModel: 'Fanuc Robocut α-C600iB',
    discoveredBy: 'Lê Hoàng Nam (Chuyên gia Cắt Dây)',
    learnedAt: '2026-09-12',
    problemStatement: 'Dây cắt bị võng gây góc cắt côn sai số 0.006mm khi gia công phôi hợp kim nhôm hàng không.',
    humanSolution: 'Dùng lực kế đồng hồ căng chỉnh lại lò xo hồi vị phanh điện từ brake roller về mức chuẩn 12.2N. Cân chỉnh độ đồng tâm con lăn kéo dây thải.',
    aiSynthesizedRule: 'Khi phôi bị sai lệch độ thẳng đứng trục U/V: Kiểm tra lực căng dây thực tế bằng lực kế trước khi bù trừ tọa độ phần mềm.',
    timesAppliedSuccessfully: 14,
    verified: true,
  },
  {
    id: 'learn-06',
    title: 'Khắc phục kẹt bọt khí van tỷ lệ thủy lực nâng hạ bàn phôi',
    errorCode: 'ALARM-302',
    machineModel: 'GF AgieCharmilles FORM E 350',
    discoveredBy: 'Trần Minh Tuấn (Kỹ sư Cơ điện)',
    learnedAt: '2026-08-30',
    problemStatement: 'Bàn phôi hạ giật cục khi xả dầu ngâm, gây rung động làm xô lệch phôi gá đặt chính xác.',
    humanSolution: 'Mở ốc xả khí (Bleed screw) trên đỉnh van tỷ lệ Rexroth, bơm tuần hoàn áp suất thấp 3 bar trong 2 phút để đẩy toàn bộ bọt khí ra khỏi đường ống dầu.',
    aiSynthesizedRule: 'Hiện tượng giật cục bàn gá thủy lực: Xả e bọt khí tại van tỷ lệ trước khi tháo kiểm tra bơm thủy lực.',
    timesAppliedSuccessfully: 10,
    verified: true,
  },
  {
    id: 'learn-07',
    title: 'Hiệu chuẩn bù trừ sai số quang học thước đo tuyến tính Heidenhain',
    errorCode: 'E-201',
    machineModel: 'Sodick ALC600G',
    discoveredBy: 'Phạm Đức Anh (Kỹ thuật viên 4.0)',
    learnedAt: '2026-09-15',
    problemStatement: 'Thước quang trục X báo lỗi tín hiệu đọc yếu do hơi dầu bám mặt kính quang học sau 1800 giờ.',
    humanSolution: 'Dùng tăm bông chuyên dụng thấm cồn Isopropyl 99% lau nhẹ mắt đọc quang học (Scanning head), kiểm tra áp suất khí thổi bảo vệ thước đạt 0.15 MPa.',
    aiSynthesizedRule: 'Lỗi tín hiệu thước quang E-201: Vệ sinh mắt đọc bằng cồn tinh khiết và phục hồi áp suất khí nén làm sạch chống ẩm.',
    timesAppliedSuccessfully: 9,
    verified: true,
  },
  {
    id: 'learn-08',
    title: 'Xử lý tắc kim phun áp lực cao luồn dây tự động AWF bằng bể rửa siêu âm',
    errorCode: 'ALARM-404',
    machineModel: 'Makino U6 H.E.A.T',
    discoveredBy: 'Phạm Đức Anh (Kỹ thuật viên 4.0)',
    learnedAt: '2026-09-22',
    problemStatement: 'Tia nước luồn dây tự động bị tòe sang một bên, tỷ lệ xỏ dây mồi thành công chỉ đạt 30%.',
    humanSolution: 'Tháo vòi phun Nozzle 4mm ngâm trong bể rửa siêu âm với dung dịch tẩy gỉ sét trong 15 phút, dùng dây cước ø0.3mm thông lỗ mồi.',
    aiSynthesizedRule: 'Tia nước AWF bị lệch: Thông rửa siêu âm đầu vòi xả cao áp để phục hồi tỷ lệ luồn dây tự động đạt 100%.',
    timesAppliedSuccessfully: 7,
    verified: true,
  },
  {
    id: 'learn-09',
    title: 'Căn chỉnh độ vuông góc tháp cắt U-V bằng thước chuẩn đá Granite',
    errorCode: 'E-303',
    machineModel: 'Fanuc Robocut α-C600iB',
    discoveredBy: 'Lê Hoàng Nam (Chuyên gia Cắt Dây)',
    learnedAt: '2026-09-20',
    problemStatement: 'Góc cắt côn 10 độ bị biến dạng elip trên chi tiết khuôn dập liên hoàn.',
    humanSolution: 'Gá thước góc vuông đá granite lên bàn máy, chạy rà đồng hồ so điện tử 0.001mm bù độ nghiêng trục U và V trên phần mềm Fanuc 31i-WB.',
    aiSynthesizedRule: 'Gia công góc côn bị méo: Thực hiện chu trình căn chỉnh tự động tháp U/V với cữ chuẩn đá granit.',
    timesAppliedSuccessfully: 11,
    verified: true,
  },
  {
    id: 'learn-10',
    title: 'Tối ưu hóa chu trình súc rửa xỉ khe phóng điện khi cắt phôi dày > 200mm',
    errorCode: 'ALARM-108',
    machineModel: 'Makino U6 H.E.A.T',
    discoveredBy: 'Nguyễn Văn Hùng (Kỹ sư Trưởng)',
    learnedAt: '2026-09-10',
    problemStatement: 'Phoi xỉ tích tụ ở đáy rãnh cắt sâu gây chập điện cực và giảm tốc độ cắt xuống 40%.',
    humanSolution: 'Kích hoạt chế độ xung nhịp dao động rút phôi (Pumping Cycle), tăng áp lực xả nước đáy lên 2.2 MPa và đảo mặt tấm tiếp điện sau mỗi 12 giờ.',
    aiSynthesizedRule: 'Cắt phôi siêu dày > 200mm: Tăng áp suất vòi xả đáy và kích hoạt chu trình Pumping giúp thoát xỉ nhanh, tăng tốc độ cắt 25%.',
    timesAppliedSuccessfully: 15,
    verified: true,
  },
];

// Initial Devices
let devices: Device[] = [
  {
    id: 'dev-01',
    code: 'EDM-W01',
    name: 'Máy Cắt Dây CNC Makino U6 H.E.A.T',
    model: 'Makino U6 H.E.A.T',
    brand: 'Makino',
    type: 'WIRE_EDM',
    location: 'Xưởng Khuôn Mẫu Chính - Line 01',
    status: 'RUNNING',
    assignedTechnicianId: 'tech-01',
    telemetry: {
      dischargeVoltage: 58.4,
      peakCurrent: 28.5,
      dielectricPressure: 1.45,
      dielectricTemp: 21.2,
      wireTension: 13.8,
      wireSpeed: 11.2,
      vibration: 0.8,
      conductivity: 4.8,
      oee: 92.4,
    },
    nominalRanges: {
      dischargeVoltage: [45, 75],
      peakCurrent: [15, 38],
      dielectricPressure: [1.1, 1.8],
      dielectricTemp: [19, 24],
      wireTension: [11, 16],
      vibration: [0.1, 2.2],
    },
    lastEdmSignalTime: new Date().toISOString(),
    incidentHistoryCount: 18,
  },
  {
    id: 'dev-02',
    code: 'EDM-W02',
    name: 'Máy Cắt Dây Siêu Chuẩn Sodick ALC600G',
    model: 'Sodick ALC600G',
    brand: 'Sodick',
    type: 'WIRE_EDM',
    location: 'Xưởng Linh Kiện Bán Dẫn - Line 02',
    status: 'RUNNING',
    assignedTechnicianId: 'tech-03',
    telemetry: {
      dischargeVoltage: 62.1,
      peakCurrent: 24.2,
      dielectricPressure: 1.55,
      dielectricTemp: 20.8,
      wireTension: 14.1,
      wireSpeed: 12.0,
      vibration: 0.6,
      conductivity: 3.9,
      oee: 58.5,
    },
    nominalRanges: {
      dischargeVoltage: [48, 70],
      peakCurrent: [16, 35],
      dielectricPressure: [1.2, 1.9],
      dielectricTemp: [18, 23],
      wireTension: [12, 16],
      vibration: [0.1, 1.8],
    },
    lastEdmSignalTime: new Date().toISOString(),
    incidentHistoryCount: 12,
  },
  {
    id: 'dev-03',
    code: 'EDM-S01',
    name: 'Máy Xung Điện Tỷ Mỷ GF AgieCharmilles FORM E 350',
    model: 'FORM E 350',
    brand: 'GF AgieCharmilles',
    type: 'SINKER_EDM',
    location: 'Xưởng Khuôn Độ Chính Xác Cao - Cell B',
    status: 'RUNNING',
    assignedTechnicianId: 'tech-02',
    telemetry: {
      dischargeVoltage: 68.0,
      peakCurrent: 32.0,
      dielectricPressure: 1.30,
      dielectricTemp: 22.4,
      wireTension: 0,
      wireSpeed: 0,
      vibration: 1.1,
      conductivity: 5.2,
      oee: 95.1,
    },
    nominalRanges: {
      dischargeVoltage: [50, 80],
      peakCurrent: [20, 45],
      dielectricPressure: [1.0, 1.6],
      dielectricTemp: [20, 25],
      wireTension: [0, 0],
      vibration: [0.2, 2.5],
    },
    lastEdmSignalTime: new Date().toISOString(),
    incidentHistoryCount: 8,
  },
  {
    id: 'dev-04',
    code: 'EDM-W03',
    name: 'Máy Cắt Dây Fanuc Robocut α-C400iC',
    model: 'Fanuc Robocut α-C400iC',
    brand: 'Fanuc',
    type: 'WIRE_EDM',
    location: 'Xưởng Gia Công Cơ Khí Chính Xác - Line 03',
    status: 'IDLE',
    assignedTechnicianId: 'tech-04',
    telemetry: {
      dischargeVoltage: 0,
      peakCurrent: 0,
      dielectricPressure: 0.9,
      dielectricTemp: 21.0,
      wireTension: 10.0,
      wireSpeed: 0,
      vibration: 0.2,
      conductivity: 4.1,
      oee: 67.2,
    },
    nominalRanges: {
      dischargeVoltage: [40, 75],
      peakCurrent: [12, 36],
      dielectricPressure: [1.0, 1.7],
      dielectricTemp: [19, 24],
      wireTension: [10, 15],
      vibration: [0.1, 2.0],
    },
    lastEdmSignalTime: new Date().toISOString(),
    incidentHistoryCount: 15,
  },
  {
    id: 'dev-05',
    code: 'CNC-M01',
    name: 'Trung Tâm Phay CNC 5 Trục DMG MORI DMU 50',
    model: 'DMU 50 3rd Gen',
    brand: 'DMG MORI',
    type: 'CNC_MILLING',
    location: 'Xưởng Gia Công Tốc Độ Cao - Khối C',
    status: 'RUNNING',
    assignedTechnicianId: 'tech-02',
    telemetry: {
      dischargeVoltage: 0,
      peakCurrent: 42.0,
      dielectricPressure: 3.2, // Coolant pressure
      dielectricTemp: 24.1,
      wireTension: 0,
      wireSpeed: 0,
      vibration: 1.4,
      conductivity: 1.2,
      oee: 91.0,
    },
    nominalRanges: {
      dischargeVoltage: [0, 0],
      peakCurrent: [20, 60],
      dielectricPressure: [2.5, 4.0],
      dielectricTemp: [20, 28],
      wireTension: [0, 0],
      vibration: [0.3, 3.0],
    },
    lastEdmSignalTime: new Date().toISOString(),
    incidentHistoryCount: 7,
  },
  {
    id: 'dev-06',
    code: 'EDM-HP01',
    name: 'Máy Khoan Lỗ EDM Mồi Dây High-Speed Hole Popper',
    model: 'Castek SP-01',
    brand: 'Castek',
    type: 'HOLE_POPPER',
    location: 'Xưởng Khuôn Mẫu Chính - Line Phụ Trợ',
    status: 'RUNNING',
    assignedTechnicianId: 'tech-04',
    telemetry: {
      dischargeVoltage: 72.5,
      peakCurrent: 18.0,
      dielectricPressure: 6.5,
      dielectricTemp: 22.0,
      wireTension: 0,
      wireSpeed: 0,
      vibration: 1.2,
      conductivity: 4.5,
      oee: 88.0,
    },
    nominalRanges: {
      dischargeVoltage: [55, 85],
      peakCurrent: [10, 25],
      dielectricPressure: [5.0, 8.0],
      dielectricTemp: [19, 26],
      wireTension: [0, 0],
      vibration: [0.2, 2.8],
    },
    lastEdmSignalTime: new Date().toISOString(),
    incidentHistoryCount: 11,
  },
];

// Notifications log
let notificationLogs: NotificationLog[] = [
  {
    id: 'notif-demo-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    deviceId: 'dev-01',
    deviceName: 'Máy Cắt Dây CNC Makino U6 H.E.A.T',
    errorCode: 'E-102',
    recipientPhone: '0983.124.567',
    recipientName: 'Nguyễn Văn Hùng',
    channel: 'PUSH_NOTIFICATION',
    status: 'ACKNOWLEDGED',
    previewText: '🚨 CẢNH BÁO DỪNG MÁY KHẨN CẤP: Máy EDM-W01 đã dừng do lỗi E-102 (Đứt dây cắt & sụt áp). Yêu cầu kỹ thuật viên tiếp nhận!',
  },
];

// --- TELEMETRY SIMULATION LOOP ---
// Subtle realistic fluctuations for active running machines
setInterval(() => {
  devices.forEach((dev) => {
    if (dev.status === 'RUNNING') {
      // Normal drift
      const voltFluct = (Math.random() - 0.5) * 1.5;
      const currFluct = (Math.random() - 0.5) * 0.8;
      const pressFluct = (Math.random() - 0.5) * 0.05;
      const tempFluct = (Math.random() - 0.5) * 0.1;
      const vibFluct = (Math.random() - 0.5) * 0.1;

      dev.telemetry.dischargeVoltage = Math.max(10, Math.round((dev.telemetry.dischargeVoltage + voltFluct) * 10) / 10);
      dev.telemetry.peakCurrent = Math.max(5, Math.round((dev.telemetry.peakCurrent + currFluct) * 10) / 10);
      dev.telemetry.dielectricPressure = Math.max(0.5, Math.round((dev.telemetry.dielectricPressure + pressFluct) * 100) / 100);
      dev.telemetry.dielectricTemp = Math.max(15, Math.round((dev.telemetry.dielectricTemp + tempFluct) * 10) / 10);
      dev.telemetry.vibration = Math.max(0.1, Math.round((dev.telemetry.vibration + vibFluct) * 100) / 100);
      dev.lastEdmSignalTime = new Date().toISOString();
    }
  });
}, 2500);

// In-Memory Real-Time Incident Chat Store (Group Chat partitioned by deviceId)
let incidentChatStore: Record<string, IncidentChatMessage[]> = {
  'dev-01': [
    {
      id: 'chat-dev01-1',
      deviceId: 'dev-01',
      incidentErrorCode: 'E-102',
      senderId: 'tech-01',
      senderName: 'Lê Hoàng Nam',
      senderRole: 'Chuyên gia Cắt Dây EDM',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      content: 'Chào anh em ca trực! Máy Makino U6 vừa báo dừng khẩn cấp lỗi E-102 (Đứt dây cắt liên tục). Dây đứt đúng lúc dao cắt đang vào góc lượn sắc R0.15mm trên phôi SKD11 dày 80mm.',
      timestamp: '19:42:15',
      type: 'TEXT',
      reactions: { '👀': 3 },
    },
    {
      id: 'chat-dev01-2',
      deviceId: 'dev-01',
      incidentErrorCode: 'E-102',
      senderId: 'tech-02',
      senderName: 'Nguyễn Văn Hùng',
      senderRole: 'Kỹ sư Trưởng',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      content: 'Nam kiểm tra ngay đồng hồ lưu lượng vòi xả cao áp xem áp lực có tụt dưới 1.0 Bar không. Phôi dày 80mm nếu áp lực yếu xỉ than không thoát kịp sẽ gây ngắn mạch tia lửa ngay.',
      timestamp: '19:43:20',
      type: 'TEXT',
      reactions: { '👍': 2 },
    },
    {
      id: 'chat-dev01-3',
      deviceId: 'dev-01',
      incidentErrorCode: 'E-102',
      senderId: 'tech-01',
      senderName: 'Lê Hoàng Nam',
      senderRole: 'Chuyên gia Cắt Dây EDM',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      content: 'Em vừa đo telemetry thực tế tại bồn máy: Áp lực nước xả chỉ còn 0.65 Bar, dòng đỉnh vọt lên 38.5A!',
      timestamp: '19:44:05',
      type: 'TELEMETRY_SHARE',
      telemetrySnapshot: {
        dielectricPressure: 0.65,
        peakCurrent: 38.5,
        vibration: 1.85,
        dischargeVoltage: 32.0,
      },
      reactions: { '⚠️': 4 },
    },
    {
      id: 'chat-dev01-4',
      deviceId: 'dev-01',
      incidentErrorCode: 'E-102',
      senderId: 'ai-assistant',
      senderName: 'AI Technical Specialist',
      senderRole: 'Trợ Lý AI Phân Tích Sự Cố',
      senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      content: '⚡ Phân tích chẩn đoán AI: Áp suất 0.65 Bar < 1.1 Bar (ngưỡng tối thiểu) khiến mật độ xỉ tại khe phóng điện tăng 400%, gây hiện tượng hồ quang tập trung làm đứt dây đồng 0.25mm. Đề xuất: 1) Kiểm tra lọc giấy 3um, 2) Vệ sinh lỗ dẫn hướng kim cương Diamond Guide bằng que nỉ và cồn IPA, 3) Giảm dòng đỉnh IP xuống 15% tại cung lượn R<0.3mm.',
      timestamp: '19:44:30',
      type: 'AI_ADVICE',
      pinned: true,
      reactions: { '💡': 5, '🔥': 2 },
    },
    {
      id: 'chat-dev01-5',
      deviceId: 'dev-01',
      incidentErrorCode: 'E-102',
      senderId: 'tech-03',
      senderName: 'Trần Minh Tuấn',
      senderRole: 'Kỹ sư Cơ điện',
      senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      content: 'Kho vật tư vừa xuất sẵn 2 lõi lọc giấy 3um ở Kệ A-03 rồi nhé Nam. Em đang mang que nỉ vi sợi sang hỗ trợ lau đầu kim cương luôn.',
      timestamp: '19:45:10',
      type: 'ACTION_TAKEN',
      reactions: { '🙌': 3 },
    },
  ],
  'dev-02': [
    {
      id: 'chat-dev02-1',
      deviceId: 'dev-02',
      incidentErrorCode: 'ALARM-204',
      senderId: 'tech-01',
      senderName: 'Lê Hoàng Nam',
      senderRole: 'Chuyên gia Cắt Dây EDM',
      content: 'Máy Sodick ALC600G báo ALARM-204 (Tụt áp suất dung dịch điện môi). Bơm tuần hoàn vẫn chạy nhưng áp lực hiển thị chỉ 0.38 Bar.',
      timestamp: '18:50:00',
      type: 'TEXT',
    },
    {
      id: 'chat-dev02-2',
      deviceId: 'dev-02',
      incidentErrorCode: 'ALARM-204',
      senderId: 'tech-02',
      senderName: 'Nguyễn Văn Hùng',
      senderRole: 'Kỹ sư Trưởng',
      content: 'Theo kinh nghiệm bài học learn-01: đừng vội thay cả cảm biến 800$, tháo rắc ren cảm biến S-104 xịt rửa màng rung bằng dung môi Carb Cleaner xem có cặn muội bám không!',
      timestamp: '18:51:15',
      type: 'TEXT',
      pinned: true,
      reactions: { '💡': 4 },
    },
  ],
};

// --- REST API ROUTES ---

// 1. Get all devices
app.get('/api/devices', (req, res) => {
  const devicesWithTech = devices.map((d) => {
    const tech = technicians.find((t) => t.id === d.assignedTechnicianId);
    return {
      ...d,
      assignedTechnician: tech,
    };
  });
  res.json({ success: true, data: devicesWithTech });
});

// 2. Get single device
app.get('/api/devices/:id', (req, res) => {
  const device = devices.find((d) => d.id === req.params.id);
  if (!device) {
    return res.status(404).json({ success: false, message: 'Device not found' });
  }
  const tech = technicians.find((t) => t.id === device.assignedTechnicianId);
  res.json({
    success: true,
    data: {
      ...device,
      assignedTechnician: tech,
    },
  });
});

// 3. Get technicians
app.get('/api/technicians', (req, res) => {
  res.json({ success: true, data: technicians });
});

// 3.1 Update technician shift or status
app.post('/api/technicians/:id/status', (req, res) => {
  const { activeStatus, shift } = req.body;
  const tech = technicians.find((t) => t.id === req.params.id);
  if (!tech) return res.status(404).json({ success: false, message: 'Technician not found' });
  if (activeStatus) tech.activeStatus = activeStatus;
  if (shift) tech.shift = shift;
  res.json({ success: true, data: tech, message: `Đã cập nhật trạng thái KTV ${tech.name}` });
});

// 4. Update technician assignment
app.post('/api/devices/:id/assign-technician', (req, res) => {
  const { technicianId } = req.body;
  const device = devices.find((d) => d.id === req.params.id);
  if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

  const tech = technicians.find((t) => t.id === technicianId);
  if (!tech) return res.status(404).json({ success: false, message: 'Technician not found' });

  device.assignedTechnicianId = technicianId;
  res.json({ success: true, message: `Đã phân công ${tech.name} phụ trách máy ${device.code}` });
});

// 5. TRIGGER EDM MACHINE ALARM (SIMULATION FROM EDM INDUSTRIAL IOT)
// When EDM detects an anomaly/shutdown:
// Immediately triggers machine status change to ALARM_STOPPED, creates incident,
// and fires instant push notification log to the assigned technician!
app.post('/api/edm/trigger-alarm', async (req, res) => {
  try {
    const { deviceId, errorCode, errorTitle, severity = 'CRITICAL' } = req.body;
    const device = devices.find((d) => d.id === deviceId);

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const tech = technicians.find((t) => t.id === device.assignedTechnicianId) || technicians[0];
    const triggeredAt = new Date().toISOString();
    const formattedStoppageTime = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Alter telemetry to reflect anomaly
    if (errorCode === 'E-102') {
      device.telemetry.dischargeVoltage = 14.2; // Sụt áp ngắn mạch
      device.telemetry.peakCurrent = 48.0; // Dòng đỉnh vọt
      device.telemetry.wireSpeed = 0; // Đứt dây dừng
      device.telemetry.wireTension = 1.2; // Mất sức căng
    } else if (errorCode === 'ALARM-204') {
      device.telemetry.dielectricPressure = 0.28; // Tụt áp suất
      device.telemetry.dielectricTemp = 31.5; // Tăng nhiệt do thiếu lưu thông
    } else if (errorCode === 'SPW-303') {
      device.telemetry.dielectricTemp = 36.8;
      device.telemetry.vibration = 3.4;
    }

    device.status = 'ALARM_STOPPED';
    device.lastEdmSignalTime = triggeredAt;
    device.incidentHistoryCount += 1;

    const incidentId = `INC-${Date.now().toString().slice(-6)}`;
    const newIncident: Incident = {
      incidentId,
      deviceId: device.id,
      errorCode: errorCode || 'E-102',
      errorTitle: errorTitle || 'Sự cố dừng khẩn cấp từ hệ thống EDM',
      severity,
      triggeredAt,
      status: 'ACTIVE',
      telemetrySnapshot: { ...device.telemetry },
      assignedTechnician: tech,
      pushDelivered: true,
      pushDeliveredAt: triggeredAt,
    };

    device.activeIncident = newIncident;

    // Format notification text containing device name, stoppage time, error code, and assigned technician
    const errorString = errorCode
      ? `[${errorCode}] ${errorTitle || 'Sự cố dừng máy khẩn cấp'}`
      : 'Không có mã lỗi (Ngắt dừng khẩn cấp)';
    const notifText = `🚨 [CẢNH BÁO DỪNG MÁY THEO THỜI GIAN THỰC]\n• Thiết bị: ${device.name} (${device.code})\n• Thời gian dừng máy: ${formattedStoppageTime}\n• Mã lỗi: ${errorString}\n• KTV chỉ định: ${tech.name} (${tech.phone})\n• Vị trí: ${device.location} — Yêu cầu tiếp nhận xử lý ngay!`;

    // Find technician's mobile devices to record delivery
    const techMobiles = mobileDevices.filter((m) => m.assignedTechnicianId === tech.id);
    techMobiles.forEach((m) => {
      m.lastPingTime = triggeredAt;
      m.pushStatus = 'ACTIVE';
    });

    const newNotification: NotificationLog = {
      id: `notif-${Date.now()}`,
      timestamp: triggeredAt,
      deviceId: device.id,
      deviceName: device.name,
      errorCode: newIncident.errorCode,
      recipientPhone: tech.phone,
      recipientName: tech.name,
      channel: 'PUSH_NOTIFICATION',
      status: 'DELIVERED',
      previewText: notifText,
    };

    notificationLogs.unshift(newNotification);

    res.json({
      success: true,
      message: `Hệ thống EDM đã ghi nhận dừng máy! Đã ngay lập tức phát thông báo đẩy đến điện thoại ${tech.name} (${tech.phone})`,
      incident: newIncident,
      notification: newNotification,
      stoppageTime: formattedStoppageTime,
      assignedTechnician: tech,
      deliveredToMobiles: techMobiles.map((m) => m.deviceName),
    });
  } catch (err: any) {
    console.error('Trigger alarm error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi phát sự cố EDM' });
  }
});

// 5.1 Direct Report Machine Stoppage endpoint (from EDM sensor/gateway)
app.post('/api/devices/:id/report-stop', async (req, res) => {
  try {
    const device = devices.find((d) => d.id === req.params.id);
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    const { errorCode, errorTitle, severity = 'CRITICAL' } = req.body;
    const tech = technicians.find((t) => t.id === device.assignedTechnicianId) || technicians[0];
    const triggeredAt = new Date().toISOString();
    const formattedStoppageTime = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    device.status = 'ALARM_STOPPED';
    device.lastEdmSignalTime = triggeredAt;
    device.incidentHistoryCount += 1;

    const incidentId = `INC-${Date.now().toString().slice(-6)}`;
    const newIncident: Incident = {
      incidentId,
      deviceId: device.id,
      errorCode: errorCode || 'E-STOP',
      errorTitle: errorTitle || 'Dừng máy đột ngột từ cảm biến EDM',
      severity,
      triggeredAt,
      status: 'ACTIVE',
      telemetrySnapshot: { ...device.telemetry },
      assignedTechnician: tech,
      pushDelivered: true,
      pushDeliveredAt: triggeredAt,
    };
    device.activeIncident = newIncident;

    const errorString = errorCode
      ? `[${errorCode}] ${errorTitle || 'Dừng máy'}`
      : 'Không có mã lỗi (Dừng đột ngột)';
    const notifText = `🚨 [CẢNH BÁO DỪNG MÁY THEO THỜI GIAN THỰC]\n• Thiết bị: ${device.name} (${device.code})\n• Thời gian dừng máy: ${formattedStoppageTime}\n• Mã lỗi: ${errorString}\n• KTV chỉ định: ${tech.name} (${tech.phone})`;

    const newNotification: NotificationLog = {
      id: `notif-${Date.now()}`,
      timestamp: triggeredAt,
      deviceId: device.id,
      deviceName: device.name,
      errorCode: newIncident.errorCode,
      recipientPhone: tech.phone,
      recipientName: tech.name,
      channel: 'PUSH_NOTIFICATION',
      status: 'DELIVERED',
      previewText: notifText,
    };
    notificationLogs.unshift(newNotification);

    res.json({
      success: true,
      message: `Đã ghi nhận dừng máy và gửi thông báo đẩy đến điện thoại ${tech.name}`,
      incident: newIncident,
      notification: newNotification,
      stoppageTime: formattedStoppageTime,
      assignedTechnician: tech,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Lỗi báo dừng máy' });
  }
});

// 6. Acknowledge Incident (Kỹ thuật viên bấm nhận việc trên điện thoại)
app.post('/api/devices/:id/acknowledge', (req, res) => {
  const { technicianName } = req.body;
  const device = devices.find((d) => d.id === req.params.id);
  if (!device || !device.activeIncident) {
    return res.status(404).json({ success: false, message: 'No active incident for this device' });
  }

  device.activeIncident.status = 'ACKNOWLEDGED';
  device.activeIncident.acknowledgedAt = new Date().toISOString();
  device.activeIncident.acknowledgedBy = technicianName || 'Kỹ thuật viên phụ trách';

  res.json({
    success: true,
    message: `Kỹ thuật viên ${device.activeIncident.acknowledgedBy} đã tiếp nhận xử lý sự cố`,
    incident: device.activeIncident,
  });
});

// 6.1 Quick Actions: 'reset-service-counter', 'calibrate-sensor', 'force-sync'
app.post('/api/devices/:id/quick-action', (req, res) => {
  try {
    const { action, sensorType, technicianName, resetScope, note } = req.body;
    const device = devices.find((d) => d.id === req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Thiết bị không tồn tại' });
    }

    const now = new Date();
    const tech = technicians.find((t) => t.id === device.assignedTechnicianId) || technicians[0];
    const performer = technicianName || (tech ? tech.name : 'Kỹ thuật viên hiện trường');

    if (action === 'reset-service-counter') {
      // 1. Reset Service Counter
      (device as any).serviceCounterResetAt = now.toISOString();
      (device as any).serviceHoursSinceLastReset = 0;
      if (device.incidentHistoryCount > 0) {
        device.incidentHistoryCount = Math.max(0, device.incidentHistoryCount - 1);
      }
      device.lastEdmSignalTime = now.toISOString();

      return res.json({
        success: true,
        message: `Đã đặt lại bộ đếm bảo dưỡng cho máy ${device.code} (${resetScope || 'Chu kỳ 500 giờ'}) thành công!`,
        device,
        data: {
          deviceId: device.id,
          resetAt: now.toISOString(),
          resetScope: resetScope || 'Toàn bộ chu kỳ bảo dưỡng 500h',
          performer,
          note: note || '',
        },
      });
    }

    if (action === 'calibrate-sensor') {
      // 2. Calibrate Sensor(s) back to precision nominal range
      const type = sensorType || 'ALL';
      if (type === 'DIELECTRIC_PRESSURE' || type === 'ALL') {
        device.telemetry.dielectricPressure = 1.35;
      }
      if (type === 'DISCHARGE_VOLTAGE' || type === 'ALL') {
        device.telemetry.dischargeVoltage = device.type === 'WIRE_EDM' ? 55.0 : 48.0;
      }
      if (type === 'PEAK_CURRENT' || type === 'ALL') {
        device.telemetry.peakCurrent = device.type === 'WIRE_EDM' ? 24.5 : 20.0;
      }
      if (type === 'DIELECTRIC_TEMP' || type === 'ALL') {
        device.telemetry.dielectricTemp = 21.2;
      }
      if (type === 'WIRE_TENSION' || type === 'ALL') {
        device.telemetry.wireTension = 13.0;
      }
      if (type === 'VIBRATION' || type === 'ALL') {
        device.telemetry.vibration = 0.65;
      }

      (device as any).lastCalibrationTime = now.toISOString();
      device.lastEdmSignalTime = now.toISOString();

      const sensorLabelMap: Record<string, string> = {
        ALL: 'Tất cả cảm biến (Áp suất, Điện áp, Dòng xung, Nhiệt độ)',
        DIELECTRIC_PRESSURE: 'Cảm biến áp suất dung dịch (1.35 Bar)',
        DISCHARGE_VOLTAGE: 'Cảm biến điện áp xung (55.0 V)',
        PEAK_CURRENT: 'Cảm biến dòng đỉnh (24.5 A)',
        DIELECTRIC_TEMP: 'Cảm biến nhiệt độ dầu cắt (21.2 °C)',
        WIRE_TENSION: 'Cảm biến lực căng dây (13.0 N)',
        VIBRATION: 'Cảm biến gia tốc rung động (0.65 mm/s)',
      };

      return res.json({
        success: true,
        message: `Đã hiệu chuẩn cảm biến máy ${device.code} (${sensorLabelMap[type] || type}) về chuẩn thành công!`,
        device,
        data: {
          deviceId: device.id,
          sensorType: type,
          calibratedAt: now.toISOString(),
          performer,
          telemetry: device.telemetry,
        },
      });
    }

    if (action === 'force-sync') {
      // 3. Force Sync with Machine Controller / PLC / IoT Gateway
      const latencyMs = Math.floor(Math.random() * 9) + 11; // 11-19ms realistic PLC latency
      device.lastEdmSignalTime = now.toISOString();
      (device as any).lastSyncTime = now.toISOString();
      (device as any).lastSyncLatencyMs = latencyMs;

      return res.json({
        success: true,
        message: `Đã cưỡng bức đồng bộ dữ liệu PLC thành công cho máy ${device.code}! Độ trễ: ${latencyMs}ms`,
        device,
        data: {
          deviceId: device.id,
          syncedAt: now.toISOString(),
          latencyMs,
          telemetry: device.telemetry,
        },
      });
    }

    if (action === 'ping-controller') {
      const pingMs = Math.floor(Math.random() * 6) + 7; // 7-12ms
      return res.json({
        success: true,
        message: `Kết nối bộ điều khiển CNC của ${device.code} ổn định! Ping: ${pingMs}ms.`,
        data: {
          deviceId: device.id,
          pingMs,
          status: 'CONNECTED',
        },
      });
    }

    if (action === 'set-status' || action === 'set-maintenance') {
      const targetStatus = req.body.status || 'MAINTENANCE';
      device.status = targetStatus;
      device.lastEdmSignalTime = now.toISOString();
      return res.json({
        success: true,
        message: `Đã chuyển máy ${device.code} (${device.name}) sang trạng thái ${targetStatus}!`,
        device,
      });
    }

    return res.status(400).json({ success: false, message: 'Hành động nhanh không hợp lệ' });
  } catch (err: any) {
    console.error('Quick action error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi thực thi tác vụ nhanh' });
  }
});

// 6.2 Set Device Operational Status (e.g., MAINTENANCE, RUNNING, IDLE, etc.)
app.post('/api/devices/:id/status', (req, res) => {
  try {
    const { status, technicianName, note } = req.body;
    const device = devices.find((d) => d.id === req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Thiết bị không tồn tại' });
    }

    const validStatuses = ['RUNNING', 'ALARM_STOPPED', 'WARNING', 'IDLE', 'MAINTENANCE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Trạng thái ${status} không hợp lệ` });
    }

    const prevStatus = device.status;
    device.status = status;
    device.lastEdmSignalTime = new Date().toISOString();

    // If moving to MAINTENANCE or IDLE, adjust telemetry smoothly
    if (status === 'MAINTENANCE') {
      device.telemetry.peakCurrent = 0;
      device.telemetry.dischargeVoltage = 0;
      device.telemetry.wireSpeed = 0;
      device.telemetry.vibration = 0.1;
    } else if (status === 'IDLE') {
      device.telemetry.peakCurrent = 0;
      device.telemetry.dischargeVoltage = 0;
      device.telemetry.wireSpeed = 0;
      device.telemetry.vibration = 0.2;
    } else if (status === 'RUNNING') {
      if (device.type === 'WIRE_EDM') {
        device.telemetry.dischargeVoltage = 55.0;
        device.telemetry.peakCurrent = 24.5;
        device.telemetry.dielectricPressure = 1.35;
        device.telemetry.dielectricTemp = 21.2;
        device.telemetry.wireTension = 13.0;
        device.telemetry.wireSpeed = 8.5;
        device.telemetry.vibration = 0.65;
      } else {
        device.telemetry.dischargeVoltage = 48.0;
        device.telemetry.peakCurrent = 20.0;
        device.telemetry.dielectricPressure = 1.2;
        device.telemetry.dielectricTemp = 22.0;
        device.telemetry.wireTension = 10.0;
        device.telemetry.wireSpeed = 6.0;
        device.telemetry.vibration = 0.55;
      }
    }

    const statusNames: Record<string, string> = {
      RUNNING: 'Đang gia công (RUNNING)',
      ALARM_STOPPED: 'Dừng báo động (ALARM_STOPPED)',
      WARNING: 'Cảnh báo (WARNING)',
      IDLE: 'Tạm dừng / Chờ (IDLE)',
      MAINTENANCE: 'Bảo trì kỹ thuật (MAINTENANCE)',
    };

    const statusLabel = statusNames[status] || status;
    const performer = technicianName || 'Kỹ thuật viên';

    return res.json({
      success: true,
      message: `Đã chuyển máy ${device.code} (${device.name}) sang trạng thái: ${statusLabel}!`,
      device,
      data: {
        deviceId: device.id,
        prevStatus,
        newStatus: status,
        updatedAt: device.lastEdmSignalTime,
        performer,
        note: note || '',
      },
    });
  } catch (err: any) {
    console.error('Set device status error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi cập nhật trạng thái máy' });
  }
});

// 6.3 Batch Actions on Multiple Devices ('sync', 'set-maintenance', 'set-running', 'reset-alarm', 'calibrate-sensors')
app.post('/api/devices/batch-action', (req, res) => {
  try {
    const { deviceIds, action, status, technicianName, note } = req.body;
    if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách ID thiết bị không hợp lệ hoặc rỗng' });
    }

    const now = new Date();
    const targetDevices = devices.filter((d) => deviceIds.includes(d.id));
    if (targetDevices.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị nào trong danh sách' });
    }

    const performer = technicianName || 'Kỹ thuật viên Trưởng ca';
    const updatedDevices: any[] = [];
    let summaryMessage = '';

    if (action === 'sync') {
      targetDevices.forEach((device) => {
        const latencyMs = Math.floor(Math.random() * 9) + 11;
        device.lastEdmSignalTime = now.toISOString();
        (device as any).lastSyncTime = now.toISOString();
        (device as any).lastSyncLatencyMs = latencyMs;
        updatedDevices.push(device);
      });
      summaryMessage = `Đã đồng bộ PLC hàng loạt thành công cho ${targetDevices.length} máy EDM! (${targetDevices.map((d) => d.code).join(', ')})`;
    } else if (action === 'set-maintenance' || (action === 'set-status' && status === 'MAINTENANCE')) {
      targetDevices.forEach((device) => {
        device.status = 'MAINTENANCE';
        device.lastEdmSignalTime = now.toISOString();
        device.telemetry.peakCurrent = 0;
        device.telemetry.dischargeVoltage = 0;
        device.telemetry.wireSpeed = 0;
        device.telemetry.vibration = 0.1;
        updatedDevices.push(device);
      });
      summaryMessage = `Đã chuyển đồng thời ${targetDevices.length} máy sang chế độ Bảo Trì (MAINTENANCE)! (${targetDevices.map((d) => d.code).join(', ')})`;
    } else if (action === 'set-running' || (action === 'set-status' && status === 'RUNNING')) {
      targetDevices.forEach((device) => {
        device.status = 'RUNNING';
        device.lastEdmSignalTime = now.toISOString();
        if (device.type === 'WIRE_EDM') {
          device.telemetry.dischargeVoltage = 55.0;
          device.telemetry.peakCurrent = 24.5;
          device.telemetry.dielectricPressure = 1.35;
          device.telemetry.dielectricTemp = 21.2;
          device.telemetry.wireTension = 13.0;
          device.telemetry.wireSpeed = 8.5;
          device.telemetry.vibration = 0.65;
        } else {
          device.telemetry.dischargeVoltage = 48.0;
          device.telemetry.peakCurrent = 20.0;
          device.telemetry.dielectricPressure = 1.2;
          device.telemetry.dielectricTemp = 22.0;
          device.telemetry.wireTension = 10.0;
          device.telemetry.wireSpeed = 6.0;
          device.telemetry.vibration = 0.55;
        }
        updatedDevices.push(device);
      });
      summaryMessage = `Đã khởi động vận hành đồng thời ${targetDevices.length} máy EDM! (${targetDevices.map((d) => d.code).join(', ')})`;
    } else if (action === 'reset-alarm') {
      let resetCount = 0;
      targetDevices.forEach((device) => {
        if (device.status === 'ALARM_STOPPED' || device.activeIncident) {
          device.status = 'IDLE';
          device.activeIncident = undefined;
          device.lastEdmSignalTime = now.toISOString();
          resetCount++;
        }
        updatedDevices.push(device);
      });
      summaryMessage = `Đã reset cảnh báo dừng máy cho ${resetCount} thiết bị thành công!`;
    } else if (action === 'calibrate-sensors') {
      targetDevices.forEach((device) => {
        if (device.type === 'WIRE_EDM') {
          device.telemetry.dielectricPressure = 1.35;
          device.telemetry.dischargeVoltage = 55.0;
          device.telemetry.peakCurrent = 24.5;
          device.telemetry.dielectricTemp = 21.2;
          device.telemetry.wireTension = 13.0;
          device.telemetry.vibration = 0.65;
        } else {
          device.telemetry.dielectricPressure = 1.2;
          device.telemetry.dischargeVoltage = 48.0;
          device.telemetry.peakCurrent = 20.0;
          device.telemetry.dielectricTemp = 22.0;
          device.telemetry.wireTension = 10.0;
          device.telemetry.vibration = 0.55;
        }
        (device as any).lastCalibrationTime = now.toISOString();
        device.lastEdmSignalTime = now.toISOString();
        updatedDevices.push(device);
      });
      summaryMessage = `Đã hiệu chuẩn cảm biến hàng loạt về dải tiêu chuẩn cho ${targetDevices.length} máy EDM!`;
    } else {
      return res.status(400).json({ success: false, message: `Hành động hàng loạt '${action}' không được hỗ trợ` });
    }

    return res.json({
      success: true,
      message: summaryMessage,
      action,
      updatedCount: updatedDevices.length,
      devices: updatedDevices,
      performer,
      executedAt: now.toISOString(),
      note: note || '',
    });
  } catch (err: any) {
    console.error('Batch action error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi xử lý tác vụ hàng loạt' });
  }
});

// 7. Resolve Incident & Provide Human Resolution Data
app.post('/api/devices/:id/resolve', async (req, res) => {
  try {
    const {
      actualRootCause,
      fixSummary,
      partsReplaced,
      durationMinutes,
      aiHelpfulRating,
      technicianNotes,
      solutionOutcome,
      aiRecommendationAccuracy,
      practicalTipsForAI,
      checklistCompleted,
      checklistTotal,
    } = req.body;
    const device = devices.find((d) => d.id === req.params.id);
    if (!device || !device.activeIncident) {
      return res.status(404).json({ success: false, message: 'No active incident for this device' });
    }

    const tech = technicians.find((t) => t.id === device.assignedTechnicianId);

    const resolution: HumanResolution = {
      resolvedAt: new Date().toISOString(),
      technicianName: tech ? tech.name : 'Kỹ thuật viên hiện trường',
      actualRootCause: actualRootCause || 'Đã khắc phục lỗi cảm biến và thay dây mới',
      fixSummary: fixSummary || 'Vệ sinh đầu dẫn hướng kim cương và reset chu kỳ xung',
      partsReplaced: Array.isArray(partsReplaced) ? partsReplaced : [],
      durationMinutes: Number(durationMinutes) || 25,
      aiHelpfulRating: Number(aiHelpfulRating) || 5,
      technicianNotes: technicianNotes || '',
      submittedToBrain: true,
      solutionOutcome: solutionOutcome || 'RESOLVED_PERMANENTLY',
      aiRecommendationAccuracy: aiRecommendationAccuracy || 'VERY_ACCURATE',
      practicalTipsForAI: practicalTipsForAI || '',
      checklistCompleted: Number(checklistCompleted) || 0,
      checklistTotal: Number(checklistTotal) || 0,
    };

    device.activeIncident.humanResolution = resolution;
    device.activeIncident.status = 'RESOLVED';

    // Restore device to RUNNING state with normalized telemetry
    device.status = 'RUNNING';
    if (device.type === 'WIRE_EDM') {
      device.telemetry.dischargeVoltage = 56.5;
      device.telemetry.peakCurrent = 26.0;
      device.telemetry.dielectricPressure = 1.45;
      device.telemetry.dielectricTemp = 21.0;
      device.telemetry.wireTension = 13.5;
      device.telemetry.wireSpeed = 11.5;
      device.telemetry.vibration = 0.7;
    } else {
      device.telemetry.dielectricPressure = 1.35;
      device.telemetry.dielectricTemp = 22.0;
      device.telemetry.vibration = 0.9;
    }

    // Auto-trigger AI learning synthesis from human repair experience & feedback
    let newAILearning: AILearning | null = null;
    if (fixSummary && fixSummary.length > 5) {
      try {
        const prompt = `
Bạn là Kỹ sư Trưởng AI Chuyên gia bảo trì máy EDM và thiết bị công nghiệp sản xuất chính xác.
Kỹ thuật viên vừa hoàn thành sửa máy và gửi báo cáo cùng phản hồi nghiệm thu thực tế.
Hãy phân tích kinh nghiệm và phản hồi này để tổng hợp một bài học ("AI Learning") thực chiến cao cho bộ não AI:

- Thiết bị: ${device.model} (${device.name}), Loại: ${device.type}
- Mã lỗi đã xảy ra: ${device.activeIncident.errorCode} - ${device.activeIncident.errorTitle}
- Nguyên nhân thực tế phát hiện: ${resolution.actualRootCause}
- Phương án sửa chữa thực tế của kỹ thuật viên: ${resolution.fixSummary}
- Kết quả nghiệm thu: ${resolution.solutionOutcome}
- Đánh giá của KTV về độ chuẩn xác của AI ban đầu: ${resolution.aiRecommendationAccuracy} (Hài lòng: ${resolution.aiHelpfulRating}/5 sao)
- Mẹo thực chiến KTV truyền đạt lại cho AI: ${resolution.practicalTipsForAI || 'Không có'}
- Linh kiện đã thay thế/vệ sinh: ${resolution.partsReplaced.join(', ') || 'Không thay mới'}
- Ghi chú thêm: ${resolution.technicianNotes}

Hãy trả về JSON theo schema:
{
  "title": "Tên bài học kinh nghiệm súc tích (tối đa 15 từ)",
  "aiSynthesizedRule": "Đúc kết quy tắc xử lý thực chiến của AI (1-2 câu, nêu rõ mẹo kiểm tra hoặc cách làm tiết kiệm thời gian nhất)",
  "practicalTips": "Mẹo then chốt cho KTV khác khi gặp lỗi tương tự (1 câu ngắn gọn)"
}
`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                aiSynthesizedRule: { type: Type.STRING },
                practicalTips: { type: Type.STRING },
              },
              required: ['title', 'aiSynthesizedRule'],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          newAILearning = {
            id: `learn-${Date.now()}`,
            title: parsed.title,
            errorCode: device.activeIncident.errorCode,
            machineModel: device.model,
            discoveredBy: resolution.technicianName,
            learnedAt: new Date().toISOString().split('T')[0],
            problemStatement: `Sự cố ${device.activeIncident.errorCode}: ${resolution.actualRootCause}`,
            humanSolution: resolution.fixSummary,
            aiSynthesizedRule: parsed.aiSynthesizedRule,
            practicalTips: parsed.practicalTips || resolution.practicalTipsForAI || '',
            effectivenessRating: resolution.aiHelpfulRating,
            technicianFeedback: `KTV đánh giá độ chuẩn AI: ${resolution.aiRecommendationAccuracy}. Ghi chú: ${resolution.technicianNotes || 'Hoàn tất nghiệm thu an toàn'}`,
            partsInvolved: resolution.partsReplaced,
            timesAppliedSuccessfully: 1,
            verified: true,
          };
          if (newAILearning) {
            aiLearnings.unshift(newAILearning);
          }
        }
      } catch (aiErr) {
        console.warn('AI learning synthesis fallback:', aiErr);
        // Fallback learning
        newAILearning = {
          id: `learn-${Date.now()}`,
          title: `Xử lý lỗi ${device.activeIncident.errorCode} trên máy ${device.model}`,
          errorCode: device.activeIncident.errorCode,
          machineModel: device.model,
          discoveredBy: resolution.technicianName,
          learnedAt: new Date().toISOString().split('T')[0],
          problemStatement: resolution.actualRootCause,
          humanSolution: resolution.fixSummary,
          aiSynthesizedRule: `Khi gặp lỗi ${device.activeIncident.errorCode}: ${resolution.fixSummary.slice(0, 120)}...`,
          practicalTips: resolution.practicalTipsForAI || 'Kiểm tra kỹ tình trạng mạt phôi trước khi khởi động lại.',
          effectivenessRating: resolution.aiHelpfulRating,
          timesAppliedSuccessfully: 1,
          verified: true,
        };
        if (newAILearning) {
          aiLearnings.unshift(newAILearning);
        }
      }
    }

    res.json({
      success: true,
      message: 'Đã hoàn tất khắc phục sự cố! Phản hồi của bạn đã được ghi nhớ vào Bộ Não Tri Thức AI.',
      incident: device.activeIncident,
      newAILearning,
    });
  } catch (err: any) {
    console.error('Resolve incident error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi nghiệm thu sự cố' });
  }
});

// 8. AI DIAGNOSTIC ENGINE: Analyze Equipment Breakdown
app.post('/api/ai/diagnose', async (req, res) => {
  try {
    const { deviceId, incidentId, voiceSymptoms, maintenanceHistory } = req.body;
    const device = devices.find((d) => d.id === deviceId);

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const incident = device.activeIncident || {
      incidentId: incidentId || 'TEST-INC',
      errorCode: 'E-102',
      errorTitle: 'Đứt dây liên tục và mất điện áp phóng điện',
      severity: 'CRITICAL',
      telemetrySnapshot: device.telemetry,
    };

    // Filter relevant technical documents
    const relevantDocs = technicalDocuments.filter((doc) =>
      doc.targetModel.includes(device.brand) ||
      doc.content.includes(incident.errorCode) ||
      doc.targetModel.includes('Chung')
    );

    // Filter relevant human learnings that AI previously accumulated
    const relevantLearnings = aiLearnings.filter((l) =>
      l.errorCode === incident.errorCode ||
      l.machineModel.includes(device.brand) ||
      l.machineModel.includes(device.model)
    );

    // Format maintenance history context
    const hasHistory = Array.isArray(maintenanceHistory) && maintenanceHistory.length > 0;
    const historyText = hasHistory
      ? `\nLỊCH SỬ BẢO DƯỠNG ĐỊNH KỲ VÀ TIỀN SỬ SỬA CHỮA CỦA CHÍNH THIẾT BỊ NÀY (${device.code}):\n` +
        maintenanceHistory
          .slice(0, 5)
          .map(
            (m: any) =>
              `- [${m.taskType || 'BẢO DƯỠNG'}] Ngày ${m.completedAt?.slice(0, 10) || 'Gần đây'} (${m.taskTitle}): KTV ${m.technicianName}. Linh kiện đã thay: ${m.partsReplaced?.join(', ') || 'Không thay'}. Phát hiện & xử lý: ${m.findingsAndActions || 'Không ghi nhận'}. Ghi chú: ${m.technicianNotes || ''}`
          )
          .join('\n') +
        `\n* YÊU CẦU ĐẶC BIỆT VỀ LỊCH SỬ: Đối chiếu các lần bảo dưỡng định kỳ trên xem linh kiện nào đã từng có triệu chứng tương tự hoặc sắp đạt giới hạn chu kỳ hao mòn (như cụm dẫn hướng kim cương, lọc giấy, phớt bơm) để suy luận nguyên nhân gốc rễ!`
      : '';

    const prompt = `
Bạn là Kỹ sư Trưởng AI Chuyên gia cấp cao về Hệ thống Máy EDM (Cắt dây Wire-cut EDM, Xung điện Sinker EDM, Phay CNC) và Tự động hóa Công nghiệp.
Hệ thống EDM (Equipment Data Management) vừa báo DỪNG MÁY KHẨN CẤP tại nhà máy.

THÔNG TIN THIẾT BỊ DỪNG:
- Mã thiết bị: ${device.code} (${device.name})
- Model & Hãng: ${device.model} - ${device.brand} (${device.type})
- Vị trí: ${device.location}
- Mã lỗi EDM: ${incident.errorCode}
- Tên lỗi: ${incident.errorTitle}
- Mức độ nghiêm trọng: ${incident.severity}

THÔNG SỐ CẢM BIẾN TẠI THỜI ĐIỂM DỪNG (EDM Snapshot):
- Điện áp phóng điện (Discharge Gap Voltage): ${incident.telemetrySnapshot.dischargeVoltage} V (Định mức: ${device.nominalRanges.dischargeVoltage[0]} - ${device.nominalRanges.dischargeVoltage[1]} V)
- Dòng đỉnh xung (Peak Current): ${incident.telemetrySnapshot.peakCurrent} A (Định mức: ${device.nominalRanges.peakCurrent[0]} - ${device.nominalRanges.peakCurrent[1]} A)
- Áp suất dung dịch điện môi: ${incident.telemetrySnapshot.dielectricPressure} bar (Định mức: ${device.nominalRanges.dielectricPressure[0]} - ${device.nominalRanges.dielectricPressure[1]} bar)
- Nhiệt độ dung dịch điện môi: ${incident.telemetrySnapshot.dielectricTemp} °C (Định mức: ${device.nominalRanges.dielectricTemp[0]} - ${device.nominalRanges.dielectricTemp[1]} °C)
- Sức căng dây cắt EDM: ${incident.telemetrySnapshot.wireTension} N (Định mức: ${device.nominalRanges.wireTension[0]} - ${device.nominalRanges.wireTension[1]} N)
- Độ rung: ${incident.telemetrySnapshot.vibration} mm/s (Định mức: ${device.nominalRanges.vibration[0]} - ${device.nominalRanges.vibration[1]} mm/s)
${voiceSymptoms ? `
TRIỆU CHỨNG THỰC TẾ DO KỸ THUẬT VIÊN MÔ TẢ TRỰC TIẾP QUA GIỌNG NÓI RẢNH TAY (HANDS-FREE VOICE INPUT):
"${voiceSymptoms}"
* LƯU Ý ĐẶC BIỆT: Hãy trực tiếp phân tích và đưa ra giải pháp dựa trên triệu chứng âm thanh/mùi/cơ học mà kỹ thuật viên đang quan sát trực tiếp này!
` : ''}
${historyText}

TÀI LIỆU KỸ THUẬT DO CON NGƯỜI ĐÃ CUNG CẤP CHO BẠN:
${relevantDocs.map((d) => `[Tài liệu: ${d.title}]\n${d.content.slice(0, 700)}`).join('\n---\n')}

KINH NGHIỆM THỰC CHIẾN MÀ BẠN (AI) ĐÃ HỌC TỪ CÁC KỸ THUẬT VIÊN TRƯỚC ĐÂY:
${relevantLearnings.map((l) => `[Bài học từ ${l.discoveredBy}]: ${l.aiSynthesizedRule}\nCách giải quyết thực tế: ${l.humanSolution}`).join('\n---\n')}

YÊU CẦU:
Hãy phân tích nguyên nhân sự cố một cách sắc sảo, tích hợp cả triệu chứng giọng nói, lịch sử bảo dưỡng định kỳ, tài liệu kỹ thuật lẫn kinh nghiệm thực chiến đã học từ con người để đưa ra giải pháp sửa chữa NHANH NHẤT và AN TOÀN NHẤT.

Trả về kết quả chuẩn định dạng JSON theo schema:
{
  "rootCause": "Tóm tắt nguyên nhân gốc rễ chính (1-2 câu súc tích)",
  "confidenceScore": 95,
  "failureMechanism": "Cơ chế hỏng hóc chi tiết (sự tương quan giữa các thông số EDM sụt giảm/tăng vọt và tiền sử bảo dưỡng)",
  "stepByStepGuide": ["Bước 1: ...", "Bước 2: ...", "Bước 3: ...", "Bước 4: ..."],
  "safetyWarnings": ["Cảnh báo an toàn 1 (ví dụ: ngắt cầu dao LOTO, xả áp suất, tiếp địa tụ phóng điện...)", "Cảnh báo an toàn 2..."],
  "requiredTools": ["Dụng cụ 1", "Dụng cụ 2..."],
  "recommendedParts": ["Vật tư/Linh kiện dự phòng 1", "Vật tư 2..."],
  "estimatedMttrMinutes": 35
}
`;

    let diagnosisData: any = null;
    const diagnosisSchema = {
      type: Type.OBJECT,
      properties: {
        rootCause: { type: Type.STRING },
        confidenceScore: { type: Type.NUMBER },
        failureMechanism: { type: Type.STRING },
        stepByStepGuide: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        safetyWarnings: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        requiredTools: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        recommendedParts: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        estimatedMttrMinutes: { type: Type.INTEGER },
      },
      required: [
        'rootCause',
        'confidenceScore',
        'failureMechanism',
        'stepByStepGuide',
        'safetyWarnings',
        'requiredTools',
        'recommendedParts',
        'estimatedMttrMinutes',
      ],
    };

    try {
      const responseText = await callGeminiWithFallback(prompt, diagnosisSchema);
      diagnosisData = JSON.parse(responseText);
    } catch (apiErr) {
      console.warn('Gemini API call failed, synthesizing expert diagnosis from local knowledge base:', apiErr);

      // Intelligent local fallback grounded in our industrial knowledge base & manuals
      if (incident.errorCode === 'E-102') {
        diagnosisData = {
          rootCause: 'Ngắn mạch khe hở phóng điện (Spark Gap) và đứt dây do xỉ kim loại bám nghẹt đầu dẫn hướng kim cương Diamond Wire Guide.',
          confidenceScore: 94,
          failureMechanism: 'Điện áp sụt còn ' + incident.telemetrySnapshot.dischargeVoltage + 'V trong khi dòng đỉnh vọt lên ' + incident.telemetrySnapshot.peakCurrent + 'A, vòi phun xả cao áp bị suy giảm áp suất làm nhiệt độ cục bộ tăng cao làm nóng chảy đứt dây đồng.',
          stepByStepGuide: [
            'Bước 1: Ngắt công tắc phát xung Discharge Power và kích hoạt chế độ LOTO tủ điện.',
            'Bước 2: Dùng kính lúp kiểm tra lỗ dẫn hướng kim cương trên và dưới, lau sạch cặn xỉ bằng que nỉ chuyên dụng tẩm dung dịch Makino Cleaner.',
            'Bước 3: Kiểm tra áp lực vòi phun nước xả phụ. Nếu áp suất < 1.0 Bar, súc rửa lưới lọc sơ cấp hoặc thay lõi lọc giấy 3-micron.',
            'Bước 4: Luồn lại dây đồng mới 0.25mm, cài đặt lực căng chuẩn 13.5N và khởi động lại chu kỳ gia công.',
          ],
          safetyWarnings: [
            'Khóa an toàn nguồn phát xung (Discharge Generator OFF) trước khi chạm vào cụm đầu dẫn hướng.',
            'Đeo kính bảo hộ để tránh dung môi tẩy rửa hoặc mạt xỉ bắn vào mắt.',
          ],
          requiredTools: ['Que nỉ vi sợi lau kim cương', 'Dung môi làm sạch Makino Cleaner', 'Kính lúp x10', 'Bộ lục giác 4mm, 5mm'],
          recommendedParts: ['Cuộn dây đồng Brass Wire 0.25mm', 'Lõi lọc giấy 3-micron', 'Khớp nối nhanh ống xả'],
          estimatedMttrMinutes: 25,
        };
      } else if (incident.errorCode === 'ALARM-204') {
        diagnosisData = {
          rootCause: 'Tụt áp suất dung dịch điện môi nguy hiểm do bám cặn muội carbon hoặc nghẹt đường hút bơm tuần hoàn.',
          confidenceScore: 92,
          failureMechanism: 'Cảm biến áp lực đo được ' + incident.telemetrySnapshot.dielectricPressure + ' Bar (dưới ngưỡng an toàn 0.8 Bar), hệ thống bảo vệ an toàn ngắt chu trình phóng điện ngăn nguy cơ cháy chập.',
          stepByStepGuide: [
            'Bước 1: Tắt bơm tuần hoàn chính và xả air bằng van Bleed Valve trên thân bơm.',
            'Bước 2: Áp dụng kinh nghiệm kỹ sư Hùng: Tháo rắc ren cảm biến áp suất S-104, dùng dung môi xịt rửa màng rung áp lực bị cặn nhớt bám sau phôi SKD11.',
            'Bước 3: Kiểm tra mức dung dịch trong bể lọc trung gian, bổ sung nước khử ion nếu dưới vạch Min.',
            'Bước 4: Bật lại bơm ở chế độ Manual Test để kiểm tra áp suất đạt > 1.2 Bar trước khi chạy Auto.',
          ],
          safetyWarnings: [
            'Xả toàn bộ áp suất dư trong đường ống trước khi tháo cảm biến áp lực.',
            'Không để dung dịch điện môi tràn ra sàn gây trơn trượt.',
          ],
          requiredTools: ['Cờ lê 17mm, 19mm', 'Bình xịt Carb Cleaner', 'Khăn lau vi sợi công nghiệp', 'Đồng hồ đo áp suất cầm tay'],
          recommendedParts: ['Gioăng cao su chữ O đường dầu', 'Lưới lọc thô bồn hút'],
          estimatedMttrMinutes: 20,
        };
      } else {
        diagnosisData = {
          rootCause: 'Bất thường nhiệt độ hoặc rung động cơ học tại khối công suất phát xung ' + incident.errorCode + '.',
          confidenceScore: 89,
          failureMechanism: 'Cảm biến giám sát ghi nhận nhiệt độ ' + incident.telemetrySnapshot.dielectricTemp + '°C và độ rung ' + incident.telemetrySnapshot.vibration + ' mm/s vượt ngưỡng danh định.',
          stepByStepGuide: [
            'Bước 1: Cho máy nghỉ làm mát 15 phút, ngắt nguồn tủ điện động lực.',
            'Bước 2: Kiểm tra quạt hút tản nhiệt khối công suất và xịt sạch bụi bám trên cánh tản nhiệt.',
            'Bước 3: Kiểm tra độ dẫn điện của dung dịch điện môi, thay túi hạt nhựa ion nếu quá ngưỡng 8 uS/cm.',
            'Bước 4: Khởi động lại hệ thống ở chế độ tải thấp 50% để theo dõi nhiệt độ ổn định.',
          ],
          safetyWarnings: [
            'Chờ ít nhất 5 phút sau khi ngắt điện để tụ điện cao áp phóng hết điện tích dư.',
          ],
          requiredTools: ['Súng xịt khí khô nén', 'Đồng hồ đo vạn năng VOM', 'Tua vít bake cách điện'],
          recommendedParts: ['Quạt làm mát 24VDC Sunon', 'Túi hạt nhựa trao đổi ion DI Resin'],
          estimatedMttrMinutes: 30,
        };
      }
    }

    if (voiceSymptoms && diagnosisData) {
      diagnosisData.failureMechanism = `${diagnosisData.failureMechanism} (Phân tích theo triệu chứng KTV mô tả qua giọng nói: "${voiceSymptoms}")`;
      if (!diagnosisData.stepByStepGuide.some((s: string) => s.includes('giọng nói') || s.includes('triệu chứng'))) {
        diagnosisData.stepByStepGuide.unshift(`Bước ưu tiên: Kiểm tra và xử lý trực tiếp triệu chứng rảnh tay đã ghi nhận: "${voiceSymptoms}".`);
      }
    }

    // Synthesize history correlation insights for the device
    if (device.id === 'dev-01' || incident.errorCode === 'E-102') {
      diagnosisData.historyCorrelation = {
        correlatedTaskTitle: 'Bảo dưỡng định kỳ 500 giờ & Thay cụm dẫn hướng kim cương P-104',
        lastMaintenanceDate: '2026-09-22',
        operatingHoursAtMaintenance: 4210,
        hoursElapsedSince: 380,
        partsReplacedInPast: ['Bộ dẫn hướng kim cương trên/dưới 0.25mm', 'Khối tiếp điện cacbua', 'Lõi lọc giấy ion 3-micron'],
        findingsHistory: 'Cụm dẫn hướng kim cương trên từng có vết xước do xỉ mạ khi gia công phôi SKD11 dày.',
        riskHypothesis: 'Dữ liệu bảo dưỡng ngày 22/09 cho thấy máy đã chạy thêm 380 giờ kể từ lần thay dẫn hướng gần nhất. Lõi lọc giấy ion và đầu phun áp cao E-102 sắp đạt chu kỳ bão hòa 500h, làm giảm áp lực thổi xỉ và dẫn tới đứt dây đồng tái diễn.',
        correlationPercentage: 88,
        preventiveActionAdvised: 'Nên súc rửa siêu âm lại cụm vòi phun và kiểm tra độ bẩn lõi lọc giấy trước khi thay cả bộ dẫn hướng mới.',
      };
    } else if (device.id === 'dev-02' || incident.errorCode === 'SPW-303') {
      diagnosisData.historyCorrelation = {
        correlatedTaskTitle: 'Vệ sinh tản nhiệt khối công suất IGBT & Thay quạt hút tủ điều khiển (SPW-303)',
        lastMaintenanceDate: '2026-09-05',
        operatingHoursAtMaintenance: 3520,
        hoursElapsedSince: 420,
        partsReplacedInPast: ['Quạt tản nhiệt biến tần Sunon 24VDC', 'Phớt cơ khí làm kín Ceramic'],
        findingsHistory: 'Lưới lọc bụi tủ điều khiển bị nghẹt mạt kim loại và quạt hút biến tần bị kẹt sau chu kỳ cắt thô.',
        riskHypothesis: 'Lịch sử máy cho thấy quạt hút tản nhiệt và phớt cơ khí buồng bơm từng phải thay thế do nhiệt độ môi trường cao. Sự cố hiện tại khớp 92% với chu kỳ bám bụi lại của lưới lọc khí nén tủ điện.',
        correlationPercentage: 92,
        preventiveActionAdvised: 'Dùng súng xịt khí khô làm sạch tấm lọc tủ nguồn xung và kiểm tra cảm biến nhiệt PT100.',
      };
    } else {
      diagnosisData.historyCorrelation = {
        correlatedTaskTitle: 'Bảo dưỡng định kỳ hệ thống thủy lực, điện môi & Hiệu chuẩn trục Z',
        lastMaintenanceDate: '2026-08-28',
        operatingHoursAtMaintenance: 4020,
        hoursElapsedSince: 320,
        partsReplacedInPast: ['Mỡ bôi trơn chuyên dụng Kluber Isoflex', 'Gioăng cao su làm kín'],
        findingsHistory: 'Áp lực bơm điện môi và độ rơ trục vít me bi từng được hiệu chỉnh.',
        riskHypothesis: 'Dữ liệu bảo dưỡng định kỳ ghi nhận thiết bị đã chạy hơn 300 giờ sau lần hiệu chuẩn. Sự cố hiện tại có mối tương quan 79% với độ hao mòn cơ khí và bám cặn muội than ở cụm van điều áp.',
        correlationPercentage: 79,
        preventiveActionAdvised: 'Kiểm tra độ nhớt dung môi và xả air cụm van an toàn theo SOP-EDM-04.',
      };
    }

    // Historical AI Repair ETA Analysis
    const normCode = incident.errorCode || 'E-102';
    let baseEta = diagnosisData.estimatedMttrMinutes || 42;
    if (baseEta < 15) baseEta = 35;

    const sampleCount = normCode === 'E-102' ? 5 : normCode === 'SPW-303' ? 4 : normCode === 'ALARM-204' ? 4 : 3;
    const avgHistorical = normCode === 'E-102' ? 42 : normCode === 'SPW-303' ? 55 : normCode === 'ALARM-204' ? 48 : 45;
    const minHistorical = normCode === 'E-102' ? 28 : normCode === 'SPW-303' ? 35 : normCode === 'ALARM-204' ? 32 : 30;
    const maxHistorical = normCode === 'E-102' ? 65 : normCode === 'SPW-303' ? 80 : normCode === 'ALARM-204' ? 70 : 65;

    const now = new Date();
    const completionDate = new Date(now.getTime() + baseEta * 60 * 1000);
    const completionTimeStr = `${completionDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} (sau ~${baseEta} phút)`;

    const s1 = Math.max(5, Math.round(baseEta * 0.16));
    const s2 = Math.max(10, Math.round(baseEta * 0.44));
    const s3 = Math.max(5, Math.round(baseEta * 0.24));
    const s4 = Math.max(4, baseEta - (s1 + s2 + s3));

    const repairEtaAnalysis: any = {
      estimatedMinutes: baseEta,
      estimatedCompletionTime: completionTimeStr,
      confidenceScore: diagnosisData.confidenceScore || 94,
      confidenceLevel: (diagnosisData.confidenceScore || 94) >= 90 ? 'VERY_HIGH' : 'HIGH',
      complexityLevel: baseEta <= 30 ? 'SIMPLE' : baseEta <= 50 ? 'STANDARD' : 'COMPLEX',
      historicalBenchmark: {
        sampleCount,
        averageMinutes: avgHistorical,
        minMinutes: minHistorical,
        maxMinutes: maxHistorical,
        fastestTechnician: 'Lê Hoàng Nam (28 phút)',
        mostFrequentPartsReplaced: diagnosisData.recommendedParts || [
          'Ống xả áp cao Upper Nozzle 4mm',
          'Gioăng cao su làm kín nắp buồng phun',
        ],
        pastOccurrencesDates: ['2026-10-04', '2026-09-28', '2026-09-22', '2026-09-12'],
      },
      stagedBreakdown: [
        {
          stageName: 'Giai đoạn 1: Cô lập LOTO & Chuẩn bị hiện trường',
          durationMinutes: s1,
          description: 'Ngắt nguồn xung Discharge Generator, khóa LOTO tủ điện, xả áp lực bồn nước làm mát và đưa bàn máy về vị trí an toàn.',
          recommendedTools: ['Khóa an toàn LOTO', 'Găng tay cao su cách điện'],
        },
        {
          stageName: 'Giai đoạn 2: Tháo dỡ, Vệ sinh & Thay thế linh kiện hỏng',
          durationMinutes: s2,
          description: `Tháo cụm vòi phun/bộ tiếp điện, tẩy mạt kim loại và lắp linh kiện mới (${(diagnosisData.recommendedParts && diagnosisData.recommendedParts[0]) || 'Linh kiện chính'}).`,
          recommendedTools: ['Bộ cờ lê lục giác', 'Dung môi súc rửa siêu âm', 'Kẹp gắp phoi'],
        },
        {
          stageName: 'Giai đoạn 3: Căn chỉnh cơ khí, Rà dây & Cân áp lực',
          durationMinutes: s3,
          description: 'Rà độ thẳng dây cắt bằng block chuẩn, kiểm tra lực căng dây 13.0N và hiệu chỉnh cảm biến áp suất.',
          recommendedTools: ['Đồng hồ so 0.001mm', 'Thước vuông chuẩn ceramic'],
        },
        {
          stageName: 'Giai đoạn 4: Chạy thử không tải & Test phóng điện thực tế',
          durationMinutes: s4,
          description: 'Bơm đầy dung môi điện môi, chạy chu trình mồi dây tự động AWF và test đánh lửa thử (Test Spark) trên phôi 5mm.',
          recommendedTools: ['Phôi thép SKD11 thử nghiệm', 'Kính lúp kiểm tra vết cắt'],
        },
      ],
      influencingFactors: [
        `Phân tích đối chiếu ${sampleCount} lần sửa chữa mã [${normCode}] trong dữ liệu lịch sử xưởng (Thời gian sửa trung bình: ${avgHistorical} phút).`,
        `Độ lệch cảm biến điện áp/áp suất tại thời điểm dừng máy (${device.telemetry.dielectricPressure} Bar, ${device.telemetry.dischargeVoltage} V).`,
        `Máy đã vận hành ${device.serviceHoursSinceLastReset || 380}h kể từ lần bảo dưỡng lớn.`,
      ],
      riskDelayFactors: [
        'Nghẹt mạt sắt sâu trong đường ống dẫn áp cao có thể phát sinh thêm thời gian ngâm rửa siêu âm (+10-15 phút).',
        'Cần căn chỉnh cẩn thận góc nghiêng U/V để tránh sai lệch độ vuông góc phôi cắt.',
      ],
      aiAccelerationTips: [
        'Sử dụng cụm vòi phun dự phòng đã ngâm rửa sẵn trong bể siêu âm để lắp ngay, không vệ sinh tại hiện trường (tiết kiệm 12 phút).',
        'Dùng cờ lê lực đúng định mức siết 4.2 N.m để tránh làm rách gioăng cao su nắp buồng phun.',
      ],
      historicalCorrelationRationale: `Hệ thống AI đã đối chiếu ${sampleCount} ca sửa chữa mã lỗi [${normCode}] trong quá khứ. Thời gian hoàn tất trung bình là ${avgHistorical} phút. Với tình trạng hiện tại, thời gian dự kiến hoàn thành là ${baseEta} phút (Độ tin cậy ${diagnosisData.confidenceScore || 94}%).`,
      generatedAt: now.toISOString(),
    };

    diagnosisData.repairEtaAnalysis = repairEtaAnalysis;

    const diagnosis: AIDiagnosis = {
      ...diagnosisData,
      matchedLearningsCount: relevantLearnings.length,
      matchedDocsCount: relevantDocs.length,
      generatedAt: new Date().toISOString(),
    };

    if (device.activeIncident) {
      device.activeIncident.aiDiagnosis = diagnosis;
    }

    res.json({
      success: true,
      data: diagnosis,
      sourceLearnings: relevantLearnings,
      sourceDocs: relevantDocs.map((d) => ({ id: d.id, title: d.title, category: d.category })),
    });
  } catch (err: any) {
    console.error('AI diagnosis error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi chẩn đoán AI' });
  }
});

// 8.1 Dedicated Endpoint: AI Repair ETA Estimation Engine
app.post('/api/ai/estimate-repair-eta', (req, res) => {
  try {
    const { deviceId, errorCode, technicianName, hasSparePartsReady, assistantsCount, voiceSymptoms } = req.body;
    const device = devices.find((d) => d.id === deviceId);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Thiết bị không tồn tại' });
    }

    const normCode = (errorCode || device.activeIncident?.errorCode || 'E-102').toUpperCase().trim();
    let baseMinutes = 42;
    if (normCode === 'SPW-303') baseMinutes = 55;
    else if (normCode === 'ALARM-204') baseMinutes = 48;
    else if (normCode === 'AXIS-Z') baseMinutes = 65;

    // Adjustments
    if (assistantsCount >= 2) {
      baseMinutes = Math.round(baseMinutes * 0.8);
    }
    if (hasSparePartsReady === false) {
      baseMinutes += 12;
    }

    const now = new Date();
    const completionDate = new Date(now.getTime() + baseMinutes * 60 * 1000);
    const completionTimeStr = `${completionDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} (sau ~${baseMinutes} phút)`;

    const s1 = Math.max(5, Math.round(baseMinutes * 0.16));
    const s2 = Math.max(10, Math.round(baseMinutes * 0.44));
    const s3 = Math.max(5, Math.round(baseMinutes * 0.24));
    const s4 = Math.max(4, baseMinutes - (s1 + s2 + s3));

    const analysis = {
      estimatedMinutes: baseMinutes,
      estimatedCompletionTime: completionTimeStr,
      confidenceScore: 94,
      confidenceLevel: 'VERY_HIGH',
      complexityLevel: baseMinutes <= 30 ? 'SIMPLE' : baseMinutes <= 50 ? 'STANDARD' : 'COMPLEX',
      historicalBenchmark: {
        sampleCount: 5,
        averageMinutes: 42,
        minMinutes: 28,
        maxMinutes: 65,
        fastestTechnician: 'Lê Hoàng Nam (28 phút)',
        mostFrequentPartsReplaced: ['Ống xả áp cao Upper Nozzle', 'Gioăng làm kín'],
        pastOccurrencesDates: ['2026-10-04', '2026-09-28', '2026-09-22'],
      },
      stagedBreakdown: [
        {
          stageName: 'Giai đoạn 1: Cô lập LOTO & Chuẩn bị hiện trường',
          durationMinutes: s1,
          description: 'Ngắt nguồn xung Discharge Generator, khóa LOTO tủ điện, xả áp lực bồn nước.',
        },
        {
          stageName: 'Giai đoạn 2: Tháo dỡ, Vệ sinh & Thay thế linh kiện hỏng',
          durationMinutes: s2,
          description: 'Tháo cụm vòi phun, thông tắc siêu âm và lắp linh kiện mới.',
        },
        {
          stageName: 'Giai đoạn 3: Căn chỉnh cơ khí, Rà dây & Cân áp lực',
          durationMinutes: s3,
          description: 'Rà độ thẳng dây cắt bằng block chuẩn, kiểm tra lực căng dây 13.0N.',
        },
        {
          stageName: 'Giai đoạn 4: Chạy thử không tải & Test phóng điện thực tế',
          durationMinutes: s4,
          description: 'Bơm dung môi điện môi, chạy chu trình mồi dây tự động AWF và test đánh lửa thử.',
        },
      ],
      influencingFactors: [
        `Phân tích dữ liệu lịch sử sửa chữa mã [${normCode}] tại xưởng.`,
        `Kỹ thuật viên phụ trách: ${technicianName || 'Hiện trường'}.`,
        assistantsCount >= 2 ? 'Phối hợp 2 người (-20% thời gian).' : '1 KTV độc lập.',
      ],
      riskDelayFactors: [
        'Nguy cơ nghẹt mạt sâu nếu không súc rửa kỹ vòi phun áp cao.',
      ],
      aiAccelerationTips: [
        'Chuẩn bị sẵn linh kiện và cụm vòi phun đã ngâm rửa siêu âm để thay ngay.',
      ],
      historicalCorrelationRationale: `Ước tính ${baseMinutes} phút dựa trên dữ liệu đối chiếu lịch sử và điều kiện hiện trường máy ${device.code}.`,
      generatedAt: now.toISOString(),
    };

    res.json({ success: true, data: analysis });
  } catch (err: any) {
    console.error('Estimate ETA error:', err);
    res.status(500).json({ success: false, message: 'Lỗi tính toán ETA' });
  }
});

// 8.1b AI Predictive Maintenance Schedule based on Vibration & Current Telemetry
app.post('/api/ai/predictive-maintenance/vibration-current-schedule', async (req, res) => {
  try {
    const { deviceId } = req.body;
    const targetDevice = deviceId ? devices.find((d) => d.id === deviceId) : null;

    if (deviceId && !targetDevice) {
      return res.status(404).json({ success: false, message: 'Thiết bị không tồn tại' });
    }

    const targetDevices = targetDevice ? [targetDevice] : devices;

    // Helper to calculate AI vibration and current prognosis
    const scheduleItems = targetDevices.map((d) => {
      const vib = d.telemetry.vibration || 0.8;
      const [minVib, maxVib] = d.nominalRanges.vibration || [0.1, 1.8];
      const cur = d.telemetry.peakCurrent || 25;
      const [minAmp, maxAmp] = d.nominalRanges.peakCurrent || [15, 35];

      const vibDev = vib > maxVib ? Math.round(((vib - maxVib) / maxVib) * 100) : 0;
      const curDev = cur > maxAmp ? Math.round(((cur - maxAmp) / maxAmp) * 100) : 0;

      let urgency: 'CRITICAL_URGENT' | 'HIGH_WARNING' | 'SCHEDULED_NORMAL' | 'OPTIMAL' = 'OPTIMAL';
      let hoursRemaining = 120;

      if (d.status === 'ALARM_STOPPED' || vib >= maxVib * 1.3 || cur >= maxAmp * 1.15) {
        urgency = 'CRITICAL_URGENT';
        hoursRemaining = Math.max(2, (d.id.charCodeAt(d.id.length - 1) % 10) + 4);
      } else if (vib >= maxVib || cur >= maxAmp || vibDev > 10 || curDev > 10) {
        urgency = 'HIGH_WARNING';
        hoursRemaining = (d.id.charCodeAt(d.id.length - 1) % 20) + 24;
      } else if (vib >= (minVib + maxVib) / 2) {
        urgency = 'SCHEDULED_NORMAL';
        hoursRemaining = (d.id.charCodeAt(d.id.length - 1) % 48) + 72;
      }

      const now = new Date();
      const targetTime = new Date(now.getTime() + hoursRemaining * 3600000);
      const formattedDate = `${targetTime.getHours().toString().padStart(2, '0')}:${targetTime.getMinutes().toString().padStart(2, '0')} ${hoursRemaining < 24 ? 'Hôm nay' : 'Ngày mai'} (${targetTime.toLocaleDateString('vi-VN')})`;

      return {
        deviceId: d.id,
        deviceCode: d.code,
        deviceName: d.name,
        deviceModel: d.model,
        hoursRemaining,
        predictedDate: targetTime.toISOString(),
        predictedDateFormatted: formattedDate,
        urgency,
        vibration: {
          current: vib,
          max: maxVib,
          deviationPercent: vibDev,
          status: vib >= maxVib * 1.3 ? 'CRITICAL' : vib >= maxVib ? 'ELEVATED' : 'NORMAL',
        },
        currentAmp: {
          current: cur,
          max: maxAmp,
          deviationPercent: curDev,
          status: cur >= maxAmp * 1.15 ? 'CRITICAL' : cur >= maxAmp ? 'ELEVATED' : 'NORMAL',
        },
        summary: `AI phân tích: Rung động ${vib} mm/s & Dòng điện ${cur}A. Khuyến nghị can thiệp sau ${hoursRemaining}h để tránh quá nhiệt và mòn dẫn hướng.`,
      };
    });

    res.json({
      success: true,
      items: scheduleItems,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('AI predictive schedule error:', err);
    res.status(500).json({ success: false, message: 'Lỗi dự báo bảo trì AI' });
  }
});

// 8.2 AI Industrial Root Cause Analysis (RCA) & Stoppage Resolution Engine
app.post('/api/ai/root-cause-analysis', async (req, res) => {
  try {
    const { deviceId, errorCode, timeframe, customSymptoms, userNotes } = req.body;
    const targetDevice = deviceId && deviceId !== 'ALL' ? devices.find((d) => d.id === deviceId) : null;
    const normCode = (errorCode && errorCode !== 'ALL' ? errorCode : (targetDevice?.activeIncident?.errorCode || 'E-102')).toUpperCase().trim();

    // 1. Gather historical maintenance records
    let relevantRecords = [...maintenanceRecords];
    if (targetDevice) {
      relevantRecords = relevantRecords.filter((r) => r.deviceId === targetDevice.id);
    }
    if (normCode && normCode !== 'ALL') {
      relevantRecords = relevantRecords.filter((r) =>
        r.taskTitle.toUpperCase().includes(normCode) ||
        (r.incidentDescription || '').toUpperCase().includes(normCode) ||
        (r.repairActions || '').toUpperCase().includes(normCode)
      );
    }

    // Timeframe filtering
    const nowMs = Date.now();
    if (timeframe === '7D') {
      relevantRecords = relevantRecords.filter((r) => nowMs - new Date(r.completedAt).getTime() <= 7 * 86400000);
    } else if (timeframe === '30D') {
      relevantRecords = relevantRecords.filter((r) => nowMs - new Date(r.completedAt).getTime() <= 30 * 86400000);
    } else if (timeframe === '90D') {
      relevantRecords = relevantRecords.filter((r) => nowMs - new Date(r.completedAt).getTime() <= 90 * 86400000);
    }

    const totalOccurrences = Math.max(1, relevantRecords.length);
    const totalDowntimeMinutes = relevantRecords.reduce((acc, r) => acc + (r.durationMinutes || 45), 0);
    const avgMttrMinutes = Math.round(totalDowntimeMinutes / totalOccurrences);

    // Spare parts frequency
    const partsCountMap: Record<string, number> = {};
    relevantRecords.forEach((r) => {
      r.partsReplaced?.forEach((part) => {
        partsCountMap[part] = (partsCountMap[part] || 0) + 1;
      });
    });
    const frequentParts = Object.entries(partsCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => `${name} (${count} lần)`);

    // Relevant Technical Documentation
    const matchedDocs = technicalDocuments.filter((doc) =>
      doc.content.includes(normCode) || (targetDevice && doc.targetModel.includes(targetDevice.brand))
    ).map((d) => d.title);

    // Relevant AI Knowledge Brain Learnings
    const matchedLearnings = aiLearnings.filter((l) =>
      l.errorCode === normCode || (targetDevice && l.machineModel.includes(targetDevice.brand))
    ).map((l) => `${l.title}: ${l.humanSolution}`);

    const prompt = `
Bạn là "EDM Industrial AI Root Cause Specialist" - Chuyên gia hàng đầu về phân tích nguyên nhân gốc rễ sự cố dừng máy (Root Cause Analysis - RCA) cho hệ thống gia công tia lửa điện công nghiệp (Wire Cut EDM & Sinker EDM) thuộc các hãng Makino, Sodick, Fanuc, Mitsubishi.

BỐI CẢNH DỮ LIỆU HIỆN TRƯỜNG & LỊCH SỬ HỆ THỐNG EDM:
- Thiết bị mục tiêu: ${targetDevice ? `${targetDevice.name} (${targetDevice.code}), Model: ${targetDevice.model}, Loại: ${targetDevice.type}, Vị trí: ${targetDevice.location}` : 'Toàn bộ xưởng EDM (Phân tích tổng thể cụm máy)'}
- Trạng thái hiện tại: ${targetDevice ? targetDevice.status : 'GIÁM SÁT TỔNG THỂ'}
- Mã lỗi / Hiện tượng dừng máy cần phân tích: [${normCode}]
- Khung thời gian dữ liệu: ${timeframe || '30D'}
- Số lần sự cố dừng máy đã ghi nhận trong lịch sử: ${totalOccurrences} lần
- Tổng thời gian dừng máy (Downtime): ${totalDowntimeMinutes} phút (~${(totalDowntimeMinutes / 60).toFixed(1)} giờ)
- Thời gian trung bình phục hồi sửa chữa (MTTR): ${avgMttrMinutes} phút/sự cố
- Các phụ tùng hay phải thay thế nhất: ${frequentParts.length > 0 ? frequentParts.join(', ') : 'Chưa ghi nhận'}
- Triệu chứng kỹ thuật viên quan sát được tại hiện trường: "${customSymptoms || 'Máy dừng đột ngột kèm cảnh báo hệ thống'}"
- Ghi chú bổ sung từ KTV: "${userNotes || 'Không có'}"
- Hồ sơ bài học kỹ thuật liên quan: ${matchedLearnings.length > 0 ? matchedLearnings.slice(0, 2).join(' | ') : 'Tiêu chuẩn xưởng'}
- Tài liệu SOP/OEM liên quan: ${matchedDocs.length > 0 ? matchedDocs.slice(0, 2).join(' | ') : 'Cẩm nang vận hành Makino/Sodick'}

YÊU CẦU PHÂN TÍCH:
Hãy sử dụng phương pháp luận chuẩn công nghiệp:
1. Phân tích nguyên nhân gốc rễ cốt lõi (Primary Root Cause) và cơ chế hư hỏng kỹ thuật chuyên sâu (Failure Mechanism).
2. Chuỗi 5 cấp độ "Tại sao" (5 Whys Chain) dẫn từ triệu chứng bên ngoài đến khiếm khuyết trong quy trình hoặc bảo trì.
3. Biểu đồ Ishikawa Xương cá 6M (MAN, MACHINE, MATERIAL, METHOD, MEASUREMENT, ENVIRONMENT) kèm điểm tác động ImpactScore (0-100%).
4. Đề xuất hai phương án sửa chữa:
   a) Giải pháp Nhanh Cấp Bách (Quick-Fix < 15-20 phút): Khôi phục máy vận hành ngay để không trễ tiến độ đơn hàng.
   b) Giải pháp Triệt Để Bền Vững (Permanent Root-Fix): Xử lý tận gốc rễ, ngăn chặn tái phát trong tương lai kèm chính sách bảo trì phòng ngừa.
5. Quy trình khắc phục từng bước chi tiết (Action Steps) có phân loại giai đoạn, độ khó, dụng cụ cần có, thời gian ước tính và lưu ý an toàn.
6. Đề xuất linh kiện vật tư thay thế chính xác kèm mã part number.
7. Cảnh báo an toàn công nghiệp sống còn (LOTO, điện áp cao tần, áp lực dư).
`;

    const rcaSchema = {
      type: Type.OBJECT,
      properties: {
        primaryRootCause: { type: Type.STRING },
        confidenceScore: { type: Type.INTEGER },
        recurrenceProbability: { type: Type.INTEGER },
        failureMechanismDeepDive: { type: Type.STRING },
        ishikawaCategories: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              categoryLabel: { type: Type.STRING },
              causes: { type: Type.ARRAY, items: { type: Type.STRING } },
              impactScore: { type: Type.INTEGER },
            },
            required: ['category', 'categoryLabel', 'causes', 'impactScore'],
          },
        },
        fiveWhysChain: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.INTEGER },
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
              evidence: { type: Type.STRING },
            },
            required: ['level', 'question', 'answer', 'evidence'],
          },
        },
        quickFixSolution: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            estimatedMinutes: { type: Type.INTEGER },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['summary', 'estimatedMinutes', 'steps'],
        },
        permanentRepairSolution: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            estimatedMinutes: { type: Type.INTEGER },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            preventionPolicy: { type: Type.STRING },
          },
          required: ['summary', 'estimatedMinutes', 'steps', 'preventionPolicy'],
        },
        actionSteps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              stepNumber: { type: Type.INTEGER },
              phase: { type: Type.STRING },
              actionTitle: { type: Type.STRING },
              actionDetail: { type: Type.STRING },
              estimatedMinutes: { type: Type.INTEGER },
              requiredTools: { type: Type.ARRAY, items: { type: Type.STRING } },
              requiredParts: { type: Type.ARRAY, items: { type: Type.STRING } },
              safetyNotice: { type: Type.STRING },
              difficulty: { type: Type.STRING },
            },
            required: ['stepNumber', 'phase', 'actionTitle', 'actionDetail', 'estimatedMinutes', 'requiredTools', 'difficulty'],
          },
        },
        recommendedParts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              partNumber: { type: Type.STRING },
              urgency: { type: Type.STRING },
              inStockEstimate: { type: Type.INTEGER },
            },
            required: ['name', 'partNumber', 'urgency'],
          },
        },
        criticalSafetyGuidelines: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: [
        'primaryRootCause',
        'confidenceScore',
        'recurrenceProbability',
        'failureMechanismDeepDive',
        'ishikawaCategories',
        'fiveWhysChain',
        'quickFixSolution',
        'permanentRepairSolution',
        'actionSteps',
        'recommendedParts',
        'criticalSafetyGuidelines',
      ],
    };

    let rcaData: any = null;

    try {
      const responseText = await callGeminiWithFallback(prompt, rcaSchema);
      rcaData = JSON.parse(responseText);
    } catch (apiErr) {
      console.warn('Gemini RCA API call failed, generating domain fallback:', apiErr);

      // Deterministic industrial domain fallback based on error code & machine type
      if (normCode === 'E-102') {
        rcaData = {
          primaryRootCause: 'Cặn xỉ kim loại và mạt phôi siêu mịn tích tụ làm nghẽn 35-40% tiết diện vòi xả cao áp Upper Nozzle, dẫn tới sụt áp suất dung dịch điện môi (< 0.7 MPa) làm quá nhiệt cục bộ tại khe phóng điện và gây đứt dây đồng liên tục.',
          confidenceScore: 96,
          recurrenceProbability: 82,
          failureMechanismDeepDive: 'Khi vòi phun xả áp cao phía trên bị nghẽn một phần bởi xỉ thép SKD11, lưu lượng nước khử ion bọc quanh dây cắt bị thiếu hụt. Vùng hồ quang không được làm mát và cuốn phoi kịp thời, nhiệt độ khe hở vọt lên trên 900°C làm chảy đứt dây đồng ø0.25mm trong khi điện áp phóng điện giảm đột ngột và dòng đỉnh tăng vọt.',
          ishikawaCategories: [
            {
              category: 'MACHINE',
              categoryLabel: 'Máy móc & Đầu cắt',
              causes: ['Cụm dẫn hướng kim cương Diamond Guide bị xước rãnh dẫn', 'Vòi phun xả áp cao (Upper Nozzle) bị xỉ mạ đóng cặn', 'Độ rơ cụm căng dây cơ khí'],
              impactScore: 88,
            },
            {
              category: 'MATERIAL',
              categoryLabel: 'Vật tư & Tiêu hao',
              causes: ['Lõi lọc giấy ion 3-micron vượt quá tuổi thọ 250 giờ', 'Dây đồng Brass Wire bề mặt có lớp oxit không đồng đều'],
              impactScore: 72,
            },
            {
              category: 'METHOD',
              categoryLabel: 'Phương pháp & Thông số',
              causes: ['Thời gian phóng xung On-Time (Ton) cài đặt quá lớn khi cắt thép dày > 50mm', 'Tỷ lệ pha áp suất xả phụ chưa tối ưu'],
              impactScore: 65,
            },
            {
              category: 'MAN',
              categoryLabel: 'Con người & Vận hành',
              causes: ['KTV không súc rửa định kỳ vòi phun sau khi cắt vật liệu có độ thôi xỉ lớn', 'Bỏ qua bước kiểm tra áp lực xả nước trước khi bấm Auto'],
              impactScore: 58,
            },
            {
              category: 'MEASUREMENT',
              categoryLabel: 'Đo lường & Cảm biến',
              causes: ['Cảm biến đo áp lực nước xả màng rung bị trôi tín hiệu 0.15 MPa', 'Đồng hồ đo lực căng dây Tension Gauge chưa hiệu chuẩn'],
              impactScore: 45,
            },
            {
              category: 'ENVIRONMENT',
              categoryLabel: 'Môi trường xưởng',
              causes: ['Nhiệt độ bể nước tuần hoàn tăng trên 24.5°C vào ca chiều', 'Độ dẫn điện ion tăng trên 15 µS/cm'],
              impactScore: 40,
            },
          ],
          fiveWhysChain: [
            {
              level: 1,
              question: 'Tại sao máy EDM dừng đột ngột và báo lỗi E-102?',
              answer: 'Dây đồng cắt ø0.25mm bị đứt liên tục ngay tại khe hở phóng điện Spark Gap.',
              evidence: 'Ghi nhận 5 lần đứt dây trong 45 phút gia công.',
            },
            {
              level: 2,
              question: 'Tại sao dây đồng lại bị đứt tại khe phóng điện?',
              answer: 'Nhiệt độ cục bộ tại điểm cắt vượt ngưỡng chịu lực của dây đồng do thiếu nước xả làm mát.',
              evidence: 'Telemetry ghi nhận nhiệt độ buồng cắt tăng đột ngột lên 28.5°C.',
            },
            {
              level: 3,
              question: 'Tại sao nước xả làm mát không đủ lưu lượng bảo vệ dây?',
              answer: 'Áp suất vòi phun xả cao áp Upper Nozzle sụt giảm từ 1.8 MPa xuống còn 0.65 MPa.',
              evidence: 'Áp lực đo tại đầu vòi chỉ đạt 0.65 MPa (ngưỡng chuẩn: 1.6 - 2.0 MPa).',
            },
            {
              level: 4,
              question: 'Tại sao áp suất vòi xả lại bị sụt giảm nghiêm trọng?',
              answer: 'Tiết diện lỗ phun 4mm của vòi xả bị nghẹt 35% do mạt xỉ kim loại và màng bẩn tích tụ.',
              evidence: 'Phát hiện cặn bùn mạ kim loại bám chặt ở cổ vòi phun khi tháo kiểm tra.',
            },
            {
              level: 5,
              question: 'Tại sao xỉ kim loại lại tích tụ làm nghẹt vòi phun (Nguyên nhân cốt lõi)?',
              answer: 'Lõi lọc giấy ion 3-micron đã chạy 310 giờ (vượt 60 giờ so với khuyến cáo 250 giờ) dẫn đến các vi hạt xỉ lọt qua vòng tuần hoàn, kết hợp với việc thiếu quy trình ngâm rửa siêu âm vòi phun định kỳ hàng tuần.',
              evidence: 'Hồ sơ bảo trì ghi nhận lần thay lọc gần nhất cách đây 310 giờ vận hành liên tục.',
            },
          ],
          quickFixSolution: {
            summary: 'Thông tắc siêu âm vòi phun cấp tốc, đảo đầu tiếp điện cacbua và căn chỉnh lại áp lực nước xả đạt 1.8 MPa để tiếp tục cắt trong < 15 phút.',
            estimatedMinutes: 15,
            steps: [
              'Bước 1: Ngắt công tắc phát xung Discharge Power và khóa an toàn LOTO.',
              'Bước 2: Dùng que nỉ vi sợi và bình xịt dung môi Makino Cleaner thông lỗ vòi phun trên/dưới.',
              'Bước 3: Tăng van xả Flushing Pressure lên 1.8 MPa và luồn lại dây đồng mới.',
              'Bước 4: Chạy kiểm tra tia nước chụm thẳng không bị loe trước khi bấm Resume.',
            ],
          },
          permanentRepairSolution: {
            summary: 'Thay thế lõi lọc giấy ion 3-micron mới, thay cụm dẫn hướng kim cương Diamond Wire Guide P-104, súc rửa toàn bộ bình lắng xỉ và thiết lập lịch bảo dưỡng chu kỳ 200 giờ.',
            estimatedMinutes: 60,
            steps: [
              'Xả đáy toàn bộ bể lọc trung gian và vệ sinh bùn cặn xỉ bằng máy hút chuyên dụng.',
              'Thay mới 02 lõi lọc giấy ion 3-micron và thay hạt nhựa trao đổi ion (Deionizing Resin).',
              'Thay mới bộ dẫn hướng kim cương 0.25mm trên và dưới, căn chỉnh góc U/V bằng thước quang học.',
              'Cập nhật thông số lịch nhắc tự động Maintenance Reminder chu kỳ 200 giờ vào hệ thống.',
            ],
            preventionPolicy: 'Quy chuẩn hóa việc đo kiểm độ dẫn điện nước ion mỗi ca (< 10 µS/cm) và ngâm rửa siêu âm cụm vòi phun vào sáng thứ 2 hàng tuần.',
          },
          actionSteps: [
            {
              stepNumber: 1,
              phase: 'IMMEDIATE_QUICK_FIX',
              actionTitle: 'Cô lập an toàn LOTO & Giảm áp bồn cắt',
              actionDetail: 'Tắt nguồn phát xung Generator, xoay van xả cạn bồn làm việc về mức Zero, bật khóa an toàn LOTO tủ điện.',
              estimatedMinutes: 3,
              requiredTools: ['Khóa an toàn LOTO', 'Găng tay cao su công nghiệp'],
              safetyNotice: 'Tuyệt đối không chạm tay vào đầu cắt khi đèn báo xung High Voltage Discharge còn sáng.',
              difficulty: 'EASY',
            },
            {
              stepNumber: 2,
              phase: 'IMMEDIATE_QUICK_FIX',
              actionTitle: 'Thông tắc & Vệ sinh vòi phun cao áp (Upper Nozzle)',
              actionDetail: 'Tháo chốt kẹp vòi phun, dùng que thông lỗ nỉ 0.25mm ngâm dung môi xịt rửa sạch xỉ bám quanh màng phun.',
              estimatedMinutes: 7,
              requiredTools: ['Bộ que nỉ vi sợi', 'Dung môi tẩy xỉ Makino Cleaner', 'Bộ lục giác 4mm'],
              safetyNotice: 'Không dùng que kim loại sắc nhọn làm xước lòng lỗ kim cương.',
              difficulty: 'MEDIUM',
            },
            {
              stepNumber: 3,
              phase: 'CORRECTIVE_REPAIR',
              actionTitle: 'Kiểm tra & Thay thế lõi lọc giấy ion 3-micron',
              actionDetail: 'Mở nắp khoang lọc áp lực, nhấc bỏ lõi lọc cũ đã đen nghẹt, vệ sinh đáy bình và lắp lõi lọc mới đúng khớp ren gioăng.',
              estimatedMinutes: 25,
              requiredTools: ['Cờ lê vặn nắp bình lọc', 'Khay hứng nước thải'],
              requiredParts: ['Lõi lọc giấy ion 3-micron (P/N: EDM-FLT-3U)'],
              safetyNotice: 'Xả áp dư trong bình lọc qua van Bleed Valve trước khi vặn nắp.',
              difficulty: 'MEDIUM',
            },
            {
              stepNumber: 4,
              phase: 'LONG_TERM_PREVENTION',
              actionTitle: 'Cân chỉnh góc thẳng U/V và hiệu chuẩn lực căng dây 13.5N',
              actionDetail: 'Dùng khối block chuẩn vuông góc và đồng hồ so hiển vi, căn chỉnh góc dây thẳng tuyệt đối trong khoảng ±0.001mm.',
              estimatedMinutes: 25,
              requiredTools: ['Khối block chuẩn 90 độ', 'Đồng hồ so đo lực căng Tension Gauge'],
              requiredParts: ['Bộ dẫn hướng kim cương Diamond Guide 0.25mm'],
              safetyNotice: 'Thực hiện thao tác nhẹ nhàng tránh làm mẻ tinh thể kim cương.',
              difficulty: 'EXPERT',
            },
          ],
          recommendedParts: [
            { name: 'Lõi lọc giấy ion 3-micron', partNumber: 'EDM-FLT-3U-MAK', urgency: 'IMMEDIATE', inStockEstimate: 6 },
            { name: 'Ống xả áp cao Upper Nozzle 4mm', partNumber: 'NOZ-UP-40-U6', urgency: 'IMMEDIATE', inStockEstimate: 4 },
            { name: 'Bộ dẫn hướng kim cương 0.25mm P-104', partNumber: 'DG-025-P104', urgency: 'NEXT_SHIFT', inStockEstimate: 3 },
            { name: 'Khối tiếp điện cacbua (Energizing Plate)', partNumber: 'CARB-PLT-2026', urgency: 'SCHEDULED', inStockEstimate: 8 },
          ],
          criticalSafetyGuidelines: [
            'NGUY HIỂM ĐIỆN CAO TẦN: Luôn tắt cầu dao nguồn phát xung và kiểm tra đồng hồ vôn kế trước khi chạm vào đầu điện cực.',
            'ÁP LỰC DUNG DỊCH NƯỚC: Phải xả toàn bộ áp lực tồn dư trong đường ống xả cao áp trước khi tháo đầu kẹp vòi phun.',
            'BẢO VỆ MẮT: Trang bị kính bảo hộ chống tia bắn dung môi tẩy rửa công nghiệp và mạt xỉ vụn.',
          ],
        };
      } else if (normCode === 'ALARM-204') {
        rcaData = {
          primaryRootCause: 'Cặn muội carbon và màng dầu điện môi bị oxy hóa làm nghẽn cảm biến đo áp suất S-104 và đường hồi của bơm tuần hoàn chính, gây tụt áp suất dưới ngưỡng cảnh báo an toàn 0.8 Bar.',
          confidenceScore: 94,
          recurrenceProbability: 75,
          failureMechanismDeepDive: 'Áp suất dung dịch điện môi tụt từ 1.4 Bar xuống 0.5 Bar làm hệ thống tự ngắt bảo vệ nguồn phát xung để chống cháy chập phôi. Nguyên nhân do màng rung áp lực bị kẹt mạt kim loại và van điều áp hồi dầu bị kẹt ở vị trí mở một phần.',
          ishikawaCategories: [
            { category: 'MACHINE', categoryLabel: 'Hệ thống Thủy lực & Bơm', causes: ['Màng rung cảm biến áp lực S-104 bị bám cặn', 'Van điều áp áp suất hồi dầu bị kẹt lò xo', 'Cánh bơm tuần hoàn bị hao mòn'], impactScore: 90 },
            { category: 'MATERIAL', categoryLabel: 'Dung môi Điện môi', causes: ['Dầu điện môi dùng quá 2,000 giờ chưa lọc tái sinh', 'Nồng độ muội than vượt ngưỡng 12%'], impactScore: 80 },
            { category: 'METHOD', categoryLabel: 'Quy trình vận hành', causes: ['Không xả air bọt khí trên thân bơm sau khi châm dầu mới'], impactScore: 60 },
            { category: 'MAN', categoryLabel: 'Kỹ thuật viên', causes: ['Bỏ qua bước kiểm tra áp kế đo trước khi chạy chu kỳ phay xung'], impactScore: 50 },
            { category: 'MEASUREMENT', categoryLabel: 'Cảm biến & Tín hiệu', causes: ['Giắc cắm tín hiệu áp lực 4-20mA bị lỏng chân số 3'], impactScore: 45 },
            { category: 'ENVIRONMENT', categoryLabel: 'Môi trường làm việc', causes: ['Nhiệt độ phòng tăng làm độ nhớt dầu điện môi thay đổi'], impactScore: 35 },
          ],
          fiveWhysChain: [
            { level: 1, question: 'Tại sao máy dừng khẩn cấp mã ALARM-204?', answer: 'Hệ thống bảo vệ phát hiện áp suất điện môi sụt xuống dưới 0.8 Bar.', evidence: 'Telemetry báo áp suất chỉ còn 0.5 Bar.' },
            { level: 2, question: 'Tại sao áp suất đo được lại sụt xuống 0.5 Bar?', answer: 'Cảm biến S-104 gửi tín hiệu điện áp thấp về bộ điều khiển CNC.', evidence: 'Điện áp đo được tại chân rắc là 1.2V thay vì 3.5V.' },
            { level: 3, question: 'Tại sao cảm biến gửi tín hiệu áp lực thấp?', answer: 'Màng rung cảm biến bị phủ một lớp cặn muội carbon dày 0.5mm và van hồi bị kẹt.', evidence: 'Tháo cảm biến phát hiện muội đen dính chặt bề mặt tiếp xúc.' },
            { level: 4, question: 'Tại sao muội carbon lại bám nhiều như vậy?', answer: 'Lõi lọc dầu sơ cấp bị rách mép cao su làm cặn bẩn tuần hoàn liên tục trong hệ thống.', evidence: 'Lưới lọc 10-micron bị xé rách 5mm ở mép viền.' },
            { level: 5, question: 'Tại sao lưới lọc bị rách mà không phát hiện sớm (Root Cause)?', answer: 'Thiếu đồng hồ đo chênh áp (Differential Pressure Gauge) cảnh báo nghẹt lọc trước khi áp lực xé rách màng.', evidence: 'Không có cảm biến chênh áp cảnh báo trước trên đường ống lọc dầu.' },
          ],
          quickFixSolution: {
            summary: 'Xịt rửa siêu âm màng cảm biến S-104, gõ nhẹ giải kẹt van hồi và xả air bọt khí trên bơm trong 15 phút.',
            estimatedMinutes: 15,
            steps: [
              'Tắt bơm tuần hoàn và xả áp qua van Bleed Valve.',
              'Tháo rắc cảm biến S-104, xịt dung môi tẩy sạch muội carbon trên màng rung.',
              'Gõ nhẹ thân van điều áp để trả lò xo về vị trí kín.',
              'Bật bơm Manual Test để áp suất hồi phục > 1.2 Bar.',
            ],
          },
          permanentRepairSolution: {
            summary: 'Thay mới cụm cảm biến áp suất S-104, thay màng lọc dầu điện môi chịu áp cao và lắp thêm đồng hồ đo chênh áp cảnh báo sớm.',
            estimatedMinutes: 45,
            steps: [
              'Thay mới bộ cảm biến áp lực màng titan S-104.',
              'Thay bộ lọc giấy kép chịu áp 5-micron chuyên dụng cho dầu điện môi.',
              'Thực hiện lọc tuần hoàn khử cặn ly tâm toàn bộ bể chứa.',
            ],
            preventionPolicy: 'Quy định kiểm tra đồng hồ chênh áp mỗi đầu ca và thay lọc ngay khi chênh áp vượt 0.4 Bar.',
          },
          actionSteps: [
            { stepNumber: 1, phase: 'IMMEDIATE_QUICK_FIX', actionTitle: 'Xả áp suất và tháo cảm biến áp lực S-104', actionDetail: 'Xoay van xả áp dư, dùng cờ lê 22mm mở nhẹ khớp nối cảm biến, hứng khăn dầu.', estimatedMinutes: 5, requiredTools: ['Cờ lê miệng 22mm', 'Khăn lau thấm dầu'], safetyNotice: 'Coi chừng dầu nóng bắn ra nếu áp suất dư chưa xả hết.', difficulty: 'EASY' },
            { stepNumber: 2, phase: 'IMMEDIATE_QUICK_FIX', actionTitle: 'Vệ sinh màng rung áp lực bằng dung môi', actionDetail: 'Dùng bình xịt áp lực cao thổi sạch muội đen, đo kiểm điện trở tiếp xúc.', estimatedMinutes: 10, requiredTools: ['Bình xịt dung môi chuyên dụng', 'Đồng hồ VOM Fluke'], safetyNotice: 'Không dùng tua vít nhọn chọc vào màng rung cảm biến.', difficulty: 'MEDIUM' },
            { stepNumber: 3, phase: 'CORRECTIVE_REPAIR', actionTitle: 'Thay bộ lọc tinh dầu điện môi', actionDetail: 'Mở bầu lọc áp lực, thay thế cụm cartridge mới, siết đều lực các bu-lông nắp bầu lọc.', estimatedMinutes: 20, requiredTools: ['Bộ tuýp 14mm', 'Cần siết lực'], requiredParts: ['Lõi lọc dầu điện môi 5-micron'], safetyNotice: 'Lót khay thu gom dầu chống tràn ra mặt sàn xưởng.', difficulty: 'MEDIUM' },
          ],
          recommendedParts: [
            { name: 'Cảm biến áp suất dung dịch điện môi S-104', partNumber: 'SNS-PRESS-S104', urgency: 'IMMEDIATE', inStockEstimate: 2 },
            { name: 'Lõi lọc dầu điện môi 5-micron', partNumber: 'OIL-FLT-05U', urgency: 'IMMEDIATE', inStockEstimate: 5 },
            { name: 'Gioăng phớt làm kín bơm tuần hoàn', partNumber: 'SEAL-PMP-EDM', urgency: 'NEXT_SHIFT', inStockEstimate: 3 },
          ],
          criticalSafetyGuidelines: [
            'NGUY HIỂM DẦU ÁP SUẤT CAO: Tuyệt đối không nới lỏng đường ống dẫn dầu khi bơm tuần hoàn đang hoạt động.',
            'PHÒNG CHỐNG CHÁY NỔ: Tuyệt đối không hút thuốc hoặc tạo tia lửa gần bồn dung dịch điện môi gốc hydrocacbon.',
          ],
        };
      } else {
        // Generic industrial EDM stoppage fallback
        rcaData = {
          primaryRootCause: `Sự cố dừng máy đột ngột [${normCode}] do sai lệch tham số phóng điện và biến thiên cơ cấu chấp hành vượt ngưỡng an toàn của hệ thống điều khiển CNC.`,
          confidenceScore: 92,
          recurrenceProbability: 70,
          failureMechanismDeepDive: `Hệ thống ghi nhận sự suy giảm tín hiệu hồi tiếp và chênh lệch điện áp xung vượt dung sai cho phép trong quá trình gia công liên tục.`,
          ishikawaCategories: [
            { category: 'MACHINE', categoryLabel: 'Hệ thống Cơ khí & Điện tử', causes: ['Suy giảm tiếp xúc khối dẫn điện', 'Dao động điện áp lưới xưởng'], impactScore: 82 },
            { category: 'MATERIAL', categoryLabel: 'Vật tư & Tiêu hao', causes: ['Độ tinh khiết dung môi giảm'], impactScore: 68 },
            { category: 'METHOD', categoryLabel: 'Thông số công nghệ', causes: ['Cài đặt bước tiến dao quá nhanh'], impactScore: 60 },
            { category: 'MAN', categoryLabel: 'Thao tác kỹ thuật', causes: ['Chưa hiệu chuẩn lại tọa độ Zero'], impactScore: 50 },
            { category: 'MEASUREMENT', categoryLabel: 'Hệ đo lường', causes: ['Cảm biến quang học bị bụi mạt bám'], impactScore: 45 },
            { category: 'ENVIRONMENT', categoryLabel: 'Môi trường', causes: ['Độ ẩm xưởng cao'], impactScore: 35 },
          ],
          fiveWhysChain: [
            { level: 1, question: `Tại sao máy dừng báo lỗi ${normCode}?`, answer: 'Hệ thống bảo vệ ngắt chu trình gia công do vượt ngưỡng an toàn.', evidence: 'Mã lỗi ghi nhận trên màn hình CNC.' },
            { level: 2, question: 'Tại sao thông số lại vượt ngưỡng an toàn?', answer: 'Tín hiệu phản hồi điện áp hoặc áp suất có xung dao động bất thường.', evidence: 'Dữ liệu telemetry ghi nhận độ trôi tín hiệu.' },
            { level: 3, question: 'Tại sao tín hiệu bị dao động?', answer: 'Tiếp điểm dẫn điện hoặc cảm biến bị bám xỉ và mạt kim loại.', evidence: 'Kiểm tra thực tế có lớp xỉ bám bề mặt.' },
            { level: 4, question: 'Tại sao lớp xỉ không được làm sạch tự động?', answer: 'Lưu lượng xả rửa bị suy giảm 25% so với thiết kế chuẩn.', evidence: 'Áp lực bơm giảm dần qua thời gian.' },
            { level: 5, question: 'Tại sao lưu lượng bơm suy giảm (Root Cause)?', answer: 'Chu kỳ bảo trì màng lọc và van điều tiết bị chậm trễ so với lịch trình định kỳ.', evidence: 'Hồ sơ bảo trì vượt ngưỡng giờ vận hành chuẩn.' },
          ],
          quickFixSolution: {
            summary: 'Vệ sinh tiếp điểm, súc rửa cảm biến và reset cảnh báo trên bộ điều khiển CNC trong 15 phút.',
            estimatedMinutes: 15,
            steps: ['Tắt nguồn xung và ngắt điện an toàn', 'Vệ sinh bề mặt cảm biến và tiếp điểm', 'Reset mã lỗi trên màn hình CNC và chạy thử không tải'],
          },
          permanentRepairSolution: {
            summary: 'Hiệu chuẩn toàn diện hệ đo, thay thế bộ tiếp điện cacbua và cập nhật quy trình bảo dưỡng phòng ngừa.',
            estimatedMinutes: 50,
            steps: ['Thay thế tiếp điểm dẫn điện mòn', 'Hiệu chuẩn cảm biến bằng thiết bị đo chuẩn', 'Thiết lập ngưỡng cảnh báo sớm trên hệ thống'],
            preventionPolicy: 'Bổ sung bước kiểm tra tiếp điểm vào checklist đầu mỗi ca làm việc.',
          },
          actionSteps: [
            { stepNumber: 1, phase: 'IMMEDIATE_QUICK_FIX', actionTitle: 'Reset an toàn và kiểm tra tiếp xúc điện', actionDetail: 'Kiểm tra các giắc cắm tín hiệu và vệ sinh bề mặt tiếp điểm bằng cồn công nghiệp.', estimatedMinutes: 10, requiredTools: ['Bình xịt vệ sinh tiếp điểm', 'Khăn vi sợi'], safetyNotice: 'Ngắt nguồn điện trước khi thao tác tiếp điểm.', difficulty: 'EASY' },
            { stepNumber: 2, phase: 'CORRECTIVE_REPAIR', actionTitle: 'Hiệu chuẩn lại thông số gia công', actionDetail: 'Cài đặt lại tham số xung On-time và Off-time phù hợp với độ dày phôi.', estimatedMinutes: 20, requiredTools: ['Sổ tay thông số EDM CNC'], safetyNotice: 'Kiểm tra phôi đã được gá kẹp chắc chắn.', difficulty: 'MEDIUM' },
          ],
          recommendedParts: [
            { name: 'Khối tiếp điện cacbua', partNumber: 'CARB-CONTACT-01', urgency: 'IMMEDIATE', inStockEstimate: 4 },
            { name: 'Lõi lọc phụ', partNumber: 'SUB-FLT-2026', urgency: 'NEXT_SHIFT', inStockEstimate: 6 },
          ],
          criticalSafetyGuidelines: [
            'Tuân thủ nghiêm ngặt quy trình khóa LOTO trước khi mở cửa tủ điện điều khiển.',
            'Sử dụng đầy đủ trang bị bảo hộ cá nhân (PPE) khi tiếp xúc với dung dịch gia công.',
          ],
        };
      }
    }

    const result = {
      id: `rca-${Date.now()}`,
      deviceId: targetDevice ? targetDevice.id : 'ALL',
      deviceCode: targetDevice ? targetDevice.code : 'EDM-FLEET',
      deviceName: targetDevice ? targetDevice.name : 'Toàn bộ xưởng máy EDM',
      targetErrorCode: normCode,
      targetIncidentSummary: `Phân tích nguyên nhân dừng máy mã [${normCode}] trên cơ sở ${totalOccurrences} lần sự cố lịch sử (${totalDowntimeMinutes} phút downtime)`,
      analyzedAt: new Date().toISOString(),
      analyzedRecordsCount: totalOccurrences,
      primaryRootCause: rcaData.primaryRootCause,
      confidenceScore: rcaData.confidenceScore || 95,
      recurrenceProbability: rcaData.recurrenceProbability || 75,
      failureMechanismDeepDive: rcaData.failureMechanismDeepDive,
      ishikawaCategories: rcaData.ishikawaCategories || [],
      fiveWhysChain: rcaData.fiveWhysChain || [],
      quickFixSolution: rcaData.quickFixSolution || { summary: 'Sửa chữa nhanh cấp bách', estimatedMinutes: 15, steps: [] },
      permanentRepairSolution: rcaData.permanentRepairSolution || { summary: 'Sửa chữa triệt để', estimatedMinutes: 60, steps: [], preventionPolicy: '' },
      actionSteps: rcaData.actionSteps || [],
      recommendedParts: rcaData.recommendedParts || [],
      criticalSafetyGuidelines: rcaData.criticalSafetyGuidelines || [],
      historicalPrecedents: relevantRecords.slice(0, 4).map((r, idx) => ({
        recordId: r.id,
        date: r.completedAt,
        technician: r.technicianName,
        similarityScore: Math.max(75, 95 - idx * 5),
        lessonLearned: r.repairActions || r.findingsAndActions || r.taskTitle,
      })),
    };

    res.json({
      success: true,
      data: result,
      analyzedRecords: relevantRecords.slice(0, 10),
      metrics: {
        totalOccurrences,
        totalDowntimeMinutes,
        avgMttrMinutes,
        frequentParts,
      },
    });
  } catch (err: any) {
    console.error('Root Cause Analysis error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi phân tích nguyên nhân gốc rễ AI' });
  }
});

// 8.3 AI Mobile Camera Vision Inspection Engine (Gemini API Multimodal)
app.post('/api/ai/analyze-image', async (req, res) => {
  try {
    const { imageBase64, deviceId, errorCode, machineModel, inspectionFocus, userNotes } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'Thiếu dữ liệu hình ảnh base64' });
    }

    const targetDevice = devices.find((d) => d.id === deviceId || d.code === deviceId);
    const resolvedModel = machineModel || targetDevice?.model || 'Sodick AG60L';
    const resolvedErrorCode = errorCode || targetDevice?.activeIncident?.errorCode || 'E-102';

    // Parse base64 and mimeType
    let mimeType = 'image/jpeg';
    let base64Clean = imageBase64;
    if (imageBase64.includes(';base64,')) {
      const split = imageBase64.split(';base64,');
      mimeType = split[0].replace('data:', '') || 'image/jpeg';
      base64Clean = split[1];
    }

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Clean,
      },
    };

    const textPrompt = `
Bạn là chuyên gia thị giác máy tính và chẩn đoán cơ điện tử công nghiệp EDM (Electrical Discharge Machining) hàng đầu.
Hãy phân tích hình ảnh chụp cận cảnh hiện trường/linh kiện máy EDM ${resolvedModel} (mã lỗi hiện tại: ${resolvedErrorCode}).
Mục tiêu trọng tâm: ${inspectionFocus || 'Nhận diện linh kiện, vết nứt dây cắt, rỗ hồ quang bạc tiếp điện, hoặc tình trạng ăn mòn điện cực'}.
${userNotes ? `Ghi chú hiện trường của KTV: "${userNotes}"` : ''}

Nhiệm vụ phân tích:
1. Nhận diện chính xác tên bộ phận/linh kiện xuất hiện trong ảnh (VD: Bạc cấp điện Carbide dưới, Dây cắt đồng thau Ø0.25mm, Điện cực than graphite/đồng đỏ, Kim phun áp lực deion, Cụm mâm kẹp Erowa ITS, Lõi lọc áp lực 3µm...).
2. Phân loại khuyết tật/bất thường nhìn thấy được:
   - Vết nứt dây hoặc đứt dây cắt (Wire micro-cracks, tensile necking, spark breakage)
   - Rỗ hồ quang hoặc mòn sâu rãnh trên bạc tiếp điện (Carbide contact grooving, crater erosion)
   - Tình trạng ăn mòn điện cực hoặc thoái hóa bề mặt (Electrode surface erosion, carbon contamination)
   - Tắc nghẽn bám mùn phoi hoặc cặn bẩn khe hở điện môi
3. Ước tính mức độ hao mòn (% mòn từ 0% đến 100%) và mức độ nguy cấp (CRITICAL, HIGH, MEDIUM, NORMAL).
4. Đánh giá độ tin cậy của chẩn đoán thị giác (0 - 100%).
5. Đưa ra chi tiết kỹ thuật quan sát được (technicalFindings) giải thích cơ chế gây ra sự cố.
6. Đề xuất quy trình khắc phục nhanh chóng gồm 3-4 bước hành động cụ thể cho kỹ thuật viên.
7. Đề xuất mã linh kiện thay thế trong kho xưởng nếu cần (ví dụ: MK-U6-GD25, FLT-EDM-300, FANUC-BLD-A98, BELT-W-104, PURO-MB400, Z-BEAR-AXIS...).
8. Cảnh báo an toàn thao tác (safetyNotice).

Trả về định dạng JSON thuần theo schema đã định nghĩa.
`;

    const visionSchema = {
      type: Type.OBJECT,
      properties: {
        componentName: { type: Type.STRING },
        componentCategory: { type: Type.STRING },
        defectDetected: { type: Type.STRING },
        wearLevelPercent: { type: Type.NUMBER },
        severity: { type: Type.STRING, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'NORMAL'] },
        confidenceScore: { type: Type.NUMBER },
        correlatedErrorCode: { type: Type.STRING },
        technicalFindings: { type: Type.STRING },
        recommendedActions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        suggestedPartSku: { type: Type.STRING },
        suggestedPartName: { type: Type.STRING },
        safetyNotice: { type: Type.STRING },
      },
      required: [
        'componentName',
        'componentCategory',
        'defectDetected',
        'wearLevelPercent',
        'severity',
        'confidenceScore',
        'technicalFindings',
        'recommendedActions',
      ],
    };

    let visionResult: any = null;

    try {
      const rawText = await callGeminiWithFallback(
        { parts: [imagePart, { text: textPrompt }] },
        visionSchema
      );
      visionResult = JSON.parse(rawText);
    } catch (geminiErr: any) {
      console.warn('Gemini vision model failed or unavailable, using deterministic industrial vision fallback:', geminiErr.message || geminiErr);
      if (resolvedErrorCode === 'E-102') {
        visionResult = {
          componentName: 'Bạc cấp điện Carbide dưới (Lower Carbide Contact)',
          componentCategory: 'Tiếp Điện Phóng Điểm',
          defectDetected: 'Rãnh mòn hồ quang sâu >0.75mm & muội đồng bám dính bề mặt',
          wearLevelPercent: 88,
          severity: 'CRITICAL',
          confidenceScore: 92,
          correlatedErrorCode: 'E-102 (Đứt dây cắt & ngắn mạch khe hở)',
          technicalFindings: 'Phát hiện rãnh khuyết hình chữ V sâu 0.82mm tại điểm tiếp xúc dây cắt do dòng phóng tập trung kéo dài. Dây cắt bị kẹt vào rãnh mòn dẫn đến tăng ma sát đột ngột và đứt dây liên tục.',
          recommendedActions: [
            'Ngắt điện máy và gắn biển cảnh báo LOTO trước khi mở buồng gia công',
            'Nới lỏng ốc lục giác M4 cố định khối carbide, xoay 90° sang mặt tiếp xúc mới',
            'Kiểm tra độ nhẵn bề mặt sau khi xoay, siết lực 4.5 N.m',
            'Nếu cả 4 mặt đều đã mòn sâu, xuất mã MK-U6-GD25 từ kho để thay thế',
          ],
          suggestedPartSku: 'MK-U6-GD25',
          suggestedPartName: 'Bạc cấp điện Carbide trên/dưới',
          safetyNotice: 'Xả hết điện tích dư trên khối tụ bù nguồn phát xung trước khi chạm vào cáp tiếp điện.',
        };
      } else if (resolvedErrorCode === 'ALARM-204') {
        visionResult = {
          componentName: 'Lõi lọc áp lực 3µm & Bầu lọc dung môi',
          componentCategory: 'Lọc & Điện Môi',
          defectDetected: 'Màng lọc bão hòa phoi kim loại & rách phớt làm kín đáy bầu',
          wearLevelPercent: 94,
          severity: 'CRITICAL',
          confidenceScore: 95,
          correlatedErrorCode: 'ALARM-204 (Tụt áp suất bơm dung môi)',
          technicalFindings: 'Lớp sợi polypropylene màu nâu đen bão hòa phoi EDM, đồng hồ áp kế vi sai vượt 2.8 Bar. Tình trạng tắc nghẽn làm giảm lưu lượng xả rửa khe phóng điện gây sụt áp.',
          recommendedActions: [
            'Khóa van cấp nước deion tổng và xả áp suất dư trong bình lọc bằng van xả đáy',
            'Mở nắp bầu lọc, tháo bỏ lõi lọc bẩn và vệ sinh cặn bùn đáy bình',
            'Thay lõi lọc áp lực 3-micron mới (mã kho: FLT-EDM-300)',
            'Kiểm tra gioăng cao su nắp bầu trước khi siết chặt đai ốc',
          ],
          suggestedPartSku: 'FLT-EDM-300',
          suggestedPartName: 'Lõi lọc áp lực 3µm máy cắt dây EDM',
          safetyNotice: 'Áp suất dung môi còn dư có thể phụt mạnh. Phải xả van an toàn về 0 Bar trước khi tháo nắp.',
        };
      } else {
        visionResult = {
          componentName: 'Cụm điện cực và gá kẹp phóng điện EDM',
          componentCategory: 'Điện Cực & Khe Phóng',
          defectDetected: 'Ăn mòn rỗ bề mặt điện cực & bám muội cacbon cục bộ',
          wearLevelPercent: 72,
          severity: 'HIGH',
          confidenceScore: 89,
          correlatedErrorCode: resolvedErrorCode,
          technicalFindings: 'Vùng bề mặt làm việc xuất hiện các hố rỗ ăn mòn không đều (crater wear) sâu 0.3mm do tia lửa điện bị ngắn mạch cục bộ trong môi trường dầu deion.',
          recommendedActions: [
            'Tháo điện cực khỏi đầu kẹp mâm cặp System 3R/Erowa',
            'Vệ sinh tẩy rửa muội than bằng dung môi cồn công nghiệp trong bể rửa siêu âm 10 phút',
            'Đo lại kích thước hình học điện cực bằng thước vi ban panme',
            'Bù trừ bán kính phóng điện (spark gap compensation) trong chương trình CNC thêm 0.015mm',
          ],
          suggestedPartSku: 'BRS-ERW-50',
          suggestedPartName: 'Chổi quét tiếp mát than đồng Erowa 50mm',
          safetyNotice: 'Mang kính bảo hộ và găng tay chống hóa chất khi thao tác với dung dịch làm sạch điện cực.',
        };
      }
    }

    visionResult.analyzedAt = new Date().toISOString();

    res.json({
      success: true,
      data: visionResult,
    });
  } catch (err: any) {
    console.error('Vision analysis error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi xử lý hình ảnh camera' });
  }
});

// 9. AI Copilot Chat for Technicians (Interactive Assistant)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, deviceId, incidentContext } = req.body;
    const device = devices.find((d) => d.id === deviceId);

    const prompt = `
Bạn là "EDM AI Copilot" - Chuyên gia hỗ trợ kỹ thuật viên sửa máy trực tiếp tại hiện trường.
Bạn có quyền truy cập vào sơ đồ mạch, sổ tay vận hành và kho kinh nghiệm của các kỹ sư trưởng xưởng.

BỐI CẢNH HIỆN TRƯỜNG:
${device ? `- Máy: ${device.name} (${device.code}), Model: ${device.model}\n- Trạng thái: ${device.status}` : ''}
${incidentContext ? `- Sự cố đang xử lý: ${incidentContext.errorCode} - ${incidentContext.errorTitle}` : ''}

CÂU HỎI / TRAO ĐỔI CỦA KỸ THUẬT VIÊN:
"${message}"

Hãy trả lời chuyên nghiệp, ngắn gọn, đi thẳng vào thao tác kỹ thuật thực tế (vặn ốc nào, đo chân rắc nào, chỉnh tham số gì trên màn hình CNC). Nếu có nguy cơ mất an toàn (điện giật, áp suất cao, dây đứt văng), hãy cảnh báo trước.
`;

    let reply = '';
    try {
      reply = await callGeminiWithFallback(prompt);
    } catch (chatErr) {
      console.warn('Gemini chat fallback:', chatErr);
      reply = `Theo kinh nghiệm từ sổ tay kỹ thuật máy ${device ? device.model : 'EDM'} và các kỹ sư xưởng:\n\n1. Kiểm tra van xả áp lực phụ và vệ sinh đầu dẫn hướng kim cương bằng dung môi chuyên dụng.\n2. Đo điện áp nguồn cấp 24VDC tại rắc nối cảm biến S-104.\n3. Đảm bảo dây đồng căng đều 13.5N và bồn nước khử ion đạt mức lưu lượng định mức.\n\nNếu sự cố vẫn chưa dứt, hãy kiểm tra mã lỗi trên bảng điều khiển CNC.`;
    }

    res.json({
      success: true,
      reply,
    });
  } catch (err: any) {
    console.error('AI Chat error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi trợ lý AI' });
  }
});

// 10. Technical Documents: List & Add (Upload new documentation for AI)
app.get('/api/documents', (req, res) => {
  res.json({ success: true, data: technicalDocuments });
});

app.post('/api/documents', async (req, res) => {
  try {
    const {
      title,
      category,
      targetModel,
      content,
      tags,
      fileType,
      fileName,
      fileSize,
      imageData,
      extractedParameters,
      author,
    } = req.body;

    if (!title || (!content && !imageData)) {
      return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung/bản vẽ tài liệu là bắt buộc' });
    }

    // Call Gemini to analyze document/schematic and generate high-precision summary, parameters & index
    let summary = (content || '').slice(0, 180) + '...';
    let aiExtractedParams: Record<string, any> = extractedParameters || {};
    let schematicComponents: string[] = [];

    try {
      const isSchematic = category === 'SCHEMATICS' || fileType === 'IMAGE_SCHEMATIC';
      const isSpecs = category === 'TECHNICAL_SPECS' || fileType === 'CSV_SPECS';

      const analysisPrompt = `
Bạn là Kỹ sư Trưởng AI phụ trách Lập chỉ mục Cơ sở Tri thức Kỹ thuật (RAG Knowledge Engine) cho xưởng máy gia công phóng điện tia lửa điện EDM & CNC.
Hãy đọc và phân tích tài liệu kỹ thuật mới được tải lên:
- Tiêu đề: ${title}
- Phân loại: ${category}
- Dòng máy: ${targetModel}
- Tên tệp: ${fileName || 'Tài liệu kỹ thuật'}
- Loại tệp: ${fileType || 'TEXT'}
- Nội dung:
${(content || '').slice(0, 3000)}

${isSchematic ? 'ĐÂY LÀ SƠ ĐỒ KỸ THUẬT (MẠCH ĐIỆN / KHÍ NÉN / THỦY LỰC / NGUỒN XUNG). Hãy bóc tách các khối linh kiện chính (IGBT, Relay, Van solenoid, Cảm biến, Bo mạch điều khiển).' : ''}
${isSpecs ? 'ĐÂY LÀ BẢNG THÔNG SỐ KỸ THUẬT CÔNG NGHỆ (C-Condition, Điện áp, Dòng xung, Áp suất, Độ căng dây, Tốc độ ăn phôi). Hãy bóc tách các thông số then chốt.' : ''}

Hãy trả về JSON theo schema:
{
  "summary": "Đoạn tóm tắt kỹ thuật ngắn gọn (40-60 từ) nêu bật bản chất tài liệu, mã lỗi xử lý được và chỉ dẫn cốt lõi",
  "extractedParameters": {
    "key1": "value1"
  },
  "schematicComponents": ["Linh kiện 1", "Linh kiện 2"],
  "recommendedTags": ["tag1", "tag2", "tag3"]
}
`;

      let contentsPayload: any = analysisPrompt;
      // If image schematic provided and valid base64
      if (imageData && imageData.includes('base64,')) {
        const base64Data = imageData.split('base64,')[1];
        const mimeType = imageData.split(';')[0].replace('data:', '');
        contentsPayload = [
          analysisPrompt,
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Data,
            },
          },
        ];
      }

      const sumRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              extractedParameters: {
                type: Type.OBJECT,
                properties: {
                  dischargeVoltage: { type: Type.STRING },
                  peakCurrent: { type: Type.STRING },
                  dielectricPressure: { type: Type.STRING },
                  wireTension: { type: Type.STRING },
                  toleranceOrGrade: { type: Type.STRING },
                },
              },
              schematicComponents: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              recommendedTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['summary'],
          },
        },
      });

      if (sumRes.text) {
        const parsed = JSON.parse(sumRes.text);
        if (parsed.summary) summary = parsed.summary;
        if (parsed.extractedParameters) {
          aiExtractedParams = { ...aiExtractedParams, ...parsed.extractedParameters };
        }
        if (Array.isArray(parsed.schematicComponents)) {
          schematicComponents = parsed.schematicComponents;
        }
        if (Array.isArray(parsed.recommendedTags) && parsed.recommendedTags.length > 0) {
          tags.push(...parsed.recommendedTags);
        }
      }
    } catch (e) {
      console.warn('AI document analysis failed, using fallback:', e);
    }

    const newDoc: TechnicalDocument = {
      id: `doc-${Date.now()}`,
      title,
      category: category || 'MAINTENANCE_GUIDE',
      targetModel: targetModel || 'Chung cho thiết bị xưởng',
      author: author || 'Kỹ thuật viên cập nhật',
      updatedAt: new Date().toISOString().split('T')[0],
      summary,
      content: content || 'Nội dung tóm tắt từ bản vẽ sơ đồ kỹ thuật đã được AI đọc và số hóa.',
      tags: Array.isArray(tags) ? Array.from(new Set(tags)) : ['Tài liệu mới', 'Cập nhật'],
      fileType: fileType || 'TEXT',
      fileName: fileName || `${title.slice(0, 25)}.doc`,
      fileSize: fileSize || '245 KB',
      extractedParameters: Object.keys(aiExtractedParams).length > 0 ? aiExtractedParams : undefined,
      schematicComponents: schematicComponents.length > 0 ? schematicComponents : undefined,
    };

    technicalDocuments.unshift(newDoc);

    res.json({
      success: true,
      message: `Đã nạp và lập chỉ mục tài liệu "${title}" vào Cơ sở Tri thức AI!`,
      data: newDoc,
    });
  } catch (err: any) {
    console.error('Add document error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi tải lên tài liệu' });
  }
});

// 10.1 AI KNOWLEDGE BASE RETRIEVAL & Q&A ENGINE (Grounded in Uploaded Docs & Technician Learnings)
app.post('/api/ai/knowledge/query', async (req, res) => {
  try {
    const { query, filterCategory, targetModel } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Câu hỏi tra cứu là bắt buộc' });
    }

    // Filter relevant technical documents
    let matchedDocs = technicalDocuments.filter((doc) => {
      const matchCat = !filterCategory || filterCategory === 'ALL' || doc.category === filterCategory;
      const matchModel = !targetModel || targetModel === 'ALL' || doc.targetModel.includes(targetModel) || doc.targetModel.includes('Chung');
      const textMatch = doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.content.toLowerCase().includes(query.toLowerCase()) ||
        doc.summary.toLowerCase().includes(query.toLowerCase()) ||
        doc.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
      return matchCat && (matchModel || textMatch);
    });
    if (matchedDocs.length === 0) matchedDocs = technicalDocuments.slice(0, 3);

    // Filter relevant technician learnings
    let matchedLearnings = aiLearnings.filter((l) => {
      return l.title.toLowerCase().includes(query.toLowerCase()) ||
        l.errorCode.toLowerCase().includes(query.toLowerCase()) ||
        l.humanSolution.toLowerCase().includes(query.toLowerCase()) ||
        l.aiSynthesizedRule.toLowerCase().includes(query.toLowerCase()) ||
        (targetModel && targetModel !== 'ALL' && l.machineModel.includes(targetModel));
    });
    if (matchedLearnings.length === 0) matchedLearnings = aiLearnings.slice(0, 3);

    const ragPrompt = `
Bạn là "EDM AI Master Knowledge Assistant" - Bộ Não Tri thức Kỹ thuật của xưởng gia công cơ khí chính xác EDM & CNC.
Nhiệm vụ của bạn là giải đáp câu hỏi kỹ thuật từ kỹ thuật viên dựa trên Cơ sở Tri thức Kỹ thuật (bao gồm các Sổ tay hướng dẫn sửa chữa, Sơ đồ mạch điện/khí nén, Bảng thông số kỹ thuật đã tải lên) VÀ Kinh nghiệm thực tế do các kỹ thuật viên đã đúc kết và truyền lại cho bạn.

CÂU HỎI CỦA KỸ THUẬT VIÊN:
"${query}"

TÀI LIỆU KỸ THUẬT SẴN CÓ TRONG BỘ NHỚ:
${matchedDocs.slice(0, 4).map((d, i) => `[Tài liệu ${i + 1}: ${d.title} | Loại: ${d.category} | Model: ${d.targetModel}]\n${d.summary}\n${d.content.slice(0, 500)}`).join('\n---\n')}

KINH NGHIỆM THỰC CHIẾN CỦA KỸ THUẬT VIÊN TRONG BỘ NHỚ:
${matchedLearnings.slice(0, 4).map((l, i) => `[Kinh nghiệm ${i + 1} từ ${l.discoveredBy} | Lỗi: ${l.errorCode} | Model: ${l.machineModel}]:
- Vấn đề: ${l.problemStatement}
- Giải pháp thực tế: ${l.humanSolution}
- Quy tắc AI: ${l.aiSynthesizedRule}
${l.practicalTips ? `- Mẹo then chốt: ${l.practicalTips}` : ''}`).join('\n---\n')}

YÊU CẦU:
1. Hãy trả lời trực tiếp, chính xác, có căn cứ vào các tài liệu và kinh nghiệm đã được cung cấp.
2. Trích dẫn rõ ràng: Tài liệu nào hoặc Kỹ thuật viên nào đã đóng góp thông tin này.
3. Đưa ra các bước hành động (Action Steps) cụ thể, thông số kỹ thuật chuẩn (nếu có) và cảnh báo an toàn.

Trả về JSON theo schema:
{
  "answer": "Câu trả lời kỹ thuật chi tiết, mạch lạc, dễ hiểu cho KTV xưởng (2-4 đoạn)",
  "actionSteps": ["Bước 1...", "Bước 2...", "Bước 3..."],
  "technicalParameters": { "key": "value" },
  "safetyWarning": "Cảnh báo an toàn (nếu có)",
  "confidenceScore": 95
}
`;

    const aiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: ragPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            actionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            technicalParameters: {
              type: Type.OBJECT,
              properties: {
                parameterDetail: { type: Type.STRING },
              },
            },
            safetyWarning: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
          },
          required: ['answer'],
        },
      },
    });

    let resultData = {
      answer: 'Dựa trên sổ tay hướng dẫn và kinh nghiệm sửa chữa của các kỹ sư xưởng, hãy kiểm tra van an toàn và cân chỉnh lại thông số phóng điện.',
      actionSteps: ['Kiểm tra điện áp cấp nguồn', 'Vệ sinh đầu dẫn kim cương', 'Kiểm tra áp suất dung dịch điện môi'],
      safetyWarning: 'Ngắt nguồn cao áp trước khi kiểm tra đầu nối van.',
      confidenceScore: 92,
    };

    if (aiRes.text) {
      try {
        resultData = { ...resultData, ...JSON.parse(aiRes.text) };
      } catch (e) {
        resultData.answer = aiRes.text;
      }
    }

    res.json({
      success: true,
      data: {
        ...resultData,
        citedDocuments: matchedDocs.slice(0, 3).map((d) => ({ id: d.id, title: d.title, category: d.category, targetModel: d.targetModel })),
        citedLearnings: matchedLearnings.slice(0, 3).map((l) => ({ id: l.id, title: l.title, discoveredBy: l.discoveredBy, errorCode: l.errorCode })),
        queriedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Knowledge query error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi tra cứu tri thức' });
  }
});

// 11. AI Learnings (Knowledge Graph)
app.get('/api/ai/learnings', (req, res) => {
  res.json({ success: true, data: aiLearnings });
});

// 11.1 Create new AI Learning directly from Technician Field Contribution
app.post('/api/ai/learnings', async (req, res) => {
  try {
    const {
      title,
      errorCode,
      machineModel,
      discoveredBy,
      problemStatement,
      humanSolution,
      practicalTips,
      partsInvolved,
      effectivenessRating,
    } = req.body;

    if (!title || !humanSolution) {
      return res.status(400).json({ success: false, message: 'Tiêu đề và giải pháp thực tế là bắt buộc' });
    }

    let aiSynthesizedRule = `Khi gặp sự cố trên ${machineModel || 'máy EDM'}: ${humanSolution.slice(0, 140)}...`;

    try {
      const prompt = `
Bạn là Kỹ sư Trưởng AI Chuyên gia bảo trì máy EDM.
Kỹ thuật viên hiện trường ${discoveredBy || 'chuyên gia'} vừa đóng góp một kinh nghiệm sửa chữa thực chiến quý báu:
- Tiêu đề: ${title}
- Mã lỗi / Sự cố: ${errorCode || 'Sự cố vận hành'}
- Dòng máy: ${machineModel || 'Chung'}
- Vấn đề gặp phải: ${problemStatement || title}
- Giải pháp thực tế đã khắc phục thành công: ${humanSolution}
- Mẹo then chốt: ${practicalTips || 'Không có'}
- Linh kiện liên quan: ${Array.isArray(partsInvolved) ? partsInvolved.join(', ') : (partsInvolved || 'Không có')}

Hãy đúc kết một quy tắc AI ngắn gọn (1-2 câu), nêu rõ cốt lõi mẹo kiểm tra hoặc cách xử lý nhanh nhất cho các kỹ thuật viên khác:
`;
      const ruleRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      if (ruleRes.text) {
        aiSynthesizedRule = ruleRes.text.trim();
      }
    } catch (e) {
      console.warn('AI rule synthesis fallback:', e);
    }

    const newLearning: AILearning = {
      id: `learn-${Date.now()}`,
      title,
      errorCode: errorCode || 'GENERAL',
      machineModel: machineModel || 'Tất cả dòng máy',
      discoveredBy: discoveredBy || 'Kỹ thuật viên xưởng',
      learnedAt: new Date().toISOString().split('T')[0],
      problemStatement: problemStatement || title,
      humanSolution,
      aiSynthesizedRule,
      practicalTips: practicalTips || '',
      effectivenessRating: Number(effectivenessRating) || 5,
      partsInvolved: Array.isArray(partsInvolved) ? partsInvolved : [],
      timesAppliedSuccessfully: 1,
      verified: true,
      feedbackCount: 1,
    };

    aiLearnings.unshift(newLearning);

    res.json({
      success: true,
      message: 'Đã nạp kinh nghiệm thực chiến vào Bộ Não Tri Thức AI!',
      data: newLearning,
    });
  } catch (err: any) {
    console.error('Create learning error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi thêm bài học AI' });
  }
});

// 11.2 Technician Feedback / Upvote on an AI Learning
app.post('/api/ai/learnings/:id/feedback', (req, res) => {
  try {
    const { feedbackType, technicianName, comment } = req.body;
    const learning = aiLearnings.find((l) => l.id === req.params.id);
    if (!learning) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' });
    }

    if (feedbackType === 'SUCCESSFUL_APPLICATION' || feedbackType === 'UPVOTE') {
      learning.timesAppliedSuccessfully = (learning.timesAppliedSuccessfully || 0) + 1;
      learning.verified = true;
    }
    learning.feedbackCount = (learning.feedbackCount || 0) + 1;
    if (comment) {
      learning.technicianFeedback = `${technicianName || 'KTV'}: "${comment}" (Ghi nhận: ${new Date().toLocaleDateString('vi-VN')})`;
    }

    res.json({
      success: true,
      message: 'Cảm ơn phản hồi của bạn! Bộ não AI đã cập nhật độ tin cậy của bài học.',
      data: learning,
    });
  } catch (err: any) {
    console.error('Feedback learning error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi gửi phản hồi bài học' });
  }
});

// 12. Push Notification Logs
app.get('/api/notifications', (req, res) => {
  res.json({ success: true, data: notificationLogs });
});

// 13. Test Push Notification to phone
app.post('/api/notifications/test-push', (req, res) => {
  const { technicianId, customMessage } = req.body;
  const tech = technicians.find((t) => t.id === technicianId) || technicians[0];

  const log: NotificationLog = {
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    deviceId: 'dev-01',
    deviceName: 'Kiểm tra kênh thông báo đẩy',
    errorCode: 'TEST-PING',
    recipientPhone: tech.phone,
    recipientName: tech.name,
    channel: 'PUSH_NOTIFICATION',
    status: 'DELIVERED',
    previewText: customMessage || `📲 [THỬ NGHIỆM PUSH] Thông báo kiểm tra kết nối điện thoại KTV ${tech.name} (${tech.phone}) thành công! Tín hiệu EDM sẵn sàng 24/7.`,
  };

  notificationLogs.unshift(log);

  res.json({
    success: true,
    message: `Đã phát thông báo đẩy thành công tới điện thoại của ${tech.name} (${tech.phone})`,
    data: log,
  });
});

// 13.1 Leaderboard Commendation & Promotion Push Notification to Technician Mobile
app.post('/api/mobile-devices/push-commendation', (req, res) => {
  const { technicianId, commendationBadge, title, customMessage, rank } = req.body;
  const tech = technicians.find((t) => t.id === technicianId) || technicians[0];
  const targetMobile = mobileDevices.find((m) => m.assignedTechnicianId === tech.id);

  const badgeTitle = title || (rank === 1 ? '👑 VINH DANH QUÁN QUÂN BẢNG XẾP HẠNG' : '🏆 TUYÊN DƯƠNG THÀNH TÍCH XUẤT SẮC');
  const badgeDetail = commendationBadge || 'Huy hiệu Bàn Tay Vàng Xử Lý Sự Cố Nhanh';
  const preview = customMessage || `Chúc mừng Kỹ sư ${tech.name}! Bạn vừa nhận được "${badgeDetail}" từ Leader EQM với thành tích nổi bật tại xưởng.`;

  const log: NotificationLog = {
    id: `notif-commend-${Date.now()}`,
    timestamp: new Date().toISOString(),
    deviceId: 'LEADERBOARD',
    deviceName: 'Bảng Xếp Hạng & Tuyên Dương EQM',
    errorCode: 'COMMENDATION-BADGE',
    recipientPhone: tech.phone,
    recipientName: tech.name,
    channel: 'PUSH_NOTIFICATION',
    status: 'DELIVERED',
    previewText: `🏆 [${badgeTitle}] ${preview}`,
  };

  notificationLogs.unshift(log);

  // If mobile device is registered, update ping/status
  if (targetMobile) {
    targetMobile.lastPingTime = new Date().toISOString();
  }

  res.json({
    success: true,
    message: `Đã gửi thông báo đẩy trực tiếp tới điện thoại của ${tech.name} (${tech.phone})!`,
    data: {
      log,
      targetDevice: targetMobile ? targetMobile.deviceName : 'Thiết bị di động KTV',
      pushedAt: new Date().toISOString(),
      recipient: tech.name,
    },
  });
});

// 13.2 AI Knowledge Synthesis & Query Engine (Synthesis from SOP Docs & Human Repair Learnings)
app.post('/api/ai/synthesize-knowledge', async (req, res) => {
  try {
    const { query, machineModel, errorCode } = req.body;
    const q = (query || '').toLowerCase().trim();
    const modelFilter = (machineModel || 'ALL').toUpperCase();
    const codeFilter = (errorCode || '').toUpperCase().trim();

    // 1. Retrieve matching technical documents
    const matchedDocs = technicalDocuments.filter((doc) => {
      const matchText = !q || doc.title.toLowerCase().includes(q) || doc.content.toLowerCase().includes(q) || doc.tags.some((t) => t.toLowerCase().includes(q));
      const matchModel = modelFilter === 'ALL' || doc.targetModel.toUpperCase().includes(modelFilter) || doc.targetModel.includes('Chung');
      const matchCode = !codeFilter || doc.content.toUpperCase().includes(codeFilter) || doc.title.toUpperCase().includes(codeFilter);
      return (matchText || matchCode) && matchModel;
    });

    // 2. Retrieve matching human repair learnings
    const matchedLearnings = aiLearnings.filter((l) => {
      const matchText = !q || l.title.toLowerCase().includes(q) || l.humanSolution.toLowerCase().includes(q) || (l.practicalTips && l.practicalTips.toLowerCase().includes(q));
      const matchModel = modelFilter === 'ALL' || l.machineModel.toUpperCase().includes(modelFilter);
      const matchCode = !codeFilter || l.errorCode.toUpperCase() === codeFilter;
      return (matchText || matchCode) && matchModel;
    });

    // 3. Structured synthesis via Gemini or industrial fallback
    const synthesisPrompt = `
Bạn là Kỹ Sư Trưởng AI Điều Hành Hệ Thống Tri Thức Kỹ Thuật Máy Tia Lửa Điện EDM.
Hãy tổng hợp tri thức kỹ thuật giữa 2 nguồn:
(1) Tài liệu kỹ thuật chuẩn SOP/OEM của nhà sản xuất (Hãng Makino, Sodick, Fanuc, GF AgieCharmilles)
(2) Kinh nghiệm và giải pháp thực chiến do các kỹ thuật viên con người trực tiếp xử lý và đúc kết tại hiện trường.

CÂU HỎI / VẤN ĐỀ TRUY VẤN: "${query || errorCode || 'Quy trình xử lý sự cố đứt dây và sụt áp lực nước'}"
MÁY / DÒNG MÁY: ${machineModel || 'Cụm máy EDM Xưởng'}
MÃ LỖI: ${errorCode || 'Tất cả'}

DANH SÁCH TÀI LIỆU KỸ THUẬT PHÙ HỢP HIỆN CÓ:
${matchedDocs.slice(0, 4).map((d) => `- [${d.title}] (Hãng: ${d.targetModel}, Tác giả: ${d.author}, Cập nhật: ${d.updatedAt}):\n${d.content.slice(0, 400)}`).join('\n')}

DANH SÁCH BÀI HỌC THỰC CHIẾN TỪ KỸ THUẬT VIÊN:
${matchedLearnings.slice(0, 5).map((l) => `- [${l.title}] (Mã lỗi: ${l.errorCode}, Máy: ${l.machineModel}, Thợ phát hiện: ${l.discoveredBy}, Đã áp dụng thành công: ${l.timesAppliedSuccessfully} lần, Đánh giá: ${l.effectivenessRating || 5}★):\nGiải pháp: ${l.humanSolution}\nMẹo thực tế: ${l.practicalTips || 'N/A'}\nQuy tắc AI: ${l.aiSynthesizedRule}`).join('\n')}

YÊU CẦU:
Tổng hợp thông tin chính xác, làm rõ điểm khác biệt và bổ trợ giữa quy trình lý thuyết của hãng và mẹo xử lý thực tế của thợ lành nghề.
Nêu rõ trích dẫn tài liệu và trích dẫn bài học thợ.
Trả về chuẩn JSON:
{
  "summary": "Tóm tắt cốt lõi phương án xử lý kết hợp giữa tài liệu và thực tế (2-3 câu súc tích)",
  "confidenceScore": 96,
  "synthesizedProcedure": [
    "Bước 1: ...",
    "Bước 2: ...",
    "Bước 3: ...",
    "Bước 4: ..."
  ],
  "humanTipsHighlight": "Điểm đắt giá mà thợ lành nghề phát hiện giúp tiết kiệm thời gian so với tài liệu lý thuyết",
  "preventativeGuidelines": [
    "Khuyến nghị bảo trì phòng ngừa 1...",
    "Khuyến nghị bảo trì phòng ngừa 2..."
  ],
  "safetyWarnings": [
    "Cảnh báo an toàn 1 (áp lực nước, ngắt điện LOTO...)"
  ],
  "recommendedParts": ["Mã linh kiện phụ tùng nếu có"]
}
`;

    const synthesisSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        confidenceScore: { type: Type.NUMBER },
        synthesizedProcedure: { type: Type.ARRAY, items: { type: Type.STRING } },
        humanTipsHighlight: { type: Type.STRING },
        preventativeGuidelines: { type: Type.ARRAY, items: { type: Type.STRING } },
        safetyWarnings: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendedParts: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['summary', 'confidenceScore', 'synthesizedProcedure', 'preventativeGuidelines', 'safetyWarnings'],
    };

    let resultData: any = null;

    try {
      const rawText = await callGeminiWithFallback(synthesisPrompt, synthesisSchema);
      resultData = JSON.parse(rawText);
    } catch {
      // Deterministic Industrial Synthesis Fallback
      resultData = {
        summary: `Hệ thống tổng hợp từ ${matchedDocs.length} tài liệu SOP và ${matchedLearnings.length} giải pháp thực tế: Khi xảy ra sự cố trên dòng ${machineModel || 'EDM'}, tài liệu hãng chỉ dẫn thay thế cụm linh kiện tiêu chuẩn, tuy nhiên các kỹ sư trưởng đã chứng minh 80% trường hợp có thể khắc phục nhanh bằng cách vệ sinh tẩy cặn siêu âm và điều chỉnh thông số xung tại tủ điều khiển.`,
        confidenceScore: 94,
        synthesizedProcedure: [
          'Bước 1: Ngắt điện cao tần và kiểm tra đồng hồ áp lực buồng súc nước deion/dầu xung.',
          'Bước 2: Đối chiếu thông số khe hở phóng điện thực tế với bảng quy chuẩn trong tài liệu OEM.',
          'Bước 3: Thực hiện mẹo hiện trường từ KTV: Làm sạch màng rung cảm biến áp lực hoặc xoay bạc tiếp điện 90° trước khi thay thế linh kiện mới.',
          'Bước 4: Căn chỉnh lại lực căng dây và chạy thử phôi chuẩn 5 phút để xác nhận ổn định.',
        ],
        humanTipsHighlight: 'Kinh nghiệm từ KTV Nguyễn Văn Hùng & Lê Hoàng Nam: Giảm dòng đỉnh IP 15% khi cắt góc lượn R<0.3mm giúp triệt tiêu hoàn toàn hiện tượng đứt dây mà không làm giảm dung sai kích thước.',
        preventativeGuidelines: [
          'Kiểm tra định kỳ màng lọc vi sai 3-micron sau mỗi 250 giờ cắt liên tục.',
          'Vệ sinh cụm đầu vòi phun áp lực bằng bể rửa siêu âm dung dịch cồn IPA.',
          'Đo điện trở suất hạt nhựa khử ion deion định kỳ hàng tuần (< 15 uS/cm).',
        ],
        safetyWarnings: [
          'Khóa van xả áp suất dung môi trước khi mở nắp cụm vòi phun cao áp.',
          'Tiếp địa tụ bù xung và tuân thủ quy trình LOTO tủ điện 200V.',
        ],
        recommendedParts: ['FLT-EDM-300', 'MK-U6-GD25', 'PURO-MB400'],
      };
    }

    res.json({
      success: true,
      query: q || errorCode || 'Tổng hợp tri thức kỹ thuật',
      data: {
        ...resultData,
        synthesizedAt: new Date().toISOString(),
        citedDocuments: matchedDocs.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          targetModel: d.targetModel,
          author: d.author,
          updatedAt: d.updatedAt,
          summary: d.summary,
        })),
        citedHumanLearnings: matchedLearnings.map((l) => ({
          id: l.id,
          title: l.title,
          technicianName: l.discoveredBy,
          machineModel: l.machineModel,
          errorCode: l.errorCode,
          timesAppliedSuccessfully: l.timesAppliedSuccessfully,
          effectivenessRating: l.effectivenessRating || 5,
          humanFixSummary: l.humanSolution,
          practicalTips: l.practicalTips,
        })),
        totalDocsInBrain: technicalDocuments.length,
        totalLearningsInBrain: aiLearnings.length,
      },
    });
  } catch (err: any) {
    console.error('Synthesize knowledge error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi tổng hợp tri thức AI' });
  }
});

// 14. Factory Statistics
app.get('/api/stats', (req, res) => {
  const runningCount = devices.filter((d) => d.status === 'RUNNING').length;
  const alarmCount = devices.filter((d) => d.status === 'ALARM_STOPPED').length;
  const idleCount = devices.filter((d) => d.status === 'IDLE').length;
  const avgOee = Math.round(devices.reduce((acc, d) => acc + d.telemetry.oee, 0) / devices.length);

  res.json({
    success: true,
    data: {
      totalDevices: devices.length,
      runningCount,
      alarmCount,
      idleCount,
      avgOee,
      totalLearnings: aiLearnings.length,
      totalDocuments: technicalDocuments.length,
      mttrMinutes: 28,
      mtbfHours: 342,
    },
  });
});

// 15. Mobile Devices Fleet Management Endpoints
app.get('/api/mobile-devices', (req, res) => {
  res.json({ success: true, data: mobileDevices });
});

app.post('/api/mobile-devices', (req, res) => {
  const { deviceName, deviceType, os, osVersion, assignedTechnicianId, phoneNumber, currentZone } = req.body;
  const tech = technicians.find((t) => t.id === assignedTechnicianId) || technicians[0];

  const newMobile: MobileDevice = {
    id: `mob-${Date.now().toString().slice(-4)}`,
    deviceName: deviceName || 'Thiết Bị Di Động Mới',
    deviceType: deviceType || 'SMARTPHONE',
    os: os || 'Android',
    osVersion: osVersion || (os === 'iOS' ? 'iOS 17' : 'Android 14'),
    assignedTechnicianId: tech.id,
    assignedTechnicianName: tech.name,
    technicianRole: tech.role,
    technicianAvatar: tech.avatar,
    phoneNumber: phoneNumber || tech.phone,
    status: 'ONLINE',
    lastPingTime: new Date().toISOString(),
    batteryLevel: Math.floor(Math.random() * 30) + 70,
    isCharging: false,
    appVersion: 'v2.4.1 (PWA Standalone)',
    isPWAInstalled: true,
    pushStatus: 'ACTIVE',
    fcmToken: `fcm_${Date.now()}`,
    offlineCacheReady: true,
    cachedDevicesCount: 6,
    cachedDocsCount: 6,
    signalStrengthDbm: -55,
    currentZone: currentZone || 'Xưởng Gia Công EDM Chính',
    ipAddress: `192.168.10.${Math.floor(Math.random() * 80) + 120}`,
    macAddress: `A8:20:66:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
    registeredAt: new Date().toISOString(),
    isLocked: false,
  };

  mobileDevices.unshift(newMobile);
  res.json({ success: true, message: 'Đăng ký thiết bị di động mới thành công', data: newMobile });
});

app.post('/api/mobile-devices/:id/ping', (req, res) => {
  const { id } = req.params;
  const dev = mobileDevices.find((m) => m.id === id);
  if (!dev) return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });

  dev.lastPingTime = new Date().toISOString();
  dev.status = 'ONLINE';
  dev.batteryLevel = Math.max(10, Math.min(100, dev.batteryLevel + (dev.isCharging ? 1 : -1)));
  dev.signalStrengthDbm = Math.min(-40, Math.max(-95, dev.signalStrengthDbm + (Math.floor(Math.random() * 5) - 2)));

  res.json({ success: true, message: `Ping thiết bị ${dev.deviceName} thành công`, data: dev });
});

app.post('/api/mobile-devices/:id/push-test', (req, res) => {
  const { id } = req.params;
  const dev = mobileDevices.find((m) => m.id === id);
  if (!dev) return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });

  const log: NotificationLog = {
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    deviceId: 'mob-fleet',
    deviceName: `Kiểm tra gửi tới ${dev.deviceName}`,
    errorCode: 'MOBILE-PING',
    recipientPhone: dev.phoneNumber,
    recipientName: dev.assignedTechnicianName,
    channel: 'PUSH_NOTIFICATION',
    status: 'DELIVERED',
    previewText: `📲 [KIỂM THỬ THIẾT BỊ DI ĐỘNG] Gửi tới ${dev.deviceName} (${dev.assignedTechnicianName}): Hệ thống SCADA kết nối thành công, Service Worker sẵn sàng hoạt động ngoại tuyến!`,
  };

  notificationLogs.unshift(log);

  res.json({
    success: true,
    message: `Đã gửi thông báo đẩy kiểm thử tới ${dev.deviceName} (${dev.assignedTechnicianName})`,
    data: log,
  });
});

app.post('/api/mobile-devices/:id/toggle-lock', (req, res) => {
  const { id } = req.params;
  const dev = mobileDevices.find((m) => m.id === id);
  if (!dev) return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });

  dev.isLocked = !dev.isLocked;
  dev.status = dev.isLocked ? 'OFFLINE' : 'ONLINE';

  res.json({
    success: true,
    message: dev.isLocked ? `Đã khóa quyền truy cập của ${dev.deviceName}` : `Đã mở khóa thiết bị ${dev.deviceName}`,
    data: dev,
  });
});

app.delete('/api/mobile-devices/:id', (req, res) => {
  const { id } = req.params;
  const idx = mobileDevices.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });

  const removed = mobileDevices.splice(idx, 1)[0];
  res.json({ success: true, message: `Đã hủy liên kết thiết bị ${removed.deviceName}`, data: removed });
});

app.post('/api/mobile-devices/broadcast', (req, res) => {
  const { messageTitle, messageBody, urgency } = req.body;
  const activeCount = mobileDevices.filter((m) => m.status === 'ONLINE' && !m.isLocked).length;

  const log: NotificationLog = {
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    deviceId: 'broadcast-all',
    deviceName: 'Phát thanh tới toàn bộ thiết bị di động xưởng',
    errorCode: urgency === 'CRITICAL' ? 'BROADCAST-URGENT' : 'BROADCAST-INFO',
    recipientPhone: 'TOÀN XƯỞNG',
    recipientName: `${activeCount} Thiết bị di động trực tuyến`,
    channel: 'PUSH_NOTIFICATION',
    status: 'DELIVERED',
    previewText: `📢 [THÔNG BÁO TOÀN XƯỞNG] ${messageTitle || 'Thông báo vận hành'}: ${messageBody || 'Kỹ thuật viên chú ý kiểm tra trạm máy'}`,
  };

  notificationLogs.unshift(log);

  res.json({
    success: true,
    message: `Đã phát thông báo tới ${activeCount} thiết bị di động đang kết nối trong xưởng`,
    data: log,
  });
});

// 16. Maintenance & Repair History Endpoints
export interface MaintenanceRecordServer {
  id: string;
  deviceId: string;
  deviceCode?: string;
  deviceName?: string;
  taskTitle: string;
  taskType: 'PREVENTIVE' | 'CORRECTIVE' | 'PARTS_REPLACEMENT' | 'CALIBRATION' | 'OVERHAUL';
  completedAt: string;
  technicianName: string;
  technicianRole?: string;
  durationMinutes: number;
  partsReplaced: string[];
  findingsAndActions: string;
  incidentDescription?: string;
  repairActions?: string;
  technicianNotes?: string;
  operatingHoursAtMaintenance: number;
  qualityPassed: boolean;
  costEstimateVND?: number;
  aiVerified?: boolean;
}

let maintenanceRecords: MaintenanceRecordServer[] = [
  {
    id: 'maint-01',
    deviceId: 'dev-01',
    deviceCode: 'EDM-W01',
    deviceName: 'Máy Cắt Dây CNC Makino U6 H.E.A.T',
    taskTitle: 'Bảo dưỡng định kỳ 500 giờ & Thay cụm dẫn hướng kim cương P-104',
    taskType: 'PREVENTIVE',
    completedAt: '2026-09-22T14:30:00Z',
    technicianName: 'Lê Hoàng Nam',
    technicianRole: 'Chuyên gia Cắt Dây EDM',
    durationMinutes: 95,
    partsReplaced: [
      'Bộ dẫn hướng kim cương trên/dưới 0.25mm (Diamond Wire Guide)',
      'Khối tiếp điện cacbua (Energizing Carbide Plate)',
      'Lõi lọc giấy ion 3-micron',
    ],
    incidentDescription:
      'Máy đạt ngưỡng 4,200 giờ vận hành. Cụm dẫn hướng kim cương trên xuất hiện vết xước li ti do xỉ cắt mạ bám dính, gây rung nhẹ dây khi cắt phôi dày.',
    repairActions:
      'Tháo dỡ toàn bộ cụm dẫn hướng trên/dưới, tẩy cặn siêu âm buồng súc, thay mới cụm kim cương 0.25mm P-104, thay tấm tiếp điện và căn chỉnh góc nghiêng U/V bằng thước chuẩn quang học.',
    findingsAndActions:
      'Cụm dẫn hướng kim cương trên có vết xước do xỉ mạ. Đã tháo rỡ, ngâm rửa siêu âm và thay mới bộ dẫn hướng kim cương 0.25mm.',
    technicianNotes: 'Độ chính xác cắt thẳng sau bảo dưỡng đạt 0.0015mm trên phôi mẫu thép SKD11.',
    operatingHoursAtMaintenance: 4210,
    qualityPassed: true,
    costEstimateVND: 6800000,
    aiVerified: true,
  },
  {
    id: 'maint-02',
    deviceId: 'dev-01',
    deviceCode: 'EDM-W01',
    deviceName: 'Máy Cắt Dây CNC Makino U6 H.E.A.T',
    taskTitle: 'Khắc phục khẩn cấp đứt dây cắt & Súc rửa vòi phun áp lực cao (E-102)',
    taskType: 'CORRECTIVE',
    completedAt: '2026-09-12T09:15:00Z',
    technicianName: 'Nguyễn Văn Hùng',
    technicianRole: 'Kỹ sư Trưởng Bảo Trì',
    durationMinutes: 45,
    partsReplaced: [
      'Ống xả áp cao Upper Nozzle 4mm',
      'Gioăng cao su làm kín nắp buồng phun',
    ],
    incidentDescription:
      'Máy báo sự cố dừng khẩn cấp mã E-102 (Đứt dây cắt liên tục). Dây đồng ø0.25mm bị đứt ngay tại khe phóng điện do áp suất nước xả làm mát sụt giảm đột ngột dưới 0.7 MPa.',
    repairActions:
      'Tháo gỡ cụm vòi phun áp cao phía trên, phát hiện phoi sắt vụn làm nghẽn 35% tiết diện vòi. Tiến hành thông tắc siêu âm, thay vòi mới 4mm và gioăng làm kín. Điều chỉnh áp lực đạt 1.8 MPa.',
    findingsAndActions:
      'Vòi phun áp suất cao phía trên bị nghẹt 35% tiết diện do phoi sắt vụn. Áp suất xả chỉ đạt 0.7 MPa.',
    technicianNotes: 'Sau khắc phục, máy chạy liên tục 48 giờ không còn phát sinh đứt dây tại khe phóng điện.',
    operatingHoursAtMaintenance: 4140,
    qualityPassed: true,
    costEstimateVND: 2200000,
    aiVerified: true,
  },
];

app.get('/api/maintenance-records', (req, res) => {
  const { deviceId, taskType, search } = req.query;
  let result = [...maintenanceRecords];

  if (deviceId && deviceId !== 'ALL') {
    result = result.filter((r) => r.deviceId === deviceId);
  }
  if (taskType && taskType !== 'ALL') {
    result = result.filter((r) => r.taskType === taskType);
  }
  if (typeof search === 'string' && search.trim()) {
    const s = search.toLowerCase();
    result = result.filter(
      (r) =>
        r.taskTitle.toLowerCase().includes(s) ||
        (r.incidentDescription || '').toLowerCase().includes(s) ||
        (r.repairActions || '').toLowerCase().includes(s) ||
        (r.technicianName || '').toLowerCase().includes(s) ||
        r.partsReplaced.some((p) => p.toLowerCase().includes(s))
    );
  }

  res.json({ success: true, data: result });
});

app.post('/api/maintenance-records', (req, res) => {
  const rec = req.body;
  if (!rec.deviceId || !rec.taskTitle) {
    return res.status(400).json({ success: false, message: 'Missing deviceId or taskTitle' });
  }
  const newRec: MaintenanceRecordServer = {
    ...rec,
    id: rec.id || `maint-${Date.now()}`,
    completedAt: rec.completedAt || new Date().toISOString(),
    partsReplaced: Array.isArray(rec.partsReplaced) ? rec.partsReplaced : [],
  };
  maintenanceRecords.unshift(newRec);
  res.json({ success: true, data: newRec });
});

app.put('/api/maintenance-records/:id', (req, res) => {
  const { id } = req.params;
  const idx = maintenanceRecords.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }
  maintenanceRecords[idx] = { ...maintenanceRecords[idx], ...req.body, id };
  res.json({ success: true, data: maintenanceRecords[idx] });
});

app.delete('/api/maintenance-records/:id', (req, res) => {
  const { id } = req.params;
  maintenanceRecords = maintenanceRecords.filter((r) => r.id !== id);
  res.json({ success: true, message: 'Deleted record successfully' });
});

// 17. Send Weekly Incident Summary Report to Management (Manual or Auto-Triggered)
interface EmailScheduleConfigServer {
  enabled: boolean;
  recipientEmail: string;
  recipientName: string;
  recipientRole: string;
  sendDayOfWeek: number;
  sendHour: number;
  sendMinute: number;
  reportFormat: 'PDF' | 'CSV' | 'BOTH';
  includeOnlyCorrective: boolean;
  technicianSenderName: string;
  customNotes: string;
  lastRunAt?: string;
  nextRunAt?: string;
  totalSentCount: number;
}

let serverEmailSchedule: EmailScheduleConfigServer = {
  enabled: true,
  recipientEmail: 'quanly.thang@factory-edm.vn',
  recipientName: 'Trần Đức Thắng',
  recipientRole: 'Giám Đốc Kỹ Thuật & Quản Lý Xưởng EDM',
  sendDayOfWeek: 5, // Thứ Sáu
  sendHour: 17, // 17:00
  sendMinute: 0,
  reportFormat: 'BOTH',
  includeOnlyCorrective: false,
  technicianSenderName: 'Nguyễn Văn Hùng (Kỹ sư Trưởng Bảo Trì)',
  customNotes:
    'Kính gửi Ban Quản Lý: Hệ thống tự động tổng hợp tình trạng vận hành và các sự cố dừng máy EDM trong tuần. Đề nghị Quản lý xem xét phụ tùng tiêu hao cần nhập thêm cho tuần tới.',
  lastRunAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  nextRunAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  totalSentCount: 3,
};

let weeklyEmailDispatchLogs: any[] = [
  {
    id: 'dispatch-log-01',
    sentAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    recipientEmail: 'quanly.thang@factory-edm.vn',
    recipientName: 'Trần Đức Thắng',
    technicianSender: 'Nguyễn Văn Hùng (Kỹ sư Trưởng)',
    weekRange: 'Tuần W40 (28/09 - 04/10/2026)',
    totalIncidents: 4,
    criticalCount: 2,
    totalDowntimeHours: 4.8,
    estimatedCostVND: 12500000,
    reportFormat: 'BOTH',
    triggerType: 'AUTOMATIC_CRON',
    status: 'DELIVERED',
    deliveryReceiptId: 'REC-SMTP-20261004-9842',
    previewSummary:
      'Gửi tự động định kỳ cuối tuần Thứ 6 lúc 17:00: Tổng 4 sự cố (2 dừng máy khẩn cấp), hoàn tất nghiệm thu 100%. File đính kèm: Bao_Cao_W40.pdf, Bao_Cao_W40.csv',
  },
  {
    id: 'dispatch-log-02',
    sentAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    recipientEmail: 'quanly.thang@factory-edm.vn',
    recipientName: 'Trần Đức Thắng',
    technicianSender: 'Lê Hoàng Nam (Chuyên gia EDM)',
    weekRange: 'Tuần W39 (21/09 - 27/09/2026)',
    totalIncidents: 3,
    criticalCount: 1,
    totalDowntimeHours: 3.2,
    estimatedCostVND: 8600000,
    reportFormat: 'PDF',
    triggerType: 'AUTOMATIC_CRON',
    status: 'DELIVERED',
    deliveryReceiptId: 'REC-SMTP-20260927-4182',
    previewSummary:
      'Gửi tự động định kỳ cuối tuần: Tổng 3 sự cố, thay thế cụm dẫn hướng kim cương P-104 và lọc nước ion. File đính kèm: Bao_Cao_W39.pdf',
  },
];

// Helper to format VND
const formatVNDServer = (amount?: number) => {
  if (!amount) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Generate HTML email body for manager
function generateWeeklySummaryEmailHtml(params: {
  managerName: string;
  technicianSender: string;
  weekRange: string;
  totalIncidents: number;
  criticalCount: number;
  totalDowntimeHours: number;
  estimatedCostVND: number;
  summaryNotes: string;
  reportFormat: string;
  triggerType: string;
  records: any[];
}) {
  const {
    managerName,
    technicianSender,
    weekRange,
    totalIncidents,
    criticalCount,
    totalDowntimeHours,
    estimatedCostVND,
    summaryNotes,
    reportFormat,
    triggerType,
    records,
  } = params;

  const incidentRows = (records || []).slice(0, 8).map((r, i) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
      <td style="padding: 8px 6px; text-align: center; font-weight: bold; color: #475569;">${i + 1}</td>
      <td style="padding: 8px 6px; font-family: monospace; font-weight: bold; color: #0284c7;">${r.deviceCode || r.deviceId || 'EDM-W01'}</td>
      <td style="padding: 8px 6px; font-weight: 600; color: ${r.taskType === 'CORRECTIVE' ? '#dc2626' : '#16a34a'};">
        ${r.taskType === 'CORRECTIVE' ? '⚠ Dừng máy khẩn' : 'Bảo dưỡng định kỳ'}
      </td>
      <td style="padding: 8px 6px; color: #1e293b;">
        <strong>${r.taskTitle || 'Bảo trì máy'}</strong><br/>
        <span style="color: #64748b; font-size: 11px;">${r.incidentDescription || r.repairActions || ''}</span>
      </td>
      <td style="padding: 8px 6px; font-size: 11px; color: #334155;">${r.technicianName || technicianSender}</td>
      <td style="padding: 8px 6px; text-align: right; font-weight: bold; font-family: monospace; color: #b45309;">${formatVNDServer(r.costEstimateVND)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 24px; color: #ffffff;">
        <div style="font-size: 11px; font-weight: bold; color: #38bdf8; letter-spacing: 1.5px; text-transform: uppercase;">
          EDM SMARTGUARD SCADA • HỆ THỐNG BÁO CÁO TỰ ĐỘNG
        </div>
        <h1 style="font-size: 20px; font-weight: 800; margin: 8px 0 4px 0; color: #ffffff;">
          Báo Cáo Tóm Tắt Sự Cố & Bảo Trì Định Kỳ Cuối Tuần
        </h1>
        <div style="font-size: 13px; color: #94a3b8;">
          Thời gian: <strong>${weekRange}</strong> • Chế độ gửi: <span style="color: #34d399; font-weight: bold;">${triggerType === 'AUTOMATIC_CRON' ? 'Tự động định kỳ cuối tuần' : 'KTV gửi chủ động'}</span>
        </div>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 14px; color: #1e293b; margin-top: 0;">
          Kính gửi Quản lý: <strong>${managerName}</strong>,
        </p>
        <p style="font-size: 13px; color: #475569; line-height: 1.6;">
          Dưới đây là bản tóm tắt tình hình sự cố dừng máy và công tác bảo trì kỹ thuật cho toàn bộ phân xưởng máy gia công tia lửa điện (EDM) trong tuần qua.
        </p>

        <!-- KPI SUMMARY BOXES -->
        <div style="display: flex; gap: 12px; margin: 20px 0; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 130px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px;">
            <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Tổng Sự Cố</div>
            <div style="font-size: 22px; font-weight: 800; color: #0284c7; margin-top: 4px;">${totalIncidents} <span style="font-size: 12px; font-weight: normal; color: #64748b;">vụ</span></div>
          </div>
          <div style="flex: 1; min-width: 130px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px;">
            <div style="font-size: 11px; color: #b91c1c; font-weight: bold; text-transform: uppercase;">Sự Cố Khẩn Cấp</div>
            <div style="font-size: 22px; font-weight: 800; color: #dc2626; margin-top: 4px;">${criticalCount} <span style="font-size: 12px; font-weight: normal; color: #64748b;">vụ</span></div>
          </div>
          <div style="flex: 1; min-width: 130px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px;">
            <div style="font-size: 11px; color: #15803d; font-weight: bold; text-transform: uppercase;">Tổng Giờ Dừng/MTTR</div>
            <div style="font-size: 22px; font-weight: 800; color: #16a34a; margin-top: 4px;">${totalDowntimeHours} <span style="font-size: 12px; font-weight: normal; color: #64748b;">giờ</span></div>
          </div>
          <div style="flex: 1; min-width: 130px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px;">
            <div style="font-size: 11px; color: #b45309; font-weight: bold; text-transform: uppercase;">Chi Phí Linh Kiện</div>
            <div style="font-size: 18px; font-weight: 800; color: #d97706; margin-top: 4px;">${formatVNDServer(estimatedCostVND)}</div>
          </div>
        </div>

        <!-- NOTES BOX -->
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
          <div style="font-size: 12px; font-weight: bold; color: #1e40af; margin-bottom: 4px;">Ghi chú & Đề xuất của Kỹ thuật viên:</div>
          <div style="font-size: 13px; color: #1e293b; line-height: 1.5;">${summaryNotes}</div>
        </div>

        <!-- DETAILS TABLE -->
        <div style="margin-top: 20px;">
          <div style="font-size: 12px; font-weight: bold; color: #334155; margin-bottom: 8px; text-transform: uppercase;">Nhật ký các sự cố chính đã khắc phục:</div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase;">
                <th style="padding: 8px 6px; text-align: center;">STT</th>
                <th style="padding: 8px 6px; text-align: left;">Mã Máy</th>
                <th style="padding: 8px 6px; text-align: left;">Phân Loại</th>
                <th style="padding: 8px 6px; text-align: left;">Sự Cố & Khắc Phục</th>
                <th style="padding: 8px 6px; text-align: left;">KTV</th>
                <th style="padding: 8px 6px; text-align: right;">Chi Phí</th>
              </tr>
            </thead>
            <tbody>
              ${incidentRows || '<tr><td colspan="6" style="padding: 16px; text-align: center; color: #94a3b8;">Không có sự cố nào trong tuần</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- ATTACHMENT INFO -->
        <div style="margin-top: 24px; padding: 12px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 12px; font-weight: bold; color: #1e293b;">Tệp đính kèm tự động đính kèm:</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ${reportFormat === 'BOTH' ? 'Bao_Cao_Su_Co_Tuan_EDM.pdf • Bao_Cao_Su_Co_Tuan_EDM.csv' : reportFormat === 'CSV' ? 'Bao_Cao_Su_Co_Tuan_EDM.csv' : 'Bao_Cao_Su_Co_Tuan_EDM.pdf'}
            </div>
          </div>
          <span style="font-size: 11px; font-weight: bold; color: #15803d; background: #dcfce7; padding: 4px 8px; border-radius: 6px;">Đã sẵn sàng tải</span>
        </div>

        <!-- SIGNATURE -->
        <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; display: flex; justify-content: space-between;">
          <div>
            Kỹ thuật viên phụ trách: <strong>${technicianSender}</strong><br/>
            Hệ thống: EDM SmartGuard Industrial Cloud
          </div>
          <div style="text-align: right;">
            Email tiếp nhận: <strong>${params.managerName}</strong><br/>
            Trạng thái gửi: <span style="color: #16a34a; font-weight: bold;">Hoàn tất (Delivered)</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 17.1 Get current email scheduler configuration
app.get('/api/reports/email-schedule', (req, res) => {
  res.json({
    success: true,
    data: {
      schedule: serverEmailSchedule,
      dispatchLogs: weeklyEmailDispatchLogs,
    },
  });
});

// 17.2 Update email scheduler configuration
app.post('/api/reports/email-schedule', (req, res) => {
  try {
    const updated = req.body;
    serverEmailSchedule = {
      ...serverEmailSchedule,
      ...updated,
    };
    res.json({
      success: true,
      message: 'Cập nhật cấu hình lịch tự động gửi báo cáo qua email thành công!',
      data: serverEmailSchedule,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi khi lưu cấu hình gửi email định kỳ' });
  }
});

// 17.3 Send Weekly Incident Summary Report (Manual or Auto Trigger)
app.post('/api/reports/send-weekly-summary', (req, res) => {
  try {
    const {
      managerName = serverEmailSchedule.recipientName,
      managerEmail = serverEmailSchedule.recipientEmail,
      managerPhone = '0988.999.888',
      technicianSender = serverEmailSchedule.technicianSenderName,
      weekRange = '7 Ngày Gần Nhất',
      totalIncidents = 0,
      criticalCount = 0,
      totalDowntimeHours = 0,
      estimatedCostVND = 0,
      summaryNotes = 'Báo cáo sự cố định kỳ cuối tuần từ phân xưởng EDM.',
      reportFormat = 'BOTH',
      triggerType = 'MANUAL_DISPATCH',
      records = maintenanceRecords,
    } = req.body;

    const dispatchId = `dispatch-log-${Date.now()}`;
    const deliveryReceiptId = `REC-SMTP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const htmlEmail = generateWeeklySummaryEmailHtml({
      managerName,
      technicianSender,
      weekRange,
      totalIncidents,
      criticalCount,
      totalDowntimeHours,
      estimatedCostVND,
      summaryNotes,
      reportFormat,
      triggerType,
      records: records && records.length > 0 ? records : maintenanceRecords,
    });

    const newDispatchLog = {
      id: dispatchId,
      sentAt: new Date().toISOString(),
      recipientEmail: managerEmail,
      recipientName: managerName,
      technicianSender,
      weekRange,
      totalIncidents,
      criticalCount,
      totalDowntimeHours,
      estimatedCostVND,
      reportFormat,
      triggerType,
      status: 'DELIVERED',
      deliveryReceiptId,
      previewSummary: `Đã gửi báo cáo tóm tắt tuần (${weekRange}) tới Quản lý ${managerName} (${managerEmail}): ${totalIncidents} sự cố (${criticalCount} khẩn cấp), downtime: ${totalDowntimeHours}h, chi phí: ${formatVNDServer(estimatedCostVND)}. File: ${reportFormat}.`,
    };

    weeklyEmailDispatchLogs.unshift(newDispatchLog);
    serverEmailSchedule.totalSentCount = (serverEmailSchedule.totalSentCount || 0) + 1;
    serverEmailSchedule.lastRunAt = new Date().toISOString();

    // Also push to notification logs
    const notifId = `rep-notif-${Date.now()}`;
    const log: NotificationLog = {
      id: notifId,
      timestamp: new Date().toISOString(),
      deviceId: 'report-hub',
      deviceName: 'Báo Cáo Tóm Tắt Sự Cố Tuần (EDM)',
      errorCode: 'WEEKLY-EMAIL-SENT',
      recipientPhone: managerPhone || '0988.999.888',
      recipientName: managerName,
      channel: 'EMAIL',
      status: 'DELIVERED',
      previewText: `📧 [EMAIL ĐÃ GỬI QUẢN LÝ] Báo cáo tóm tắt sự cố ${weekRange} đã chuyển tới ${managerEmail} (${managerName}). Định dạng: ${reportFormat}.`,
    };
    notificationLogs.unshift(log);

    res.json({
      success: true,
      message: `Đã tự động gửi email báo cáo tóm tắt sự cố tuần tới Quản lý ${managerName} (${managerEmail}) thành công!`,
      data: {
        sentAt: new Date().toISOString(),
        dispatchLog: newDispatchLog,
        deliveryReceipt: {
          receiptId: deliveryReceiptId,
          recipientEmail: managerEmail,
          recipientName: managerName,
          status: 'DELIVERED',
          deliveryChannel: 'SMTP_GATEWAY_EDM_SECURE',
          attachments: [
            ...(reportFormat === 'PDF' || reportFormat === 'BOTH' ? ['Bao_Cao_Su_Co_Tuan_EDM.pdf'] : []),
            ...(reportFormat === 'CSV' || reportFormat === 'BOTH' ? ['Bao_Cao_Su_Co_Tuan_EDM.csv'] : []),
          ],
        },
        htmlPreview: htmlEmail,
      },
    });
  } catch (err: any) {
    console.error('Error sending weekly summary email:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi email báo cáo sự cố tuần' });
  }
});



// ==========================================
// REAL-TIME INCIDENT GROUP CHAT & WEBSOCKETS
// ==========================================

const roomSockets = new Map<string, Set<WebSocket>>();
const roomPresence = new Map<string, Map<string, { id: string; name: string; role: string; avatar?: string }>>();

function broadcastToRoom(deviceId: string, payload: any, excludeWs?: WebSocket) {
  const sockets = roomSockets.get(deviceId);
  if (!sockets) return;
  const messageStr = JSON.stringify(payload);
  sockets.forEach((ws) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(messageStr);
      } catch (err) {
        console.error('WS broadcast error:', err);
      }
    }
  });
}

// Helper to trigger AI Response in incident chat
async function generateAIGroupChatAdvice(deviceId: string, promptTrigger?: string) {
  const dev = devices.find((d) => d.id === deviceId);
  const errorInfo = dev?.activeIncident
    ? `Mã lỗi: ${dev.activeIncident.errorCode} - ${dev.activeIncident.errorTitle}`
    : 'Cảnh báo vận hành EDM';
  const telemetry = dev?.telemetry
    ? `Áp suất dầu: ${dev.telemetry.dielectricPressure} Bar, Dòng đỉnh: ${dev.telemetry.peakCurrent} A, Độ rung: ${dev.telemetry.vibration} mm/s, Điện áp xả: ${dev.telemetry.dischargeVoltage} V`
    : 'Không có dữ liệu đo';

  const recentMessages = (incidentChatStore[deviceId] || [])
    .slice(-6)
    .map((m) => `${m.senderName} (${m.senderRole}): ${m.content}`)
    .join('\n');

  try {
    const aiPrompt = `Bạn là EDM SmartGuard AI Copilot - Trợ lý Chuyên gia Kỹ thuật Cơ Điện & Cắt Dây EDM.
Các kỹ thuật viên đang thảo luận xử lý sự cố trực tiếp tại máy ${dev?.name || 'Máy EDM'} (${dev?.code || 'EDM-01'}).
Thông tin sự cố: ${errorInfo}
Thông số cảm biến thời gian thực: ${telemetry}
Các tin nhắn gần nhất giữa các kỹ thuật viên:
${recentMessages}
${promptTrigger ? `Yêu cầu cụ thể từ kỹ thuật viên: ${promptTrigger}` : ''}

Nhiệm vụ: Hãy đưa ra phân tích súc tích và 2-3 chỉ dẫn hành động kỹ thuật cực kỳ chính xác, thực tế tại hiện trường (kiểm tra cảm biến nào, van nào, thông số nào, linh kiện thay thế).
Độ dài tối đa 120 từ. Sử dụng định dạng danh sách gạch đầu dòng rõ ràng, phong cách chuyên nghiệp, khẩn trương, đồng đội.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: aiPrompt,
    });

    const aiContent = response.text || 'Đã phân tích sự cố: Đề xuất kiểm tra lưu lượng xả đáy và vệ sinh cảm biến áp lực.';
    
    const aiMsg: IncidentChatMessage = {
      id: `chat-${deviceId}-ai-${Date.now()}`,
      deviceId,
      incidentErrorCode: dev?.activeIncident?.errorCode || 'EDM-ALERT',
      senderId: 'ai-assistant',
      senderName: 'EDM SmartGuard AI Specialist',
      senderRole: 'Trợ Lý Kỹ Thuật AI',
      senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      content: aiContent,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'AI_ADVICE',
      pinned: true,
      reactions: { '💡': 1 },
    };

    if (!incidentChatStore[deviceId]) incidentChatStore[deviceId] = [];
    incidentChatStore[deviceId].push(aiMsg);

    broadcastToRoom(deviceId, {
      type: 'NEW_MESSAGE',
      deviceId,
      message: aiMsg,
    });

    return aiMsg;
  } catch (err) {
    console.warn('AI group chat advice error, using fallback rule:', err);
    const fallbackMsg: IncidentChatMessage = {
      id: `chat-${deviceId}-ai-${Date.now()}`,
      deviceId,
      incidentErrorCode: dev?.activeIncident?.errorCode || 'EDM-ALERT',
      senderId: 'ai-assistant',
      senderName: 'EDM SmartGuard AI Specialist',
      senderRole: 'Trợ Lý Kỹ Thuật AI',
      senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      content: `⚡ Khuyến nghị AI cho sự cố ${dev?.model || 'EDM'}:\n• 1. Ngắt công tắc an toàn trước khi mở khoang bơm xả.\n• 2. Kiểm tra màng lọc 3µm xem có bị tắc bẩn xỉ cắt phôi.\n• 3. Dùng đồng hồ đo áp lực cơ khí đối chiếu với tín hiệu cảm biến PT-102.`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'AI_ADVICE',
      pinned: true,
      reactions: { '💡': 1 },
    };
    if (!incidentChatStore[deviceId]) incidentChatStore[deviceId] = [];
    incidentChatStore[deviceId].push(fallbackMsg);
    broadcastToRoom(deviceId, {
      type: 'NEW_MESSAGE',
      deviceId,
      message: fallbackMsg,
    });
    return fallbackMsg;
  }
}

// REST Route: Get Chat Room Data
app.get('/api/devices/:id/chat', (req, res) => {
  const deviceId = req.params.id;
  const dev = devices.find((d) => d.id === deviceId);
  if (!dev) {
    return res.status(404).json({ success: false, message: 'Thiết bị không tồn tại' });
  }

  if (!incidentChatStore[deviceId]) {
    incidentChatStore[deviceId] = [
      {
        id: `chat-${deviceId}-init`,
        deviceId,
        incidentErrorCode: dev.activeIncident?.errorCode || 'E-102',
        senderId: 'system',
        senderName: 'Hệ Thống EDM SmartGuard',
        senderRole: 'Thông Báo Tự Động',
        content: `🚨 Phòng thảo luận nhóm thời gian thực cho sự cố [${dev.activeIncident?.errorCode || 'ALERT'}] trên ${dev.name}. Tất cả kỹ thuật viên trực có thể trao đổi trực tiếp và tra cứu sơ đồ cùng AI.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'TEXT',
      },
      {
        id: `chat-${deviceId}-tech1`,
        deviceId,
        incidentErrorCode: dev.activeIncident?.errorCode || 'E-102',
        senderId: 'tech-02',
        senderName: 'Nguyễn Văn Hùng',
        senderRole: 'Kỹ sư Trưởng Điện & PLC',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        content: `Tôi vừa nhận cảnh báo máy ${dev.code}. Anh em ai ở gần xưởng B kiểm tra trước đồng hồ áp suất và công tắc hành trình trục Z nhé!`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: 'TEXT',
        reactions: { '👍': 2 },
      },
    ];
  }

  const pMap = roomPresence.get(deviceId);
  const activeUsers = pMap ? Array.from(pMap.values()) : [];

  res.json({
    success: true,
    deviceId,
    messages: incidentChatStore[deviceId],
    activeUsers,
  });
});

// REST Route: Post Message to Incident Chat
app.post('/api/devices/:id/chat', async (req, res) => {
  try {
    const deviceId = req.params.id;
    const {
      senderId,
      senderName,
      senderRole,
      senderAvatar,
      content,
      type = 'TEXT',
      telemetrySnapshot,
      imageUrl,
      actionTag,
      askAI,
    } = req.body;

    if (!content && !imageUrl && !actionTag) {
      return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });
    }

    if (!incidentChatStore[deviceId]) {
      incidentChatStore[deviceId] = [];
    }

    const dev = devices.find((d) => d.id === deviceId);
    const newMsg: IncidentChatMessage = {
      id: `chat-${deviceId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      deviceId,
      incidentErrorCode: dev?.activeIncident?.errorCode || 'EDM-ALERT',
      senderId: senderId || 'tech-guest',
      senderName: senderName || 'Kỹ thuật viên',
      senderRole: senderRole || 'Kỹ thuật viên Vận hành',
      senderAvatar,
      content: content || (actionTag ? actionTag.label : ''),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      telemetrySnapshot: telemetrySnapshot || (type === 'TELEMETRY_SHARE' ? dev?.telemetry : undefined),
      imageUrl,
      actionTag,
      pinned: false,
      reactions: {},
    };

    incidentChatStore[deviceId].push(newMsg);

    // Broadcast via WebSocket
    broadcastToRoom(deviceId, {
      type: 'NEW_MESSAGE',
      deviceId,
      message: newMsg,
    });

    res.json({
      success: true,
      message: newMsg,
    });

    // If message contains @AI or askAI was requested, trigger AI advice
    const isAiTriggered = askAI || (content && (content.toLowerCase().includes('@ai') || content.toLowerCase().includes('hỏi ai')));
    if (isAiTriggered) {
      setTimeout(() => {
        generateAIGroupChatAdvice(deviceId, content);
      }, 500);
    }
  } catch (err: any) {
    console.error('Error posting incident chat message:', err);
    res.status(500).json({ success: false, message: 'Lỗi gửi tin nhắn thảo luận sự cố' });
  }
});

// REST Route: Ask AI in Group Chat
app.post('/api/devices/:id/chat/ask-ai', async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { prompt } = req.body;
    const aiMsg = await generateAIGroupChatAdvice(deviceId, prompt);
    res.json({ success: true, message: aiMsg });
  } catch (err: any) {
    console.error('Error asking AI in group chat:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi yêu cầu AI tư vấn' });
  }
});

// REST Route: Toggle Pin
app.post('/api/devices/:id/chat/:messageId/pin', (req, res) => {
  const { id: deviceId, messageId } = req.params;
  const messages = incidentChatStore[deviceId] || [];
  const msg = messages.find((m) => m.id === messageId);
  if (!msg) {
    return res.status(404).json({ success: false, message: 'Tin nhắn không tồn tại' });
  }
  msg.pinned = !msg.pinned;
  broadcastToRoom(deviceId, {
    type: 'MESSAGE_PIN_UPDATED',
    deviceId,
    messageId,
    pinned: msg.pinned,
  });
  res.json({ success: true, pinned: msg.pinned });
});

// REST Route: Add Reaction
app.post('/api/devices/:id/chat/:messageId/reaction', (req, res) => {
  const { id: deviceId, messageId } = req.params;
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ success: false, message: 'Thiếu emoji' });
  const messages = incidentChatStore[deviceId] || [];
  const msg = messages.find((m) => m.id === messageId);
  if (!msg) {
    return res.status(404).json({ success: false, message: 'Tin nhắn không tồn tại' });
  }
  if (!msg.reactions) msg.reactions = {};
  msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
  broadcastToRoom(deviceId, {
    type: 'MESSAGE_REACTION_UPDATED',
    deviceId,
    messageId,
    reactions: msg.reactions,
  });
  res.json({ success: true, reactions: msg.reactions });
});

// --- VITE DEV MIDDLEWARE / STATIC FILE SERVING ---
async function startServer() {
  const server = http.createServer(app);

  // Setup WebSocket Server for Real-Time Technician Group Chat
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    let currentDeviceId: string | null = null;
    let currentUser: { id: string; name: string; role: string; avatar?: string } | null = null;

    ws.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'JOIN_ROOM') {
          const { deviceId, user } = data;
          currentDeviceId = deviceId;
          currentUser = user;

          if (!roomSockets.has(deviceId)) {
            roomSockets.set(deviceId, new Set());
          }
          roomSockets.get(deviceId)!.add(ws);

          if (!roomPresence.has(deviceId)) {
            roomPresence.set(deviceId, new Map());
          }
          if (user && user.id) {
            roomPresence.get(deviceId)!.set(user.id, user);
          }

          if (!incidentChatStore[deviceId]) {
            const dev = devices.find((d) => d.id === deviceId);
            incidentChatStore[deviceId] = [
              {
                id: `chat-${deviceId}-init`,
                deviceId,
                incidentErrorCode: dev?.activeIncident?.errorCode || 'EDM-ALERT',
                senderId: 'system',
                senderName: 'Hệ Thống EDM SmartGuard',
                senderRole: 'Thông Báo Tự Động',
                content: `🔔 Đã khởi tạo phòng thảo luận sự cố khẩn cấp cho thiết bị ${dev?.name || deviceId} (${dev?.code || 'CNC'}). Mời các kỹ thuật viên ca trực vào phối hợp xử lý.`,
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                type: 'TEXT',
              },
            ];
          }

          const activeUsers = Array.from(roomPresence.get(deviceId)!.values());
          ws.send(
            JSON.stringify({
              type: 'ROOM_INIT',
              deviceId,
              messages: incidentChatStore[deviceId] || [],
              activeUsers,
            })
          );

          broadcastToRoom(
            deviceId,
            {
              type: 'PRESENCE_UPDATE',
              deviceId,
              activeUsers,
            },
            ws
          );
        } else if (data.type === 'SEND_MESSAGE') {
          const { deviceId, message, askAI } = data;
          if (!incidentChatStore[deviceId]) incidentChatStore[deviceId] = [];

          const newMsg: IncidentChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            deviceId,
            incidentErrorCode: data.incidentErrorCode,
            senderId: message.senderId || currentUser?.id || 'tech-guest',
            senderName: message.senderName || currentUser?.name || 'Kỹ thuật viên',
            senderRole: message.senderRole || currentUser?.role || 'Kỹ thuật viên Vận hành',
            senderAvatar: message.senderAvatar || currentUser?.avatar,
            content: message.content,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: message.type || 'TEXT',
            telemetrySnapshot: message.telemetrySnapshot,
            pinned: false,
            reactions: {},
            imageUrl: message.imageUrl,
            actionTag: message.actionTag,
          };

          incidentChatStore[deviceId].push(newMsg);

          broadcastToRoom(deviceId, {
            type: 'NEW_MESSAGE',
            deviceId,
            message: newMsg,
          });

          const shouldAskAI =
            askAI ||
            (newMsg.content && (newMsg.content.toLowerCase().includes('@ai') || newMsg.content.toLowerCase().includes('hỏi ai'))) ||
            newMsg.type === 'AI_ADVICE';

          if (shouldAskAI) {
            setTimeout(() => {
              generateAIGroupChatAdvice(deviceId, newMsg.content);
            }, 500);
          }
        } else if (data.type === 'TYPING') {
          if (currentDeviceId) {
            broadcastToRoom(
              currentDeviceId,
              {
                type: 'USER_TYPING',
                deviceId: currentDeviceId,
                userName: data.userName,
                isTyping: data.isTyping,
              },
              ws
            );
          }
        } else if (data.type === 'TOGGLE_PIN') {
          const { deviceId, messageId } = data;
          const msg = (incidentChatStore[deviceId] || []).find((m) => m.id === messageId);
          if (msg) {
            msg.pinned = !msg.pinned;
            broadcastToRoom(deviceId, {
              type: 'MESSAGE_PIN_UPDATED',
              deviceId,
              messageId,
              pinned: msg.pinned,
            });
          }
        } else if (data.type === 'ADD_REACTION') {
          const { deviceId, messageId, emoji } = data;
          const msg = (incidentChatStore[deviceId] || []).find((m) => m.id === messageId);
          if (msg) {
            if (!msg.reactions) msg.reactions = {};
            msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
            broadcastToRoom(deviceId, {
              type: 'MESSAGE_REACTION_UPDATED',
              deviceId,
              messageId,
              reactions: msg.reactions,
            });
          }
        }
      } catch (err) {
        console.error('WS message error:', err);
      }
    });

    ws.on('close', () => {
      if (currentDeviceId) {
        const sockets = roomSockets.get(currentDeviceId);
        if (sockets) {
          sockets.delete(ws);
          if (sockets.size === 0) roomSockets.delete(currentDeviceId);
        }

        if (currentUser && currentUser.id && roomPresence.has(currentDeviceId)) {
          const pMap = roomPresence.get(currentDeviceId)!;
          pMap.delete(currentUser.id);
          broadcastToRoom(currentDeviceId, {
            type: 'PRESENCE_UPDATE',
            deviceId: currentDeviceId,
            activeUsers: Array.from(pMap.values()),
          });
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 EDM SmartGuard full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
