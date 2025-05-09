
import { DeviceStatus } from "../types/telemetry";
import { toast } from "../hooks/use-toast";
import { handleTelemetryApiImplementation, getAllDevicesFromApiImplementation } from './telemetry-api';

// API key for simple authentication
const API_KEY = "telm_sk_1234567890abcdef";

// Handler for telemetry API requests
export async function handleTelemetryApi(request: Request): Promise<Response> {
  // Use the non-JSX implementation to handle the request
  return handleTelemetryApiImplementation(request);
}

// Helper function to get all devices (for our frontend)
export function getAllDevicesFromApi(): DeviceStatus[] {
  return getAllDevicesFromApiImplementation();
}
