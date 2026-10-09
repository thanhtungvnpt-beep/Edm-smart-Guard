import { Device } from '../types';

export interface DeviceOperationalMetrics {
  // Temperature
  temperature: number; // °C (dielectric fluid / spindle / generator temp)
  tempNominalRange: [number, number]; // [min, max]
  isTempOverheating: boolean; // temp >= max nominal or > 26°C
  tempStatus: 'NORMAL' | 'ELEVATED' | 'OVERHEATING';

  // Power Consumption
  powerKw: number; // Real-time active power draw in kW
  nominalPowerKw: [number, number]; // Expected power band [min, max]
  powerStatus: 'NORMAL' | 'OVERCONSUMPTION' | 'IDLE_SAVING' | 'SURGE_SPIKE';
  powerFactor: number; // e.g. 0.92

  // Operating Hours / Uptime
  continuousUptimeHours: number; // Hours continuously running in current cycle (e.g. 14.5 hrs)
  totalOperatingHours: number; // Cumulative runtime odometer from machine controller (e.g. 4235 hrs)
  isLongRunWarning: boolean; // Continuous runtime > 18 hours or > 24 hours without cool-down
  
  // Urgent Maintenance Score (0 - 100)
  urgencyScore: number;
  urgencyReasons: string[];
  isUrgentMaintenanceNeeded: boolean;

  // Machine Reliability & Health Score (0 - 100%)
  reliabilityHealthScore: number;
}

/**
 * Calculates deterministic, realistic operating metrics for a machine
 * combining real-time telemetry (temp, voltage, current) with model-specific nominal specs.
 */
