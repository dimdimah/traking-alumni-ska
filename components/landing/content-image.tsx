import Image from 'next/image'
import type { ReactNode } from 'react'

const KATEGORI_FALLBACK: Record<string, string> = {
  Akademik: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600',
  Karir: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600',
  Kampus: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=600',
  Teknologi: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600',
  Umum: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600',
}

export interface ContentImageProps {
  src?: string | null
  alt: string
  category?: string
  categoryFallback?: string
  imageHeight?: string
  priority?: boolean
  className?: string
  imageClassName?: string
  children?: ReactNode
}

export function ContentImage({
  src,
  alt,
  category,
  categoryFallback,
  imageHeight = 'h-48',
  priority = false,
  className = '',
  imageClassName = '',
  children,
}: ContentImageProps) {
  const resolvedSrc = src || categoryFallback || KATEGORI_FALLBACK[category || 'Umum'] || KATEGORI_FALLBACK.Umum

  return (
    <div className={`relative w-full overflow-hidden ${imageHeight} ${className}`}>
      <Image
        src={resolvedSrc}
        alt={alt}
        width={800}
        height={400}
        className={`h-full w-full object-cover ${imageClassName ?? ''}`}
        priority={priority}
      />
      {category && (
        <div className="absolute top-4 left-4 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amikom-purple">
          {category}
        </div>
      )}
      {children}
    </div>
  )
}
