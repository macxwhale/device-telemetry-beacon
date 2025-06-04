
export interface DeviceGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceGroupMembership {
  id: string;
  device_id: string;
  group_id: string;
  added_at: string;
}

export interface DeviceTag {
  id: string;
  device_id: string;
  tag_name: string;
  tag_value?: string;
  created_at: string;
}

export interface SecurityEvent {
  id: string;
  device_id: string;
  event_type: 'root_detected' | 'emulator_detected' | 'suspicious_app' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: any;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export interface DevicePolicy {
  id: string;
  name: string;
  description?: string;
  rules: any;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeviceAnalytics {
  id: string;
  device_id: string;
  metric_type: 'battery' | 'uptime' | 'network' | 'performance';
  metric_value: number;
  metadata?: any;
  recorded_at: string;
}
