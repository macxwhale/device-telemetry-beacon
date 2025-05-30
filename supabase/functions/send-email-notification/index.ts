
import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailNotificationRequest {
  deviceId: string;
  deviceName: string;
  message: string;
  type: 'device_offline' | 'low_battery' | 'security_issue' | 'new_device';
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
    
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { 
        auth: {
          persistSession: false
        } 
      }
    );
    
    const { deviceId, deviceName, message, type } = await req.json() as EmailNotificationRequest;
    
    // Get notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .limit(1)
      .single();
      
    if (settingsError || !settings?.email_notifications) {
      return new Response(JSON.stringify({
        success: false,
        message: "Email notifications not configured"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Format email content
    let subject = "Device Alert";
    let emoji = "📱";
    
    switch (type) {
      case 'device_offline': 
        subject = "Device Offline Alert";
        emoji = "🔌"; 
        break;
      case 'low_battery': 
        subject = "Low Battery Alert";
        emoji = "🪫"; 
        break;
      case 'security_issue': 
        subject = "Security Issue Alert";
        emoji = "⚠️"; 
        break;
      case 'new_device': 
        subject = "New Device Detected";
        emoji = "🆕"; 
        break;
    }
    
    const emailContent = `
      <h2>${emoji} ${subject}</h2>
      <p><strong>Device:</strong> ${deviceName} (${deviceId})</p>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <hr>
      <p style="color: #666; font-size: 12px;">
        This alert was sent by your Device Telemetry system.
      </p>
    `;
    
    // TODO: Implement actual email sending here
    // For now, we'll just log the email that would be sent
    console.log(`Email would be sent to: ${settings.email_notifications}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${emailContent}`);
    
    // Simulate email sending success
    return new Response(JSON.stringify({
      success: true,
      message: "Email notification logged (implementation pending)",
      recipient: settings.email_notifications,
      subject: subject
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Email notification error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
