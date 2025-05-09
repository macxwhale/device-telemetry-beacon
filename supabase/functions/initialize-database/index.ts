
// Supabase Edge Function to initialize the database tables
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
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Create a Supabase client with the auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Check if tables exist
    const { data: tableData, error: tableCheckError } = await supabaseClient.rpc('execute_sql', {
      sql: `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'devices'
        ) as devices_exist,
        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'telemetry_history'
        ) as telemetry_exist,
        EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'device_apps'
        ) as apps_exist
      `
    })

    if (tableCheckError) {
      return new Response(JSON.stringify({ error: 'Failed to check if tables exist', details: tableCheckError }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const tablesExist = tableData && tableData.devices_exist && tableData.telemetry_exist && tableData.apps_exist

    if (tablesExist) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Database tables already exist', 
        tables: {
          devices: tableData.devices_exist,
          telemetry_history: tableData.telemetry_exist,
          device_apps: tableData.apps_exist
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Create tables if they don't exist
    const createTablesSQL = `
      -- Create the devices table
      CREATE TABLE IF NOT EXISTS public.devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        android_id TEXT UNIQUE NOT NULL,
        device_name TEXT,
        manufacturer TEXT,
        model TEXT,
        first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      
      -- Create the telemetry_history table
      CREATE TABLE IF NOT EXISTS public.telemetry_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id UUID NOT NULL REFERENCES public.devices(id),
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        telemetry_data JSONB NOT NULL
      );
      
      -- Create the device_apps table
      CREATE TABLE IF NOT EXISTS public.device_apps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id UUID NOT NULL REFERENCES public.devices(id),
        app_package TEXT NOT NULL,
        UNIQUE(device_id, app_package)
      );
    `

    const { error: createTablesError } = await supabaseClient.rpc('execute_sql', {
      sql: createTablesSQL
    })

    if (createTablesError) {
      return new Response(JSON.stringify({ error: 'Failed to create tables', details: createTablesError }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Create the process_telemetry_data function
    const { error: processFnError } = await supabaseClient.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.process_telemetry_data()
        RETURNS TRIGGER AS $$
        BEGIN
          -- The function logic will be added via the RPC functions
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    })

    if (processFnError) {
      console.error('Error creating process_telemetry_data function:', processFnError)
    }

    // Create the check_and_create_telemetry_trigger function
    const { error: triggerFnError } = await supabaseClient.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.check_and_create_telemetry_trigger()
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          -- Check if trigger already exists
          IF EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'telemetry_data_trigger'
          ) THEN
            RETURN true;
          END IF;

          -- Create the trigger
          CREATE TRIGGER telemetry_data_trigger
            BEFORE INSERT ON public.telemetry_history
            FOR EACH ROW
            EXECUTE FUNCTION public.process_telemetry_data();
            
          RETURN true;
        END;
        $$;
      `
    })

    if (triggerFnError) {
      console.error('Error creating check_and_create_telemetry_trigger function:', triggerFnError)
    }

    // Create the enable_realtime_tables function
    const { error: realtimeFnError } = await supabaseClient.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.enable_realtime_tables()
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          -- Set replica identity to full for the tables
          ALTER TABLE IF EXISTS public.devices REPLICA IDENTITY FULL;
          ALTER TABLE IF EXISTS public.telemetry_history REPLICA IDENTITY FULL;
          ALTER TABLE IF EXISTS public.device_apps REPLICA IDENTITY FULL;
          
          -- Add tables to the supabase_realtime publication
          IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
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
          
          RETURN true;
        END;
        $$;
      `
    })

    if (realtimeFnError) {
      console.error('Error creating enable_realtime_tables function:', realtimeFnError)
    }

    // Run the functions to setup the database
    const { error: triggerError } = await supabaseClient.rpc('check_and_create_telemetry_trigger')
    const { error: realtimeError } = await supabaseClient.rpc('enable_realtime_tables')

    if (triggerError) {
      console.error('Error running telemetry trigger:', triggerError)
    }

    if (realtimeError) {
      console.error('Error enabling realtime:', realtimeError)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Database tables and functions created successfully',
      trigger_status: triggerError ? 'error' : 'success',
      realtime_status: realtimeError ? 'error' : 'success'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Initialization error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
