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

  // Handle data URIs - if it's a data URI, return as-is
  if (assetPath.startsWith('data:')) {
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
    const pathname = window.location.pathname;
    if (pathname.includes('/assets/')) {
      const assetsIndex = pathname.indexOf('/assets/');
      imageBaseUrl = window.location.origin + pathname.substring(0, assetsIndex);
    } else {
      const pathSegments = pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const basePath = '/' + pathSegments.slice(0, -1).join('/');
        imageBaseUrl = window.location.origin + basePath;
      } else {
        imageBaseUrl = window.location.origin;
      }
    }
  }

  // Normalize the assetPath
  let normalizedPath = assetPath.trim();
  
  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.substring(1);
  }
  
  if (!normalizedPath.startsWith('assets/')) {
    normalizedPath = `assets/${normalizedPath}`;
  }

  const baseUrl = imageBaseUrl.endsWith('/') ? imageBaseUrl.slice(0, -1) : imageBaseUrl;
  const finalPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  
  const resolvedUrl = `${baseUrl}${finalPath}`;
  
  return resolvedUrl;
}

/**
 * Resolves public folder asset URLs for deployed apps.
 *
 * When the app is served from a path (e.g. staging.uipath.com/org/tenant/app-id/),
 * relative paths like /Medical-1.png resolve to the domain root and 404. This
 * function uses the same app base URL as resolveAssetUrl and appends the
 * public path so images in the public folder load correctly.
 *
 * @param publicPath - Path to the file in public (e.g. "/Medical-1.png" or "Medical-1.png")
 * @returns The resolved URL for the public asset
 */
export function getPublicAssetUrl(publicPath: string): string {
  if (publicPath.startsWith('http://') || publicPath.startsWith('https://')) {
    return publicPath;
  }
  if (publicPath.startsWith('data:')) {
    return publicPath;
  }

  let appBaseUrl = '';
  const scripts = document.getElementsByTagName('script');
  for (const script of scripts) {
    if (script.src && script.src.includes('/assets/') && script.src.includes('.js')) {
      const assetsIndex = script.src.indexOf('/assets/');
      appBaseUrl = script.src.substring(0, assetsIndex);
      break;
    }
  }

  if (!appBaseUrl) {
    const pathname = window.location.pathname;
    if (pathname.includes('/assets/')) {
      const assetsIndex = pathname.indexOf('/assets/');
      appBaseUrl = window.location.origin + pathname.substring(0, assetsIndex);
    } else {
      const pathSegments = pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        appBaseUrl = window.location.origin + '/' + pathSegments[0];
      } else {
        appBaseUrl = window.location.origin;
      }
    }
  }

  const path = publicPath.startsWith('/') ? publicPath : `/${publicPath}`;
  const base = appBaseUrl.endsWith('/') ? appBaseUrl.slice(0, -1) : appBaseUrl;
  return `${base}${path}`;
}
