import { Device, MachineTelemetry } from '../types';
import { getAllMachineServiceIntervals } from './serviceIntervalHelper';

export interface SensorAnomalyFactor {
  sensorName: string;
  sensorKey: keyof MachineTelemetry;
  currentValue: number;
  nominalRange: [number, number];
  unit: string;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
  contributionPercentage: number; // 0 - 100%
  description: string;
}

export interface HourlyProbabilityPoint {
  hourOffset: number; // 0, 4, 8, ... 48
  timeLabel: string; // "T+0h", "T+4h", etc.
  displayTime: string; // e.g. "14:00 Hôm nay", "02:00 Đêm nay"
  shiftLabel: string; // "Ca 1 (Sáng)", "Ca 2 (Chiều)", "Ca 3 (Đêm)"
  probability: number; // 0 - 100 (%)
  riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL';
  primarySensorDriver: string;
  contributingFactors: string[];
  projectedErrorCode?: string;
  recommendedAction?: string;
}

export interface Machine48hPrediction {
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  currentProbability: number; // At T+0h
  peakProbability: number; // Highest probability in 48h
  peakHourOffset: number; // Hour at peak (e.g. 28)
  peakTimeLabel: string;
  overallRiskLevel: 'SAFE' | 'WARNING' | 'CRITICAL';
  hoursUntilCriticalThreshold?: number; // Hours until probability > 65% (null if never)
  dominantSensorFactor: string;
  topAnomalies: SensorAnomalyFactor[];
  suggestedInterventionWindow: string;
  hourlyPoints: HourlyProbabilityPoint[];
}

export interface Fleet48hPredictionSummary {
  fleetAveragePoints: {
    hourOffset: number;
    timeLabel: string;
    displayTime: string;
    fleetAvgProbability: number;
    highestMachineProbability: number;
    highestMachineCode: string;
  }[];
  peakFleetProbability: number;
  peakFleetHourOffset: number;
  highRiskMachineCount: number; // Machines with peak > 60%
  moderateRiskMachineCount: number; // Machines with peak 30-60%
  safeMachineCount: number; // Machines with peak < 30%
  machines: Machine48hPrediction[];
}

/**
 * Format a future hour offset into realistic clock time
 */
function getFutureTimeInfo(hourOffset: number): { displayTime: string; shiftLabel: string } {
  const now = new Date();
  const targetTime = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);
  const hour = targetTime.getHours();
  const dayName =
    hourOffset < 12
      ? 'Hôm nay'
      : hourOffset < 36
      ? 'Ngày mai'
      : 'Ngày kia';

  const timeStr = `${hour.toString().padStart(2, '0')}:00 ${dayName}`;

  let shiftLabel = 'Ca 1 (06:00 - 14:00)';
  if (hour >= 14 && hour < 22) {
    shiftLabel = 'Ca 2 (14:00 - 22:00)';
  } else if (hour >= 22 || hour < 6) {
    shiftLabel = 'Ca 3 - Đêm (22:00 - 06:00)';
  }

  return { displayTime: timeStr, shiftLabel };
}

/**
 * Evaluates individual sensor telemetry anomalies for a machine
 */
