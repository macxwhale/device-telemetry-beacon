
import { supabase } from "@/integrations/supabase/client";

// Track notifications in the database instead of memory
export class DeviceNotificationTracker {
  private static readonly NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutes

  static async canSendNotification(deviceId: string, notificationType: string): Promise<boolean> {
    try {
      // Check last notification time from database
      const { data, error } = await supabase
        .from('device_telemetry')
        .select('timestamp')
        .eq('device_id', (await this.getDeviceUUID(deviceId)))
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.log(`No recent telemetry found for device ${deviceId}`);
        return true; // Allow notification if no recent data
      }

      const lastSeen = new Date(data.timestamp);
      const now = new Date();
      const timeSinceLastSeen = now.getTime() - lastSeen.getTime();

      // Don't send notifications for devices that haven't been seen in over 24 hours
      if (timeSinceLastSeen > 24 * 60 * 60 * 1000) {
        console.log(`Device ${deviceId} hasn't been seen in over 24 hours, skipping notification`);
        return false;
      }

      // Check if we've sent this type of notification recently
      const cacheKey = `${deviceId}_${notificationType}`;
      const lastNotificationKey = `last_notification_${cacheKey}`;
      const lastNotificationTime = localStorage.getItem(lastNotificationKey);
      
      if (lastNotificationTime) {
        const timeSinceLastNotification = now.getTime() - parseInt(lastNotificationTime);
        if (timeSinceLastNotification < this.NOTIFICATION_COOLDOWN) {
          console.log(`Rate limiting: Skipping ${notificationType} notification for device ${deviceId}. Last sent ${Math.round(timeSinceLastNotification / 60000)} minutes ago.`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error checking notification eligibility:", error);
      return false;
    }
  }

  static async markNotificationSent(deviceId: string, notificationType: string): Promise<void> {
    const cacheKey = `${deviceId}_${notificationType}`;
    const lastNotificationKey = `last_notification_${cacheKey}`;
    localStorage.setItem(lastNotificationKey, Date.now().toString());
  }

  private static async getDeviceUUID(androidId: string): Promise<string> {
    const { data, error } = await supabase
      .from('devices')
      .select('id')
      .eq('android_id', androidId)
      .single();
    
    if (error || !data) {
      throw new Error(`Device not found: ${androidId}`);
    }
    
    return data.id;
  }
}
