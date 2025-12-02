/**
 * Helper function to correctly resolve asset URLs in deployed UiPath apps.
 * 
 * This is a workaround for a known bug where images don't load correctly
 * because assets are not being loaded using relative paths.
 * 
 * @param assetPath - The imported asset path (e.g., from `import logo from '../assets/logo.png'`)
 * @returns The correctly resolved asset URL
 */
export function resolveAssetUrl(assetPath: string): string {
  const scripts = document.getElementsByTagName('script');
  let imageBaseUrl = '';
  for (const script of scripts) {
    if (script.src && script.src.includes('/assets/') && script.src.includes('.js')) {
      const assetsIndex = script.src.indexOf('/assets/');
      imageBaseUrl = script.src.substring(0, assetsIndex);
      break;
    }
  }
  return `${imageBaseUrl}/${assetPath}`;
}

