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

// -------------------------------------------------------------
// MODULE 4: CROSS-FACTORY EDM COMMUNITY (COM-01 -> COM-06)
// -------------------------------------------------------------

export type CommunityVerificationBadge =
  | 'VERIFIED'       // Đã kiểm chứng bởi chuyên gia/leader
  | 'IN_DISCUSSION'  // Đang thảo luận
  | 'AI_PROPOSAL'    // Đề xuất bởi AI Copilot
  | 'OEM_OFFICIAL';  // Hướng dẫn chính hãng từ hãng máy

export type CommunitySubsystem =
  | 'DIELECTRIC'        // Hệ tuần hoàn dung dịch & lọc ion
  | 'WIRE_FEED'         // Bộ kéo dây, cụm ly hợp & con lăn dẫn
  | 'GENERATOR_SPARK'   // Nguồn xung cao tần & board mạch xả
  | 'CNC_AXIS'          // Trục tọa độ X/Y/U/V/Z, encoder, vitme
  | 'WATER_CHILLER'     // Máy làm lạnh dung môi làm mát
  | 'AUTO_THREADING';   // Cụm xỏ dây tự động AWT

export interface KnowledgeLifecycleStage {
  stage: 1 | 2 | 3 | 4 | 5; // 1: Đề xuất, 2: Thẩm định chuyên gia, 3: Chuẩn hóa SOP, 4: Phê duyệt Quản đốc, 5: Phát hành chính thức
  stageName: string;
  submittedAt: string;
  expertReviewedBy?: string;
  expertReviewNotes?: string;
  sopStandardizedDraft?: string;
  directorApprovedBy?: string;
  directorApprovedAt?: string;
  publishedAt?: string;
}

export interface CommunityAnswer {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorPlant: string;
  authorAvatar?: string;
  authorBadge?: string;
  isAI?: boolean;
  content: string;
  stepByStepFix?: string[];
  partsReplaced?: string[];
  safetyCautions?: string;
  upvotes: number;
  isAccepted: boolean;
  createdAt: string;
  verifiedByLeader?: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  targetModel: string;
  brand: 'Makino' | 'Sodick' | 'Fanuc' | 'Mitsubishi' | 'Chmer' | 'General';
  subsystem: CommunitySubsystem;
  errorCode?: string;
  symptomDescription: string;
  attemptedSteps: string[];
  anonymized: boolean; // Đã loại bỏ số seri và dữ liệu độc quyền của khách hàng
  plantScope: 'LOCAL_PLANT' | 'ALL_FACTORIES';
  originPlant: string; // Tên nhà máy phát sinh
  authorId: string;
  authorName: string;
  authorRole: string;
  authorBadge?: string;
  isAnonymousAuthor: boolean;
  status: 'OPEN' | 'IN_DISCUSSION' | 'VERIFIED_SOLUTION' | 'STANDARDIZED_SOP';
  verificationBadge: CommunityVerificationBadge;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  answersCount: number;
  viewCount: number;
  bestAnswerId?: string;
  tags: string[];
  aiSummary?: string;
  aiSafetyWarnings?: string[];
  lifecycle?: KnowledgeLifecycleStage;
  answers: CommunityAnswer[];
}

export interface ExpertBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface ExpertProfile {
  id: string;
  name: string;
  role: string;
  plant: string;
  avatar: string;
  specialties: string[];
  verifiedSolutionsCount: number;
  reputationScore: number;
  badges: ExpertBadge[];
  recentContributions: string[];
  isAnonymous?: boolean;
}

// -------------------------------------------------------------
// GIAI ĐOẠN 2: 4 ENGINES, CONTROL TOWER & LEARNING LOOP
// -------------------------------------------------------------

export type EquipmentRiskLevel = 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RiskTimelineStage =
  | 'NORMAL'
  | 'EARLY_WARNING'
  | 'DEGRADING'
  | 'HIGH_RISK'
  | 'CRITICAL';

