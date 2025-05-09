
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
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Required environment variables are not set.')
    }
    
    // Create a Supabase client using service role key for admin privileges
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { 
        auth: {
          persistSession: false
        } 
      }
    )
    
    console.log("Creating execute_sql function...")
    
    // Create the execute_sql function
    try {
      const { error: executeError } = await supabaseAdmin.rpc('execute', {
        query: `
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
      })
      
      if (executeError) {
        console.error("Error creating execute_sql function with direct SQL:", executeError)
        throw executeError;
      }
    } catch (directError) {
      console.log("Trying alternative approach for execute_sql function...")
      
      // Try direct SQL execution as a fallback
      const { error: sqlError } = await supabaseAdmin.from('_functions_setup').select('*').limit(1).maybeSingle()
      
      // If table doesn't exist, we need to create our function with direct SQL
      if (sqlError && sqlError.code === 'PGRST116') {
        console.log("Creating execute_sql with direct SQL query")
        
        // Execute direct SQL
        const { error: directSqlError } = await supabaseAdmin.sql(`
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
        `)
        
        if (directSqlError) {
          console.error("Failed to create execute_sql function:", directSqlError)
          throw directSqlError;
        }
      }
    }
    
    console.log("execute_sql function created or verified")
    
    // Now we can use execute_sql for the remaining functions
    // Create the process_telemetry_data function
    console.log("Creating process telemetry data function...")
    const { error: processFnError } = await supabaseAdmin.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.process_telemetry_data()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          -- Update the last_seen timestamp on the device record
          UPDATE public.devices
          SET last_seen = NEW.timestamp
          WHERE id = NEW.device_id;
          
          -- Return the NEW record to continue with the insert
          RETURN NEW;
        END;
        $$;
      `
    })
    
    if (processFnError) {
      console.error("Error creating process_telemetry_data function:", processFnError)
    } else {
      console.log("Process telemetry data function created successfully")
    }
    
    // Create the check_and_create_telemetry_trigger function
    console.log("Creating telemetry trigger function...")
    const { error: triggerFnError } = await supabaseAdmin.rpc('execute_sql', {
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
    const { error: realtimeFnError } = await supabaseAdmin.rpc('execute_sql', {
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
        execute_sql: !processFnError,
        process_telemetry_data: !processFnError,
        telemetry_trigger: !triggerFnError,
        realtime_tables: !realtimeFnError
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Database functions error:", error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
