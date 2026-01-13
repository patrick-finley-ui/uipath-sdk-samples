// Default URL (fallback if env vars not set)
// Using a reliable CDN URL for the UiPath logo
const DEFAULT_UIPATH_URL = 'https://images.seeklogo.com/logo-png/61/1/uipath-logo-png_seeklogo-618304.png';

/**
 * Get logo sources based on environment configuration
 * @returns Object containing UiPath logo URL
 */
export const getLogoUrls = () => {
  // Since the logo file may not exist, we'll use the URL by default
  // If you add the logo file to assets, you can enable local images via env var
  const useLocalImages = import.meta.env.VITE_USE_LOCAL_IMAGES === 'true';

  let uipathLogoSrc: string;
  
  if (useLocalImages) {
    // Try to use local image if available (requires logo file in assets folder)
    try {
      // Dynamic import would be needed here, but for simplicity, we'll use URL
      uipathLogoSrc = import.meta.env.VITE_UIPATH_LOGO_URL || DEFAULT_UIPATH_URL;
    } catch {
      uipathLogoSrc = DEFAULT_UIPATH_URL;
    }
  } else {
    uipathLogoSrc = import.meta.env.VITE_UIPATH_LOGO_URL || DEFAULT_UIPATH_URL;
  }

  return {
    uipathLogoSrc,
  };
};
