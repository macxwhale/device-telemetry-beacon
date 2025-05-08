
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { handleApiRequest } from "./src/middleware";

// Custom middleware for API requests
function apiMiddleware() {
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
          try {
            // Create a Request object from the incoming request
            const protocol = req.headers.referer?.split('://')[0] || 'http';
            const host = req.headers.host;
            const url = `${protocol}://${host}${req.url}`;
            
            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
              if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
            }
            
            // Get request body if available
            let body: any = undefined;
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
              const chunks: Buffer[] = [];
              for await (const chunk of req) {
                chunks.push(Buffer.from(chunk));
              }
              const bodyBuffer = Buffer.concat(chunks);
              body = bodyBuffer.length > 0 ? bodyBuffer.toString() : undefined;
            }
            
            const request = new Request(url, {
              method: req.method,
              headers,
              body
            });
            
            // Handle the API request
            const response = await handleApiRequest(request);
            
            if (response) {
              // Set status code
              res.statusCode = response.status;
              
              // Set headers
              response.headers.forEach((value, key) => {
                res.setHeader(key, value);
              });
              
              // Send response body
              const responseBody = await response.text();
              res.end(responseBody);
              return;
            }
          } catch (error) {
            console.error('API middleware error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
          }
        }
        
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiMiddleware()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080
  }
});
