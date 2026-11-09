"use client"

import { HttpTypes } from "@medusajs/types"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import { clx } from "@modules/common/components/ui"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  title?: string
}

/**
 * Мини-галерея товара: большое фото + миниатюры.
 * Десктоп — клик по миниатюре. Мобильный — свайп по большому фото.
 * Фото, порядок и обложка задаются в админке (Товар → Медиа).
 */
const ImageGallery = ({ images, title = "" }: ImageGalleryProps) => {
  const list = images.filter((i) => !!i.url)
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  // Сброс при смене варианта (другой набор фото)
  useEffect(() => setActive(0), [images])

  const goTo = (index: number) => {
    setActive(index)
    const track = trackRef.current
    if (track) {
      track.scrollTo({ left: track.clientWidth * index, behavior: "smooth" })
    }
  }

  const onScroll = () => {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    const index = Math.round(track.scrollLeft / track.clientWidth)
    if (index !== active) setActive(index)
  }

  if (!list.length) {
    return (
      <div className="relative aspect-square w-full rounded-large bg-ui-bg-subtle flex items-center justify-center">
        <PlaceholderImage size={48} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 small:mx-8" data-testid="image-gallery">
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto no-scrollbar rounded-large bg-ui-bg-subtle"
        >
          {list.map((image, index) => (
            <div
              key={image.id}
              className="relative aspect-square w-full shrink-0 snap-center"
              id={image.id}
            >
              <Image
                src={image.url}
                alt={`${title} — фото ${index + 1}`}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain"
                quality={90}
              />
            </div>
          ))}
        </div>

        {list.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Предыдущее фото"
              onClick={() => goTo((active - 1 + list.length) % list.length)}
              className="hidden small:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-elevation-card-rest hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Следующее фото"
              onClick={() => goTo((active + 1) % list.length)}
              className="hidden small:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-elevation-card-rest hover:bg-white"
            >
              ›
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-small-regular text-white">
              {active + 1} / {list.length}
            </span>
          </>
        )}
      </div>

      {list.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto no-scrollbar" aria-label="Миниатюры">
          {list.map((image, index) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Показать фото ${index + 1}`}
                aria-current={index === active}
                className={clx(
                  "relative block h-16 w-16 small:h-20 small:w-20 overflow-hidden rounded-rounded border-2 bg-ui-bg-subtle transition",
                  index === active
                    ? "border-ui-fg-interactive"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                  quality={50}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ImageGallery
