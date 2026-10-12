import { WeeklyEmailScheduleConfig, WeeklyEmailReportDispatchLog, MaintenanceRecord } from '../types';

export const EMAIL_SCHEDULE_STORAGE_KEY = 'edm_weekly_email_schedule_config_v1';
export const EMAIL_LOGS_STORAGE_KEY = 'edm_weekly_email_dispatch_logs_v1';

export const DEFAULT_SCHEDULE_CONFIG: WeeklyEmailScheduleConfig = {
  enabled: true,
  recipientEmail: 'quanly.thang@factory-edm.vn',
  recipientName: 'Trần Đức Thắng',
  recipientRole: 'Giám Đốc Kỹ Thuật & Quản Lý Xưởng EDM',
  sendDayOfWeek: 5, // Thứ Sáu (Friday) cuối tuần
  sendHour: 17, // 17:00
  sendMinute: 0,
  reportFormat: 'BOTH', // Cả PDF & CSV
  includeOnlyCorrective: false,
  technicianSenderName: 'Nguyễn Văn Hùng (Kỹ sư Trưởng Bảo Trì)',
  customNotes:
    'Kính gửi Ban Quản Lý: Hệ thống tự động tổng hợp tình trạng vận hành và các sự cố dừng máy EDM trong tuần. Đề nghị Quản lý xem xét phụ tùng tiêu hao cần nhập thêm cho tuần tới.',
  lastRunAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  nextRunAt: calculateNextRunTime(5, 17, 0).toISOString(),
  totalSentCount: 3,
};

export const INITIAL_DISPATCH_LOGS: WeeklyEmailReportDispatchLog[] = [
  {
    id: 'dispatch-log-01',
    sentAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    recipientEmail: 'quanly.thang@factory-edm.vn',
    recipientName: 'Trần Đức Thắng',
    technicianSender: 'Nguyễn Văn Hùng (Kỹ sư Trưởng)',
    weekRange: 'Tuần W40 (28/09 - 04/10/2026)',
    totalIncidents: 4,
    criticalCount: 2,
    totalDowntimeHours: 4.8,
    estimatedCostVND: 12500000,
    reportFormat: 'BOTH',
    triggerType: 'AUTOMATIC_CRON',
    status: 'DELIVERED',
    deliveryReceiptId: 'REC-SMTP-20261004-9842',
    previewSummary:
      'Gửi tự động định kỳ cuối tuần Thứ 6 lúc 17:00: Tổng 4 sự cố (2 dừng máy khẩn cấp), hoàn tất nghiệm thu 100%. File đính kèm: Bao_Cao_W40.pdf, Bao_Cao_W40.csv',
  },
  {
    id: 'dispatch-log-02',
    sentAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    recipientEmail: 'quanly.thang@factory-edm.vn',
    recipientName: 'Trần Đức Thắng',
    technicianSender: 'Lê Hoàng Nam (Chuyên gia EDM)',
    weekRange: 'Tuần W39 (21/09 - 27/09/2026)',
    totalIncidents: 3,
    criticalCount: 1,
    totalDowntimeHours: 3.2,
    estimatedCostVND: 8600000,
    reportFormat: 'PDF',
    triggerType: 'AUTOMATIC_CRON',
    status: 'DELIVERED',
    deliveryReceiptId: 'REC-SMTP-20260927-4182',
    previewSummary:
      'Gửi tự động định kỳ cuối tuần: Tổng 3 sự cố, thay thế cụm dẫn hướng kim cương P-104 và lọc nước ion. File đính kèm: Bao_Cao_W39.pdf',
  },
  {
    id: 'dispatch-log-03',
    sentAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    recipientEmail: 'quanly.thang@factory-edm.vn',
    recipientName: 'Trần Đức Thắng',
    technicianSender: 'Nguyễn Văn Hùng (Kỹ sư Trưởng)',
    weekRange: 'Tuần W38 (14/09 - 20/09/2026)',
    totalIncidents: 2,
    criticalCount: 1,
    totalDowntimeHours: 2.1,
    estimatedCostVND: 4900000,
    reportFormat: 'BOTH',
    triggerType: 'MANUAL_TEST',
    status: 'DELIVERED',
    deliveryReceiptId: 'REC-SMTP-20260920-1109',
    previewSummary:
      'KTV kiểm tra gửi thử nghiệm qua email: Báo cáo khắc phục bơm dung môi áp lực và dây curoa Grundfos. File đính kèm: Bao_Cao_W38.pdf, Bao_Cao_W38.csv',
  },
];

