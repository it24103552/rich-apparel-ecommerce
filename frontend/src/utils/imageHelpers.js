/**
 * Resolves an image path/URL into a usable URL.
 * Handles Supabase cloud URLs (direct) and legacy local paths (requires backend host).
 * 
 * @param {string} path - The image path or full URL from the database.
 * @param {string} placeholder - Optional placeholder image path.
 * @returns {string} The resolved URL.
 */
export const resolveImageUrl = (path, placeholder = "/placeholder.png") => {
  if (!path) return placeholder;
  
  // If it's already a full URL (Supabase or external)
  if (path.startsWith("http")) return path;
  
  // If it's a local relative path
  const backendHost = "http://localhost:5001";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${backendHost}${cleanPath}`;
};
