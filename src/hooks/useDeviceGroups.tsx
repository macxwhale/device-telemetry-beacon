import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DeviceGroup, DeviceGroupMembership } from '@/types/groups';
import { DeviceAssignmentRequest, validateDeviceAssignment, isSupabaseUUID } from '@/types/device-ids';
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
      console.log('📋 Membership data:', data);
      
      return data || [];
    },
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnWindowFocus: true
  });
};

// New hook specifically for getting devices assigned to a group
export const useGroupDevices = (groupId?: string) => {
  return useQuery({
    queryKey: ['group-devices', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      
      // Validate group ID is a proper Supabase UUID
      if (!isSupabaseUUID(groupId)) {
        console.error('❌ Invalid group ID format:', groupId);
        throw new Error('Group ID must be a valid Supabase UUID');
      }
      
      console.log(`🔍 Fetching devices for group ${groupId}...`);
      
      // Get memberships for this group and join with device data
      const { data, error } = await supabase
        .from('device_group_memberships')
        .select(`
          *,
          devices (
            id,
            android_id,
            device_name,
            manufacturer,
            model,
            last_seen
          )
        `)
        .eq('group_id', groupId);
      
      if (error) {
        console.error('💔 Error fetching group devices:', error);
        throw error;
      }
      
      console.log(`✅ Found ${data?.length || 0} devices for group ${groupId}`);
      
      // Transform the data and ensure we're using Supabase UUIDs
      const devices = data?.map(membership => ({
        id: membership.devices.id, // Supabase UUID
        android_id: membership.devices.android_id,
        name: membership.devices.device_name || 'Unknown Device',
        manufacturer: membership.devices.manufacturer || 'Unknown',
        model: membership.devices.model || 'Unknown',
        last_seen: membership.devices.last_seen,
        isOnline: membership.devices.last_seen ? 
          (Date.now() - new Date(membership.devices.last_seen).getTime()) < 5 * 60 * 1000 : false,
        membership_id: membership.id
      })) || [];
      
      return devices;
    },
    enabled: !!groupId && isSupabaseUUID(groupId),
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
      console.log(`🔍 Starting assignment validation for device ${deviceId} to group ${groupId}`);
      
      // Validate request using type guards
      const errors = validateDeviceAssignment({ deviceId, groupId });
      if (errors.length > 0) {
        console.error('❌ Validation errors:', errors);
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }
      
      console.log('✅ ID validation passed, calling Edge Function...');
      
      try {
        const { data, error } = await supabase.functions.invoke('assign-device-to-group', {
          body: { 
            deviceId: deviceId, // Send Supabase UUID
            groupId: groupId   // Send Supabase UUID
          }
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
      queryClient.invalidateQueries({ queryKey: ['group-devices'] });
      
      toast({
        title: data.alreadyExists ? "Already Assigned! 💛" : "Device Assigned! 🎉",
        description: data.message || "Device has been assigned to group successfully.",
      });
    },
    onError: (error, variables) => {
      console.error(`💔 Failed to assign device ${variables.deviceId} to group ${variables.groupId}:`, error);
      toast({
        title: "Assignment Failed 😞",
        description: error.message || "Failed to assign device to group.",
        variant: "destructive",
      });
    }
  });
};

export const useRemoveDeviceFromGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ deviceId, groupId }: DeviceAssignmentRequest) => {
      // Validate IDs are Supabase UUIDs
      const errors = validateDeviceAssignment({ deviceId, groupId });
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }
      
      console.log(`🗑️ Removing device ${deviceId} from group ${groupId}`);
      
      const { error } = await supabase
        .from('device_group_memberships')
        .delete()
        .eq('device_id', deviceId) // Using Supabase UUID
        .eq('group_id', groupId);  // Using Supabase UUID
      
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
      queryClient.invalidateQueries({ queryKey: ['group-devices'] });
      
      toast({
        title: "Device Removed! 🗑️",
        description: "Device has been removed from group successfully.",
      });
    },
    onError: (error, variables) => {
      console.error(`💔 Failed to remove device ${variables.deviceId} from group ${variables.groupId}:`, error);
      toast({
        title: "Removal Failed 😞",
        description: error.message || "Failed to remove device from group.",
        variant: "destructive",
      });
    }
  });
};
