import { Device } from '../types';

export interface SensorVibrationAnalysis {
  currentValue: number; // mm/s
  nominalRange: [number, number];
  deviationPercent: number; // e.g. +35%
  status: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  waveformType: 'STABLE_SINUSOIDAL' | 'HIGH_FREQUENCY_HARMONIC' | 'ERRATIC_SPIKES';
  probableMechanicalCause: string;
  mechanicalRiskScore: number; // 0 - 100
}

export interface SensorCurrentAnalysis {
  currentValue: number; // A (Ampe)
  nominalRange: [number, number];
  deviationPercent: number; // e.g. +25%
  status: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  sparkStabilityIndex: number; // 0 - 100%
  dischargeWaveform: 'NORMAL_DISCHARGE' | 'MICRO_SHORT_CIRCUIT' | 'ARC_DEGRADATION';
  probableElectricalCause: string;
  electricalRiskScore: number; // 0 - 100
}

export interface HourlyVibrationCurrentPoint {
  hourOffset: number; // 0, 4, 8, ... 48
  timeLabel: string; // "T+0h", "T+4h", etc.
  displayTime: string; // "14:00 Hôm nay"
  vibrationMmS: number;
  currentAmps: number;
  riskScore: number; // 0 - 100%
  primaryDriver: string;
}

export interface AIPredictiveMaintenanceScheduleItem {
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  deviceModel: string;
  deviceType: Device['type'];
  deviceLocation: string;
  deviceStatus: Device['status'];
  predictedDate: Date;
  predictedDateFormatted: string; // e.g. "14:30 Ngày mai - 16/10/2026"
  predictedShift: string; // "Ca 2 (14:00 - 22:00)"
  hoursRemaining: number; // e.g. 18 hours
  daysRemaining: number; // e.g. 1.1 days
  urgency: 'CRITICAL_URGENT' | 'HIGH_WARNING' | 'SCHEDULED_NORMAL' | 'OPTIMAL';
  confidenceScore: number; // 88 - 99%
  vibrationAnalysis: SensorVibrationAnalysis;
  currentAnalysis: SensorCurrentAnalysis;
  aiDiagnosticSummary: string;
  recommendedAction: string;
  recommendedSpareParts: string[];
  estimatedMttrMinutes: number;
  assignedTechnicianName: string;
  assignedTechnicianPhone: string;
  hourlyForecast: HourlyVibrationCurrentPoint[];
}

export interface FleetAIPredictiveScheduleSummary {
  schedule: AIPredictiveMaintenanceScheduleItem[];
  urgentCount: number; // < 24h
  warningCount: number; // 24h - 72h
  normalCount: number; // > 72h
  avgVibration: number;
  avgCurrent: number;
  highestRiskDeviceCode: string;
  earliestMaintenanceHours: number;
}

/**
 * Evaluates vibration sensor telemetry against nominal baseline
 */
export function analyzeVibrationTelemetry(device: Device): SensorVibrationAnalysis {
  const current = device.telemetry.vibration ?? 0.8;
  const [minVib, maxVib] = device.nominalRanges.vibration || [0.1, 1.8];
  const midPoint = (minVib + maxVib) / 2;

  let deviationPercent = 0;
  if (current > maxVib) {
    deviationPercent = Math.round(((current - maxVib) / maxVib) * 100);
  } else if (current > midPoint) {
    deviationPercent = Math.round(((current - midPoint) / (maxVib - midPoint)) * 40);
  }

  let status: SensorVibrationAnalysis['status'] = 'NORMAL';
  let waveformType: SensorVibrationAnalysis['waveformType'] = 'STABLE_SINUSOIDAL';
  let mechanicalRiskScore = 15;
  let probableMechanicalCause = 'Biên độ rung trong ngưỡng thiết kế an toàn của cụm cơ khí';

  if (device.status === 'ALARM_STOPPED' || current >= maxVib * 1.3) {
    status = 'CRITICAL';
    waveformType = 'ERRATIC_SPIKES';
    mechanicalRiskScore = 92;
    probableMechanicalCause = `Rung động cơ khí ${current.toFixed(2)} mm/s vượt ngưỡng giới hạn (${maxVib} mm/s): Báo động rơ trượt bạc bi trục Z hoặc kẹt phôi ma sát cao.`;
  } else if (current >= maxVib || deviationPercent > 15) {
    status = 'ELEVATED';
    waveformType = 'HIGH_FREQUENCY_HARMONIC';
    mechanicalRiskScore = 65;
    probableMechanicalCause = `Rung động ${current.toFixed(2)} mm/s tiệm cận mức trần (${maxVib} mm/s): Xuất hiện sóng hài cao tần do thiếu mỡ bôi trơn ray trượt hoặc bạc dẫn hướng mòn không đều.`;
  } else if (current > midPoint) {
    mechanicalRiskScore = 35;
    probableMechanicalCause = `Rung động nhẹ ${current.toFixed(2)} mm/s (chuẩn ${minVib}-${maxVib} mm/s), cụm cơ khí hoạt động bình thường.`;
  }

  return {
    currentValue: current,
    nominalRange: [minVib, maxVib],
    deviationPercent,
    status,
    waveformType,
    probableMechanicalCause,
    mechanicalRiskScore,
  };
}

