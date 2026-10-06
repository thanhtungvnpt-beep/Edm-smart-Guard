import { useState, useEffect, useCallback } from 'react';
import {
  getOfflineCacheInfo,
  isSimulatedOffline,
  setSimulatedOffline,
  OfflineCacheInfo,
} from '../utils/offlineManager';

export function useOfflineStatus() {
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulated, setIsSimulated] = useState<boolean>(() => isSimulatedOffline());
  const [cacheInfo, setCacheInfo] = useState<OfflineCacheInfo>(() => getOfflineCacheInfo());

  const isOnline = isBrowserOnline && !isSimulated;

  const refreshCacheInfo = useCallback(() => {
    setCacheInfo(getOfflineCacheInfo());
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      refreshCacheInfo();
    };

    const handleOffline = () => {
      setIsBrowserOnline(false);
      refreshCacheInfo();
    };

    const handleConnectivityChange = () => {
      setIsSimulated(isSimulatedOffline());
      refreshCacheInfo();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('connectivity-changed', handleConnectivityChange);

    // Initial refresh
    refreshCacheInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('connectivity-changed', handleConnectivityChange);
    };
  }, [refreshCacheInfo]);

  const toggleSimulateOffline = () => {
    const next = !isSimulated;
    setSimulatedOffline(next);
    setIsSimulated(next);
    refreshCacheInfo();
  };

  return {
    isOnline,
    isBrowserOnline,
    isSimulated,
    cacheInfo,
    toggleSimulateOffline,
    refreshCacheInfo,
  };
}
