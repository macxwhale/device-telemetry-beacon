
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllDevices, deleteDevice } from '@/services/telemetryService';
import { DeviceStatus } from '@/types/telemetry';
import { toast } from '@/hooks/use-toast';

export const useDevicesQuery = () => {
  return useQuery({
    queryKey: ['devices'],
    queryFn: getAllDevices,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });
};

export const useDeleteDeviceMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteDevice,
    onMutate: async (deviceId: string) => {
      await queryClient.cancelQueries({ queryKey: ['devices'] });
      
      const previousDevices = queryClient.getQueryData<DeviceStatus[]>(['devices']);
      
      queryClient.setQueryData<DeviceStatus[]>(['devices'], (old) =>
        old?.filter(device => device.id !== deviceId) || []
      );
      
      return { previousDevices };
    },
    onError: (err, deviceId, context) => {
      queryClient.setQueryData(['devices'], context?.previousDevices);
      toast({
        title: "Error",
        description: "Failed to delete device",
        variant: "destructive",
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Device Deleted",
          description: result.message,
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
};
