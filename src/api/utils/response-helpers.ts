
// Utilities for creating consistent API responses

import { getCorsHeaders } from './cors-headers';

/**
 * Creates a standardized JSON error response
 */
export function createErrorResponse(
  status: number,
  error: string,
  details: string,
  additionalData: Record<string, any> = {}
): Response {
  return new Response(
    JSON.stringify({
      error,
      details,
      ...additionalData
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders()
      }
    }
  );
}

/**
 * Creates a standardized JSON success response
 */
export function createSuccessResponse(
  status: number = 200,
  data: Record<string, any>
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders()
      }
    }
  );
}

/**
 * Validates that a response body is valid JSON and not HTML
 */
export async function validateJsonResponse(response: Response): Promise<Response> {
  // Clone the response to read its content
  const clonedResponse = response.clone();
  const responseBody = await clonedResponse.text();
  
  // Check for HTML responses
  if (responseBody.trim().startsWith('<!DOCTYPE') || 
      responseBody.trim().startsWith('<html') ||
      responseBody.includes('<head>') ||
      responseBody.includes('<body>')) {
    
    return createErrorResponse(
      500,
      "API returned HTML",
      "Internal server error - API handler returned HTML",
      { responsePreview: responseBody.substring(0, 100) }
    );
  }
  
  // Ensure proper JSON headers
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "application/json");
  
  // Add CORS headers
  const corsHeaders = getCorsHeaders();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  // Handle empty responses
  if (responseBody.trim() === '') {
    return new Response("{}", {
      status: 200,
      headers
    });
  }
  
  // Verify response is valid JSON
  try {
    JSON.parse(responseBody);
    return new Response(responseBody, {
      status: response.status,
      headers
    });
  } catch (error) {
    return createErrorResponse(
      500,
      "API returned invalid JSON",
      (error as Error).message,
      { responsePreview: responseBody.substring(0, 200) + "..." }
    );
  }
}
