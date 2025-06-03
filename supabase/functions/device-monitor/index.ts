
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://byvbunvegjwzgytavgkv.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Helper function to send notification
async function sendNotification(deviceId: string, deviceName: string, message: string, type: string) {
  try {
    const response = await supabase.functions.invoke('send-notification', {
      body: {
        message,
        type,
        deviceId,
        deviceName
      }
    });
    
    if (response.error) {
      console.error("Error sending notification:", response.error);
    } else {
      console.log(`${type} notification sent for device: ${deviceName}`);
    }
  } catch (error) {
    console.error("Exception while sending notification:", error);
  }
}

// Check for offline devices
async function checkOfflineDevices() {
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

// Check for low battery devices
async function checkLowBatteryDevices() {
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

// Check for security issues
async function checkSecurityIssues() {
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

// Main handler function
serve(async (req) => {
  console.log("Device Monitor: processing request");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    console.log("Starting device monitoring checks...");
    
    // Run all monitoring checks
    await Promise.all([
      checkOfflineDevices(),
      checkLowBatteryDevices(),
      checkSecurityIssues()
    ]);
    
    console.log("Device monitoring checks completed");
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Device monitoring completed",
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error("Error in device monitoring:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: (error as Error).message
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
