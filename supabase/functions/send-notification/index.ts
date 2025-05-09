
import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  message: string;
  type: 'device_offline' | 'low_battery' | 'security_issue' | 'new_device' | 'test';
  deviceId?: string;
  deviceName?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Required environment variables are not set.');
    }
    
    // Create Supabase client with admin privileges
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { 
        auth: {
          persistSession: false
        } 
      }
    );
    
    // Get request body
    const { message, type, deviceId, deviceName } = await req.json() as NotificationRequest;
    
    if (!message || !type) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required parameters: message and type"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .limit(1)
      .single();
      
    if (settingsError) {
      console.error('Error fetching notification settings:', settingsError);
      throw settingsError;
    }
    
    if (!settings) {
      return new Response(JSON.stringify({
        success: false,
        error: "No notification settings found"
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Check if notification type is enabled
    let shouldSend = false;
    
    switch (type) {
      case 'device_offline':
        shouldSend = settings.notify_device_offline;
        break;
      case 'low_battery':
        shouldSend = settings.notify_low_battery;
        break;
      case 'security_issue':
        shouldSend = settings.notify_security_issues;
        break;
      case 'new_device':
        shouldSend = settings.notify_new_device;
        break;
      case 'test':
        // Always send test notifications
        shouldSend = true;
        break;
    }
    
    if (!shouldSend) {
      return new Response(JSON.stringify({
        success: true,
        message: `Notification type '${type}' is disabled`,
        sent: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const results = [];
    
    // Send Telegram notification if configured
    if (settings.telegram_bot_token && settings.telegram_chat_id) {
      try {
        // Format notification message
        let formattedMessage = message;
        
        if (deviceId && deviceName) {
          formattedMessage = `[${deviceName} (${deviceId})]: ${message}`;
        }
        
        // Add notification type emoji
        let emoji = '📱';
        switch (type) {
          case 'device_offline': emoji = '🔌'; break;
          case 'low_battery': emoji = '🪫'; break;
          case 'security_issue': emoji = '⚠️'; break;
          case 'new_device': emoji = '🆕'; break;
          case 'test': emoji = '🧪'; break;
        }
        
        formattedMessage = `${emoji} ${formattedMessage}`;
        
        // Use Telegram Bot API to send message
        const telegramUrl = `https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage`;
        const telegramResponse = await fetch(telegramUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: settings.telegram_chat_id,
            text: formattedMessage,
            parse_mode: 'HTML'
          })
        });
        
        const telegramData = await telegramResponse.json();
        
        results.push({
          channel: 'telegram',
          success: telegramData.ok === true,
          response: telegramData
        });
      } catch (telegramError) {
        console.error('Error sending Telegram notification:', telegramError);
        results.push({
          channel: 'telegram',
          success: false,
          error: telegramError.message
        });
      }
    }
    
    // Send email notification if configured (would be implemented in a real system)
    if (settings.email_notifications) {
      // This is a placeholder - in a real application, you'd implement email sending here
      results.push({
        channel: 'email',
        success: true,
        message: `Would send email to ${settings.email_notifications} (not implemented)`
      });
    }
    
    return new Response(JSON.stringify({
      success: results.some(r => r.success),
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Notification error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
