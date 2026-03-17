"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FLOATING_STARS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  size: 4 + Math.random() * 8,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: 0.4 + Math.random() * 2,
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
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        >
          {/* Gradient background - animates in with scale */}
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-950"
            aria-hidden
          />

          {/* Floating stars - pop in, then float */}
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
                  boxShadow: "0 0 12px 2px rgba(253, 224, 71, 0.5)"
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: star.opacity,
                  scale: 1,
                  y: [0, -14, 0]
                }}
                transition={{
                  opacity: { duration: 0.6, delay: star.delay * 0.25 },
                  scale: { type: "spring", stiffness: 400, damping: 15, delay: star.delay * 0.15 },
                  y: {
                    duration: star.duration,
                    delay: star.delay + 0.3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              />
            ))}
          </div>

          {/* Center panel - bouncy entrance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 40 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 260,
                damping: 20,
                mass: 0.8
              }
            }}
            exit={{
              opacity: 0,
              scale: 0.92,
              y: 0,
              transition: { duration: 0.25 }
            }}
            className="relative z-10 mx-4 w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
          >
            {/* Success icon - pop in with bounce */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: 1,
                rotate: 0,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 12,
                  delay: 0.15
                }
              }}
              className="mb-6 flex justify-center"
            >
              <motion.span
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl sm:text-7xl"
                role="img"
                aria-label="Success"
              >
                🎉
              </motion.span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
              className="mb-3 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              {title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.35 }}
              className="mb-8 text-center text-sm leading-relaxed text-white/85 sm:text-base"
            >
              {message}
            </motion.p>

            <motion.button
              type="button"
              onClick={handleClose}
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: 0.4, type: "spring", stiffness: 300, damping: 22 }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
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
