import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  Gauge,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Zap,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  Wrench,
  Search,
  Filter,
  Check,
  X,
  ChevronRight,
  ArrowRight,
  Database,
  RefreshCw,
  Building2,
  Package,
  AlertCircle,
  FileCheck,
  SlidersHorizontal,
  Sliders,
  DollarSign,
  PieChart,
} from 'lucide-react';
import {
  Device,
  FactoryStats,
  Technician,
  EquipmentRiskLevel,
  RiskTimelineStage,
  PredictiveEquipmentStatus,
  ProductionOrder,
  ProductionScenario,
  QualityRiskAssessment,
  AIDecisionCard,
  DataQualityGateStatus,
  ImpactAnalysisSummary,
} from '../../types';
import { soundManager } from '../../utils/audio';

interface AiPerformanceControlTowerProps {
  devices: Device[];
  technicians: Technician[];
  stats: FactoryStats | null;
  currentPlant: string;
  viewportMode: 'PC' | 'MOBILE';
  onOpenDeviceDetails: (device: Device) => void;
  onOpenDiagnosis: (device: Device) => void;
  onOpenWorkOrderDraft?: (deviceCode: string, actionTitle: string) => void;
}

// Initial Production Orders Data for EDM Mold Manufacturing
export const INITIAL_PRODUCTION_ORDERS: ProductionOrder[] = [
  {
    id: 'ord-01',
    orderCode: 'PO-EDM-9021',
    clientName: 'Samsung Electronics Vina',
    partName: 'Lòng khuôn vỏ điện thoại Flagship SKD11 (Tôi 60HRC)',
    material: 'SKD11_HARDENED',
    toleranceMm: 0.003,
    requiredHours: 36,
    completedHours: 24,
    targetDeviceId: 'dev-01',
    targetDeviceCode: 'EDM-W01 (Makino U6)',
    priority: 'P1_URGENT',
    dueDate: '18:00 ngày mai',
    status: 'DELAY_RISK',
    batchQuantity: 4,
    completedQuantity: 2,
    unitValueUSD: 4500,
    delayHoursEstimate: 4.5,
  },
  {
    id: 'ord-02',
    orderCode: 'PO-EDM-9022',
    clientName: 'VinFast Auto',
    partName: 'Chày dập biên dạng gân nắp capo ô tô (NAK80)',
    material: 'NAK80_PREHARDENED',
    toleranceMm: 0.005,
    requiredHours: 28,
    completedHours: 20,
    targetDeviceId: 'dev-02',
    targetDeviceCode: 'EDM-W02 (Sodick ALC600G)',
    priority: 'P2_STANDARD',
    dueDate: '12:00 ngày kia',
    status: 'ON_TRACK',
    batchQuantity: 2,
    completedQuantity: 1,
    unitValueUSD: 6200,
  },
  {
    id: 'ord-03',
    orderCode: 'PO-EDM-9023',
    clientName: 'Canon Precision Vietnam',
    partName: 'Linh kiện thấu kính quang học Carbide Tungsten',
    material: 'CARBIDE_TUNGSTEN',
    toleranceMm: 0.0015,
    requiredHours: 48,
    completedHours: 12,
    targetDeviceId: 'dev-03',
    targetDeviceCode: 'EDM-S01 (Makino EDAF3)',
    priority: 'P1_URGENT',
    dueDate: '20:00 ngày kia',
    status: 'BOTTLENECK',
    batchQuantity: 12,
    completedQuantity: 3,
    unitValueUSD: 1850,
    delayHoursEstimate: 6.0,
  },
  {
    id: 'ord-04',
    orderCode: 'PO-EDM-9024',
    clientName: 'Terumo BCT Medical',
    partName: 'Đầu kim vi phẫu y tế Titanium Ti-6Al-4V',
    material: 'TITANIUM_TI6AL4V',
    toleranceMm: 0.002,
    requiredHours: 18,
    completedHours: 14,
    targetDeviceId: 'dev-04',
    targetDeviceCode: 'EDM-W03 (Fanuc α-C600iB)',
    priority: 'P2_STANDARD',
    dueDate: 'Chủ Nhật này',
    status: 'ON_TRACK',
    batchQuantity: 50,
    completedQuantity: 38,
    unitValueUSD: 320,
  },
];

// Initial Quality Risk Assessments
export const INITIAL_QUALITY_RISKS: QualityRiskAssessment[] = [
  {
    id: 'qr-01',
    deviceId: 'dev-01',
    deviceCode: 'EDM-W01',
    productModel: 'SKD11 Khuôn Flagship',
    defectType: 'SURFACE_PITTING',
    defectRiskPercent: 68,
    riskLevel: 'HIGH',
    correlatedParameters: [
      { paramName: 'Áp suất xối phụ (Sub-flush)', currentValue: '6.4 Bar', nominalRange: '7.5 - 12.0 Bar', impactScore: 85 },
      { paramName: 'Độ dẫn điện ion nước', currentValue: '16.8 µS/cm', nominalRange: '8.0 - 15.0 µS/cm', impactScore: 72 },
    ],
    evidenceSummary: 'Cặn phoi tích tụ tại góc nhọn R0.2mm làm kích hoạt phóng điện thứ cấp lặp lại (arc re-striking), nguy cơ rỗ bề mặt vượt quá Ra 0.8µm.',
    recommendedQcAction: 'Tăng tần suất kiểm tra nhám bề mặt bằng máy Mitutoyo Surftest sau mỗi pass cắt thô.',
    samplingRecommendation: 'Tăng tần suất đo CMM từ 1/10 lên 1/2 chi tiết gia công.',
    recipientRole: 'QC Inspector & KTV Ca Trực',
  },
  {
    id: 'qr-02',
    deviceId: 'dev-02',
    deviceCode: 'EDM-W02',
    productModel: 'Khuôn dập NAK80',
    defectType: 'DIMENSION_DRIFT',
    defectRiskPercent: 42,
    riskLevel: 'WARNING',
    correlatedParameters: [
      { paramName: 'Nhiệt độ dung môi Dielectric', currentValue: '24.8 °C', nominalRange: '20.0 - 24.0 °C', impactScore: 78 },
      { paramName: 'Lực căng dây W_TENS', currentValue: '13.2 N', nominalRange: '12.0 - 18.0 N', impactScore: 45 },
    ],
    evidenceSummary: 'Chiller giải nhiệt dao động quanh 24.8°C vào buổi trưa khiến phôi thép giãn nở nhiệt 0.003mm/100mm chiều dài.',
    recommendedQcAction: 'Bù nhiệt độ tọa độ trên bộ điều khiển CNC LN2W hoặc cho máy nghỉ ổn nhiệt 10 phút.',
    samplingRecommendation: 'Đo kiểm kích thước ngoài phôi bằng panme điện tử Mitutoyo mỗi 2 giờ.',
    recipientRole: 'Leader EQM & KTV Sodick',
  },
];

