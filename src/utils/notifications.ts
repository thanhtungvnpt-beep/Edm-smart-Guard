// Web Push Notification & Device Vibration helper

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
  errorCode: string,
  errorTitle: string,
  technicianName: string
) {
  // Mobile vibration pattern if supported
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([400, 150, 400, 150, 600]);
    } catch (e) {
      // ignore
    }
  }

  // Native notification if granted
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(`🚨 EDM DỪNG MÁY KHẨN CẤP: ${deviceCode}`, {
        body: `Máy ${deviceName} vừa dừng khẩn cấp do lỗi [${errorCode}] ${errorTitle}. KTV ${technicianName} cần tiếp nhận ngay!`,
        icon: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=128&auto=format&fit=crop&q=80',
        tag: `edm-alarm-${Date.now()}`,
        requireInteraction: true,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn('Native notification failed:', e);
    }
  }
}
