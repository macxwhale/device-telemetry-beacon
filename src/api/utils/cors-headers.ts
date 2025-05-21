
// Utility for consistent CORS headers across API responses

/**
 * Returns standard CORS headers for API responses
 */
export function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * Creates a CORS preflight response
 */
export function createCorsPreflightResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders()
  });
}
