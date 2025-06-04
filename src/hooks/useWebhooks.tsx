
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WebhookEndpoint, WebhookDelivery } from '@/types/automation';
import { toast } from '@/hooks/use-toast';

export const useWebhookEndpoints = () => {
  return useQuery({
    queryKey: ['webhook-endpoints'],
    queryFn: async (): Promise<WebhookEndpoint[]> => {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useWebhookDeliveries = (webhookId?: string) => {
  return useQuery({
    queryKey: ['webhook-deliveries', webhookId],
    queryFn: async (): Promise<WebhookDelivery[]> => {
      let query = supabase
        .from('webhook_deliveries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (webhookId) {
        query = query.eq('webhook_id', webhookId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });
};

export const useCreateWebhookEndpoint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (webhook: Omit<WebhookEndpoint, 'id' | 'created_at' | 'last_triggered'>) => {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .insert(webhook)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] });
      toast({
        title: "Webhook Created",
        description: "The webhook endpoint has been created successfully.",
      });
    }
  });
};

export const useUpdateWebhookEndpoint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WebhookEndpoint> & { id: string }) => {
      const { data, error } = await supabase
        .from('webhook_endpoints')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] });
      toast({
        title: "Webhook Updated",
        description: "The webhook endpoint has been updated successfully.",
      });
    }
  });
};

export const useDeleteWebhookEndpoint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webhook_endpoints')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] });
      toast({
        title: "Webhook Deleted",
        description: "The webhook endpoint has been deleted successfully.",
      });
    }
  });
};

export const useTestWebhook = () => {
  return useMutation({
    mutationFn: async ({ url, payload }: { url: string; payload: any }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      return {
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
      };
    },
    onSuccess: (data) => {
      toast({
        title: "Webhook Test Complete",
        description: `Response: ${data.status} ${data.statusText}`,
      });
    },
    onError: () => {
      toast({
        title: "Webhook Test Failed",
        description: "Failed to send test webhook.",
        variant: "destructive",
      });
    }
  });
};
