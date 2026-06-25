"use client"

import Image from "next/image"

interface UserImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
}

export function UserImage({ src, alt, fill, width, height, className }: UserImageProps) {
  // Check if the image is a data URL (base64)
  if (src && src.startsWith('data:')) {
    if (fill) {
      return <img src={src} alt={alt} className={className} />
    }
    return <img src={src} alt={alt} width={width} height={height} className={className} />
  }

  // For regular URLs, use Next.js Image
  if (fill) {
    return <Image src={src || "/avatar.png"} alt={alt} fill className={className} />
  }
  return <Image src={src || "/avatar.png"} alt={alt} width={width || 100} height={height || 100} className={className} />
}
