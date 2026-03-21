'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useCallback } from 'react'
import type { Screenshot } from '@/lib/types'

interface ScreenshotCarouselProps {
  screenshots: Screenshot[]
}

export function ScreenshotCarousel({
  screenshots,
}: ScreenshotCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000, stopOnInteraction: true }),
  ])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  if (screenshots.length === 0) {
    return (
      <div className="w-full h-[400px] bg-[#1F1F1F] rounded-lg flex items-center justify-center text-gray-500">
        Ekran goruntusu yok
      </div>
    )
  }

  return (
    <div className="relative group">
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {screenshots.map((ss) => (
            <div key={ss.id} className="flex-[0_0_100%] min-w-0">
              <img
                src={ss.image_url}
                alt={ss.caption || 'Screenshot'}
                className="w-full h-[400px] object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      {screenshots.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ◀
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ▶
          </button>
        </>
      )}
    </div>
  )
}