/**
 * Evaluates sensor current (peakCurrent, discharge arcing) against nominal baseline
 */
export function analyzeCurrentTelemetry(device: Device): SensorCurrentAnalysis {
  const current = device.telemetry.peakCurrent ?? 25;
  const [minAmp, maxAmp] = device.nominalRanges.peakCurrent || [15, 35];
  const midPoint = (minAmp + maxAmp) / 2;

  let deviationPercent = 0;
  if (current > maxAmp) {
    deviationPercent = Math.round(((current - maxAmp) / maxAmp) * 100);
  } else if (current < minAmp && device.status === 'RUNNING') {
    deviationPercent = -Math.round(((minAmp - current) / minAmp) * 100);
  }

  let status: SensorCurrentAnalysis['status'] = 'NORMAL';
  let sparkStabilityIndex = 94;
  let dischargeWaveform: SensorCurrentAnalysis['dischargeWaveform'] = 'NORMAL_DISCHARGE';
  let electricalRiskScore = 12;
  let probableElectricalCause = 'Dòng phóng điện gia công EDM ổn định, tỷ lệ xung hồ quang chuẩn';

  if (device.status === 'ALARM_STOPPED') {
    status = 'CRITICAL';
    sparkStabilityIndex = 20;
    dischargeWaveform = 'MICRO_SHORT_CIRCUIT';
    electricalRiskScore = 95;
    probableElectricalCause = 'Xung phóng điện bị đoản mạch (Short Circuit) hoặc ngắt nguồn bảo vệ IGBT tức thời.';
  } else if (current > maxAmp * 1.15) {
    status = 'CRITICAL';
    sparkStabilityIndex = 48;
    dischargeWaveform = 'MICRO_SHORT_CIRCUIT';
    electricalRiskScore = 88;
    probableElectricalCause = `Dòng đỉnh cảm biến ${current.toFixed(1)}A vượt giới hạn (${maxAmp}A): Nguy cơ phóng hồ quang tập trung, quá tải mạch xung máy EDM & cháy đứt dây cắt.`;
  } else if (current > maxAmp || deviationPercent > 10) {
    status = 'ELEVATED';
    sparkStabilityIndex = 68;
    dischargeWaveform = 'ARC_DEGRADATION';
    electricalRiskScore = 60;
    probableElectricalCause = `Dòng cảm biến ${current.toFixed(1)}A tăng cao (+${deviationPercent}%): Bạc cấp điện Carbide bị rỗ mòn hoặc khe hở phóng điện sinh nhiệt cao.`;
  } else if (current < minAmp && device.status === 'RUNNING') {
    status = 'ELEVATED';
    sparkStabilityIndex = 62;
    dischargeWaveform = 'ARC_DEGRADATION';
    electricalRiskScore = 55;
    probableElectricalCause = `Dòng cảm biến tụt xuống ${current.toFixed(1)}A (< ${minAmp}A): Phóng điện chập chờn, tiếp xúc chổi than kém hoặc dung môi suy giảm.`;
  }

  return {
    currentValue: current,
    nominalRange: [minAmp, maxAmp],
    deviationPercent,
    status,
    sparkStabilityIndex,
    dischargeWaveform,
    probableElectricalCause,
    electricalRiskScore,
  };
}

