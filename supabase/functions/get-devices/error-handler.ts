
import { corsHeaders } from "../_shared/telemetry.ts";

/**
 * Handles errors in the edge function and returns an appropriate response
 * @param error The error object to handle
 * @returns A Response object with error details
 */
export function handleError(error: unknown): Response {
  console.error("Error in get-devices function:", error);
  
  const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
  
  return new Response(JSON.stringify({ 
    error: "Internal server error", 
    details: errorMessage,
  }), {
    status: 500,
    headers: { 
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}

/**
 * Creates a successful response with the provided data
 * @param data The data to return in the response
 * @returns A Response object with the data
 */
export function createSuccessResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
