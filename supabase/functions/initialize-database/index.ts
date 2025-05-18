
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL setup script - same as in DatabaseSetupSQL.tsx
const getDatabaseSetupSQL = () => {
  return `-- Create the execute_sql function for safe SQL execution
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create enums for common statuses
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'battery_status') THEN
    CREATE TYPE public.battery_status AS ENUM ('Charging', 'Discharging', 'Full', 'Not Charging', 'Unknown');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'network_type') THEN
    CREATE TYPE public.network_type AS ENUM ('WiFi', 'Mobile', 'Ethernet', 'None', 'Unknown');
  END IF;
END$$;

-- Create devices table
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  android_id TEXT NOT NULL UNIQUE,
  device_name TEXT,
  manufacturer TEXT,
  model TEXT,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create device_telemetry table for structured data
CREATE TABLE IF NOT EXISTS public.device_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Device info
  device_name TEXT,
  manufacturer TEXT,
  brand TEXT,
  model TEXT,
  product TEXT,
  android_id TEXT,
  imei TEXT,
  is_emulator BOOLEAN,
  
  -- System info
  android_version TEXT,
  sdk_int INTEGER,
  base_version INTEGER,
  fingerprint TEXT,
  build_number TEXT,
  kernel_version TEXT,
  bootloader TEXT,
  build_tags TEXT,
  build_type TEXT,
  board TEXT,
  hardware TEXT,
  host TEXT,
  user_name TEXT,
  uptime_millis BIGINT,
  boot_time BIGINT,
  cpu_cores INTEGER,
  language TEXT,
  timezone TEXT,
  
  -- Battery info
  battery_level INTEGER,
  battery_status battery_status,
  
  -- Network info
  ip_address TEXT,
  network_interface network_type,
  carrier TEXT,
  wifi_ssid TEXT,
  
  -- Display info
  screen_resolution TEXT,
  screen_orientation TEXT,
  
  -- Security info
  is_rooted BOOLEAN,
  
  -- OS info
  os_type TEXT
);

-- Create telemetry_history table for raw JSON data
CREATE TABLE IF NOT EXISTS public.telemetry_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  telemetry_data JSONB NOT NULL
);

-- Create device_apps table
CREATE TABLE IF NOT EXISTS public.device_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
  app_package TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(device_id, app_package)
);

-- Create or replace the process_telemetry_data function
CREATE OR REPLACE FUNCTION process_telemetry_data()
RETURNS TRIGGER AS $$
DECLARE
  device_id_var UUID;
  device_info JSONB;
  system_info JSONB;
  battery_info JSONB;
  network_info JSONB;
  display_info JSONB;
  security_info JSONB;
  app_info JSONB;
  ip_addr TEXT;
  network_type_var network_type;
  battery_status_var battery_status;
  app_list TEXT[];
BEGIN
  -- Extract sections from telemetry data
  device_info := NEW.telemetry_data->'device_info';
  system_info := NEW.telemetry_data->'system_info';
  battery_info := NEW.telemetry_data->'battery_info';
  network_info := NEW.telemetry_data->'network_info';
  display_info := NEW.telemetry_data->'display_info';
  security_info := NEW.telemetry_data->'security_info';
  app_info := NEW.telemetry_data->'app_info';
  
  -- Get Android ID from telemetry data
  -- First try getting it from device_info
  IF device_info IS NOT NULL AND device_info->>'android_id' IS NOT NULL THEN
    -- First ensure device exists in devices table
    INSERT INTO public.devices (
      android_id, 
      device_name, 
      manufacturer, 
      model, 
      last_seen
    )
    VALUES (
      device_info->>'android_id',
      device_info->>'device_name',
      device_info->>'manufacturer',
      device_info->>'model',
      NEW.timestamp
    )
    ON CONFLICT (android_id) DO UPDATE
    SET 
      device_name = COALESCE(EXCLUDED.device_name, devices.device_name),
      manufacturer = COALESCE(EXCLUDED.manufacturer, devices.manufacturer),
      model = COALESCE(EXCLUDED.model, devices.model),
      last_seen = EXCLUDED.last_seen
    RETURNING id INTO device_id_var;
  ELSE
    -- Try getting android_id from root of the data
    INSERT INTO public.devices (
      android_id, 
      device_name, 
      manufacturer, 
      model, 
      last_seen
    )
    VALUES (
      NEW.telemetry_data->>'android_id',
      device_info->>'device_name',
      device_info->>'manufacturer',
      device_info->>'model',
      NEW.timestamp
    )
    ON CONFLICT (android_id) DO UPDATE
    SET 
      last_seen = EXCLUDED.last_seen
    RETURNING id INTO device_id_var;
  END IF;
  
  -- Determine IP address from different possible sources
  ip_addr := 
    COALESCE(
      network_info->>'ethernet_ip', 
      network_info->>'wifi_ip', 
      network_info->>'mobile_ip', 
      network_info->>'ip_address',
      '0.0.0.0'
    );
  
  -- Determine network type
  IF network_info->>'network_interface' = 'WiFi' OR network_info->>'wifi_ip' IS NOT NULL THEN
    network_type_var := 'WiFi';
  ELSIF network_info->>'network_interface' = 'Mobile' OR network_info->>'mobile_ip' IS NOT NULL THEN
    network_type_var := 'Mobile';
  ELSIF network_info->>'network_interface' = 'Ethernet' OR network_info->>'ethernet_ip' IS NOT NULL THEN
    network_type_var := 'Ethernet';
  ELSIF network_info->>'network_interface' = 'None' THEN
    network_type_var := 'None';
  ELSE
    network_type_var := 'Unknown';
  END IF;
  
  -- Determine battery status
  IF battery_info->>'battery_status' = 'Charging' THEN
    battery_status_var := 'Charging';
  ELSIF battery_info->>'battery_status' = 'Discharging' THEN
    battery_status_var := 'Discharging';
  ELSIF battery_info->>'battery_status' = 'Full' THEN
    battery_status_var := 'Full';
  ELSIF battery_info->>'battery_status' = 'Not Charging' THEN
    battery_status_var := 'Not Charging';
  ELSE
    battery_status_var := 'Unknown';
  END IF;
  
  -- Insert into device_telemetry table
  INSERT INTO public.device_telemetry (
    device_id,
    timestamp,
    device_name,
    manufacturer,
    brand,
    model,
    product,
    android_id,
    imei,
    is_emulator,
    android_version,
    sdk_int,
    base_version,
    fingerprint,
    build_number,
    kernel_version,
    bootloader,
    build_tags,
    build_type,
    board,
    hardware,
    host,
    user_name,
    uptime_millis,
    boot_time,
    cpu_cores,
    language,
    timezone,
    battery_level,
    battery_status,
    ip_address,
    network_interface,
    carrier,
    wifi_ssid,
    screen_resolution,
    screen_orientation,
    is_rooted,
    os_type
  ) VALUES (
    device_id_var,
    NEW.timestamp,
    device_info->>'device_name',
    device_info->>'manufacturer',
    device_info->>'brand',
    device_info->>'model',
    device_info->>'product',
    device_info->>'android_id',
    device_info->>'imei',
    (device_info->>'is_emulator')::boolean,
    system_info->>'android_version',
    (system_info->>'sdk_int')::integer,
    (system_info->>'base_version')::integer,
    system_info->>'fingerprint',
    system_info->>'build_number',
    system_info->>'kernel_version',
    system_info->>'bootloader',
    system_info->>'build_tags',
    system_info->>'build_type',
    system_info->>'board',
    system_info->>'hardware',
    system_info->>'host',
    system_info->>'user',
    (system_info->>'uptime_millis')::bigint,
    (system_info->>'boot_time')::bigint,
    (system_info->>'cpu_cores')::integer,
    system_info->>'language',
    system_info->>'timezone',
    (battery_info->>'battery_level')::integer,
    battery_status_var,
    ip_addr,
    network_type_var,
    network_info->>'carrier',
    network_info->>'wifi_ssid',
    display_info->>'screen_resolution',
    display_info->>'screen_orientation',
    (security_info->>'is_rooted')::boolean,
    NEW.telemetry_data->>'os_type'
  );
  
  -- Process installed apps if present
  IF app_info IS NOT NULL AND app_info->'installed_apps' IS NOT NULL THEN
    app_list := ARRAY(SELECT jsonb_array_elements_text(app_info->'installed_apps'));
    
    IF array_length(app_list, 1) > 0 THEN
      INSERT INTO public.device_apps (device_id, app_package)
      SELECT 
        device_id_var,
        app_name
      FROM unnest(app_list) AS app_name
      ON CONFLICT (device_id, app_package) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'telemetry_trigger' 
  ) THEN
    CREATE TRIGGER telemetry_trigger
    AFTER INSERT ON public.telemetry_history
    FOR EACH ROW
    EXECUTE FUNCTION process_telemetry_data();
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telemetry_device_id ON public.device_telemetry(device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON public.device_telemetry(timestamp);
CREATE INDEX IF NOT EXISTS idx_history_device_id ON public.telemetry_history(device_id);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON public.telemetry_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_apps_device_id ON public.device_apps(device_id);

-- Enable row level security
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_telemetry ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow full access to authenticated users' AND tablename = 'devices') THEN
    CREATE POLICY "Allow full access to authenticated users" ON public.devices
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow full access to authenticated users' AND tablename = 'telemetry_history') THEN
    CREATE POLICY "Allow full access to authenticated users" ON public.telemetry_history
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow full access to authenticated users' AND tablename = 'device_apps') THEN
    CREATE POLICY "Allow full access to authenticated users" ON public.device_apps
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow full access to authenticated users' AND tablename = 'device_telemetry') THEN
    CREATE POLICY "Allow full access to authenticated users" ON public.device_telemetry
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Enable realtime for all tables
DO $$
BEGIN
  PERFORM supabase_functions.alter_subscription_add_table('public.devices');
  PERFORM supabase_functions.alter_subscription_add_table('public.telemetry_history');
  PERFORM supabase_functions.alter_subscription_add_table('public.device_apps');
  PERFORM supabase_functions.alter_subscription_add_table('public.device_telemetry');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error enabling realtime: %', SQLERRM;
END $$;

-- Set replica identity to full for realtime updates
ALTER TABLE public.devices REPLICA IDENTITY FULL;
ALTER TABLE public.telemetry_history REPLICA IDENTITY FULL;
ALTER TABLE public.device_apps REPLICA IDENTITY FULL;
ALTER TABLE public.device_telemetry REPLICA IDENTITY FULL;`;
};

serve(async (req) => {
  // Add CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get request body
    const { action } = await req.json();

    if (action === "initialize") {
      console.log("Initializing database...");

      // Execute the database setup script
      const setupSQL = getDatabaseSetupSQL();
      const { data, error } = await supabase.rpc('execute_sql', {
        sql: setupSQL,
      });

      if (error) {
        console.error("Error initializing database:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Database initialized successfully",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid action",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error("Error in initialize-database function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