/**
 * Calculates deterministic future time point string
 */
function getScheduleDateTime(hourOffset: number): { date: Date; formatted: string; shift: string } {
  const now = new Date();
  const target = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);
  const hour = target.getHours();
  const minutes = target.getMinutes();
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const hourStr = hour < 10 ? `0${hour}` : `${hour}`;

  let dayLabel = 'Hôm nay';
  if (hourOffset >= 12 && hourOffset < 36) {
    dayLabel = 'Ngày mai';
  } else if (hourOffset >= 36) {
    const days = Math.floor(hourOffset / 24);
    dayLabel = `Sau ${days} ngày`;
  }

  const dateStr = `${target.getDate().toString().padStart(2, '0')}/${(target.getMonth() + 1).toString().padStart(2, '0')}/${target.getFullYear()}`;
  const formatted = `${hourStr}:${minStr} ${dayLabel} (${dateStr})`;

  let shift = 'Ca 1 (06:00 - 14:00)';
  if (hour >= 14 && hour < 22) {
    shift = 'Ca 2 (14:00 - 22:00)';
  } else if (hour >= 22 || hour < 6) {
    shift = 'Ca 3 - Đêm (22:00 - 06:00)';
  }

  return { date: target, formatted, shift };
}

/**
 * Core AI Predictive Maintenance Scheduling Algorithm
 * Synthesizes Vibration Analysis + Sensor Current Analysis
 */
