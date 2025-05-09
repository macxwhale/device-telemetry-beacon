
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

    // Verify the user has access
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Create the check_and_create_telemetry_trigger function if it doesn't exist
    const { error: createFunctionError } = await supabaseClient.rpc('execute_sql', {
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
    }).catch(error => ({ error }));

    if (createFunctionError) {
      console.error('Error creating check_and_create_telemetry_trigger function:', createFunctionError);
    }

    // Create the enable_realtime_tables function if it doesn't exist
    const { error: createRealtimeFunctionError } = await supabaseClient.rpc('execute_sql', {
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
          
          RETURN true;
        END;
        $$;
      `
    }).catch(error => ({ error }));

    if (createRealtimeFunctionError) {
      console.error('Error creating enable_realtime_tables function:', createRealtimeFunctionError);
    }

    // Create the execute_sql function to allow executing arbitrary SQL
    const { error: executeError } = await supabaseClient.rpc('execute_sql', {
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
    }).catch(error => ({ error }));

    if (executeError && !executeError.message.includes('already exists')) {
      return new Response(JSON.stringify({ error: executeError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Database functions initialized successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
