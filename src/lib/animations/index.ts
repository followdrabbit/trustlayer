/**
 * Animations System
 * Comprehensive animation utilities using Framer Motion
 */

// Export all variants
export * from './variants';

// Export all hooks
export * from './hooks';

// Export all components
export * from './components';

// Re-export commonly used items for convenience
export {
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  scaleUp,
  pageTransition,
  staggerContainer,
  staggerItem,
  cardHover,
  modalContent,
  buttonTap,
} from './variants';

export {
  useScrollAnimation,
  useScrollTrigger,
  useStaggerAnimation,
  useCountAnimation,
  useHoverAnimation,
  useReducedMotion,
  useAnimationVariants,
} from './hooks';

export {
  FadeIn,
  FadeInUp,
  ScaleIn,
  ScrollReveal,
  ScrollTrigger,
  StaggerList,
  StaggerItem,
  PageTransition,
  AnimatedPresenceWrapper,
  HoverScale,
  HoverLift,
  LoadingDots,
  LoadingSpinner,
  CountUp,
  AnimatedProgress,
  Collapse,
  Shimmer,
  Pulse,
  Floating,
  BounceIn,
  SlideIn,
} from './components';
