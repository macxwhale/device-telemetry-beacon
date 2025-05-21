
// Handler for telemetry API routes

import { handleTelemetryApi } from '../api-interface';
import { createErrorResponse } from '../utils/response-helpers';
import { validateJsonResponse } from '../utils/response-helpers';

/**
 * Handles telemetry API requests
 */
export async function handleTelemetryApiRoute(
  request: Request
): Promise<Response | undefined> {
  console.log("Forwarding to telemetry API handler");
  
  // Log content-type for debugging
  const contentType = request.headers.get("content-type");
  console.log("Content-Type header:", contentType);
  
  try {
    // Clone the request to safely read its body
    let bodyText = "";
    try {
      const clonedRequest = request.clone();
      bodyText = await clonedRequest.text();
      console.log("Request body (first 500 chars):", bodyText.substring(0, 500));
    } catch (e) {
      console.log("Could not read request body:", e);
    }
    
    // Try to parse as JSON to validate and normalize
    let jsonData;
    
    try {
      if (bodyText && bodyText.trim()) {
        jsonData = JSON.parse(bodyText.trim());
        console.log("JSON parsed successfully, keys:", Object.keys(jsonData));
      } else {
        console.log("Empty request body");
        return createErrorResponse(
          400,
          "Empty request body",
          "Request body must contain valid JSON"
        );
      }
    } catch (parseError) {
      console.log("JSON parse error:", parseError);
      
      return createErrorResponse(
        400,
        "Invalid JSON format",
        (parseError as Error).message,
        { received: bodyText.substring(0, 100) + "..." }
      );
    }
    
    // Create a new request with proper headers for processing
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: new Headers({
        ...Object.fromEntries(request.headers.entries()),
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(jsonData)
    });
    
    // Send to API handler
    console.log("Calling telemetry API handler with prepared request");
    console.log("Headers being sent:", Object.fromEntries(newRequest.headers.entries()));
    
    try {
      const response = await handleTelemetryApi(newRequest);
      return await validateJsonResponse(response);
    } catch (apiError) {
      console.error("Error in API handler:", apiError);
      return createErrorResponse(
        500,
        "API handler error",
        (apiError as Error).message
      );
    }
  } catch (error) {
    console.error("Error processing telemetry request:", error);
    return createErrorResponse(
      500, 
      "API handler error", 
      (error as Error).message
    );
  }
}
