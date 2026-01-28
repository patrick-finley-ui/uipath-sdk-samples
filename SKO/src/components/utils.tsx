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
  console.log('resolved url', `${imageBaseUrl}${assetPath}`);

  return `${imageBaseUrl}${assetPath}`;
}