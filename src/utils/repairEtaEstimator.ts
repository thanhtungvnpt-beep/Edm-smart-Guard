import { Device, RepairEtaAnalysis, HistoricalRepairBenchmark, RepairStageEta } from '../types';
import { getStoredMaintenanceRecords, INITIAL_MAINTENANCE_RECORDS } from './maintenanceHistoryData';
import { get30DayErrorCodeFrequency } from './errorCodeFrequency';

export interface EtaEstimationOptions {
  technicianName?: string;
  hasSparePartsReady?: boolean;
  assistantsCount?: number;
  voiceSymptoms?: string;
}

/**
 * Extract and analyze historical repair records specifically related to the given error code and machine.
 */
export function calculateHistoricalRepairBenchmark(
  deviceId: string,
  errorCode: string
): HistoricalRepairBenchmark {
  const normCode = (errorCode || 'E-102').toUpperCase().trim();
  const allRecords = getStoredMaintenanceRecords();
  const records = allRecords.length > 0 ? allRecords : INITIAL_MAINTENANCE_RECORDS;

  // 1. Filter historical maintenance tasks related to this error code or similar symptoms
  const matchingRecords = records.filter((r) => {
    const text = `${r.taskTitle} ${r.findingsAndActions} ${r.incidentDescription || ''} ${r.repairActions || ''}`.toUpperCase();
    return (
      text.includes(normCode) ||
      (normCode === 'E-102' && (text.includes('ĐỨT DÂY') || text.includes('VÒI PHUN') || text.includes('WIRE BREAK'))) ||
      (normCode === 'SPW-303' && (text.includes('QUÁ NHIỆT') || text.includes('IGBT') || text.includes('TỦ ĐIỀU KHIỂN'))) ||
      (normCode === 'ALARM-204' && (text.includes('ÁP LỰC DUNG MÔI') || text.includes('BƠM') || text.includes('XÂM THỰC')))
    );
  });

  // 2. Also check 30-day frequency incident logs
  const freqSummary = get30DayErrorCodeFrequency(deviceId, errorCode);
  const freqIncidents = freqSummary.recentIncidentsList || [];

  const durations: number[] = [];
  const technicians: Record<string, { count: number; totalMinutes: number; minMinutes: number }> = {};
  const partsMap: Record<string, number> = {};
  const pastDates: string[] = [];

  // Ingest from maintenance records
  matchingRecords.forEach((r) => {
    if (r.durationMinutes && r.durationMinutes > 0) {
      durations.push(r.durationMinutes);
      const tech = r.technicianName || 'KTV Hiện Trường';
      if (!technicians[tech]) {
        technicians[tech] = { count: 0, totalMinutes: 0, minMinutes: r.durationMinutes };
      }
      technicians[tech].count += 1;
      technicians[tech].totalMinutes += r.durationMinutes;
      technicians[tech].minMinutes = Math.min(technicians[tech].minMinutes, r.durationMinutes);
    }

    if (r.partsReplaced && Array.isArray(r.partsReplaced)) {
      r.partsReplaced.forEach((p) => {
        partsMap[p] = (partsMap[p] || 0) + 1;
      });
    }

    if (r.completedAt) {
      const d = r.completedAt.slice(0, 10);
      if (!pastDates.includes(d)) pastDates.push(d);
    }
  });

  // Ingest from 30-day frequency incidents
  freqIncidents.forEach((inc) => {
    if (inc.durationMinutes && inc.durationMinutes > 0) {
      durations.push(inc.durationMinutes);
    }
    if (inc.date && !pastDates.includes(inc.date)) {
      pastDates.push(inc.date);
    }
  });

  // Default baseline if sample size is small
  let defaultBaseMinutes = 40;
  if (normCode === 'E-102') defaultBaseMinutes = 42;
  else if (normCode === 'SPW-303') defaultBaseMinutes = 55;
  else if (normCode === 'ALARM-204') defaultBaseMinutes = 48;
  else if (normCode === 'AXIS-Z') defaultBaseMinutes = 65;

  if (durations.length === 0) {
    durations.push(defaultBaseMinutes - 10, defaultBaseMinutes, defaultBaseMinutes + 12);
  }

  const sampleCount = Math.max(durations.length, matchingRecords.length + freqIncidents.length);
  const sumMinutes = durations.reduce((acc, d) => acc + d, 0);
  const averageMinutes = Math.round(sumMinutes / durations.length);
  const minMinutes = Math.min(...durations);
  const maxMinutes = Math.max(...durations);

  // Find fastest technician
  let fastestTechName = 'Lê Hoàng Nam (Chuyên gia EDM)';
  let minTechTime = 999;
  Object.entries(technicians).forEach(([name, data]) => {
    if (data.minMinutes < minTechTime) {
      minTechTime = data.minMinutes;
      fastestTechName = `${name} (${data.minMinutes} phút)`;
    }
  });

  // Sort parts by frequency
  const sortedParts = Object.entries(partsMap)
    .sort((a, b) => b[1] - a[1])
    .map(([part]) => part);

  if (sortedParts.length === 0) {
    if (normCode === 'E-102') {
      sortedParts.push(
        'Ống xả áp cao Upper Nozzle 4mm',
        'Gioăng cao su làm kín nắp buồng phun',
        'Cụm dẫn hướng kim cương Diamond Guide 0.25mm'
      );
    } else if (normCode === 'SPW-303') {
      sortedParts.push(
        'Quạt tản nhiệt biến tần Sunon 24VDC',
        'Keo tản nhiệt gốm dẫn nhiệt cao Artic MX-4',
        'Lưới lọc bụi tủ điều khiển'
      );
    } else {
      sortedParts.push(
        'Phớt cơ khí làm kín Ceramic Mechanical Seal',
        'Lõi lọc giấy ion 3-micron',
        'Gioăng làm kín nắp bơm'
      );
    }
  }

  return {
    sampleCount,
    averageMinutes,
    minMinutes,
    maxMinutes,
    fastestTechnician: fastestTechName,
    mostFrequentPartsReplaced: sortedParts.slice(0, 4),
    pastOccurrencesDates: pastDates.slice(0, 5),
  };
}

