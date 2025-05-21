
// Main entry point for telemetry API functionality

import { DeviceStatus } from "../types/telemetry";
import { handleTelemetryApiImplementation } from "./handlers/telemetry-handler";
import { getAllDevicesFromApiImplementation } from "./handlers/device-handler";
import { deleteDeviceFromApiImplementation } from "./handlers/device-deletion";

// Re-export the handler functions
export { handleTelemetryApiImplementation, getAllDevicesFromApiImplementation, deleteDeviceFromApiImplementation };
