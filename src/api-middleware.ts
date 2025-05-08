
import { handleTelemetryApi } from './api/api-interface';

// This is the main entry point for API requests without JSX dependencies
export async function handleApiRequest(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  const path = url.pathname;

  console.log(`API middleware processing: ${path} (${request.method})`);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
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
    return handleTelemetryApi(request);
  }

  // If no route matched, return undefined to let the default handler process it
  console.log("No API route matched, passing to default handler");
  return undefined;
}
