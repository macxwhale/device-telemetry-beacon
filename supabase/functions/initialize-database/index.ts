
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
      { 
        auth: {
          persistSession: false
        }
      }
    )

    console.log('Initializing database tables...')
    
    // First check if we have the execute_sql function available
    let execute_sql_available = false;
    
    try {
      const { data: functionCheck, error: functionError } = await supabase.rpc('execute_sql', {
        sql: `SELECT 1 as test`
      });
      
      if (!functionError) {
        execute_sql_available = true;
        console.log('execute_sql function is available');
      } else {
        console.error('execute_sql function error:', functionError);
      }
    } catch (error) {
      console.error('Error checking execute_sql function:', error);
      // Continue with direct SQL if execute_sql is not available
    }
    
    // Create devices table if it doesn't exist
    if (execute_sql_available) {
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
      });
      
      if (devicesError) {
        console.error('Error creating devices table:', devicesError);
        throw devicesError;
      }
    } else {
      // Fallback to direct SQL
      console.log('Using direct SQL to create devices table');
      const { error: directError } = await supabase.sql(`
        CREATE TABLE IF NOT EXISTS public.devices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          android_id TEXT NOT NULL UNIQUE,
          device_name TEXT,
          manufacturer TEXT,
          model TEXT,
          first_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
          last_seen TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `);
      
      if (directError) {
        console.error('Error with direct SQL for creating devices table:', directError);
        throw directError;
      }
    }
    
    console.log('Devices table created or verified');
    
    // Create telemetry_history table if it doesn't exist
    if (execute_sql_available) {
      const { error: telemetryError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.telemetry_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
            telemetry_data JSONB NOT NULL
          );
        `
      });
      
      if (telemetryError) {
        console.error('Error creating telemetry_history table:', telemetryError);
        throw telemetryError;
      }
    } else {
      // Fallback to direct SQL
      console.log('Using direct SQL to create telemetry_history table');
      const { error: directError } = await supabase.sql(`
        CREATE TABLE IF NOT EXISTS public.telemetry_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
          telemetry_data JSONB NOT NULL
        );
      `);
      
      if (directError) {
        console.error('Error with direct SQL for creating telemetry_history table:', directError);
        throw directError;
      }
    }
    
    console.log('Telemetry history table created or verified');
    
    // Create device_apps table if it doesn't exist
    if (execute_sql_available) {
      const { error: appsError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.device_apps (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
            app_package TEXT NOT NULL,
            UNIQUE(device_id, app_package)
          );
        `
      });
      
      if (appsError) {
        console.error('Error creating device_apps table:', appsError);
        throw appsError;
      }
    } else {
      // Fallback to direct SQL
      console.log('Using direct SQL to create device_apps table');
      const { error: directError } = await supabase.sql(`
        CREATE TABLE IF NOT EXISTS public.device_apps (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
          app_package TEXT NOT NULL,
          UNIQUE(device_id, app_package)
        );
      `);
      
      if (directError) {
        console.error('Error with direct SQL for creating device_apps table:', directError);
        throw directError;
      }
    }
    
    console.log('Device apps table created or verified');
    
    // Create or replace the telemetry trigger function
    if (execute_sql_available) {
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
      });
      
      if (triggerFuncError) {
        console.error('Error creating telemetry trigger function:', triggerFuncError);
        throw triggerFuncError;
      }
    } else {
      // Fallback to direct SQL
      console.log('Using direct SQL to create telemetry trigger function');
      const { error: directError } = await supabase.sql(`
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
      `);
      
      if (directError) {
        console.error('Error with direct SQL for creating telemetry trigger function:', directError);
        throw directError;
      }
    }
    
    console.log('Telemetry trigger function created');
    
    // Create the trigger if it doesn't exist
    if (execute_sql_available) {
      const { error: triggerError } = await supabase.rpc('execute_sql', {
        sql: `
          DROP TRIGGER IF EXISTS telemetry_data_trigger ON public.telemetry_history;
          CREATE TRIGGER telemetry_data_trigger
          BEFORE INSERT ON public.telemetry_history
          FOR EACH ROW
          EXECUTE FUNCTION process_telemetry_data();
        `
      });
      
      if (triggerError) {
        console.error('Error creating telemetry trigger:', triggerError);
        throw triggerError;
      }
    } else {
      // Fallback to direct SQL
      console.log('Using direct SQL to create telemetry trigger');
      const { error: directError } = await supabase.sql(`
        DROP TRIGGER IF EXISTS telemetry_data_trigger ON public.telemetry_history;
        CREATE TRIGGER telemetry_data_trigger
        BEFORE INSERT ON public.telemetry_history
        FOR EACH ROW
        EXECUTE FUNCTION process_telemetry_data();
      `);
      
      if (directError) {
        console.error('Error with direct SQL for creating telemetry trigger:', directError);
        throw directError;
      }
    }
    
    console.log('Telemetry trigger created');
    
    // Enable row level security for all tables
    if (execute_sql_available) {
      const { error: rlsError } = await supabase.rpc('execute_sql', {
        sql: `
          -- Enable row level security
          ALTER TABLE IF EXISTS public.devices ENABLE ROW LEVEL SECURITY;
          ALTER TABLE IF EXISTS public.telemetry_history ENABLE ROW LEVEL SECURITY;
          ALTER TABLE IF EXISTS public.device_apps ENABLE ROW LEVEL SECURITY;
          
          -- Create policies that allow service role to access all data
          CREATE POLICY IF NOT EXISTS "Service role can do anything on devices" 
            ON public.devices 
            USING (true)
            WITH CHECK (true);
          
          CREATE POLICY IF NOT EXISTS "Service role can do anything on telemetry_history" 
            ON public.telemetry_history 
            USING (true)
            WITH CHECK (true);
          
          CREATE POLICY IF NOT EXISTS "Service role can do anything on device_apps" 
            ON public.device_apps 
            USING (true)
            WITH CHECK (true);
        `
      });
      
      if (rlsError) {
        console.error('Error setting up row level security:', rlsError);
        throw rlsError;
      }
    } else {
      // Fallback to direct SQL
      console.log('Using direct SQL to set up RLS');
      const { error: directError } = await supabase.sql(`
        -- Enable row level security
        ALTER TABLE IF EXISTS public.devices ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.telemetry_history ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.device_apps ENABLE ROW LEVEL SECURITY;
        
        -- Create policies that allow service role to access all data
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'devices' AND policyname = 'Service role can do anything on devices'
          ) THEN
            CREATE POLICY "Service role can do anything on devices" 
              ON public.devices 
              USING (true)
              WITH CHECK (true);
          END IF;
            
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'telemetry_history' AND policyname = 'Service role can do anything on telemetry_history'
          ) THEN
            CREATE POLICY "Service role can do anything on telemetry_history" 
              ON public.telemetry_history 
              USING (true)
              WITH CHECK (true);
          END IF;
            
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'device_apps' AND policyname = 'Service role can do anything on device_apps'
          ) THEN
            CREATE POLICY "Service role can do anything on device_apps" 
              ON public.device_apps 
              USING (true)
              WITH CHECK (true);
          END IF;
        END
        $$;
      `);
      
      if (directError) {
        console.error('Error with direct SQL for RLS setup:', directError);
        throw directError;
      }
    }
    
    console.log('Row level security set up');
    
    // Set up realtime features
    if (execute_sql_available) {
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
      });
      
      if (realtimeError) {
        console.error('Error setting up realtime features:', realtimeError);
        throw realtimeError;
      }
    } else {
      // Fallback to direct SQL
      console.log('Using direct SQL to set up realtime features');
      const { error: directError } = await supabase.sql(`
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
      `);
      
      if (directError) {
        console.error('Error with direct SQL for realtime setup:', directError);
        throw directError;
      }
    }
    
    console.log('Realtime features set up');

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
