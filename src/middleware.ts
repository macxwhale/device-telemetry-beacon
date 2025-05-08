
import { handleTelemetryApi } from "./api";

// API route pattern to match
const API_ROUTES = {
  TELEMETRY: /^\/api\/telemetry(\/.*)?$/
};

export async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Check if the request is for an API route
  if (API_ROUTES.TELEMETRY.test(path)) {
    return handleTelemetryApi(request);
  }
  
  // Not an API request, return null to continue normal processing
  return null;
}
