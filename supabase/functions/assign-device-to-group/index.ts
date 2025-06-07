
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function to format string to UUID if it looks like one
function formatToUUID(str: string): string {
  // Remove any existing hyphens first
  const cleanStr = str.replace(/-/g, '');
  
  // Check if it's the right length for a UUID (32 hex characters)
  if (cleanStr.length === 32 && /^[0-9a-f]+$/i.test(cleanStr)) {
    return `${cleanStr.slice(0,8)}-${cleanStr.slice(8,12)}-${cleanStr.slice(12,16)}-${cleanStr.slice(16,20)}-${cleanStr.slice(20)}`;
  }
  
  // If it's already a valid UUID, return as is
  if (isValidUUID(str)) {
    return str;
  }
  
  // Otherwise, return the original string (will fail validation)
  return str;
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

    // Validate input
    if (!deviceId || !groupId) {
      console.log('💔 Missing required IDs')
      return new Response(
        JSON.stringify({ error: 'Missing deviceId or groupId! 💔' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Format and validate UUIDs
    const formattedDeviceId = formatToUUID(deviceId);
    const formattedGroupId = formatToUUID(groupId);

    console.log('✨ Formatted UUIDs:', { 
      original: { deviceId, groupId },
      formatted: { deviceId: formattedDeviceId, groupId: formattedGroupId }
    });

    if (!isValidUUID(formattedDeviceId)) {
      console.log('💔 Invalid device ID format:', formattedDeviceId)
      return new Response(
        JSON.stringify({ 
          error: 'Device ID must be a valid UUID format! 🌈',
          example: '123e4567-e89b-12d3-a456-426614174000'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!isValidUUID(formattedGroupId)) {
      console.log('💔 Invalid group ID format:', formattedGroupId)
      return new Response(
        JSON.stringify({ 
          error: 'Group ID must be a valid UUID format! 🌈',
          example: '123e4567-e89b-12d3-a456-426614174000'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, verify that both device and group exist
    console.log('🔍 Verifying device and group exist...')
    
    const [deviceCheck, groupCheck] = await Promise.all([
      supabase.from('devices').select('id').eq('id', formattedDeviceId).maybeSingle(),
      supabase.from('device_groups').select('id').eq('id', formattedGroupId).maybeSingle()
    ]);

    if (deviceCheck.error) {
      console.error('💔 Error checking device:', deviceCheck.error)
      return new Response(
        JSON.stringify({ error: 'Failed to verify device exists' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!deviceCheck.data) {
      console.log('💔 Device not found:', formattedDeviceId)
      return new Response(
        JSON.stringify({ error: 'Device not found! 🔍' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (groupCheck.error) {
      console.error('💔 Error checking group:', groupCheck.error)
      return new Response(
        JSON.stringify({ error: 'Failed to verify group exists' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!groupCheck.data) {
      console.log('💔 Group not found:', formattedGroupId)
      return new Response(
        JSON.stringify({ error: 'Group not found! 🔍' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🌸 Checking if assignment already exists...')
    
    // Check if assignment already exists using formatted UUIDs
    const { data: existing, error: checkError } = await supabase
      .from('device_group_memberships')
      .select('id')
      .eq('device_id', formattedDeviceId)
      .eq('group_id', formattedGroupId)
      .maybeSingle()

    if (checkError) {
      console.error('💔 Error checking existing assignment:', checkError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing assignment' }),
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
          message: 'Device already assigned to group! 💛',
          alreadyExists: true 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🚀 Creating new assignment in database...')
    
    // Create new assignment using formatted UUIDs
    const { data, error } = await supabase
      .from('device_group_memberships')
      .insert({ 
        device_id: formattedDeviceId, 
        group_id: formattedGroupId 
      })
      .select()
      .single()

    if (error) {
      console.error('💔 Assignment database error:', error)
      return new Response(
        JSON.stringify({ error: 'DB assignment failed! 🫂', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Assignment database operation successful:', data)
    console.log('📦 DB Result:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Device assigned to group successfully! 🎉',
        data 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💔 Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Edge Function failed!', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
