import { useEffect, useRef, useState } from 'react';

/**
 * Hook for auto-scrolling content with manual scroll detection
 * @param content - The content being streamed (triggers scroll when changed)
 * @param threshold - Distance from bottom (px) to consider "at bottom" (default: 50)
 */
export function useAutoScroll<T>(content: T, threshold = 50) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Check if user scrolled up manually
      if (scrollTop < lastScrollTop.current && distanceFromBottom > threshold) {
        setIsUserScrolling(true);
      }

      // Check if user scrolled back to bottom
      if (distanceFromBottom <= threshold) {
        setIsUserScrolling(false);
      }

      lastScrollTop.current = scrollTop;
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  // Auto-scroll when content changes (unless user is manually scrolling)
  useEffect(() => {
    if (!scrollRef.current || isUserScrolling) return;

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [content, isUserScrolling]);

  return { scrollRef, isUserScrolling };
}
