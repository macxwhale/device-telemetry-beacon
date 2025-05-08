
// Non-JSX interface to the telemetry API
// This file serves as a bridge between JSX and non-JSX code

// Re-export only the necessary functions without JSX dependencies
export function handleTelemetryApi(request: Request): Promise<Response> {
  // Import dynamically to avoid JSX dependency at parse time
  return import('./index').then(api => api.handleTelemetryApi(request));
}
