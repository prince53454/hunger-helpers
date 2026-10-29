/** Normalize legacy Vite asset paths; items without a photo intentionally show no image. */
export function getMenuImage(image: string | undefined): string {
  if (!image?.trim()) return '';
  if (image?.trim()) {
    const normalized = image.trim().replace(/\\/g, '/');
    const assetPath = normalized.match(/(?:^|\/)assets\/(images\/[^?#]+)/i)?.[1];
    return assetPath ? `/src/assets/${assetPath}` : normalized;
  }
  return '';
}
