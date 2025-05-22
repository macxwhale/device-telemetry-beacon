
import { DeviceStatus } from "../types/telemetry";
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
  console.log(`API interface: deleting device ${deviceId}`);
  try {
    return await deleteDeviceFromApiImplementation(deviceId);
  } catch (error) {
    console.error("Error in API interface:", error);
    return {
      success: false,
      message: (error as Error).message || 'Failed to delete device'
    };
  }
}
