import { MaintenanceReminder } from '../types';

export const INITIAL_MAINTENANCE_REMINDERS: MaintenanceReminder[] = [
  // EDM-W01: Makino U6 H.E.A.T
  {
    id: 'remind-01',
    deviceId: 'dev-01',
    deviceCode: 'EDM-W01',
    deviceName: 'Makino U6 H.E.A.T (Wire EDM)',
    componentName: 'Lõi lọc nước ion & giấy 3-micron (Dielectric Filter)',
    componentType: 'FILTER',
    intervalType: 'CALENDAR_DAYS',
    intervalValue: 14,
    lastServicedDate: '2026-09-30',
    nextDueDate: '2026-10-14',
    currentOperatingHours: 4250,
    dueOperatingHours: 4450,
    priority: 'HIGH',
    notificationChannel: 'PUSH_NOTIFICATION',
    assignedTechnicianName: 'Lê Hoàng Nam',
    instructions:
      'Kiểm tra đồng hồ chênh áp qua bình lọc. Nếu áp suất vượt ngưỡng 0.25 MPa, tiến hành ngắt máy và thay cặp lõi lọc 3-micron mới.',
    isActive: true,
    createdAt: '2026-09-15T08:00:00Z',
  },
  {
    id: 'remind-02',
    deviceId: 'dev-01',
    deviceCode: 'EDM-W01',
    deviceName: 'Makino U6 H.E.A.T (Wire EDM)',
    componentName: 'Bơm nước làm mát & dung môi cao áp (Dielectric Coolant Pump)',
    componentType: 'PUMP',
    intervalType: 'CALENDAR_DAYS',
    intervalValue: 30,
    lastServicedDate: '2026-09-22',
    nextDueDate: '2026-10-22',
    currentOperatingHours: 4250,
    dueOperatingHours: 4650,
    priority: 'CRITICAL',
    notificationChannel: 'PUSH_NOTIFICATION',
    assignedTechnicianName: 'Nguyễn Văn Hùng',
    instructions:
      'Đo kiểm độ rung bạc đạn trục bơm, kiểm tra tình trạng rò rỉ tại phớt cơ khí Ceramic và đo áp suất xả đạt chuẩn 1.8 MPa.',
    isActive: true,
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'remind-03',
    deviceId: 'dev-01',
    deviceCode: 'EDM-W01',
    deviceName: 'Makino U6 H.E.A.T (Wire EDM)',
    componentName: 'Cụm dẫn hướng kim cương trên/dưới (Diamond Wire Guides)',
    componentType: 'GUIDE',
    intervalType: 'CALENDAR_DAYS',
    intervalValue: 21,
    lastServicedDate: '2026-09-22',
    nextDueDate: '2026-10-13',
    currentOperatingHours: 4250,
    dueOperatingHours: 4500,
    priority: 'HIGH',
    notificationChannel: 'PUSH_NOTIFICATION',
    assignedTechnicianName: 'Lê Hoàng Nam',
    instructions:
      'Tháo cụm kim cương làm sạch bằng bể rửa siêu âm, soi kính hiển vi kiểm tra mòn lỗ ø0.25mm và căn chỉnh đồng trục U-V.',
    isActive: true,
    createdAt: '2026-09-22T15:00:00Z',
  },

  // EDM-W02: Sodick ALC600G
  {
    id: 'remind-04',
    deviceId: 'dev-02',
    deviceCode: 'EDM-W02',
    deviceName: 'Sodick ALC600G (Linear Wire EDM)',
    componentName: 'Bơm nước làm mát tuần hoàn Chiller (Coolant Pump)',
    componentType: 'PUMP',
    intervalType: 'CALENDAR_DAYS',
    intervalValue: 30,
    lastServicedDate: '2026-09-18',
    nextDueDate: '2026-10-18',
    currentOperatingHours: 3580,
    dueOperatingHours: 3980,
    priority: 'HIGH',
    notificationChannel: 'PUSH_NOTIFICATION',
    assignedTechnicianName: 'Nguyễn Văn Hùng',
    instructions:
      'Kiểm tra quạt giải nhiệt bộ chiller, áp suất gas làm lạnh và lưu lượng bơm làm mát buồng gia công.',
    isActive: true,
    createdAt: '2026-09-18T12:00:00Z',
  },
  {
    id: 'remind-05',
    deviceId: 'dev-02',
    deviceCode: 'EDM-W02',
    deviceName: 'Sodick ALC600G (Linear Wire EDM)',
    componentName: 'Lõi lọc vi sợi 1-micron & Bình nhựa khử ion (Resin Filter)',
    componentType: 'FILTER',
    intervalType: 'CALENDAR_DAYS',
    intervalValue: 14,
    lastServicedDate: '2026-09-28',
    nextDueDate: '2026-10-12',
    currentOperatingHours: 3580,
    dueOperatingHours: 3750,
    priority: 'MEDIUM',
    notificationChannel: 'PUSH_NOTIFICATION',
    assignedTechnicianName: 'Trần Minh Đức',
    instructions:
      'Kiểm tra chỉ số điện trở suất nước (Resistivity). Nếu tụt dưới 50 kΩ.cm, tiến hành hoàn nguyên hoặc thay bình hạt nhựa ion mới.',
    isActive: true,
    createdAt: '2026-09-15T09:00:00Z',
  },

  // EDM-S01: GF AgieCharmilles FORM E 350
  {
    id: 'remind-06',
    deviceId: 'dev-03',
    deviceCode: 'EDM-S01',
    deviceName: 'GF AgieCharmilles FORM E 350',
    componentName: 'Bơm dầu xung điện môi cao áp & Van tỷ lệ (Dielectric Oil Pump)',
    componentType: 'PUMP',
    intervalType: 'CALENDAR_DAYS',
    intervalValue: 30,
    lastServicedDate: '2026-09-20',
    nextDueDate: '2026-10-20',
    currentOperatingHours: 2890,
    dueOperatingHours: 3290,
    priority: 'HIGH',
    notificationChannel: 'PUSH_NOTIFICATION',
    assignedTechnicianName: 'Phạm Quốc Tuấn',
    instructions:
      'Kiểm tra áp lực hút và xả dầu điện môi, làm sạch lưới chắn cặn đáy bể ngâm và kiểm tra độ nhạy van xả khẩn.',
    isActive: true,
    createdAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'remind-07',
    deviceId: 'dev-03',
    deviceCode: 'EDM-S01',
    deviceName: 'GF AgieCharmilles FORM E 350',
    componentName: 'Cặp phin lọc dầu ly tâm 5-micron (Oil Filters)',
    componentType: 'FILTER',
    intervalType: 'CALENDAR_DAYS',
    intervalValue: 14,
    lastServicedDate: '2026-09-25',
    nextDueDate: '2026-10-09',
    currentOperatingHours: 2890,
    dueOperatingHours: 3050,
    priority: 'CRITICAL',
    notificationChannel: 'PUSH_NOTIFICATION',
    assignedTechnicianName: 'Trần Minh Đức',
    instructions:
      'Kiểm tra độ nhớt và cặn than chì trong buồng lọc. Thay thế phin lọc khi kim chỉ thị bước vào vùng cảnh báo màu đỏ.',
    isActive: true,
    createdAt: '2026-09-25T11:00:00Z',
  },

  // EDM-W03: Fanuc Robocut α-C600iB
  {
    id: 'remind-08',
    deviceId: 'dev-04',
    deviceCode: 'EDM-W03',
    deviceName: 'Fanuc Robocut α-C600iB',
    componentName: 'Bơm xịt nước luồn dây áp lực cao AWF (High-Jet Water Pump)',
    componentType: 'PUMP',
    intervalType: 'CALENDAR_DAYS',
    intervalValue: 21,
    lastServicedDate: '2026-09-20',
    nextDueDate: '2026-10-11',
    currentOperatingHours: 3120,
    dueOperatingHours: 3350,
    priority: 'HIGH',
    notificationChannel: 'PUSH_NOTIFICATION',
    assignedTechnicianName: 'Lê Hoàng Nam',
    instructions:
      'Kiểm tra áp suất tia nước mồi xỏ dây tự động AWF đạt 1.5 MPa. Vệ sinh đầu kim phun áp lực cao.',
    isActive: true,
    createdAt: '2026-09-20T09:00:00Z',
  },
  {
    id: 'remind-09',
    deviceId: 'dev-04',
    deviceCode: 'EDM-W03',
    deviceName: 'Fanuc Robocut α-C600iB',
    componentName: 'Bộ lọc giấy kép Fanuc 3-micron (Dielectric Filters)',
    componentType: 'FILTER',
    intervalType: 'CALENDAR_DAYS',
    intervalValue: 14,
    lastServicedDate: '2026-09-26',
    nextDueDate: '2026-10-10',
    currentOperatingHours: 3120,
    dueOperatingHours: 3280,
    priority: 'MEDIUM',
    notificationChannel: 'PUSH_NOTIFICATION',
    assignedTechnicianName: 'Nguyễn Văn Hùng',
    instructions:
      'Đảo vị trí hoặc thay thế lõi lọc giấy. Xả cặn thùng lắng phoi đồng EDM.',
    isActive: true,
    createdAt: '2026-09-26T14:00:00Z',
  },

  // CNC-M01: DMG Mori CMX 600V
  {
    id: 'remind-10',
    deviceId: 'dev-05',
    deviceCode: 'CNC-M01',
    deviceName: 'DMG Mori CMX 600V (CNC VMC)',
    componentName: 'Bơm tưới nguội làm mát xuyên trục chính CTS (Through-Spindle Pump)',
    componentType: 'PUMP',
    intervalType: 'CALENDAR_DAYS',
    intervalValue: 30,
    lastServicedDate: '2026-09-14',
    nextDueDate: '2026-10-14',
    currentOperatingHours: 5400,
    dueOperatingHours: 5700,
    priority: 'HIGH',
    notificationChannel: 'PUSH_NOTIFICATION',
    assignedTechnicianName: 'Trần Minh Đức',
    instructions:
      'Kiểm tra áp lực bơm 20 Bar, màng lọc dầu tưới nguội và làm sạch phoi đọng trong bồn dung dịch.',
    isActive: true,
    createdAt: '2026-09-14T15:00:00Z',
  },

  // EDM-D01: Castek CNC ZNC-400
  {
    id: 'remind-11',
    deviceId: 'dev-06',
    deviceCode: 'EDM-D01',
    deviceName: 'Castek CNC ZNC-400 (EDM Hole Popper)',
    componentName: 'Bơm nước áp lực cao 70-Bar xả phoi (High-Pressure Flushing Pump)',
    componentType: 'PUMP',
    intervalType: 'CALENDAR_DAYS',
    intervalValue: 14,
    lastServicedDate: '2026-09-24',
    nextDueDate: '2026-10-08',
    currentOperatingHours: 2150,
    dueOperatingHours: 2300,
    priority: 'CRITICAL',
    notificationChannel: 'PUSH_NOTIFICATION',
    assignedTechnicianName: 'Phạm Quốc Tuấn',
    instructions:
      'Kiểm tra phớt nén piston bơm áp 70 bar, mức nước tinh khiết trong bồn cấp và làm sạch đầu lọc hút.',
    isActive: true,
    createdAt: '2026-09-24T16:00:00Z',
  },
];

