export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      device_analytics: {
        Row: {
          device_id: string | null
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          recorded_at: string | null
        }
        Insert: {
          device_id?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          recorded_at?: string | null
        }
        Update: {
          device_id?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_analytics_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_apps: {
        Row: {
          app_package: string
          device_id: string | null
          id: string
          recorded_at: string | null
        }
        Insert: {
          app_package: string
          device_id?: string | null
          id?: string
          recorded_at?: string | null
        }
        Update: {
          app_package?: string
          device_id?: string | null
          id?: string
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_apps_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_group_memberships: {
        Row: {
          added_at: string | null
          device_id: string | null
          group_id: string | null
          id: string
        }
        Insert: {
          added_at?: string | null
          device_id?: string | null
          group_id?: string | null
          id?: string
        }
        Update: {
          added_at?: string | null
          device_id?: string | null
          group_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_group_memberships_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "device_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      device_groups: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      device_policies: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          name: string
          rules: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name: string
          rules: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
          rules?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      device_policy_assignments: {
        Row: {
          assigned_at: string | null
          device_id: string | null
          id: string
          policy_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          device_id?: string | null
          id?: string
          policy_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          device_id?: string | null
          id?: string
          policy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_policy_assignments_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_policy_assignments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "device_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tags: {
        Row: {
          created_at: string | null
          device_id: string | null
          id: string
          tag_name: string
          tag_value: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          tag_name: string
          tag_value?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          tag_name?: string
          tag_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_tags_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_telemetry: {
        Row: {
          android_id: string | null
          android_version: string | null
          base_version: number | null
          battery_level: number | null
          battery_status: Database["public"]["Enums"]["battery_status"] | null
          board: string | null
          boot_time: number | null
          bootloader: string | null
          brand: string | null
          build_number: string | null
          build_tags: string | null
          build_type: string | null
          carrier: string | null
          cpu_cores: number | null
          device_id: string
          device_name: string | null
          fingerprint: string | null
          hardware: string | null
          host: string | null
          id: string
          imei: string | null
          ip_address: string | null
          is_emulator: boolean | null
          is_rooted: boolean | null
          kernel_version: string | null
          language: string | null
          manufacturer: string | null
          model: string | null
          network_interface: Database["public"]["Enums"]["network_type"] | null
          os_type: string | null
          product: string | null
          screen_orientation: string | null
          screen_resolution: string | null
          sdk_int: number | null
          timestamp: string
          timezone: string | null
          uptime_millis: number | null
          user_name: string | null
          wifi_ssid: string | null
        }
        Insert: {
          android_id?: string | null
          android_version?: string | null
          base_version?: number | null
          battery_level?: number | null
          battery_status?: Database["public"]["Enums"]["battery_status"] | null
          board?: string | null
          boot_time?: number | null
          bootloader?: string | null
          brand?: string | null
          build_number?: string | null
          build_tags?: string | null
          build_type?: string | null
          carrier?: string | null
          cpu_cores?: number | null
          device_id: string
          device_name?: string | null
          fingerprint?: string | null
          hardware?: string | null
          host?: string | null
          id?: string
          imei?: string | null
          ip_address?: string | null
          is_emulator?: boolean | null
          is_rooted?: boolean | null
          kernel_version?: string | null
          language?: string | null
          manufacturer?: string | null
          model?: string | null
          network_interface?: Database["public"]["Enums"]["network_type"] | null
          os_type?: string | null
          product?: string | null
          screen_orientation?: string | null
          screen_resolution?: string | null
          sdk_int?: number | null
          timestamp?: string
          timezone?: string | null
          uptime_millis?: number | null
          user_name?: string | null
          wifi_ssid?: string | null
        }
        Update: {
          android_id?: string | null
          android_version?: string | null
          base_version?: number | null
          battery_level?: number | null
          battery_status?: Database["public"]["Enums"]["battery_status"] | null
          board?: string | null
          boot_time?: number | null
          bootloader?: string | null
          brand?: string | null
          build_number?: string | null
          build_tags?: string | null
          build_type?: string | null
          carrier?: string | null
          cpu_cores?: number | null
          device_id?: string
          device_name?: string | null
          fingerprint?: string | null
          hardware?: string | null
          host?: string | null
          id?: string
          imei?: string | null
          ip_address?: string | null
          is_emulator?: boolean | null
          is_rooted?: boolean | null
          kernel_version?: string | null
          language?: string | null
          manufacturer?: string | null
          model?: string | null
          network_interface?: Database["public"]["Enums"]["network_type"] | null
          os_type?: string | null
          product?: string | null
          screen_orientation?: string | null
          screen_resolution?: string | null
          sdk_int?: number | null
          timestamp?: string
          timezone?: string | null
          uptime_millis?: number | null
          user_name?: string | null
          wifi_ssid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_telemetry_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          android_id: string
          device_name: string | null
          first_seen: string | null
          id: string
          last_seen: string | null
          manufacturer: string | null
          model: string | null
        }
        Insert: {
          android_id: string
          device_name?: string | null
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          manufacturer?: string | null
          model?: string | null
        }
        Update: {
          android_id?: string
          device_name?: string | null
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          manufacturer?: string | null
          model?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          additional_settings: Json | null
          created_at: string | null
          email_notifications: string | null
          id: string
          notify_device_offline: boolean | null
          notify_low_battery: boolean | null
          notify_new_device: boolean | null
          notify_security_issues: boolean | null
          telegram_bot_token: string | null
          telegram_chat_id: string | null
          updated_at: string | null
        }
        Insert: {
          additional_settings?: Json | null
          created_at?: string | null
          email_notifications?: string | null
          id?: string
          notify_device_offline?: boolean | null
          notify_low_battery?: boolean | null
          notify_new_device?: boolean | null
          notify_security_issues?: boolean | null
          telegram_bot_token?: string | null
          telegram_chat_id?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_settings?: Json | null
          created_at?: string | null
          email_notifications?: string | null
          id?: string
          notify_device_offline?: boolean | null
          notify_low_battery?: boolean | null
          notify_new_device?: boolean | null
          notify_security_issues?: boolean | null
          telegram_bot_token?: string | null
          telegram_chat_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          description: string
          device_id: string | null
          event_type: string
          id: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string
        }
        Insert: {
          created_at?: string | null
          description: string
          device_id?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity: string
        }
        Update: {
          created_at?: string | null
          description?: string
          device_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry_history: {
        Row: {
          device_id: string | null
          id: string
          telemetry_data: Json
          timestamp: string | null
        }
        Insert: {
          device_id?: string | null
          id?: string
          telemetry_data: Json
          timestamp?: string | null
        }
        Update: {
          device_id?: string | null
          id?: string
          telemetry_data?: Json
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_history_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_sql: {
        Args: { sql: string }
        Returns: Json[]
      }
      send_telegram_notification: {
        Args: { message: string; bot_token: string; chat_id: string }
        Returns: Json
      }
    }
    Enums: {
      battery_status:
        | "Charging"
        | "Discharging"
        | "Full"
        | "Not Charging"
        | "Unknown"
      network_type: "WiFi" | "Mobile" | "Ethernet" | "None" | "Unknown"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      battery_status: [
        "Charging",
        "Discharging",
        "Full",
        "Not Charging",
        "Unknown",
      ],
      network_type: ["WiFi", "Mobile", "Ethernet", "None", "Unknown"],
    },
  },
} as const
