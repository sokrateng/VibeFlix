'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useCallback, useEffect, useState } from 'react'
import type { Screenshot } from '@/lib/types'

interface ScreenshotCarouselProps {
  screenshots: Screenshot[]
}

export function ScreenshotCarousel({ screenshots }: ScreenshotCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000, stopOnInteraction: true }),
  ])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi])

  if (screenshots.length === 0) {
    return (
      <div className="glass-card w-full h-[400px] flex items-center justify-center text-on-surface-variant font-sans">
        Ekran goruntusu yok
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden relative group">
      {/* Slides */}
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
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

      {/* Prev / Next buttons */}
      {screenshots.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            aria-label="Onceki ekran goruntusu"
            className="absolute left-3 top-1/2 -translate-y-1/2 glass w-10 h-10 rounded-full flex items-center justify-center text-on-surface opacity-0 group-hover:opacity-100 transition-opacity hover:border-white/30"
          >
            &#9664;
          </button>
          <button
            onClick={scrollNext}
            aria-label="Sonraki ekran goruntusu"
            className="absolute right-3 top-1/2 -translate-y-1/2 glass w-10 h-10 rounded-full flex items-center justify-center text-on-surface opacity-0 group-hover:opacity-100 transition-opacity hover:border-white/30"
          >
            &#9654;
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" role="tablist" aria-label="Ekran goruntusu navigasyonu">
            {screenshots.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === selectedIndex}
                aria-label={`Ekran goruntusu ${i + 1}`}
                onClick={() => scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === selectedIndex
                    ? 'w-5 bg-primary'
                    : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
