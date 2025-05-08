
import { handleApiRequest as originalHandleApiRequest } from './api-middleware';

// Re-export the function without JSX dependency
export const handleApiRequest = originalHandleApiRequest;
