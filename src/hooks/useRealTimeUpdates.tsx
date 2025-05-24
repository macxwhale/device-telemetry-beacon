
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DeviceStatus } from '@/types/telemetry';

interface UseRealTimeUpdatesProps {
  enabled?: boolean;
  interval?: number; // in milliseconds
}

export const useRealTimeUpdates = ({ 
  enabled = true, 
  interval = 30000 // 30 seconds default
}: UseRealTimeUpdatesProps = {}) => {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) return;

    const updateData = () => {
      // Invalidate and refetch devices query
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    };

    // Set up interval for real-time updates
    intervalRef.current = setInterval(updateData, interval);

    // Also update when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, interval, queryClient]);

  // Manual refresh function
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['devices'] });
  };

  return { refresh };
};
