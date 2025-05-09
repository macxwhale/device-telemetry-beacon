
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
      return await handleTelemetryApi(request);
    } catch (error) {
      console.error("Error in telemetry API handler:", error);
      return new Response(JSON.stringify({ 
        error: "Telemetry API error", 
        details: (error as Error).message 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // If no route matched, return undefined to let the default handler process it
  return undefined;
}
