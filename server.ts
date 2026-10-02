import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

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
}

export interface TechnicalDocument {
  id: string;
  title: string;
  category: 'OPERATING_MANUAL' | 'OEM_ERROR_CODES' | 'SOP' | 'SCHEMATICS' | 'MAINTENANCE_GUIDE';
  targetModel: string;
  author: string;
  updatedAt: string;
  summary: string;
  content: string;
  tags: string[];
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
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  deviceId: string;
  deviceName: string;
  errorCode: string;
  recipientPhone: string;
  recipientName: string;
  channel: 'PUSH_NOTIFICATION' | 'SMS' | 'URGENT_AUDIO';
  status: 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED';
  previewText: string;
}

// Helper to call Gemini with retry and fallback
async function callGeminiWithFallback(prompt: string, schema?: any): Promise<string> {
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
        contents: prompt,
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
    shift: 'Ca Sáng (06:00 - 14:30)',
    activeStatus: 'ON_DUTY',
    fcmToken: 'fcm_phone_ducanh_xiaomi14',
  },
];

// Initial Technical Documents (Knowledge Base for RAG context)
let technicalDocuments: TechnicalDocument[] = [
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
    timesAppliedSuccessfully: 9,
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
    timesAppliedSuccessfully: 6,
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
      oee: 89.6,
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
      oee: 84.5,
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
    device.lastEdmSignalTime = new Date().toISOString();
    device.incidentHistoryCount += 1;

    const incidentId = `INC-${Date.now().toString().slice(-6)}`;
    const newIncident: Incident = {
      incidentId,
      deviceId: device.id,
      errorCode: errorCode || 'E-102',
      errorTitle: errorTitle || 'Sự cố dừng khẩn cấp từ hệ thống EDM',
      severity,
      triggeredAt: new Date().toISOString(),
      status: 'ACTIVE',
      telemetrySnapshot: { ...device.telemetry },
      assignedTechnician: tech,
      pushDelivered: true,
      pushDeliveredAt: new Date().toISOString(),
    };

    device.activeIncident = newIncident;

    // Create Push Notification Entry (Simulating instant phone push to technician)
    const notifText = `🚨 [EDM DỪNG MÁY KHẨN CẤP] Thiết bị ${device.code} (${device.name}) tại ${device.location} vừa báo dừng! Mã lỗi: ${newIncident.errorCode} - ${newIncident.errorTitle}. KTV ${tech.name} vui lòng tiếp nhận ngay!`;

    const newNotification: NotificationLog = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
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
      message: `Hệ thống EDM đã ghi nhận dừng máy khẩn cấp! Đã phát thông báo đẩy tức thì đến điện thoại ${tech.phone} (${tech.name})`,
      incident: newIncident,
      notification: newNotification,
    });
  } catch (err: any) {
    console.error('Trigger alarm error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi phát sự cố EDM' });
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

