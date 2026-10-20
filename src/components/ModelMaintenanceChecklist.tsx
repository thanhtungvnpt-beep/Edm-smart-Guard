import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Wrench,
  Gauge,
  Zap,
  RotateCcw,
  Plus,
  X,
  FileText,
  Info,
  Layers,
  Flame,
  Activity,
  Award,
} from 'lucide-react';
import { Device } from '../types';

export interface ChecklistItem {
  id: string;
  stage: 'SAFETY' | 'MECHANICAL' | 'CALIBRATION' | 'COMMISSIONING';
  stageLabel: string;
  title: string;
  description: string;
  toolRequired?: string;
  nominalSpec?: string;
  isCritical: boolean;
  checked: boolean;
}

export interface ModelMaintenanceSop {
  modelCode: string;
  modelFamily: string;
  sopDocumentId: string;
  sopVersion: string;
  standardDurationMin: number;
  items: ChecklistItem[];
}

// Model-specific SOP Database
export const MODEL_SOP_REGISTRY: Record<string, Omit<ModelMaintenanceSop, 'items'> & { items: Omit<ChecklistItem, 'checked'>[] }> = {
  // 1. Makino U6 H.E.A.T / Makino Wire EDM
  makino_u6: {
    modelCode: 'Makino U6 H.E.A.T',
    modelFamily: 'Máy Cắt Dây CNC Makino (Dòng H.E.A.T Công Suất Cao)',
    sopDocumentId: 'SOP-MAK-U6-HE-2026',
    sopVersion: 'Rev 4.2 (OEM Makino Japan)',
    standardDurationMin: 35,
    items: [
      {
        id: 'mak-01',
        stage: 'SAFETY',
        stageLabel: '1. An Toàn & Chuẩn Bị (LOTO)',
        title: 'Ngắt nguồn phụ trợ cao áp & gài khóa an toàn Lockout-Tagout (LOTO)',
        description: 'Tắt công tắc phụ phía sau tủ máy, xả hết áp suất khí nén cấp bồn và ngắt cầu dao phát tia RF.',
        toolRequired: 'Khóa LOTO cá nhân, đồng hồ vạn năng kiểm tra điện áp dư',
        nominalSpec: 'Điện áp dư tụ phóng < 5V',
        isCritical: true,
      },
      {
        id: 'mak-02',
        stage: 'MECHANICAL',
        stageLabel: '2. Cơ Cấu Phun Nước H.E.A.T & Màng Lọc',
        title: 'Kiểm tra béc xả áp cao tần H.E.A.T Flushing Nozzle & thay lõi lọc 3µm',
        description: 'Vệ sinh cặn xỉ bám quanh đầu béc phun trên/dưới. Đảm bảo luồng nước xả thẳng trục, không bị lệch hướng cắt.',
        toolRequired: 'Dụng cụ tháo béc chuyên dụng Makino, que nỉ vi sợi',
        nominalSpec: 'Lưu lượng xả: 18 - 24 L/phút',
        isCritical: true,
      },
      {
        id: 'mak-03',
        stage: 'MECHANICAL',
        stageLabel: '2. Cơ Cấu Dẫn Hướng & Cắt Dây',
        title: 'Kiểm tra độ mòn ống dẫn hướng kim cương Diamond Guide và bánh tỳ kéo dây',
        description: 'Dùng kính phóng đại soi đầu kim cương. Xoay vị trí tiếp xúc chổi than tiếp điện (Carbide Power Contacts) sang vị trí mới.',
        toolRequired: 'Kính lúp công nghiệp 20x, lục giác 2.5mm',
        nominalSpec: 'Độ đảo bánh tỳ < 0.005mm',
        isCritical: false,
      },
      {
        id: 'mak-04',
        stage: 'CALIBRATION',
        stageLabel: '3. Hiệu Chuẩn Áp Suất & Điện Môi',
        title: 'Đo áp suất nước xả đáy bồn và độ dẫn điện ion nước khử khoáng',
        description: 'Khởi động bơm tuần hoàn, đối chiếu áp lực hiển thị với đồng hồ áp cơ khí. Kiểm tra hạt trao đổi ion.',
        toolRequired: 'Đồng hồ đo áp suất cơ khí, bút đo độ dẫn điện TDS/Resistivity',
        nominalSpec: 'Áp suất 1.4 - 1.8 Bar; Độ dẫn < 15 µS/cm',
        isCritical: true,
      },
      {
        id: 'mak-05',
        stage: 'CALIBRATION',
        stageLabel: '3. Hiệu Chuẩn Lực Căng Dây (Tension)',
        title: 'Hiệu chuẩn lực căng dây đồng 0.25mm qua cảm biến lực Load-cell',
        description: 'Cho dây chạy không tải, theo dõi lực căng trên màn hình CNC và cân chỉnh cơ cấu thắng từ (Brake Roller).',
        toolRequired: 'Thước đo lực căng dây Tensiometer',
        nominalSpec: 'Lực căng: 14.0 ± 1.5 N',
        isCritical: false,
      },
      {
        id: 'mak-06',
        stage: 'COMMISSIONING',
        stageLabel: '4. Chạy Thử & Bàn Giao Vận Hành',
        title: 'Thử nghiệm luồn dây tự động AWT và cắt tia thử trên phôi mẫu SKD11',
        description: 'Thực hiện 3 lần luồn dây tự động qua lỗ mồi Ø0.5mm. Chạy test cắt góc R0.2mm để kiểm tra hiện tượng đứt dây.',
        toolRequired: 'Phôi thép mẫu kiểm tra, đồng hồ so đo độ côn',
        nominalSpec: 'Tỷ lệ luồn dây thành công: 3/3 lần',
        isCritical: true,
      },
    ],
  },

  // 2. Sodick ALC600G iGroove+
  sodick_alc: {
    modelCode: 'Sodick ALC600G iGroove+',
    modelFamily: 'Máy Cắt Dây CNC Sodick (Công Nghệ iGroove Xoay Dây)',
    sopDocumentId: 'SOP-SDK-ALC600-2026',
    sopVersion: 'Rev 5.0 (Sodick Smart Tech)',
    standardDurationMin: 30,
    items: [
      {
        id: 'sdk-01',
        stage: 'SAFETY',
        stageLabel: '1. An Toàn & Chuẩn Bị (LOTO)',
        title: 'Cô lập nguồn động cơ tuyến tính Linear Motor & xả áp bồn dầu',
        description: 'Động cơ tuyến tính từ trường vĩnh cửu cực mạnh; cần ngắt CB và đợi đèn báo phóng điện tủ phóng vụt tắt hoàn toàn.',
        toolRequired: 'Khóa an toàn, găng tay cách điện 1000V',
        nominalSpec: 'Điện áp Bus DC < 10V',
        isCritical: true,
      },
      {
        id: 'sdk-02',
        stage: 'MECHANICAL',
        stageLabel: '2. Cơ Cấu iGroove & Bánh Lăn Xoay Dây',
        title: 'Vệ sinh & cân chỉnh cụm con lăn xoay rãnh dây iGroove Mechanism',
        description: 'Kiểm tra bánh lăn xoay dây tránh hiện tượng mòn khuyết một bên làm lệch góc cắt phôi côn.',
        toolRequired: 'Cồn tẩy rửa IPA, bộ lục giác tiêu chuẩn Sodick',
        nominalSpec: 'Tốc độ xoay con lăn đồng bộ 100%',
        isCritical: true,
      },
      {
        id: 'sdk-03',
        stage: 'MECHANICAL',
        stageLabel: '2. Cảm Biến Áp Suất & Van Màng Rung',
        title: 'Tháo vệ sinh màng rung cảm biến áp lực S-104 bằng cồn tẩy chuyên dụng',
        description: 'Xịt sạch cặn xỉ than bám trên màng rung, kiểm tra rò rỉ gioăng cao su O-ring ren vặn.',
        toolRequired: 'Chai xịt Carb Cleaner, cờ lê lực 17mm',
        nominalSpec: 'Lực siết cảm biến: 18 N·m',
        isCritical: true,
      },
      {
        id: 'sdk-04',
        stage: 'CALIBRATION',
        stageLabel: '3. Hiệu Chuẩn Áp Suất & Nhiệt Độ Chiller',
        title: 'Kiểm tra hệ thống điều hòa nhiệt độ bồn dung dịch điện môi Chiller',
        description: 'Dung dịch cắt dây Sodick đòi hỏi nhiệt độ ổn định để bù nhiệt độ phôi độ chính xác sub-micron.',
        toolRequired: 'Nhiệt kế hồng ngoại điện tử',
        nominalSpec: 'Nhiệt độ bồn: 20.0 ± 0.5 °C',
        isCritical: false,
      },
      {
        id: 'sdk-05',
        stage: 'COMMISSIONING',
        stageLabel: '4. Chạy Thử & Bàn Giao Vận Hành',
        title: 'Kiểm tra hệ thống luồn dây bằng tia nước Super Jet AWT',
        description: 'Bật tia nước áp lực cao, kiểm tra tia nước chụm thẳng không bị toe trước khi xuyên qua phôi.',
        toolRequired: 'Tấm dưỡng kiểm tra tia nước Sodick Jet',
        nominalSpec: 'Áp lực tia nước: 12 Bar',
        isCritical: true,
      },
    ],
  },

  // 3. Fanuc Robocut α-C600iB
  fanuc_robocut: {
    modelCode: 'Fanuc Robocut α-C600iB',
    modelFamily: 'Máy Cắt Dây CNC Fanuc Robocut Series',
    sopDocumentId: 'SOP-FNC-C600-V3',
    sopVersion: 'Rev 3.8 (Fanuc Factory Standard)',
    standardDurationMin: 32,
    items: [
      {
        id: 'fnc-01',
        stage: 'SAFETY',
        stageLabel: '1. An Toàn & Chuẩn Bị (LOTO)',
        title: 'Ngắt nguồn CNC Fanuc 31i-WB & xác nhận dừng khẩn cấp E-Stop',
        description: 'Đảm bảo khóa liên động cửa buồng gia công (Interlock Door Switch) hoạt động ngắt tức thời khi mở.',
        toolRequired: 'Khóa an toàn LOTO',
        nominalSpec: 'Interlock trip time < 0.2s',
        isCritical: true,
      },
      {
        id: 'fnc-02',
        stage: 'MECHANICAL',
        stageLabel: '2. Khối Tiếp Điện & Dao Cắt Dây Tự Động',
        title: 'Xoay góc hoặc thay thế miếng hợp kim dẫn điện Carbide Power Contacts',
        description: 'Mỗi miếng tiếp điện Fanuc có 4 vị trí xoay. Đảm bảo bề mặt tiếp xúc phẳng không bị vết khía sâu.',
        toolRequired: 'Thước kẹp cặp đo độ lõm, tuốc nơ vít T15',
        nominalSpec: 'Độ sâu rãnh khía < 0.3mm',
        isCritical: true,
      },
      {
        id: 'fnc-03',
        stage: 'MECHANICAL',
        stageLabel: '2. Dao Cắt Dây & Lực Thu Dây',
        title: 'Kiểm tra lưỡi dao cắt dây nhiệt/cơ khí Wire Cutter & khay băm phế liệu',
        description: 'Vệ sinh cặn dây đồng vụn tích tụ trong ống dẫn dây thải ra thùng chứa phế liệu phía sau máy.',
        toolRequired: 'Chổi quét đồng, que thông ống dẫn',
        nominalSpec: 'Lưỡi dao cắt sắc bén, không tòe mép',
        isCritical: false,
      },
      {
        id: 'fnc-04',
        stage: 'CALIBRATION',
        stageLabel: '3. Hiệu Chuẩn Bơm Tuần Hoàn & Độ Dẫn',
        title: 'Kiểm tra van tỷ lệ điều khiển lưu lượng nước xả & đo điện trở cách điện',
        description: 'Kiểm tra tín hiệu điện áp điều khiển van tỷ lệ 0-10V từ bo mạch Fanuc I/O Unit.',
        toolRequired: 'Đồng hồ vạn năng Fluke, bút đo điện môi',
        nominalSpec: 'Điện môi: 45 - 65 kΩ·cm',
        isCritical: true,
      },
      {
        id: 'fnc-05',
        stage: 'COMMISSIONING',
        stageLabel: '4. Chạy Thử & Bàn Giao Vận Hành',
        title: 'Thực hiện chu trình tự động dò mép phôi bằng tiếp xúc điện (Edge Finding)',
        description: 'Chạy lệnh G-Code dò tâm lỗ và mép biên phôi, kiểm tra độ nhạy tiếp xúc không để lại vết lõm trên bề mặt chi tiết.',
        toolRequired: 'Khối phôi chuẩn Calibrator Master Block',
        nominalSpec: 'Độ lặp lại vị trí dò: ± 0.002mm',
        isCritical: true,
      },
    ],
  },

  // 4. Mitsubishi MV2400-S D-CUBES
  mitsubishi_mv: {
    modelCode: 'Mitsubishi MV2400-S D-CUBES',
    modelFamily: 'Máy Cắt Dây CNC Mitsubishi Tubular Linear',
    sopDocumentId: 'SOP-MIT-MV24-DC',
    sopVersion: 'Rev 2.9 (Mitsubishi Electric Corp)',
    standardDurationMin: 35,
    items: [
      {
        id: 'mit-01',
        stage: 'SAFETY',
        stageLabel: '1. An Toàn & Chuẩn Bị (LOTO)',
        title: 'Ngắt nguồn hệ thống động cơ hình ống Tubular Shaft Motor',
        description: 'Kiểm tra cảm biến quang quang học trục truyền động không bị bụi xỉ bám bẩn.',
        toolRequired: 'Khóa cách ly LOTO',
        nominalSpec: 'Điện áp cách ly an toàn',
        isCritical: true,
      },
      {
        id: 'mit-02',
        stage: 'MECHANICAL',
        stageLabel: '2. Bộ Phát Tia Xung V350 & Lọc Tinh',
        title: 'Kiểm tra bộ phát nguồn xung điện tử V350 và thay cụm lọc tinh',
        description: 'Đảm bảo quạt tản nhiệt khối công suất IGBT quay êm, màng lọc khí tủ điện không bị bụi kim loại bịt kín.',
        toolRequired: 'Máy hút bụi công nghiệp chống tĩnh điện ESD',
        nominalSpec: 'Nhiệt độ cánh tản nhiệt IGBT < 55°C',
        isCritical: true,
      },
      {
        id: 'mit-03',
        stage: 'CALIBRATION',
        stageLabel: '3. Cân Chỉnh Độ Vuông Góc Trục Dây',
        title: 'Cân chỉnh góc vuông góc trục dây cắt bằng dưỡng Wire Alignment Tool',
        description: 'Dùng thiết bị căn chỉnh điện tử kết nối cổng cảm biến D-CUBES để triệt tiêu sai số độ nghiêng U-V.',
        toolRequired: 'Bộ dưỡng căn thẳng dây điện tử Mitsubishi',
        nominalSpec: 'Độ vuông góc < 0.002mm / 100mm chiều dày',
        isCritical: true,
      },
      {
        id: 'mit-04',
        stage: 'COMMISSIONING',
        stageLabel: '4. Chạy Thử & Bàn Giao Vận Hành',
        title: 'Xóa nhật ký cảnh báo trên màn hình D-CUBES 19 inch & chạy phôi thử',
        description: 'Kiểm tra màn hình không còn mã cảnh báo vàng/đỏ, xác nhận bàn giao kíp trực vận hành.',
        toolRequired: 'Màn hình cảm ứng D-CUBES',
        nominalSpec: 'Không có lỗi tồn đọng',
        isCritical: true,
      },
    ],
  },

  // 5. Sinker EDM / Máy Bắn Điện Xung (Makino EDAF3 / EA12V)
  sinker_edm: {
    modelCode: 'Makino EDAF3 / Sinker EDM',
    modelFamily: 'Máy Bắn Điện Xung Điêu Khắc (Sinker / Die-Sinker EDM)',
    sopDocumentId: 'SOP-SINKER-EDM-2026',
    sopVersion: 'Rev 4.0 (Die-Sinker Standard)',
    standardDurationMin: 40,
    items: [
      {
        id: 'snk-01',
        stage: 'SAFETY',
        stageLabel: '1. An Toàn & PCCC (Đặc Thù Dầu Hydrocarbon)',
        title: 'Kiểm tra hệ thống dập lửa CO2 tự động & cảm biến quang nhiệt bồn dầu',
        description: 'Bắt buộc kiểm tra áp suất bình khí dập lửa CO2 và phao chống tràn bồn dầu điện môi chống cháy nổ tuyệt đối.',
        toolRequired: 'Đồng hồ áp bình CO2, que thử cảm biến quang',
        nominalSpec: 'Áp suất bình CO2: 50 - 60 Bar; Phao nổi ngắt < 50mm',
        isCritical: true,
      },
      {
        id: 'snk-02',
        stage: 'MECHANICAL',
        stageLabel: '2. Đầu Gá Điện Cực & Trục C Xoay',
        title: 'Kiểm tra đầu gá kẹp điện cực System 3R / Erowa và độ đảo trục C',
        description: 'Vệ sinh bề mặt tiếp xúc bi định vị đầu chuck. Dùng đồng hồ so rà tròn độ đảo chuôi kẹp điện cực đồng/graphite.',
        toolRequired: 'Đồng hồ so chân gập đòn bẩy độ chia 0.001mm',
        nominalSpec: 'Độ đảo trục C < 0.003mm',
        isCritical: true,
      },
      {
        id: 'snk-03',
        stage: 'MECHANICAL',
        stageLabel: '2. Bơm Hút Xả Xung Áp Suất Cao (Flushing & Suction)',
        title: 'Kiểm tra van điều tiết xả xung đáy điện cực và lọc tách muội carbon',
        description: 'Đảm bảo tia dầu xả khe hở cuốn trôi mạt than graphite, không bị ứ đọng gây hiện tượng hồ quang phá hủy lòng khuôn.',
        toolRequired: 'Đồng hồ đo áp lực dầu bồn',
        nominalSpec: 'Áp suất xả: 0.5 - 1.2 Bar',
        isCritical: true,
      },
      {
        id: 'snk-04',
        stage: 'CALIBRATION',
        stageLabel: '3. Hiệu Chuẩn Chạm Gốc Z-Zero Touch',
        title: 'Hiệu chuẩn điểm không Z-Zero Touch với phôi gia công & bù khe hở Spark Gap',
        description: 'Kiểm tra mạch dò chạm tiếp xúc điện thế thấp, cài đặt độ phóng điện an toàn trước khi nạp mã CNC gia công tinh.',
        toolRequired: 'Dưỡng đo căn lá khe hở phóng điện Feeler Gauge',
        nominalSpec: 'Sai số chạm gốc Z < 0.002mm',
        isCritical: true,
      },
      {
        id: 'snk-05',
        stage: 'COMMISSIONING',
        stageLabel: '4. Chạy Thử & Bàn Giao Vận Hành',
        title: 'Chạy phóng thử nghiệm không tải 5 phút kiểm tra nhiệt độ dầu & bàn giao',
        description: 'Quan sát màu tia phóng điện (tia màu xanh tím sáng đồng đều, không có đốm vàng cam hồ quang tập trung).',
        toolRequired: 'Kính quan sát tia lửa an toàn',
        nominalSpec: 'Tia phóng xanh tím ổn định 100%',
        isCritical: true,
      },
    ],
  },
};

