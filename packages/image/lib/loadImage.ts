import sharp from 'sharp'

export interface ImageData {
  /** Raw RGBA pixel buffer (4 bytes per pixel) */
  pixels: Buffer
  /** Image width in pixels */
  width: number
  /** Image height in pixels */
  height: number
}

/**
 * Load an image from a file path or Buffer and decode it to raw RGBA pixels.
 * Supports PNG, JPEG, GIF, WebP, TIFF, AVIF, and SVG via sharp.
 */
export async function loadImage(source: string | Buffer): Promise<ImageData> {
  const image = sharp(source)
  const metadata = await image.metadata()

  const width = metadata.width ?? 0
  const height = metadata.height ?? 0

  if (width === 0 || height === 0) {
    return {pixels: Buffer.alloc(0), width: 0, height: 0}
  }

  const pixels = await image.ensureAlpha().raw().toBuffer()

  return {pixels, width, height}
}

/**
 * Load an image and resize it to fit the target dimensions while preserving
 * aspect ratio. Uses sharp's high-quality Lanczos3 resampling.
 */
export async function loadImageResized(
  source: string | Buffer,
  targetWidth: number,
  targetHeight: number,
): Promise<ImageData> {
  if (targetWidth <= 0 || targetHeight <= 0) {
    return {pixels: Buffer.alloc(0), width: 0, height: 0}
  }

  const image = sharp(source)

  const pixels = await image
    .ensureAlpha()
    .resize(targetWidth, targetHeight, {
      fit: 'inside',
      kernel: 'lanczos3',
      withoutEnlargement: true,
    })
    .raw()
    .toBuffer({resolveWithObject: true})

  return {
    pixels: pixels.data,
    width: pixels.info.width,
    height: pixels.info.height,
  }
}