export function evaluateSensorAnomalies(device: Device): SensorAnomalyFactor[] {
  const t = device.telemetry;
  const n = device.nominalRanges;
  const anomalies: SensorAnomalyFactor[] = [];

  // 1. Vibration
  if (t.vibration !== undefined && n.vibration) {
    const [minVib, maxVib] = n.vibration;
    const isCrit = t.vibration > maxVib * 1.35;
    const isWarn = t.vibration > maxVib;
    const severity = isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : 'NORMAL';
    const contrib = isCrit ? 35 : isWarn ? 20 : 0;
    if (contrib > 0) {
      anomalies.push({
        sensorName: 'Độ Rung Động Cơ Khí (Vibration)',
        sensorKey: 'vibration',
        currentValue: t.vibration,
        nominalRange: n.vibration,
        unit: 'mm/s',
        severity,
        contributionPercentage: contrib,
        description: `Rung động ${t.vibration} mm/s vượt ngưỡng an toàn (${maxVib} mm/s) - nguy cơ kẹt cơ khí dẫn hướng trục Z hoặc rơ trượt bi.`,
      });
    }
  }

  // 2. Dielectric Temperature
  if (t.dielectricTemp !== undefined && n.dielectricTemp) {
    const [minTemp, maxTemp] = n.dielectricTemp;
    const isCrit = t.dielectricTemp > maxTemp + 4.5;
    const isWarn = t.dielectricTemp > maxTemp;
    const severity = isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : 'NORMAL';
    const contrib = isCrit ? 30 : isWarn ? 18 : 0;
    if (contrib > 0) {
      anomalies.push({
        sensorName: 'Nhiệt Độ Dung Môi Điện Môi (Dielectric Temp)',
        sensorKey: 'dielectricTemp',
        currentValue: t.dielectricTemp,
        nominalRange: n.dielectricTemp,
        unit: '°C',
        severity,
        contributionPercentage: contrib,
        description: `Nhiệt độ ${t.dielectricTemp}°C cao hơn ngưỡng chuẩn (${maxTemp}°C) - dễ dẫn tới thoái hóa chất điện môi & quá nhiệt IGBT.`,
      });
    }
  }

  // 3. Dielectric Pressure
  if (t.dielectricPressure !== undefined && n.dielectricPressure) {
    const [minPress, maxPress] = n.dielectricPressure;
    const isCrit = t.dielectricPressure < minPress * 0.65;
    const isWarn = t.dielectricPressure < minPress;
    const severity = isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : 'NORMAL';
    const contrib = isCrit ? 30 : isWarn ? 15 : 0;
    if (contrib > 0) {
      anomalies.push({
        sensorName: 'Áp Suất Bơm Nước / Dung Môi (Pressure)',
        sensorKey: 'dielectricPressure',
        currentValue: t.dielectricPressure,
        nominalRange: n.dielectricPressure,
        unit: 'Bar',
        severity,
        contributionPercentage: contrib,
        description: `Áp suất ${t.dielectricPressure} Bar thấp hơn ngưỡng tối thiểu (${minPress} Bar) - nguy cơ tắc lõi lọc hoặc bọt khí bơm.`,
      });
    }
  }

  // 4. Wire Tension
  if (t.wireTension !== undefined && n.wireTension) {
    const [minTen, maxTen] = n.wireTension;
    const isCrit = t.wireTension < minTen * 0.7 || t.wireTension > maxTen * 1.3;
    const isWarn = t.wireTension < minTen || t.wireTension > maxTen;
    const severity = isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : 'NORMAL';
    const contrib = isCrit ? 25 : isWarn ? 14 : 0;
    if (contrib > 0) {
      anomalies.push({
        sensorName: 'Lực Căng Dây Cắt EDM (Wire Tension)',
        sensorKey: 'wireTension',
        currentValue: t.wireTension,
        nominalRange: n.wireTension,
        unit: 'N',
        severity,
        contributionPercentage: contrib,
        description: `Lực căng ${t.wireTension} N ngoài dải chuẩn [${minTen} - ${maxTen} N] - nguy cơ cao gây đứt dây cắt (E-102).`,
      });
    }
  }

  // 5. Conductivity
  if (t.conductivity !== undefined) {
    const maxCond = 15; // standard max 15 uS/cm
    const isCrit = t.conductivity > 22;
    const isWarn = t.conductivity > maxCond;
    const severity = isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : 'NORMAL';
    const contrib = isCrit ? 25 : isWarn ? 12 : 0;
    if (contrib > 0) {
      anomalies.push({
        sensorName: 'Độ Dẫn Điện Nước Ion (Conductivity)',
        sensorKey: 'conductivity',
        currentValue: t.conductivity,
        nominalRange: [0, 15],
        unit: 'µS/cm',
        severity,
        contributionPercentage: contrib,
        description: `Độ dẫn ${t.conductivity} µS/cm vượt ngưỡng bão hòa ion (>15 µS/cm) - nhựa trao đổi ion deion đã suy giảm.`,
      });
    }
  }

  // 6. Discharge Voltage / Spark Stability
  if (t.dischargeVoltage !== undefined && n.dischargeVoltage) {
    const [minV, maxV] = n.dischargeVoltage;
    const isCrit = t.dischargeVoltage < minV * 0.7 || t.dischargeVoltage > maxV * 1.3;
    const isWarn = t.dischargeVoltage < minV || t.dischargeVoltage > maxV;
    const severity = isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : 'NORMAL';
    const contrib = isCrit ? 28 : isWarn ? 14 : 0;
    if (contrib > 0) {
      anomalies.push({
        sensorName: 'Điện Áp Khe Phóng Điện (Discharge Voltage)',
        sensorKey: 'dischargeVoltage',
        currentValue: t.dischargeVoltage,
        nominalRange: n.dischargeVoltage,
        unit: 'V',
        severity,
        contributionPercentage: contrib,
        description: `Điện áp phóng ${t.dischargeVoltage} V biến động bất thường ngoài khoảng [${minV} - ${maxV} V] - nguy cơ ngắn mạch hồ quang.`,
      });
    }
  }

  return anomalies.sort((a, b) => b.contributionPercentage - a.contributionPercentage);
}

