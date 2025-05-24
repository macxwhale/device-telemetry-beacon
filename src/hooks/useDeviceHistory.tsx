
import { useQuery } from '@tanstack/react-query';
import { getDeviceHistory } from '@/services/telemetryService';

export const useDeviceHistoryQuery = (deviceId: string) => {
  return useQuery({
    queryKey: ['device-history', deviceId],
    queryFn: () => getDeviceHistory(deviceId),
    enabled: !!deviceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
