
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

    // Create database helper function to check and create the telemetry trigger
    const { error } = await supabaseClient.rpc('check_and_create_telemetry_trigger')

    if (error) {
      // If the function doesn't exist yet, create it
      const { data, error: creationError } = await supabaseClient.query(`
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
      `)

      if (creationError) {
        return new Response(JSON.stringify({ error: creationError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        })
      }

      // Try to create the trigger now
      const { error: triggerError } = await supabaseClient.rpc('check_and_create_telemetry_trigger')
      if (triggerError) {
        return new Response(JSON.stringify({ error: triggerError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        })
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Database functions initialized successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