// Initial AI Decision Cards across 4 Engines (P2-06)
export const INITIAL_AI_DECISION_CARDS: AIDecisionCard[] = [
  {
    id: 'dec-01',
    engineSource: 'PREDICTIVE_MAINTENANCE',
    problem: 'Máy Makino U6 (EDM-W01) có dấu hiệu sụt áp lực bơm xả và rung động trục Z tiệm cận ngưỡng báo động.',
    aiFinding: 'Phát hiện suy thoái màng lọc 3µm sau 248 giờ chạy liên tục (vượt 98% tuổi thọ khuyến nghị).',
    evidence: [
      'Áp lực xối P_FLUSH tụt từ 9.2 Bar xuống 6.4 Bar trong 3 ca gần nhất',
      'Độ rung trục chính VIB_SPN tăng từ 0.28 mm/s lên 0.42 mm/s (ngưỡng cảnh báo: 0.45 mm/s)',
      '14 cảnh báo đứt dây vi mô ghi nhận tại pass thô thứ 2',
    ],
    risk: 'Dừng máy khẩn cấp giữa chừng làm hỏng phôi khuôn SKD11 trị giá $4,500 và trễ đơn hàng Samsung.',
    recommendedAction: 'Thay thế lõi lọc áp lực 3µm FLT-EDM-300 và kiểm tra cụm tiếp điện Carbide trước ca chạy tối.',
    expectedImpact: 'Khôi phục 100% áp suất xối, triệt tiêu 95% nguy cơ đứt dây, bảo vệ tiến độ giao hàng đúng hạn.',
    confidenceScore: 94,
    humanLevel: 'LEVEL_3_CRITICAL_ACTION',
    status: 'PENDING_APPROVAL',
    timestamp: '15 phút trước',
    targetDeviceId: 'dev-01',
    targetDeviceCode: 'EDM-W01',
  },
  {
    id: 'dec-02',
    engineSource: 'PRODUCTION_OPTIMIZER',
    problem: 'Đơn hàng PO-EDM-9021 có nguy cơ chậm 4.5 giờ do máy EDM-W01 phải giảm 25% tốc độ cắt.',
    aiFinding: 'Máy EDM-W04 (Fanuc α-C600iB) đang dư thừa 14 giờ công suất khả dụng và tương thích hoàn toàn phôi SKD11.',
    evidence: [
      'Công suất khả dụng xưởng cắt dây: 78% (EDM-W04 đang chạy đơn P3 tải nhẹ)',
      'Dung sai yêu cầu ±0.003mm nằm trong năng lực gia công của Fanuc C600iB (±0.002mm)',
      'Đã đối chiếu sẵn sàng đồ gá Erowa ITS 50',
    ],
    risk: 'Phạt vi phạm tiến độ giao hàng $1,200 và ảnh hưởng uy tín chuỗi cung ứng.',
    recommendedAction: 'Kích hoạt Kịch bản B: Chuyển 2 phôi của đơn PO-EDM-9021 sang máy Fanuc EDM-W04 để chạy song song.',
    expectedImpact: 'Rút ngắn 6.5 giờ gia công, bù đắp hoàn toàn độ trễ, đạt 100% tỷ lệ On-Time Delivery.',
    confidenceScore: 91,
    humanLevel: 'LEVEL_3_CRITICAL_ACTION',
    status: 'PENDING_APPROVAL',
    timestamp: '32 phút trước',
    targetDeviceId: 'dev-01',
    targetDeviceCode: 'EDM-W01 → EDM-W04',
  },
  {
    id: 'dec-03',
    engineSource: 'QUALITY_FORECAST',
    problem: 'Nguy cơ rỗ bề mặt góc bo R0.2mm trên chi tiết phôi khuôn vỏ điện thoại vượt 65%.',
    aiFinding: 'Tần số xả xung hồ quang thứ cấp tăng bất thường khi bán kính góc bo R nhỏ hơn 0.3mm.',
    evidence: [
      'Độ dẫn điện ion tăng lên 16.8 µS/cm',
      'Tham số Corner Control đang ở chế độ OFF',
      'Độ mòn tiếp điện dẫn hướng Carbide đã dùng 112 giờ',
    ],
    risk: 'Chi tiết gia công bị loại bỏ ở khâu nghiệm thu CMM, tổn thất $2,250 tiền phôi tôi cứng.',
    recommendedAction: 'Bật tính năng Dynamic Corner Control (DCC), giảm I_PEAK từ 28A xuống 21A tại R < 0.4mm và tăng tần suất đo QC lên 50%.',
    expectedImpact: 'Hạ tỷ lệ rỗ bề mặt xuống dưới 2%, đảm bảo độ bóng gương Ra 0.4µm đạt tiêu chuẩn bàn giao.',
    confidenceScore: 89,
    humanLevel: 'LEVEL_2_RECOMMENDATION',
    status: 'APPROVED',
    humanDecisionReason: 'Đã duyệt bật DCC và yêu cầu KTV Nam giám sát trực tiếp.',
    approverName: 'Trần Minh Tuấn (Leader EQM)',
    approvedAt: '1 giờ trước',
    resultMeasurement: {
      status: 'EFFECTIVE',
      actualDowntimeSavedHours: 3.5,
      defectPreventedCount: 4,
      notes: 'Đã gia công xong 2 phôi không xuất hiện vết rỗ, độ nhám đo được Ra 0.38µm.',
      measuredAt: 'Vừa xong',
    },
    timestamp: '2 giờ trước',
    targetDeviceId: 'dev-01',
    targetDeviceCode: 'EDM-W01',
  },
];

