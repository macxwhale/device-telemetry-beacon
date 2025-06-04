
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DeviceAnalytics, DevicePolicy } from '@/types/groups';
import { toast } from '@/hooks/use-toast';

export const useDeviceAnalytics = (deviceId?: string, metricType?: string) => {
  return useQuery({
    queryKey: ['device-analytics', deviceId, metricType],
    queryFn: async (): Promise<DeviceAnalytics[]> => {
      let query = supabase
        .from('device_analytics')
        .select('*')
        .order('recorded_at', { ascending: false });
      
      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }
      
      if (metricType) {
        query = query.eq('metric_type', metricType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });
};

export const useDevicePolicies = () => {
  return useQuery({
    queryKey: ['device-policies'],
    queryFn: async (): Promise<DevicePolicy[]> => {
      const { data, error } = await supabase
        .from('device_policies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useCreateDevicePolicy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (policy: Omit<DevicePolicy, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('device_policies')
        .insert(policy)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-policies'] });
      toast({
        title: "Policy Created",
        description: "Device policy has been created successfully.",
      });
    }
  });
};

export const useDeviceHealthScore = (deviceId: string) => {
  return useQuery({
    queryKey: ['device-health-score', deviceId],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('calculate_device_health_score', {
        device_uuid: deviceId
      });
      
      if (error) throw error;
      return data || 0;
    },
    enabled: !!deviceId
  });
};

export const useDeviceUsagePatterns = (deviceId: string, daysBack: number = 7) => {
  return useQuery({
    queryKey: ['device-usage-patterns', deviceId, daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_device_usage_patterns', {
        device_uuid: deviceId,
        days_back: daysBack
      });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!deviceId
  });
};

export const useRecordAnalyticsMetric = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      deviceId, 
      metricType, 
      metricValue, 
      metadata 
    }: {
      deviceId: string;
      metricType: string;
      metricValue: number;
      metadata?: any;
    }) => {
      const { data, error } = await supabase
        .from('device_analytics')
        .insert({
          device_id: deviceId,
          metric_type: metricType,
          metric_value: metricValue,
          metadata
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-analytics'] });
    }
  });
};
