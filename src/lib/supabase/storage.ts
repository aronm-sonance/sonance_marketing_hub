/**
 * Supabase Storage Helper
 * Utilities for working with the marketing-assets storage bucket
 */

/**
 * Get public URL for a storage path
 * Note: For private buckets, use getSignedUrl instead
 */
export function getPublicUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/marketing-assets/${storagePath}`;
}

/**
 * Create a signed URL for private storage access
 * @param supabase - Supabase client instance
 * @param storagePath - Path within the marketing-assets bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 */
export async function getSignedUrl(
  supabase: any,
  storagePath: string,
  expiresIn = 3600
) {
  const { data, error } = await supabase.storage
    .from('marketing-assets')
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    throw error;
  }

  return data?.signedUrl;
}

/**
 * Get multiple signed URLs in batch
 */
export async function getSignedUrls(
  supabase: any,
  storagePaths: string[],
  expiresIn = 3600
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  await Promise.all(
    storagePaths.map(async (path) => {
      try {
        const url = await getSignedUrl(supabase, path, expiresIn);
        results[path] = url;
      } catch (error) {
        console.error(`Failed to get signed URL for ${path}:`, error);
      }
    })
  );

  return results;
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Generate a unique storage path for uploads
 */
export function generateUploadPath(filename: string, prefix = 'uploads'): string {
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(filename);
  return `${prefix}/${timestamp}-${sanitized}`;
}
