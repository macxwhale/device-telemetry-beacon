
import { handleTelemetryApi } from './api/api-interface';

// This is the main entry point for API requests
export async function handleApiRequest(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  const path = url.pathname;

  console.log(`API request: ${request.method} ${path}`);

  // Normalize path to handle trailing slashes consistently
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;

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
      
      // Forward to telemetry API handler
      return await handleTelemetryApi(newRequest);
    } catch (error) {
      console.error("Error in telemetry API handler:", error);
      return new Response(JSON.stringify({ 
        error: "Telemetry API error", 
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
  return undefined;
}
