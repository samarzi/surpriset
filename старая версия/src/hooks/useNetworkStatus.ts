import { useState, useEffect } from 'react';
import { logger } from '../lib/logger';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      const status: NetworkStatus = {
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
      };

      setNetworkStatus(status);
      
      logger.info('Network status updated', status);
    };

    const handleOnline = () => {
      logger.info('Network: back online');
      updateNetworkStatus();
    };

    const handleOffline = () => {
      logger.warn('Network: went offline');
      updateNetworkStatus();
    };

    const handleConnectionChange = () => {
      logger.info('Network: connection changed');
      updateNetworkStatus();
    };

    // Initial status
    updateNetworkStatus();

    // Listen for network events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes (mobile networks)
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
}

export function useConnectionQuality() {
  const networkStatus = useNetworkStatus();
  
  const getConnectionQuality = (): 'excellent' | 'good' | 'poor' | 'offline' => {
    if (!networkStatus.isOnline) return 'offline';
    
    const { effectiveType, downlink, rtt } = networkStatus;
    
    // Based on effective connection type
    if (effectiveType === '4g' && downlink > 1.5 && rtt < 150) return 'excellent';
    if (effectiveType === '4g' || (downlink > 0.5 && rtt < 300)) return 'good';
    if (effectiveType === '3g' || effectiveType === '2g' || rtt > 500) return 'poor';
    
    return 'good'; // Default for unknown connections
  };

  const quality = getConnectionQuality();
  
  return {
    ...networkStatus,
    quality,
    isSlowConnection: quality === 'poor',
    isFastConnection: quality === 'excellent',
  };
}