import path from "path";
import { promises as fs } from "fs";

/**
 * Sanitize a filename to prevent path traversal attacks
 * Removes directory traversal sequences and invalid characters
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    throw new Error('Invalid filename provided');
  }

  // Remove any path components - only keep the base name
  let sanitized = path.basename(fileName);

  // Remove any remaining path traversal sequences
  sanitized = sanitized.replace(/\.\./g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove invalid characters for filenames (varies by OS, but these are generally problematic)
  // Keep: alphanumeric, dash, underscore, period, space
  sanitized = sanitized.replace(/[<>:"|?*\/\\]/g, '_');

  // Ensure the filename is not empty after sanitization
  if (!sanitized || sanitized.trim() === '') {
    throw new Error('Filename is invalid after sanitization');
  }

  // Prevent files that start with a dot (hidden files) unless intentional
  if (sanitized.startsWith('.')) {
    sanitized = '_' + sanitized;
  }

  return sanitized;
}

/**
 * Validate and normalize an output directory path
 * Ensures the path is absolute and doesn't escape to unintended locations
 */
export function validateAndNormalizePath(outputPath: string, allowedBasePath?: string): string {
  if (!outputPath || typeof outputPath !== 'string') {
    throw new Error('Invalid output path provided');
  }

  // Remove null bytes
  const cleanPath = outputPath.replace(/\0/g, '');

  // Resolve to absolute path
  const resolvedPath = path.resolve(cleanPath);

  // If an allowed base path is provided, ensure the resolved path is within it
  if (allowedBasePath) {
    const normalizedAllowed = path.resolve(allowedBasePath);
    const relativePath = path.relative(normalizedAllowed, resolvedPath);

    // Check if the path tries to escape the allowed base path
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error(`Path ${outputPath} is outside allowed directory ${allowedBasePath}`);
    }
  }

  return resolvedPath;
}

/**
 * Safely join paths ensuring the result stays within the base directory
 */
export function safeJoinPath(basePath: string, ...segments: string[]): string {
  // Sanitize all segments
  const sanitizedSegments = segments.map(segment => {
    // Remove null bytes
    let clean = segment.replace(/\0/g, '');
    // Remove path traversal attempts
    clean = clean.replace(/\.\./g, '');
    return clean;
  });

  // Join the paths
  const joined = path.join(basePath, ...sanitizedSegments);

  // Resolve to absolute path
  const resolved = path.resolve(joined);
  const resolvedBase = path.resolve(basePath);

  // Ensure the result is within the base directory
  const relativePath = path.relative(resolvedBase, resolved);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Resulting path would escape base directory: ${basePath}`);
  }

  return resolved;
}

/**
 * Check if a path exists and is a directory
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path exists but is not a directory: ${dirPath}`);
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Directory doesn't exist, create it
      await fs.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}