// Helper to determine the best matching SOP template based on device
export function getModelSopTemplate(device: Device): ModelMaintenanceSop {
  const modelStr = `${device.model || ''} ${device.name || ''} ${device.brand || ''} ${device.type || ''}`.toLowerCase();

  let key = 'makino_u6';
  if (modelStr.includes('sodick') || modelStr.includes('alc') || modelStr.includes('igroove')) {
    key = 'sodick_alc';
  } else if (modelStr.includes('fanuc') || modelStr.includes('robocut') || modelStr.includes('c600')) {
    key = 'fanuc_robocut';
  } else if (modelStr.includes('mitsubishi') || modelStr.includes('mv24') || modelStr.includes('cubes')) {
    key = 'mitsubishi_mv';
  } else if (modelStr.includes('sinker') || modelStr.includes('edaf') || modelStr.includes('ea12') || modelStr.includes('xung')) {
    key = 'sinker_edm';
  } else if (modelStr.includes('makino') || modelStr.includes('heat') || modelStr.includes('u6')) {
    key = 'makino_u6';
  }

  const registered = MODEL_SOP_REGISTRY[key] || MODEL_SOP_REGISTRY.makino_u6;

  return {
    modelCode: device.model || registered.modelCode,
    modelFamily: registered.modelFamily,
    sopDocumentId: registered.sopDocumentId,
    sopVersion: registered.sopVersion,
    standardDurationMin: registered.standardDurationMin,
    items: registered.items.map((item) => ({ ...item, checked: false })),
  };
}

