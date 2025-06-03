
export async function checkLowBatteryDevices(supabase: any, sendNotification: any) {
  try {
    // Get notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('notify_low_battery, additional_settings')
      .limit(1)
      .maybeSingle();
      
    if (settingsError || !settings?.notify_low_battery) {
      console.log("Low battery notifications are disabled");
      return;
    }
    
    // Get battery threshold (default 20%)
    const batteryThreshold = settings.additional_settings?.battery_threshold || 20;
    
    console.log(`Checking for devices with battery below ${batteryThreshold}%`);
    
    // Get latest telemetry data for each device to check battery levels
    const { data: lowBatteryDevices, error } = await supabase
      .from('device_telemetry')
      .select(`
        device_id,
        device_name,
        android_id,
        battery_level,
        battery_status,
        timestamp,
        devices!inner(android_id, device_name)
      `)
      .lt('battery_level', batteryThreshold)
      .eq('battery_status', 'Discharging')
      .order('timestamp', { ascending: false });
      
    if (error) {
      console.error("Error checking low battery devices:", error);
      return;
    }
    
    // Group by device to get latest reading for each device
    const deviceBatteryMap = new Map();
    for (const reading of lowBatteryDevices || []) {
      const deviceKey = reading.android_id;
      if (!deviceBatteryMap.has(deviceKey) || 
          new Date(reading.timestamp) > new Date(deviceBatteryMap.get(deviceKey).timestamp)) {
        deviceBatteryMap.set(deviceKey, reading);
      }
    }
    
    console.log(`Found ${deviceBatteryMap.size} devices with low battery`);
    
    // Send notifications for low battery devices
    for (const [_, device] of deviceBatteryMap) {
      const message = `Battery level is ${device.battery_level}% and discharging`;
      await sendNotification(device.android_id, device.device_name || 'Unknown Device', message, 'low_battery');
    }
  } catch (error) {
    console.error("Error in checkLowBatteryDevices:", error);
  }
}
