/**
 * Resolves asset URLs correctly for deployed apps.
 * 
 * This is a workaround for a known bug where assets are not being loaded
 * using relative paths in some deployed apps. This function finds the base
 * URL from script tags and constructs the correct asset path.
 * 
 * @param assetPath - The asset path from import (e.g., from '../assets/logo.png')
 * @returns The resolved URL for the asset
 */
export function resolveAssetUrl(assetPath: string): string {
  // If assetPath is already a full URL (http/https), return as-is
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }

  // Handle data URIs - if it's a data URI, return as-is (but log a warning if it looks malformed)
  if (assetPath.startsWith('data:')) {
    // Data URIs should be complete and valid, but if we're getting a malformed one,
    // it might be that Vite is trying to inline the SVG incorrectly
    console.warn('⚠️ Asset URL is a data URI. This might indicate an issue with SVG imports:', assetPath.substring(0, 100));
    return assetPath;
  }

  // Find the base URL from script tags
  const scripts = document.getElementsByTagName('script');
  let imageBaseUrl = '';
  
  for (const script of scripts) {
    if (script.src && script.src.includes('/assets/') && script.src.includes('.js')) {
      const assetsIndex = script.src.indexOf('/assets/');
      imageBaseUrl = script.src.substring(0, assetsIndex);
      break;
    }
  }

  // If we couldn't find a base URL from scripts, try to infer from current location
  if (!imageBaseUrl) {
    // Get the current pathname and try to find the base
    const pathname = window.location.pathname;
    // Look for /assets/ in the current URL structure
    if (pathname.includes('/assets/')) {
      const assetsIndex = pathname.indexOf('/assets/');
      imageBaseUrl = window.location.origin + pathname.substring(0, assetsIndex);
    } else {
      // Fallback: use current origin + pathname up to the last slash
      // This handles cases like: https://domain.com/app-id/...
      const pathSegments = pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        // Remove the last segment (might be a route like 'dashboard')
        const basePath = '/' + pathSegments.slice(0, -1).join('/');
        imageBaseUrl = window.location.origin + basePath;
      } else {
        imageBaseUrl = window.location.origin;
      }
    }
  }

  // Normalize the assetPath
  // Vite imports typically return just the filename with hash (e.g., 'logo-abc123.png')
  // or sometimes '/assets/logo-abc123.png'
  let normalizedPath = assetPath.trim();
  
  // Remove leading slash if present
  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.substring(1);
  }
  
  // If the path doesn't start with 'assets/', add it
  // Vite typically returns just the hashed filename, so we need to prepend 'assets/'
  if (!normalizedPath.startsWith('assets/')) {
    normalizedPath = `assets/${normalizedPath}`;
  }

  // Construct the final URL, ensuring no double slashes
  // Remove trailing slash from baseUrl if present
  const baseUrl = imageBaseUrl.endsWith('/') ? imageBaseUrl.slice(0, -1) : imageBaseUrl;
  // Ensure normalizedPath starts with a single slash
  const finalPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  
  const resolvedUrl = `${baseUrl}${finalPath}`;
  
  // Debug logging (always log in production to help diagnose issues)
  console.log('🔍 Asset URL Resolution:', {
    original: assetPath,
    normalized: normalizedPath,
    baseUrl: imageBaseUrl,
    resolved: resolvedUrl,
  });
  
  return resolvedUrl;
}