export interface PredictiveEquipmentStatus {
  deviceId: string;
  deviceCode: string;
  name: string;
  model: string;
  healthScore: number; // 0-100
  riskScore: number; // 0-100
  riskLevel: EquipmentRiskLevel;
  timelineStage: RiskTimelineStage;
  healthTrend: 'IMPROVING' | 'STABLE' | 'DEGRADING_SLOW' | 'DEGRADING_FAST';
  repeatFailureCount: number;
  totalOperatingHours: number;
  lastMaintenanceHoursAgo: number;
  anomalousSensors: string[];
  predictedFailureMechanism?: string;
  predictionConfidence: number; // 0-100%
  expectedInspectionWindowHours: number;
  recommendedAction: string;
  workOrderDraftNeeded: boolean;
}

export type ProductionPriority = 'P1_URGENT' | 'P2_STANDARD' | 'P3_LOW';

export interface ProductionOrder {
  id: string;
  orderCode: string; // e.g. PO-EDM-9021
  clientName: string;
  partName: string;
  material: 'SKD11_HARDENED' | 'NAK80_PREHARDENED' | 'CARBIDE_TUNGSTEN' | 'TITANIUM_TI6AL4V' | 'ALUMINUM_7075';
  toleranceMm: number; // e.g. 0.003 mm
  requiredHours: number;
  completedHours: number;
  targetDeviceId: string;
  targetDeviceCode: string;
  priority: ProductionPriority;
  dueDate: string;
  status: 'ON_TRACK' | 'DELAY_RISK' | 'BOTTLENECK' | 'COMPLETED';
  batchQuantity: number;
  completedQuantity: number;
  unitValueUSD: number;
  delayHoursEstimate?: number;
}

export interface ProductionScenario {
  id: string;
  type: 'A_CURRENT' | 'B_REORDER_PRIORITY' | 'C_REROUTE_MACHINE' | 'D_MAINTAIN_FIRST' | 'E_ADJUST_CAPACITY';
  name: string;
  description: string;
  expectedThroughputPcs: number;
  estimatedCompletionHours: number;
  downtimeRiskPercent: number;
  qualityRiskPercent: number;
  onTimeDeliveryRate: number; // %
  resourceRequirements: string;
  pros: string[];
  cons: string[];
  isRecommended?: boolean;
}

export type QualityRiskLevel = 'NORMAL' | 'WATCH' | 'WARNING' | 'HIGH' | 'CRITICAL';

export type EdmDefectType =
  | 'SURFACE_PITTING'       // Rỗ bề mặt do phóng điện hồ quang thứ cấp
  | 'UV_TAPER_ERROR'        // Sai lệch góc côn trục U/V khi cắt côn
  | 'ROUGHNESS_EXCEEDED'    // Độ nhám bề mặt vượt ngưỡng Ra
  | 'CORNER_BURNOUT'        // Cháy phôi tại các góc bo R nhỏ
  | 'DIMENSION_DRIFT';      // Trôi kích thước do giãn nở nhiệt điện môi

export interface QualityRiskAssessment {
  id: string;
  deviceId: string;
  deviceCode: string;
  productModel: string;
  defectType: EdmDefectType;
  defectRiskPercent: number; // 0-100%
  riskLevel: QualityRiskLevel;
  correlatedParameters: {
    paramName: string;
    currentValue: string;
    nominalRange: string;
    impactScore: number;
  }[];
  evidenceSummary: string;
  recommendedQcAction: string;
  samplingRecommendation: string; // e.g. "Tăng tần suất đo CMM từ 1/10 lên 1/2 chi tiết"
  recipientRole: string;
}

export type AIDecisionEngineSource =
  | 'PREDICTIVE_MAINTENANCE'
  | 'PRODUCTION_OPTIMIZER'
  | 'QUALITY_FORECAST'
  | 'ROOT_CAUSE';

