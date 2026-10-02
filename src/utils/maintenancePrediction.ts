import { Device } from '../types';

export interface MaintenancePrediction {
  predictedDate: Date;
  predictedDateStr: string;
  daysRemaining: number;
  urgencyLevel: 'NORMAL' | 'UPCOMING' | 'URGENT' | 'IMMEDIATE';
  healthScore: number; // 0 - 100%
  primaryMaintenanceTask: string;
  heuristicRationale: string;
}

/**
 * Calculates the Predicted Next Maintenance Date for an EDM / CNC device
 * using a simple industrial heuristic based on:
 * - 30-day operating performance and OEE level
 * - Incident history count in past 30 days
 * - Current telemetry deviation from nominal ranges (vibration, pressure, temperature)
 * - Current operational status
 */
export function calculatePredictedMaintenance(device: Device): MaintenancePrediction {
  const now = new Date();

  // If currently in ALARM_STOPPED, urgent immediate maintenance is required
  if (device.status === 'ALARM_STOPPED') {
    return {
      predictedDate: now,
      predictedDateStr: 'Cần bảo dưỡng ngay',
      daysRemaining: 0,
      urgencyLevel: 'IMMEDIATE',
      healthScore: 35,
      primaryMaintenanceTask: 'Khắc phục sự cố khẩn cấp & kiểm tra toàn diện cụm phóng điện',
      heuristicRationale: `Máy đang dừng do lỗi ${device.activeIncident?.errorCode || 'hệ thống'}. Cần can thiệp bảo trì tức thì.`,
    };
  }

  // Base interval in days for standard EDM preventive maintenance cycle (typically 28 days)
  let baseDays = 24;

  // 1. Adjustment based on 30-day OEE (higher OEE with stable operation extends safe window, low OEE indicates issues)
  const oee = device.telemetry.oee || 85;
  if (oee >= 92) {
    baseDays += 4; // Well-maintained, running smoothly
  } else if (oee < 82) {
    baseDays -= 6; // Suboptimal operation, accelerated wear
  } else if (oee < 75) {
    baseDays -= 10;
  }

  // 2. Adjustment based on incident count in past 30 days
  const incidents = device.incidentHistoryCount || 0;
  if (incidents >= 4) {
    baseDays -= 8;
  } else if (incidents >= 2) {
    baseDays -= 4;
  } else if (incidents === 0) {
    baseDays += 2;
  }

  // 3. Adjustment based on mechanical/hydraulic stress telemetry
  // Check vibration
  const vibLimit = device.nominalRanges.vibration[1] || 1.2;
  const vibRatio = device.telemetry.vibration / vibLimit;
  if (vibRatio > 0.85) {
    baseDays -= 4; // High vibration signals mechanical bearing / guide wear
  }

  // Check dielectric pressure
  const minPressure = device.nominalRanges.dielectricPressure[0] || 1.0;
  if (device.telemetry.dielectricPressure <= minPressure * 1.1) {
    baseDays -= 3; // Filter clogging or pump wear
  }

  // Use device ID hash to create realistic staggered dates across factory devices
  const charCodeSum = device.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const offset = (charCodeSum % 7) - 3; // -3 to +3 days variation
  let daysRemaining = Math.max(1, baseDays + offset);

  // If status is WARNING
  if (device.status === 'WARNING') {
    daysRemaining = Math.min(daysRemaining, 3);
  }

  // Compute actual predicted calendar date
  const predictedDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
  const predictedDateStr = predictedDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Urgency level & Health Score
  let urgencyLevel: 'NORMAL' | 'UPCOMING' | 'URGENT' | 'IMMEDIATE' = 'NORMAL';
  let healthScore = 95;

  if (daysRemaining <= 2) {
    urgencyLevel = 'URGENT';
    healthScore = 52;
  } else if (daysRemaining <= 7) {
    urgencyLevel = 'UPCOMING';
    healthScore = 74;
  } else {
    urgencyLevel = 'NORMAL';
    healthScore = Math.min(98, 80 + Math.round(oee * 0.15));
  }

  // Primary task and rationale based on machine type
  let primaryMaintenanceTask = 'Thay lõi lọc điện môi & căn chỉnh dẫn hướng kim cương (Wire Guide)';
  if (device.type === 'SINKER_EDM') {
    primaryMaintenanceTask = 'Vệ sinh đầu cặp điện cực Erowa, thay lọc dầu & kiểm tra van xả servo Z';
  } else if (device.type === 'CNC_MILLING') {
    primaryMaintenanceTask = 'Bơm mỡ trục chính BBT40, kiểm tra độ căng dây đai & làm sạch ray trượt con lăn';
  } else if (device.type === 'HOLE_POPPER') {
    primaryMaintenanceTask = 'Thay gioăng xoay trục chính, kiểm tra ống dẫn đồng & lọc nước khử ion';
  }

  const heuristicRationale = `Ước tính từ OEE 30 ngày (${oee}%), ${incidents} lần dừng máy & độ rung cảm biến (${device.telemetry.vibration}mm/s).`;

  return {
    predictedDate,
    predictedDateStr,
    daysRemaining,
    urgencyLevel,
    healthScore,
    primaryMaintenanceTask,
    heuristicRationale,
  };
}
