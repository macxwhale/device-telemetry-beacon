
import { supabase } from '@/integrations/supabase/client';
import { DeviceStatus } from '@/types/telemetry';
import { Result, Ok, Err, AppError } from '@/types/result';
import { DeviceId, GroupId, createDeviceId, createGroupId, unwrapId } from '@/types/branded-types';

export interface AssignmentResult {
  success: boolean;
  message: string;
  alreadyExists?: boolean;
}

/**
 * Service for managing device-to-group assignments
 * Follows single responsibility principle and uses Result pattern for error handling
 */
export class DeviceAssignmentService {
  /**
   * Validates device and group IDs for assignment
   */
  private static validateAssignmentRequest(deviceId: string, groupId: string): Result<{ validDeviceId: DeviceId; validGroupId: GroupId }> {
    const validDeviceId = createDeviceId(deviceId);
    const validGroupId = createGroupId(groupId);

    if (!validDeviceId) {
      return Err(AppError.validation('Device ID must be a valid UUID', { deviceId }));
    }

    if (!validGroupId) {
      return Err(AppError.validation('Group ID must be a valid UUID', { groupId }));
    }

    return Ok({ validDeviceId, validGroupId });
  }

  /**
   * Assigns a device to a group using the edge function
   */
  static async assignDeviceToGroup(deviceId: string, groupId: string): Promise<Result<AssignmentResult>> {
    console.log(`🔍 Starting device assignment: ${deviceId} -> ${groupId}`);

    // Validate IDs using Result pattern
    const validationResult = this.validateAssignmentRequest(deviceId, groupId);
    if (!validationResult.success) {
      return validationResult;
    }

    const { validDeviceId, validGroupId } = validationResult.data;

    try {
      const { data, error } = await supabase.functions.invoke('assign-device-to-group', {
        body: { 
          deviceId: unwrapId(validDeviceId), 
          groupId: unwrapId(validGroupId) 
        }
      });

      if (error) {
        console.error('💔 Edge Function error:', error);
        return Err(AppError.network(error.message || 'Assignment failed', { deviceId, groupId }));
      }

      console.log('✅ Assignment successful:', data);
      return Ok(data);
    } catch (error) {
      console.error('💔 Assignment service error:', error);
      return Err(AppError.network(
        error instanceof Error ? error.message : 'Unknown assignment error',
        { deviceId, groupId }
      ));
    }
  }

  /**
   * Removes a device from a group
   */
  static async removeDeviceFromGroup(deviceId: string, groupId: string): Promise<Result<void>> {
    const validationResult = this.validateAssignmentRequest(deviceId, groupId);
    if (!validationResult.success) {
      return validationResult;
    }

    const { validDeviceId, validGroupId } = validationResult.data;

    console.log(`🗑️ Removing device ${deviceId} from group ${groupId}`);

    try {
      const { error } = await supabase
        .from('device_group_memberships')
        .delete()
        .eq('device_id', unwrapId(validDeviceId))
        .eq('group_id', unwrapId(validGroupId));

      if (error) {
        console.error('💔 Removal error:', error);
        return Err(AppError.database(error.message, { deviceId, groupId }));
      }

      console.log('✅ Device removed successfully');
      return Ok(undefined);
    } catch (error) {
      console.error('💔 Removal service error:', error);
      return Err(AppError.database(
        error instanceof Error ? error.message : 'Unknown removal error',
        { deviceId, groupId }
      ));
    }
  }

  /**
   * Gets devices assigned to a specific group
   */
  static async getGroupDevices(groupId: string): Promise<Result<DeviceStatus[]>> {
    const validGroupId = createGroupId(groupId);
    if (!validGroupId) {
      return Err(AppError.validation('Group ID must be a valid UUID', { groupId }));
    }

    console.log(`🔍 Fetching devices for group ${groupId}`);

    try {
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
        .eq('group_id', unwrapId(validGroupId));

      if (error) {
        console.error('💔 Error fetching group devices:', error);
        return Err(AppError.database(error.message, { groupId }));
      }

      // Transform to complete DeviceStatus objects
      const devices = data?.map(membership => ({
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

      return Ok(devices);
    } catch (error) {
      console.error('💔 Get group devices error:', error);
      return Err(AppError.database(
        error instanceof Error ? error.message : 'Unknown error fetching group devices',
        { groupId }
      ));
    }
  }

  /**
   * Filters available devices (not assigned to a specific group)
   */
  static filterAvailableDevices(allDevices: DeviceStatus[], assignedDevices: DeviceStatus[]): DeviceStatus[] {
    const assignedDeviceIds = new Set(assignedDevices.map(device => device.id));
    
    return allDevices.filter(device => {
      const isValidDevice = createDeviceId(device.id) !== null;
      const isNotAssigned = !assignedDeviceIds.has(device.id);
      
      if (!isValidDevice) {
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
