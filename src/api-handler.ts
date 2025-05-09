
import { handleApiRequest as middlewareHandleApiRequest } from './api-middleware';

// Re-export the function with debugging
export const handleApiRequest = async (request: Request): Promise<Response | undefined> => {
  console.log("API handler called with URL:", request.url);
  const response = await middlewareHandleApiRequest(request);
  
  // Debug the response before returning it
  if (response) {
    console.log("API handler returning response with status:", response.status);
    console.log("API handler response content-type:", response.headers.get("Content-Type"));
    
    // Clone and check response content
    const clonedResponse = response.clone();
    try {
      const text = await clonedResponse.text();
      console.log("API response content (first 200 chars):", text.substring(0, 200));
      
      // Check if it's HTML
      if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
        console.error("WARNING: Response contains HTML, not JSON!");
      }
    } catch (e) {
      console.error("Error reading response body:", e);
    }
  } else {
    console.log("API handler returning undefined (no matching route)");
  }
  
  return response;
};