export function calculateAIVibrationCurrentSchedule(device: Device): AIPredictiveMaintenanceScheduleItem {
  const vib = analyzeVibrationTelemetry(device);
  const cur = analyzeCurrentTelemetry(device);

  // Combined Risk Score (0 - 100)
  // Vibration has 45% weight, Current has 45% weight, Status/History has 10%
  let combinedRisk = vib.mechanicalRiskScore * 0.45 + cur.electricalRiskScore * 0.45;

  if (device.status === 'ALARM_STOPPED') {
    combinedRisk = 96;
  } else if (device.status === 'WARNING') {
    combinedRisk = Math.max(combinedRisk, 68);
  } else if (device.status === 'MAINTENANCE') {
    combinedRisk = 25;
  }

  // Adjust for device type specifics
  if (device.type === 'CNC_MILLING') {
    // Milling is more vibration-sensitive
    combinedRisk = Math.round(vib.mechanicalRiskScore * 0.6 + cur.electricalRiskScore * 0.3 + 10);
  } else if (device.type === 'WIRE_EDM' || device.type === 'SINKER_EDM') {
    // EDM is very sensitive to spark current instability
    combinedRisk = Math.round(cur.electricalRiskScore * 0.55 + vib.mechanicalRiskScore * 0.35 + 10);
  }

  combinedRisk = Math.min(99, Math.max(8, combinedRisk));

  // Determine hours remaining until recommended maintenance
  let hoursRemaining = 120; // 5 days nominal
  let urgency: AIPredictiveMaintenanceScheduleItem['urgency'] = 'OPTIMAL';

  if (combinedRisk >= 80 || device.status === 'ALARM_STOPPED') {
    urgency = 'CRITICAL_URGENT';
    // Urgent maintenance required within 4 to 18 hours
    const seed = (device.id.charCodeAt(device.id.length - 1) % 10) + 4;
    hoursRemaining = Math.max(2, seed);
  } else if (combinedRisk >= 55) {
    urgency = 'HIGH_WARNING';
    // Warning: maintenance needed in 24 to 48 hours
    const seed = (device.id.charCodeAt(device.id.length - 1) % 20) + 24;
    hoursRemaining = seed;
  } else if (combinedRisk >= 35) {
    urgency = 'SCHEDULED_NORMAL';
    // Scheduled: 72 to 144 hours (3 to 6 days)
    const seed = (device.id.charCodeAt(device.id.length - 1) % 48) + 72;
    hoursRemaining = seed;
  } else {
    urgency = 'OPTIMAL';
    hoursRemaining = 240; // 10 days
  }

  const daysRemaining = Math.round((hoursRemaining / 24) * 10) / 10;
  const { date: predictedDate, formatted: predictedDateFormatted, shift: predictedShift } = getScheduleDateTime(hoursRemaining);

  // Confidence score
  const confidenceScore = Math.min(98, 88 + Math.round((device.telemetry.oee % 10)));

  // AI Diagnostic Synthesis combining Vibration & Current
  let aiDiagnosticSummary = '';
  let recommendedAction = '';
  let recommendedSpareParts: string[] = [];
  let estimatedMttrMinutes = 45;

  if (urgency === 'CRITICAL_URGENT') {
    aiDiagnosticSummary = `AI phát hiện tương quan nguy hiểm: Rung động cơ khí (${vib.currentValue} mm/s, ${vib.status}) kết hợp biến thiên dòng cảm biến (${cur.currentValue}A, ${cur.status}). Tần số dao động cao gây sai lệch khe phóng tia lửa, tạo ra vi đoản mạch liên tục. Nguy cơ dừng máy ngoài ý muốn trong vòng ${hoursRemaining} giờ tới.`;
    recommendedAction = 'DỪNG MÁY CHỦ ĐỘNG: Cân chỉnh bạc dẫn hướng, bơm mỡ ray trượt Z và thay thế bạc cấp điện trước khi đứt dây cắt.';
    recommendedSpareParts = ['Bạc tiếp điện Carbide (MK-U6-GD25)', 'Cụm vòi xả áp suất cao Upper Nozzle', 'Lõi lọc điện môi 3µm'];
    estimatedMttrMinutes = 55;
  } else if (urgency === 'HIGH_WARNING') {
    aiDiagnosticSummary = `AI phân tích: Dao động rung (${vib.currentValue} mm/s) có xu hướng gia tăng cùng độ ổn định dòng phóng giảm còn ${cur.sparkStabilityIndex}%. Cụm đầu cắt bắt đầu xuất hiện ma sát cơ khí nhẹ và tiếp xúc điện chập chờn.`;
    recommendedAction = `LÊN LỊCH BẢO DƯỠNG: Thực hiện trong ca ${predictedShift}. Vệ sinh ray trượt, kiểm tra lực căng dây & xoay mặt tiếp xúc bạc cấp điện 90°.`;
    recommendedSpareParts = ['Bạc tiếp xúc điện', 'Mỡ bôi trơn chuyên dụng Kluber', 'Bộ phớt gạt phoi'];
    estimatedMttrMinutes = 40;
  } else if (urgency === 'SCHEDULED_NORMAL') {
    aiDiagnosticSummary = `AI đánh giá: Cả thông số rung (${vib.currentValue} mm/s) và dòng điện (${cur.currentValue}A) nằm trong vùng kiểm soát. Độ ổn định hồ quang ${cur.sparkStabilityIndex}%. Dự kiến duy trì vận hành tốt trong ${daysRemaining} ngày.`;
    recommendedAction = 'BẢO TRÌ ĐỊNH KỲ: Duy trì theo dõi cảm biến chu kỳ 4h/lần. Thay lõi lọc dung dịch theo lịch chuẩn.';
    recommendedSpareParts = ['Lõi lọc áp lực 5µm', 'Nước khử khoáng DI'];
    estimatedMttrMinutes = 30;
  } else {
    aiDiagnosticSummary = `AI đánh giá: Trạng thái lý tưởng. Rung động siêu êm (${vib.currentValue} mm/s) và dòng xung ổn định hoàn hảo (${cur.currentValue}A). Không phát hiện dấu hiệu suy thoái.`;
    recommendedAction = 'VẬN HÀNH TIẾP TỤC: Máy đạt chuẩn gia công chi tiết độ bóng cao. Duy trì chế độ tiêu chuẩn.';
    recommendedSpareParts = [];
    estimatedMttrMinutes = 20;
  }

  // Generate 48-hour projection points
  const hourSteps = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48];
  const hourlyForecast: HourlyVibrationCurrentPoint[] = hourSteps.map((h) => {
    const { formatted } = getScheduleDateTime(h);
    // Slight drift based on time
    const driftRate = urgency === 'CRITICAL_URGENT' ? 0.015 : urgency === 'HIGH_WARNING' ? 0.008 : 0.002;
    const wave = Math.sin(h / 3.2) * (urgency === 'CRITICAL_URGENT' ? 0.12 : 0.05);
    const projVib = Math.max(0.1, Math.round((vib.currentValue + h * driftRate + wave) * 100) / 100);

    const ampDrift = urgency === 'CRITICAL_URGENT' ? 0.25 : 0.08;
    const projAmp = Math.max(0, Math.round((cur.currentValue + h * ampDrift + Math.cos(h / 2.5) * 0.8) * 10) / 10);

    const projRisk = Math.min(99, Math.max(5, Math.round(combinedRisk + h * (urgency === 'CRITICAL_URGENT' ? 0.8 : 0.3))));

    return {
      hourOffset: h,
      timeLabel: `T+${h}h`,
      displayTime: formatted,
      vibrationMmS: projVib,
      currentAmps: projAmp,
      riskScore: projRisk,
      primaryDriver: projRisk > 60 ? `Rung động ${projVib} mm/s & Dòng ${projAmp}A` : 'Cảm biến ổn định',
    };
  });

  return {
    deviceId: device.id,
    deviceCode: device.code,
    deviceName: device.name,
    deviceModel: device.model,
    deviceType: device.type,
    deviceLocation: device.location,
    deviceStatus: device.status,
    predictedDate,
    predictedDateFormatted,
    predictedShift,
    hoursRemaining,
    daysRemaining,
    urgency,
    confidenceScore,
    vibrationAnalysis: vib,
    currentAnalysis: cur,
    aiDiagnosticSummary,
    recommendedAction,
    recommendedSpareParts,
    estimatedMttrMinutes,
    assignedTechnicianName: device.assignedTechnician?.name || 'KTV Xưởng',
    assignedTechnicianPhone: device.assignedTechnician?.phone || '0988.123.456',
    hourlyForecast,
  };
}

