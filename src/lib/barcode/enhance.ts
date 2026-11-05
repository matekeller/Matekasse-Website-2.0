// Helps with noisy or slightly blurry 1D barcodes. Their bars run vertically,
// so pixels are averaged along the bars to cancel sensor noise and sharpened
// across them to counter defocus. Matrix codes must use the unmodified image.

interface Pixels {
  data: Uint8ClampedArray
  width: number
  height: number
}

const SMOOTH_RADIUS = 4
const SHARPEN_SIGMA = 1.5
const SHARPEN_AMOUNT = 1.2

const gaussianKernel = (sigma: number) => {
  const radius = Math.ceil(sigma * 3)
  const weights = Array.from({ length: radius * 2 + 1 }, (_, index) =>
    Math.exp(-((index - radius) ** 2) / (2 * sigma * sigma)),
  )
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  return { radius, weights: weights.map((weight) => weight / total) }
}

const SHARPEN_KERNEL = gaussianKernel(SHARPEN_SIGMA)

export const enhanceLinearCode = (image: Pixels, sharpen: boolean) => {
  const { data, width, height } = image

  // Column-wise prefix sums of luminance make the vertical average O(1).
  const prefix = new Float32Array((height + 1) * width)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const luminance =
        (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) / 256
      prefix[(y + 1) * width + x] = prefix[y * width + x] + luminance
    }
  }

  const smoothed = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    const top = Math.max(0, y - SMOOTH_RADIUS)
    const bottom = Math.min(height, y + SMOOTH_RADIUS + 1)
    for (let x = 0; x < width; x++) {
      smoothed[y * width + x] =
        (prefix[bottom * width + x] - prefix[top * width + x]) / (bottom - top)
    }
  }

  const { radius, weights } = SHARPEN_KERNEL
  for (let y = 0; y < height; y++) {
    const row = y * width
    for (let x = 0; x < width; x++) {
      let value = smoothed[row + x]

      if (sharpen) {
        let blurred = 0
        for (let k = -radius; k <= radius; k++) {
          const sampleX = Math.min(width - 1, Math.max(0, x + k))
          blurred += weights[k + radius] * smoothed[row + sampleX]
        }
        value += SHARPEN_AMOUNT * (value - blurred)
      }

      const i = (row + x) * 4
      data[i] = data[i + 1] = data[i + 2] = value
      data[i + 3] = 255
    }
  }
}
