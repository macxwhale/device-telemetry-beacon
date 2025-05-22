
import { DeviceStatus } from "../types/telemetry";

// Non-JSX interface to the telemetry API
import { 
  handleTelemetryApiImplementation, 
  getAllDevicesFromApiImplementation,
  deleteDeviceFromApiImplementation
} from './telemetry-api';

export function handleTelemetryApi(request: Request): Promise<Response> {
  console.log("API interface: forwarding telemetry request to implementation");
  return handleTelemetryApiImplementation(request);
}

export async function getAllDevicesFromApi(): Promise<DeviceStatus[]> {
  return getAllDevicesFromApiImplementation();
}

export async function deleteDeviceFromApi(deviceId: string): Promise<{success: boolean; message: string}> {
  console.log("API interface: forwarding device deletion request for ID:", deviceId);
  try {
    return await deleteDeviceFromApiImplementation(deviceId);
  } catch (error) {
    console.error("Error in deleteDeviceFromApi:", error);
    return {
      success: false,
      message: (error as Error).message || 'Failed to delete device'
    };
  }
}
