
import { handleApiRequest as middlewareHandleApiRequest } from './api-middleware';

// Re-export the function without JSX dependency
export const handleApiRequest = middlewareHandleApiRequest;
