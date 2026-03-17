"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FLOATING_STARS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  size: 4 + Math.random() * 8,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: Math.random() * 3,
  duration: 2 + Math.random() * 4,
  opacity: 0.3 + Math.random() * 0.5
}));

/**
 * Premium full-screen celebration overlay.
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {string} props.title - e.g. "Congratulations!"
 * @param {string} props.message - Supporting text
 * @param {string} [props.buttonText="Continue"]
 * @param {function} props.onClose
 * @param {number} [props.autoCloseDelay] - Auto-close after ms (optional)
 */
export function CelebrationOverlay({
  isOpen,
  title,
  message,
  buttonText = "Continue",
  onClose,
  autoCloseDelay
}) {
  const handleClose = useCallback(() => {
    if (typeof onClose === "function") onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !autoCloseDelay || typeof onClose !== "function") return;
    const t = setTimeout(handleClose, autoCloseDelay);
    return () => clearTimeout(t);
  }, [isOpen, autoCloseDelay, onClose, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        >
          {/* Gradient background */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-950"
            aria-hidden
          />

          {/* Floating stars / particles */}
          <div className="pointer-events-none absolute inset-0">
            {FLOATING_STARS.map((star) => (
              <motion.div
                key={star.id}
                className="absolute rounded-full bg-amber-300"
                style={{
                  width: star.size,
                  height: star.size,
                  left: star.left,
                  top: star.top,
                  opacity: star.opacity,
                  boxShadow: "0 0 12px 2px rgba(253, 224, 71, 0.5)"
                }}
                animate={{
                  y: [0, -12, 0],
                  opacity: [star.opacity * 0.6, star.opacity, star.opacity * 0.6],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: star.duration,
                  delay: star.delay,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          {/* Center panel - glassmorphism */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24
            }}
            className="relative z-10 mx-4 w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
          >
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 12 }}
              className="mb-6 flex justify-center"
            >
              <motion.span
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl sm:text-7xl"
                role="img"
                aria-label="Success"
              >
                🎉
              </motion.span>
            </motion.div>

            <h2 className="mb-3 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h2>
            <p className="mb-8 text-center text-sm leading-relaxed text-white/85 sm:text-base">
              {message}
            </p>

            <motion.button
              type="button"
              onClick={handleClose}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="mx-auto flex w-full max-w-[200px] items-center justify-center rounded-2xl bg-amber-400 px-6 py-3.5 text-base font-semibold text-slate-900 shadow-[0_0_24px_rgba(253,224,71,0.4)] transition-shadow hover:shadow-[0_0_32px_rgba(253,224,71,0.55)]"
            >
              {buttonText}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
