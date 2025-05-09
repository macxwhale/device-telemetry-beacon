
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  message: string;
  type: 'test' | 'device_offline' | 'low_battery' | 'security_issue' | 'new_device';
  deviceId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Supabase URL and key from env
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase URL or service role key');
    }

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the request body
    const payload: NotificationPayload = await req.json();
    
    if (!payload.message || !payload.type) {
      throw new Error('Missing required fields: message and type');
    }

    // Get notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError) {
      throw new Error(`Failed to get notification settings: ${settingsError.message}`);
    }

    if (!settings) {
      throw new Error('No notification settings found');
    }

    // Initialize results array
    const results = [];

    // Send Telegram notification if configured
    if (settings.telegram_bot_token && settings.telegram_chat_id) {
      try {
        const telegramResult = await sendTelegramNotification(
          payload.message,
          settings.telegram_bot_token,
          settings.telegram_chat_id
        );
        results.push({ channel: 'telegram', success: true, result: telegramResult });
      } catch (error) {
        console.error('Telegram notification error:', error);
        results.push({ channel: 'telegram', success: false, error: error.message });
      }
    } else {
      results.push({ 
        channel: 'telegram', 
        success: false, 
        error: 'Telegram bot token or chat ID not configured' 
      });
    }

    // Send email notification if configured (placeholder)
    if (settings.email_notifications) {
      results.push({ 
        channel: 'email', 
        success: false, 
        error: 'Email notifications not implemented yet' 
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications processed',
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

// Function to send Telegram notification
async function sendTelegramNotification(
  message: string,
  botToken: string,
  chatId: string
): Promise<any> {
  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const response = await fetch(telegramUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`);
  }
  
  return await response.json();
}
