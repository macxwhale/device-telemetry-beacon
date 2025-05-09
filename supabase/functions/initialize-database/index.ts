
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` } } }
    )
    
    // Try direct SQL execution first to create the execute_sql function if it doesn't exist
    console.log("Ensuring execute_sql function exists...")
    
    try {
      // Try to execute a simple query to check if function exists
      const { error: testError } = await supabaseAdmin.rpc('execute_sql', {
        sql: 'SELECT 1;'
      });
      
      if (testError) {
        console.log("execute_sql function doesn't exist, creating it directly...")
        // Create the function directly with SQL
        const { error: createError } = await supabaseAdmin.rpc('execute', {
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
        });
        
        if (createError) {
          console.error("Failed to create execute_sql function:", createError);
          return new Response(JSON.stringify({ 
            error: 'Database setup error', 
            details: 'Failed to create necessary database functions',
            message: createError.message
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
      }
    } catch (error) {
      console.log("Error checking execute_sql function, will try to call database-functions endpoint:", error);
      
      // Call the database-functions endpoint to set up the functions
      try {
        const resp = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/database-functions`, 
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          }
        );
        
        if (!resp.ok) {
          const errorText = await resp.text();
          throw new Error(`Database functions setup failed: ${errorText}`);
        }
        
        console.log("Database functions initialized successfully");
      } catch (fnError) {
        console.error("Failed to initialize database functions:", fnError);
        return new Response(JSON.stringify({ 
          error: 'Database setup error', 
          details: 'Failed to initialize database functions',
          message: fnError.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    }
    
    // Now check if tables exist
    console.log("Checking if tables already exist...");
    
    let tablesExist = false;
    
    try {
      const { data: tableData, error: tableCheckError } = await supabaseAdmin.rpc('execute_sql', {
        sql: `
          SELECT 
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'devices') as devices_exist,
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'telemetry_history') as telemetry_exist,
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_apps') as apps_exist
        `
      });

      if (tableCheckError) {
        console.error("Failed to check if tables exist:", tableCheckError);
        return new Response(JSON.stringify({ error: 'Failed to check if tables exist', details: tableCheckError }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      tablesExist = tableData && 
        tableData[0]?.devices_exist === true && 
        tableData[0]?.telemetry_exist === true && 
        tableData[0]?.apps_exist === true;

      if (tablesExist) {
        console.log("All tables already exist");
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Database tables already exist', 
          tables: {
            devices: tableData[0]?.devices_exist || false,
            telemetry_history: tableData[0]?.telemetry_exist || false,
            device_apps: tableData[0]?.apps_exist || false
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      
      // Create tables if they don't exist
      console.log("Creating database tables...");
      
      const createTablesSQL = `
        -- Create the devices table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.devices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          android_id TEXT UNIQUE NOT NULL,
          device_name TEXT,
          manufacturer TEXT,
          model TEXT,
          first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Create the telemetry_history table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.telemetry_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          device_id UUID NOT NULL REFERENCES public.devices(id),
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          telemetry_data JSONB NOT NULL
        );
        
        -- Create the device_apps table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.device_apps (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          device_id UUID NOT NULL REFERENCES public.devices(id),
          app_package TEXT NOT NULL,
          UNIQUE(device_id, app_package)
        );
      `;

      const { error: createTablesError } = await supabaseAdmin.rpc('execute_sql', {
        sql: createTablesSQL
      });

      if (createTablesError) {
        console.error("Error creating tables:", createTablesError);
        return new Response(JSON.stringify({ error: 'Failed to create tables', details: createTablesError }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      console.log("Tables created successfully");

      // Create the process_telemetry_data function
      console.log("Creating process_telemetry_data function...");
      const { error: processFnError } = await supabaseAdmin.rpc('execute_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION public.process_telemetry_data()
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
      });

      if (processFnError) {
        console.error("Error creating process_telemetry_data function:", processFnError);
      } else {
        console.log("process_telemetry_data function created successfully");
      }

      // Run the functions to setup the database
      console.log("Running setup functions...");
      let triggerError = null;
      let realtimeError = null;
      
      try {
        const { error: triggerSetupError } = await supabaseAdmin.rpc('execute_sql', {
          sql: `SELECT public.check_and_create_telemetry_trigger();`
        });
        
        if (triggerSetupError) {
          console.error("Error running telemetry trigger:", triggerSetupError);
          triggerError = triggerSetupError;
        } else {
          console.log("Telemetry trigger created successfully");
        }
      } catch (error) {
        console.error('Error running telemetry trigger:', error);
        triggerError = error;
      }
      
      try {
        const { error: realtimeSetupError } = await supabaseAdmin.rpc('execute_sql', {
          sql: `SELECT public.enable_realtime_tables();`
        });
        
        if (realtimeSetupError) {
          console.error("Error enabling realtime:", realtimeSetupError);
          realtimeError = realtimeSetupError;
        } else {
          console.log("Realtime tables enabled successfully");
        }
      } catch (error) {
        console.error('Error enabling realtime:', error);
        realtimeError = error;
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Database tables and functions created successfully',
        trigger_status: triggerError ? 'error' : 'success',
        realtime_status: realtimeError ? 'error' : 'success'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      console.error('Error checking or creating tables:', error);
      return new Response(JSON.stringify({ error: 'Failed to check or create tables', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  } catch (error) {
    console.error('Initialization error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
