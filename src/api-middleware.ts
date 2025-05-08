
import { handleTelemetryApi } from './api';

// This is the main entry point for API requests without JSX dependencies
export async function handleApiRequest(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle different API routes
  if (path.startsWith("/api/telemetry")) {
    return handleTelemetryApi(request);
  }

  // If no route matched, return undefined to let the default handler process it
  return undefined;
}
