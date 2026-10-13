import { ShortcutTelemetryItem, ShortcutTelemetryLog, ShortcutTelemetryState } from '../types';

export const SHORTCUT_DEFINITIONS: Record<string, { combo: string; action: string; category: 'navigation' | 'operation'; description: string }> = {
  alt_1: {
    combo: 'Alt + 1',
    action: 'Chuyển tab Giám Sát EDM Trực Tuyến',
    category: 'navigation',
    description: 'Mở màn hình giám sát thời gian thực tham số EDM, telemetry hồ quang & áp suất',
  },
  alt_2: {
    combo: 'Alt + 2',
    action: 'Chuyển tab Bộ Não Tri Thức AI',
    category: 'navigation',
    description: 'Tra cứu bài học giải quyết sự cố, nguyên nhân gốc rễ và khuyến nghị kỹ thuật',
  },
  alt_3: {
    combo: 'Alt + 3',
    action: 'Chuyển tab Kho Tài Liệu SOP/OEM',
    category: 'navigation',
    description: 'Truy cập tài liệu hướng dẫn kỹ thuật, sơ đồ mạch và catalog Makino / Sodick',
  },
  alt_4: {
    combo: 'Alt + 4',
    action: 'Chuyển tab Nhật Ký Bắn Push',
    category: 'navigation',
    description: 'Theo dõi lịch sử bắn thông báo đẩy FCM tới điện thoại kỹ thuật viên trực ca',
  },
  alt_5: {
    combo: 'Alt + 5',
    action: 'Chuyển tab Thiết Bị Di Động KTV',
    category: 'navigation',
    description: 'Quản lý máy tính bảng / điện thoại công nghiệp và đồng bộ offline',
  },
  alt_6: {
    combo: 'Alt + 6',
    action: 'Chuyển tab Lịch Sử Sửa Chữa & Bảo Trì',
    category: 'navigation',
    description: 'Lưu trữ, tra cứu và lọc hồ sơ bảo dưỡng, sửa chữa và thay thế linh kiện',
  },
  shift_r: {
    combo: 'Shift + R / Alt + R',
    action: 'Làm Mới & Đồng Bộ Dữ Liệu Xưởng',
    category: 'operation',
    description: 'Gọi fetchAllData cập nhật tức thì telemetry từ Gateway máy EDM mà không cần tải lại trang',
  },
  alt_q: {
    combo: 'Alt + Q',
    action: 'Quét Tem Mã QR Thân Máy EDM',
    category: 'operation',
    description: 'Bật camera quét QR dán trên khung máy EDM để mở tức thì hồ sơ bảo trì máy',
  },
  alt_t: {
    combo: 'Alt + T',
    action: 'Thanh Bên Trực Ca Kỹ Thuật Viên',
    category: 'operation',
    description: 'Mở danh sách kỹ thuật viên đang trong ca trực để điều phối xử lý dừng máy',
  },
  alt_m: {
    combo: 'Alt + M',
    action: 'Bật / Tắt Âm Còi Báo Động (Mute/Unmute)',
    category: 'operation',
    description: 'Tắt hoặc bật chuông còi báo động công nghiệp khi đang thao tác xử lý lỗi',
  },
  alt_f: {
    combo: 'Alt + F / S',
    action: 'Tìm Kiếm Nhanh Thiết Bị / Mã Lỗi',
    category: 'operation',
    description: 'Focus con trỏ vào thanh tìm kiếm máy EDM hoặc tra cứu mã lỗi E-101..E-108',
  },
  alt_e: {
    combo: 'Alt + E',
    action: 'Chẩn Đoán AI Khẩn Cấp (Emergency AI Diagnosis)',
    category: 'operation',
    description: 'Tự động mở Trợ Lý AI Chẩn Đoán cho thiết bị đang bị lỗi hoặc cảnh báo gần nhất để xử lý cấp bách',
  },
  alt_k: {
    combo: 'Alt + K / ?',
    action: 'Mở Bảng Phím Tắt & Giám Sát Telemetry',
    category: 'operation',
    description: 'Mở giao diện phím tắt công nghiệp và bảng đánh giá độ tận dụng của KTV',
  },
  escape: {
    combo: 'Esc',
    action: 'Đóng Modal / Hủy Thao Tác Nhanh',
    category: 'operation',
    description: 'Đóng cửa sổ báo cáo, chẩn đoán AI hoặc modal cảnh báo đang hiển thị',
  },
};

