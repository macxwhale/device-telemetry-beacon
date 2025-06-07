
// Type definitions for device ID handling
export interface DeviceIdentifiers {
  id: string; // Supabase UUID (primary key)
  android_id: string; // Device's Android ID (secondary identifier)
}

export interface DeviceAssignmentRequest {
  deviceId: string; // Always Supabase UUID
  groupId: string; // Always Supabase UUID
}

export interface DeviceAssignmentResponse {
  success: boolean;
  message: string;
  deviceUuid: string;
  groupUuid: string;
  alreadyExists?: boolean;
}

// Type guards for ID validation
export function isSupabaseUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export function validateDeviceAssignment(request: DeviceAssignmentRequest): string[] {
  const errors: string[] = [];
  
  if (!request.deviceId) {
    errors.push('Device ID is required');
  } else if (!isSupabaseUUID(request.deviceId)) {
    errors.push('Device ID must be a valid Supabase UUID');
  }
  
  if (!request.groupId) {
    errors.push('Group ID is required');
  } else if (!isSupabaseUUID(request.groupId)) {
    errors.push('Group ID must be a valid Supabase UUID');
  }
  
  return errors;
}
