import { Device, TechnicalDocument, AILearning } from '../types';

const STORAGE_KEYS = {
  DEVICES: 'smartguard_offline_devices',
  DOCUMENTS: 'smartguard_offline_documents',
  LEARNINGS: 'smartguard_offline_learnings',
  LAST_SYNC: 'smartguard_offline_last_sync',
  SIMULATED_OFFLINE: 'smartguard_simulated_offline',
};

export interface OfflineCacheInfo {
  deviceCount: number;
  documentCount: number;
  learningCount: number;
  lastSyncTime: string | null;
  hasServiceWorker: boolean;
}

/**
 * Registers the Service Worker for offline PWA capabilities
 */
export async function registerSmartGuardServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Check for updates
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (installingWorker) {
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[ServiceWorker] Bản cập nhật SmartGuard mới đã sẵn sàng.');
          }
        };
      }
    };

    console.log('[ServiceWorker] Đã đăng ký thành công với scope:', registration.scope);
    return registration;
  } catch (error) {
    console.warn('[ServiceWorker] Lỗi khi đăng ký:', error);
    return null;
  }
}

/**
 * Saves current device states and document metadata to both Service Worker Cache and LocalStorage
 */
export function cacheOfflineSnapshot(
  devices: Device[],
  documents: TechnicalDocument[],
  learnings: AILearning[] = []
): void {
  try {
    const now = new Date().toISOString();

    // 1. Save to LocalStorage for instant synchronous rehydration
    if (devices && devices.length > 0) {
      localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
    }
    if (documents && documents.length > 0) {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
    }
    if (learnings && learnings.length > 0) {
      localStorage.setItem(STORAGE_KEYS.LEARNINGS, JSON.stringify(learnings));
    }
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);

    // 2. Dispatch to active Service Worker Cache
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_SNAPSHOT',
        payload: {
          devices,
          documents,
          learnings,
        },
      });
    }
  } catch (err) {
    console.warn('[OfflineManager] Không thể lưu bản đệm offline:', err);
  }
}

/**
 * Retrieves cached device states and document metadata from offline storage
 */
export function getOfflineSnapshot(): {
  devices: Device[];
  documents: TechnicalDocument[];
  learnings: AILearning[];
  lastSyncTime: string | null;
} {
  try {
    const devRaw = localStorage.getItem(STORAGE_KEYS.DEVICES);
    const docRaw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    const learnRaw = localStorage.getItem(STORAGE_KEYS.LEARNINGS);
    const lastSyncTime = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);

    return {
      devices: devRaw ? JSON.parse(devRaw) : [],
      documents: docRaw ? JSON.parse(docRaw) : [],
      learnings: learnRaw ? JSON.parse(learnRaw) : [],
      lastSyncTime,
    };
  } catch {
    return { devices: [], documents: [], learnings: [], lastSyncTime: null };
  }
}

/**
 * Gets offline storage metrics and health
 */
export function getOfflineCacheInfo(): OfflineCacheInfo {
  const snapshot = getOfflineSnapshot();
  const hasSW = typeof navigator !== 'undefined' && 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;

  return {
    deviceCount: snapshot.devices.length,
    documentCount: snapshot.documents.length,
    learningCount: snapshot.learnings.length,
    lastSyncTime: snapshot.lastSyncTime,
    hasServiceWorker: hasSW,
  };
}

/**
 * Toggles simulated offline mode for testing intermittent connectivity
 */
export function setSimulatedOffline(isOffline: boolean): void {
  if (isOffline) {
    sessionStorage.setItem(STORAGE_KEYS.SIMULATED_OFFLINE, 'true');
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.SIMULATED_OFFLINE);
  }
  window.dispatchEvent(new Event('connectivity-changed'));
}

export function isSimulatedOffline(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(STORAGE_KEYS.SIMULATED_OFFLINE) === 'true';
}
