import Image from 'next/image'
import { CupSoda } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OfferingImageProps {
  src: string | null | undefined
  size: number
  alt: string
  className?: string
}

// Offerings may lack an image, which next/image cannot render.
export const OfferingImage = (props: OfferingImageProps) => {
  const { src, size, alt, className } = props

  if (!src) {
    return (
      <CupSoda
        className={cn('text-muted-foreground', className)}
        width={size}
        height={size}
        role={alt === '' ? undefined : 'img'}
        aria-label={alt === '' ? undefined : alt}
      />
    )
  }

  return (
    <Image
      className={className}
      src={{ src, height: size, width: size }}
      alt={alt}
    />
  )
}
