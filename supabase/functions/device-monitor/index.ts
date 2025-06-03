
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { checkOfflineDevices } from "./handlers/offline-checker.ts";
import { checkLowBatteryDevices } from "./handlers/battery-checker.ts";
import { checkSecurityIssues } from "./handlers/security-checker.ts";
import { createNotificationSender } from "./utils/notification-sender.ts";
import { corsHeaders } from "./utils/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://byvbunvegjwzgytavgkv.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Main handler function
serve(async (req) => {
  console.log("Device Monitor: processing request");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    console.log("Starting device monitoring checks...");
    
    // Create notification sender
    const sendNotification = await createNotificationSender(supabase);
    
    // Run all monitoring checks
    await Promise.all([
      checkOfflineDevices(supabase, sendNotification),
      checkLowBatteryDevices(supabase, sendNotification),
      checkSecurityIssues(supabase, sendNotification)
    ]);
    
    console.log("Device monitoring checks completed");
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Device monitoring completed",
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error("Error in device monitoring:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: (error as Error).message
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
