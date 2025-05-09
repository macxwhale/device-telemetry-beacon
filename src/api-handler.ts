
import { handleApiRequest as middlewareHandleApiRequest } from './api-middleware';

// Re-export the function with debugging
export const handleApiRequest = async (request: Request): Promise<Response | undefined> => {
  console.log("API handler called with URL:", request.url);
  console.log("API handler request method:", request.method);
  console.log("API handler content-type:", request.headers.get("Content-Type"));
  console.log("API handler authorization:", request.headers.get("Authorization")?.substring(0, 15) + "...");
  
  try {
    const response = await middlewareHandleApiRequest(request);
    
    // Debug the response before returning it
    if (response) {
      console.log("API handler returning response with status:", response.status);
      console.log("API handler response content-type:", response.headers.get("Content-Type"));
      
      // Clone and check response content
      const clonedResponse = response.clone();
      
      try {
        const text = await clonedResponse.text();
        console.log("API response content (first 200 chars):", text.substring(0, 200));
        
        // Check if it's HTML and convert to proper JSON error
        if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
          console.error("WARNING: Response contains HTML, not JSON! Converting to proper error response");
          
          // Return a proper JSON error instead of HTML
          return new Response(JSON.stringify({
            error: "API returned HTML instead of JSON",
            message: "Internal server error - handler detected HTML response"
          }), {
            status: 500,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
          });
        }
        
        // Validate that it's JSON
        if (response.headers.get("Content-Type")?.includes("application/json")) {
          try {
            JSON.parse(text);
          } catch (jsonError) {
            console.error("Invalid JSON response:", jsonError);
            return new Response(JSON.stringify({ 
              error: "API returned invalid JSON",
              details: (jsonError as Error).message
            }), {
              status: 500,
              headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              }
            });
          }
        }
        
        // Recreate response with verified content
        return new Response(text, {
          status: response.status,
          headers: response.headers
        });
      } catch (e) {
        console.error("Error reading response body:", e);
        return new Response(JSON.stringify({ 
          error: "Error reading API response", 
          details: (e as Error).message 
        }), {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    } else {
      console.log("API handler returning undefined (no matching route)");
    }
    
    return response;
  } catch (outerError) {
    console.error("Unhandled error in API handler:", outerError);
    return new Response(JSON.stringify({ 
      error: "Unhandled API handler error", 
      details: (outerError as Error).message 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