export const AiPerformanceControlTower: React.FC<AiPerformanceControlTowerProps> = ({
  devices,
  technicians,
  stats,
  currentPlant,
  viewportMode,
  onOpenDeviceDetails,
  onOpenDiagnosis,
  onOpenWorkOrderDraft,
}) => {
  // Navigation Sub-view inside Phase 2
  const [activeSubView, setActiveSubView] = useState<
    'OVERVIEW' | 'PREDICTIVE_MAINT' | 'PRODUCTION_OPT' | 'QUALITY_FORECAST' | 'DECISIONS_LOOP'
  >('OVERVIEW');

  // Interactive Decisions State (P2-06)
  const [decisions, setDecisions] = useState<AIDecisionCard[]>(INITIAL_AI_DECISION_CARDS);
  const [selectedDecision, setSelectedDecision] = useState<AIDecisionCard | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Production Orders state (P2-04)
  const [orders, setOrders] = useState<ProductionOrder[]>(INITIAL_PRODUCTION_ORDERS);
  const [selectedScenario, setSelectedScenario] = useState<string>('B');

  // Quality Risks state (P2-05)
  const [qualityRisks, setQualityRisks] = useState<QualityRiskAssessment[]>(INITIAL_QUALITY_RISKS);

  // Data Quality Gate Status (Section 13)
  const dataQualityGate: DataQualityGateStatus = useMemo(() => {
    return {
      overallScore: 94.8,
      completenessPercent: 98.2,
      freshnessSeconds: 1.0,
      consistencyPercent: 96.5,
      anomalyDetected: false,
      isReliable: true,
      lastCheckedTime: 'Vừa xong (1.0s)',
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Compute Equipment Risk Distribution (Khu vực B)
  const equipmentRiskList: PredictiveEquipmentStatus[] = useMemo(() => {
    return devices.map((d, index) => {
      let riskLevel: EquipmentRiskLevel = 'NORMAL';
      let timelineStage: RiskTimelineStage = 'NORMAL';
      let riskScore = 15;
      let healthScore = 92;
      let healthTrend: 'IMPROVING' | 'STABLE' | 'DEGRADING_SLOW' | 'DEGRADING_FAST' = 'STABLE';
      let anomalousSensors: string[] = [];
      let predictedFailure: string | undefined = undefined;
      let inspectionHours = 48;
      let action = 'Vận hành tiêu chuẩn';
      let workOrderNeeded = false;

      if (d.status === 'ALARM_STOPPED' || index === 0) {
        riskLevel = 'CRITICAL';
        timelineStage = 'CRITICAL';
        riskScore = 88;
        healthScore = 52;
        healthTrend = 'DEGRADING_FAST';
        anomalousSensors = ['P_FLUSH (-35%)', 'VIB_SPN (+50%)'];
        predictedFailure = 'Tắc nghẽn màng lọc xối & mòn tiếp điện dẫn hướng';
        inspectionHours = 2;
        action = 'Dừng kiểm tra khẩn cấp & thay thế màng lọc 3µm';
        workOrderNeeded = true;
      } else if (index === 1) {
        riskLevel = 'HIGH';
        timelineStage = 'DEGRADING';
        riskScore = 65;
        healthScore = 74;
        healthTrend = 'DEGRADING_SLOW';
        anomalousSensors = ['T_DIELEC (+3.2°C)'];
        predictedFailure = 'Quá nhiệt giàn Chiller ALC600G';
        inspectionHours = 8;
        action = 'Vệ sinh lưới lọc giàn ngưng & đo điện trở RTD PT100';
        workOrderNeeded = true;
      } else if (index === 2) {
        riskLevel = 'MEDIUM';
        timelineStage = 'EARLY_WARNING';
        riskScore = 40;
        healthScore = 82;
        healthTrend = 'STABLE';
        anomalousSensors = ['W_TENS (13.5N)'];
        predictedFailure = 'Dao động lực căng dây ly hợp';
        inspectionHours = 24;
        action = 'Bôi trơn trục lăn Brake Roller trong kỳ bảo dưỡng';
      }

      return {
        deviceId: d.id,
        deviceCode: d.code,
        name: d.name,
        model: d.model,
        healthScore,
        riskScore,
        riskLevel,
        timelineStage,
        healthTrend,
        repeatFailureCount: index === 0 ? 3 : index === 1 ? 2 : 0,
        totalOperatingHours: 4200 + index * 650,
        lastMaintenanceHoursAgo: 248 - index * 60,
        anomalousSensors,
        predictedFailureMechanism: predictedFailure,
        predictionConfidence: index === 0 ? 94 : index === 1 ? 88 : 75,
        expectedInspectionWindowHours: inspectionHours,
        recommendedAction: action,
        workOrderDraftNeeded: workOrderNeeded,
      };
    });
  }, [devices]);

  // Handle Human in the Loop Decision (P2-06)
  const handleApproveDecision = (decision: AIDecisionCard) => {
    soundManager.playSuccessChime();
    const updated: AIDecisionCard = {
      ...decision,
      status: 'APPROVED',
      humanDecisionReason: approvalNote.trim() || 'Phê duyệt thực thi theo khuyến nghị AI sau khi xác minh bằng chứng.',
      approverName: 'Lê Đức Trọng (Giám Đốc Kỹ Thuật)',
      approvedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setDecisions((prev) => prev.map((d) => (d.id === decision.id ? updated : d)));
    setSelectedDecision(null);
    setApprovalNote('');
    showToast(`Đã KÝ DUYỆT hành động: "${decision.recommendedAction}"`);

    // If decision creates work order, invoke callback if provided
    if (decision.targetDeviceCode && onOpenWorkOrderDraft) {
      onOpenWorkOrderDraft(decision.targetDeviceCode, decision.recommendedAction);
    }
  };

  const handleRejectDecision = (decision: AIDecisionCard) => {
    soundManager.playBeep();
    const updated: AIDecisionCard = {
      ...decision,
      status: 'REJECTED',
      humanDecisionReason: approvalNote.trim() || 'Từ chối: Chưa phù hợp với tiến độ giao hàng hiện tại.',
      approverName: 'Lê Đức Trọng (Giám Đốc Kỹ Thuật)',
      approvedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setDecisions((prev) => prev.map((d) => (d.id === decision.id ? updated : d)));
    setSelectedDecision(null);
    setApprovalNote('');
    showToast(`Đã TỪ CHỐI đề xuất của AI.`);
  };

  const handleRequestMoreEvidence = (decision: AIDecisionCard) => {
    soundManager.playBeep();
    const updated: AIDecisionCard = {
      ...decision,
      status: 'REQUEST_MORE_EVIDENCE',
      humanDecisionReason: approvalNote.trim() || 'Yêu cầu Kíp Trưởng đo kiểm thêm dữ liệu dung sai tại xưởng.',
      approverName: 'Lê Đức Trọng (Giám Đốc Kỹ Thuật)',
      approvedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setDecisions((prev) => prev.map((d) => (d.id === decision.id ? updated : d)));
    setSelectedDecision(null);
    setApprovalNote('');
    showToast(`Đã gửi yêu cầu bổ sung bằng chứng tới KTV hiện trường.`);
  };

  // Feedback Learning Loop Result Recording (P2-08)
  const handleRecordResult = (
    decisionId: string,
    resultStatus: 'EFFECTIVE' | 'NOT_EFFECTIVE' | 'PARTIALLY_EFFECTIVE'
  ) => {
    soundManager.playSuccessChime();
    setDecisions((prev) =>
      prev.map((d) => {
        if (d.id === decisionId) {
          return {
            ...d,
            resultMeasurement: {
              status: resultStatus,
              actualDowntimeSavedHours: resultStatus === 'EFFECTIVE' ? 4.5 : 1.0,
              defectPreventedCount: resultStatus === 'EFFECTIVE' ? 6 : 0,
              notes: `Đã xác nhận kết quả nghiệm thu thực tế: ${resultStatus}`,
              measuredAt: 'Vừa xong',
            },
          };
        }
        return d;
      })
    );
    showToast('Đã ghi nhận kết quả thực tế vào vòng lặp học tập AI Learning Loop (P2-08)!');
  };

  // 5 Production Scenarios (P2-04)
  const scenarios: ProductionScenario[] = [
    {
      id: 'A',
      type: 'A_CURRENT',
      name: 'Kịch Bản A: Giữ Nguyên Kế Hoạch Hiện Tại',
      description: 'Tiếp tục gia công đơn PO-EDM-9021 trên máy Makino U6 với tốc độ đã giảm 25%.',
      expectedThroughputPcs: 8,
      estimatedCompletionHours: 42.5,
      downtimeRiskPercent: 68,
      qualityRiskPercent: 45,
      onTimeDeliveryRate: 72.0,
      resourceRequirements: '1 KTV vận hành, không cần chuyển đồ gá',
      pros: ['Không tốn thời gian gá đặt lại phôi', 'Quy trình đã quen thuộc'],
      cons: ['Nguy cơ trễ hạn giao hàng 4.5 giờ', 'Rủi ro đứt dây hỏng khuôn $4,500'],
      isRecommended: false,
    },
    {
      id: 'B',
      type: 'B_REORDER_PRIORITY',
      name: 'Kịch Bản B (Khuyến Nghị): Chia Tải Song Song Sang Máy Fanuc C600iB',
      description: 'Chuyển 2 phôi sang máy Fanuc EDM-W04 đang dư công suất để chạy song song.',
      expectedThroughputPcs: 14,
      estimatedCompletionHours: 26.0,
      downtimeRiskPercent: 12,
      qualityRiskPercent: 15,
      onTimeDeliveryRate: 98.5,
      resourceRequirements: 'Sử dụng đồ gá Erowa ITS 50 có sẵn, 2 KTV phối hợp',
      pros: ['Rút ngắn 16.5 giờ gia công', 'Bảo đảm 100% giao hàng đúng hạn', 'Giảm tải cho máy đang suy yếu'],
      cons: ['Mất 45 phút căn chỉnh set-up gốc tọa độ trên máy mới'],
      isRecommended: true,
    },
    {
      id: 'C',
      type: 'C_REROUTE_MACHINE',
      name: 'Kịch Bản C: Chuyển Toàn Bộ Sang Máy Bắn Điện Xung EDM-S01',
      description: 'Chuyển đổi công nghệ từ cắt dây sang bắn điện xung CNC.',
      expectedThroughputPcs: 6,
      estimatedCompletionHours: 54.0,
      downtimeRiskPercent: 20,
      qualityRiskPercent: 10,
      onTimeDeliveryRate: 65.0,
      resourceRequirements: 'Cần gia công thêm điện cực đồng Graphit trước khi bắn',
      pros: ['Độ bóng bề mặt cực cao Ra 0.2µm'],
      cons: ['Thời gian chuẩn bị điện cực lâu, phát sinh chi phí phôi đồng'],
      isRecommended: false,
    },
    {
      id: 'D',
      type: 'D_MAINTAIN_FIRST',
      name: 'Kịch Bản D: Dừng Máy Bảo Trì Thay Lõi Lọc 45 Phút Trước Khi Chạy Tiếp',
      description: 'Dừng máy Makino U6 ngay lập tức 45 phút để thay màng lọc 3µm, sau đó chạy lại 100% công suất.',
      expectedThroughputPcs: 12,
      estimatedCompletionHours: 32.0,
      downtimeRiskPercent: 5,
      qualityRiskPercent: 8,
      onTimeDeliveryRate: 94.0,
      resourceRequirements: '1 Lõi lọc 3µm FLT-EDM-300 từ kho vật tư, 1 KTV bảo trì',
      pros: ['Triệt tiêu triệt để nguy cơ hỏng máy', 'Máy khôi phục 100% tốc độ thiết kế'],
      cons: ['Dừng sản xuất 45 phút ngay tại thời điểm hiện tại'],
      isRecommended: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-2xl shadow-emerald-950/80 animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header: AI Performance Control Tower (P2-01) */}
      <div className="rounded-3xl border border-indigo-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-400/40 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              <span>Giai Đoạn 2: Nâng Cao Hiệu Suất Thiết Bị & Sản Xuất (P2-01 → P2-09)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <span>AI Performance Control Tower</span>
              <span className="rounded-md bg-purple-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-purple-300 border border-purple-500/30">
                4-Engine Interconnected Suite
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Trung tâm chỉ huy kết nối thời gian thực giữa <strong>Bảo dưỡng dự đoán (Engine A)</strong>,{' '}
              <strong>Phân tích nguyên nhân gốc (Engine B)</strong>, <strong>Tối ưu hóa sản xuất (Engine C)</strong> và{' '}
              <strong>Dự báo chất lượng (Engine D)</strong>. Cơ chế Human-in-the-Loop và vòng lặp học tập liên tục.
            </p>
          </div>

          {/* Data Quality Gate Status Strip (Section 13) */}
          <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-3.5 space-y-2 min-w-[280px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Database className="h-4 w-4 text-emerald-400" />
                <span>Data Quality Gate</span>
              </div>
              <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-mono font-bold">
                {dataQualityGate.overallScore}% Đạt Chuẩn
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <div>
                <span>Độ Đầy Đủ:</span>
                <div className="font-mono font-bold text-white">{dataQualityGate.completenessPercent}%</div>
              </div>
              <div>
                <span>Độ Tươi:</span>
                <div className="font-mono font-bold text-cyan-300">{dataQualityGate.freshnessSeconds}s</div>
              </div>
              <div>
                <span>Tính Nhất Quán:</span>
                <div className="font-mono font-bold text-indigo-300">{dataQualityGate.consistencyPercent}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs across 4 Engines */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pt-3 border-t border-slate-800/80 scrollbar-none">
          {[
            { id: 'OVERVIEW', label: '1. Toàn Cảnh Control Tower (P2-01)', icon: Gauge },
            { id: 'PREDICTIVE_MAINT', label: '2. Bảo Dưỡng Dự Đoán (Engine A / P2-02)', icon: Activity },
            { id: 'PRODUCTION_OPT', label: '3. Tối Ưu Sản Xuất (Engine C / P2-04)', icon: Layers },
            { id: 'QUALITY_FORECAST', label: '4. Dự Báo Chất Lượng (Engine D / P2-05)', icon: ShieldCheck },
            { id: 'DECISIONS_LOOP', label: '5. AI Decision Board & Learning Loop (P2-06 & P2-08)', icon: Brain },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundManager.playBeep();
                  setActiveSubView(tab.id as any);
                }}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 ring-1 ring-indigo-400/50'
                    : 'bg-slate-900/90 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: OVERVIEW CONTROL TOWER (P2-01) - 5 KHU VỰC A, B, C, D, E      */}
      {/* ========================================================================= */}
      {activeSubView === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* KHU VỰC A — 10 KPI CHÍNH XÁC CÓ NGUỒN DỮ LIỆU & BASELINE (Section 3) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-400" />
                <span>Khu Vực A — 10 Chỉ Số Hiệu Suất Thiết Bị & Sản Xuất (KPI Suite)</span>
              </h2>
              <span className="text-[11px] text-slate-400">
                Nguồn: IoT Telemetry (1Hz) • ERP/MES • QA Inspection • Maintenance DB
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* KPI 1: Availability */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">1. Availability (Khả Dụng)</div>
                <div className="text-2xl font-black font-mono text-emerald-400">94.2%</div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-emerald-400 font-bold">▲ +2.2% vs kỳ trước</span>
                  <span>Mục tiêu: 95.0%</span>
                </div>
              </div>

              {/* KPI 2: Performance */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">2. Performance (Hiệu Suất)</div>
                <div className="text-2xl font-black font-mono text-cyan-400">89.4%</div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-cyan-400 font-bold">▲ +1.9% vs kỳ trước</span>
                  <span>Mục tiêu: 90.0%</span>
                </div>
              </div>

              {/* KPI 3: Quality */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">3. Quality (Chất Lượng)</div>
                <div className="text-2xl font-black font-mono text-purple-400">98.7%</div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-purple-400 font-bold">▲ +0.6% vs kỳ trước</span>
                  <span>Mục tiêu: 99.0%</span>
                </div>
              </div>

              {/* KPI 4: OEE */}
              <div className="rounded-2xl border border-indigo-500/40 bg-indigo-950/20 p-3.5 space-y-1">
                <div className="text-[11px] font-semibold text-indigo-300">4. OEE Toàn Xưởng</div>
                <div className="text-2xl font-black font-mono text-amber-300">83.1%</div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-indigo-900/40">
                  <span className="text-amber-400 font-bold">▲ +3.9% vs kỳ trước</span>
                  <span>Chuẩn World-Class: 85%</span>
                </div>
              </div>

              {/* KPI 5: Downtime */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">5. Downtime Ngoài Kế Hoạch</div>
                <div className="text-2xl font-black font-mono text-red-400">14.8 <span className="text-xs font-normal">giờ</span></div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-emerald-400 font-bold">▼ -34% vs kỳ trước</span>
                  <span>Mục tiêu: &lt; 12h</span>
                </div>
              </div>

              {/* KPI 6: MTBF */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">6. MTBF (Thời Gian Giữa 2 Lỗi)</div>
                <div className="text-2xl font-black font-mono text-white">142.5 <span className="text-xs font-normal">giờ</span></div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-emerald-400 font-bold">▲ +24.5h vs baseline</span>
                  <span>Mục tiêu: &gt; 150h</span>
                </div>
              </div>

              {/* KPI 7: MTTR */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">7. MTTR (Thời Gian Sửa Máy)</div>
                <div className="text-2xl font-black font-mono text-emerald-400">32.4 <span className="text-xs font-normal">phút</span></div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-emerald-400 font-bold">▼ -15.6p vs kỳ trước</span>
                  <span>Mục tiêu: &lt; 30p</span>
                </div>
              </div>

              {/* KPI 8: Defect Rate */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">8. Tỷ Lệ Lỗi Phôi Khuôn</div>
                <div className="text-2xl font-black font-mono text-amber-400">1.3%</div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-emerald-400 font-bold">▼ -0.6% vs kỳ trước</span>
                  <span>Mục tiêu: &lt; 1.0%</span>
                </div>
              </div>

              {/* KPI 9: Schedule Adherence */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">9. Kế Hoạch Hoàn Thành</div>
                <div className="text-2xl font-black font-mono text-white">96.2%</div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-emerald-400 font-bold">▲ +5.2% vs kỳ trước</span>
                  <span>Mục tiêu: 98.0%</span>
                </div>
              </div>

              {/* KPI 10: On-Time Delivery */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3.5 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">10. Giao Hàng Đúng Hạn (OTD)</div>
                <div className="text-2xl font-black font-mono text-emerald-400">98.5%</div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-emerald-400 font-bold">▲ +3.5% vs kỳ trước</span>
                  <span>Mục tiêu: 99.0%</span>
                </div>
              </div>
            </div>
          </div>

          {/* GRID 3 CỘT: KHU VỰC B (EQUIPMENT RISK), C (PRODUCTION RISK), D (QUALITY RISK) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KHU VỰC B — EQUIPMENT RISK (BẢO DƯỠNG DỰ ĐOÁN) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-red-400" />
                  <span>Khu Vực B — Equipment Risk (Thiết Bị)</span>
                </h3>
                <span className="text-[10px] font-mono font-bold text-red-400 bg-red-950/60 px-1.5 py-0.2 rounded border border-red-800/60">
                  1 Nguy Cơ Cao
                </span>
              </div>

              <div className="space-y-2.5">
                {equipmentRiskList.slice(0, 3).map((item) => (
                  <div
                    key={item.deviceId}
                    className={`rounded-xl border p-3 text-xs space-y-2 transition ${
                      item.riskLevel === 'CRITICAL'
                        ? 'border-red-500/50 bg-red-950/20'
                        : item.riskLevel === 'HIGH'
                        ? 'border-amber-500/40 bg-amber-950/20'
                        : 'border-slate-800 bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{item.deviceCode} - {item.model}</span>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        item.riskLevel === 'CRITICAL' ? 'bg-red-500 text-white' :
                        item.riskLevel === 'HIGH' ? 'bg-amber-500 text-black' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {item.riskLevel} (Rủi ro {item.riskScore}%)
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300">
                      <strong>Dấu hiệu:</strong> {item.predictedFailureMechanism || 'Vận hành ổn định'}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Cảm biến: {item.anomalousSensors.join(', ') || 'Bình thường'}</span>
                      <span className="text-amber-400">Kiểm tra trong: {item.expectedInspectionWindowHours}h</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveSubView('PREDICTIVE_MAINT')}
                className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-bold py-1.5 flex items-center justify-center gap-1"
              >
                <span>Xem chi tiết Predictive Maintenance Center (P2-02)</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* KHU VỰC C — PRODUCTION RISK (TỐI ƯU SẢN XUẤT) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-amber-400" />
                  <span>Khu Vực C — Production Risk (Sản Xuất)</span>
                </h3>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/60">
                  2 Lệnh Có Nguy Cơ
                </span>
              </div>

              <div className="space-y-2.5">
                {orders.slice(0, 2).map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{order.orderCode}</span>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        order.status === 'DELAY_RISK' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {order.status === 'DELAY_RISK' ? 'Nguy Cơ Trễ 4.5h' : 'Nút Thắt Cổ Chai'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 font-medium line-clamp-1">
                      {order.partName}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Gia công trên: <strong className="text-white">{order.targetDeviceCode}</strong></span>
                      <span className="text-amber-400 font-mono font-bold">${order.unitValueUSD * order.batchQuantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveSubView('PRODUCTION_OPT')}
                className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-bold py-1.5 flex items-center justify-center gap-1"
              >
                <span>Mở Production Optimizer & 5 Scenarios (P2-04)</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* KHU VỰC D — QUALITY RISK (DỰ BÁO CHẤT LƯỢNG) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  <span>Khu Vực D — Quality Risk (Chất Lượng)</span>
                </h3>
                <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-800/60">
                  Rỗ Bề Mặt R0.2mm
                </span>
              </div>

              <div className="space-y-2.5">
                {qualityRisks.map((qr) => (
                  <div
                    key={qr.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{qr.deviceCode} • {qr.productModel}</span>
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-red-500/20 text-red-300 border border-red-500/30">
                        Rủi ro {qr.defectRiskPercent}%
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 line-clamp-2">
                      <strong>Loại lỗi:</strong> {qr.evidenceSummary}
                    </div>

                    <div className="text-[10px] text-purple-300 font-medium">
                      💡 {qr.samplingRecommendation}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveSubView('QUALITY_FORECAST')}
                className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-bold py-1.5 flex items-center justify-center gap-1"
              >
                <span>Xem Quality Forecast Center (P2-05)</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* KHU VỰC E — AI RECOMMENDATIONS & DECISION CARDS (P2-06) */}
          <div className="rounded-3xl border border-indigo-500/40 bg-slate-900 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-indigo-400" />
                  <span>Khu Vực E — AI Decision Board & Khuyến Nghị Tối Ưu (P2-06)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cơ chế Human-in-the-Loop: AI phát hiện bằng chứng & rủi ro, Quản đốc / Leader thẩm định và ra quyết định
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubView('DECISIONS_LOOP')}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-indigo-300 border border-slate-700 transition"
              >
                Mở Vòng Lặp Học Tập (Learning Loop P2-08)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {decisions.map((dec) => (
                <div
                  key={dec.id}
                  className={`rounded-2xl border p-4 space-y-3 transition ${
                    dec.status === 'APPROVED'
                      ? 'border-emerald-500/40 bg-emerald-950/20'
                      : dec.status === 'REJECTED'
                      ? 'border-red-500/40 bg-red-950/20'
                      : 'border-slate-800 bg-slate-950 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                      {dec.engineSource}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      Tin cậy: {dec.confidenceScore}%
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2">
                    {dec.problem}
                  </h4>

                  <p className="text-xs text-slate-300 line-clamp-2">
                    <strong>Khuyến nghị:</strong> {dec.recommendedAction}
                  </p>

                  <div className="rounded-xl bg-slate-900 p-2.5 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400">Bằng chứng AI:</div>
                    <div className="line-clamp-2 italic text-slate-300">&quot;{dec.evidence[0]}&quot;</div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    {dec.status === 'PENDING_APPROVAL' ? (
                      <button
                        type="button"
                        onClick={() => setSelectedDecision(dec)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2 shadow-md transition"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Thẩm Định & Ký Quyết Định</span>
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between font-mono text-[11px]">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{dec.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedDecision(dec)}
                          className="text-indigo-400 underline"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: PREDICTIVE MAINTENANCE CENTER (P2-02 - ENGINE A)              */}
      {/* ========================================================================= */}
      {activeSubView === 'PREDICTIVE_MAINT' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-red-400" />
                  <span>P2-02 — Trung Tâm Bảo Dưỡng Dự Đoán (Predictive Maintenance Center)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Chuyển dịch từ &quot;Máy hỏng → Gọi sửa&quot; sang &quot;Phát hiện bất thường sớm → Đánh giá rủi ro → Chủ động bảo trì&quot;.
                </p>
              </div>
            </div>

            {/* Risk Timeline Indicator */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="text-xs font-bold text-slate-300">Chuỗi Tiến Triển Rủi Ro Thiết Bị (Risk Timeline):</div>
              <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold">
                <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 py-2">
                  1. NORMAL<div className="text-[10px] font-normal text-slate-400">Sức khỏe &gt; 90%</div>
                </div>
                <div className="rounded-lg bg-blue-950/40 border border-blue-500/40 text-blue-300 py-2">
                  2. EARLY WARNING<div className="text-[10px] font-normal text-slate-400">Rung động chớm tăng</div>
                </div>
                <div className="rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 py-2">
                  3. DEGRADING<div className="text-[10px] font-normal text-slate-400">Tụt áp & nhiệt trôi</div>
                </div>
                <div className="rounded-lg bg-orange-950/40 border border-orange-500/40 text-orange-300 py-2">
                  4. HIGH RISK<div className="text-[10px] font-normal text-slate-400">Đứt dây vi mô</div>
                </div>
                <div className="rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 py-2 animate-pulse">
                  5. CRITICAL<div className="text-[10px] font-normal text-slate-400">Dừng khẩn cấp</div>
                </div>
              </div>
            </div>

            {/* Devices Detailed Risk Table */}
            <div className="space-y-3">
              {equipmentRiskList.map((eq) => (
                <div
                  key={eq.deviceId}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white ${
                        eq.riskLevel === 'CRITICAL' ? 'bg-red-600' :
                        eq.riskLevel === 'HIGH' ? 'bg-amber-600' :
                        eq.riskLevel === 'MEDIUM' ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}>
                        {eq.riskScore}%
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{eq.deviceCode} — {eq.name} ({eq.model})</span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                            eq.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {eq.timelineStage}
                          </span>
                        </h4>
                        <div className="text-[11px] text-slate-400">
                          Đã chạy: {eq.totalOperatingHours}h • Lần bảo trì gần nhất: {eq.lastMaintenanceHoursAgo}h trước • Lỗi lặp lại: {eq.repeatFailureCount} lần
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const matched = devices.find((d) => d.id === eq.deviceId);
                          if (matched) onOpenDiagnosis(matched);
                        }}
                        className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white transition"
                      >
                        Mở AI Diagnosis
                      </button>

                      {eq.workOrderDraftNeeded && onOpenWorkOrderDraft && (
                        <button
                          type="button"
                          onClick={() => onOpenWorkOrderDraft(eq.deviceCode, eq.recommendedAction)}
                          className="rounded-xl bg-red-600 hover:bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition flex items-center gap-1 shadow-md shadow-red-950/40"
                        >
                          <Wrench className="h-3.5 w-3.5" />
                          <span>Tạo Work Order</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-900 rounded-xl p-3 border border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Dự Đoán Cơ Chế Hư Hỏng (Prediction vs Failure):</span>
                      <span className="text-slate-200 font-medium">
                        {eq.predictedFailureMechanism || 'Không phát hiện bất thường nghiêm trọng'}
                      </span>
                      <div className="text-[10px] text-indigo-400 mt-1 font-mono">
                        Độ tin cậy mô hình: {eq.predictionConfidence}% (Căn cứ FFT cảm biến rung động)
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Hành Động Đề Xuất:</span>
                      <span className="text-amber-300 font-semibold">{eq.recommendedAction}</span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Cần kiểm tra trong vòng: <strong className="text-white">{eq.expectedInspectionWindowHours} giờ tới</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: PRODUCTION OPTIMIZER (P2-04 - ENGINE C)                       */}
      {/* ========================================================================= */}
      {activeSubView === 'PRODUCTION_OPT' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-amber-400" />
                  <span>P2-04 — Tối Ưu Kế Hoạch Sản Xuất & Điều Phối Máy (Production Optimizer)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Cân bằng năng lực thiết bị thực tế, hạn giao hàng, bottleneck và rủi ro chất lượng để đề xuất kịch bản tối ưu.
                </p>
              </div>
            </div>

            {/* Backlog Orders Overview */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Danh Sách Đơn Hàng & Lệnh Sản Xuất Đang Chạy (Production Orders):
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {orders.map((ord) => (
                  <div key={ord.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-mono">{ord.orderCode} • {ord.clientName}</span>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        ord.status === 'DELAY_RISK' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        ord.status === 'BOTTLENECK' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {ord.status}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-white">{ord.partName}</div>
                    <div className="text-[11px] text-slate-400">
                      Vật liệu: <strong className="text-slate-200">{ord.material}</strong> • Dung sai: <strong className="text-cyan-400 font-mono">±{ord.toleranceMm}mm</strong> • Tiến độ: <strong className="text-white">{ord.completedHours}/{ord.requiredHours}h ({Math.round(ord.completedHours / ord.requiredHours * 100)}%)</strong>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span>Máy gán: <strong>{ord.targetDeviceCode}</strong></span>
                      <span className="text-amber-400 font-bold">Hạn giao: {ord.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Scenarios Simulator (P2-04) */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  <span>Mô Phỏng 4 Kịch Bản Điều Phối Của AI (AI Scenarios Comparison):</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenarios.map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => {
                      soundManager.playBeep();
                      setSelectedScenario(sc.id);
                    }}
                    className={`rounded-2xl border p-4 space-y-3 transition cursor-pointer ${
                      selectedScenario === sc.id
                        ? 'border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/40'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{sc.name}</span>
                        {sc.isRecommended && (
                          <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 text-[10px] font-bold">
                            KHUYẾN NGHỊ
                          </span>
                        )}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{sc.description}</p>

                    <div className="grid grid-cols-3 gap-2 text-center bg-slate-900 rounded-xl p-2 border border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Thời Gian</span>
                        <span className="font-mono font-bold text-white">{sc.estimatedCompletionHours}h</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Rủi Ro Dừng</span>
                        <span className="font-mono font-bold text-amber-400">{sc.downtimeRiskPercent}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Giao Đúng Hạn</span>
                        <span className="font-mono font-bold text-emerald-400">{sc.onTimeDeliveryRate}%</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="text-emerald-400">✓ {sc.pros.join('; ')}</div>
                      <div className="text-slate-400">✗ {sc.cons.join('; ')}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playSuccessChime();
                          showToast(`Đã áp dụng ${sc.name} vào kế hoạch xưởng!`);
                        }}
                        className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition ${
                          sc.isRecommended ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-800 hover:bg-slate-700'
                        }`}
                      >
                        Áp Dụng Kịch Bản Này
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: QUALITY FORECAST CENTER (P2-05 - ENGINE D)                    */}
      {/* ========================================================================= */}
      {activeSubView === 'QUALITY_FORECAST' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-purple-400" />
                  <span>P2-05 — Trung Tâm Dự Báo Lỗi Chất Lượng (Quality Forecast Center)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Ma trận liên kết: Tình trạng thiết bị + Thông số vận hành + Lịch sử lỗi + Vật liệu = Nguy cơ lỗi chất lượng trước khi cắt.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {qualityRisks.map((qr) => (
                <div key={qr.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{qr.deviceCode} • {qr.productModel}</span>
                    <span className="rounded-full bg-red-500/20 text-red-300 border border-red-500/40 px-2.5 py-0.5 text-xs font-mono font-bold">
                      {qr.riskLevel} (Nguy cơ {qr.defectRiskPercent}%)
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-900 p-3 border border-slate-800 text-xs text-slate-200 space-y-1">
                    <div className="font-bold text-amber-400">Phát Hiện Dấu Hiệu Lỗi:</div>
                    <p className="leading-relaxed">{qr.evidenceSummary}</p>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="font-semibold text-slate-300">Thông Số Tương Quan (Correlated Parameters):</div>
                    {qr.correlatedParameters.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2 text-[11px]">
                        <span className="text-slate-400">{p.paramName}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-red-400 font-bold">{p.currentValue}</span>
                          <span className="text-slate-500 font-mono">(Chuẩn: {p.nominalRange})</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-purple-950/20 border border-purple-500/30 p-3 text-xs space-y-1">
                    <div className="font-bold text-purple-300">Khuyến Nghị Hành Động QC:</div>
                    <p className="text-slate-200">{qr.recommendedQcAction}</p>
                    <div className="text-[11px] text-amber-300 pt-1 font-semibold">
                      📋 {qr.samplingRecommendation}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playSuccessChime();
                        showToast(`Đã phát lệnh tăng tần suất kiểm tra QC tới kíp trực!`);
                      }}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold shadow-md transition"
                    >
                      Phát Lệnh Tăng Tần Suất QC
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 5: DECISIONS BOARD & LEARNING LOOP (P2-06 & P2-08)               */}
      {/* ========================================================================= */}
      {activeSubView === 'DECISIONS_LOOP' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-indigo-400" />
                  <span>P2-06 & P2-08 — AI Decision Board & Vòng Lặp Học Tập (Learning Loop)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Chuỗi 8 bước khép kín: Problem → Evidence → Risk → Recommendation → Impact → Human Approval → Result → AI Learning.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {decisions.map((dec) => (
                <div
                  key={dec.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 text-xs font-mono font-bold">
                        {dec.engineSource}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">ID: {dec.id}</span>
                      <span className="text-xs text-slate-400">• {dec.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded bg-purple-500/20 text-purple-300 px-2 py-0.5 text-xs font-mono font-bold">
                        {dec.humanLevel}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                        dec.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        dec.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {dec.status}
                      </span>
                    </div>
                  </div>

                  {/* Problem & Finding */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">{dec.problem}</h3>
                    <p className="text-xs text-slate-300 italic">{dec.aiFinding}</p>
                  </div>

                  {/* Evidence list */}
                  <div className="rounded-xl bg-slate-900 p-3 border border-slate-800 text-xs space-y-1">
                    <div className="font-bold text-indigo-300">Bằng Chứng Dữ Liệu (Evidence):</div>
                    <ul className="list-disc list-inside text-slate-300 space-y-0.5 pl-1">
                      {dec.evidence.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendation & Expected Impact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-900 rounded-xl p-3 border border-slate-800">
                    <div>
                      <span className="font-bold text-emerald-400 block mb-0.5">Khuyến Nghị Hành Động:</span>
                      <span className="text-slate-200">{dec.recommendedAction}</span>
                    </div>
                    <div>
                      <span className="font-bold text-cyan-400 block mb-0.5">Tác Động Dự Kiến:</span>
                      <span className="text-slate-200">{dec.expectedImpact}</span>
                    </div>
                  </div>

                  {/* Human Decision Audit Trail */}
                  {dec.approverName && (
                    <div className="text-[11px] text-slate-400 bg-slate-900/60 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
                      <span>Người quyết định: <strong className="text-white">{dec.approverName}</strong> ({dec.approvedAt})</span>
                      <span>Lý do: &quot;{dec.humanDecisionReason}&quot;</span>
                    </div>
                  )}

                  {/* P2-08 Learning Loop Feedback Strip */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    {dec.resultMeasurement ? (
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Đã đo lường kết quả thực tế: {dec.resultMeasurement.status}</span>
                        </span>
                        {dec.resultMeasurement.actualDowntimeSavedHours && (
                          <span className="text-cyan-300">
                            (Tiết kiệm {dec.resultMeasurement.actualDowntimeSavedHours}h downtime)
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Đo lường sau thực thi (Learning Loop):</span>
                        <button
                          type="button"
                          onClick={() => handleRecordResult(dec.id, 'EFFECTIVE')}
                          className="rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 text-[11px] font-bold transition"
                        >
                          ✓ Có Hiệu Quả
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRecordResult(dec.id, 'PARTIALLY_EFFECTIVE')}
                          className="rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 px-2.5 py-1 text-[11px] font-bold transition"
                        >
                          Một Phần
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRecordResult(dec.id, 'NOT_EFFECTIVE')}
                          className="rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-300 px-2.5 py-1 text-[11px] font-bold transition"
                        >
                          Không Hiệu Quả
                        </button>
                      </div>
                    )}

                    {dec.status === 'PENDING_APPROVAL' && (
                      <button
                        type="button"
                        onClick={() => setSelectedDecision(dec)}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-bold text-white transition shadow-md"
                      >
                        Ký Duyệt Ngay
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HUMAN IN THE LOOP APPROVAL DIALOG (P2-06)                          */}
      {/* ========================================================================= */}
      {selectedDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Thẩm Định Quyết Định Cấp Quản Đốc (P2-06)</h3>
                  <div className="text-[11px] text-slate-400 font-mono">Cấp độ thẩm quyền: {selectedDecision.humanLevel}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDecision(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm">{selectedDecision.problem}</div>
                <p className="text-slate-300">{selectedDecision.aiFinding}</p>
                <div className="text-amber-400 font-semibold pt-1">
                  Rủi ro nếu không duyệt: {selectedDecision.risk}
                </div>
              </div>

              <div className="rounded-2xl bg-indigo-950/20 border border-indigo-500/30 p-4 space-y-1.5">
                <div className="font-bold text-indigo-300 uppercase">Khuyến Nghị & Bằng Chứng AI:</div>
                <div className="text-white font-medium">{selectedDecision.recommendedAction}</div>
                <div className="text-slate-300">Tác động: {selectedDecision.expectedImpact}</div>
                <div className="pt-1 text-[11px] text-slate-400">
                  Độ tin cậy: <strong className="text-white">{selectedDecision.confidenceScore}%</strong>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-200">Ghi chú phê duyệt / chỉ đạo kỹ thuật:</label>
                <textarea
                  rows={2}
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Nhập lý do phê duyệt hoặc yêu cầu bổ sung bằng chứng..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedDecision(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRequestMoreEvidence(selectedDecision)}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-amber-300 border border-amber-500/40 transition"
                >
                  Yêu Cầu Thêm Bằng Chứng
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectDecision(selectedDecision)}
                  className="rounded-xl bg-red-950/50 hover:bg-red-900 border border-red-500/40 px-3.5 py-2 text-xs font-bold text-red-300 transition"
                >
                  Từ Chối
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveDecision(selectedDecision)}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition"
                >
                  <Check className="h-4 w-4" />
                  <span>Ký Duyệt Quyết Định</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
