import { Device } from '../types';

export interface MachineServiceIntervalInfo {
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  deviceType: string;
  deviceLocation: string;
  status: Device['status'];
  totalUsageHours: number;
  serviceIntervalCycleHours: number; // e.g., 500h standard EDM service interval
  hoursSinceLastService: number; // Accumulated hours in current service window
  hoursRemaining: number; // Hours left until scheduled maintenance
  progressPercentage: number; // 0 - 100% of the service interval elapsed
  estimatedDaysRemaining: number; // Estimated days at 16h/day operation
  urgency: 'OVERDUE' | 'URGENT' | 'UPCOMING' | 'NORMAL';
  serviceLevel: string; // e.g. "Bảo Dưỡng Cấp 2 (500h)"
  serviceTask: string;
  recommendedParts: string[];
  assignedTechnicianName: string;
}

/**
 * Deterministic baseline hours for machines in factory to ensure realistic,
 * consistent numbers that correlate with machine age and type.
 */
const BASE_USAGE_HOURS: Record<string, { totalHours: number; hoursSinceService: number; cycle: number }> = {
  'dev-01': { totalHours: 4895, hoursSinceService: 472, cycle: 500 }, // Makino U6: 28h left (URGENT)
  'dev-02': { totalHours: 3915, hoursSinceService: 488, cycle: 500 }, // Sodick ALC600G: 12h left (CRITICAL / URGENT)
  'dev-03': { totalHours: 2430, hoursSinceService: 360, cycle: 500 }, // AgieCharmilles: 140h left (NORMAL)
  'dev-04': { totalHours: 5240, hoursSinceService: 435, cycle: 500 }, // Fanuc Robocut: 65h left (UPCOMING)
  'dev-05': { totalHours: 1980, hoursSinceService: 210, cycle: 500 }, // DMG Mori CMX: 290h left (NORMAL)
  'dev-06': { totalHours: 3150, hoursSinceService: 495, cycle: 500 }, // Castek Hole: 5h left (URGENT/CRITICAL)
};

export function calculateMachineServiceInterval(device: Device): MachineServiceIntervalInfo {
  const base = BASE_USAGE_HOURS[device.id] || {
    totalHours: 3500,
    hoursSinceService: 320,
    cycle: 500,
  };

  const cycle = base.cycle;
  let hoursSinceLastService = base.hoursSinceService;
  let totalUsageHours = base.totalHours;

  // If machine is currently ALARM_STOPPED, it accelerates wear / requires immediate intervention
  if (device.status === 'ALARM_STOPPED') {
    hoursSinceLastService = cycle; // 100% due
  }

  const hoursRemaining = Math.max(0, cycle - hoursSinceLastService);
  const progressPercentage = Math.min(100, Math.round((hoursSinceLastService / cycle) * 100));
  const estimatedDaysRemaining = Math.max(0, Math.round((hoursRemaining / 16) * 10) / 10); // ~16 operational hours/day

  let urgency: MachineServiceIntervalInfo['urgency'] = 'NORMAL';
  if (hoursRemaining <= 0 || device.status === 'ALARM_STOPPED') {
    urgency = 'OVERDUE';
  } else if (hoursRemaining <= 36) {
    urgency = 'URGENT';
  } else if (hoursRemaining <= 100) {
    urgency = 'UPCOMING';
  }

  // Tailored service task based on machine model and type
  let serviceLevel = 'Bảo Dưỡng Định Kỳ Cấp 2 (500 Giờ Máy)';
  let serviceTask = 'Thay cặp lõi lọc áp suất cao 3µm & xoay mặt tiếp xúc bạc cấp điện 90°';
  let recommendedParts = ['Lõi lọc áp lực 3µm (FLT-EDM-300)', 'Bạc cấp điện Carbide (MK-U6-GD25)'];

  if (device.type === 'SINKER_EDM') {
    serviceLevel = 'Bảo Dưỡng Định Kỳ Trục Z & Thủy Lực (500 Giờ)';
    serviceTask = 'Vệ sinh ngàm bi kẹp điện cực Erowa ITS, thay lọc dầu & kiểm tra van xả servo';
    recommendedParts = ['Lọc dầu EDM 5µm (FLT-SNK-100)', 'Chổi quét tiếp mát than đồng (BRS-ERW-50)'];
  } else if (device.type === 'CNC_MILLING') {
    serviceLevel = 'Bảo Dưỡng Trục Chính & Băng Trượt (500 Giờ)';
    serviceTask = 'Bơm mỡ bôi trơn trục chính BBT40, làm sạch ray trượt con lăn & căn độ căng dây đai';
    recommendedParts = ['Mỡ bôi trơn Kluber NBU 15', 'Bộ phớt gạt phoi ray trượt (SLD-DMG-600)'];
  } else if (device.type === 'HOLE_POPPER') {
    serviceLevel = 'Bảo Dưỡng Đầu Khoan Cao Áp (500 Giờ)';
    serviceTask = 'Thay phớt xoay đầu kẹp ống đồng, xúc rửa bình khử khoáng ion & kiểm tra bơm 70 Bar';
    recommendedParts = ['Gioăng xoay cao áp Viton (SL-CST-70)', 'Ống dẫn hướng điện cực đồng 1.0mm'];
  }

  return {
    deviceId: device.id,
    deviceCode: device.code,
    deviceName: device.name,
    deviceType: device.type,
    deviceLocation: device.location,
    status: device.status,
    totalUsageHours,
    serviceIntervalCycleHours: cycle,
    hoursSinceLastService,
    hoursRemaining,
    progressPercentage,
    estimatedDaysRemaining,
    urgency,
    serviceLevel,
    serviceTask,
    recommendedParts,
    assignedTechnicianName: device.assignedTechnician?.name || 'Kỹ thuật viên ca trực',
  };
}

/**
 * Returns service interval information for all machines, sorted with most urgent first
 */
export function getAllMachineServiceIntervals(devices: Device[]): MachineServiceIntervalInfo[] {
  const intervals = devices.map(calculateMachineServiceInterval);

  // Sort by urgency severity: OVERDUE -> URGENT -> UPCOMING -> NORMAL
  const urgencyWeight: Record<MachineServiceIntervalInfo['urgency'], number> = {
    OVERDUE: 4,
    URGENT: 3,
    UPCOMING: 2,
    NORMAL: 1,
  };

  return intervals.sort((a, b) => {
    const diff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    if (diff !== 0) return diff;
    return a.hoursRemaining - b.hoursRemaining;
  });
}
