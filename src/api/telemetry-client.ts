
import { toast } from "@/hooks/use-toast";

// API key for simple authentication
const API_KEY = "telm_sk_1234567890abcdef";

/**
 * A client for sending telemetry data to the API
 */
export const TelemetryClient = {
  /**
   * Send telemetry data to the API
   */
  sendTelemetry: async (telemetryData: any): Promise<Response> => {
    try {
      const response = await fetch('/api/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(telemetryData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Telemetry API error:", errorData);
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error("Error sending telemetry:", error);
      toast({
        title: "Error",
        description: `Failed to send telemetry: ${(error as Error).message}`,
        variant: "destructive"
      });
      throw error;
    }
  },

  /**
   * Generate sample telemetry data for testing
   */
  generateSampleTelemetry: (customData: Record<string, any> = {}): any => {
    // Generate a random device ID if not provided
    const deviceId = customData.android_id || 
                     customData.device_id || 
                     `device_${Math.floor(Math.random() * 100000)}`;
    
    return {
      device_info: {
        device_name: customData.device_name || `Test Device ${deviceId}`,
        manufacturer: customData.manufacturer || "Test Manufacturer",
        brand: customData.brand || "Test Brand",
        model: customData.model || "Test Model",
        product: customData.product || "Test Product",
        android_id: deviceId,
        imei: customData.imei || `imei_${deviceId}`,
        is_emulator: customData.is_emulator || false
      },
      system_info: {
        android_version: customData.android_version || "12.0",
        sdk_int: customData.sdk_int || 31,
        build_number: customData.build_number || "TEST.123456",
        bootloader: customData.bootloader || "TEST-bootloader",
        board: customData.board || "TEST-board",
        hardware: customData.hardware || "TEST-hardware",
        cpu_cores: customData.cpu_cores || 8,
        language: customData.language || "en-US",
        timezone: customData.timezone || "America/New_York",
        uptime_millis: customData.uptime_millis || Math.floor(Math.random() * 1000000),
        fingerprint: customData.fingerprint || "TEST:FINGERPRINT:12345"
      },
      battery_info: {
        battery_level: customData.battery_level || Math.floor(Math.random() * 100),
        battery_status: customData.battery_status || "Charging"
      },
      display_info: {
        screen_resolution: customData.screen_resolution || "1080x2400",
        screen_orientation: customData.screen_orientation || "portrait"
      },
      network_info: {
        ip_address: customData.ip_address || "192.168.1." + Math.floor(Math.random() * 255),
        network_interface: customData.network_interface || "WIFI",
        carrier: customData.carrier || "Test Carrier",
        wifi_ssid: customData.wifi_ssid || "Test-WiFi"
      },
      security_info: {
        is_rooted: customData.is_rooted || false
      },
      app_info: {
        installed_apps: customData.installed_apps || []
      },
      os_type: customData.os_type || "Android"
    };
  }
};
