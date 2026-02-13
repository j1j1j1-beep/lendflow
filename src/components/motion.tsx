"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  type Variants,
  type Transition,
  useInView,
} from "framer-motion";

// ---------------------------------------------------------------------------
// Fade-in with optional direction
// ---------------------------------------------------------------------------

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  once?: boolean; // only animate once (default true)
}

const directionOffset = (dir: FadeInProps["direction"], dist: number) => {
  switch (dir) {
    case "up":
      return { y: dist };
    case "down":
      return { y: -dist };
    case "left":
      return { x: dist };
    case "right":
      return { x: -dist };
    default:
      return {};
  }
};

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.4,
  direction = "up",
  distance = 12,
  once = true,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...directionOffset(direction, distance) }}
      animate={
        inView
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, ...directionOffset(direction, distance) }
      }
      transition={{
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Stagger children container
// ---------------------------------------------------------------------------

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  duration?: number;
  once?: boolean;
}

const staggerVariants = (
  direction: StaggerProps["direction"],
  distance: number,
  duration: number,
): { container: Variants; item: Variants } => ({
  container: {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.06, delayChildren: 0 },
    },
  },
  item: {
    hidden: {
      opacity: 0,
      ...directionOffset(direction, distance),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  },
});

export function Stagger({
  children,
  className,
  staggerDelay = 0.06,
  initialDelay = 0,
  direction = "up",
  distance = 12,
  duration = 0.35,
  once = true,
}: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-20px" });

  const variants = staggerVariants(direction, distance, duration);
  // Override stagger delay
  (variants.container.visible as { transition: Transition }).transition = {
    staggerChildren: staggerDelay,
    delayChildren: initialDelay,
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants.container}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  direction = "up",
  distance = 12,
  duration = 0.35,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  duration?: number;
}) {
  const variants = staggerVariants(direction, distance, duration);
  return (
    <motion.div className={className} variants={variants.item}>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Animated counter (count-up effect)
// ---------------------------------------------------------------------------

interface CountUpProps {
  to: number;
  duration?: number;
  delay?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  separator?: boolean;
}

export function CountUp({
  to,
  duration = 1.2,
  delay = 0,
  className,
  prefix = "",
  suffix = "",
  separator = true,
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now() + delay * 1000;
    const endTime = startTime + duration * 1000;

    function tick(now: number) {
      if (now < startTime) {
        requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min((now - startTime) / (endTime - startTime), 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [inView, to, duration, delay]);

  const formatted = separator ? value.toLocaleString("en-US") : String(value);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Scale-in effect (for icons, avatars, empty states)
// ---------------------------------------------------------------------------

export function ScaleIn({
  children,
  className,
  delay = 0,
  duration = 0.4,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration,
        delay,
        ease: [0.34, 1.56, 0.64, 1], // spring-like overshoot
      }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Animate presence wrapper (for conditional content)
// ---------------------------------------------------------------------------

export function AnimatedPresence({
  children,
  show,
  className,
}: {
  children: React.ReactNode;
  show: boolean;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={className}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// List item animation (for staggered lists like recent activity)
// ---------------------------------------------------------------------------

export function AnimatedListItem({
  children,
  className,
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.04,
        ease: [0.25, 0.4, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// Re-export motion for direct use
export { motion, AnimatePresence };
