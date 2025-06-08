
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseRealTimeUpdatesProps {
  enabled?: boolean;
  interval?: number; // in milliseconds
}

export const useRealTimeUpdates = ({ 
  enabled = true, 
  interval = 120000 // Increased to 2 minutes to reduce API calls
}: UseRealTimeUpdatesProps = {}) => {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const updateData = () => {
      const now = Date.now();
      
      // Prevent too frequent automatic updates (minimum 60 seconds between automatic updates)
      if (now - lastUpdateRef.current < 60000) {
        console.log("Skipping automatic update - too frequent");
        return;
      }
      
      lastUpdateRef.current = now;
      
      // Invalidate and refetch devices query
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['device-groups'] });
      queryClient.invalidateQueries({ queryKey: ['device-group-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['group-devices'] });
      console.log("Real-time update triggered");
    };

    // Set up interval for real-time updates
    intervalRef.current = setInterval(updateData, interval);

    // Also update when tab becomes visible, but with rate limiting
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const now = Date.now();
        if (now - lastUpdateRef.current >= 60000) { // Only update if 60+ seconds since last update
          updateData();
        }
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

  // Manual refresh function - always works regardless of rate limiting
  const refresh = () => {
    console.log("Manual refresh triggered");
    lastUpdateRef.current = Date.now();
    
    // Invalidate all relevant queries for a complete refresh
    queryClient.invalidateQueries({ queryKey: ['devices'] });
    queryClient.invalidateQueries({ queryKey: ['device-groups'] });
    queryClient.invalidateQueries({ queryKey: ['device-group-memberships'] });
    queryClient.invalidateQueries({ queryKey: ['group-devices'] });
    
    return true;
  };

  return { refresh };
};
