/**
 * Animation Hooks
 * Custom hooks for common animation patterns
 */

import { useEffect, useRef } from 'react';
import { useInView, useAnimation, AnimationControls } from 'framer-motion';

// ============================================================================
// Scroll Animations
// ============================================================================

/**
 * Hook to animate element when it enters viewport
 */
export function useScrollAnimation(options?: {
  once?: boolean;
  margin?: string;
  amount?: 'some' | 'all' | number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: options?.once ?? true,
    margin: options?.margin ?? '-100px',
    amount: options?.amount ?? 0.3,
  });

  return { ref, isInView };
}

/**
 * Hook to trigger animation when element enters viewport
 */
export function useScrollTrigger(options?: {
  once?: boolean;
  margin?: string;
  amount?: 'some' | 'all' | number;
}): [React.RefObject<any>, AnimationControls] {
  const ref = useRef(null);
  const controls = useAnimation();
  const isInView = useInView(ref, {
    once: options?.once ?? true,
    margin: options?.margin ?? '-100px',
    amount: options?.amount ?? 0.3,
  });

  useEffect(() => {
    if (isInView) {
      controls.start('animate');
    } else if (!options?.once) {
      controls.start('initial');
    }
  }, [isInView, controls, options?.once]);

  return [ref, controls];
}

// ============================================================================
// Stagger Animations
// ============================================================================

/**
 * Hook to create staggered animations for list items
 */
export function useStaggerAnimation(delay: number = 0.1) {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (isInView) {
      controls.start((i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
          delay: i * delay,
          duration: 0.3,
        },
      }));
    }
  }, [isInView, controls, delay]);

  return { ref, controls };
}

// ============================================================================
// Number Counter Animation
// ============================================================================

/**
 * Hook to animate number counting
 */
export function useCountAnimation(
  target: number,
  duration: number = 2000,
  enabled: boolean = true
) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || !enabled) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function (ease-out)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(target * easeOutQuart));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [target, duration, isInView, enabled]);

  return { ref, count };
}

// ============================================================================
// Hover Animation
// ============================================================================

/**
 * Hook for hover state management
 */
export function useHoverAnimation() {
  const [isHovered, setIsHovered] = useState(false);

  const hoverHandlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return { isHovered, hoverHandlers };
}

// ============================================================================
// Reduced Motion
// ============================================================================

/**
 * Hook to detect user's motion preference
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Get animation variants respecting reduced motion preference
 */
export function useAnimationVariants<T extends Record<string, any>>(
  variants: T
): T | Record<string, any> {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    // Return simplified variants with no animation
    return Object.keys(variants).reduce((acc, key) => {
      acc[key] = { transition: { duration: 0 } };
      return acc;
    }, {} as Record<string, any>);
  }

  return variants;
}

// ============================================================================
// Page Transition
// ============================================================================

/**
 * Hook for page transition state
 */
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = () => setIsTransitioning(true);
  const endTransition = () => setIsTransitioning(false);

  return {
    isTransitioning,
    startTransition,
    endTransition,
  };
}

// ============================================================================
// Parallax Effect
// ============================================================================

/**
 * Hook for parallax scrolling effect
 */
export function useParallax(speed: number = 0.5) {
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const elementTop = rect.top + scrolled;
      const viewportHeight = window.innerHeight;

      // Calculate offset only when element is in view
      if (scrolled + viewportHeight > elementTop && scrolled < elementTop + rect.height) {
        const offset = (scrolled - elementTop) * speed;
        setOffset(offset);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { ref, offset };
}

// ============================================================================
// Sequential Animation
// ============================================================================

/**
 * Hook for sequential animations
 */
export function useSequentialAnimation(steps: number, interval: number = 200) {
  const [currentStep, setCurrentStep] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const timers: NodeJS.Timeout[] = [];

    for (let i = 0; i <= steps; i++) {
      const timer = setTimeout(() => {
        setCurrentStep(i);
      }, i * interval);
      timers.push(timer);
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [isInView, steps, interval]);

  return { ref, currentStep, isComplete: currentStep >= steps };
}

// ============================================================================
// Mouse Follow
// ============================================================================

/**
 * Hook to make element follow mouse cursor
 */
export function useMouseFollow(smoothness: number = 0.1) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const targetPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number>();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetPosition.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      setPosition((prev) => ({
        x: prev.x + (targetPosition.current.x - prev.x) * smoothness,
        y: prev.y + (targetPosition.current.y - prev.y) * smoothness,
      }));

      animationFrame.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [smoothness]);

  return position;
}

// ============================================================================
// Typewriter Effect
// ============================================================================

/**
 * Hook for typewriter text effect
 */
export function useTypewriter(text: string, speed: number = 50, enabled: boolean = true) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDisplayText(text);
      setIsComplete(true);
      return;
    }

    let currentIndex = 0;
    setDisplayText('');
    setIsComplete(false);

    const timer = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, enabled]);

  return { displayText, isComplete };
}

// ============================================================================
// Helper Imports
// ============================================================================

import { useState } from 'react';
