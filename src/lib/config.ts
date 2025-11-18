import { z } from "zod";

/**
 * Configuration schema with validation for all environment variables
 */
const ConfigSchema = z.object({
  // Path configuration
  DEFAULT_OUTPUT_PATH: z.string().optional(),
  TEMP_DIR: z.string().optional(),

  // PDF generation configuration
  PDF_TIMEOUT: z.string()
    .regex(/^\d+$/, "PDF_TIMEOUT must be a number in milliseconds")
    .optional()
    .transform(val => val ? parseInt(val, 10) : 60000), // 60 seconds default

  PDF_PAGE_SIZE: z.enum(['A4', 'A3', 'A5', 'Letter', 'Legal', 'Tabloid'])
    .optional()
    .default('A4'),

  PDF_MARGIN_TOP: z.string()
    .regex(/^\d+(\.\d+)?(mm|cm|in|px|pt)$/, "Invalid margin format")
    .optional()
    .default('10mm'),

  PDF_MARGIN_RIGHT: z.string()
    .regex(/^\d+(\.\d+)?(mm|cm|in|px|pt)$/, "Invalid margin format")
    .optional()
    .default('10mm'),

  PDF_MARGIN_BOTTOM: z.string()
    .regex(/^\d+(\.\d+)?(mm|cm|in|px|pt)$/, "Invalid margin format")
    .optional()
    .default('10mm'),

  PDF_MARGIN_LEFT: z.string()
    .regex(/^\d+(\.\d+)?(mm|cm|in|px|pt)$/, "Invalid margin format")
    .optional()
    .default('10mm'),

  // Font and styling configuration
  PDF_BASE_FONT_SIZE: z.string()
    .regex(/^\d+px$/, "Font size must be in pixels (e.g., 12px)")
    .optional()
    .default('12px'),

  PDF_LINE_HEIGHT: z.string()
    .regex(/^\d+(\.\d+)?$/, "Line height must be a number")
    .optional()
    .default('1.4'),

  PDF_H1_FONT_SIZE: z.string()
    .regex(/^\d+px$/, "Font size must be in pixels")
    .optional()
    .default('20px'),

  PDF_H2_FONT_SIZE: z.string()
    .regex(/^\d+px$/, "Font size must be in pixels")
    .optional()
    .default('15px'),

  PDF_H3_FONT_SIZE: z.string()
    .regex(/^\d+px$/, "Font size must be in pixels")
    .optional()
    .default('13px'),

  PDF_PARAGRAPH_SPACING: z.string()
    .regex(/^\d+px$/, "Spacing must be in pixels")
    .optional()
    .default('8px'),

  PDF_SECTION_SPACING: z.string()
    .regex(/^\d+px$/, "Spacing must be in pixels")
    .optional()
    .default('12px'),

  // Security configuration
  DISABLE_SANDBOX: z.enum(['true', 'false'])
    .optional()
    .default('false')
    .transform(val => val === 'true'),

  // Debug configuration
  DEBUG: z.enum(['true', 'false'])
    .optional()
    .default('false')
    .transform(val => val === 'true')
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Validate and parse environment variables
 * Provides type-safe access to configuration with defaults
 */
function validateConfig(): Config {
  try {
    const config = ConfigSchema.parse(process.env);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[CONFIG ERROR] Invalid environment variable configuration:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('Using default values for invalid configurations.');

      // Parse with defaults only, ignoring invalid values
      return ConfigSchema.parse({});
    }
    throw error;
  }
}

/**
 * Application configuration
 * Validated on module load
 */
export const config = validateConfig();

/**
 * Check if debug logging is enabled
 */
export function isDebugEnabled(): boolean {
  return config.DEBUG;
}

/**
 * Log debug message only if debug is enabled
 */
export function debugLog(message: string, ...args: any[]): void {
  if (config.DEBUG) {
    console.error(`[DEBUG] ${message}`, ...args);
  }
}
