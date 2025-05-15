// Utility to generate a slug from a string and append a short random string for uniqueness
export function slugify(text: string, uniquePart?: string): string {
  const baseSlug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  if (uniquePart) {
    return `${baseSlug}-${uniquePart}`;
  }
  return baseSlug;
} 