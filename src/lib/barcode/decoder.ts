import type { ReaderOptions } from 'zxing-wasm/reader'

export interface ScanResult {
  text: string
  format: string
}

// Plain text matches what handheld USB scanners send for the same code.
const READER_OPTIONS: ReaderOptions = {
  formats: ['AllLinear', 'QRCode', 'DataMatrix', 'PDF417', 'Aztec'],
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  textMode: 'Plain',
  maxNumberOfSymbols: 1,
}

const MATRIX_FORMATS = new Set(['QRCode', 'DataMatrix', 'PDF417', 'Aztec'])

let readerPromise: Promise<typeof import('zxing-wasm/reader')> | null = null

// Serves the WASM binary from our own origin instead of the library's CDN.
export const loadDecoder = () => {
  readerPromise ??= import('zxing-wasm/reader')
    .then(async (zxing) => {
      const wasmUrl = new URL(
        'zxing-wasm/reader/zxing_reader.wasm',
        import.meta.url,
      ).href

      await zxing.prepareZXingModule({
        overrides: {
          locateFile: (path: string, prefix: string) =>
            path.endsWith('.wasm') ? wasmUrl : prefix + path,
        },
        fireImmediately: true,
      })

      return zxing
    })
    .catch((error: unknown) => {
      readerPromise = null
      throw error
    })

  return readerPromise
}

export const decodeImageData = async (
  imageData: ImageData,
): Promise<ScanResult | null> => {
  const zxing = await loadDecoder()
  const result = (await zxing.readBarcodes(imageData, READER_OPTIONS)).at(0)

  if (result === undefined || !result.isValid || result.text === '') {
    return null
  }

  return { text: result.text, format: result.format }
}

// 1D codes have weaker error detection, so they are read twice before use.
export const needsConfirmation = (format: string) => !MATRIX_FORMATS.has(format)