const STORAGE_KEY = 'edm_industrial_shortcut_telemetry';

// Baseline seed data representing initial operational shifts
export const createInitialSeedTelemetry = (): ShortcutTelemetryState => {
  const now = new Date();
  const sessionStartTime = new Date(now.getTime() - 4 * 3600 * 1000).toISOString(); // 4 hours ago

  const items: Record<string, ShortcutTelemetryItem> = {
    alt_1: {
      id: 'alt_1',
      combo: 'Alt + 1',
      action: 'Chuyển tab Giám Sát EDM Trực Tuyến',
      category: 'navigation',
      count: 14,
      lastUsedAt: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
    },
    alt_2: {
      id: 'alt_2',
      combo: 'Alt + 2',
      action: 'Chuyển tab Bộ Não Tri Thức AI',
      category: 'navigation',
      count: 6,
      lastUsedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    },
    alt_3: {
      id: 'alt_3',
      combo: 'Alt + 3',
      action: 'Chuyển tab Kho Tài Liệu SOP/OEM',
      category: 'navigation',
      count: 3,
      lastUsedAt: new Date(now.getTime() - 95 * 60 * 1000).toISOString(),
    },
    alt_4: {
      id: 'alt_4',
      combo: 'Alt + 4',
      action: 'Chuyển tab Nhật Ký Bắn Push',
      category: 'navigation',
      count: 4,
      lastUsedAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    },
    alt_5: {
      id: 'alt_5',
      combo: 'Alt + 5',
      action: 'Chuyển tab Thiết Bị Di Động KTV',
      category: 'navigation',
      count: 2,
      lastUsedAt: new Date(now.getTime() - 110 * 60 * 1000).toISOString(),
    },
    alt_6: {
      id: 'alt_6',
      combo: 'Alt + 6',
      action: 'Chuyển tab Lịch Sử Sửa Chữa & Bảo Trì',
      category: 'navigation',
      count: 9,
      lastUsedAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
    },
    shift_r: {
      id: 'shift_r',
      combo: 'Shift + R / Alt + R',
      action: 'Làm Mới & Đồng Bộ Dữ Liệu Xưởng',
      category: 'operation',
      count: 11,
      lastUsedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    },
    alt_q: {
      id: 'alt_q',
      combo: 'Alt + Q',
      action: 'Quét Tem Mã QR Thân Máy EDM',
      category: 'operation',
      count: 7,
      lastUsedAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
    },
    alt_t: {
      id: 'alt_t',
      combo: 'Alt + T',
      action: 'Thanh Bên Trực Ca Kỹ Thuật Viên',
      category: 'operation',
      count: 5,
      lastUsedAt: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
    },
    alt_m: {
      id: 'alt_m',
      combo: 'Alt + M',
      action: 'Bật / Tắt Âm Còi Báo Động (Mute/Unmute)',
      category: 'operation',
      count: 3,
      lastUsedAt: new Date(now.getTime() - 75 * 60 * 1000).toISOString(),
    },
    alt_f: {
      id: 'alt_f',
      combo: 'Alt + F / S',
      action: 'Tìm Kiếm Nhanh Thiết Bị / Mã Lỗi',
      category: 'operation',
      count: 8,
      lastUsedAt: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
    },
    alt_e: {
      id: 'alt_e',
      combo: 'Alt + E',
      action: 'Chẩn Đoán AI Khẩn Cấp (Emergency AI Diagnosis)',
      category: 'operation',
      count: 6,
      lastUsedAt: new Date(now.getTime() - 9 * 60 * 1000).toISOString(),
    },
    alt_k: {
      id: 'alt_k',
      combo: 'Alt + K / ?',
      action: 'Mở Bảng Phím Tắt & Giám Sát Telemetry',
      category: 'operation',
      count: 5,
      lastUsedAt: new Date(now.getTime() - 3 * 60 * 1000).toISOString(),
    },
    escape: {
      id: 'escape',
      combo: 'Esc',
      action: 'Đóng Modal / Hủy Thao Tác Nhanh',
      category: 'operation',
      count: 12,
      lastUsedAt: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
    },
  };

  const totalCount = Object.values(items).reduce((sum, item) => sum + item.count, 0);

  const recentLogs: ShortcutTelemetryLog[] = [
    {
      id: 'log-1',
      shortcutId: 'alt_k',
      combo: 'Alt + K',
      action: 'Mở Bảng Phím Tắt & Giám Sát Telemetry',
      timestamp: new Date(now.getTime() - 3 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-2',
      shortcutId: 'escape',
      combo: 'Esc',
      action: 'Đóng Modal / Hủy Thao Tác Nhanh',
      timestamp: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-3',
      shortcutId: 'alt_1',
      combo: 'Alt + 1',
      action: 'Chuyển tab Giám Sát EDM Trực Tuyến',
      timestamp: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-4',
      shortcutId: 'shift_r',
      combo: 'Shift + R',
      action: 'Làm Mới & Đồng Bộ Dữ Liệu Xưởng',
      timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-5',
      shortcutId: 'alt_f',
      combo: 'Alt + F',
      action: 'Tìm Kiếm Nhanh Thiết Bị / Mã Lỗi',
      timestamp: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-6',
      shortcutId: 'alt_6',
      combo: 'Alt + 6',
      action: 'Chuyển tab Lịch Sử Sửa Chữa & Bảo Trì',
      timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
    },
  ];

  return {
    items,
    totalCount,
    sessionStartTime,
    recentLogs,
    lastRecordedShortcut: 'alt_k',
  };
};

/**
 * Loads telemetry from localStorage, ensuring all defined shortcuts exist
 */
export const getInitialShortcutTelemetry = (): ShortcutTelemetryState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ShortcutTelemetryState;
      if (parsed && parsed.items && typeof parsed.totalCount === 'number') {
        // Ensure all definitions exist in items
        const mergedItems: Record<string, ShortcutTelemetryItem> = {};
        for (const [key, def] of Object.entries(SHORTCUT_DEFINITIONS)) {
          if (parsed.items[key]) {
            mergedItems[key] = {
              ...parsed.items[key],
              combo: def.combo,
              action: def.action,
              category: def.category,
            };
          } else {
            mergedItems[key] = {
              id: key,
              combo: def.combo,
              action: def.action,
              category: def.category,
              count: 0,
              lastUsedAt: null,
            };
          }
        }
        return {
          ...parsed,
          items: mergedItems,
        };
      }
    }
  } catch (err) {
    console.warn('Could not read shortcut telemetry from localStorage:', err);
  }

  const baseline = createInitialSeedTelemetry();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(baseline));
  } catch {
    // Ignore storage errors
  }
  return baseline;
};

