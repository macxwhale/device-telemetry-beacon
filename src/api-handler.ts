
import { handleApiRequest as originalHandleApiRequest } from './middleware.tsx';

// Re-export the function without JSX dependency
export const handleApiRequest = originalHandleApiRequest;