/**
 * Calculates predictive maintenance schedules for an entire fleet of devices
 * Sorted by most urgent first
 */
export function calculateFleetAIPredictiveSchedule(devices: Device[]): FleetAIPredictiveScheduleSummary {
  const schedule = devices.map(calculateAIVibrationCurrentSchedule);

  // Sort: CRITICAL_URGENT first, then HIGH_WARNING, then ascending hoursRemaining
  schedule.sort((a, b) => {
    const urgencyWeight = {
      CRITICAL_URGENT: 4,
      HIGH_WARNING: 3,
      SCHEDULED_NORMAL: 2,
      OPTIMAL: 1,
    };
    if (urgencyWeight[a.urgency] !== urgencyWeight[b.urgency]) {
      return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    }
    return a.hoursRemaining - b.hoursRemaining;
  });

  let urgentCount = 0;
  let warningCount = 0;
  let normalCount = 0;
  let totalVib = 0;
  let totalCur = 0;

  schedule.forEach((item) => {
    if (item.urgency === 'CRITICAL_URGENT') urgentCount++;
    else if (item.urgency === 'HIGH_WARNING') warningCount++;
    else normalCount++;

    totalVib += item.vibrationAnalysis.currentValue;
    totalCur += item.currentAnalysis.currentValue;
  });

  const count = devices.length || 1;
  const avgVibration = Math.round((totalVib / count) * 100) / 100;
  const avgCurrent = Math.round((totalCur / count) * 10) / 10;
  const highestRiskDeviceCode = schedule[0]?.deviceCode || 'N/A';
  const earliestMaintenanceHours = schedule[0]?.hoursRemaining || 24;

  return {
    schedule,
    urgentCount,
    warningCount,
    normalCount,
    avgVibration,
    avgCurrent,
    highestRiskDeviceCode,
    earliestMaintenanceHours,
  };
}
