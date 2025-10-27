/**
 * Extracts error message from API error responses
 */
export function parseErrorMessage(error: any, defaultMsg: string): string {
  try {
    // The error message from apiRequest contains the response text
    // Format is usually "401: {\"error\":\"Invalid credentials\"}"
    const errorMatch = error.message?.match(/\{[^}]+\}/);
    if (errorMatch) {
      const errorData = JSON.parse(errorMatch[0]);
      return errorData.error || defaultMsg;
    }
  } catch (e) {
    // If parsing fails, use default message
  }
  
  // Check for rate limiting (429 status)
  if (error.message?.includes('429') || error.message?.includes('Too many')) {
    return "Too many attempts. Please wait and try again.";
  }
  
  return error.message || defaultMsg;
}