interface ModelMaintenanceChecklistProps {
  device: Device;
  onChecklistChange?: (completedCount: number, totalCount: number, items: ChecklistItem[]) => void;
  onApplyToReportSummary?: (summaryText: string) => void;
}

export const ModelMaintenanceChecklist: React.FC<ModelMaintenanceChecklistProps> = ({
  device,
  onChecklistChange,
  onApplyToReportSummary,
}) => {
  const sopTemplate = useMemo(() => getModelSopTemplate(device), [device]);

  const [items, setItems] = useState<ChecklistItem[]>(() => sopTemplate.items);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(sopTemplate.items[0]?.id || null);
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customStage, setCustomStage] = useState<'SAFETY' | 'MECHANICAL' | 'CALIBRATION' | 'COMMISSIONING'>('MECHANICAL');

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.checked).length;
  const criticalCount = items.filter((i) => i.isCritical).length;
  const completedCriticalCount = items.filter((i) => i.isCritical && i.checked).length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCriticalDone = completedCriticalCount === criticalCount;

  // Notify parent on change
  const updateItems = (newItems: ChecklistItem[]) => {
    setItems(newItems);
    const cCount = newItems.filter((i) => i.checked).length;
    onChecklistChange?.(cCount, newItems.length, newItems);
  };

  const handleToggle = (id: string) => {
    const next = items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
    updateItems(next);
  };

  const handleMarkAll = () => {
    const next = items.map((i) => ({ ...i, checked: true }));
    updateItems(next);
  };

  const handleReset = () => {
    const next = items.map((i) => ({ ...i, checked: false }));
    updateItems(next);
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      stage: customStage,
      stageLabel:
        customStage === 'SAFETY'
          ? '1. An Toàn'
          : customStage === 'MECHANICAL'
          ? '2. Cơ Cấu Máy'
          : customStage === 'CALIBRATION'
          ? '3. Hiệu Chuẩn'
          : '4. Chạy Thử',
      title: customTitle.trim(),
      description: 'Hạng mục kiểm tra bổ sung do KTV hiện trường ghi nhận cho sự cố này.',
      isCritical: false,
      checked: true,
    };

    const next = [...items, newItem];
    updateItems(next);
    setCustomTitle('');
    setShowAddCustom(false);
  };

  const handleExportToFixSummary = () => {
    const completedItems = items.filter((i) => i.checked);
    if (completedItems.length === 0) return;

    const summaryText = `[ĐÃ HOÀN TẤT CHECKLIST BẢO TRÌ TIÊU CHUẨN ${sopTemplate.modelCode} - ${sopTemplate.sopDocumentId}]\n` +
      completedItems.map((i, idx) => `• Bước ${idx + 1}: ${i.title}${i.nominalSpec ? ` (Đạt chuẩn: ${i.nominalSpec})` : ''}`).join('\n');

    onApplyToReportSummary?.(summaryText);
  };

  const filteredItems = useMemo(() => {
    if (filterStage === 'ALL') return items;
    return items.filter((i) => i.stage === filterStage);
  }, [items, filterStage]);

  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-slate-900/90 p-4 shadow-xl">
      {/* 1. Header with Model SOP Badge & Compliance Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40">
            <CheckSquare className="h-5 w-5 text-emerald-400" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Checklist Quy Trình Chuẩn Sau Sửa Chữa (SOP)</span>
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              </h3>
              <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                {sopTemplate.modelCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-2">
              <span className="font-semibold text-slate-200">{sopTemplate.sopDocumentId}</span>
              <span>•</span>
              <span className="text-slate-400">{sopTemplate.sopVersion}</span>
              <span>•</span>
              <span className="text-indigo-300 font-mono">Định mức: ~{sopTemplate.standardDurationMin}p</span>
            </p>
          </div>
        </div>

        {/* Progress Metric & Quick Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleMarkAll}
            className="rounded-lg bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 transition"
            title="Đánh dấu tất cả các bước đã kiểm tra đạt chuẩn"
          >
            Đạt Tất Cả
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
            title="Đặt lại trạng thái ban đầu"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Progress Bar & Safety Warning Banner */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 flex items-center gap-1.5 font-medium">
            Tiến độ hoàn thành:
            <strong className={`${percent === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {completedCount}/{totalCount} mục ({percent}%)
            </strong>
          </span>

          <span className={`text-[11px] flex items-center gap-1 font-bold ${
            allCriticalDone ? 'text-emerald-400' : 'text-red-400 animate-pulse'
          }`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>
              {allCriticalDone
                ? `An toàn: ${completedCriticalCount}/${criticalCount} đạt`
                : `Cảnh báo: Còn ${criticalCount - completedCriticalCount} bước an toàn bắt buộc`}
            </span>
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              percent === 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : percent >= 50
                ? 'bg-gradient-to-r from-blue-500 to-emerald-400'
                : 'bg-gradient-to-r from-amber-500 to-yellow-400'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Compliance Milestone Badge if 100% */}
        {percent === 100 && (
          <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Nghiệm thu hoàn tất:</strong> Toàn bộ quy trình kiểm chuẩn theo tài liệu kỹ thuật {sopTemplate.modelCode} đã được KTV xác nhận!
              </span>
            </div>
            {onApplyToReportSummary && (
              <button
                type="button"
                onClick={handleExportToFixSummary}
                className="shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition"
              >
                Chèn Vào Báo Cáo
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Stage Filters */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'ALL', label: 'Tất cả (' + items.length + ')' },
          { id: 'SAFETY', label: '🔒 An Toàn LOTO' },
          { id: 'MECHANICAL', label: '🔧 Cơ Khí & Bơm' },
          { id: 'CALIBRATION', label: '⚡ Hiệu Chuẩn' },
          { id: 'COMMISSIONING', label: '🚀 Chạy Thử Test' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterStage(tab.id)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition shrink-0 ${
              filterStage === tab.id
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowAddCustom(!showAddCustom)}
          className="ml-auto flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 px-2 py-1 text-[11px] font-medium transition shrink-0"
        >
          <Plus className="h-3 w-3" />
          <span>Thêm Hạng Mục</span>
        </button>
      </div>

      {/* Add Custom Item Form */}
      {showAddCustom && (
        <form onSubmit={handleAddCustomItem} className="mt-2.5 flex items-center gap-2 rounded-xl bg-slate-950 p-2 border border-slate-700">
          <select
            value={customStage}
            onChange={(e) => setCustomStage(e.target.value as any)}
            className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="MECHANICAL">2. Cơ Khí</option>
            <option value="SAFETY">1. An Toàn</option>
            <option value="CALIBRATION">3. Hiệu Chuẩn</option>
            <option value="COMMISSIONING">4. Chạy Thử</option>
          </select>
          <input
            type="text"
            required
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Mô tả bước kiểm tra phát sinh..."
            className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition"
          >
            Thêm
          </button>
          <button
            type="button"
            onClick={() => setShowAddCustom(false)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* 4. Interactive Checklist Stream */}
      <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
        {filteredItems.map((item) => {
          const isExpanded = expandedItemId === item.id;

          return (
            <div
              key={item.id}
              className={`rounded-xl border transition-all duration-200 ${
                item.checked
                  ? 'border-emerald-500/50 bg-emerald-950/20'
                  : item.isCritical
                  ? 'border-red-500/30 bg-slate-950/80 hover:border-red-500/50'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              {/* Item Header Row */}
              <div className="flex items-start justify-between gap-3 p-2.5 sm:p-3">
                <button
                  type="button"
                  onClick={() => handleToggle(item.id)}
                  className="flex items-start gap-2.5 text-left flex-1 group"
                >
                  <div className="mt-0.5 shrink-0">
                    {item.checked ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-500 group-hover:text-emerald-400 transition" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.stageLabel}
                      </span>
                      {item.isCritical && (
                        <span className="rounded bg-red-500/20 border border-red-500/40 px-1.5 py-0.2 text-[9px] font-bold text-red-300 font-mono">
                          BẮT BUỘC
                        </span>
                      )}
                    </div>

                    <div
                      className={`text-xs sm:text-sm font-medium mt-0.5 leading-snug ${
                        item.checked ? 'text-emerald-300 font-semibold' : 'text-slate-200'
                      }`}
                    >
                      {item.title}
                    </div>

                    {item.nominalSpec && (
                      <div className="text-[11px] text-amber-300 font-mono mt-1 flex items-center gap-1">
                        <Gauge className="h-3 w-3 text-amber-400 shrink-0" />
                        <span>Chỉ số danh định: <strong>{item.nominalSpec}</strong></span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Expand / Details Toggle Button */}
                <button
                  type="button"
                  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  className="p-1 rounded text-slate-400 hover:text-white transition shrink-0"
                  title="Xem chi tiết hướng dẫn SOP & dụng cụ"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Collapsible Details Panel */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-900/60 p-3 text-xs space-y-2 rounded-b-xl">
                  <div>
                    <span className="text-slate-400 font-medium">Hướng dẫn thao tác chi tiết:</span>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">{item.description}</p>
                  </div>

                  {item.toolRequired && (
                    <div className="flex items-center gap-1.5 text-indigo-300 bg-indigo-950/30 border border-indigo-500/30 rounded-lg p-2 font-mono text-[11px]">
                      <Wrench className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span>Dụng cụ / Thiết bị đo khuyến nghị: <strong>{item.toolRequired}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
