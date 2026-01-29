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
  
  // If assetPath starts with /, it's from public folder - ensure it's properly resolved
  const resolvedPath = assetPath.startsWith('/') 
    ? `${imageBaseUrl}${assetPath}` 
    : `${imageBaseUrl}${assetPath}`;
  
  console.log('resolved url', resolvedPath);
  return resolvedPath;
}
