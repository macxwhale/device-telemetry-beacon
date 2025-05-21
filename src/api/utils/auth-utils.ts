
// Authentication utilities for API handlers

/**
 * API key for simple authentication
 */
export const API_KEY = "telm_sk_1234567890abcdef";

/**
 * Validates API key from Authorization header
 */
export function validateApiKey(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== API_KEY) {
    return false;
  }
  return true;
}

/**
 * Creates an unauthorized response object
 */
export function createUnauthorizedResponse(): Response {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };

  return new Response(JSON.stringify({ 
    error: "Unauthorized",
    details: "Invalid or missing API key",
    hint: "Use Authorization: Bearer telm_sk_1234567890abcdef"
  }), {
    status: 401,
    headers: { 
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