/**
 * Calculates the next occurrence of a weekly day-of-week and time
 * dayOfWeek: 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
 */
export function calculateNextRunTime(dayOfWeek: number, hour: number, minute: number): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);

  const currentDay = now.getDay();
  let diff = dayOfWeek - currentDay;

  // If today is the target day but time has already passed, schedule for next week
  if (diff < 0 || (diff === 0 && now.getTime() >= next.getTime())) {
    diff += 7;
  }

  next.setDate(now.getDate() + diff);
  return next;
}

/**
 * Get stored schedule configuration
 */
export function getStoredScheduleConfig(): WeeklyEmailScheduleConfig {
  try {
    const raw = localStorage.getItem(EMAIL_SCHEDULE_STORAGE_KEY);
    if (!raw) {
      saveScheduleConfig(DEFAULT_SCHEDULE_CONFIG);
      return DEFAULT_SCHEDULE_CONFIG;
    }
    const parsed = JSON.parse(raw);
    // Recalculate nextRunAt to ensure it's always in future
    parsed.nextRunAt = calculateNextRunTime(
      parsed.sendDayOfWeek ?? 5,
      parsed.sendHour ?? 17,
      parsed.sendMinute ?? 0
    ).toISOString();
    return parsed;
  } catch (e) {
    console.error('Failed to load email schedule config:', e);
    return DEFAULT_SCHEDULE_CONFIG;
  }
}

/**
 * Save schedule configuration
 */
export function saveScheduleConfig(config: WeeklyEmailScheduleConfig): void {
  try {
    config.nextRunAt = calculateNextRunTime(
      config.sendDayOfWeek,
      config.sendHour,
      config.sendMinute
    ).toISOString();
    localStorage.setItem(EMAIL_SCHEDULE_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save email schedule config:', e);
  }
}

/**
 * Get stored dispatch logs
 */
export function getStoredDispatchLogs(): WeeklyEmailReportDispatchLog[] {
  try {
    const raw = localStorage.getItem(EMAIL_LOGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EMAIL_LOGS_STORAGE_KEY, JSON.stringify(INITIAL_DISPATCH_LOGS));
      return INITIAL_DISPATCH_LOGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load email dispatch logs:', e);
    return INITIAL_DISPATCH_LOGS;
  }
}

/**
 * Append a dispatch log
 */
export function appendDispatchLog(log: WeeklyEmailReportDispatchLog): WeeklyEmailReportDispatchLog[] {
  try {
    const existing = getStoredDispatchLogs();
    const updated = [log, ...existing].slice(0, 50); // Keep last 50 logs
    localStorage.setItem(EMAIL_LOGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to append dispatch log:', e);
    return [log];
  }
}

/**
 * Generate human-readable day of week name in Vietnamese
 */
export function getDayOfWeekName(day: number): string {
  switch (day) {
    case 0:
      return 'Chủ Nhật';
    case 1:
      return 'Thứ Hai';
    case 2:
      return 'Thứ Ba';
    case 3:
      return 'Thứ Tư';
    case 4:
      return 'Thứ Năm';
    case 5:
      return 'Thứ Sáu';
    case 6:
      return 'Thứ Bảy';
    default:
      return 'Thứ Sáu';
  }
}

/**
 * Filter records for the previous 7 days (or custom range) for weekly email report
 */
export function getWeeklyRecordsForEmail(
  records: MaintenanceRecord[],
  days: number = 7,
  onlyCorrective: boolean = false
): MaintenanceRecord[] {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return records.filter((r) => {
    const d = new Date(r.completedAt);
    if (d < start || d > end) return false;
    if (onlyCorrective && r.taskType !== 'CORRECTIVE') return false;
    return true;
  });
}
