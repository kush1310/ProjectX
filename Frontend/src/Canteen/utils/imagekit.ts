/**
 * imagekit.ts
 *
 * Utility functions for ImageKit real-time media optimization, responsive image
 * transformations, and graceful fallback handling across the Canteen application.
 */

const DEFAULT_CDN_ENDPOINT = 'https://ik.imagekit.io/cyseckush/';

/**
 * Image transformation options supported by ImageKit CDN URL query parameters.
 */
export interface ImageKitTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'maintain_ratio' | 'force' | 'at_max' | 'at_least';
  focus?: 'auto' | 'center' | 'top' | 'bottom';
}

/**
 * Retrieves the configured ImageKit CDN endpoint URL with trailing slash.
 *
 * @returns {string} Fully qualified CDN delivery endpoint.
 */
export function getImageKitEndpoint(): string {
  const endpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || DEFAULT_CDN_ENDPOINT;
  return endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
}

/**
 * Builds an optimized ImageKit delivery URL with responsive transformations.
 *
 * @param  {string} pathOrUrl - Relative path (e.g. 'menu-items/samosa.jpg') or existing URL.
 * @param  {ImageKitTransformOptions} options - Transformation parameters (dimensions, format, quality).
 * @returns {string} Fully transformed ImageKit URL with transformation query parameters.
 * @edge-cases Returns empty string if path is null or undefined; preserves non-ImageKit absolute URLs.
 */
export function buildImageKitUrl(pathOrUrl?: string, options?: ImageKitTransformOptions): string {
  if (!pathOrUrl || pathOrUrl.trim() === '') {
    return '';
  }

  const endpoint = getImageKitEndpoint();
  const transforms: string[] = [];

  if (options?.width) transforms.push(`w-${options.width}`);
  if (options?.height) transforms.push(`h-${options.height}`);
  if (options?.quality) transforms.push(`q-${options.quality}`);
  if (options?.format) transforms.push(`f-${options.format}`);
  if (options?.crop) transforms.push(`c-${options.crop}`);
  if (options?.focus) transforms.push(`fo-${options.focus}`);

  const transformQuery = transforms.length > 0 ? `tr=${transforms.join(',')}` : '';

  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    if (transformQuery && pathOrUrl.includes('ik.imagekit.io')) {
      const separator = pathOrUrl.includes('?') ? '&' : '?';
      return `${pathOrUrl}${separator}${transformQuery}`;
    }
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl.slice(1) : pathOrUrl;
  const baseUrl = `${endpoint}${normalizedPath}`;

  return transformQuery ? `${baseUrl}?${transformQuery}` : baseUrl;
}

/**
 * Generates an optimized thumbnail image URL tailored for menu cards.
 *
 * @param  {string} pathOrUrl - Image relative path or existing CDN URL.
 * @param  {number} width     - Target width in pixels (defaults to 300).
 * @param  {number} height    - Target height in pixels (defaults to 200).
 * @returns {string} Transformed menu item thumbnail URL.
 */
export function getMenuThumbnailUrl(pathOrUrl?: string, width = 300, height = 200): string {
  return buildImageKitUrl(pathOrUrl, {
    width,
    height,
    quality: 80,
    format: 'auto',
    focus: 'auto'
  });
}

/**
 * Generates an optimized banner image URL tailored for canteen headers.
 *
 * @param  {string} pathOrUrl - Image relative path or existing CDN URL.
 * @param  {number} width     - Target width in pixels (defaults to 1200).
 * @param  {number} height    - Target height in pixels (defaults to 400).
 * @returns {string} Transformed hero banner URL.
 */
export function getCanteenBannerUrl(pathOrUrl?: string, width = 1200, height = 400): string {
  return buildImageKitUrl(pathOrUrl, {
    width,
    height,
    quality: 85,
    format: 'auto',
    crop: 'maintain_ratio'
  });
}