export interface AIDecisionCard {
  id: string;
  engineSource: AIDecisionEngineSource;
  problem: string;
  aiFinding: string;
  evidence: string[];
  risk: string;
  recommendedAction: string;
  expectedImpact: string;
  confidenceScore: number; // %
  humanLevel: 'LEVEL_1_INFO' | 'LEVEL_2_RECOMMENDATION' | 'LEVEL_3_CRITICAL_ACTION';
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'REQUEST_MORE_EVIDENCE';
  humanDecisionReason?: string;
  approverName?: string;
  approvedAt?: string;
  resultMeasurement?: {
    status: 'EFFECTIVE' | 'NOT_EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INDETERMINATE';
    actualDowntimeSavedHours?: number;
    defectPreventedCount?: number;
    notes?: string;
    measuredAt?: string;
  };
  timestamp: string;
  targetDeviceId?: string;
  targetDeviceCode?: string;
}

export interface DataQualityGateStatus {
  overallScore: number; // 0 - 100%
  completenessPercent: number;
  freshnessSeconds: number;
  consistencyPercent: number;
  anomalyDetected: boolean;
  isReliable: boolean;
  warningMessage?: string;
  lastCheckedTime: string;
}

export interface ImpactAnalysisSummary {
  failedDeviceId: string;
  failedDeviceCode: string;
  availableCapacityPercent: number;
  delayedOrdersCount: number;
  estimatedDelayHours: number;
  affectedRevenueUSD: number;
  rerouteCapacityPercent: number;
  orderCodeImpacted: string[];
}


export interface ExecutiveAIProposal {
  id: string;
  type: 'CAPEX_PURCHASE' | 'MAINTENANCE_DOWNTIME' | 'PARAMETER_OVERRIDE' | 'SPECIAL_SHIFT';
  title: string;
  targetDeviceId?: string;
  targetDeviceCode?: string;
  requestedBy: string;
  amountUSD?: number;
  downtimeHours?: number;
  urgency: 'HIGH' | 'MEDIUM';
  confidenceScore: number; // 0-100%
  aiEvidenceSummary: string; // Bằng chứng AI
  riskHypothesis: string; // Rủi ro nếu không thực hiện
  alternativeOptions: string[]; // Phương án thay thế
  missingDataNotes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUEST_MORE_INFO';
  timestamp: string;
  auditTrail?: {
    actionBy: string;
    actionAt: string;
    decisionReason: string;
    delegatedTo?: string;
  };
}

// ============================================================================
// PHASE 1: TRUSTED AI FOUNDATION EXTENSIONS
// ============================================================================

export type SystemRoleKey =
  | 'SYSTEM_ADMIN'
  | 'PLANT_MANAGER'
  | 'LEADER'
  | 'TECHNICIAN'
  | 'DATA_STEWARD'
  | 'WORKFLOW_APPROVER'
  | 'COMMUNITY_EXPERT'
  | 'COMMUNITY_MODERATOR';

export interface SystemRoleDefinition {
  key: SystemRoleKey;
  title: string;
  vietnameseTitle: string;
  department: string;
  description: string;
  allowedActions: string[];
  riskTierAuthority: 'LEVEL_1_ONLY' | 'LEVEL_1_AND_2' | 'ALL_LEVELS_CRITICAL';
  colorClass: string;
}

export type DataSourceProtocol = 'MODBUS_TCP' | 'REST_API' | 'OPC_UA' | 'MANUAL_IMPORT' | 'SQL_JDBC';

export interface DataSourceRegistryItem {
  id: string;
  name: string;
  category: 'PLC_MODBUS' | 'ERP_MES' | 'ZEISS_CMM' | 'OEM_MANUAL' | 'CMMS_MAINTENANCE';
  protocol: DataSourceProtocol;
  endpoint: string;
  frequency: string;
  latencyMs: number;
  connectionStatus: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  dataOwner: string;
  securityClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  lastSyncTime: string;
  recordsProcessedToday: number;
  errorRatePercent: number;
  isSyntheticDemo: boolean;
}

export type DataQualityDimensionKey =
  | 'COMPLETENESS'
  | 'FRESHNESS'
  | 'VALIDITY'
  | 'CONSISTENCY'
  | 'UNIQUENESS'
  | 'TRACEABILITY';

export interface DataQualityDimensionScore {
  key: DataQualityDimensionKey;
  name: string;
  vietnameseName: string;
  scorePercent: number;
  thresholdPercent: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  metricFormula: string;
  sampleCheckCount: number;
  failedCheckCount: number;
  details: string;
}

