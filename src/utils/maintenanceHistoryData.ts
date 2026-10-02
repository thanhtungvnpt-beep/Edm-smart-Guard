import { MaintenanceRecord } from '../types';

export const INITIAL_MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  // EDM-W01: Makino U6 H.E.A.T
  {
    id: 'maint-01',
    deviceId: 'dev-01',
    taskTitle: 'Bảo dưỡng định kỳ 500 giờ & Thay cụm dẫn hướng kim cương P-104',
    taskType: 'PREVENTIVE',
    completedAt: '2026-09-22T14:30:00Z',
    technicianName: 'Lê Hoàng Nam',
    technicianRole: 'Chuyên gia Cắt Dây EDM',
    durationMinutes: 95,
    partsReplaced: [
      'Bộ dẫn hướng kim cương trên/dưới 0.25mm (Diamond Wire Guide)',
      'Khối tiếp điện cacbua (Energizing Carbide Plate)',
      'Lõi lọc giấy ion 3-micron',
    ],
    findingsAndActions:
      'Cụm dẫn hướng kim cương trên có vết xước do xỉ mạ. Đã tháo rỡ, ngâm rửa siêu âm và thay mới bộ dẫn hướng kim cương 0.25mm. Căn chỉnh góc nghiêng U/V bằng thước chuẩn quang học.',
    technicianNotes: 'Độ chính xác cắt thẳng sau bảo dưỡng đạt 0.0015mm trên phôi mẫu thép SKD11.',
    operatingHoursAtMaintenance: 4210,
    qualityPassed: true,
    costEstimateVND: 6800000,
    aiVerified: true,
  },
  {
    id: 'maint-02',
    deviceId: 'dev-01',
    taskTitle: 'Khắc phục khẩn cấp đứt dây cắt & Súc rửa vòi phun áp lực cao (E-102)',
    taskType: 'CORRECTIVE',
    completedAt: '2026-09-12T09:15:00Z',
    technicianName: 'Nguyễn Văn Hùng',
    technicianRole: 'Kỹ sư Trưởng Bảo Trì',
    durationMinutes: 45,
    partsReplaced: [
      'Ống xả áp cao Upper Nozzle 4mm',
      'Gioăng cao su làm kín nắp buồng phun',
    ],
    findingsAndActions:
      'Vòi phun áp suất cao phía trên bị nghẹt 35% tiết diện do phoi sắt vụn. Áp suất xả chỉ đạt 0.7 MPa. Đã thông tắc bằng siêu âm, thay vòi mới và cân bằng áp lực đạt 1.8 MPa.',
    technicianNotes: 'Sau khắc phục, máy chạy liên tục 48 giờ không còn phát sinh đứt dây tại khe phóng điện.',
    operatingHoursAtMaintenance: 4140,
    qualityPassed: true,
    costEstimateVND: 2200000,
    aiVerified: true,
  },
  {
    id: 'maint-03',
    deviceId: 'dev-01',
    taskTitle: 'Hiệu chuẩn cảm biến áp lực dầu & Bơm mỡ thanh trượt trục X/Y',
    taskType: 'CALIBRATION',
    completedAt: '2026-08-28T16:00:00Z',
    technicianName: 'Trần Minh Đức',
    technicianRole: 'Kỹ thuật viên Cơ điện',
    durationMinutes: 60,
    partsReplaced: ['Mỡ bôi trơn chuyên dụng Kluber Isoflex NBU 15 (Tuýp 400g)'],
    findingsAndActions:
      'Bơm mỡ tự động cho 4 cụm block trượt THK trục X và Y. Đo kiểm độ rơ trục vít me bi (backlash): Trục X đạt 0.002mm, Trục Y đạt 0.002mm.',
    technicianNotes: 'Độ êm ái vận hành tốt, không phát sinh nhiệt dư thừa khi chạy chế độ Rapid 3000mm/phút.',
    operatingHoursAtMaintenance: 4020,
    qualityPassed: true,
    costEstimateVND: 1500000,
    aiVerified: false,
  },

  // EDM-W02: Sodick ALC600G
  {
    id: 'maint-04',
    deviceId: 'dev-02',
    taskTitle: 'Bảo dưỡng bơm dung môi áp lực & Thay thế phớt trục cơ khí Ceramic',
    taskType: 'PREVENTIVE',
    completedAt: '2026-09-18T11:20:00Z',
    technicianName: 'Lê Hoàng Nam',
    technicianRole: 'Chuyên gia Cắt Dây EDM',
    durationMinutes: 110,
    partsReplaced: [
      'Phớt cơ khí làm kín Ceramic Mechanical Seal 22mm',
      'Bộ lọc than hoạt tính hấp phụ hạt ion',
      'Dây curoa truyền động bơm Grundfos',
    ],
    findingsAndActions:
      'Phớt bơm cũ có dấu hiệu rỉ dầu nhẹ ra khay hứng. Đã tháo rỡ toàn bộ cụm buồng bơm, thay phớt gốm mới và cân chỉnh đồng trục động cơ.',
    technicianNotes: 'Áp lực bơm sau thay thế đạt 1.65 Bar ổn định, không còn bọt khí xâm thực.',
    operatingHoursAtMaintenance: 3580,
    qualityPassed: true,
    costEstimateVND: 4900000,
    aiVerified: true,
  },
  {
    id: 'maint-05',
    deviceId: 'dev-02',
    taskTitle: 'Vệ sinh tản nhiệt khối công suất IGBT & Thay quạt hút tủ điều khiển (SPW-303)',
    taskType: 'CORRECTIVE',
    completedAt: '2026-09-05T15:45:00Z',
    technicianName: 'Nguyễn Văn Hùng',
    technicianRole: 'Kỹ sư Trưởng Bảo Trì',
    durationMinutes: 40,
    partsReplaced: [
      'Quạt tản nhiệt biến tần Sunon MagLev 24VDC 120mm',
      'Tấm mút lọc bụi tĩnh điện cửa tủ điều khiển',
    ],
    findingsAndActions:
      'Quạt tản nhiệt khối IGBT bị kẹt do bụi than xưởng cơ khí, gây tăng nhiệt lên 68°C. Đã thay quạt mới và làm sạch lá nhôm tản nhiệt bằng khí khô.',
    technicianNotes: 'Nhiệt độ IGBT hạ xuống 39°C trong điều kiện cắt thô 32A liên tục.',
    operatingHoursAtMaintenance: 3490,
    qualityPassed: true,
    costEstimateVND: 1800000,
    aiVerified: true,
  },

  // EDM-S01: GF AgieCharmilles FORM E 350
  {
    id: 'maint-06',
    deviceId: 'dev-03',
    taskTitle: 'Hiệu chuẩn độ phẳng bàn làm việc & Kiểm tra cụm xả xung điện cực Z',
    taskType: 'CALIBRATION',
    completedAt: '2026-09-25T10:00:00Z',
    technicianName: 'Trần Minh Đức',
    technicianRole: 'Kỹ thuật viên Cơ điện',
    durationMinutes: 75,
    partsReplaced: [
      'Bộ gioăng Viton O-ring chịu dầu chịu nhiệt van xả',
      'Bộ lọc xả áp nhanh FESTO 1/4 inch',
    ],
    findingsAndActions:
      'Sử dụng đồng hồ so Mitutoyo 0.001mm rà độ phẳng bàn gá từ tính Erowa. Độ nghiêng hiệu chỉnh về 0.002mm/200mm. Kiểm tra tốc độ phản hồi servo Z.',
    technicianNotes: 'Đáp ứng gia công khuôn mẫu điện cực than chì độ bóng gương VDI 12.',
    operatingHoursAtMaintenance: 2890,
    qualityPassed: true,
    costEstimateVND: 2500000,
    aiVerified: true,
  },
  {
    id: 'maint-07',
    deviceId: 'dev-03',
    taskTitle: 'Thay dầu điện môi dielektrikum & Súc rửa bể lắng cặn xỉ',
    taskType: 'PARTS_REPLACEMENT',
    completedAt: '2026-08-15T13:30:00Z',
    technicianName: 'Phạm Quốc Tuấn',
    technicianRole: 'Kỹ sư Ứng dụng EDM',
    durationMinutes: 140,
    partsReplaced: [
      '120 Lít dầu xung điện Oest Dielektrikum 200',
      'Cặp phin lọc xỉ ly tâm 5-micron',
    ],
    findingsAndActions:
      'Hút toàn bộ 120 lít dầu cũ biến chất có độ nhớt tăng. Làm sạch cặn đáy bể bằng máy hút công nghiệp. Bơm dầu mới và chạy tuần hoàn lọc 3 giờ.',
    technicianNotes: 'Màu dầu trong suốt, độ cách điện đạt chuẩn phóng tia lửa ổn định.',
    operatingHoursAtMaintenance: 2780,
    qualityPassed: true,
    costEstimateVND: 8500000,
    aiVerified: true,
  },

  // EDM-W03: Fanuc Robocut α-C600iB
  {
    id: 'maint-08',
    deviceId: 'dev-04',
    taskTitle: 'Kiểm tra hệ thống luồn dây tự động AWF & Căn chỉnh mỏ nhiệt cắt dây',
    taskType: 'PREVENTIVE',
    completedAt: '2026-09-20T08:30:00Z',
    technicianName: 'Lê Hoàng Nam',
    technicianRole: 'Chuyên gia Cắt Dây EDM',
    durationMinutes: 50,
    partsReplaced: [
      'Điện trở nhiệt mỏ cắt dây AWF Annealing Unit',
      'Bánh lăn kéo dây dẫn phế liệu (Discharge Roller)',
    ],
    findingsAndActions:
      'Đầu mỏ nhiệt cắt dây bị đóng muội xỉ khiến đầu dây đồng bị tòe khi cắt. Đã làm sạch đầu điện cực nhiệt và thay bánh lăn kéo dây bọc cao su PU.',
    technicianNotes: 'Thử nghiệm luồn dây qua lỗ mồi ø0.5mm thành công 10/10 lần liên tục.',
    operatingHoursAtMaintenance: 3120,
    qualityPassed: true,
    costEstimateVND: 3100000,
    aiVerified: true,
  },

  // CNC-M01: DMG Mori CMX 600V
  {
    id: 'maint-09',
    deviceId: 'dev-05',
    taskTitle: 'Bảo dưỡng trục chính 12,000 RPM & Kiểm tra lực kẹp dao thủy lực',
    taskType: 'PREVENTIVE',
    completedAt: '2026-09-14T14:00:00Z',
    technicianName: 'Trần Minh Đức',
    technicianRole: 'Kỹ thuật viên Cơ điện',
    durationMinutes: 120,
    partsReplaced: [
      'Bộ đĩa lò xo kẹp dao OTT-Jakob BBT40',
      'Lọc dầu hồi hệ thống thủy lực 10-micron',
    ],
    findingsAndActions:
      'Đo lực kéo rút dao thủy lực đạt 11.2 kN (đạt tiêu chuẩn yêu cầu >10.5 kN). Độ đảo côn trục chính ở đầu gá dao kiểm tra đạt 0.0018mm.',
    technicianNotes: 'Trục chính chạy êm không rung, độ ồn 68dB ở vòng tua tối đa 12,000 vòng/phút.',
    operatingHoursAtMaintenance: 5400,
    qualityPassed: true,
    costEstimateVND: 7200000,
    aiVerified: true,
  },

  // EDM-D01: Castek CNC ZNC-400
  {
    id: 'maint-10',
    deviceId: 'dev-06',
    taskTitle: 'Bảo dưỡng động cơ servo trục Z & Kiểm tra van xả nước áp lực cao',
    taskType: 'PREVENTIVE',
    completedAt: '2026-09-10T10:15:00Z',
    technicianName: 'Phạm Quốc Tuấn',
    technicianRole: 'Kỹ sư Ứng dụng EDM',
    durationMinutes: 65,
    partsReplaced: [
      'Bộ gioăng cao su van xả đáy bể',
      '5 Cây ống đồng dẫn điện cực ø1.0mm',
    ],
    findingsAndActions:
      'Bảo dưỡng vệ sinh rãnh trượt servo nâng hạ đầu điện cực đục lỗ. Thay van xả đáy để giải quyết tình trạng rò rỉ dung môi.',
    technicianNotes: 'Khoan lỗ mồi xỏ dây tốc độ 35mm/phút trên thép tôi SKD11 đạt yêu cầu.',
    operatingHoursAtMaintenance: 2150,
    qualityPassed: true,
    costEstimateVND: 1900000,
    aiVerified: false,
  },
];

const STORAGE_KEY = 'edm_smartguard_maintenance_records_v1';

export function getStoredMaintenanceRecords(): MaintenanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MAINTENANCE_RECORDS));
      return INITIAL_MAINTENANCE_RECORDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MAINTENANCE_RECORDS;
  }
}

export function saveMaintenanceRecord(record: MaintenanceRecord): MaintenanceRecord[] {
  try {
    const current = getStoredMaintenanceRecords();
    const updated = [record, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save maintenance record:', err);
    return INITIAL_MAINTENANCE_RECORDS;
  }
}

export function getDeviceMaintenanceHistory(deviceId: string): MaintenanceRecord[] {
  const all = getStoredMaintenanceRecords();
  return all.filter((r) => r.deviceId === deviceId);
}
