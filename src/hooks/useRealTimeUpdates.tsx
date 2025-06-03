
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
      
      // Prevent too frequent updates (minimum 60 seconds between updates)
      if (now - lastUpdateRef.current < 60000) {
        console.log("Skipping update - too frequent");
        return;
      }
      
      lastUpdateRef.current = now;
      
      // Invalidate and refetch devices query
      queryClient.invalidateQueries({ queryKey: ['devices'] });
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

  // Manual refresh function with rate limiting
  const refresh = () => {
    const now = Date.now();
    if (now - lastUpdateRef.current >= 5000) { // Allow manual refresh every 5 seconds (reduced from 10)
      lastUpdateRef.current = now;
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      console.log("Manual refresh triggered");
      return true;
    } else {
      console.log("Manual refresh rate limited");
      return false;
    }
  };

  return { refresh };
};
