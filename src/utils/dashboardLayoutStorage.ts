export type TopLevelCardId = 'facility-summary' | 'predictive-alerts' | 'performance-analytics';

export interface TopLevelCardMeta {
  id: TopLevelCardId;
  name: string;
  shortName: string;
  description: string;
  category: string;
}

export const TOP_LEVEL_CARDS_META: Record<TopLevelCardId, TopLevelCardMeta> = {
  'facility-summary': {
    id: 'facility-summary',
    name: 'Tổng Quan Hiệu Suất Xưởng (Facility Summary)',
    shortName: 'Chỉ Số Tổng Quan (KPIs)',
    description: 'Thống kê tức thời số máy đang chạy, dừng khẩn cấp, hiệu suất OEE trung bình và bộ lọc trạng thái máy.',
    category: 'Giám Sát Thời Gian Thực',
  },
  'predictive-alerts': {
    id: 'predictive-alerts',
    name: 'Cảnh Báo Bảo Trì Dự Đoán (Predictive Alerts)',
    shortName: 'Cảnh Báo Chu Kỳ Bảo Dưỡng',
    description: 'Theo dõi tiến trình giờ máy, cảnh báo linh kiện sắp tới hạn và công tắc tắt/bật thông báo toàn xưởng.',
    category: 'Bảo Trì Dự Đoán',
  },
  'performance-analytics': {
    id: 'performance-analytics',
    name: 'Phân Tích Hiệu Suất & Dự Báo Uptime (Performance Analytics)',
    shortName: 'Phân Tích Uptime & Recharts',
    description: 'Biểu đồ Recharts 30 ngày dừng máy, tỷ lệ OEE sản xuất và mô hình dự báo hiệu suất 7 ngày tới.',
    category: 'Phân Tích & Dự Báo',
  },
};

export const DEFAULT_TOP_LEVEL_CARDS_ORDER: TopLevelCardId[] = [
  'facility-summary',
  'predictive-alerts',
  'performance-analytics',
];

const STORAGE_KEY = 'edm_smartguard_dashboard_top_cards_order_v1';

export function getStoredDashboardCardsOrder(): TopLevelCardId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [...DEFAULT_TOP_LEVEL_CARDS_ORDER];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Validate that all known IDs exist
      const validIds: TopLevelCardId[] = ['facility-summary', 'predictive-alerts', 'performance-analytics'];
      const filtered = parsed.filter((id) => validIds.includes(id as TopLevelCardId)) as TopLevelCardId[];
      // Add any missing ones
      validIds.forEach((id) => {
        if (!filtered.includes(id)) {
          filtered.push(id);
        }
      });
      return filtered;
    }
    return [...DEFAULT_TOP_LEVEL_CARDS_ORDER];
  } catch {
    return [...DEFAULT_TOP_LEVEL_CARDS_ORDER];
  }
}

export function saveDashboardCardsOrder(order: TopLevelCardId[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch (err) {
    console.error('Failed to save dashboard cards order:', err);
  }
}

export function resetDashboardCardsOrder(): TopLevelCardId[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore error
  }
  return [...DEFAULT_TOP_LEVEL_CARDS_ORDER];
}
