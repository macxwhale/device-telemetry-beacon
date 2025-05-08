
import { handleTelemetryApi } from './api/api-interface';

// This is the main entry point for API requests without JSX dependencies
export async function handleApiRequest(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  const path = url.pathname;

  console.log(`API middleware processing: ${path} (${request.method})`);
  console.log(`Request headers:`, Object.fromEntries(request.headers.entries()));

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Handle different API routes
  if (path.startsWith("/api/telemetry")) {
    console.log("Forwarding to telemetry API handler");
    try {
      // Clone the request to inspect its body without consuming it
      const clonedRequest = request.clone();
      const bodyText = await clonedRequest.text();
      console.log("Request body (first 500 chars):", bodyText.substring(0, 500));
      
      // Create a new request with the same content for processing
      const newRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: bodyText
      });
      
      const response = await handleTelemetryApi(newRequest);
      console.log("API response status:", response.status);
      return response;
    } catch (error) {
      console.error("Error in API handler:", error);
      return new Response(JSON.stringify({ 
        error: "API handler error", 
        details: (error as Error).message 
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }

  // If no route matched, return undefined to let the default handler process it
  console.log("No API route matched, passing to default handler");
  return undefined;
}
