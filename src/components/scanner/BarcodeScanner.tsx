'use client'
import {
  Flashlight,
  FlashlightOff,
  RefreshCw,
  SwitchCamera,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  CameraCapabilities,
  applyCameraSettings,
  describeCameraError,
  getCapabilities,
  isCameraSupported,
  listCameras,
  openCamera,
  stopStream,
} from '@/lib/barcode/camera'
import {
  decodeImageData,
  loadDecoder,
  needsConfirmation,
} from '@/lib/barcode/decoder'
import { enhanceLinearCode } from '@/lib/barcode/enhance'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Frame drawn on screen, as fractions of the preview.
const VIEWFINDER = { x: 0.075, y: 0.275, width: 0.85, height: 0.45 }
// Decode slightly more than the frame to tolerate imprecise aiming.
const DECODE_MARGIN = 0.05
const SCAN_INTERVAL_MS = 100
// Frames cycle through these passes, as each one reads different cases:
// noisy small codes need smoothing, blurry ones sharpening, large ones less
// detail. The plain passes also cover rotated and 2D codes.
const DECODE_PASSES: {
  maxWidth: number
  enhance: 'smooth' | 'sharpen' | null
}[] = [
  { maxWidth: 1440, enhance: null },
  { maxWidth: 1440, enhance: 'smooth' },
  { maxWidth: 1440, enhance: 'sharpen' },
  { maxWidth: 860, enhance: null },
]
const CONFIRM_WINDOW_MS = 1500
const PREFERRED_ZOOM = 2
const CAMERA_STORAGE_KEY = 'matekasse.scanner.camera'

type Status = 'starting' | 'scanning' | 'done' | 'error'

interface BarcodeScannerProps {
  onScan: (value: string) => void
}

