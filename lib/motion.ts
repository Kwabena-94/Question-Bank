/**
 * Centralized motion tokens for MedCognito.
 *
 * Rules (enforced by the medcognito-motion-reviewer skill):
 *   - Components MUST import springs/tweens/variants from this file — never
 *     inline stiffness, damping, duration, or ease values.
 *   - Components MUST call `useMotionTransition()` and pass the result as the
 *     `transition` prop, so users with `prefers-reduced-motion` get an instant
 *     fallback automatically.
 *   - Conditionally rendered animated elements MUST be wrapped in
 *     `<AnimatePresence>`.
 */

import { useReducedMotion, type Transition, type Variants } from "framer-motion";

/* ── Springs ────────────────────────────────────────────────────────────── */

/** Buttons, toggles, tap feedback, tab indicators. Crisp + immediate. */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.8,
};

/** Cards entering, modals, drawers, sheets. Default for most UI surfaces. */
export const springSmooth: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 28,
  mass: 1.0,
};

/** Celebrations, correct-answer reveals, achievements. Slight overshoot. */
export const springBouncy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 18,
  mass: 0.9,
};

/** Page sections, large layout shifts. Slow, weighty. */
export const springGentle: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 24,
  mass: 1.2,
};

/* ── Tweens ─────────────────────────────────────────────────────────────── */

/** ease-out-expo — fast start, graceful settle. */
const easeOutExpo = [0.16, 1, 0.3, 1] as const;

/** 150ms — opacity, color, exit. */
export const tweenFast: Transition = {
  type: "tween",
  duration: 0.15,
  ease: easeOutExpo,
};

/** 250ms — standard enter. */
export const tweenSmooth: Transition = {
  type: "tween",
  duration: 0.25,
  ease: easeOutExpo,
};

/** 400ms — slow reveals. */
export const tweenSlow: Transition = {
  type: "tween",
  duration: 0.4,
  ease: easeOutExpo,
};

/** Reduced-motion fallback — never skip this. */
export const instantTransition: Transition = {
  duration: 0,
};

/** Decorative pulse-ring loop for celebrations (e.g. completion screen). */
export const pulseRing: Transition = {
  repeat: 2,
  duration: 1.2,
};

/* ── Variants ───────────────────────────────────────────────────────────── */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 32 },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export const answerOption: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
};

export const correctReveal: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

/** Card flip face transform — used as `variants` on the inner flip container. */
export const flipFace: Variants = {
  hidden: { rotateY: 0 },
  flipped: { rotateY: 180 },
};

/* ── Reduced-motion hook ────────────────────────────────────────────────── */

/**
 * Returns the supplied `normal` transition unless the user has
 * `prefers-reduced-motion: reduce`, in which case it returns an instant
 * transition (or a custom `reduced` fallback if you pass one).
 *
 * Always wrap the transition you'd pass to a `motion.*` component in this hook.
 *
 * ```tsx
 * const transition = useMotionTransition(springSmooth);
 * <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={transition} />
 * ```
 */
export function useMotionTransition(normal: Transition, reduced?: Transition): Transition {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? reduced ?? instantTransition : normal;
}
