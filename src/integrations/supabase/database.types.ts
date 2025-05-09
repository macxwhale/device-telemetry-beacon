
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
        };
        Insert: {
          id?: string;
          device_id: string;
          app_package: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          app_package?: string;
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
  };
}

// Helper type for client usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T];
