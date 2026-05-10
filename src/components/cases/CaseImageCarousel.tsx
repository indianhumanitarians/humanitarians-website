import { useEffect, useState } from "react";
import { useCarousel } from "../../hooks/useCarousel";
import type { CaseStoryImage } from "../../types/stats";

interface CaseImageCarouselProps {
  images: CaseStoryImage[];
  title: string;
}

export const CaseImageCarousel = ({ images, title }: CaseImageCarouselProps) => {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
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
  const activeImage = displayImages[activeIndex];

  useEffect(() => {
    setFailedImages(new Set());
  }, [imageKey, title]);

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
      {activeImage?.caption ? (
        <p className="case-carousel-caption">{activeImage.caption}</p>
      ) : null}

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
