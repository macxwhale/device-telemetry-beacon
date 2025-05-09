
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
  botToken: string;
  chatId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const payload = await req.json() as NotificationPayload;
    
    if (!payload.message || !payload.type || !payload.botToken || !payload.chatId) {
      throw new Error('Missing required fields: message, type, botToken, and chatId');
    }

    console.log(`Processing notification of type: ${payload.type}`);

    // Initialize results array
    const results = [];

    // Format message based on notification type
    let formattedMessage = payload.message;
    
    // Add timestamp to all messages
    const timestamp = new Date().toLocaleString();
    formattedMessage += `\n\nTime: ${timestamp}`;

    // Send Telegram notification
    try {
      const telegramResult = await sendTelegramNotification(
        formattedMessage,
        payload.botToken,
        payload.chatId
      );
      results.push({ channel: 'telegram', success: true, result: telegramResult });
      console.log('Telegram notification sent successfully');
    } catch (error) {
      console.error('Telegram notification error:', error);
      results.push({ channel: 'telegram', success: false, error: error.message });
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
