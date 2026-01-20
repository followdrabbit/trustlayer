/**
 * Animated Components
 * Reusable animated components built with Framer Motion
 */

import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import {
  fadeIn,
  fadeInUp,
  scaleIn,
  staggerContainer,
  staggerItem,
  pageTransition,
} from './variants';
import { useScrollAnimation, useScrollTrigger } from './hooks';

// ============================================================================
// Animated Wrappers
// ============================================================================

interface AnimatedDivProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
}

/**
 * Basic animated div with fade in
 */
export function FadeIn({ children, delay = 0, ...props }: AnimatedDivProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated div that fades in from bottom
 */
export function FadeInUp({ children, delay = 0, ...props }: AnimatedDivProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated div that scales in
 */
export function ScaleIn({ children, delay = 0, ...props }: AnimatedDivProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={scaleIn}
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Scroll Animations
// ============================================================================

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  once?: boolean;
  margin?: string;
  amount?: 'some' | 'all' | number;
}

/**
 * Component that reveals content on scroll
 */
export function ScrollReveal({
  children,
  className,
  once = true,
  margin = '-100px',
  amount = 0.3,
}: ScrollRevealProps) {
  const { ref, isInView } = useScrollAnimation({ once, margin, amount });

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={isInView ? 'animate' : 'initial'}
      variants={fadeInUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Component that reveals content with custom animation on scroll
 */
export function ScrollTrigger({
  children,
  className,
  once = true,
  variants = fadeInUp,
}: ScrollRevealProps & { variants?: any }) {
  const [ref, controls] = useScrollTrigger({ once });

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={controls}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Stagger Animations
// ============================================================================

interface StaggerListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

/**
 * Container for staggered list animations
 */
export function StaggerList({
  children,
  className,
  staggerDelay = 0.1,
}: StaggerListProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        ...staggerContainer,
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Item for staggered list
 */
export function StaggerItem({ children, className, ...props }: AnimatedDivProps) {
  return (
    <motion.div variants={staggerItem} className={className} {...props}>
      {children}
    </motion.div>
  );
}

// ============================================================================
// Page Transitions
// ============================================================================

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page transition wrapper
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Presence Animations
// ============================================================================

interface AnimatedPresenceWrapperProps {
  children: ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
  initial?: boolean;
}

/**
 * Wrapper for AnimatePresence with common defaults
 */
export function AnimatedPresenceWrapper({
  children,
  mode = 'wait',
  initial = true,
}: AnimatedPresenceWrapperProps) {
  return (
    <AnimatePresence mode={mode} initial={initial}>
      {children}
    </AnimatePresence>
  );
}

// ============================================================================
// Hover Effects
// ============================================================================

interface HoverScaleProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  scale?: number;
}

/**
 * Component that scales on hover
 */
export function HoverScale({
  children,
  scale = 1.05,
  ...props
}: HoverScaleProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: scale * 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Component that lifts on hover (adds shadow effect)
 */
export function HoverLift({ children, className, ...props }: AnimatedDivProps) {
  return (
    <motion.div
      whileHover={{
        y: -5,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 10,
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Loading Animations
// ============================================================================

interface LoadingDotsProps {
  className?: string;
  dotClassName?: string;
}

/**
 * Animated loading dots
 */
export function LoadingDots({ className, dotClassName }: LoadingDotsProps) {
  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: [-5, 0, -5],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className={`flex gap-1 ${className || ''}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: i * 0.15 }}
          className={`w-2 h-2 bg-current rounded-full ${dotClassName || ''}`}
        />
      ))}
    </div>
  );
}

/**
 * Animated loading spinner
 */
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      className={className}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          strokeOpacity="0.2"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

// ============================================================================
// Count Up Animation
// ============================================================================

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * Animated number count up
 */
export function CountUp({
  value,
  duration = 2,
  className,
  prefix = '',
  suffix = '',
}: CountUpProps) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      <motion.span
        initial={{ value: 0 }}
        animate={{ value }}
        transition={{ duration, ease: 'easeOut' }}
      >
        {({ value: animatedValue }) =>
          `${prefix}${Math.floor(animatedValue)}${suffix}`
        }
      </motion.span>
    </motion.span>
  );
}

// ============================================================================
// Progress Bar
// ============================================================================

interface AnimatedProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
  duration?: number;
}

/**
 * Animated progress bar
 */
export function AnimatedProgress({
  value,
  className,
  barClassName,
  duration = 0.5,
}: AnimatedProgressProps) {
  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${className || ''}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration, ease: 'easeOut' }}
        className={`h-full bg-primary rounded-full ${barClassName || ''}`}
      />
    </div>
  );
}

// ============================================================================
// Collapse/Expand
// ============================================================================

interface CollapseProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Animated collapse/expand container
 */
export function Collapse({ isOpen, children, className }: CollapseProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: 'auto',
            opacity: 1,
            transition: {
              height: {
                duration: 0.3,
              },
              opacity: {
                duration: 0.2,
                delay: 0.1,
              },
            },
          }}
          exit={{
            height: 0,
            opacity: 0,
            transition: {
              height: {
                duration: 0.3,
              },
              opacity: {
                duration: 0.2,
              },
            },
          }}
          className={`overflow-hidden ${className || ''}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Shimmer Effect
// ============================================================================

interface ShimmerProps {
  className?: string;
}

/**
 * Shimmer loading effect
 */
export function Shimmer({ className }: ShimmerProps) {
  return (
    <motion.div
      animate={{
        backgroundPosition: ['0% 0%', '100% 0%'],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        background:
          'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
      }}
      className={`absolute inset-0 ${className || ''}`}
    />
  );
}

// ============================================================================
// Pulse Effect
// ============================================================================

interface PulseProps {
  children: ReactNode;
  className?: string;
}

/**
 * Pulse animation effect
 */
export function Pulse({ children, className }: PulseProps) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Floating Effect
// ============================================================================

interface FloatingProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
}

/**
 * Floating animation effect
 */
export function Floating({
  children,
  className,
  duration = 3,
  distance = 10,
}: FloatingProps) {
  return (
    <motion.div
      animate={{
        y: [-distance, distance, -distance],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Bounce In
// ============================================================================

interface BounceInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Bounce in animation
 */
export function BounceIn({ children, className, delay = 0 }: BounceInProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Slide In
// ============================================================================

interface SlideInProps {
  children: ReactNode;
  className?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
}

/**
 * Slide in from direction
 */
export function SlideIn({
  children,
  className,
  direction = 'left',
  delay = 0,
}: SlideInProps) {
  const directionMap = {
    left: { x: -100, y: 0 },
    right: { x: 100, y: 0 },
    up: { x: 0, y: -100 },
    down: { x: 0, y: 100 },
  };

  return (
    <motion.div
      initial={{ ...directionMap[direction], opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
