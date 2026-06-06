/**
 * Converts any string into a clean URL-friendly slug.
 */
export function convertToSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // Remove all non-word characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-')   // Replace spaces, underscores, and multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, '');   // Trim leading/trailing hyphens
}

/**
 * Extracts the real database ID from a slugged parameter (e.g., "my-job-title-slug-docid123" -> "docid123")
 */
export function extractId(slugOrId: string): string {
  if (!slugOrId) return '';
  const parts = slugOrId.split('-');
  return parts[parts.length - 1]; // Take the last element after splitting by hyphens
}

/**
 * Generates the clean path for a job.
 */
export function generateJobUrl(id: string, title?: string): string {
  if (!title) return `/jobs/${id}`;
  const slug = convertToSlug(title);
  return `/jobs/${slug}-${id}`;
}

/**
 * Generates the clean path for a blog post.
 */
export function generateBlogUrl(id: number | string, title?: string): string {
  if (!title) return `/blog/${id}`;
  const slug = convertToSlug(title);
  return `/blog/${slug}-${id}`;
}