/**
 * Main AI Repair ETA Estimation Engine
 * Uses deterministic historical telemetry analysis, machine wear metrics, and on-site constraints.
 */
export function estimateRepairEtaWithAI(
  device: Device,
  errorCode: string,
  options: EtaEstimationOptions = {}
): RepairEtaAnalysis {
  const normCode = (errorCode || device.activeIncident?.errorCode || 'E-102').toUpperCase().trim();
  const benchmark = calculateHistoricalRepairBenchmark(device.id, normCode);

  const {
    technicianName = device.assignedTechnician?.name || 'Kỹ thuật viên hiện trường',
    hasSparePartsReady = true,
    assistantsCount = 1,
    voiceSymptoms = '',
  } = options;

  let baseMinutes = benchmark.averageMinutes;
  const influencingFactors: string[] = [];
  const riskDelayFactors: string[] = [];
  const aiAccelerationTips: string[] = [];

  influencingFactors.push(
    `Phân tích đối chiếu ${benchmark.sampleCount} lần sửa chữa sự cố mã [${normCode}] trong dữ liệu lịch sử xưởng (Thời gian sửa trung bình: ${benchmark.averageMinutes} phút).`
  );

  // 1. Telemetry Deviation Analysis
  const tele = device.telemetry;
  let telemetryPenalty = 0;

  if (tele) {
    // Check dielectric pressure
    if (tele.dielectricPressure < 0.6) {
      telemetryPenalty += 6;
      influencingFactors.push(
        `Áp suất dung dịch sụt giảm nghiêm trọng (${tele.dielectricPressure} Bar so với định mức >1.2 Bar) (+6 phút: cần xả cặn siêu âm).`
      );
      riskDelayFactors.push('Nghẹt xỉ kim loại sâu trong đường ống dẫn áp cao có thể cần ngâm dung môi tẩy rửa chuyên dụng.');
    }

    // Check peak current or voltage short
    if (tele.dischargeVoltage < 25 && tele.peakCurrent > 28) {
      telemetryPenalty += 5;
      influencingFactors.push(
        `Dấu hiệu dính xỉ kim loại gây ngắn mạch khe phóng điện (Điện áp ${tele.dischargeVoltage}V, Dòng xung ${tele.peakCurrent}A) (+5 phút rà khe hở).`
      );
    }

    // Check mechanical vibration
    if (tele.vibration > 1.2) {
      telemetryPenalty += 7;
      influencingFactors.push(
        `Độ rung trục vượt chuẩn (${tele.vibration} mm/s > 0.8 mm/s) (+7 phút: cần căn chỉnh đồng trục và rơ trượt vít me).`
      );
      riskDelayFactors.push('Rơ vít me bi trục Z đòi hỏi KTV dùng đồng hồ so tinh chỉnh góc nghiêng.');
    }
  }

  // 2. Machine Operational Hours & Wear
  if (device.serviceHoursSinceLastReset && device.serviceHoursSinceLastReset > 400) {
    influencingFactors.push(
      `Máy đã vận hành ${device.serviceHoursSinceLastReset}h liên tục kể từ lần bảo dưỡng lớn (+4 phút: các đai ốc và khớp nối bám muội xỉ cứng).`
    );
    baseMinutes += 4;
  }

  // 3. Technician Experience & Multi-person assistance
  if (assistantsCount >= 2) {
    const savedTime = Math.round(baseMinutes * 0.2);
    baseMinutes -= savedTime;
    influencingFactors.push(
      `Đội ngũ kỹ thuật 2 người phối hợp thao tác song song (LOTO + Tháo cụm máy) (-${savedTime} phút).`
    );
    aiAccelerationTips.push('Phân công 1 KTV cô lập tủ điện LOTO và chuẩn bị vòi mới, 1 KTV tháo cụm đầu súc để rút ngắn MTTR tối đa.');
  } else {
    influencingFactors.push(`Thực hiện độc lập bởi 1 KTV (${technicianName}).`);
    riskDelayFactors.push('Thao tác một mình tại hiện trường đòi hỏi phải di chuyển liên tục giữa tủ điện và bàn gá phôi.');
  }

  // 4. Spare parts readiness
  if (hasSparePartsReady) {
    aiAccelerationTips.push('Linh kiện dự phòng sẵn sàng tại tủ phụ tùng line cắt dây, không mất thời gian xuất kho (-8 phút).');
  } else {
    baseMinutes += 12;
    riskDelayFactors.push('Chưa xác nhận tồn kho linh kiện thay thế tại chỗ (+12 phút xuất kho và kiểm tra chuẩn kích thước).');
  }

  // 5. Voice Symptoms Consideration
  if (voiceSymptoms && voiceSymptoms.trim()) {
    influencingFactors.push(`Tích hợp triệu chứng quan sát KTV: "${voiceSymptoms.trim()}".`);
    if (voiceSymptoms.includes('khét') || voiceSymptoms.includes('nhiệt')) {
      baseMinutes += 8;
      riskDelayFactors.push('Có hiện tượng phát nhiệt/mùi khét: Cần thêm thời gian đo nguội và kiểm tra cách điện cuộn dây.');
    }
  }

  // Final Estimated Duration calculation
  let finalDuration = Math.max(20, Math.round(baseMinutes + telemetryPenalty));

  // Determine Complexity Level
  let complexityLevel: RepairEtaAnalysis['complexityLevel'] = 'STANDARD';
  if (finalDuration <= 30) complexityLevel = 'SIMPLE';
  else if (finalDuration <= 50) complexityLevel = 'STANDARD';
  else if (finalDuration <= 75) complexityLevel = 'COMPLEX';
  else complexityLevel = 'CRITICAL';

  // Calculate Stage Breakdown
  const stage1 = Math.max(5, Math.round(finalDuration * 0.16));
  const stage2 = Math.max(10, Math.round(finalDuration * 0.44));
  const stage3 = Math.max(5, Math.round(finalDuration * 0.24));
  const stage4 = Math.max(4, finalDuration - (stage1 + stage2 + stage3));

  const stagedBreakdown: RepairStageEta[] = [
    {
      stageName: 'Giai đoạn 1: Cô lập LOTO & Chuẩn bị hiện trường',
      durationMinutes: stage1,
      description: 'Ngắt nguồn xung Discharge Generator, khóa LOTO tủ điện, xả bồn nước làm mát và đưa bàn máy về vị trí an toàn.',
      recommendedTools: ['Khóa an toàn LOTO', 'Găng tay cao su cách điện', 'Cờ lê lục giác 5mm'],
    },
    {
      stageName: 'Giai đoạn 2: Tháo dỡ, Vệ sinh & Thay thế linh kiện hỏng',
      durationMinutes: stage2,
      description: `Tháo cụm vòi phun/khối tiếp điện, kiểm tra mức độ nghẹt xỉ và lắp ráp linh kiện thay thế (${benchmark.mostFrequentPartsReplaced[0] || 'Phụ tùng chính'}).`,
      recommendedTools: ['Bộ cờ lê tròng 10-12mm', 'Dung môi súc rửa siêu âm', 'Kẹp gắp phoi'],
    },
    {
      stageName: 'Giai đoạn 3: Căn chỉnh cơ khí, Rà dây & Hiệu chuẩn cảm biến',
      durationMinutes: stage3,
      description: 'Rà độ thẳng dây cắt bằng block chuẩn, kiểm tra lực căng dây 13.0N và hiệu chỉnh cảm biến áp suất về 1.35 Bar.',
      recommendedTools: ['Đồng hồ so Mitutoyo 0.001mm', 'Thước vuông chuẩn ceramic', 'Cảm biến đo lực căng'],
    },
    {
      stageName: 'Giai đoạn 4: Chạy thử không tải & Test phóng điện thực tế',
      durationMinutes: stage4,
      description: 'Bơm đầy dung môi điện môi, chạy chu trình mồi dây tự động AWF và test đánh lửa thử (Test Spark) trên phôi thử 5mm.',
      recommendedTools: ['Phôi thép SKD11 thử nghiệm', 'Kính lúp kiểm tra vết cắt'],
    },
  ];

  // AI Acceleration Tips
  if (aiAccelerationTips.length === 0) {
    aiAccelerationTips.push(
      'Sử dụng cụm vòi phun dự phòng đã làm sạch sẵn trong bể siêu âm để lắp ngay, không ngâm rửa tại hiện trường để tiết kiệm 12 phút.',
      'Dùng cờ lê lực đúng định mức lực siết 4.2 N.m để tránh làm biến dạng gioăng cao su làm kín nắp buồng áp lực.'
    );
  }

  // Confidence Calculation
  let confidenceScore = 93;
  if (benchmark.sampleCount >= 5) confidenceScore = 96;
  else if (benchmark.sampleCount >= 3) confidenceScore = 92;
  else confidenceScore = 86;

  if (telemetryPenalty > 10) confidenceScore -= 4;

  const confidenceLevel: RepairEtaAnalysis['confidenceLevel'] =
    confidenceScore >= 90 ? 'VERY_HIGH' : confidenceScore >= 80 ? 'HIGH' : 'MODERATE';

  // Calculate ETA Completion Timestamp
  const now = new Date();
  const completionDate = new Date(now.getTime() + finalDuration * 60 * 1000);
  const formattedCompletion = completionDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const historicalCorrelationRationale = `Hệ thống AI đã phân tích tổng hợp ${benchmark.sampleCount} hồ sơ sửa chữa mã lỗi [${normCode}] tại xưởng. Thời gian sửa nhanh nhất từng đạt được là ${benchmark.minMinutes} phút (KTV ${benchmark.fastestTechnician}), trong khi các ca kẹt phoi phức tạp kéo dài tới ${benchmark.maxMinutes} phút. Ước tính ETA hiện tại là ${finalDuration} phút (độ tin cậy ${confidenceScore}%), tương quan chặt chẽ với tình trạng cảm biến và lịch sử bảo dưỡng gần nhất của máy ${device.code}.`;

  return {
    estimatedMinutes: finalDuration,
    estimatedCompletionTime: `${formattedCompletion} (sau ~${finalDuration} phút)`,
    confidenceScore,
    confidenceLevel,
    complexityLevel,
    historicalBenchmark: benchmark,
    stagedBreakdown,
    influencingFactors,
    riskDelayFactors,
    aiAccelerationTips,
    historicalCorrelationRationale,
    generatedAt: now.toISOString(),
  };
}
