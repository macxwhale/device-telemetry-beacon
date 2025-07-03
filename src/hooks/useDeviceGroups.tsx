import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DeviceGroup, DeviceGroupMembership } from '@/types/groups';
import { DeviceAssignmentRequest } from '@/types/device-ids';
import { DeviceStatus } from '@/types/telemetry';
import { toast } from '@/hooks/use-toast';
import { DeviceAssignmentService } from '@/services/deviceAssignmentService';

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
      console.log('🔍 Fetching device group memberships...');
      
      let query = supabase
        .from('device_group_memberships')
        .select('*');
      
      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error('💔 Error fetching memberships:', error);
        throw error;
      }
      
      console.log('✅ Fetched memberships:', data?.length || 0, 'records');
      return data || [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true
  });
};

export const useGroupDevices = (groupId?: string) => {
  return useQuery({
    queryKey: ['group-devices', groupId],
    queryFn: async (): Promise<DeviceStatus[]> => {
      if (!groupId) return [];
      
      const result = await DeviceAssignmentService.getGroupDevices(groupId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      
      return result.data;
    },
    enabled: !!groupId,
    staleTime: 0,
    refetchOnWindowFocus: true
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
      await supabase
        .from('device_group_memberships')
        .delete()
        .eq('group_id', groupId);
      
      const { error } = await supabase
        .from('device_groups')
        .delete()
        .eq('id', groupId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-groups'] });
      queryClient.invalidateQueries({ queryKey: ['device-group-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['group-devices'] });
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
    mutationFn: async ({ deviceId, groupId }: DeviceAssignmentRequest) => {
      const result = await DeviceAssignmentService.assignDeviceToGroup(deviceId, groupId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      console.log(`🎉 Successfully assigned device ${variables.deviceId} to group ${variables.groupId}`);
      
      queryClient.invalidateQueries({ queryKey: ['device-group-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['device-groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-devices'] });
      
      toast({
        title: data.alreadyExists ? "Already Assigned! 💛" : "Device Assigned! 🎉",
        description: data.message || "Device has been assigned to group successfully.",
      });
    },
    onError: (error, variables) => {
      console.error(`💔 Failed to assign device ${variables.deviceId} to group ${variables.groupId}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to assign device to group.";
      toast({
        title: "Assignment Failed 😞",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });
};

export const useRemoveDeviceFromGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ deviceId, groupId }: DeviceAssignmentRequest) => {
      const result = await DeviceAssignmentService.removeDeviceFromGroup(deviceId, groupId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
    onSuccess: (data, variables) => {
      console.log(`🎉 Successfully removed device ${variables.deviceId} from group ${variables.groupId}`);
      
      queryClient.invalidateQueries({ queryKey: ['device-group-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['device-groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-devices'] });
      
      toast({
        title: "Device Removed! 🗑️",
        description: "Device has been removed from group successfully.",
      });
    },
    onError: (error, variables) => {
      console.error(`💔 Failed to remove device ${variables.deviceId} from group ${variables.groupId}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to remove device from group.";
      toast({
        title: "Removal Failed 😞",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });
};