/**
 * Records a shortcut use, updating state and localStorage
 */
export const recordShortcutUse = (
  prevState: ShortcutTelemetryState,
  shortcutId: string
): ShortcutTelemetryState => {
  const now = new Date();
  const timestamp = now.toISOString();

  const def = SHORTCUT_DEFINITIONS[shortcutId] || {
    combo: shortcutId.toUpperCase(),
    action: 'Phím tắt tùy biến',
    category: 'operation' as const,
    description: '',
  };

  const currentItem = prevState.items[shortcutId] || {
    id: shortcutId,
    combo: def.combo,
    action: def.action,
    category: def.category,
    count: 0,
    lastUsedAt: null,
  };

  const updatedItem: ShortcutTelemetryItem = {
    ...currentItem,
    count: currentItem.count + 1,
    lastUsedAt: timestamp,
  };

  const newLog: ShortcutTelemetryLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    shortcutId,
    combo: def.combo,
    action: def.action,
    timestamp,
  };

  const updatedLogs = [newLog, ...prevState.recentLogs.slice(0, 24)]; // Keep latest 25 logs
  const updatedItems = {
    ...prevState.items,
    [shortcutId]: updatedItem,
  };
  const updatedTotalCount = prevState.totalCount + 1;

  const nextState: ShortcutTelemetryState = {
    ...prevState,
    items: updatedItems,
    totalCount: updatedTotalCount,
    recentLogs: updatedLogs,
    lastRecordedShortcut: shortcutId,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    // ignore
  }

  return nextState;
};

/**
 * Resets all counts to zero (e.g., when starting a new technician evaluation cycle)
 */