const REMINDERS_STORAGE_KEY = 'edm_smartguard_maintenance_reminders_v1';

export function getStoredReminders(): MaintenanceReminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(INITIAL_MAINTENANCE_REMINDERS));
      return INITIAL_MAINTENANCE_REMINDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MAINTENANCE_REMINDERS;
  }
}

export function getDeviceMaintenanceReminders(deviceId: string): MaintenanceReminder[] {
  const all = getStoredReminders();
  return all.filter((r) => r.deviceId === deviceId);
}

export function saveMaintenanceReminder(reminder: MaintenanceReminder): MaintenanceReminder[] {
  try {
    const current = getStoredReminders();
    const existingIndex = current.findIndex((r) => r.id === reminder.id);
    let updated: MaintenanceReminder[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = reminder;
    } else {
      updated = [reminder, ...current];
    }

    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save maintenance reminder:', err);
    return INITIAL_MAINTENANCE_REMINDERS;
  }
}

export function deleteMaintenanceReminder(reminderId: string): MaintenanceReminder[] {
  try {
    const current = getStoredReminders();
    const updated = current.filter((r) => r.id !== reminderId);
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete maintenance reminder:', err);
    return INITIAL_MAINTENANCE_REMINDERS;
  }
}

export function toggleReminderActive(reminderId: string): MaintenanceReminder[] {
  try {
    const current = getStoredReminders();
    const updated = current.map((r) => (r.id === reminderId ? { ...r, isActive: !r.isActive } : r));
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to toggle maintenance reminder:', err);
    return INITIAL_MAINTENANCE_REMINDERS;
  }
}

/**
 * Calculates next due date given a starting date string and interval days
 */
export function calculateNextDueDate(startDateStr: string, intervalDays: number): string {
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) {
    const today = new Date();
    today.setDate(today.getDate() + intervalDays);
    return today.toISOString().split('T')[0];
  }
  date.setDate(date.getDate() + intervalDays);
  return date.toISOString().split('T')[0];
}
