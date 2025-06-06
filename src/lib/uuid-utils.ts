export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

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
