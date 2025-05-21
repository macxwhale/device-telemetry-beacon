
import { getCorsHeaders, createCorsPreflightResponse } from './api/utils/cors-headers';
import { createErrorResponse } from './api/utils/response-helpers';
import { handleDeviceApi } from './api/routes/device-api';
import { handleTelemetryApiRoute } from './api/routes/telemetry-api';

// Main entry point for API requests
export async function handleApiRequest(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  const path = url.pathname;

  console.log(`API middleware processing: ${path} (${request.method})`);
  console.log(`API request headers:`, Object.fromEntries(request.headers.entries()));

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return createCorsPreflightResponse();
  }

  try {
    // Normalize path to handle trailing slashes consistently
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    
    // Route based on path pattern
    
    // Device API routes (delete device, etc.)
    if (normalizedPath.startsWith("/api/device/")) {
      return await handleDeviceApi(request, normalizedPath);
    }
    
    // Telemetry API routes
    const isTelemetryAPI = normalizedPath === "/api/telemetry" || normalizedPath === "/api/telemetry/";
    if (isTelemetryAPI) {
      return await handleTelemetryApiRoute(request);
    }
    
    // If we get here, no API route was matched
    console.log("No API route matched, passing to default handler");
    return undefined;
  } catch (error) {
    console.error("Global API middleware error:", error);
    return createErrorResponse(
      500, 
      "API middleware error", 
      (error as Error).message
    );
  }
}
