import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DeviceGroup, DeviceGroupMembership } from '@/types/groups';
import { toast } from '@/hooks/use-toast';

export const useDeviceGroups = () => {
  return useQuery({
    queryKey: ['device-groups'],
    queryFn: async (): Promise<DeviceGroup[]> => {
      const { data, error } = await supabase
        .from('device_groups')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useDeviceGroupMemberships = (deviceId?: string) => {
  return useQuery({
    queryKey: ['device-group-memberships', deviceId],
    queryFn: async (): Promise<DeviceGroupMembership[]> => {
      let query = supabase
        .from('device_group_memberships')
        .select('*');
      
      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });
};

export const useCreateDeviceGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (group: Omit<DeviceGroup, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('device_groups')
        .insert(group)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-groups'] });
      toast({
        title: "Group Created 🎉",
        description: "Device group has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('💔 Create group error:', error);
      toast({
        title: "Error",
        description: "Failed to create device group.",
        variant: "destructive",
      });
    }
  });
};

export const useUpdateDeviceGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (group: DeviceGroup) => {
      const { data, error } = await supabase
        .from('device_groups')
        .update({
          name: group.name,
          description: group.description,
          color: group.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', group.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-groups'] });
      toast({
        title: "Group Updated ✨",
        description: "Device group has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('💔 Update group error:', error);
      toast({
        title: "Error",
        description: "Failed to update device group.",
        variant: "destructive",
      });
    }
  });
};

export const useDeleteDeviceGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (groupId: string) => {
      // First remove all memberships
      await supabase
        .from('device_group_memberships')
        .delete()
        .eq('group_id', groupId);
      
      // Then delete the group
      const { error } = await supabase
        .from('device_groups')
        .delete()
        .eq('id', groupId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-groups'] });
      queryClient.invalidateQueries({ queryKey: ['device-group-memberships'] });
      toast({
        title: "Group Deleted 🗑️",
        description: "Device group has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('💔 Delete group error:', error);
      toast({
        title: "Error",
        description: "Failed to delete device group.",
        variant: "destructive",
      });
    }
  });
};

export const useAssignDeviceToGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ deviceId, groupId }: { deviceId: string; groupId: string }) => {
      console.log(`🌈 Calling Edge Function for device ${deviceId} to group ${groupId}`);
      console.log('🌈 Calling Edge Function...');
      
      try {
        const { data, error } = await supabase.functions.invoke('assign-device-to-group', {
          body: { deviceId, groupId }
        });

        if (error) {
          console.error('💔 Edge Function error:', error);
          throw new Error(error.message || 'Edge Function call failed');
        }

        console.log('✅ Edge Function response:', data);
        return data;
      } catch (error) {
        console.error('💔 Failed to call Edge Function:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log(`🎉 Successfully assigned device ${variables.deviceId} to group ${variables.groupId}`);
      
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['device-group-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['device-groups'] });
      
      toast({
        title: data.alreadyExists ? "Already Assigned! 💛" : "Device Assigned! 🎉",
        description: data.message || "Device has been assigned to group successfully.",
      });
    },
    onError: (error, variables) => {
      console.error(`💔 Failed to assign device ${variables.deviceId} to group ${variables.groupId}:`, error);
      toast({
        title: "Assignment Failed 😞",
        description: "Oops! Let's try again 🌼",
        variant: "destructive",
      });
    }
  });
};

export const useRemoveDeviceFromGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ deviceId, groupId }: { deviceId: string; groupId: string }) => {
      console.log(`🗑️ Removing device ${deviceId} from group ${groupId}`);
      
      const { error } = await supabase
        .from('device_group_memberships')
        .delete()
        .eq('device_id', deviceId)
        .eq('group_id', groupId);
      
      if (error) {
        console.error('💔 Removal error:', error);
        throw error;
      }
      
      console.log('✅ Removal successful');
    },
    onSuccess: (data, variables) => {
      console.log(`🎉 Successfully removed device ${variables.deviceId} from group ${variables.groupId}`);
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['device-group-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['device-groups'] });
      
      toast({
        title: "Device Removed! 🗑️",
        description: "Device has been removed from group successfully.",
      });
    },
    onError: (error, variables) => {
      console.error(`💔 Failed to remove device ${variables.deviceId} from group ${variables.groupId}:`, error);
      toast({
        title: "Removal Failed 😞",
        description: "Failed to remove device from group. Please try again.",
        variant: "destructive",
      });
    }
  });
};
