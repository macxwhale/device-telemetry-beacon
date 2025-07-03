import { isValidUUID as baseIsValidUUID, createDeviceId, createGroupId } from '@/types/branded-types';

// Re-export the base validation function
export const isValidUUID = baseIsValidUUID;

// Alias for backward compatibility
export const isSupabaseUUID = isValidUUID;

export function formatToUUID(str: string): string {
  // Remove any existing hyphens first
  const cleanStr = str.replace(/-/g, '');
  
  // Check if it's the right length for a UUID (32 hex characters)
  if (cleanStr.length === 32 && /^[0-9a-f]+$/i.test(cleanStr)) {
    return `${cleanStr.slice(0,8)}-${cleanStr.slice(8,12)}-${cleanStr.slice(12,16)}-${cleanStr.slice(16,20)}-${cleanStr.slice(20)}`;
  }
  
  // If it's already a valid UUID, return as is
  if (isValidUUID(str)) {
    return str;
  }
  
  // Otherwise, return the original string (will fail validation)
  return str;
}

export function ensureUUID(id: string, context?: string): string {
  const formatted = formatToUUID(id);
  if (!isValidUUID(formatted)) {
    console.warn(`⚠️ Invalid UUID format for ${context || 'ID'}: ${id}`);
  }
  return formatted;
}

/**
 * @deprecated Use branded types from @/types/branded-types instead
 */
export function extractDeviceUUID(deviceId: string): string {
  console.warn('⚠️ extractDeviceUUID is deprecated. Use branded DeviceId type instead.');
  
  // Check if it's a hybrid format (android_id-uuid)
  const hybridMatch = deviceId.match(/^[0-9a-f]+-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  if (hybridMatch) {
    return hybridMatch[1]; // Return just the UUID part
  }
  
  // If it's already a UUID or can be formatted as one, use existing logic
  return formatToUUID(deviceId);
}

/**
 * @deprecated Use createDeviceId or createGroupId from @/types/branded-types instead
 */
export function isValidDeviceId(deviceId: string): boolean {
  console.warn('⚠️ isValidDeviceId is deprecated. Use branded type validation instead.');
  
  // Accept either pure UUIDs or hybrid android_id-uuid format
  const hybridPattern = /^[0-9a-f]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  return hybridPattern.test(deviceId) || uuidPattern.test(deviceId);
}
