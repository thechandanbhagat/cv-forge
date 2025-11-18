/**
 * Error sanitization utilities to prevent information disclosure
 */

/**
 * Sanitize error messages for user-facing output
 * Removes sensitive information like file paths, stack traces, and system details
 */
export function sanitizeErrorMessage(error: unknown, context: string = "operation"): string {
  // Log the full error internally for debugging
  if (error instanceof Error) {
    console.error(`[ERROR] ${context}:`, error.message);
    console.error(`[ERROR] Stack trace:`, error.stack);
  } else {
    console.error(`[ERROR] ${context}:`, error);
  }

  // Return a generic user-facing message
  return `An error occurred during ${context}. Please check your input and try again. If the problem persists, contact support.`;
}

/**
 * Get operation name from context for user-friendly error messages
 */
export function getOperationName(context: string): string {
  const operations: Record<string, string> = {
    'generate_cv': 'CV generation',
    'generate_cover_letter': 'cover letter generation',
    'generate_email': 'email template generation',
    'save_pdf': 'PDF creation',
    'save_file': 'file saving',
    'parse_job': 'job requirements parsing',
    'document_generation': 'document generation'
  };

  return operations[context] || context;
}

/**
 * Create a safe error response for MCP tools
 */
export function createSafeErrorResponse(error: unknown, context: string): { content: Array<{ type: "text"; text: string }> } {
  const operationName = getOperationName(context);
  const sanitizedMessage = sanitizeErrorMessage(error, operationName);

  return {
    content: [
      {
        type: "text" as const,
        text: `❌ ${sanitizedMessage}`
      }
    ]
  };
}

/**
 * Extract only safe error details if available
 * Returns generic message by default
 */
export function extractSafeErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Allow specific, safe error categories
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Invalid input provided. Please check your data and try again.';
    }
    if (message.includes('not found') || message.includes('does not exist')) {
      return 'Requested resource not found. Please verify your input.';
    }
    if (message.includes('permission') || message.includes('access denied')) {
      return 'Permission denied. Please check your access rights.';
    }
    if (message.includes('timeout')) {
      return 'Operation timed out. Please try again.';
    }
    if (message.includes('network') || message.includes('connection')) {
      return 'Network error occurred. Please check your connection and try again.';
    }
  }

  return 'An unexpected error occurred. Please try again later.';
}
