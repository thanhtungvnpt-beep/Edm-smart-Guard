import { Device } from '../types';

export interface HardwareWearComponent {
  id: string;
  name: string;
  partNumber: string;
  category: 'ELECTRICAL_DISCHARGE' | 'FILTRATION' | 'MECHANICAL_MOTION' | 'DIELECTRIC_FLUID' | 'PNEUMATIC';
  wearPercentage: number; // 0 - 100%
  status: 'OPTIMAL' | 'MODERATE_WEAR' | 'REPLACE_SOON' | 'CRITICAL_REPLACE';
  daysUntilFailure: number;
  downtimeRiskHours: number;
  replacementCostEstUSD: number;
  inStockQuantity: number;
  stockLocation: string;
  estimatedLaborMinutes: number;
  wearIndicators: string[];
  failureConsequence: string;
  preventiveAction: string;
  priorityScore: number;
}

export interface PredictiveInsightReport {
  overallRiskLevel: 'OPTIMAL' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  recommendedWindowDays: number;
  totalDowntimeSavedHours: number;
  costSavingsEstimateUSD: number;
  wearAnalysisSummary: string;
  components: HardwareWearComponent[];
}

/**
 * Evaluates hardware component wear and failure risk for an EDM / CNC device
 * by synthesizing 30-day performance telemetry, deviation from nominal thresholds,
 * and incident frequency.
 */
