
export interface Database {
  public: {
    Tables: {
      devices: {
        Row: {
          id: string;
          android_id: string;
          device_name: string | null;
          manufacturer: string | null;
          model: string | null;
          first_seen: string;
          last_seen: string;
        };
        Insert: {
          id?: string;
          android_id: string;
          device_name?: string | null;
          manufacturer?: string | null;
          model?: string | null;
          first_seen?: string;
          last_seen?: string;
        };
        Update: {
          id?: string;
          android_id?: string;
          device_name?: string | null;
          manufacturer?: string | null;
          model?: string | null;
          first_seen?: string;
          last_seen?: string;
        };
      };
      device_telemetry: {
        Row: {
          id: string;
          device_id: string;
          timestamp: string;
          
          // Device info
          device_name: string | null;
          manufacturer: string | null;
          brand: string | null;
          model: string | null;
          product: string | null;
          android_id: string | null;
          imei: string | null;
          is_emulator: boolean | null;
          
          // System info
          android_version: string | null;
          sdk_int: number | null;
          base_version: number | null;
          fingerprint: string | null;
          build_number: string | null;
          kernel_version: string | null;
          bootloader: string | null;
          build_tags: string | null;
          build_type: string | null;
          board: string | null;
          hardware: string | null;
          host: string | null;
          user_name: string | null;
          uptime_millis: number | null;
          boot_time: number | null;
          cpu_cores: number | null;
          language: string | null;
          timezone: string | null;
          
          // Battery info
          battery_level: number | null;
          battery_status: Database['public']['Enums']['battery_status'] | null;
          
          // Network info
          ip_address: string | null;
          network_interface: Database['public']['Enums']['network_type'] | null;
          carrier: string | null;
          wifi_ssid: string | null;
          
          // Display info
          screen_resolution: string | null;
          screen_orientation: string | null;
          
          // Security info
          is_rooted: boolean | null;
          
          // OS info
          os_type: string | null;
        };
        Insert: {
          id?: string;
          device_id: string;
          timestamp?: string;
          
          // Device info
          device_name?: string | null;
          manufacturer?: string | null;
          brand?: string | null;
          model?: string | null;
          product?: string | null;
          android_id?: string | null;
          imei?: string | null;
          is_emulator?: boolean | null;
          
          // System info
          android_version?: string | null;
          sdk_int?: number | null;
          base_version?: number | null;
          fingerprint?: string | null;
          build_number?: string | null;
          kernel_version?: string | null;
          bootloader?: string | null;
          build_tags?: string | null;
          build_type?: string | null;
          board?: string | null;
          hardware?: string | null;
          host?: string | null;
          user_name?: string | null;
          uptime_millis?: number | null;
          boot_time?: number | null;
          cpu_cores?: number | null;
          language?: string | null;
          timezone?: string | null;
          
          // Battery info
          battery_level?: number | null;
          battery_status?: Database['public']['Enums']['battery_status'] | null;
          
          // Network info
          ip_address?: string | null;
          network_interface?: Database['public']['Enums']['network_type'] | null;
          carrier?: string | null;
          wifi_ssid?: string | null;
          
          // Display info
          screen_resolution?: string | null;
          screen_orientation?: string | null;
          
          // Security info
          is_rooted?: boolean | null;
          
          // OS info
          os_type?: string | null;
        };
        Update: {
          id?: string;
          device_id?: string;
          timestamp?: string;
          
          // Device info
          device_name?: string | null;
          manufacturer?: string | null;
          brand?: string | null;
          model?: string | null;
          product?: string | null;
          android_id?: string | null;
          imei?: string | null;
          is_emulator?: boolean | null;
          
          // System info
          android_version?: string | null;
          sdk_int?: number | null;
          base_version?: number | null;
          fingerprint?: string | null;
          build_number?: string | null;
          kernel_version?: string | null;
          bootloader?: string | null;
          build_tags?: string | null;
          build_type?: string | null;
          board?: string | null;
          hardware?: string | null;
          host?: string | null;
          user_name?: string | null;
          uptime_millis?: number | null;
          boot_time?: number | null;
          cpu_cores?: number | null;
          language?: string | null;
          timezone?: string | null;
          
          // Battery info
          battery_level?: number | null;
          battery_status?: Database['public']['Enums']['battery_status'] | null;
          
          // Network info
          ip_address?: string | null;
          network_interface?: Database['public']['Enums']['network_type'] | null;
          carrier?: string | null;
          wifi_ssid?: string | null;
          
          // Display info
          screen_resolution?: string | null;
          screen_orientation?: string | null;
          
          // Security info
          is_rooted?: boolean | null;
          
          // OS info
          os_type?: string | null;
        };
      };
      telemetry_history: {
        Row: {
          id: string;
          device_id: string;
          timestamp: string;
          telemetry_data: any;
        };
        Insert: {
          id?: string;
          device_id: string;
          timestamp?: string;
          telemetry_data: any;
        };
        Update: {
          id?: string;
          device_id?: string;
          timestamp?: string;
          telemetry_data?: any;
        };
      };
      device_apps: {
        Row: {
          id: string;
          device_id: string;
          app_package: string;
          recorded_at?: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          app_package: string;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          app_package?: string;
          recorded_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      execute_sql: {
        Args: {
          sql: string;
        };
        Returns: any;
      };
      process_telemetry_data: {
        Args: Record<string, never>;
        Returns: any;
      };
    };
    Enums: {
      battery_status: 'Charging' | 'Discharging' | 'Full' | 'Not Charging' | 'Unknown';
      network_type: 'WiFi' | 'Mobile' | 'Ethernet' | 'None' | 'Unknown';
    };
  };
}

// Helper type for client usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
