
export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger_type: 'device_event' | 'scheduled' | 'manual' | 'webhook';
  trigger_conditions: any;
  actions: any[];
  enabled: boolean;
  organization_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationExecution {
  id: string;
  rule_id: string;
  trigger_data?: any;
  execution_status: 'pending' | 'running' | 'completed' | 'failed';
  results?: any;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret_key?: string;
  events: string[];
  enabled: boolean;
  organization_id?: string;
  created_by: string;
  created_at: string;
  last_triggered?: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: any;
  response_status?: number;
  response_body?: string;
  delivery_status: 'pending' | 'delivered' | 'failed' | 'retrying';
  retry_count: number;
  created_at: string;
  delivered_at?: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  assigned_by?: string;
  assigned_at: string;
  expires_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: any;
  created_at: string;
  updated_at: string;
}
