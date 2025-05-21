
// JSON utilities for API handlers

/**
 * Helper function to safely access nested properties in JSON
 */
export function safelyGetNestedProperty(obj: any, path: string[], defaultValue: any = null): any {
  if (!obj) return defaultValue;
  
  try {
    // If obj is a string (which Json type can be), try to parse it
    const parsedObj = typeof obj === 'string' ? JSON.parse(obj) : obj;
    
    return path.reduce((prev: any, curr: string) => {
      return prev && typeof prev === 'object' ? prev[curr] : defaultValue;
    }, parsedObj);
  } catch (e) {
    console.error(`Error accessing path ${path.join('.')} in JSON:`, e);
    return defaultValue;
  }
}

/**
 * Parses and validates JSON from request body
 */
export async function parseJsonBody(request: Request): Promise<{success: boolean; data?: any; error?: string; rawBody?: string}> {
  try {
    // Get the request body as text
    let bodyText = await request.text();
    
    if (!bodyText || !bodyText.trim()) {
      return {
        success: false,
        error: "Empty request body",
        rawBody: bodyText
      };
    }
    
    // Remove any extra curly braces that might be causing JSON parse errors
    bodyText = bodyText.trim();
    if (bodyText.startsWith('{{') && bodyText.endsWith('}}')) {
      bodyText = bodyText.substring(1, bodyText.length - 1);
    }
    
    // Parse JSON
    const data = JSON.parse(bodyText);
    return {
      success: true,
      data,
      rawBody: bodyText
    };
    
  } catch (parseError) {
    return {
      success: false,
      error: (parseError as Error).message,
      rawBody: await request.clone().text()
    };
  }
}
