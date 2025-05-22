
// Handler for device-related API routes

import { deleteDeviceFromApiImplementation } from '../telemetry-api';
import { createErrorResponse, createSuccessResponse } from '../utils/response-helpers';

/**
 * Handles device API requests
 */
export async function handleDeviceApi(
  request: Request, 
  normalizedPath: string
): Promise<Response | undefined> {
  console.log("Processing device API request:", request.method, normalizedPath);
  
  if (request.method === "DELETE") {
    const deviceId = normalizedPath.split("/api/device/")[1];
    
    if (!deviceId) {
      return createErrorResponse(
        400,
        "Missing device ID",
        "Device ID is required for deletion"
      );
    }
    
    try {
      const result = await deleteDeviceFromApiImplementation(deviceId);
      return createSuccessResponse(
        result.success ? 200 : 400,
        result
      );
    } catch (error) {
      console.error("Error in device API:", error);
      return createErrorResponse(
        500,
        "Server error",
        (error as Error).message
      );
    }
  }
  
  // Return undefined for any other method to let other handlers process it
  return undefined;
}