/**
 * Predicts the 48-hour failure probability curve for a single machine
 * based on current telemetry deviations, 500h service interval wear, and status.
 */
export function calculateMachine48hProbability(
  device: Device,
  serviceHoursProgress: number = 50
): Machine48hPrediction {
  const anomalies = evaluateSensorAnomalies(device);

  // Base starting probability at T+0h
  let baseProbability = 8; // Healthy baseline

  if (device.status === 'ALARM_STOPPED') {
    baseProbability = 95;
  } else if (device.status === 'WARNING') {
    baseProbability = 52;
  } else if (device.status === 'MAINTENANCE') {
    baseProbability = 20;
  } else if (device.status === 'IDLE') {
    baseProbability = 12;
  }

  // Sum up sensor anomaly penalties
  const anomalyPenalty = anomalies.reduce((sum, a) => sum + a.contributionPercentage * 0.65, 0);
  baseProbability += anomalyPenalty;

  // Operating service interval factor (0 to 100% progress of 500h cycle)
  if (serviceHoursProgress > 90) {
    baseProbability += 15;
  } else if (serviceHoursProgress > 75) {
    baseProbability += 8;
  }

  // Historical incidents penalty
  baseProbability += (device.incidentHistoryCount || 0) * 3.5;
  baseProbability = Math.min(96, Math.max(5, Math.round(baseProbability)));

  // Generate hourly time series points for 48 hours (every 4 hours: 0, 4, 8, ... 48)
  const hourSteps = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48];
  const hourlyPoints: HourlyProbabilityPoint[] = [];

  let peakProb = baseProbability;
  let peakHour = 0;
  let firstCriticalHour: number | undefined = undefined;

  // Determine dominant sensor factor description
  const dominantFactor =
    anomalies.length > 0
      ? `${anomalies[0].sensorName} (${anomalies[0].currentValue} ${anomalies[0].unit})`
      : serviceHoursProgress > 80
      ? `Chu kỳ vận hành sắp chạm mốc bảo dưỡng (${Math.round(serviceHoursProgress)}% mốc 500h)`
      : 'Thông số cảm biến nằm trong phạm vi ổn định';

  // Primary predicted error code
  let primaryErrorCode = 'E-102 (Đứt dây cắt)';
  if (anomalies.length > 0) {
    const topKey = anomalies[0].sensorKey;
    if (topKey === 'vibration') primaryErrorCode = 'AXIS-Z (Kẹt cơ khí dẫn hướng & rơ bi)';
    else if (topKey === 'dielectricPressure') primaryErrorCode = 'ALARM-204 (Tụt áp suất bơm dung môi)';
    else if (topKey === 'dielectricTemp') primaryErrorCode = 'SPW-303 (Quá nhiệt IGBT & nguồn xung)';
    else if (topKey === 'conductivity') primaryErrorCode = 'DIE-201 (Nhựa Deion bão hòa)';
    else if (topKey === 'wireTension') primaryErrorCode = 'E-102 (Đứt dây cắt do dao động lực căng)';
  }

  hourSteps.forEach((hour) => {
    const { displayTime, shiftLabel } = getFutureTimeInfo(hour);

    // Dynamic modeling over 48 hours:
    // Sensor degradation compounds during night shift (hours 16-24 & 40-48) due to ambient shifts and unmanned load
    const isNightShift = (hour >= 16 && hour <= 24) || (hour >= 40 && hour <= 48);
    const nightShiftPenalty = isNightShift ? 6.5 : 0;

    // Linear wear progression if sensor anomalies already exist
    const compoundRate = anomalies.length > 0 ? 0.65 : 0.25;
    let projectedProb = baseProbability + hour * compoundRate + nightShiftPenalty;

    // Add deterministic natural oscillation based on device ID to give realistic organic curve
    const idSeed = device.id.charCodeAt(device.id.length - 1) % 5;
    const wave = Math.sin((hour + idSeed) / 3.8) * 4;
    projectedProb += wave;

    // Boundary constraints
    projectedProb = Math.min(99, Math.max(4, Math.round(projectedProb)));

    if (projectedProb > peakProb) {
      peakProb = projectedProb;
      peakHour = hour;
    }

    if (projectedProb >= 65 && firstCriticalHour === undefined) {
      firstCriticalHour = hour;
    }

    let riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
    if (projectedProb >= 65) riskLevel = 'CRITICAL';
    else if (projectedProb >= 30) riskLevel = 'WARNING';

    const contributingFactorsList: string[] = [];
    anomalies.slice(0, 2).forEach((a) => {
      contributingFactorsList.push(`${a.sensorName}: ${a.currentValue} ${a.unit}`);
    });
    if (hour >= 24) {
      contributingFactorsList.push(`Tích lũy ma sát và suy giảm dầu bôi trơn sau ${hour}h`);
    }

    let recommendedAction = 'Giám sát telemetry cảm biến chu kỳ 1h/lần';
    if (projectedProb >= 75) {
      recommendedAction = `DỪNG MÁY PHÒNG NGỪA: Hiệu chỉnh ngay lỗi ${primaryErrorCode}`;
    } else if (projectedProb >= 50) {
      recommendedAction = `Vệ sinh cụm dẫn hướng & bổ sung dung môi làm nguội trước T+${hour}h`;
    }

    hourlyPoints.push({
      hourOffset: hour,
      timeLabel: `T+${hour}h`,
      displayTime,
      shiftLabel,
      probability: projectedProb,
      riskLevel,
      primarySensorDriver: dominantFactor,
      contributingFactors: contributingFactorsList,
      projectedErrorCode: primaryErrorCode,
      recommendedAction,
    });
  });

  const overallRiskLevel: 'SAFE' | 'WARNING' | 'CRITICAL' =
    peakProb >= 65 ? 'CRITICAL' : peakProb >= 30 ? 'WARNING' : 'SAFE';

  let suggestedInterventionWindow = 'Trong vòng 48h (Duy trì chế độ vận hành chuẩn)';
  if (firstCriticalHour !== undefined) {
    suggestedInterventionWindow = `Can thiệp TRƯỚC T+${Math.max(2, firstCriticalHour - 4)}h để ngăn dừng máy ngoài ý muốn`;
  } else if (peakProb >= 50) {
    suggestedInterventionWindow = `Kiểm tra bảo dưỡng đầu ca 2 (trước T+${peakHour}h)`;
  }

  return {
    deviceId: device.id,
    deviceCode: device.code,
    deviceName: device.name,
    currentProbability: baseProbability,
    peakProbability: peakProb,
    peakHourOffset: peakHour,
    peakTimeLabel: `T+${peakHour}h`,
    overallRiskLevel,
    hoursUntilCriticalThreshold: firstCriticalHour,
    dominantSensorFactor: dominantFactor,
    topAnomalies: anomalies,
    suggestedInterventionWindow,
    hourlyPoints,
  };
}

