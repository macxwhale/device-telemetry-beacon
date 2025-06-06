
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Create supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🌸 Checking if assignment already exists...')
    
    // Check if assignment already exists
    const { data: existing, error: checkError } = await supabase
      .from('device_group_memberships')
      .select('id')
      .eq('device_id', deviceId)
      .eq('group_id', groupId)
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
    
    // Create new assignment
    const { data, error } = await supabase
      .from('device_group_memberships')
      .insert({ 
        device_id: deviceId, 
        group_id: groupId 
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
