
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SecurityEvent } from '@/types/groups';
import { toast } from '@/hooks/use-toast';

export const useSecurityEvents = (deviceId?: string) => {
  return useQuery({
    queryKey: ['security-events', deviceId],
    queryFn: async (): Promise<SecurityEvent[]> => {
      let query = supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });
};

export const useCreateSecurityEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (event: Omit<SecurityEvent, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('security_events')
        .insert(event)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-events'] });
    }
  });
};

export const useResolveSecurityEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase
        .from('security_events')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', eventId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-events'] });
      toast({
        title: "Event Resolved",
        description: "Security event has been marked as resolved.",
      });
    }
  });
};
