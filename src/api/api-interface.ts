
// Non-JSX interface to the telemetry API
// This file serves as a bridge between JSX and non-JSX code

// Import from the non-JSX implementation
import { handleTelemetryApiImplementation, getAllDevicesFromApiImplementation } from './telemetry-api';

// Re-export only the necessary functions without JSX dependencies
export function handleTelemetryApi(request: Request): Promise<Response> {
  return handleTelemetryApiImplementation(request);
}

export function getAllDevicesFromApi() {
  return getAllDevicesFromApiImplementation();
}