export const resetShortcutTelemetry = (): ShortcutTelemetryState => {
  const items: Record<string, ShortcutTelemetryItem> = {};
  for (const [key, def] of Object.entries(SHORTCUT_DEFINITIONS)) {
    items[key] = {
      id: key,
      combo: def.combo,
      action: def.action,
      category: def.category,
      count: 0,
      lastUsedAt: null,
    };
  }

  const freshState: ShortcutTelemetryState = {
    items,
    totalCount: 0,
    sessionStartTime: new Date().toISOString(),
    recentLogs: [],
    lastRecordedShortcut: null,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshState));
  } catch {
    // ignore
  }

  return freshState;
};

/**
 * Calculates adoption score and qualitative evaluation for technical managers
 */
export interface AdoptionEvaluation {
  score: number; // 0 to 100
  tier: 'XUẤT SẮC' | 'TỐT' | 'TRUNG BÌNH' | 'CẦN ĐÀO TẠO';
  tierColor: string;
  badgeBg: string;
  activeCount: number;
  totalAvailable: number;
  activePercentage: number;
  estimatedTimeSavedMinutes: number; // Based on 3.5 seconds saved per shortcut vs mouse
  mostUsed: ShortcutTelemetryItem | null;
  leastUsed: ShortcutTelemetryItem[];
  managerRecommendation: string;
  summaryNote: string;
}

export const evaluateTechnicianAdoption = (state: ShortcutTelemetryState): AdoptionEvaluation => {
  const allItems = Object.values(state.items);
  const totalAvailable = allItems.length;
  const activeItems = allItems.filter((i) => i.count > 0);
  const activeCount = activeItems.length;
  const activePercentage = totalAvailable > 0 ? Math.round((activeCount / totalAvailable) * 100) : 0;

  // Most used
  const sortedByCount = [...allItems].sort((a, b) => b.count - a.count);
  const mostUsed = sortedByCount.length > 0 && sortedByCount[0].count > 0 ? sortedByCount[0] : null;

  // Least used / Unused (count === 0 or lowest)
  const leastUsed = allItems.filter((i) => i.count === 0);

  // Time saved estimate: ~3.5 seconds saved per hotkey use vs navigating menus with mouse/gloves
  const estimatedTimeSavedMinutes = Math.round((state.totalCount * 3.5) / 60);

  // Calculate score: 50% based on breadth of shortcuts utilized + 50% based on frequency volume (cap at 60 triggers)
  const breadthScore = (activeCount / Math.max(1, totalAvailable)) * 50;
  const volumeScore = Math.min(50, (state.totalCount / 50) * 50);
  const score = Math.min(100, Math.round(breadthScore + volumeScore));

  let tier: 'XUẤT SẮC' | 'TỐT' | 'TRUNG BÌNH' | 'CẦN ĐÀO TẠO' = 'CẦN ĐÀO TẠO';
  let tierColor = 'text-rose-400';
  let badgeBg = 'bg-rose-500/10 border-rose-500/30 text-rose-300';
  let managerRecommendation = '';
  let summaryNote = '';

  if (score >= 80) {
    tier = 'XUẤT SẮC';
    tierColor = 'text-emerald-400';
    badgeBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
    managerRecommendation =
      'Kỹ thuật viên đã hình thành phản xạ thao tác phím tắt công nghiệp rất điêu luyện. Nên khuyến khích KTV chia sẻ kinh nghiệm thao tác không cần chuột cho các học viên thực tập mới.';
    summaryNote = `KTV tận dụng rất tốt ${activeCount}/${totalAvailable} phím tắt, giúp thao tác an toàn và tiết kiệm ~${estimatedTimeSavedMinutes} phút mỗi ca.`;
  } else if (score >= 60) {
    tier = 'TỐT';
    tierColor = 'text-cyan-400';
    badgeBg = 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';
    managerRecommendation =
      'KTV đã làm chủ các phím điều hướng tab chính (Alt+1..6) và quét QR. Quản lý cần nhắc nhở KTV sử dụng thêm phím Shift+R (Đồng bộ) và Alt+M (Tắt còi báo) khi xử lý sự cố tại xưởng.';
    summaryNote = `Mức độ tận dụng đạt ${activePercentage}%. KTV đã quen với các phím chính nhưng cần mở rộng các phím chức năng vận hành nhanh.`;
  } else if (score >= 35) {
    tier = 'TRUNG BÌNH';
    tierColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 border-amber-500/30 text-amber-300';
    managerRecommendation =
      'KTV vẫn chủ yếu dùng chuột hoặc chạm màn hình cảm ứng. Cần dán bảng tra cứu phím tắt Alt+1..6 tại bàn điều khiển IPC của máy EDM để hỗ trợ KTV khi đeo găng dầu mỡ.';
    summaryNote = `KTV mới sử dụng ${activeCount} phím tắt. Tần suất còn thấp, cần có tài liệu nhắc việc trực quan tại máy.`;
  } else {
    tier = 'CẦN ĐÀO TẠO';
    tierColor = 'text-rose-400';
    badgeBg = 'bg-rose-500/10 border-rose-500/30 text-rose-300';
    managerRecommendation =
      'Kỹ thuật viên hầu như chưa tận dụng hệ thống phím tắt công nghiệp. Quản lý ca cần tổ chức buổi hướng dẫn 15 phút về thao tác phím tắt để tối ưu hóa thời gian xử lý sự cố khẩn cấp.';
    summaryNote = `Chưa hình thành thói quen dùng phím tắt. Đề xuất đào tạo bổ sung cho KTV trong tuần này.`;
  }

  return {
    score,
    tier,
    tierColor,
    badgeBg,
    activeCount,
    totalAvailable,
    activePercentage,
    estimatedTimeSavedMinutes,
    mostUsed,
    leastUsed,
    managerRecommendation,
    summaryNote,
  };
};

