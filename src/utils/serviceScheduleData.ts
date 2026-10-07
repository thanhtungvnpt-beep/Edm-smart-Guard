import { Device } from '../types';

export interface ScheduledServiceTask {
  id: string;
  deviceId: string;
  dueDate: string; // YYYY-MM-DD format
  taskTitle: string;
  serviceType: 'PREVENTIVE' | 'CALIBRATION' | 'INSPECTION' | 'PARTS_REPLACEMENT' | 'OVERHAUL';
  urgency: 'CRITICAL' | 'URGENT' | 'UPCOMING' | 'ROUTINE';
  estimatedDurationMinutes: number;
  assignedTechnicianName: string;
  assignedTechnicianPhone?: string;
  operatingHoursTarget: number;
  recommendedParts: string[];
  sopDocumentTitle?: string;
  instructions: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
}

/**
 * Generates tailored upcoming service schedule tasks for a specific machine
 */
export function getMachineScheduledTasks(device: Device): ScheduledServiceTask[] {
  const currentYear = 2026;
  const currentMonth = 10; // October 2026

  const schedulesByDevice: Record<string, ScheduledServiceTask[]> = {
    // EDM-W01: Makino U6 H.E.A.T Wire EDM
    'dev-01': [
      {
        id: 'sched-01-01',
        deviceId: 'dev-01',
        dueDate: '2026-10-08',
        taskTitle: 'Bảo dưỡng định kỳ 500h: Thay cụm dẫn hướng kim cương trên/dưới 0.25mm',
        serviceType: 'PREVENTIVE',
        urgency: 'URGENT',
        estimatedDurationMinutes: 90,
        assignedTechnicianName: 'Lê Hoàng Nam',
        assignedTechnicianPhone: '0904.332.119',
        operatingHoursTarget: 4900,
        recommendedParts: [
          'Bộ dẫn hướng kim cương P-104 (Diamond Wire Guide 0.25mm)',
          'Khối tiếp điện cacbua (Energizing Carbide Plate)',
          'Lõi lọc giấy ion 3-micron',
        ],
        sopDocumentTitle: 'SOP-EDM-01: Quy trình thay thế và căn chỉnh đầu dẫn hướng Makino U6',
        instructions:
          'Khóa nguồn phát xung, tháo buồng dẫn hướng kim cương trên và dưới. Ngâm rửa siêu âm cụm vòi xả cao áp. Căn chỉnh góc thẳng đứng trục U/V bằng đồng hồ so chân gập Mitutoyo sai số <0.0015mm.',
        status: 'SCHEDULED',
      },
      {
        id: 'sched-01-02',
        deviceId: 'dev-01',
        dueDate: '2026-10-15',
        taskTitle: 'Bơm mỡ tự động thanh trượt THK trục X/Y & Kiểm tra độ rơ vít me bi',
        serviceType: 'CALIBRATION',
        urgency: 'UPCOMING',
        estimatedDurationMinutes: 60,
        assignedTechnicianName: 'Trần Minh Tuấn',
        assignedTechnicianPhone: '0912.876.543',
        operatingHoursTarget: 4980,
        recommendedParts: ['Mỡ bôi trơn chuyên dụng Kluber Isoflex NBU 15 (Tuýp 400g)'],
        sopDocumentTitle: 'SOP-EDM-04: Bảo trì thanh trượt bi tuyến tính THK máy cắt dây',
        instructions:
          'Bơm mỡ áp lực cao cho 4 block trượt trục X và 4 block trượt trục Y. Đo backlash trục vít me bằng thước quang Heidenhain.',
        status: 'SCHEDULED',
      },
      {
        id: 'sched-01-03',
        deviceId: 'dev-01',
        dueDate: '2026-10-22',
        taskTitle: 'Kiểm tra độ dẫn điện buồng ion & Thay thế hạt nhựa khử ion (DI Resin Container)',
        serviceType: 'PARTS_REPLACEMENT',
        urgency: 'ROUTINE',
        estimatedDurationMinutes: 45,
        assignedTechnicianName: 'Nguyễn Văn Hùng',
        assignedTechnicianPhone: '0983.124.567',
        operatingHoursTarget: 5060,
        recommendedParts: ['Hạt nhựa lọc ion hỗn hợp Purolite MB400 (Bình 25 Lít)'],
        sopDocumentTitle: 'SOP-EDM-07: Quy trình kiểm chuẩn chất lượng nước khử ion hóa',
        instructions:
          'Đo độ dẫn điện bằng bút đo TDS, xả sạch bình lọc chứa hạt nhựa cũ và nạp hạt nhựa mới. Đảm bảo độ dẫn điện nước < 10 µS/cm.',
        status: 'SCHEDULED',
      },
      {
        id: 'sched-01-04',
        dueDate: '2026-10-29',
        deviceId: 'dev-01',
        taskTitle: 'Kiểm tra lực căng cuộn dây đồng & Cân chỉnh phanh hãm Tension Brake Motor',
        serviceType: 'INSPECTION',
        urgency: 'ROUTINE',
        estimatedDurationMinutes: 40,
        assignedTechnicianName: 'Lê Hoàng Nam',
        assignedTechnicianPhone: '0904.332.119',
        operatingHoursTarget: 5140,
        recommendedParts: ['Dây curoa truyền động phanh căng dây cao su bọc vải'],
        sopDocumentTitle: 'SOP-EDM-02: Hiệu chuẩn cảm biến lực căng dây cắt EDM',
        instructions:
          'Đo lực căng động ở tốc độ cuộn dây 12 m/phút. Cài đặt dải căng chuẩn 14N - 16N đối với dây đồng đỏ 0.25mm.',
        status: 'SCHEDULED',
      },
      {
        id: 'sched-01-05',
        dueDate: '2026-11-06',
        deviceId: 'dev-01',
        taskTitle: 'Đại tu hệ thống xả xỉ cao áp & Thay phớt bơm tuần hoàn Grundfos 2.2kW',
        serviceType: 'OVERHAUL',
        urgency: 'UPCOMING',
        estimatedDurationMinutes: 120,
        assignedTechnicianName: 'Nguyễn Văn Hùng',
        assignedTechnicianPhone: '0983.124.567',
        operatingHoursTarget: 5240,
        recommendedParts: ['Bộ phớt cơ khí Grundfos MTR-03', 'Gioăng đệm chịu dầu EPDM'],
        sopDocumentTitle: 'SOP-EDM-09: Quy trình tháo bảo dưỡng cụm bơm áp lực cao',
        instructions:
          'Tháo cụm bơm cao áp buồng xả phôi, thay phớt chắn nước, kiểm tra độ mòn cánh bơm, chạy thử áp lực 2.0 MPa.',
        status: 'SCHEDULED',
      },
    ],

    // EDM-W02: Sodick ALC600G Linear Motor Wire EDM
    'dev-02': [
      {
        id: 'sched-02-01',
        deviceId: 'dev-02',
        dueDate: '2026-10-07',
        taskTitle: 'Khẩn cấp: Vệ sinh quạt hút tủ điện nguồn xung SPW & Thay lưới lọc gió',
        serviceType: 'PREVENTIVE',
        urgency: 'CRITICAL',
        estimatedDurationMinutes: 45,
        assignedTechnicianName: 'Nguyễn Văn Hùng',
        assignedTechnicianPhone: '0983.124.567',
        operatingHoursTarget: 3920,
        recommendedParts: ['Tấm lọc bụi khí nén tủ điện Sodick 300x300mm', 'Quạt tản nhiệt Sunon 24VDC'],
        sopDocumentTitle: 'SOP-SDK-03: Bảo dưỡng hệ thống tản nhiệt khối công suất IGBT',
        instructions:
          'Xịt khí khô làm sạch giàn tản nhiệt nhôm khối IGBT, thay tấm lọc khí tủ điều khiển SPW Circuit.',
        status: 'SCHEDULED',
      },
      {
        id: 'sched-02-02',
        deviceId: 'dev-02',
        dueDate: '2026-10-14',
        taskTitle: 'Lau sạch thanh thước quang Heidenhain & Căn chỉnh khe hở động cơ tuyến tính Linear Motor',
        serviceType: 'CALIBRATION',
        urgency: 'UPCOMING',
        estimatedDurationMinutes: 75,
        assignedTechnicianName: 'Trần Minh Tuấn',
        assignedTechnicianPhone: '0912.876.543',
        operatingHoursTarget: 4000,
        recommendedParts: ['Dung dịch làm sạch kính quang học Heidenhain Cleaner', 'Khăn nỉ không bụi Microfiber'],
        sopDocumentTitle: 'SOP-SDK-01: Quy trình bảo dưỡng thước quang động cơ tuyến tính',
        instructions:
          'Lau sạch bề mặt kính thước quang trục X, Y. Kiểm tra khe hở từ nam châm vĩnh cửu Linear Motor đạt 0.8mm.',
        status: 'SCHEDULED',
      },
      {
        id: 'sched-02-03',
        deviceId: 'dev-02',
        dueDate: '2026-10-23',
        taskTitle: 'Thay thế cặp ống dẫn nước xả cao áp & Lõi lọc giấy Sodick 5-micron',
        serviceType: 'PARTS_REPLACEMENT',
        urgency: 'ROUTINE',
        estimatedDurationMinutes: 60,
        assignedTechnicianName: 'Phạm Đức Anh',
        assignedTechnicianPhone: '0977.889.001',
        operatingHoursTarget: 4100,
        recommendedParts: ['Lõi lọc áp lực Sodick SW-41 (Cặp 2 quả)', 'Ống Teflon bọc lưới inox chịu áp 30 Bar'],
        sopDocumentTitle: 'SOP-SDK-04: Thay thế bộ lọc và ống chịu áp hệ thống điện môi',
        instructions:
          'Tháo 2 vỏ bình lọc áp lực, thay lõi lọc giấy mới, xả khí air trên nắp bình trước khi đóng điện bơm.',
        status: 'SCHEDULED',
      },
    ],

    // EDM-S01: GF AgieCharmilles FORM E 350 Sinker EDM
    'dev-03': [
      {
        id: 'sched-03-01',
        deviceId: 'dev-03',
        dueDate: '2026-10-12',
        taskTitle: 'Kiểm tra độ đồng tâm mâm kẹp điện cực EROWA ITS 50 & Bơm mỡ trục Z',
        serviceType: 'CALIBRATION',
        urgency: 'UPCOMING',
        estimatedDurationMinutes: 60,
        assignedTechnicianName: 'Trần Minh Tuấn',
        assignedTechnicianPhone: '0912.876.543',
        operatingHoursTarget: 2480,
        recommendedParts: ['Mỡ trục Z chuyên dụng Agie Charmilles Grease', 'Căn đệm định vị Erowa 50mm'],
        sopDocumentTitle: 'SOP-GF-02: Quy trình hiệu chuẩn mâm kẹp điện cực Erowa',
        instructions:
          'Dùng đồ gá chuẩn rà độ phẳng và vuông góc của mâm kẹp trục Z. Độ đảo cho phép < 0.002mm.',
        status: 'SCHEDULED',
      },
      {
        id: 'sched-03-02',
        deviceId: 'dev-03',
        dueDate: '2026-10-21',
        taskTitle: 'Thay dầu điện môi bồn xung phụ & Vệ sinh màng lọc nam châm tách mạt sắt',
        serviceType: 'PREVENTIVE',
        urgency: 'ROUTINE',
        estimatedDurationMinutes: 90,
        assignedTechnicianName: 'Phạm Đức Anh',
        assignedTechnicianPhone: '0977.889.001',
        operatingHoursTarget: 2560,
        recommendedParts: ['Dầu điện môi xung Oelheld IonoPlus IME-MH (Thùng 20L)', 'Lưới lọc nam châm Neodymium'],
        sopDocumentTitle: 'SOP-GF-05: Quy trình lọc tách mạt sắt và thay dầu bồn phóng điện',
        instructions:
          'Xả dầu bồn lắng cặn, tháo thanh nam châm lau sạch mạt vụn, châm dầu mới đến vạch MAX.',
        status: 'SCHEDULED',
      },
    ],

    // EDM-W03: Fanuc Robocut α-C600iC
    'dev-04': [
      {
        id: 'sched-04-01',
        deviceId: 'dev-04',
        dueDate: '2026-10-10',
        taskTitle: 'Mài phẳng dao cắt dây nhiệt AWF Annealing Cutter & Kiểm tra ống phóng khí',
        serviceType: 'PREVENTIVE',
        urgency: 'UPCOMING',
        estimatedDurationMinutes: 50,
        assignedTechnicianName: 'Lê Hoàng Nam',
        assignedTechnicianPhone: '0904.332.119',
        operatingHoursTarget: 5280,
        recommendedParts: ['Lưỡi dao hàn nhiệt dây Fanuc AWF A98L', 'Ống dẫn khí xỏ dây tự động 2.5mm'],
        sopDocumentTitle: 'SOP-FNC-01: Hiệu chỉnh cụm xỏ dây tự động AWF Robocut',
        instructions:
          'Vệ sinh xỉ hàn trên mặt tiếp xúc lưỡi dao, kiểm tra áp suất khí nén xỏ dây đạt 0.45 MPa.',
        status: 'SCHEDULED',
      },
      {
        id: 'sched-04-02',
        deviceId: 'dev-04',
        dueDate: '2026-10-24',
        taskTitle: 'Thay khối tiếp điện cacbua Fanuc & Kiểm tra độ mòn rãnh cáp xung',
        serviceType: 'PARTS_REPLACEMENT',
        urgency: 'ROUTINE',
        estimatedDurationMinutes: 45,
        assignedTechnicianName: 'Nguyễn Văn Hùng',
        assignedTechnicianPhone: '0983.124.567',
        operatingHoursTarget: 5360,
        recommendedParts: ['Khối tiếp điện cacbua trên/dưới Fanuc A290-8110-X382'],
        sopDocumentTitle: 'SOP-FNC-03: Thay thế chổi tiếp điện và cáp cao tần',
        instructions:
          'Xoay đổi vị trí mặt tiếp xúc chưa mòn hoặc thay mới khối cacbua, đo điện trở tiếp xúc < 0.2 Ohm.',
        status: 'SCHEDULED',
      },
    ],

    // CNC-M01: DMG Mori CMX 600V
    'dev-05': [
      {
        id: 'sched-05-01',
        deviceId: 'dev-05',
        dueDate: '2026-10-16',
        taskTitle: 'Kiểm tra mức dầu bôi trơn trục chính 12,000 RPM & Đo lực kẹp dao thủy lực',
        serviceType: 'INSPECTION',
        urgency: 'UPCOMING',
        estimatedDurationMinutes: 45,
        assignedTechnicianName: 'Trần Minh Tuấn',
        assignedTechnicianPhone: '0912.876.543',
        operatingHoursTarget: 2020,
        recommendedParts: ['Dầu trục chính Mobil Velocite No.3 (Can 4L)', 'Đồng hồ đo lực kẹp dao BT40 Clamp Meter'],
        sopDocumentTitle: 'SOP-DMG-02: Kiểm chuẩn lực rút dao trục chính BT40',
        instructions:
          'Dùng dụng cụ đo lực kẹp dao rút BT40 đạt > 8.5 kN, châm dầu máy làm mát trục chính.',
        status: 'SCHEDULED',
      },
      {
        id: 'sched-05-02',
        deviceId: 'dev-05',
        dueDate: '2026-10-30',
        taskTitle: 'Căn chỉnh đài dao tự động ATC 30 vị trí & Thay chổi quét bụi băng trượt',
        serviceType: 'PREVENTIVE',
        urgency: 'ROUTINE',
        estimatedDurationMinutes: 70,
        assignedTechnicianName: 'Phạm Đức Anh',
        assignedTechnicianPhone: '0977.889.001',
        operatingHoursTarget: 2100,
        recommendedParts: ['Bộ gạt phoi băng máy trục X/Y/Z (Wiper Seal Kit)'],
        sopDocumentTitle: 'SOP-DMG-04: Bảo trì cơ cấu thay dao tự động ATC',
        instructions:
          'Kiểm tra độ êm tay gắp dao đôi Twin-arm, tra mỡ cam xoay, thay phớt gạt phoi băng máy.',
        status: 'SCHEDULED',
      },
    ],

    // EDM-H01: Castek CNC Hole Popper
    'dev-06': [
      {
        id: 'sched-06-01',
        deviceId: 'dev-06',
        dueDate: '2026-10-09',
        taskTitle: 'Thay mới phớt xoay cao áp Rotary Seal 60 Bar & Ống dẫn hướng điện cực gốm',
        serviceType: 'PARTS_REPLACEMENT',
        urgency: 'URGENT',
        estimatedDurationMinutes: 60,
        assignedTechnicianName: 'Nguyễn Văn Hùng',
        assignedTechnicianPhone: '0983.124.567',
        operatingHoursTarget: 3180,
        recommendedParts: ['Phớt xoay áp lực cao Castek Rotary Seal 60 Bar', 'Đầu dẫn hướng gốm Ceramic Guide 1.0mm'],
        sopDocumentTitle: 'SOP-CST-01: Quy trình thay phớt xoay và vòi áp cao máy khoan mồi',
        instructions:
          'Tháo đầu xoay trục Z, thay phớt cao áp chịu áp lực nước 60 Bar, căn chỉnh ống đồng 1.0mm không bị rung lắc.',
        status: 'SCHEDULED',
      },
      {
        id: 'sched-06-02',
        deviceId: 'dev-06',
        dueDate: '2026-10-27',
        taskTitle: 'Bảo dưỡng bơm tăng áp nước khử ion áp suất cao 70kg/cm² & Thay lọc cặn',
        serviceType: 'PREVENTIVE',
        urgency: 'ROUTINE',
        estimatedDurationMinutes: 50,
        assignedTechnicianName: 'Trần Minh Tuấn',
        assignedTechnicianPhone: '0912.876.543',
        operatingHoursTarget: 3260,
        recommendedParts: ['Lõi lọc cao áp inox 10-micron Castek Water Filter'],
        sopDocumentTitle: 'SOP-CST-03: Bảo dưỡng hệ thống bơm áp lực cao',
        instructions:
          'Kiểm tra van điều áp và đồng hồ áp lực, thay lõi lọc inox chặn mạt phôi trước khi vào đầu khoan.',
        status: 'SCHEDULED',
      },
    ],
  };

  return schedulesByDevice[device.id] || [
    {
      id: `sched-${device.id}-01`,
      deviceId: device.id,
      dueDate: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-14`,
      taskTitle: `Kiểm tra định kỳ và bôi trơn hệ thống cơ khí máy ${device.code}`,
      serviceType: 'PREVENTIVE',
      urgency: 'UPCOMING',
      estimatedDurationMinutes: 60,
      assignedTechnicianName: device.assignedTechnician?.name || 'Kỹ thuật viên bảo trì',
      assignedTechnicianPhone: device.assignedTechnician?.phone,
      operatingHoursTarget: 3500,
      recommendedParts: ['Mỡ bôi trơn công nghiệp', 'Khăn lau chuyên dụng'],
      sopDocumentTitle: 'SOP-GEN: Quy trình bảo dưỡng cơ bản thiết bị',
      instructions: 'Kiểm tra độ êm thanh trượt, mức dầu bôi trơn và cảm biến an toàn.',
      status: 'SCHEDULED',
    },
  ];
}