// 7. Resolve Incident & Provide Human Resolution Data
app.post('/api/devices/:id/resolve', async (req, res) => {
  try {
    const { actualRootCause, fixSummary, partsReplaced, durationMinutes, aiHelpfulRating, technicianNotes } = req.body;
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

    // Auto-trigger AI learning synthesis from human repair experience
    let newAILearning: AILearning | null = null;
    if (fixSummary && fixSummary.length > 10) {
      try {
        const prompt = `
Bạn là Kỹ sư Trưởng AI Chuyên gia bảo trì máy EDM và thiết bị công nghiệp sản xuất chính xác.
Kỹ thuật viên vừa hoàn thành sửa máy và gửi báo cáo thực tế. Hãy tổng hợp bài học kinh nghiệm ("AI Learning") ngắn gọn, có giá trị thực chiến cao để bộ não AI học hỏi và ghi nhớ cho các lần sửa sau:

- Thiết bị: ${device.model} (${device.name})
- Mã lỗi đã xảy ra: ${device.activeIncident.errorCode} - ${device.activeIncident.errorTitle}
- Nguyên nhân thực tế phát hiện: ${resolution.actualRootCause}
- Phương án sửa chữa thực tế của kỹ thuật viên: ${resolution.fixSummary}
- Linh kiện đã thay thế/vệ sinh: ${resolution.partsReplaced.join(', ') || 'Không thay, chỉ vệ sinh và chỉnh thông số'}
- Đánh giá của kỹ thuật viên đối với AI: ${resolution.aiHelpfulRating}/5 sao
- Ghi chú thêm: ${resolution.technicianNotes}

Hãy trả về JSON theo schema:
{
  "title": "Tên bài học kinh nghiệm ngắn gọn (tối đa 15 từ)",
  "aiSynthesizedRule": "Đúc kết quy tắc xử lý thực chiến của AI (1-2 câu, nêu rõ mẹo kiểm tra hoặc cách làm tiết kiệm thời gian nhất)"
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
            timesAppliedSuccessfully: 1,
            verified: true,
          };
          aiLearnings.unshift(newAILearning);
        }
      } catch (aiErr) {
        console.warn('AI learning synthesis fallback:', aiErr);
      }
    }

    res.json({
      success: true,
      message: 'Đã hoàn tất khắc phục sự cố! Thiết bị đã sẵn sàng hoạt động trở lại.',
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
    const { deviceId, incidentId } = req.body;
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

TÀI LIỆU KỸ THUẬT DO CON NGƯỜI ĐÃ CUNG CẤP CHO BẠN:
${relevantDocs.map((d) => `[Tài liệu: ${d.title}]\n${d.content.slice(0, 700)}`).join('\n---\n')}

KINH NGHIỆM THỰC CHIẾN MÀ BẠN (AI) ĐÃ HỌC TỪ CÁC KỸ THUẬT VIÊN TRƯỚC ĐÂY:
${relevantLearnings.map((l) => `[Bài học từ ${l.discoveredBy}]: ${l.aiSynthesizedRule}\nCách giải quyết thực tế: ${l.humanSolution}`).join('\n---\n')}

YÊU CẦU:
Hãy phân tích nguyên nhân sự cố một cách sắc sảo, tích hợp cả tài liệu kỹ thuật lẫn kinh nghiệm thực chiến đã học từ con người để đưa ra giải pháp sửa chữa NHANH NHẤT và AN TOÀN NHẤT.

Trả về kết quả chuẩn định dạng JSON theo schema:
{
  "rootCause": "Tóm tắt nguyên nhân gốc rễ chính (1-2 câu súc tích)",
  "confidenceScore": 95,
  "failureMechanism": "Cơ chế hỏng hóc chi tiết (sự tương quan giữa các thông số EDM sụt giảm/tăng vọt)",
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
    const { title, category, targetModel, content, tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung tài liệu là bắt buộc' });
    }

    // Call Gemini to generate a high-precision summary & index
    let summary = content.slice(0, 180) + '...';
    try {
      const summaryPrompt = `
Hãy đọc tài liệu kỹ thuật máy công nghiệp sau và tạo 1 đoạn tóm tắt ngắn (khoảng 35-50 từ) nêu bật mục đích, mã lỗi hoặc quy trình chính để bộ não AI lập chỉ mục tra cứu:
Tiêu đề: ${title}
Nội dung: ${content}
`;
      const sumRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: summaryPrompt,
      });
      if (sumRes.text) {
        summary = sumRes.text.trim();
      }
    } catch (e) {
      console.warn('AI summary failed, using fallback');
    }

    const newDoc: TechnicalDocument = {
      id: `doc-${Date.now()}`,
      title,
      category: category || 'MAINTENANCE_GUIDE',
      targetModel: targetModel || 'Chung cho thiết bị xưởng',
      author: 'Kỹ thuật viên cập nhật',
      updatedAt: new Date().toISOString().split('T')[0],
      summary,
      content,
      tags: Array.isArray(tags) ? tags : ['Tài liệu mới', 'Cập nhật'],
    };

    technicalDocuments.unshift(newDoc);

    res.json({
      success: true,
      message: 'Đã cập nhật tài liệu thành công vào bộ nhớ tri thức AI!',
      data: newDoc,
    });
  } catch (err: any) {
    console.error('Add document error:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi tải lên tài liệu' });
  }
});

// 11. AI Learnings (Knowledge Graph)
app.get('/api/ai/learnings', (req, res) => {
  res.json({ success: true, data: aiLearnings });
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

// --- VITE DEV MIDDLEWARE / STATIC FILE SERVING ---
async function startServer() {
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

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 EDM SmartGuard full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
