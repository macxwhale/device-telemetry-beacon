
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DeviceGroup, DeviceGroupMembership } from '@/types/groups';
import { DeviceAssignmentRequest, validateDeviceAssignment, isSupabaseUUID } from '@/types/device-ids';
import { DeviceStatus } from '@/types/telemetry';
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

// Updated hook to use device.id (Supabase UUID) instead of android_id
export const useGroupDevices = (groupId?: string) => {
  return useQuery({
    queryKey: ['group-devices', groupId],
    queryFn: async (): Promise<DeviceStatus[]> => {
      if (!groupId) return [];
      
      // Validate group ID is a proper Supabase UUID
      if (!isSupabaseUUID(groupId)) {
        console.error('❌ Invalid group ID format:', groupId);
        throw new Error('Group ID must be a valid Supabase UUID');
      }
      
      console.log(`🔍 Fetching devices for group ${groupId}...`);
      
      // Get memberships for this group and join with device data using device.id
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
      
      // Transform the data and create complete DeviceStatus objects
      const devices: DeviceStatus[] = data?.map(membership => ({
        id: membership.devices.id, // This is the Supabase UUID we should use
        android_id: membership.devices.android_id, // Keep for reference but don't use for assignments
        name: membership.devices.device_name || 'Unknown Device',
        manufacturer: membership.devices.manufacturer || 'Unknown',
        model: membership.devices.model || 'Unknown',
        os_version: 'Unknown', // Default value for missing property
        last_seen: membership.devices.last_seen ? new Date(membership.devices.last_seen).getTime() : 0,
        battery_level: 0, // Default value for missing property
        battery_status: 'Unknown', // Default value for missing property
        network_type: 'Unknown', // Default value for missing property
        ip_address: '0.0.0.0', // Default value for missing property
        uptime_millis: 0, // Default value for missing property
        isOnline: membership.devices.last_seen ? 
          (Date.now() - new Date(membership.devices.last_seen).getTime()) < 5 * 60 * 1000 : false,
        telemetry: null, // Default value for missing property
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

// Updated to use device.id (Supabase UUID) for assignments
export const useAssignDeviceToGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ deviceId, groupId }: DeviceAssignmentRequest) => {
      console.log(`🔍 Starting assignment validation for device ${deviceId} to group ${groupId}`);
      
      // Validate request using type guards - deviceId should be the Supabase UUID
      const errors = validateDeviceAssignment({ deviceId, groupId });
      if (errors.length > 0) {
        console.error('❌ Validation errors:', errors);
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }
      
      console.log('✅ ID validation passed, calling Edge Function...');
      
      try {
        const { data, error } = await supabase.functions.invoke('assign-device-to-group', {
          body: { 
            deviceId: deviceId, // Send device.id (Supabase UUID)
            groupId: groupId   // Send group.id (Supabase UUID)
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
      // Validate IDs are Supabase UUIDs - deviceId should be device.id
      const errors = validateDeviceAssignment({ deviceId, groupId });
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }
      
      console.log(`🗑️ Removing device ${deviceId} from group ${groupId}`);
      
      const { error } = await supabase
        .from('device_group_memberships')
        .delete()
        .eq('device_id', deviceId) // Using device.id (Supabase UUID)
        .eq('group_id', groupId);  // Using group.id (Supabase UUID)
      
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
