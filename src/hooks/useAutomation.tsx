
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AutomationRule, AutomationExecution } from '@/types/automation';
import { toast } from '@/hooks/use-toast';

export const useAutomationRules = () => {
  return useQuery({
    queryKey: ['automation-rules'],
    queryFn: async (): Promise<AutomationRule[]> => {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useAutomationExecutions = (ruleId?: string) => {
  return useQuery({
    queryKey: ['automation-executions', ruleId],
    queryFn: async (): Promise<AutomationExecution[]> => {
      let query = supabase
        .from('automation_executions')
        .select('*')
        .order('started_at', { ascending: false });
      
      if (ruleId) {
        query = query.eq('rule_id', ruleId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });
};

export const useCreateAutomationRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('automation_rules')
        .insert(rule)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({
        title: "Automation Rule Created",
        description: "The automation rule has been created successfully.",
      });
    }
  });
};

export const useUpdateAutomationRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AutomationRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('automation_rules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({
        title: "Automation Rule Updated",
        description: "The automation rule has been updated successfully.",
      });
    }
  });
};

export const useDeleteAutomationRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({
        title: "Automation Rule Deleted",
        description: "The automation rule has been deleted successfully.",
      });
    }
  });
};

export const useExecuteAutomationRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ruleId, triggerData }: { ruleId: string; triggerData?: any }) => {
      const { data, error } = await supabase
        .from('automation_executions')
        .insert({
          rule_id: ruleId,
          trigger_data: triggerData,
          execution_status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
      toast({
        title: "Automation Triggered",
        description: "The automation rule has been triggered successfully.",
      });
    }
  });
};
