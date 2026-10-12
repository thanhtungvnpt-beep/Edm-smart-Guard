import {
  getStoredPushFilterConfig,
  shouldDeliverPushNotification,
} from './pushFilterConfig';

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return 'denied';
  }
}

export function getPushPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export function triggerEmergencyPushNotification(
  deviceCode: string,
  deviceName: string,
  stoppedAtOrErrorCode?: string | Date,
  errorCodeOrTitle?: string,
  errorTitleOrTechName?: string,
  technicianNameOrPhone?: string,
  technicianPhoneOrSeverity?: string,
  explicitSeverity?: 'CRITICAL' | 'HIGH' | 'MEDIUM'
): { delivered: boolean; reason: string } {
  // Normalize overloaded parameters to maintain backwards compatibility
  let stoppedAt: string | Date = new Date();
  let errorCode: string | undefined = undefined;
  let errorTitle: string | undefined = undefined;
  let technicianName: string | undefined = undefined;
  let technicianPhone: string | undefined = undefined;
  let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' = explicitSeverity || 'CRITICAL';

  // Check if stoppedAtOrErrorCode is a Date or ISO string, or an error code like 'E-102'
  if (stoppedAtOrErrorCode instanceof Date || (typeof stoppedAtOrErrorCode === 'string' && stoppedAtOrErrorCode.includes('-') && stoppedAtOrErrorCode.length > 8 && stoppedAtOrErrorCode.includes(':'))) {
    stoppedAt = stoppedAtOrErrorCode;
    errorCode = errorCodeOrTitle;
    errorTitle = errorTitleOrTechName;
    technicianName = technicianNameOrPhone;
    technicianPhone = technicianPhoneOrSeverity;
  } else {
    // Legacy signature: (deviceCode, deviceName, errorCode, errorTitle, technicianName)
    stoppedAt = new Date();
    errorCode = typeof stoppedAtOrErrorCode === 'string' ? stoppedAtOrErrorCode : undefined;
    errorTitle = errorCodeOrTitle;
    technicianName = errorTitleOrTechName;
    technicianPhone = technicianNameOrPhone;
  }

  // Derive severity if not explicitly provided
  if (!explicitSeverity) {
    if (errorCode?.startsWith('E-10') || errorCode?.startsWith('ALARM-10') || errorTitle?.toLowerCase().includes('đứt dây') || errorTitle?.toLowerCase().includes('khẩn cấp') || errorTitle?.toLowerCase().includes('chập')) {
      severity = 'CRITICAL';
    } else if (errorCode?.startsWith('ALARM-20') || errorTitle?.toLowerCase().includes('áp suất') || errorTitle?.toLowerCase().includes('lọc')) {
      severity = 'HIGH';
    } else {
      severity = 'MEDIUM';
    }
  }

  // Check filter threshold
  const config = getStoredPushFilterConfig();
  const filterVerdict = shouldDeliverPushNotification(severity, deviceCode, config);

  if (!filterVerdict.allowed) {
    console.info(`[PushFilter] Push suppressed for ${deviceCode}: ${filterVerdict.reason}`);
    return { delivered: false, reason: filterVerdict.reason };
  }

  // Format exact stoppage time
  const stopDate = stoppedAt ? new Date(stoppedAt) : new Date();
  const formattedStopTime = stopDate.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const errorInfo = errorCode
    ? `[${errorCode}] ${errorTitle || ''}`
    : 'Không có mã lỗi (Ngắt dừng khẩn cấp)';

  // Mobile vibration pattern if supported and enabled in config
  if (config.vibrationEnabled && 'vibrate' in navigator) {
    try {
      if (severity === 'CRITICAL') {
        navigator.vibrate([500, 150, 500, 150, 700]);
      } else {
        navigator.vibrate([300, 150, 300]);
      }
    } catch {
      // ignore
    }
  }

  // Native notification if granted
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const severityBadge = severity === 'CRITICAL' ? '🚨 [CRITICAL - DỪNG MÁY KHẨN CẤP]' : severity === 'HIGH' ? '⚠️ [HIGH - CẢNH BÁO CAO]' : 'ℹ️ [MEDIUM - BẢO TRÌ]';
      const notifTitle = `${severityBadge} ${deviceName} (${deviceCode})`;
      const notifBody = `⚠️ Thiết bị: ${deviceName} (${deviceCode})\n⏱️ Thời gian dừng: ${formattedStopTime}\n❌ Mức độ: ${severity} | Mã: ${errorInfo}\n👤 KTV chỉ định: ${technicianName || 'KTV Ca trực'}${technicianPhone ? ` (${technicianPhone})` : ''} - Tiếp nhận ngay!`;

      const notif = new Notification(notifTitle, {
        body: notifBody,
        icon: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=128&auto=format&fit=crop&q=80',
        tag: `edm-stop-${deviceCode}-${Date.now()}`,
        requireInteraction: severity === 'CRITICAL',
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return { delivered: true, reason: filterVerdict.reason };
    } catch (e) {
      console.warn('Native notification failed:', e);
      return { delivered: false, reason: 'Lỗi phát notification trình duyệt' };
    }
  }

  return { delivered: false, reason: 'Chưa cấp quyền Notification trên trình duyệt' };
}

