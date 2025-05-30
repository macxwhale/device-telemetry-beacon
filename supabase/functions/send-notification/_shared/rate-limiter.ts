
// In-memory cache for notification tracking (in production, use Redis or database)
const notificationCache = new Map<string, number>();
const NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutes

// Rate limiting per chat/bot combination
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // Max 20 messages per minute per chat

export function canSendNotification(deviceId: string, type: string): boolean {
  const key = `${deviceId}_${type}`;
  const lastSent = notificationCache.get(key) || 0;
  const now = Date.now();
  
  if (now - lastSent < NOTIFICATION_COOLDOWN) {
    console.log(`Rate limit: Skipping ${type} for device ${deviceId} (last sent ${Math.round((now - lastSent) / 60000)} min ago)`);
    return false;
  }
  
  return true;
}

export function checkTelegramRateLimit(chatId: string): boolean {
  const now = Date.now();
  const key = `telegram_${chatId}`;
  const limit = rateLimitCache.get(key);
  
  if (!limit || now > limit.resetTime) {
    // Reset or initialize rate limit
    rateLimitCache.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT_MAX) {
    console.log(`Telegram rate limit exceeded for chat ${chatId}`);
    return false;
  }
  
  limit.count++;
  return true;
}

export function markNotificationSent(deviceId: string, type: string): void {
  const key = `${deviceId}_${type}`;
  notificationCache.set(key, Date.now());
}
