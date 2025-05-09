
// Supabase Edge Function to set up database functions
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
    console.log("Database functions edge function called")
    
    // Create a Supabase client using service role key for admin privileges
    // This allows us to execute SQL directly
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` } } }
    )
    
    console.log("Creating execute_sql function...")
    
    // First create the execute_sql function to allow executing arbitrary SQL
    // This has to be done first since we'll use it for other operations
    const { error: executeError } = await supabaseAdmin.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
          RETURN '{"success": true}'::json;
        EXCEPTION
          WHEN OTHERS THEN
            RETURN json_build_object(
              'success', false,
              'error', SQLERRM
            );
        END;
        $$;
      `
    }).catch(error => {
      // If function already exists, that's fine
      if (error && !error.message.includes('already exists')) {
        return { error }
      }
      return { error: null }
    })
    
    if (executeError) {
      console.error("Error creating execute_sql function:", executeError)
      return new Response(JSON.stringify({ error: executeError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }
    
    console.log("execute_sql function created or already exists")
    
    // Now we can use execute_sql for the remaining functions
    
    // Create the check_and_create_telemetry_trigger function
    console.log("Creating telemetry trigger function...")
    const { data: triggerFnData, error: triggerFnError } = await supabaseAdmin.rpc('execute_sql', {
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
      console.error("Error creating telemetry trigger function:", triggerFnError)
    } else {
      console.log("Telemetry trigger function created successfully")
    }
    
    // Create the enable_realtime_tables function
    console.log("Creating realtime tables function...")
    const { data: realtimeFnData, error: realtimeFnError } = await supabaseAdmin.rpc('execute_sql', {
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
          
          -- Add tables to the supabase_realtime publication if not already added
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
      console.error("Error creating realtime tables function:", realtimeFnError)
    } else {
      console.log("Realtime tables function created successfully")
    }
    
    console.log("All database functions initialized")

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Database functions initialized successfully',
      functions: {
        execute_sql: !executeError,
        telemetry_trigger: !triggerFnError,
        realtime_tables: !realtimeFnError
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Database functions error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
