
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

// In-memory cache for notification tracking (in production, use Redis or database)
const notificationCache = new Map<string, number>();
const NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutes

// Rate limiting per chat/bot combination
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // Max 20 messages per minute per chat

function canSendNotification(deviceId: string, type: string): boolean {
  const key = `${deviceId}_${type}`;
  const lastSent = notificationCache.get(key) || 0;
  const now = Date.now();
  
  if (now - lastSent < NOTIFICATION_COOLDOWN) {
    console.log(`Rate limit: Skipping ${type} for device ${deviceId} (last sent ${Math.round((now - lastSent) / 60000)} min ago)`);
    return false;
  }
  
  return true;
}

function checkTelegramRateLimit(chatId: string): boolean {
  const now = Date.now();
  const key = `telegram_${chatId}`;
  const limit = rateLimitCache.get(key);
  
  if (!limit || now > limit.resetTime) {
    // Reset or initialize rate limit
    rateLimitCache.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT_MAX) {
    console.log(`Telegram rate limit exceeded for chat ${chatId}`);
    return false;
  }
  
  limit.count++;
  return true;
}

function markNotificationSent(deviceId: string, type: string): void {
  const key = `${deviceId}_${type}`;
  notificationCache.set(key, Date.now());
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
    
    // Check rate limiting for non-test notifications
    if (type !== 'test' && deviceId) {
      if (!canSendNotification(deviceId, type)) {
        return new Response(JSON.stringify({
          success: true,
          message: `Notification rate limited for device ${deviceId}`,
          sent: false,
          reason: 'rate_limited'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
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
        sent: false,
        reason: 'disabled'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const results = [];
    
    // Send Telegram notification if configured
    if (settings.telegram_bot_token && settings.telegram_chat_id) {
      try {
        // Check Telegram rate limit
        if (!checkTelegramRateLimit(settings.telegram_chat_id)) {
          results.push({
            channel: 'telegram',
            success: false,
            error: 'Rate limit exceeded - too many messages sent recently'
          });
        } else {
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
          
          if (telegramData.ok) {
            // Mark notification as sent for rate limiting
            if (type !== 'test' && deviceId) {
              markNotificationSent(deviceId, type);
            }
            
            console.log(`Telegram notification sent successfully: ${formattedMessage}`);
          }
          
          results.push({
            channel: 'telegram',
            success: telegramData.ok === true,
            response: telegramData
          });
        }
      } catch (telegramError) {
        console.error('Error sending Telegram notification:', telegramError);
        results.push({
          channel: 'telegram',
          success: false,
          error: telegramError.message
        });
      }
    }
    
    // Send email notification if configured (placeholder)
    if (settings.email_notifications) {
      results.push({
        channel: 'email',
        success: true,
        message: `Would send email to ${settings.email_notifications} (not implemented)`
      });
    }
    
    return new Response(JSON.stringify({
      success: results.some(r => r.success),
      results,
      rateLimited: type !== 'test' && deviceId ? !canSendNotification(deviceId, type) : false
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
