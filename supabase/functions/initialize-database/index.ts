
// Supabase Edge Function for database initialization
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from 'https://deno.land/std@0.188.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Required environment variables are not set.')
    }

    // Create a Supabase client with the service role key for admin privileges
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { global: { headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } } }
    )

    console.log('Initializing database tables...')
    
    // Create devices table if it doesn't exist
    const { error: devicesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.devices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          android_id TEXT NOT NULL UNIQUE,
          device_name TEXT,
          manufacturer TEXT,
          model TEXT,
          first_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
          last_seen TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `
    })
    
    if (devicesError) {
      console.error('Error creating devices table:', devicesError)
      throw devicesError
    }
    
    // Create telemetry_history table if it doesn't exist
    const { error: telemetryError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.telemetry_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
          telemetry_data JSONB NOT NULL
        );
      `
    })
    
    if (telemetryError) {
      console.error('Error creating telemetry_history table:', telemetryError)
      throw telemetryError
    }
    
    // Create device_apps table if it doesn't exist
    const { error: appsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.device_apps (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
          app_package TEXT NOT NULL,
          UNIQUE(device_id, app_package)
        );
      `
    })
    
    if (appsError) {
      console.error('Error creating device_apps table:', appsError)
      throw appsError
    }
    
    // Create or replace the telemetry trigger function
    const { error: triggerFuncError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION process_telemetry_data()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Update the last_seen timestamp on the device record
          UPDATE public.devices
          SET last_seen = NEW.timestamp
          WHERE id = NEW.device_id;
          
          -- Return the NEW record to continue with the insert
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    })
    
    if (triggerFuncError) {
      console.error('Error creating telemetry trigger function:', triggerFuncError)
      throw triggerFuncError
    }
    
    // Create the trigger if it doesn't exist
    const { error: triggerError } = await supabase.rpc('execute_sql', {
      sql: `
        DROP TRIGGER IF EXISTS telemetry_data_trigger ON public.telemetry_history;
        CREATE TRIGGER telemetry_data_trigger
        BEFORE INSERT ON public.telemetry_history
        FOR EACH ROW
        EXECUTE FUNCTION process_telemetry_data();
      `
    })
    
    if (triggerError) {
      console.error('Error creating telemetry trigger:', triggerError)
      throw triggerError
    }
    
    // Enable row level security for all tables
    const { error: rlsError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Enable row level security
        ALTER TABLE IF EXISTS public.devices ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.telemetry_history ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.device_apps ENABLE ROW LEVEL SECURITY;
        
        -- Create policies that allow service role to access all data
        DO $$
        BEGIN
          -- Devices policies
          IF NOT EXISTS (
            SELECT FROM pg_policies WHERE tablename = 'devices' AND policyname = 'Service role can do anything'
          ) THEN
            CREATE POLICY "Service role can do anything" ON public.devices 
              USING (true)
              WITH CHECK (true);
          END IF;
          
          -- Telemetry history policies
          IF NOT EXISTS (
            SELECT FROM pg_policies WHERE tablename = 'telemetry_history' AND policyname = 'Service role can do anything'
          ) THEN
            CREATE POLICY "Service role can do anything" ON public.telemetry_history 
              USING (true)
              WITH CHECK (true);
          END IF;
          
          -- Device apps policies
          IF NOT EXISTS (
            SELECT FROM pg_policies WHERE tablename = 'device_apps' AND policyname = 'Service role can do anything'
          ) THEN
            CREATE POLICY "Service role can do anything" ON public.device_apps 
              USING (true)
              WITH CHECK (true);
          END IF;
        END
        $$;
      `
    })
    
    if (rlsError) {
      console.error('Error setting up row level security:', rlsError)
      throw rlsError
    }
    
    // Set up realtime features
    const { error: realtimeError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Set replica identity to full for the tables
        ALTER TABLE IF EXISTS public.devices REPLICA IDENTITY FULL;
        ALTER TABLE IF EXISTS public.telemetry_history REPLICA IDENTITY FULL;
        ALTER TABLE IF EXISTS public.device_apps REPLICA IDENTITY FULL;
        
        -- Add tables to the supabase_realtime publication
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
          ) THEN
            -- Check if tables are already in the publication
            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = 'devices'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = 'telemetry_history'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_history;
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = 'device_apps'
            ) THEN
              ALTER PUBLICATION supabase_realtime ADD TABLE public.device_apps;
            END IF;
          ELSE
            -- Create the publication and add tables
            CREATE PUBLICATION supabase_realtime FOR TABLE 
              public.devices, 
              public.telemetry_history, 
              public.device_apps;
          END IF;
        END
        $$;
      `
    })
    
    if (realtimeError) {
      console.error('Error setting up realtime features:', realtimeError)
      throw realtimeError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database tables initialized successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    )
  } catch (error) {
    console.error('Database initialization error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: String(error)
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})
