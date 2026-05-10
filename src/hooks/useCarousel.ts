import { useEffect, useState, type KeyboardEvent } from "react";

interface CarouselOptions {
  itemCount: number;
  resetKey?: unknown;
  autoAdvanceMs?: number;
}

export const useCarousel = ({
  itemCount,
  resetKey,
  autoAdvanceMs,
}: CarouselOptions) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleItems = itemCount > 1;

  useEffect(() => {
    setActiveIndex(0);
  }, [resetKey]);

  useEffect(() => {
    if (activeIndex > itemCount - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, itemCount]);

  useEffect(() => {
    if (!autoAdvanceMs || !hasMultipleItems) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % itemCount);
    }, autoAdvanceMs);

    return () => window.clearInterval(intervalId);
  }, [autoAdvanceMs, hasMultipleItems, itemCount]);

  const showPrevious = () => {
    if (itemCount === 0) {
      return;
    }

    setActiveIndex(
      (currentIndex) => (currentIndex - 1 + itemCount) % itemCount,
    );
  };

  const showNext = () => {
    if (itemCount === 0) {
      return;
    }

    setActiveIndex((currentIndex) => (currentIndex + 1) % itemCount);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" && hasMultipleItems) {
      event.preventDefault();
      showPrevious();
    }

    if (event.key === "ArrowRight" && hasMultipleItems) {
      event.preventDefault();
      showNext();
    }
  };

  return {
    activeIndex,
    setActiveIndex,
    hasMultipleItems,
    showPrevious,
    showNext,
    handleKeyDown,
  };
};
