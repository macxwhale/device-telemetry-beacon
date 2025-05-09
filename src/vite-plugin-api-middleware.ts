
import type { Plugin } from 'vite';
import { handleApiRequest } from './api-handler';

export function apiMiddleware(): Plugin {
  return {
    name: 'vite-plugin-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) {
          next();
          return;
        }
        
        // Improved API request detection - check starts with /api/ regardless of query params
        const isApiRequest = req.url.split('?')[0].startsWith('/api/');
        
        if (isApiRequest) {
          console.log(`API middleware received: ${req.method} ${req.url}`);
          
          // Set CORS headers for all API responses
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.setHeader('Access-Control-Max-Age', '86400');
          
          // Handle preflight CORS requests
          if (req.method === 'OPTIONS') {
            console.log('Responding to OPTIONS request with CORS headers');
            res.statusCode = 204;
            res.end();
            return;
          }
          
          try {
            // Create a Request object from the incoming request
            const protocol = req.headers.referer?.split('://')[0] || 'http';
            const host = req.headers.host;
            const url = `${protocol}://${host}${req.url}`;
            
            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
              if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
            }
            
            // Log headers for debugging
            console.log("Request headers:", Object.fromEntries(headers.entries()));
            
            // Get request body if available
            let body: any = undefined;
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
              const chunks: Buffer[] = [];
              for await (const chunk of req) {
                chunks.push(Buffer.from(chunk));
              }
              const bodyBuffer = Buffer.concat(chunks);
              if (bodyBuffer.length > 0) {
                const bodyText = bodyBuffer.toString();
                console.log("Raw request body (first 500 chars):", bodyText.substring(0, 500));
                
                // Try to parse JSON but keep original if parsing fails
                try {
                  if (bodyText.trim()) {
                    JSON.parse(bodyText);
                    body = bodyText; // Use the validated JSON string
                  }
                } catch (e) {
                  console.log("Warning: Request body is not valid JSON:", e);
                  body = bodyText; // Use the raw text
                }
              }
            }
            
            // Create request with properly parsed body
            const request = new Request(url, {
              method: req.method,
              headers,
              body
            });
            
            // Handle the API request
            const response = await handleApiRequest(request);
            
            if (response) {
              console.log(`API response status: ${response.status}`);
              
              // Clone the response to read its content
              const clonedResponse = response.clone();
              const responseBody = await clonedResponse.text();
              
              // Check if response contains HTML and reject it - CRITICAL FIX
              if (responseBody.trim().startsWith('<!DOCTYPE') || 
                  responseBody.trim().startsWith('<html') ||
                  responseBody.includes('<head>') ||
                  responseBody.includes('<body>')) {
                console.error("ERROR: HTML response detected in vite-plugin. Converting to JSON error.");
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                const errorJson = JSON.stringify({
                  error: "API returned HTML instead of JSON",
                  message: "Internal server error - middleware detected HTML response",
                  responsePreview: responseBody.substring(0, 100)
                });
                res.end(errorJson);
                return;
              }
              
              // Set status code
              res.statusCode = response.status;
              
              // Set headers
              response.headers.forEach((value: string, key: string) => {
                res.setHeader(key, value);
              });
              
              // Always force JSON content type for API responses
              res.setHeader('Content-Type', 'application/json');
              
              // Log response for debugging
              console.log("Response content type:", res.getHeader('Content-Type'));
              console.log("Response body first 200 chars:", responseBody.substring(0, 200));
              
              // Final validation pass - try to parse as JSON
              try {
                if (responseBody.trim()) {
                  JSON.parse(responseBody);
                  console.log("Final validation: confirmed valid JSON");
                }
              } catch (e) {
                console.error("Final validation: response is not valid JSON:", e);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                const errorJson = JSON.stringify({
                  error: "Invalid JSON response",
                  message: (e as Error).message,
                  responsePreview: responseBody.substring(0, 100)
                });
                res.end(errorJson);
                return;
              }
              
              // Send response
              res.end(responseBody);
              return;
            }
          } catch (error) {
            console.error('API middleware error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              error: 'Internal Server Error', 
              details: (error as Error).message
            }));
            return;
          }
        }
        
        next();
      });
    },
  };
}
