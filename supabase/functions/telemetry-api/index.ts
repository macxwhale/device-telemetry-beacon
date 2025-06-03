
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Get Supabase credentials from environment
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://byvbunvegjwzgytavgkv.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// API key for simple authentication (same as in the original implementation)
const API_KEY = "telm_sk_1234567890abcdef";

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Function to send new device notification
async function sendNewDeviceNotification(deviceId: string, deviceName: string) {
  try {
    console.log(`Sending new device notification for: ${deviceName} (${deviceId})`);
    
    const notificationPayload = {
      message: `New device detected: ${deviceName} (ID: ${deviceId})`,
      type: 'new_device',
      deviceId: deviceId,
      deviceName: deviceName
    };
    
    const response = await supabase.functions.invoke('send-notification', {
      body: notificationPayload
    });
    
    if (response.error) {
      console.error("Error sending new device notification:", response.error);
    } else {
      console.log("New device notification sent successfully:", response.data);
    }
  } catch (error) {
    console.error("Exception while sending new device notification:", error);
    // Don't throw - we don't want notification failures to break telemetry processing
  }
}

// Main handler function
serve(async (req) => {
  console.log("Telemetry Edge Function: processing request");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Verify it's a POST request
  if (req.method !== "POST") {
    console.error("Method not allowed:", req.method);
    return new Response(JSON.stringify({ 
      error: "Method not allowed", 
      allowed: "POST",
      received: req.method 
    }), {
      status: 405,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }

  // Check authentication
  const authHeader = req.headers.get("Authorization");
  console.log("Auth header received:", authHeader);
  
  if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== API_KEY) {
    console.error("Unauthorized request. Auth header:", authHeader);
    return new Response(JSON.stringify({ 
      error: "Unauthorized",
      details: "Invalid or missing API key",
      hint: "Use Authorization: Bearer telm_sk_1234567890abcdef"
    }), {
      status: 401,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }

  try {
    // Get the request body as text
    let bodyText = await req.text();
    console.log("Raw request body in telemetry API (first 1000 chars):", bodyText.substring(0, 1000));
    
    let data;
    try {
      bodyText = bodyText.trim();
      if (bodyText.startsWith('{{') && bodyText.endsWith('}}')) {
        bodyText = bodyText.substring(1, bodyText.length - 1);
        console.log("Fixed double curly braces in JSON");
      }
      
      data = JSON.parse(bodyText);
      console.log("Parsed JSON successfully, found keys:", Object.keys(data));
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return new Response(JSON.stringify({ 
        error: "Invalid JSON format", 
        details: (parseError as Error).message,
        received_data: bodyText.substring(0, 200) + "...",
        tip: "Make sure you're sending valid JSON without duplicate curly braces"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    console.log("Received telemetry data structure:", JSON.stringify(Object.keys(data)));
    
    const deviceId = 
      data?.android_id || 
      data?.device_id || 
      (data?.device_info?.android_id) || 
      "";
    
    console.log("Extracted device ID:", deviceId);
    
    if (!deviceId) {
      console.error("Missing device identifier in payload");
      return new Response(JSON.stringify({ 
        error: "Missing device identifier",
        required: "android_id or device_info.android_id must be provided",
        received_keys: Object.keys(data),
        device_info: data.device_info ? JSON.stringify(data.device_info) : "No device_info found",
        data_sample: JSON.stringify(data).substring(0, 500)
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    // Prepare device data for database
    const timestamp = new Date().toISOString();
    
    // Check if device exists in database
    const { data: existingDevice, error: deviceCheckError } = await supabase
      .from('devices')
      .select('id')
      .eq('android_id', deviceId)
      .maybeSingle();
      
    if (deviceCheckError) {
      console.error("Error checking device in database:", deviceCheckError);
      return new Response(JSON.stringify({ 
        error: "Database error", 
        details: deviceCheckError.message
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    let deviceDbId;
    let isNewDevice = false;
    
    // Insert or update device in database
    if (!existingDevice) {
      // This is a NEW device - we'll send a notification
      isNewDevice = true;
      const deviceName = data?.device_info?.device_name || "Unknown Device";
      
      console.log(`NEW DEVICE DETECTED: ${deviceName} (${deviceId})`);
      
      const deviceData = {
        android_id: deviceId,
        device_name: deviceName,
        manufacturer: data?.device_info?.manufacturer || "Unknown",
        model: data?.device_info?.model || "Unknown Model",
        last_seen: timestamp
      };
      
      const { data: newDevice, error: insertError } = await supabase
        .from('devices')
        .insert(deviceData)
        .select('id')
        .single();
        
      if (insertError) {
        console.error("Error inserting device to database:", insertError);
        return new Response(JSON.stringify({ 
          error: "Database error", 
          details: insertError.message
        }), {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      
      deviceDbId = newDevice?.id;
      console.log("Created new device in database with ID:", deviceDbId);
      
      // Send new device notification in the background
      sendNewDeviceNotification(deviceId, deviceName);
      
    } else {
      // Update existing device
      deviceDbId = existingDevice.id;
      
      const { error: updateError } = await supabase
        .from('devices')
        .update({
          device_name: data?.device_info?.device_name || "Unknown Device",
          manufacturer: data?.device_info?.manufacturer || "Unknown",
          model: data?.device_info?.model || "Unknown Model",
          last_seen: timestamp
        })
        .eq('id', deviceDbId);
        
      if (updateError) {
        console.error("Error updating device in database:", updateError);
        return new Response(JSON.stringify({ 
          error: "Database error", 
          details: updateError.message
        }), {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      
      console.log("Updated existing device in database with ID:", deviceDbId);
    }
    
    // Store telemetry data in history
    const telemetryData = {
      device_id: deviceDbId,
      timestamp: timestamp,
      telemetry_data: data
    };
    
    const { error: telemetryError } = await supabase
      .from('telemetry_history')
      .insert(telemetryData);
      
    if (telemetryError) {
      console.error("Error storing telemetry data:", telemetryError);
      return new Response(JSON.stringify({ 
        error: "Database error", 
        details: telemetryError.message
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    if (data?.app_info?.installed_apps && Array.isArray(data.app_info.installed_apps)) {
      const apps = data.app_info.installed_apps;
      console.log(`Processing ${apps.length} apps for device ${deviceId}`);
      
      const appRows = apps.map((app: string) => ({
        device_id: deviceDbId,
        app_package: app
      }));
      
      if (appRows.length > 0) {
        const { error: appsError } = await supabase
          .from('device_apps')
          .upsert(appRows, { 
            onConflict: 'device_id,app_package', 
            ignoreDuplicates: true 
          });
          
        if (appsError) {
          console.error(`Warning: Error storing app data:`, appsError);
        } else {
          console.log(`Successfully added ${apps.length} apps for device`);
        }
      }
    }
    
    // Return success response with new device indicator
    const response = {
      success: true, 
      message: "Telemetry data received and stored in database",
      device_id: deviceId,
      timestamp: timestamp,
      received_data_size: JSON.stringify(data).length,
      received_keys: Object.keys(data),
      new_device: isNewDevice
    };
    
    console.log("Sending response:", JSON.stringify(response));
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error("Error processing telemetry data:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      details: (error as Error).message,
      stack: (error as Error).stack
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
