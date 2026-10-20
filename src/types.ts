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

export interface RepairStageEta {
  stageName: string;
  durationMinutes: number;
  description: string;
  recommendedTools?: string[];
}

export interface HistoricalRepairBenchmark {
  sampleCount: number;
  averageMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  fastestTechnician?: string;
  mostFrequentPartsReplaced: string[];
  pastOccurrencesDates: string[];
}

export interface RepairEtaAnalysis {
  estimatedMinutes: number;
  estimatedCompletionTime: string;
  confidenceScore: number;
  confidenceLevel: 'VERY_HIGH' | 'HIGH' | 'MODERATE';
  complexityLevel: 'SIMPLE' | 'STANDARD' | 'COMPLEX' | 'CRITICAL';
  historicalBenchmark: HistoricalRepairBenchmark;
  stagedBreakdown: RepairStageEta[];
  influencingFactors: string[];
  riskDelayFactors: string[];
  aiAccelerationTips: string[];
  historicalCorrelationRationale: string;
  generatedAt: string;
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
  repairEtaAnalysis?: RepairEtaAnalysis;
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
  isAI?: boolean;
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
  deviceCode?: string;
  deviceName?: string;
  taskTitle: string;
  taskType: 'PREVENTIVE' | 'CORRECTIVE' | 'PARTS_REPLACEMENT' | 'CALIBRATION' | 'OVERHAUL';
  completedAt: string; // Ngày thực hiện (ISO date string)
  technicianName: string; // Kỹ thuật viên thực hiện
  technicianRole?: string;
  durationMinutes: number;
  partsReplaced: string[]; // Bộ phận thay thế
  findingsAndActions: string; // Tổng hợp phát hiện & xử lý kỹ thuật
  incidentDescription?: string; // Mô tả sự cố / Hiện tượng hỏng hóc ban đầu
  repairActions?: string; // Hành động sửa chữa / Quy trình khắc phục
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

export interface ShortcutTelemetryItem {
  id: string;
  combo: string;
  action: string;
  category: 'navigation' | 'operation';
  count: number;
  lastUsedAt: string | null;
}

export interface ShortcutTelemetryLog {
  id: string;
  shortcutId: string;
  combo: string;
  action: string;
  timestamp: string;
}

export interface ShortcutTelemetryState {
  items: Record<string, ShortcutTelemetryItem>;
  totalCount: number;
  sessionStartTime: string;
  recentLogs: ShortcutTelemetryLog[];
  lastRecordedShortcut: string | null;
}

export interface WeeklyEmailScheduleConfig {
  enabled: boolean;
  recipientEmail: string;
  recipientName: string;
  recipientRole: string;
  sendDayOfWeek: number; // 0 = Sunday, 5 = Friday, 6 = Saturday
  sendHour: number; // 0 - 23 (e.g. 17 = 17:00)
  sendMinute: number; // e.g. 0
  reportFormat: 'PDF' | 'CSV' | 'BOTH';
  includeOnlyCorrective: boolean;
  technicianSenderName: string;
  customNotes: string;
  lastRunAt?: string;
  nextRunAt?: string;
  totalSentCount: number;
}

export interface WeeklyEmailReportDispatchLog {
  id: string;
  sentAt: string;
  recipientEmail: string;
  recipientName: string;
  technicianSender: string;
  weekRange: string;
  totalIncidents: number;
  criticalCount: number;
  totalDowntimeHours: number;
  estimatedCostVND: number;
  reportFormat: 'PDF' | 'CSV' | 'BOTH';
  triggerType: 'AUTOMATIC_CRON' | 'MANUAL_TEST' | 'MANUAL_DISPATCH';
  status: 'DELIVERED' | 'FAILED';
  deliveryReceiptId: string;
  previewSummary: string;
}

export type PushNotificationSeverityFilter = 'ALL' | 'CRITICAL_ONLY' | 'HIGH_AND_CRITICAL';

export interface PushNotificationFilterConfig {
  severityFilter: PushNotificationSeverityFilter;
  nightShiftMode: boolean; // Ca trực đêm
  nightShiftStartHour: number; // Mặc định: 22 (22:00)
  nightShiftEndHour: number; // Mặc định: 6 (06:00)
  nightShiftSeverityFilter: PushNotificationSeverityFilter; // Mặc định: CRITICAL_ONLY
  vibrationEnabled: boolean;
  soundAlarmEnabled: boolean;
  muteIdleAlarms: boolean;
  autoAcknowledgeLowSeverity: boolean;
  ignoredDeviceCodes: string[];
}

export interface RootCauseCategoryItem {
  category: 'MAN' | 'MACHINE' | 'MATERIAL' | 'METHOD' | 'MEASUREMENT' | 'ENVIRONMENT';
  categoryLabel: string;
  causes: string[];
  impactScore: number; // 0 - 100
}

export interface WhyStep {
  level: number; // 1 to 5
  question: string;
  answer: string;
  evidence: string;
}

export interface StoppageActionStep {
  stepNumber: number;
  phase: 'IMMEDIATE_QUICK_FIX' | 'CORRECTIVE_REPAIR' | 'LONG_TERM_PREVENTION';
  actionTitle: string;
  actionDetail: string;
  estimatedMinutes: number;
  requiredTools: string[];
  requiredParts?: string[];
  safetyNotice?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'EXPERT';
}

export interface RootCauseAnalysisResult {
  id: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  targetErrorCode?: string;
  targetIncidentSummary: string;
  analyzedAt: string;
  analyzedRecordsCount: number;
  primaryRootCause: string;
  confidenceScore: number; // 0 - 100%
  recurrenceProbability: number; // 0 - 100%
  failureMechanismDeepDive: string;
  ishikawaCategories: RootCauseCategoryItem[];
  fiveWhysChain: WhyStep[];
  quickFixSolution: {
    summary: string;
    estimatedMinutes: number;
    steps: string[];
  };
  permanentRepairSolution: {
    summary: string;
    estimatedMinutes: number;
    steps: string[];
    preventionPolicy: string;
  };
  actionSteps: StoppageActionStep[];
  recommendedParts: {
    name: string;
    partNumber: string;
    urgency: 'IMMEDIATE' | 'NEXT_SHIFT' | 'SCHEDULED';
    inStockEstimate?: number;
  }[];
  criticalSafetyGuidelines: string[];
  historicalPrecedents: {
    recordId: string;
    date: string;
    technician: string;
    similarityScore: number;
    lessonLearned: string;
  }[];
}

export type SparePartCategory =
  | 'FILTRATION'
  | 'POWER_FEED_CONTACTS'
  | 'WIRE_DRIVE'
  | 'DIELECTRIC_FLUID'
  | 'MECHANICAL_AXIS'
  | 'PNEUMATIC_VALVES'
  | 'ELECTRONICS'
  | 'CONSUMABLES';

export interface SparePart {
  id: string;
  partNumber: string; // SKU e.g. FLT-EDM-300
  name: string;
  category: SparePartCategory;
  categoryLabel: string;
  compatibleModels: string[];
  currentStock: number;
  minSafetyStock: number;
  unit: string;
  unitPriceUSD: number;
  binLocation: string; // e.g. "Kệ A2-03 (Kho Cơ Điện)"
  leadTimeDays: number;
  supplier: string;
  lastRestockDate: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  criticality: 'CRITICAL' | 'HIGH' | 'STANDARD';
  description: string;
  specifications?: string;
}

export interface StockTransaction {
  id: string;
  partId: string;
  partNumber: string;
  partName: string;
  type: 'ISSUE' | 'RECEIPT' | 'ADJUST' | 'REQUISITION';
  quantity: number;
  previousStock: number;
  newStock: number;
  timestamp: string;
  technicianName: string;
  targetDeviceId?: string;
  targetDeviceCode?: string;
  reason: string;
  workOrderOrIncidentId?: string;
}

export interface PurchaseOrderRequest {
  id: string;
  partId: string;
  partNumber: string;
  partName: string;
  quantityRequested: number;
  urgency: 'EMERGENCY_DOWNTIME' | 'RESTOCK_WARNING' | 'SCHEDULED_PM';
  requestedBy: string;
  requestedAt: string;
  status: 'PENDING_APPROVAL' | 'ORDERED' | 'RECEIVED' | 'REJECTED';
  estimatedArrivalDate: string;
  supplier: string;
  notes?: string;
  targetDeviceCode?: string;
}

export interface ImageInspectionResult {
  componentName: string;
  componentCategory: string;
  defectDetected: string;
  wearLevelPercent: number; // 0 - 100%
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NORMAL';
  confidenceScore: number; // 0 - 100%
  correlatedErrorCode?: string;
  technicalFindings: string;
  recommendedActions: string[];
  suggestedPartSku?: string;
  suggestedPartName?: string;
  safetyNotice?: string;
  analyzedAt: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
}

