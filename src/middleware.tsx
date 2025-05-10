
import { handleTelemetryApi } from './api/api-interface';

// This is the main entry point for API requests
export async function handleApiRequest(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  const path = url.pathname;

  console.log(`API request: ${request.method} ${path}`);

  // Normalize path to handle trailing slashes consistently
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
  
  // CORS headers to use consistently
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  // Handle different API routes
  if (normalizedPath.startsWith("/api/telemetry")) {
    console.log("Handling telemetry API request");
    try {
      // Log full headers for debugging
      console.log("Request headers:", Object.fromEntries(request.headers.entries()));
      
      // Clone request to log body for debugging
      const clonedRequest = request.clone();
      let bodyText = "";
      try {
        bodyText = await clonedRequest.text();
        console.log("Request body (preview):", bodyText.substring(0, 100));
      } catch (e) {
        console.log("Error reading request body:", e);
      }
      
      // Create a new request with the parsed body if possible
      let newRequest;
      if (bodyText) {
        try {
          const jsonBody = JSON.parse(bodyText);
          newRequest = new Request(request.url, {
            method: request.method,
            headers: new Headers({
              ...Object.fromEntries(request.headers.entries()),
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify(jsonBody)
          });
        } catch (e) {
          console.log("Warning: Could not parse request body as JSON:", e);
          // If parsing fails, use original body
          newRequest = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: bodyText
          });
        }
      } else {
        newRequest = request;
      }
      
      // Forward to telemetry API handler with error handling
      try {
        const response = await handleTelemetryApi(newRequest);
        
        // Check for HTML responses
        const clonedResponse = response.clone();
        const responseBody = await clonedResponse.text();
        
        if (responseBody.trim().startsWith('<!DOCTYPE') || 
            responseBody.trim().startsWith('<html') ||
            responseBody.includes('<head>') ||
            responseBody.includes('<body>')) {
          console.error("ERROR: API returned HTML - converting to JSON error");
          return new Response(JSON.stringify({ 
            error: "API returned HTML", 
            message: "Internal server error - API handler returned HTML",
            responsePreview: responseBody.substring(0, 100)
          }), {
            status: 500,
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders
            }
          });
        }
        
        // Ensure proper JSON headers
        const headers = new Headers(response.headers);
        headers.set("Content-Type", "application/json");
        Object.entries(corsHeaders).forEach(([key, value]) => {
          headers.set(key, value);
        });
        
        return new Response(responseBody, {
          status: response.status,
          headers: headers
        });
      } catch (innerError) {
        console.error("Error in telemetry API handler:", innerError);
        return new Response(JSON.stringify({ 
          error: "Telemetry API error", 
          details: (innerError as Error).message 
        }), {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    } catch (error) {
      console.error("Error in telemetry API handler:", error);
      return new Response(JSON.stringify({ 
        error: "Telemetry API error", 
        details: (error as Error).message 
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  } else if (normalizedPath === "/api/devices") {
    // Create a simple proxy for get-devices during development
    console.log("Proxying devices API request to Supabase Edge Function");
    
    const supabaseUrl = "https://byvbunvegjwzgytavgkv.supabase.co";
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/get-devices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    } catch (error) {
      console.error("Error proxying devices API:", error);
      return new Response(JSON.stringify({ 
        error: "API proxy error", 
        details: (error as Error).message 
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }

  // If no route matched, return undefined to let the default handler process it
  return undefined;
}