export const BarcodeScanner = (props: BarcodeScannerProps) => {
  const { onScan } = props
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const onScanRef = useRef(onScan)

  const [status, setStatus] = useState<Status>('starting')
  const [error, setError] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : (
      localStorage.getItem(CAMERA_STORAGE_KEY)
    ),
  )
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [capabilities, setCapabilities] = useState<CameraCapabilities>({})
  const [torchOn, setTorchOn] = useState(false)
  const [zoom, setZoom] = useState<number | null>(null)
  const [restartKey, setRestartKey] = useState(0)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    let cancelled = false
    // A function, so TypeScript re-checks the flag after each await.
    const isCancelled = () => cancelled
    let stream: MediaStream | null = null

    const start = async () => {
      setStatus('starting')
      setError(null)

      if (!isCameraSupported()) {
        setError(
          window.isSecureContext ?
            'This browser cannot access the camera.'
          : 'The camera only works over HTTPS.',
        )
        setStatus('error')
        return
      }

      void loadDecoder().catch(() => undefined)

      try {
        stream = await openCamera(deviceId)
        const video = videoRef.current
        if (isCancelled() || video === null) {
          stopStream(stream)
          return
        }

        video.muted = true
        video.srcObject = stream
        await video.play()

        const [track] = stream.getVideoTracks()
        trackRef.current = track
        const trackCapabilities = getCapabilities(track)

        if (trackCapabilities.focusMode?.includes('continuous')) {
          await applyCameraSettings(track, { focusMode: 'continuous' })
        }

        let appliedZoom: number | null = null
        if (trackCapabilities.zoom) {
          const { min, max } = trackCapabilities.zoom
          const preferred = Math.min(Math.max(PREFERRED_ZOOM, min), max)
          if (await applyCameraSettings(track, { zoom: preferred })) {
            appliedZoom = preferred
          }
        }

        const availableCameras = await listCameras()
        if (isCancelled()) return

        setCapabilities(trackCapabilities)
        setZoom(appliedZoom)
        setTorchOn(false)
        setCameras(availableCameras)
        setStatus('scanning')
      } catch (cameraError) {
        if (!isCancelled()) {
          setError(describeCameraError(cameraError))
          setStatus('error')
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      stopStream(stream)
      trackRef.current = null
    }
  }, [deviceId, restartKey])

  // Mobile browsers suspend the camera in the background.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackRef.current?.stop()
      } else {
        setRestartKey((cur) => cur + 1)
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    if (status !== 'scanning') return

    let stopped = false
    let timer: number | undefined
    let candidate: { text: string; at: number } | null = null
    let frameIndex = 0
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (context !== null) context.imageSmoothingQuality = 'high'

    const tick = async () => {
      const startedAt = performance.now()
      const video = videoRef.current
      const container = containerRef.current

      if (
        context !== null &&
        video !== null &&
        container !== null &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0
      ) {
        const region = getDecodeRegion(video, container)
        const pass = DECODE_PASSES[frameIndex % DECODE_PASSES.length]
        frameIndex++
        const scale = Math.min(1, pass.maxWidth / region.width)
        canvas.width = Math.max(1, Math.round(region.width * scale))
        canvas.height = Math.max(1, Math.round(region.height * scale))
        context.drawImage(
          video,
          region.x,
          region.y,
          region.width,
          region.height,
          0,
          0,
          canvas.width,
          canvas.height,
        )

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        )
        if (pass.enhance !== null) {
          enhanceLinearCode(imageData, pass.enhance === 'sharpen')
        }

        try {
          const result = await decodeImageData(imageData)
          if (stopped) return

          if (result !== null) {
            const now = performance.now()
            const confirmed =
              !needsConfirmation(result.format) ||
              (candidate?.text === result.text &&
                now - candidate.at < CONFIRM_WINDOW_MS)

            if (confirmed) {
              stopped = true
              if ('vibrate' in navigator) navigator.vibrate(80)
              setStatus('done')
              onScanRef.current(result.text)
              return
            }

            candidate = { text: result.text, at: now }
          }
        } catch {
          if (!stopped) {
            setError(
              'The barcode reader could not be loaded. Check the connection, then try again.',
            )
            setStatus('error')
          }
          return
        }
      }

      if (!stopped) {
        timer = window.setTimeout(
          () => void tick(),
          Math.max(0, SCAN_INTERVAL_MS - (performance.now() - startedAt)),
        )
      }
    }

    void tick()

    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [status])

  const toggleTorch = async () => {
    const track = trackRef.current
    if (
      track !== null &&
      (await applyCameraSettings(track, { torch: !torchOn }))
    ) {
      setTorchOn(!torchOn)
    }
  }

  const toggleZoom = async () => {
    const track = trackRef.current
    const range = capabilities.zoom
    if (track === null || range === undefined) return

    const zoomedIn = zoom !== null && zoom > range.min
    const next =
      zoomedIn ?
        range.min
      : Math.min(Math.max(PREFERRED_ZOOM, range.min), range.max)
    if (await applyCameraSettings(track, { zoom: next })) {
      setZoom(next)
    }
  }

  const switchCamera = () => {
    const currentId = trackRef.current?.getSettings().deviceId
    const index = cameras.findIndex((camera) => camera.deviceId === currentId)
    const next = cameras[(index + 1) % cameras.length]
    localStorage.setItem(CAMERA_STORAGE_KEY, next.deviceId)
    setDeviceId(next.deviceId)
  }

  const canZoom =
    capabilities.zoom !== undefined &&
    capabilities.zoom.max > capabilities.zoom.min

  return (
    <div className="grid gap-2">
      <div
        ref={containerRef}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-black"
      >
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover"
          playsInline
          muted
          autoPlay
          disablePictureInPicture
          aria-label="Camera preview"
        />

        {status !== 'error' && (
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute rounded-md border-2 shadow-[0_0_0_9999px_rgb(0_0_0/0.4)] transition-colors',
              status === 'done' ? 'border-green-400' : 'border-white/90',
            )}
            style={{
              left: `${VIEWFINDER.x * 100}%`,
              top: `${VIEWFINDER.y * 100}%`,
              width: `${VIEWFINDER.width * 100}%`,
              height: `${VIEWFINDER.height * 100}%`,
            }}
          >
            {status === 'scanning' && (
              <div className="absolute inset-x-2 top-1/2 h-0.5 animate-pulse bg-red-500/80" />
            )}
          </div>
        )}

        {status === 'starting' && (
          <p className="absolute inset-0 grid place-items-center text-sm text-white">
            Starting camera…
          </p>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 grid place-content-center justify-items-center gap-3 bg-black/80 p-4 text-center text-sm text-white">
            <p>{error}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setRestartKey((cur) => cur + 1)}
            >
              <RefreshCw />
              Try again
            </Button>
          </div>
        )}

        {status === 'scanning' && (
          <div className="absolute right-2 bottom-2 flex gap-2">
            {capabilities.torch === true && (
              <ScannerControl
                label={torchOn ? 'Turn torch off' : 'Turn torch on'}
                onClick={() => void toggleTorch()}
              >
                {torchOn ?
                  <FlashlightOff />
                : <Flashlight />}
              </ScannerControl>
            )}
            {canZoom && (
              <ScannerControl
                label={
                  zoom !== null && zoom > (capabilities.zoom?.min ?? 1) ?
                    'Zoom out'
                  : 'Zoom in'
                }
                onClick={() => void toggleZoom()}
              >
                {zoom !== null && zoom > (capabilities.zoom?.min ?? 1) ?
                  <ZoomOut />
                : <ZoomIn />}
              </ScannerControl>
            )}
            {cameras.length > 1 && (
              <ScannerControl label="Switch camera" onClick={switchCamera}>
                <SwitchCamera />
              </ScannerControl>
            )}
          </div>
        )}
      </div>

      {status !== 'error' && (
        <p className="text-xs text-muted-foreground">
          Hold the barcode inside the frame. If it stays blurry, move the camera
          a little further away.
        </p>
      )}
    </div>
  )
}

interface ScannerControlProps {
  label: string
  onClick: () => void
  children: React.ReactNode
}

const ScannerControl = (props: ScannerControlProps) => {
  const { label, onClick, children } = props

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      className="size-10 rounded-full bg-black/60 text-white hover:bg-black/80"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

// Maps the on-screen frame to video pixels, accounting for object-fit: cover.
const getDecodeRegion = (video: HTMLVideoElement, container: HTMLElement) => {
  const videoWidth = video.videoWidth
  const videoHeight = video.videoHeight
  const scale = Math.max(
    container.clientWidth / videoWidth,
    container.clientHeight / videoHeight,
  )
  const visibleWidth = container.clientWidth / scale
  const visibleHeight = container.clientHeight / scale
  const offsetX = (videoWidth - visibleWidth) / 2
  const offsetY = (videoHeight - visibleHeight) / 2

  const left = Math.max(0, VIEWFINDER.x - DECODE_MARGIN)
  const top = Math.max(0, VIEWFINDER.y - DECODE_MARGIN)
  const right = Math.min(1, VIEWFINDER.x + VIEWFINDER.width + DECODE_MARGIN)
  const bottom = Math.min(1, VIEWFINDER.y + VIEWFINDER.height + DECODE_MARGIN)

  return {
    x: Math.round(offsetX + left * visibleWidth),
    y: Math.round(offsetY + top * visibleHeight),
    width: Math.max(1, Math.round((right - left) * visibleWidth)),
    height: Math.max(1, Math.round((bottom - top) * visibleHeight)),
  }
}
