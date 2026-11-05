import type { ReaderOptions } from 'zxing-wasm/reader'

export interface ScanResult {
  text: string
  format: string
}

export type Decoder = (imageData: ImageData) => Promise<ScanResult | null>

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

const NATIVE_MATRIX_FORMATS: Partial<Record<string, string>> = {
  qr_code: 'QRCode',
  data_matrix: 'DataMatrix',
  pdf417: 'PDF417',
  aztec: 'Aztec',
}

// The Barcode Detection API is not part of the DOM typings yet.
interface NativeBarcodeDetector {
  detect: (image: ImageData) => Promise<{ rawValue: string; format: string }[]>
}

interface NativeBarcodeDetectorClass {
  new (options: { formats: string[] }): NativeBarcodeDetector
  getSupportedFormats: () => Promise<string[]>
}

export class WebAssemblyUnavailableError extends Error {
  constructor() {
    super('WebAssembly is not available in this browser')
    this.name = 'WebAssemblyUnavailableError'
  }
}

const createZxingDecoder = async (): Promise<Decoder> => {
  if (!('WebAssembly' in globalThis)) {
    throw new WebAssemblyUnavailableError()
  }

  const zxing = await import('zxing-wasm/reader')
  // Serves the WASM binary from our own origin instead of the library's CDN.
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

  return async (imageData) => {
    const result = (await zxing.readBarcodes(imageData, READER_OPTIONS)).at(0)

    if (result === undefined || !result.isValid || result.text === '') {
      return null
    }

    return { text: result.text, format: result.format }
  }
}

// Chromium on Android ships a detector that works without WebAssembly.
const createNativeDecoder = async (): Promise<Decoder | null> => {
  const NativeDetector = (
    globalThis as { BarcodeDetector?: NativeBarcodeDetectorClass }
  ).BarcodeDetector
  if (NativeDetector === undefined) return null

  const formats = await NativeDetector.getSupportedFormats()
  if (formats.length === 0) return null

  const detector = new NativeDetector({ formats })

  return async (imageData) => {
    const code = (await detector.detect(imageData)).at(0)
    if (code === undefined || code.rawValue === '') return null

    return {
      text: code.rawValue,
      format: NATIVE_MATRIX_FORMATS[code.format] ?? code.format,
    }
  }
}

let decoderPromise: Promise<Decoder> | null = null

export const loadDecoder = () => {
  decoderPromise ??= createZxingDecoder()
    .catch(async (zxingError: unknown) => {
      const nativeDecoder = await createNativeDecoder().catch(() => null)
      if (nativeDecoder !== null) return nativeDecoder
      throw zxingError
    })
    .catch((error: unknown) => {
      decoderPromise = null
      throw error
    })

  return decoderPromise
}

// 1D codes have weaker error detection, so they are read twice before use.
export const needsConfirmation = (format: string) => !MATRIX_FORMATS.has(format)