export function getDeviceOperationalMetrics(device: Device): DeviceOperationalMetrics {
  const telemetry = device.telemetry;
  const temp = telemetry.dielectricTemp || 21.0;
  const tempRange = device.nominalRanges.dielectricTemp || [19, 24];

  // 1. Temperature status
  let tempStatus: 'NORMAL' | 'ELEVATED' | 'OVERHEATING' = 'NORMAL';
  let isTempOverheating = false;

  if (temp > tempRange[1] + 2 || temp >= 28) {
    tempStatus = 'OVERHEATING';
    isTempOverheating = true;
  } else if (temp > tempRange[1]) {
    tempStatus = 'ELEVATED';
  }

  // 2. Power Consumption (kW)
  // Base power based on machine type + discharge electrical power (P = V * I) + auxiliary pumps/chiller
  let baseAuxiliaryKw = 2.4; // Base pumps, chiller unit, CNC controller
  if (device.type === 'SINKER_EDM') baseAuxiliaryKw = 3.2;
  else if (device.type === 'CNC_MILLING') baseAuxiliaryKw = 4.5;

  let activeKw = 0;
  if (device.status === 'RUNNING') {
    // Electrical discharge power: (dischargeVoltage * peakCurrent * dutyCycleFactor) / 1000
    // plus auxiliary hydraulic & chiller pump load
    const dischargeKw = (telemetry.dischargeVoltage * telemetry.peakCurrent * 0.45) / 1000;
    activeKw = Math.round((baseAuxiliaryKw + dischargeKw * 4.2) * 10) / 10;
  } else if (device.status === 'ALARM_STOPPED') {
    activeKw = 0.8; // Standby / fault power
  } else {
    activeKw = 1.2; // Idle state
  }

  // Nominal power ranges per machine type
  let nominalPowerMin = 4.0;
  let nominalPowerMax = 11.5;
  if (device.type === 'SINKER_EDM') {
    nominalPowerMin = 4.5;
    nominalPowerMax = 14.0;
  } else if (device.type === 'CNC_MILLING') {
    nominalPowerMin = 6.0;
    nominalPowerMax = 18.0;
  }

  let powerStatus: 'NORMAL' | 'OVERCONSUMPTION' | 'IDLE_SAVING' | 'SURGE_SPIKE' = 'NORMAL';
  if (device.status === 'RUNNING') {
    if (activeKw > nominalPowerMax) {
      powerStatus = 'OVERCONSUMPTION';
    } else if (telemetry.peakCurrent > (device.nominalRanges.peakCurrent[1] || 38)) {
      powerStatus = 'SURGE_SPIKE';
    }
  } else if (device.status === 'IDLE') {
    powerStatus = 'IDLE_SAVING';
  }

  // 3. Continuous Uptime & Total Operating Hours
  // Stable hash based on device ID so values remain consistent
  const charCodeSum = device.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  
  // Continuous running hours in current uninterrupted cycle:
  // dev-01: 26.4h (Long run overdue!), dev-02: 14.2h, dev-03: 31.8h (High continuous!), etc.
  let continuousUptimeHours = 0;
  if (device.status === 'RUNNING') {
    // Generate distinct realistic uptime for each machine
    const baseHourOffsets: Record<string, number> = {
      'dev-01': 28.5, // > 24h continuous operation
      'dev-02': 14.8,
      'dev-03': 33.2, // > 30h continuous
      'dev-04': 5.2,
      'dev-05': 19.6, // > 18h continuous
      'dev-06': 8.4,
    };
    continuousUptimeHours = baseHourOffsets[device.id] ?? ((charCodeSum % 25) + 6.5);
    // If technician performed 'Reset Service Counter', calculate elapsed time since reset
    if (device.serviceCounterResetAt) {
      const resetTime = new Date(device.serviceCounterResetAt).getTime();
      const diffHours = Math.max(0, (Date.now() - resetTime) / (1000 * 60 * 60));
      continuousUptimeHours = Math.round(diffHours * 10) / 10;
    }
  } else if (device.status === 'ALARM_STOPPED') {
    continuousUptimeHours = 0;
  } else {
    continuousUptimeHours = 1.2;
  }

  // Total operating hours (Odometer)
  const totalOperatingHoursBase: Record<string, number> = {
    'dev-01': 4280,
    'dev-02': 3820,
    'dev-03': 5140,
    'dev-04': 2960,
    'dev-05': 4870,
    'dev-06': 3410,
  };
  const totalOperatingHours = totalOperatingHoursBase[device.id] ?? (3000 + (charCodeSum % 2000));

  const isLongRunWarning = continuousUptimeHours >= 20;

  // 4. Urgency Score & Reasons for Prioritizing Urgent Maintenance
  const urgencyReasons: string[] = [];
  let urgencyScore = 0;

  if (device.status === 'ALARM_STOPPED') {
    urgencyScore += 60;
    urgencyReasons.push(`Đang dừng máy do sự cố ${device.activeIncident?.errorCode || 'khẩn cấp'}`);
  }

  if (tempStatus === 'OVERHEATING') {
    urgencyScore += 35;
    urgencyReasons.push(`Nhiệt độ ${temp.toFixed(1)}°C vượt ngưỡng an toàn (${tempRange[1]}°C)`);
  } else if (tempStatus === 'ELEVATED') {
    urgencyScore += 15;
    urgencyReasons.push(`Nhiệt độ ${temp.toFixed(1)}°C đang cao hơn mức khuyến nghị`);
  }

  if (powerStatus === 'OVERCONSUMPTION' || powerStatus === 'SURGE_SPIKE') {
    urgencyScore += 25;
    urgencyReasons.push(`Điện năng tiêu thụ cao (${activeKw.toFixed(1)} kW > ${nominalPowerMax} kW)`);
  }

  if (continuousUptimeHours >= 24) {
    urgencyScore += 25;
    urgencyReasons.push(`Chạy liên tục ${continuousUptimeHours.toFixed(1)}h chưa giải nhiệt/nghỉ ca`);
  } else if (continuousUptimeHours >= 18) {
    urgencyScore += 15;
    urgencyReasons.push(`Chạy liên tục ${continuousUptimeHours.toFixed(1)}h kéo dài`);
  }

  if (telemetry.dielectricPressure < (device.nominalRanges.dielectricPressure[0] || 1.0)) {
    urgencyScore += 20;
    urgencyReasons.push(`Áp suất dung môi tụt xuống ${telemetry.dielectricPressure.toFixed(2)} Bar`);
  }

  if (telemetry.vibration > (device.nominalRanges.vibration[1] || 1.5)) {
    urgencyScore += 20;
    urgencyReasons.push(`Độ rung cơ khí ${telemetry.vibration.toFixed(2)} mm/s bất thường`);
  }

  if (device.incidentHistoryCount >= 15) {
    urgencyScore += 10;
    urgencyReasons.push(`Tần suất lỗi cao (${device.incidentHistoryCount} lần)`);
  }

  const isUrgentMaintenanceNeeded = urgencyScore >= 40 || device.status === 'ALARM_STOPPED';

  // 5. Reliability / Health Score (0 - 100%)
  // Based on incident frequency, recent continuous uptime stability, status, and telemetry anomalies
  let reliabilityHealthScore = 100;

  // Incident frequency penalty (each incident in past 30 days reduces score)
  const incidentPenalty = Math.min(45, (device.incidentHistoryCount || 0) * 2.5);
  reliabilityHealthScore -= incidentPenalty;

  // Status penalty
  if (device.status === 'ALARM_STOPPED') {
    reliabilityHealthScore -= 38;
  } else if (device.status === 'WARNING') {
    reliabilityHealthScore -= 20;
  } else if (device.status === 'IDLE') {
    reliabilityHealthScore -= 5;
  }

  // Uptime impact: Normal uptime (6 - 18h) shows steady operation (+3 bonus)
  // Excessive continuous uptime (> 24h) causes wear penalty
  if (continuousUptimeHours >= 28) {
    reliabilityHealthScore -= 14;
  } else if (continuousUptimeHours >= 20) {
    reliabilityHealthScore -= 7;
  } else if (continuousUptimeHours >= 8 && continuousUptimeHours <= 18 && device.status === 'RUNNING') {
    reliabilityHealthScore += 3;
  }

  // OEE bonus / penalty
  const oee = telemetry.oee || 85;
  if (oee >= 92) reliabilityHealthScore += 4;
  else if (oee < 80) reliabilityHealthScore -= 8;

  // Overheating penalty
  if (isTempOverheating) reliabilityHealthScore -= 15;
  else if (tempStatus === 'ELEVATED') reliabilityHealthScore -= 6;

  reliabilityHealthScore = Math.min(100, Math.max(15, Math.round(reliabilityHealthScore)));

  return {
    temperature: temp,
    tempNominalRange: tempRange,
    isTempOverheating,
    tempStatus,
    powerKw: activeKw,
    nominalPowerKw: [nominalPowerMin, nominalPowerMax],
    powerStatus,
    powerFactor: 0.92,
    continuousUptimeHours,
    totalOperatingHours,
    isLongRunWarning,
    urgencyScore: Math.min(100, urgencyScore),
    urgencyReasons,
    isUrgentMaintenanceNeeded,
    reliabilityHealthScore,
  };
}