/**
 * Generates and triggers download of CSV report for engineering managers
 */
export const exportShortcutTelemetryCSV = (state: ShortcutTelemetryState) => {
  const evalData = evaluateTechnicianAdoption(state);
  const nowStr = new Date().toLocaleString('vi-VN');

  const headers = [
    'Mã Phím Tắt',
    'Tổ Hợp Phím',
    'Chức Năng Điều Khiển',
    'Nhóm Phân Loại',
    'Số Lần Kích Hoạt',
    'Tỷ Lệ Đóng Góp (%)',
    'Lần Dùng Gần Nhất',
    'Đánh Giá Tần Suất',
  ];

  const total = Math.max(1, state.totalCount);
  const rows = Object.values(state.items).map((item) => {
    const pct = ((item.count / total) * 100).toFixed(1);
    const lastUsed = item.lastUsedAt
      ? new Date(item.lastUsedAt).toLocaleString('vi-VN')
      : 'Chưa sử dụng';
    let statusText = 'Chưa dùng';
    if (item.count >= 10) statusText = 'Rất thường xuyên';
    else if (item.count >= 5) statusText = 'Thường xuyên';
    else if (item.count > 0) statusText = 'Thỉnh thoảng';

    return [
      item.id,
      `"${item.combo}"`,
      `"${item.action}"`,
      item.category === 'navigation' ? 'Điều hướng Tab' : 'Thao tác Vận hành',
      item.count,
      `${pct}%`,
      `"${lastUsed}"`,
      statusText,
    ];
  });

  const metadataHeader = [
    ['BÁO CÁO TELEMETRY TẦN SUẤT SỬ DỤNG PHÍM TẮT CÔNG NGHIỆP - XƯỞNG EDM'],
    [`Thời điểm xuất báo cáo: ${nowStr}`],
    [`Tổng số lượt phím tắt đã ghi nhận: ${state.totalCount} lượt`],
    [`Điểm số thành thạo phím tắt KTV: ${evalData.score}/100 (${evalData.tier})`],
    [`Tỷ lệ bao phủ phím tắt: ${evalData.activePercentage}% (${evalData.activeCount}/${evalData.totalAvailable} phím)`],
    [`Ước tính thời gian tiết kiệm cho ca trực: ~${evalData.estimatedTimeSavedMinutes} phút`],
    [`Đánh giá của Quản lý Kỹ thuật: "${evalData.managerRecommendation}"`],
    ['--------------------------------------------------'],
  ];

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Excel in Vietnamese
    metadataHeader.map((row) => row.join(',')).join('\n') +
    '\n' +
    headers.join(',') +
    '\n' +
    rows.map((r) => r.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Bao_Cao_Telemetry_Phim_Tat_KTV_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
