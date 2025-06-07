
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Helper function to validate Supabase UUID format
function isSupabaseUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Standardized error response for ID validation
function createIdValidationError(field: string, value: string): Response {
  console.log(`💔 Invalid ${field} format:`, value);
  return new Response(
    JSON.stringify({ 
      error: `${field} must be a valid Supabase UUID format`,
      received: value,
      expected_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      field: field.toLowerCase()
    }),
    { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🌈 Assign Device to Group Edge Function called!')
    
    const { deviceId, groupId } = await req.json()
    console.log('📡 Edge Function called with:', { deviceId, groupId })

    // Validate input exists
    if (!deviceId || !groupId) {
      console.log('💔 Missing required IDs')
      return new Response(
        JSON.stringify({ 
          error: 'Both deviceId and groupId are required',
          missing: !deviceId ? 'deviceId' : 'groupId'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate both IDs are proper Supabase UUIDs
    if (!isSupabaseUUID(deviceId)) {
      return createIdValidationError('Device ID', deviceId);
    }

    if (!isSupabaseUUID(groupId)) {
      return createIdValidationError('Group ID', groupId);
    }

    console.log('✅ ID validation passed for both device and group UUIDs');

    // Create supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify that both device and group exist using device.id (Supabase UUID)
    console.log('🔍 Verifying device and group exist...')
    
    const [deviceCheck, groupCheck] = await Promise.all([
      // Use device.id for lookup instead of android_id
      supabase.from('devices').select('id, android_id, device_name').eq('id', deviceId).maybeSingle(),
      supabase.from('device_groups').select('id, name').eq('id', groupId).maybeSingle()
    ]);

    if (deviceCheck.error) {
      console.error('💔 Error checking device:', deviceCheck.error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to verify device exists', 
          details: deviceCheck.error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!deviceCheck.data) {
      console.log('💔 Device not found with UUID:', deviceId)
      return new Response(
        JSON.stringify({ 
          error: 'Device not found',
          searched_device_id: deviceId,
          hint: 'Ensure you are using the devices.id (Supabase UUID), not the android_id'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (groupCheck.error) {
      console.error('💔 Error checking group:', groupCheck.error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to verify group exists', 
          details: groupCheck.error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!groupCheck.data) {
      console.log('💔 Group not found:', groupId)
      return new Response(
        JSON.stringify({ 
          error: 'Group not found',
          searched_group_id: groupId
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🌸 Checking if assignment already exists...')
    
    // Check if assignment already exists using device.id (Supabase UUID)
    const { data: existing, error: checkError } = await supabase
      .from('device_group_memberships')
      .select('id')
      .eq('device_id', deviceId) // Using device.id
      .eq('group_id', groupId)
      .maybeSingle()

    if (checkError) {
      console.error('💔 Error checking existing assignment:', checkError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check existing assignment', 
          details: checkError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (existing) {
      console.log('💡 Assignment already exists, skipping')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Device already assigned to group',
          alreadyExists: true,
          deviceUuid: deviceId,
          groupUuid: groupId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🚀 Creating new assignment in database...')
    
    // Create new assignment using device.id (Supabase UUID)
    const { data, error } = await supabase
      .from('device_group_memberships')
      .insert({ 
        device_id: deviceId, // Using device.id (Supabase UUID)
        group_id: groupId 
      })
      .select()
      .single()

    if (error) {
      console.error('💔 Assignment database error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Database assignment failed', 
          details: error.message,
          hint: 'Check if device_group_memberships table exists and has proper constraints'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Assignment database operation successful:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Device assigned to group successfully',
        data,
        deviceUuid: deviceId,
        groupUuid: groupId,
        device_name: deviceCheck.data.device_name,
        device_android_id: deviceCheck.data.android_id, // Include for reference
        group_name: groupCheck.data.name
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💔 Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Edge Function failed', 
        details: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
