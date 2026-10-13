export interface MachineQuickNote {
  id: string;
  deviceId: string;
  technicianName: string;
  shift: string;
  createdAt: string;
  content: string;
  urgency: 'NORMAL' | 'IMPORTANT' | 'CRITICAL_HANDOVER';
  isPinned: boolean;
  acknowledgedByNextShift: boolean;
  acknowledgedAt?: string;
  acknowledgedTechName?: string;
  checklist?: { id: string; label: string; checked: boolean }[];
  tags?: string[];
}

const STORAGE_PREFIX = 'edm_quick_notes_device_';

export const INITIAL_QUICK_NOTES: Record<string, MachineQuickNote[]> = {
  'dev-01': [
    {
      id: 'qn-01-1',
      deviceId: 'dev-01',
      technicianName: 'Nguyễn Văn Hùng',
      shift: 'Ca 2 (Chiều - 14:00-22:00)',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      content: 'Đã hoàn tất gia công phôi SKD11 khuôn ép nhựa. Áp suất bơm dung dịch điện môi hơi tụt nhẹ về 1.15 bar ở chu kỳ cuối, ca đêm chú ý kiểm tra đồng hồ áp lực sau mỗi 2 giờ vận hành.',
      urgency: 'IMPORTANT',
      isPinned: true,
      acknowledgedByNextShift: false,
      checklist: [
        { id: 'c1', label: 'Đã châm thêm 15L nước Deion vào bể phụ', checked: true },
        { id: 'c2', label: 'Đã xả cặn thùng lọc phôi EDM', checked: true },
        { id: 'c3', label: 'Ca đêm kiểm tra cuộn dây đồng (còn ~40%)', checked: false },
      ],
      tags: ['Áp suất bơm', 'Phôi SKD11', 'Ca đêm lưu ý'],
    },
    {
      id: 'qn-01-2',
      deviceId: 'dev-01',
      technicianName: 'Trần Đình Trọng',
      shift: 'Ca 1 (Sáng - 06:00-14:00)',
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      content: 'Đã hiệu chuẩn độ căng dây 12.5 N và làm sạch bộ dẫn hướng kim cương trên. Máy cắt rất êm, độ bóng bề mặt Ra 0.35 um đạt chuẩn nghiệm thu.',
      urgency: 'NORMAL',
      isPinned: false,
      acknowledgedByNextShift: true,
      acknowledgedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      acknowledgedTechName: 'Nguyễn Văn Hùng',
      checklist: [
        { id: 'c4', label: 'Vệ sinh đầu dẫn kim cương', checked: true },
        { id: 'c5', label: 'Căn chỉnh tọa độ gốc phôi G54', checked: true },
      ],
      tags: ['Hiệu chuẩn', 'Kim cương dẫn hướng'],
    },
  ],
  'dev-02': [
    {
      id: 'qn-02-1',
      deviceId: 'dev-02',
      technicianName: 'Lê Hoàng Nam',
      shift: 'Ca 2 (Chiều - 14:00-22:00)',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      content: 'Bộ lọc lọc dầu xỉ vừa báo áp suất chênh lệch 0.4 bar. Đã chuẩn bị sẵn 2 lõi lọc mới mã SF-208 tại kệ B2. Nếu ca đêm chạy khuôn nhôm liên tục thì cần thay giữa ca.',
      urgency: 'CRITICAL_HANDOVER',
      isPinned: true,
      acknowledgedByNextShift: false,
      checklist: [
        { id: 'c1', label: 'Lõi lọc dự phòng SF-208 sẵn sàng tại kệ B2', checked: true },
        { id: 'c2', label: 'Cần kiểm tra độ dẫn điện nước Deion < 15 uS/cm', checked: false },
      ],
      tags: ['Thay lõi lọc', 'Kệ B2', 'Bàn giao khẩn'],
    },
  ],
  'dev-03': [
    {
      id: 'qn-03-1',
      deviceId: 'dev-03',
      technicianName: 'Phạm Minh Tuấn',
      shift: 'Ca 1 (Sáng - 06:00-14:00)',
      createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      content: 'Điện cực đồng đỏ E-350 đã hoàn tất xung tinh hốc khuôn số 4. Ca sau tiếp tục set up điện cực than chì E-351 để xung thô hốc số 5.',
      urgency: 'NORMAL',
      isPinned: false,
      acknowledgedByNextShift: true,
      acknowledgedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      acknowledgedTechName: 'Trần Đình Trọng',
      checklist: [
        { id: 'c1', label: 'Đo kiểm độ hao mòn điện cực đồng < 0.02mm', checked: true },
        { id: 'c2', label: 'Rà gá phôi số 5 trên bàn từ', checked: true },
      ],
      tags: ['Điện cực đồng', 'Gá phôi'],
    },
  ],
};