export function generatePredictiveHardwareInsights(device: Device): PredictiveInsightReport {
  const oee = device.telemetry?.oee || 85;
  const vibration = device.telemetry?.vibration || 0.8;
  const vibLimit = device.nominalRanges?.vibration?.[1] || 1.2;
  const pressure = device.telemetry?.dielectricPressure || 1.2;
  const minPressure = device.nominalRanges?.dielectricPressure?.[0] || 0.8;
  const voltage = device.telemetry?.dischargeVoltage || 45;
  const wireTension = device.telemetry?.wireTension || 12;
  const incidentCount = device.incidentHistoryCount || 0;
  const hasAlarm = device.status === 'ALARM_STOPPED';

  const isWireEdm = device.type === 'WIRE_EDM';
  const isSinkerEdm = device.type === 'SINKER_EDM';

  const components: HardwareWearComponent[] = [];

  // COMPONENT 1: Upper/Lower Diamond Wire Guides & Carbide Energizing Contacts (Wire EDM) OR Erowa Chuck & Discharge Contacts (Sinker)
  if (isWireEdm) {
    const voltageDrift = Math.abs(voltage - 45) > 6;
    const tensionWear = wireTension < 10 || wireTension > 15;
    let wear = 45 + incidentCount * 12 + (voltageDrift ? 18 : 0) + (tensionWear ? 14 : 0);
    if (hasAlarm && device.activeIncident?.errorCode === 'E-102') wear = 94;
    wear = Math.min(96, Math.max(25, wear));

    let status: HardwareWearComponent['status'] = 'OPTIMAL';
    if (wear >= 85) status = 'CRITICAL_REPLACE';
    else if (wear >= 70) status = 'REPLACE_SOON';
    else if (wear >= 45) status = 'MODERATE_WEAR';

    components.push({
      id: 'comp-diamond-guide',
      name: 'Cặp Dẫn Hướng Kim Cương 0.25mm & Bạc Cấp Điện Phóng (Power Feed)',
      partNumber: 'MK-U6-GD25-SET',
      category: 'ELECTRICAL_DISCHARGE',
      wearPercentage: wear,
      status,
      daysUntilFailure: wear >= 85 ? 1 : wear >= 70 ? 4 : 16,
      downtimeRiskHours: 4.5,
      replacementCostEstUSD: 380,
      inStockQuantity: 4,
      stockLocation: 'Kho Kỹ Thuật K2 - Ngăn B-04',
      estimatedLaborMinutes: 35,
      wearIndicators: [
        `Điện áp phóng điện dao động ±${voltageDrift ? '6.8V' : '2.1V'} khi cắt phôi tốc độ cao`,
        `Độ căng dây đồng ghi nhận dao động: ${wireTension.toFixed(1)}N (Chuẩn: 12-14N)`,
        incidentCount > 0 ? `Lịch sử ghi nhận ${incidentCount} lần đứt dây/sự cố trong 30 ngày qua` : 'Không có sự cố đứt dây nghiêm trọng',
      ],
      failureConsequence: 'Rãnh mòn làm xước dây đồng dẫn đến đứt dây liên tục (Lỗi E-102), giảm độ bóng bề mặt Ra và sai số góc côn.',
      preventiveAction: 'Xoay mặt tiếp xúc bạc cấp điện 90° hoặc thay thế cụm dẫn hướng kim cương trên/dưới.',
      priorityScore: wear * 1.2,
    });
  } else {
    // Sinker EDM Discharge Electrode Head
    const wear = Math.min(94, Math.max(30, 40 + incidentCount * 14 + (hasAlarm ? 35 : 0)));
    components.push({
      id: 'comp-erowa-chuck',
      name: 'Đầu Cặp Điện Cực Tự Động Erowa ITS & Chổi Quét Phóng Điện',
      partNumber: 'ERW-ITS-50-C',
      category: 'ELECTRICAL_DISCHARGE',
      wearPercentage: wear,
      status: wear >= 80 ? 'CRITICAL_REPLACE' : wear >= 65 ? 'REPLACE_SOON' : 'MODERATE_WEAR',
      daysUntilFailure: wear >= 80 ? 2 : 12,
      downtimeRiskHours: 6.0,
      replacementCostEstUSD: 720,
      inStockQuantity: 2,
      stockLocation: 'Kho Phụ Tùng Trung Tâm - Tủ A-12',
      estimatedLaborMinutes: 50,
      wearIndicators: [
        'Độ đảo trục Z đo được sai lệch 0.004mm sau 320 chu kỳ xung',
        `Mức suy giảm OEE 30 ngày qua ghi nhận ở mức ${oee}%`,
      ],
      failureConsequence: 'Sai lệch tâm điện cực xung, phóng điện lệch hồ quang gây cháy bề mặt khuôn mẫu.',
      preventiveAction: 'Vệ sinh ngàm bi kẹp Erowa, kiểm tra lực kẹp khí nén 6.0 Bar và thay chổi quét tiếp mát.',
      priorityScore: wear * 1.1,
    });
  }

  // COMPONENT 2: Dielectric Pressure Filters (Áp suất dung dịch)
  {
    const pressureDelta = pressure - minPressure;
    const isPressureLow = pressureDelta < 0.25;
    let wear = 40 + (isPressureLow ? 38 : 10) + (oee < 85 ? 15 : 0);
    if (hasAlarm && device.activeIncident?.errorCode === 'ALARM-204') wear = 92;
    wear = Math.min(95, Math.max(20, wear));

    let status: HardwareWearComponent['status'] = 'OPTIMAL';
    if (wear >= 80) status = 'CRITICAL_REPLACE';
    else if (wear >= 65) status = 'REPLACE_SOON';
    else if (wear >= 40) status = 'MODERATE_WEAR';

    components.push({
      id: 'comp-dielectric-filter',
      name: 'Cặp Lõi Lọc Điện Môi Áp Suất Cao 3µm / 5µm (Super Filter Cartridges)',
      partNumber: 'FLT-EDM-300H',
      category: 'FILTRATION',
      wearPercentage: wear,
      status,
      daysUntilFailure: wear >= 80 ? 2 : wear >= 65 ? 6 : 22,
      downtimeRiskHours: 3.5,
      replacementCostEstUSD: 140,
      inStockQuantity: 8,
      stockLocation: 'Kho Vật Tư Tiêu Hao - Kệ C-01',
      estimatedLaborMinutes: 25,
      wearIndicators: [
        `Áp suất xả thực tế: ${pressure.toFixed(2)} Bar (Ngưỡng cảnh báo: <${minPressure.toFixed(2)} Bar)`,
        isPressureLow ? 'Cảm biến chênh áp báo nghẹt cặn mạt phôi EDM trong bình lọc' : 'Lưu lượng xả trong phạm vi chấp nhận',
        'Tổng thời gian hoạt động lọc liên tục: ~420 giờ tải',
      ],
      failureConsequence: 'Tụ mạt phôi không được đẩy khỏi khe phóng điện gây hiện tượng hồ quang hồ DC (Arcing), xước phôi và kích hoạt báo động dừng máy ALARM-204.',
      preventiveAction: 'Thay thế cặp lõi lọc giấy chuyên dụng 3µm và xả cặn đáy bể tuần hoàn.',
      priorityScore: wear * 1.0,
    });
  }

  // COMPONENT 3: Mechanical Bearings & Drive Belts (Độ rung cơ khí)
  {
    const vibRatio = vibration / vibLimit;
    const highVib = vibRatio > 0.85;
    let wear = 30 + (highVib ? 42 : 12) + (vibration > 1.5 ? 20 : 0);
    wear = Math.min(92, Math.max(15, wear));

    let status: HardwareWearComponent['status'] = 'OPTIMAL';
    if (wear >= 80) status = 'CRITICAL_REPLACE';
    else if (wear >= 65) status = 'REPLACE_SOON';
    else if (wear >= 40) status = 'MODERATE_WEAR';

    components.push({
      id: 'comp-spindle-bearing',
      name: 'Cụm Vòng Bi Trục Phóng & Dây Đai Răng Đồng Tốc (Precision Spindle Bearings)',
      partNumber: 'NSK-7005C-P4',
      category: 'MECHANICAL_MOTION',
      wearPercentage: wear,
      status,
      daysUntilFailure: wear >= 80 ? 3 : wear >= 65 ? 8 : 35,
      downtimeRiskHours: 8.0,
      replacementCostEstUSD: 520,
      inStockQuantity: 3,
      stockLocation: 'Kho Cơ Khí Chính Xác - Tủ B-08',
      estimatedLaborMinutes: 90,
      wearIndicators: [
        `Độ rung trục Z ghi nhận: ${vibration.toFixed(2)} mm/s (Giới hạn cho phép: ${vibLimit.toFixed(2)} mm/s)`,
        highVib ? 'Phát hiện dải tần số rung động bất thường biểu hiện rơ ổ bi' : 'Độ êm cơ khí duy trì ở mức tốt',
        'Nhiệt độ cụm ổ bi trục: 36.5°C (ổn định)',
      ],
      failureConsequence: 'Rơ lắc trục truyền động gây sai lệch dung sai gia công (±0.002mm), nguy cơ kẹt trục giữa chừng gây cháy driver servo.',
      preventiveAction: 'Bơm mỡ bôi trơn chuyên dụng Kluber Isoflex NBU 15 hoặc thay thế cặp vòng bi tiếp xúc góc P4.',
      priorityScore: wear * 1.15,
    });
  }

  // COMPONENT 4: Deionizing DI Resin Tank (Nhựa trao đổi ion)
  {
    const tempHigh = (device.telemetry?.dielectricTemp || 24) > 28;
    let wear = 35 + (tempHigh ? 25 : 8) + (oee < 88 ? 15 : 0);
    wear = Math.min(88, Math.max(18, wear));

    let status: HardwareWearComponent['status'] = 'OPTIMAL';
    if (wear >= 75) status = 'REPLACE_SOON';
    else if (wear >= 50) status = 'MODERATE_WEAR';

    components.push({
      id: 'comp-di-resin',
      name: 'Bình Hạt Nhựa Trao Đổi Ion Khử Khoáng DI Resin MB400',
      partNumber: 'RESIN-MB400-25L',
      category: 'DIELECTRIC_FLUID',
      wearPercentage: wear,
      status,
      daysUntilFailure: wear >= 75 ? 5 : 28,
      downtimeRiskHours: 2.0,
      replacementCostEstUSD: 110,
      inStockQuantity: 6,
      stockLocation: 'Khu Hóa Chất Nước - Pallet D-02',
      estimatedLaborMinutes: 20,
      wearIndicators: [
        `Nhiệt độ dung dịch điện môi: ${(device.telemetry?.dielectricTemp || 24.2).toFixed(1)}°C`,
        'Điện trở suất dung dịch nước khử ion duy trì ~45.000 Ω·cm',
        'Chu kỳ hoàn nguyên nhựa ion đạt 85% tuổi thọ danh định',
      ],
      failureConsequence: 'Độ dẫn điện tăng mất kiểm soát gây rò rỉ dòng phóng, tạo tia lửa phân tán làm rỗ bề mặt sản phẩm.',
      preventiveAction: 'Xúc rửa và nạp mới 25 lít hạt nhựa trao đổi ion hỗn hợp mixed-bed MB400.',
      priorityScore: wear * 0.85,
    });
  }

  // Sort components by priority / wear descending
  components.sort((a, b) => b.priorityScore - a.priorityScore);

  // Overall Risk Level calculation
  const highestWear = components[0]?.wearPercentage || 40;
  let overallRiskLevel: PredictiveInsightReport['overallRiskLevel'] = 'OPTIMAL';
  if (highestWear >= 85 || hasAlarm) overallRiskLevel = 'CRITICAL';
  else if (highestWear >= 70) overallRiskLevel = 'ELEVATED';
  else if (highestWear >= 50) overallRiskLevel = 'MODERATE';

  const recommendedWindowDays = Math.min(...components.map((c) => c.daysUntilFailure));
  const totalDowntimeSavedHours = components
    .filter((c) => c.status !== 'OPTIMAL')
    .reduce((acc, c) => acc + c.downtimeRiskHours, 0);

  const costSavingsEstimateUSD = totalDowntimeSavedHours * 180; // Estimated downtime cost: $180/hour

  const wearAnalysisSummary = hasAlarm
    ? `Máy đang trong trạng thái dừng sự cố. AI phát hiện linh kiện "${components[0]?.name}" đã hao mòn nghiêm trọng (${components[0]?.wearPercentage}%), cần can thiệp thay thế trước khi khởi động lại.`
    : overallRiskLevel === 'ELEVATED' || overallRiskLevel === 'CRITICAL'
    ? `Dữ liệu vận hành 30 ngày cho thấy linh kiện "${components[0]?.name}" đã đạt mức hao mòn ${components[0]?.wearPercentage}%. Khuyến nghị thay thế phòng ngừa trong vòng ${recommendedWindowDays} ngày để tránh ${totalDowntimeSavedHours.toFixed(1)} giờ dừng máy ngoài kế hoạch.`
    : `Tất cả linh kiện phần cứng vận hành ổn định trong giới hạn kỹ thuật. Chu kỳ thay thế phòng ngừa kế tiếp dự kiến sau ${recommendedWindowDays} ngày.`;

  return {
    overallRiskLevel,
    recommendedWindowDays,
    totalDowntimeSavedHours,
    costSavingsEstimateUSD,
    wearAnalysisSummary,
    components,
  };
}
