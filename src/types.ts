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

export interface HistoryCorrelationInsight {
  correlatedTaskId?: string;
  correlatedTaskTitle: string;
  lastMaintenanceDate: string;
  operatingHoursAtMaintenance?: number;
  hoursElapsedSince?: number;
  partsReplacedInPast?: string[];
  findingsHistory?: string;
  riskHypothesis: string;
  correlationPercentage: number;
  preventiveActionAdvised?: string;
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
  historyCorrelation?: HistoryCorrelationInsight;
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
  assignedTechnician?: Technician;
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

export interface FactoryStats {
  totalDevices: number;
  runningCount: number;
  alarmCount: number;
  idleCount: number;
  avgOee: number;
  totalLearnings: number;
  totalDocuments: number;
  mttrMinutes: number;
  mtbfHours: number;
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

export interface MaintenanceRecord {
  id: string;
  deviceId: string;
  taskTitle: string;
  taskType: 'PREVENTIVE' | 'CORRECTIVE' | 'PARTS_REPLACEMENT' | 'CALIBRATION' | 'OVERHAUL';
  completedAt: string;
  technicianName: string;
  technicianRole?: string;
  durationMinutes: number;
  partsReplaced: string[];
  findingsAndActions: string;
  technicianNotes?: string;
  operatingHoursAtMaintenance: number;
  qualityPassed: boolean;
  costEstimateVND?: number;
  aiVerified?: boolean;
}

export interface MaintenanceReminder {
  id: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  componentName: string; // e.g. "Lõi lọc nước ion & giấy (Dielectric Filter)" or "Bơm nước làm mát (Coolant Pump)"
  componentType: 'FILTER' | 'PUMP' | 'GUIDE' | 'CONTACT' | 'LUBRICATION' | 'SPINDLE' | 'CUSTOM';
  intervalType: 'CALENDAR_DAYS' | 'OPERATING_HOURS';
  intervalValue: number; // e.g. 14 days or 250 hours
  lastServicedDate: string; // ISO date
  nextDueDate: string; // ISO date
  currentOperatingHours?: number;
  dueOperatingHours?: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  notificationChannel: 'PUSH_NOTIFICATION' | 'SMS' | 'AUDIO_ALARM';
  assignedTechnicianName: string;
  instructions: string;
  isActive: boolean;
  createdAt: string;
}