export function getDeviceQuickNotes(deviceId: string): MachineQuickNote[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${deviceId}`);
    if (!raw) {
      const initial = INITIAL_QUICK_NOTES[deviceId] || [
        {
          id: `qn-init-${deviceId}`,
          deviceId,
          technicianName: 'Kỹ Thuật Viên Ca Trực',
          shift: 'Ca 1 (Sáng)',
          createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
          content: 'Thiết bị hoạt động ổn định, thông số thủy lực và xung điện nằm trong dải kiểm soát tối ưu. Đã kiểm tra dầu bôi trơn ray trượt.',
          urgency: 'NORMAL',
          isPinned: false,
          acknowledgedByNextShift: true,
          checklist: [
            { id: 'init-c1', label: 'Kiểm tra mức dầu bôi trơn trục X/Y/Z', checked: true },
            { id: 'init-c2', label: 'Vệ sinh bàn máy sau ca làm', checked: true },
          ],
          tags: ['Kiểm tra ban đầu'],
        },
      ];
      localStorage.setItem(`${STORAGE_PREFIX}${deviceId}`, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to get quick notes for device:', deviceId, err);
    return INITIAL_QUICK_NOTES[deviceId] || [];
  }
}

export function saveDeviceQuickNotes(deviceId: string, notes: MachineQuickNote[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${deviceId}`, JSON.stringify(notes));
    window.dispatchEvent(new CustomEvent('edm_quick_notes_updated', { detail: { deviceId, notes } }));
  } catch (err) {
    console.error('Failed to save quick notes for device:', deviceId, err);
  }
}

export function addDeviceQuickNote(deviceId: string, note: Omit<MachineQuickNote, 'id' | 'createdAt'>): MachineQuickNote {
  const existing = getDeviceQuickNotes(deviceId);
  const newNote: MachineQuickNote = {
    ...note,
    id: `qn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newNote, ...existing];
  saveDeviceQuickNotes(deviceId, updated);
  return newNote;
}

export function toggleAcknowledgeQuickNote(
  deviceId: string,
  noteId: string,
  techName: string = 'KTV Tiếp Nhận Ca'
): MachineQuickNote[] {
  const existing = getDeviceQuickNotes(deviceId);
  const updated = existing.map((note) => {
    if (note.id === noteId) {
      const isAck = !note.acknowledgedByNextShift;
      return {
        ...note,
        acknowledgedByNextShift: isAck,
        acknowledgedAt: isAck ? new Date().toISOString() : undefined,
        acknowledgedTechName: isAck ? techName : undefined,
      };
    }
    return note;
  });
  saveDeviceQuickNotes(deviceId, updated);
  return updated;
}

export function togglePinQuickNote(deviceId: string, noteId: string): MachineQuickNote[] {
  const existing = getDeviceQuickNotes(deviceId);
  const updated = existing.map((note) => {
    if (note.id === noteId) {
      return { ...note, isPinned: !note.isPinned };
    }
    return note;
  });
  saveDeviceQuickNotes(deviceId, updated);
  return updated;
}

export function deleteQuickNote(deviceId: string, noteId: string): MachineQuickNote[] {
  const existing = getDeviceQuickNotes(deviceId);
  const updated = existing.filter((note) => note.id !== noteId);
  saveDeviceQuickNotes(deviceId, updated);
  return updated;
}