export interface DataQualityIssueItem {
  id: string;
  sourceId: string;
  sourceName: string;
  dimension: DataQualityDimensionKey;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  detectedAt: string;
  description: string;
  affectedFields: string[];
  assignedTo: string;
  assignedRole: SystemRoleKey;
  status: 'OPEN' | 'IN_INVESTIGATION' | 'RESOLVED' | 'SUPPRESSED';
  resolutionNotes?: string;
  resolvedAt?: string;
  correlationId: string;
}

export interface DataLineageNode {
  id: string;
  stepNumber: number;
  stepName: string;
  category: 'RAW_SOURCE' | 'INGESTION_ETL' | 'FEATURE_ENGINEERING' | 'AI_INFERENCE' | 'HITL_REVIEW' | 'VERIFIED_OUTCOME';
  sourceRef: string;
  inputSummary: string;
  outputSummary: string;
  qualityScore: number;
  executionTimestamp: string;
  correlationId: string;
  actorOrEngine: string;
  verificationHash: string;
}

export type DataReadinessState = 'READY' | 'READY_WITH_LIMITATIONS' | 'NOT_READY' | 'BLOCKED';

export interface AIReadinessGateReport {
  state: DataReadinessState;
  overallQualityScore: number;
  completenessScore: number;
  freshnessScore: number;
  validityScore: number;
  consistencyScore: number;
  uniquenessScore: number;
  traceabilityScore: number;
  evaluatedAt: string;
  activeBlockers: string[];
  allowedAIFeatures: string[];
  restrictedAIFeatures: string[];
}

export type HitlWorkflowState =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTION_PENDING'
  | 'EXECUTED'
  | 'VERIFICATION_PENDING'
  | 'VERIFIED';

export interface HitlWorkflowItem {
  id: string;
  correlationId: string;
  title: string;
  engineSource: AIDecisionEngineSource;
  targetDeviceId?: string;
  targetDeviceCode?: string;
  aiProposalSummary: string;
  evidenceSources: string[];
  riskLevel: 'LEVEL_1_INFO' | 'LEVEL_2_RECOMMENDATION' | 'LEVEL_3_CRITICAL_ACTION';
  currentState: HitlWorkflowState;
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
  executedBy?: string;
  executedAt?: string;
  executionResultNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationOutcome?: 'EFFECTIVE' | 'INEFFECTIVE' | 'PARTIAL';
  actualDowntimePreventedHours?: number;
  dataReadinessAtApproval: DataReadinessState;
}

export interface AuditLogEntry {
  id: string;
  correlationId: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: SystemRoleKey;
  actionType:
    | 'PROPOSAL_GENERATED'
    | 'QUALITY_EVALUATED'
    | 'PROPOSAL_REVIEWED'
    | 'PROPOSAL_APPROVED'
    | 'PROPOSAL_REJECTED'
    | 'WORK_ORDER_DISPATCHED'
    | 'EXECUTION_COMPLETED'
    | 'RESULT_VERIFIED'
    | 'DATA_SOURCE_UPDATED'
    | 'RULE_OVERRIDDEN'
    | 'SECURITY_ROLE_CHANGED'
    | 'ALERT_STATUS_CHANGED';
  targetEntity: string;
  targetEntityId: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  antiTamperHash: string;
  ipAddress?: string;
}

export type ManagedAlertLifecycleStage =
  | 'DETECTED'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'CLOSED';

export type AlertProvenanceType =
  | 'OBSERVED_REAL'
  | 'RULE_BASED'
  | 'AI_PREDICTION'
  | 'CONFIRMED';

export interface ManagedAlertItem {
  id: string;
  correlationId: string;
  deviceId: string;
  deviceCode: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  provenanceType: AlertProvenanceType;
  lifecycleStage: ManagedAlertLifecycleStage;
  detectedAt: string;
  dataSource: string;
  evidenceValues: string;
  assignedTo?: string;
  assignedRole?: SystemRoleKey;
  acknowledgedAt?: string;
  resolutionNote?: string;
  resolvedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  isSyntheticDemo: boolean;
}



