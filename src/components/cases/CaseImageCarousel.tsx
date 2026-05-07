import { useEffect, useState } from "react";
import type { CaseStoryImage } from "../../types/stats";

interface CaseImageCarouselProps {
  images: CaseStoryImage[];
  title: string;
}

export const CaseImageCarousel = ({ images, title }: CaseImageCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    setActiveIndex(0);
  }, [images, title]);

  useEffect(() => {
    if (!hasMultipleImages) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % images.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [hasMultipleImages, images.length]);

  const showPrevious = () => {
    setActiveIndex((currentIndex) => (currentIndex - 1 + images.length) % images.length);
  };

  const showNext = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % images.length);
  };

  if (images.length === 0) {
    return (
      <div className="case-image-empty" aria-label={`Image placeholder for ${title}`}>
        <span>Case images can be added here</span>
      </div>
    );
  }

  return (
    <div className="case-carousel" aria-label={`${title} image gallery`}>
      <div className="case-carousel-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
        {images.map((image) => (
          <img key={image.src} src={image.src} alt={image.alt} className="case-carousel-image" />
        ))}
      </div>

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
          {images.map((image, index) => (
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
