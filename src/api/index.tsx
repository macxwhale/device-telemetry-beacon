
import { DeviceStatus } from "../types/telemetry";
import { toast } from "../hooks/use-toast";
import { 
  handleTelemetryApiImplementation, 
  getAllDevicesFromApiImplementation, 
  deleteDeviceFromApiImplementation 
} from './telemetry-api';

// Handler for telemetry API requests
export async function handleTelemetryApi(request: Request): Promise<Response> {
  return handleTelemetryApiImplementation(request);
}

// Helper function to get all devices (for our frontend)
export async function getAllDevicesFromApi(): Promise<DeviceStatus[]> {
  try {
    return await getAllDevicesFromApiImplementation();
  } catch (error) {
    console.error("Error getting devices:", error);
    toast({
      title: "Error",
      description: "Failed to fetch device data from the database",
      variant: "destructive"
    });
    return [];
  }
}

// Helper function to delete a device and its related data
export async function deleteDeviceFromApi(deviceId: string): Promise<{success: boolean; message: string}> {
  try {
    console.log(`API index: Deleting device ${deviceId}`);
    return await deleteDeviceFromApiImplementation(deviceId);
  } catch (error) {
    console.error("Error deleting device:", error);
    return { success: false, message: (error as Error).message || 'Failed to delete device' };
  }
}
