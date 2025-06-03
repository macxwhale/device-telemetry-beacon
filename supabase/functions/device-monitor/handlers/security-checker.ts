
export async function checkSecurityIssues(supabase: any, sendNotification: any) {
  try {
    // Get notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('notify_security_issues')
      .limit(1)
      .maybeSingle();
      
    if (settingsError || !settings?.notify_security_issues) {
      console.log("Security issue notifications are disabled");
      return;
    }
    
    console.log("Checking for security issues (rooted devices)");
    
    // Get latest telemetry data for devices with security issues
    const { data: securityIssues, error } = await supabase
      .from('device_telemetry')
      .select(`
        device_id,
        device_name,
        android_id,
        is_rooted,
        timestamp,
        devices!inner(android_id, device_name)
      `)
      .eq('is_rooted', true)
      .order('timestamp', { ascending: false });
      
    if (error) {
      console.error("Error checking security issues:", error);
      return;
    }
    
    // Group by device to get latest reading for each device
    const deviceSecurityMap = new Map();
    for (const reading of securityIssues || []) {
      const deviceKey = reading.android_id;
      if (!deviceSecurityMap.has(deviceKey) || 
          new Date(reading.timestamp) > new Date(deviceSecurityMap.get(deviceKey).timestamp)) {
        deviceSecurityMap.set(deviceKey, reading);
      }
    }
    
    console.log(`Found ${deviceSecurityMap.size} devices with security issues`);
    
    // Send notifications for security issues
    for (const [_, device] of deviceSecurityMap) {
      const message = `Security issue detected: Device is rooted`;
      await sendNotification(device.android_id, device.device_name || 'Unknown Device', message, 'security_issue');
    }
  } catch (error) {
    console.error("Error in checkSecurityIssues:", error);
  }
}
