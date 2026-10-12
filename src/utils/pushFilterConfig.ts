import { PushNotificationFilterConfig, PushNotificationSeverityFilter } from '../types';

export const PUSH_FILTER_CONFIG_STORAGE_KEY = 'edm_push_notification_filter_config_v1';

export const DEFAULT_PUSH_FILTER_CONFIG: PushNotificationFilterConfig = {
  severityFilter: 'ALL',
  nightShiftMode: true,
  nightShiftStartHour: 22, // 22:00
  nightShiftEndHour: 6, // 06:00
  nightShiftSeverityFilter: 'CRITICAL_ONLY',
  vibrationEnabled: true,
  soundAlarmEnabled: true,
  muteIdleAlarms: true,
  autoAcknowledgeLowSeverity: false,
  ignoredDeviceCodes: [],
};

export function getStoredPushFilterConfig(): PushNotificationFilterConfig {
  try {
    const raw = localStorage.getItem(PUSH_FILTER_CONFIG_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PUSH_FILTER_CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_PUSH_FILTER_CONFIG));
      return DEFAULT_PUSH_FILTER_CONFIG;
    }
    return { ...DEFAULT_PUSH_FILTER_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PUSH_FILTER_CONFIG;
  }
}

export function savePushFilterConfig(config: PushNotificationFilterConfig): void {
  try {
    localStorage.setItem(PUSH_FILTER_CONFIG_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('edm_push_filter_config_updated', { detail: config }));
  } catch (err) {
    console.error('Failed to save push filter config:', err);
  }
}

export function isCurrentTimeInNightShift(startHour: number = 22, endHour: number = 6): boolean {
  const currentHour = new Date().getHours();
  if (startHour > endHour) {
    // Crosses midnight, e.g. 22:00 to 06:00
    return currentHour >= startHour || currentHour < endHour;
  }
  // Same day window, e.g. 01:00 to 06:00
  return currentHour >= startHour && currentHour < endHour;
}

export function determineActivePushThreshold(config: PushNotificationFilterConfig): {
  activeFilter: PushNotificationSeverityFilter;
  isNightShiftActive: boolean;
  reason: string;
} {
  const inNight = config.nightShiftMode && isCurrentTimeInNightShift(config.nightShiftStartHour, config.nightShiftEndHour);
  if (inNight) {
    return {
      activeFilter: config.nightShiftSeverityFilter,
      isNightShiftActive: true,
      reason: `Đang trong ca trực đêm (${config.nightShiftStartHour.toString().padStart(2, '0')}:00 - ${config.nightShiftEndHour.toString().padStart(2, '0')}:00), áp dụng bộ lọc giảm nhiễu: ${config.nightShiftSeverityFilter === 'CRITICAL_ONLY' ? 'Chỉ thông báo Critical' : config.nightShiftSeverityFilter === 'HIGH_AND_CRITICAL' ? 'Critical & High' : 'Tất cả'}`,
    };
  }

  return {
    activeFilter: config.severityFilter,
    isNightShiftActive: false,
    reason: `Chế độ tiêu chuẩn: ${config.severityFilter === 'CRITICAL_ONLY' ? 'Chỉ thông báo Critical' : config.severityFilter === 'HIGH_AND_CRITICAL' ? 'Critical & High' : 'Tất cả thông báo'}`,
  };
}

export function shouldDeliverPushNotification(
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | undefined,
  deviceCode: string,
  config: PushNotificationFilterConfig = getStoredPushFilterConfig()
): { allowed: boolean; reason: string } {
  // 1. Check if device is ignored
  if (config.ignoredDeviceCodes && config.ignoredDeviceCodes.includes(deviceCode)) {
    return {
      allowed: false,
      reason: `Thiết bị ${deviceCode} đang nằm trong danh sách tạm ẩn thông báo đẩy`,
    };
  }

  const { activeFilter, isNightShiftActive } = determineActivePushThreshold(config);

  // If no severity provided, default to CRITICAL for emergency stop
  const effectiveSeverity = severity || 'CRITICAL';

  if (activeFilter === 'CRITICAL_ONLY') {
    if (effectiveSeverity === 'CRITICAL') {
      return {
        allowed: true,
        reason: isNightShiftActive
          ? 'Cho phép gửi (Sự cố mức Critical trong ca trực đêm)'
          : 'Cho phép gửi (Sự cố mức Critical đạt ngưỡng cài đặt)',
      };
    }
    return {
      allowed: false,
      reason: isNightShiftActive
        ? `Đã chặn thông báo ${effectiveSeverity} để giảm thiểu nhiễu thông tin trong ca trực đêm (chỉ nhận Critical)`
        : `Đã chặn thông báo ${effectiveSeverity} theo cài đặt lọc ngưỡng (chỉ nhận Critical)`,
    };
  }

  if (activeFilter === 'HIGH_AND_CRITICAL') {
    if (effectiveSeverity === 'CRITICAL' || effectiveSeverity === 'HIGH') {
      return {
        allowed: true,
        reason: 'Cho phép gửi (Mức độ sự cố Critical hoặc High)',
      };
    }
    return {
      allowed: false,
      reason: `Đã chặn thông báo ${effectiveSeverity} (Ngưỡng yêu cầu tối thiểu là High hoặc Critical)`,
    };
  }

  return {
    allowed: true,
    reason: 'Cho phép gửi (Chế độ nhận tất cả thông báo)',
  };
}
