
import { handleTelemetryApi } from './api/api-interface';

// This is the main entry point for API requests without JSX dependencies
export async function handleApiRequest(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  const path = url.pathname;

  console.log(`API middleware processing: ${path} (${request.method})`);

  // CORS headers to use consistently
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Handle different API routes
    if (path.startsWith("/api/telemetry")) {
      console.log("Forwarding to telemetry API handler");
      
      // Clone the request to inspect its body without consuming it
      const clonedRequest = request.clone();
      let bodyText = "";
      
      try {
        bodyText = await clonedRequest.text();
        console.log("Request body (first 500 chars):", bodyText.substring(0, 500));
      } catch (e) {
        console.log("Could not read request body:", e);
      }
      
      // Fix malformed JSON if needed
      let jsonData;
      
      try {
        if (bodyText && bodyText.trim()) {
          jsonData = JSON.parse(bodyText.trim());
          console.log("JSON parsed successfully, keys:", Object.keys(jsonData));
        } else {
          console.log("Empty request body");
          return new Response(JSON.stringify({
            error: "Empty request body",
            message: "Request body must contain valid JSON"
          }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          });
        }
      } catch (parseError) {
        console.log("JSON parse error:", parseError);
        
        // Return error about invalid JSON
        return new Response(JSON.stringify({
          error: "Invalid JSON format",
          details: (parseError as Error).message,
          received: bodyText.substring(0, 100) + "..."
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      
      // Create a new request with proper headers for processing
      const newRequest = new Request(request.url, {
        method: request.method,
        headers: new Headers({
          ...Object.fromEntries(request.headers.entries()),
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(jsonData)
      });
      
      try {
        // Send to API handler
        console.log("Calling telemetry API handler with prepared request");
        const response = await handleTelemetryApi(newRequest);
        
        // Clone response to check content
        const clonedResponse = response.clone();
        const responseBody = await clonedResponse.text();
        console.log("Raw API response (first 200 chars):", responseBody.substring(0, 200));
        
        // Check for HTML responses
        if (responseBody.trim().startsWith('<!DOCTYPE') || responseBody.trim().startsWith('<html')) {
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
        
        // Ensure the response has proper content type
        const headers = new Headers(response.headers);
        headers.set('Content-Type', 'application/json');
        
        // Add CORS headers
        Object.entries(corsHeaders).forEach(([key, value]) => {
          headers.set(key, value);
        });
        
        try {
          // Verify response is valid JSON
          JSON.parse(responseBody);
          console.log("Response validated as valid JSON");
          
          // Return validated response with headers
          return new Response(responseBody, {
            status: response.status,
            headers: headers
          });
        } catch (jsonError) {
          console.error("API returned invalid JSON:", jsonError);
          
          // Return valid JSON error response
          return new Response(JSON.stringify({
            error: "API returned invalid JSON",
            details: (jsonError as Error).message,
            responsePreview: responseBody.substring(0, 200) + "..."
          }), {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          });
        }
      } catch (apiError) {
        console.error("Error in API handler:", apiError);
        return new Response(JSON.stringify({ 
          error: "API handler error", 
          details: (apiError as Error).message
        }), {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    }
  } catch (error) {
    console.error("Global API middleware error:", error);
    return new Response(JSON.stringify({ 
      error: "API middleware error", 
      details: (error as Error).message
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }

  // If no route matched, return undefined to let the default handler process it
  console.log("No API route matched, passing to default handler");
  return undefined;
}
