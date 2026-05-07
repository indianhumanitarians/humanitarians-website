import { useEffect, useState, type KeyboardEvent } from "react";
import type { CaseStoryImage } from "../../types/stats";

interface CaseImageCarouselProps {
  images: CaseStoryImage[];
  fallbackImages?: CaseStoryImage[];
  title: string;
}

export const CaseImageCarousel = ({ images, fallbackImages = [], title }: CaseImageCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const visibleImages = images.filter((image) => !failedImages.has(image.src));
  const displayImages = visibleImages.length > 0 ? visibleImages : fallbackImages;
  const activeImage = displayImages[activeIndex];
  const hasMultipleImages = displayImages.length > 1;

  useEffect(() => {
    setActiveIndex(0);
    setFailedImages(new Set());
  }, [images, title]);

  useEffect(() => {
    if (activeIndex > displayImages.length - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, displayImages.length]);

  useEffect(() => {
    if (!hasMultipleImages) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % displayImages.length);
    }, 6500);

    return () => window.clearInterval(intervalId);
  }, [hasMultipleImages, displayImages.length]);

  const showPrevious = () => {
    setActiveIndex((currentIndex) => (currentIndex - 1 + displayImages.length) % displayImages.length);
  };

  const showNext = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % displayImages.length);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" && hasMultipleImages) {
      event.preventDefault();
      showPrevious();
    }

    if (event.key === "ArrowRight" && hasMultipleImages) {
      event.preventDefault();
      showNext();
    }
  };

  if (displayImages.length === 0) {
    return (
      <div className="case-image-empty" aria-label={`Image placeholder for ${title}`}>
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
      <div className="case-carousel-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {displayImages.map((image) => (
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            className="case-carousel-image"
            loading="lazy"
            onError={() => setFailedImages((current) => new Set(current).add(image.src))}
          />
        ))}
      </div>
      {activeImage?.caption ? <p className="case-carousel-caption">{activeImage.caption}</p> : null}

      {hasMultipleImages ? (
        <>
          <button className="case-carousel-button previous" type="button" onClick={showPrevious} aria-label={`Show previous image for ${title}`}>
            ‹
          </button>
          <button className="case-carousel-button next" type="button" onClick={showNext} aria-label={`Show next image for ${title}`}>
            ›
          </button>
        </>
      ) : null}
      {hasMultipleImages ? (
        <div className="case-carousel-dots" aria-label={`${title} image selector`}>
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
