
import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, createCorsResponse, handleCorsPrelight } from './_shared/cors.ts';
import { canSendNotification } from './_shared/rate-limiter.ts';
import { validateNotificationRequest, shouldSendNotificationType } from './_shared/notification-validator.ts';
import { sendTelegramNotification } from './_shared/telegram-sender.ts';
import type { NotificationRequest, NotificationResult } from './_shared/types.ts';

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight();
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
    
    // Get and validate request body
    const notificationRequest = await req.json() as NotificationRequest;
    
    const validationError = validateNotificationRequest(notificationRequest);
    if (validationError) {
      return createCorsResponse({
        success: false,
        error: validationError
      }, 400);
    }
    
    const { message, type, deviceId, deviceName } = notificationRequest;
    
    // Check rate limiting for non-test notifications
    if (type !== 'test' && deviceId) {
      if (!canSendNotification(deviceId, type)) {
        return createCorsResponse({
          success: true,
          message: `Notification rate limited for device ${deviceId}`,
          sent: false,
          reason: 'rate_limited'
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
      return createCorsResponse({
        success: false,
        error: "No notification settings found"
      }, 404);
    }
    
    // Check if notification type is enabled
    if (!shouldSendNotificationType(type, settings)) {
      return createCorsResponse({
        success: true,
        message: `Notification type '${type}' is disabled`,
        sent: false,
        reason: 'disabled'
      });
    }
    
    const results: NotificationResult[] = [];
    
    // Send Telegram notification if configured
    if (settings.telegram_bot_token && settings.telegram_chat_id) {
      const telegramResult = await sendTelegramNotification(
        message,
        type,
        deviceId,
        deviceName,
        settings.telegram_bot_token,
        settings.telegram_chat_id
      );
      results.push(telegramResult);
    }
    
    // Send email notification if configured (placeholder)
    if (settings.email_notifications) {
      results.push({
        channel: 'email',
        success: true,
        message: `Would send email to ${settings.email_notifications} (not implemented)`
      });
    }
    
    return createCorsResponse({
      success: results.some(r => r.success),
      results,
      rateLimited: type !== 'test' && deviceId ? !canSendNotification(deviceId, type) : false
    });
  } catch (error) {
    console.error('Notification error:', error);
    return createCorsResponse({
      success: false,
      error: error.message
    }, 500);
  }
});
