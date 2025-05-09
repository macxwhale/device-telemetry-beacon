
import { handleTelemetryApi } from './api/api-interface';

// This is the main entry point for API requests
export async function handleApiRequest(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  const path = url.pathname;

  console.log(`API request: ${request.method} ${path}`);

  // Handle different API routes
  if (path.startsWith("/api/telemetry")) {
    console.log("Handling telemetry API request");
    try {
      // Clone request to log body for debugging
      const clonedRequest = request.clone();
      let bodyText = "";
      try {
        bodyText = await clonedRequest.text();
        console.log("Request body (preview):", bodyText.substring(0, 100));
      } catch (e) {
        // Continue if we can't read the body
      }
      
      // Forward to telemetry API handler
      return await handleTelemetryApi(request);
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
