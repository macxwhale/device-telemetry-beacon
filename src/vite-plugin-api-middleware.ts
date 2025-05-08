
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
        
        // Only process if it's an API request
        if (req.url.startsWith('/api/')) {
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
            
            console.log("Request headers:", JSON.stringify(Object.fromEntries(headers.entries())));
            
            // Get request body if available
            let body: any = undefined;
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
              const chunks: Buffer[] = [];
              for await (const chunk of req) {
                chunks.push(Buffer.from(chunk));
              }
              const bodyBuffer = Buffer.concat(chunks);
              body = bodyBuffer.length > 0 ? bodyBuffer.toString() : undefined;
              console.log("Request body (partial):", body ? body.substring(0, 100) + "..." : "empty");
            }
            
            const request = new Request(url, {
              method: req.method,
              headers,
              body
            });
            
            // Handle the API request
            const response = await handleApiRequest(request);
            
            if (response) {
              console.log(`API response: ${response.status}`);
              
              // Set status code
              res.statusCode = response.status;
              
              // Set headers
              response.headers.forEach((value: string, key: string) => {
                res.setHeader(key, value);
              });
              
              // Send response body
              const responseBody = await response.text();
              console.log("Response body:", responseBody.substring(0, 500) + (responseBody.length > 500 ? "..." : ""));
              res.end(responseBody);
              return;
            }
          } catch (error) {
            console.error('API middleware error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ 
              error: 'Internal Server Error', 
              details: (error as Error).message,
              stack: (error as Error).stack
            }));
            return;
          }
        }
        
        next();
      });
    },
  };
}
