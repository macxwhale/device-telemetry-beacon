
export async function checkOfflineDevices(supabase: any, sendNotification: any) {
  try {
    // Get notification settings to check if offline notifications are enabled and get threshold
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('notify_device_offline, additional_settings')
      .limit(1)
      .maybeSingle();
      
    if (settingsError || !settings?.notify_device_offline) {
      console.log("Device offline notifications are disabled");
      return;
    }
    
    // Get offline threshold (default 15 minutes)
    const offlineThreshold = settings.additional_settings?.offline_threshold || 15;
    const thresholdTime = new Date(Date.now() - (offlineThreshold * 60 * 1000));
    
    console.log(`Checking for devices offline for more than ${offlineThreshold} minutes`);
    
    // Find devices that haven't been seen recently
    const { data: offlineDevices, error } = await supabase
      .from('devices')
      .select('id, device_name, android_id, last_seen')
      .lt('last_seen', thresholdTime.toISOString());
      
    if (error) {
      console.error("Error checking offline devices:", error);
      return;
    }
    
    console.log(`Found ${offlineDevices?.length || 0} offline devices`);
    
    // Send notifications for offline devices
    for (const device of offlineDevices || []) {
      const message = `Device has been offline for more than ${offlineThreshold} minutes`;
      await sendNotification(device.android_id, device.device_name || 'Unknown Device', message, 'device_offline');
    }
  } catch (error) {
    console.error("Error in checkOfflineDevices:", error);
  }
}
