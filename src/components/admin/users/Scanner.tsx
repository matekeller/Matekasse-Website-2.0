/* eslint-disable import/named */
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner'
import { useEffect, useState } from 'react'

interface BarQRCodeScannerProps {
  onScan: (codes: IDetectedBarcode[]) => void
}

export const BarQRCodeScanner = (props: BarQRCodeScannerProps) => {
  const { onScan } = props

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    const enableVideoStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        })
        setMediaStream(stream)
      } catch (error) {
        console.error('Error accessing webcam', error)
      }
    }

    void enableVideoStream()
  }, [])

  useEffect(() => {
    return () => {
      if (mediaStream !== null) {
        mediaStream.getTracks().forEach((track) => {
          track.stop()
        })
      }
    }
  }, [mediaStream])

  return (
    <>
      {mediaStream !== null && (
        <Scanner
          formats={['code_39', 'code_93', 'code_128', 'qr_code']}
          onScan={onScan}
          components={{ finder: false }}
          allowMultiple={false}
          scanDelay={2000}
          constraints={{
            noiseSuppression: true,
            autoGainControl: true,
          }}
        />
      )}
    </>
  )
}
