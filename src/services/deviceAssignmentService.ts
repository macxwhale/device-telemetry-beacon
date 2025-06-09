
import { supabase } from '@/integrations/supabase/client';
import { DeviceStatus } from '@/types/telemetry';
import { isSupabaseUUID } from '@/types/device-ids';

export interface AssignmentValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface AssignmentResult {
  success: boolean;
  message: string;
  alreadyExists?: boolean;
}

export class DeviceAssignmentService {
  /**
   * Validates device and group IDs for assignment
   */
  static validateAssignmentRequest(deviceId: string, groupId: string): AssignmentValidationResult {
    const errors: string[] = [];

    if (!deviceId) {
      errors.push('Device ID is required');
    } else if (!isSupabaseUUID(deviceId)) {
      errors.push('Device ID must be a valid UUID');
    }

    if (!groupId) {
      errors.push('Group ID is required');
    } else if (!isSupabaseUUID(groupId)) {
      errors.push('Group ID must be a valid UUID');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Assigns a device to a group using the edge function
   */
  static async assignDeviceToGroup(deviceId: string, groupId: string): Promise<AssignmentResult> {
    console.log(`🔍 Starting device assignment: ${deviceId} -> ${groupId}`);

    // Validate IDs
    const validation = this.validateAssignmentRequest(deviceId, groupId);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      const { data, error } = await supabase.functions.invoke('assign-device-to-group', {
        body: { deviceId, groupId }
      });

      if (error) {
        console.error('💔 Edge Function error:', error);
        throw new Error(error.message || 'Assignment failed');
      }

      console.log('✅ Assignment successful:', data);
      return data;
    } catch (error) {
      console.error('💔 Assignment service error:', error);
      throw error;
    }
  }

  /**
   * Removes a device from a group
   */
  static async removeDeviceFromGroup(deviceId: string, groupId: string): Promise<void> {
    const validation = this.validateAssignmentRequest(deviceId, groupId);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

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

    console.log('✅ Device removed successfully');
  }

  /**
   * Gets devices assigned to a specific group
   */
  static async getGroupDevices(groupId: string): Promise<DeviceStatus[]> {
    if (!isSupabaseUUID(groupId)) {
      throw new Error('Group ID must be a valid UUID');
    }

    console.log(`🔍 Fetching devices for group ${groupId}`);

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

    // Transform to complete DeviceStatus objects
    return data?.map(membership => ({
      id: membership.devices.id,
      android_id: membership.devices.android_id,
      name: membership.devices.device_name || 'Unknown Device',
      manufacturer: membership.devices.manufacturer || 'Unknown',
      model: membership.devices.model || 'Unknown',
      os_version: 'Unknown',
      last_seen: membership.devices.last_seen ? new Date(membership.devices.last_seen).getTime() : 0,
      battery_level: 0,
      battery_status: 'Unknown',
      network_type: 'Unknown',
      ip_address: '0.0.0.0',
      uptime_millis: 0,
      isOnline: membership.devices.last_seen ? 
        (Date.now() - new Date(membership.devices.last_seen).getTime()) < 5 * 60 * 1000 : false,
      telemetry: null,
      membership_id: membership.id
    })) || [];
  }

  /**
   * Filters available devices (not assigned to a specific group)
   */
  static filterAvailableDevices(allDevices: DeviceStatus[], assignedDevices: DeviceStatus[]): DeviceStatus[] {
    const assignedDeviceIds = new Set(assignedDevices.map(device => device.id));
    
    return allDevices.filter(device => {
      const isValidUUID = isSupabaseUUID(device.id);
      const isNotAssigned = !assignedDeviceIds.has(device.id);
      
      if (!isValidUUID) {
        console.warn('⚠️ Device has invalid UUID:', {
          id: device.id,
          android_id: device.android_id,
          name: device.name
        });
        return false;
      }
      
      return isNotAssigned;
    });
  }
}
