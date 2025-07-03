
/**
 * Branded types for better type safety and preventing ID confusion
 * Based on TypeScript branded type pattern from Microsoft's guidelines
 */

// Brand utility type
type Brand<K, T> = K & { readonly __brand: T };

// Device identifiers with proper branding
export type DeviceId = Brand<string, 'DeviceId'>;
export type AndroidId = Brand<string, 'AndroidId'>;
export type GroupId = Brand<string, 'GroupId'>;

// Type guards and validators
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function createDeviceId(uuid: string): DeviceId | null {
  return isValidUUID(uuid) ? (uuid as DeviceId) : null;
}

export function createAndroidId(id: string): AndroidId | null {
  // Android ID is typically 16 hex characters, but can vary
  return id && id.length >= 8 ? (id as AndroidId) : null;
}

export function createGroupId(uuid: string): GroupId | null {
  return isValidUUID(uuid) ? (uuid as GroupId) : null;
}

// Validation functions that return branded types or throw
export function validateDeviceId(uuid: string): DeviceId {
  const deviceId = createDeviceId(uuid);
  if (!deviceId) {
    throw new Error(`Invalid device UUID: ${uuid}`);
  }
  return deviceId;
}

export function validateGroupId(uuid: string): GroupId {
  const groupId = createGroupId(uuid);
  if (!groupId) {
    throw new Error(`Invalid group UUID: ${uuid}`);
  }
  return groupId;
}

// Utility to extract raw string from branded type
export function unwrapId<T extends string>(brandedId: T): string {
  return brandedId as string;
}
