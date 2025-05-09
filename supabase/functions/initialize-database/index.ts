
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
    console.log("Initialize database edge function called")
    
    // Create a Supabase client using service role key for admin privileges
    // This allows us to execute SQL directly
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` } } }
    )
    
    // Check if execute_sql function exists first
    console.log("Checking if execute_sql function exists...")
    const checkFunctionResult = await supabaseAdmin.rpc('execute_sql', {
      sql: `
        SELECT EXISTS (
          SELECT 1
          FROM pg_proc
          WHERE proname = 'execute_sql'
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ) as execute_sql_exists;
      `
    }).catch(error => {
      return { error }
    })
    
    if (checkFunctionResult.error) {
      console.log("execute_sql function does not exist, cannot continue")
      return new Response(JSON.stringify({ 
        error: 'Database functions not initialized', 
        details: 'Please initialize database functions first' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    // Check if tables exist
    console.log("Checking if tables already exist...")
    const { data: tableData, error: tableCheckError } = await supabaseAdmin.rpc('execute_sql', {
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
      console.log("All tables already exist")
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
    console.log("Creating database tables...")
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

    const { error: createTablesError } = await supabaseAdmin.rpc('execute_sql', {
      sql: createTablesSQL
    })

    if (createTablesError) {
      console.error("Error creating tables:", createTablesError)
      return new Response(JSON.stringify({ error: 'Failed to create tables', details: createTablesError }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Create the process_telemetry_data function
    console.log("Creating process_telemetry_data function...")
    const { error: processFnError } = await supabaseAdmin.rpc('execute_sql', {
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
      console.error("Error creating process_telemetry_data function:", processFnError)
    } else {
      console.log("process_telemetry_data function created successfully")
    }

    // Run the functions to setup the database
    console.log("Running setup functions...")
    const { error: triggerError } = await supabaseAdmin.rpc('check_and_create_telemetry_trigger')
    const { error: realtimeError } = await supabaseAdmin.rpc('enable_realtime_tables')

    if (triggerError) {
      console.error('Error running telemetry trigger:', triggerError)
    } else {
      console.log("Telemetry trigger created successfully")
    }

    if (realtimeError) {
      console.error('Error enabling realtime:', realtimeError)
    } else {
      console.log("Realtime tables enabled successfully")
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
