import { useEffect, useMemo, useState } from "react";

interface PhotoItem {
  src: string;
  alt: string;
  legend?: string;
}

interface PhotoCarouselProps {
  items: PhotoItem[];
  autoPlay?: boolean;
  interval?: number;
}

const DEFAULT_INTERVAL = 6000;

function PhotoCarousel({ items, autoPlay = true, interval = DEFAULT_INTERVAL }: PhotoCarouselProps) {
  const photos = useMemo(() => items.filter((item) => Boolean(item.src)), [items]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || photos.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % photos.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, photos.length]);

  if (photos.length === 0) {
    return null;
  }

  const goTo = (index: number) => {
    setActiveIndex((index + photos.length) % photos.length);
  };

  const goNext = () => goTo(activeIndex + 1);
  const goPrev = () => goTo(activeIndex - 1);

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.02] shadow-glow-soft">
      <div className="relative h-80 w-full md:h-[420px]">
        {photos.map((item, index) => (
          <figure
            key={item.src}
            className={`absolute inset-0 flex h-full w-full items-center justify-center bg-black/80 transition-all duration-700 ease-in-out ${
              index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <img src={item.src} alt={item.alt} className="h-full w-full object-contain" />
            {item.legend && (
              <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-6 py-4 text-sm text-white">
                {item.legend}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/30 p-3 text-white backdrop-blur transition hover:bg-black/60"
            aria-label="Photo précédente"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/30 p-3 text-white backdrop-blur transition hover:bg-black/60"
            aria-label="Photo suivante"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5 15.75 12l-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      {photos.length > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {photos.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              className={`h-2.5 w-8 rounded-full transition ${
                index === activeIndex ? "bg-brand-primary" : "bg-white/30 hover:bg-white/60"
              }`}
              aria-label={`Aller à la photo ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PhotoCarousel;
