import { motion } from "framer-motion";

interface Props {
  className?: string;
  variant?: "hero" | "soft" | "corner";
}

/**
 * Animated ambient background — 3 drifting gradient orbs.
 * Purely decorative, pointer-events-none, respects reduced motion via css.
 */
const SunsetOrbs = ({ className = "", variant = "hero" }: Props) => {
  const opacity = variant === "soft" ? 0.35 : variant === "corner" ? 0.5 : 0.7;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      <motion.div
        className="absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl"
        style={{ background: "hsl(18 100% 60% / 0.55)" }}
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-20 w-80 h-80 rounded-full blur-3xl"
        style={{ background: "hsl(330 78% 58% / 0.5)" }}
        animate={{ x: [0, -25, 20, 0], y: [0, 25, -15, 0], scale: [1, 0.95, 1.1, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-24 left-1/4 w-72 h-72 rounded-full blur-3xl"
        style={{ background: "hsl(252 76% 66% / 0.45)" }}
        animate={{ x: [0, 20, -30, 0], y: [0, -15, 20, 0], scale: [1, 1.05, 0.9, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

export default SunsetOrbs;