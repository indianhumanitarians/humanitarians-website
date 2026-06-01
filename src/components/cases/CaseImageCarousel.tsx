import { useEffect, useRef, useState, type TouchEvent } from "react";
import { useCarousel } from "../../hooks/useCarousel";
import type { CaseStoryImage } from "../../types/stats";

interface CaseImageCarouselProps {
  images: CaseStoryImage[];
  title: string;
}

export const CaseImageCarousel = ({ images, title }: CaseImageCarouselProps) => {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const imageKey = images.map((image) => image.src).join("|");
  const displayImages = images.filter((image) => !failedImages.has(image.src));
  const {
    activeIndex,
    setActiveIndex,
    hasMultipleItems: hasMultipleImages,
    showPrevious,
    showNext,
    handleKeyDown,
  } = useCarousel({
    itemCount: displayImages.length,
    resetKey: `${title}:${imageKey}`,
    autoAdvanceMs: 6500,
  });

  useEffect(() => {
    setFailedImages(new Set());
  }, [imageKey, title]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!hasMultipleImages) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (!start || !hasMultipleImages) {
      return;
    }

    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const isHorizontalSwipe = Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15;

    if (!isHorizontalSwipe) {
      return;
    }

    if (deltaX < 0) {
      showNext();
    } else {
      showPrevious();
    }
  };

  if (displayImages.length === 0) {
    return (
      <div
        className="case-image-empty"
        aria-label={`Image placeholder for ${title}`}
      >
        <span>Case images can be added here</span>
      </div>
    );
  }

  return (
    <div
      className="case-carousel"
      aria-label={`${title} image gallery`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartRef.current = null;
      }}
    >
      <div
        className="case-carousel-track"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {displayImages.map((image) => (
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            className="case-carousel-image"
            loading="lazy"
            onError={() =>
              setFailedImages((current) => new Set(current).add(image.src))
            }
          />
        ))}
      </div>

      {hasMultipleImages ? (
        <>
          <button
            className="case-carousel-button previous"
            type="button"
            onClick={showPrevious}
            aria-label={`Show previous image for ${title}`}
          >
            ‹
          </button>
          <button
            className="case-carousel-button next"
            type="button"
            onClick={showNext}
            aria-label={`Show next image for ${title}`}
          >
            ›
          </button>
        </>
      ) : null}
      {hasMultipleImages ? (
        <div
          className="case-carousel-dots"
          aria-label={`${title} image selector`}
        >
          {displayImages.map((image, index) => (
            <button
              key={image.src}
              type="button"
              className={index === activeIndex ? "active" : undefined}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1} for ${title}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
