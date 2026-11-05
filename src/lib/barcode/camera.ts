// Camera features that the DOM typings do not describe yet.
export interface CameraCapabilities {
  torch?: boolean
  zoom?: { min: number; max: number; step?: number }
  focusMode?: string[]
}

export type CameraSettings = MediaTrackConstraintSet & {
  torch?: boolean
  zoom?: number
  focusMode?: string
}

// Barcodes need detail, so ask for the highest common resolution.
const RESOLUTION = { width: { ideal: 1920 }, height: { ideal: 1080 } }

export const isCameraSupported = () =>
  window.isSecureContext &&
  'mediaDevices' in navigator &&
  'getUserMedia' in navigator.mediaDevices

const errorName = (error: unknown) =>
  typeof error === 'object' && error !== null && 'name' in error ?
    String(error.name)
  : ''

export const openCamera = async (
  deviceId: string | null,
): Promise<MediaStream> => {
  const video: MediaTrackConstraints =
    deviceId !== null ?
      { ...RESOLUTION, deviceId: { exact: deviceId } }
    : { ...RESOLUTION, facingMode: { ideal: 'environment' } }

  try {
    return await navigator.mediaDevices.getUserMedia({ audio: false, video })
  } catch (error) {
    // A remembered camera may no longer exist.
    if (
      deviceId !== null &&
      ['OverconstrainedError', 'NotFoundError'].includes(errorName(error))
    ) {
      return openCamera(null)
    }
    throw error
  }
}

export const stopStream = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((track) => {
    track.stop()
  })
}

export const getCapabilities = (track: MediaStreamTrack): CameraCapabilities =>
  'getCapabilities' in track ?
    (track.getCapabilities() as CameraCapabilities)
  : {}

export const applyCameraSettings = async (
  track: MediaStreamTrack,
  settings: CameraSettings,
) => {
  try {
    await track.applyConstraints({ advanced: [settings] })
    return true
  } catch {
    return false
  }
}

export const listCameras = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((device) => device.kind === 'videoinput')
}

export const describeCameraError = (error: unknown) => {
  switch (errorName(error)) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera access is blocked. Allow the camera for this site in the browser settings, then try again.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No camera was found on this device.'
    case 'NotReadableError':
    case 'AbortError':
      return 'The camera is in use by another app or tab. Close it, then try again.'
    default:
      return 'The camera could not be started.'
  }
}