/**
 * Computes full fleet 48-hour incident probability predictions and averages
 */
export function calculateFleet48hPredictions(devices: Device[]): Fleet48hPredictionSummary {
  const intervals = getAllMachineServiceIntervals(devices);
  const intervalMap = new Map(intervals.map((i) => [i.deviceId, i.progressPercentage]));

  const machinePredictions = devices.map((dev) => {
    const progress = intervalMap.get(dev.id) || 50;
    return calculateMachine48hProbability(dev, progress);
  });

  const hourSteps = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48];
  let fleetPeakProb = 0;
  let fleetPeakHour = 0;

  const fleetAveragePoints = hourSteps.map((hour) => {
    const { displayTime } = getFutureTimeInfo(hour);
    let totalProb = 0;
    let maxMachineProb = 0;
    let maxMachineCode = '';

    machinePredictions.forEach((mp) => {
      const pt = mp.hourlyPoints.find((p) => p.hourOffset === hour);
      if (pt) {
        totalProb += pt.probability;
        if (pt.probability > maxMachineProb) {
          maxMachineProb = pt.probability;
          maxMachineCode = mp.deviceCode;
        }
      }
    });

    const avgProb = Math.round(totalProb / Math.max(1, machinePredictions.length));
    if (avgProb > fleetPeakProb) {
      fleetPeakProb = avgProb;
      fleetPeakHour = hour;
    }

    return {
      hourOffset: hour,
      timeLabel: `T+${hour}h`,
      displayTime,
      fleetAvgProbability: avgProb,
      highestMachineProbability: maxMachineProb,
      highestMachineCode: maxMachineCode,
    };
  });

  const highRiskCount = machinePredictions.filter((m) => m.peakProbability >= 65).length;
  const moderateRiskCount = machinePredictions.filter(
    (m) => m.peakProbability >= 30 && m.peakProbability < 65
  ).length;
  const safeCount = machinePredictions.filter((m) => m.peakProbability < 30).length;

  return {
    fleetAveragePoints,
    peakFleetProbability: fleetPeakProb,
    peakFleetHourOffset: fleetPeakHour,
    highRiskMachineCount: highRiskCount,
    moderateRiskMachineCount: moderateRiskCount,
    safeMachineCount: safeCount,
    machines: machinePredictions,
  };
}
