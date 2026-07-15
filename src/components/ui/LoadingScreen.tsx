"use client";

import { motion } from "framer-motion";

interface LoadingScreenProps {
  /** 0–1 progress when known; otherwise indeterminate pulse */
  progress?: number;
  label?: string;
}

/**
 * Full-screen loading shell while assets / audio / 3D init.
 */
export function LoadingScreen({
  progress,
  label = "Diving in…",
}: LoadingScreenProps) {
  const known = typeof progress === "number";
  const pct = known ? Math.round(Math.min(1, Math.max(0, progress)) * 100) : null;

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#021018]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="ocean-gradient pointer-events-none absolute inset-0 opacity-80" />
      <div className="ocean-vignette pointer-events-none absolute inset-0" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-6 px-6"
      >
        <div className="relative">
          <motion.div
            className="h-16 w-16 rounded-full border border-cyan-300/30 bg-cyan-400/10 shadow-[0_0_40px_-4px_rgba(34,211,238,0.45)]"
            animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border border-teal-300/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="text-center">
          <p className="font-display text-lg font-medium tracking-[0.18em] text-cyan-50/90 uppercase">
            LostSeahorse
          </p>
          <p className="mt-2 text-sm text-cyan-200/55">{label}</p>
        </div>

        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
          {known ? (
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-teal-400/80 to-cyan-300/90"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.25 }}
            />
          ) : (
            <motion.div
              className="h-full w-1/3 rounded-full bg-gradient-to-r from-teal-400/80 to-cyan-300/90"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>

        {pct != null && (
          <p className="font-mono text-[10px] text-cyan-300/50">{pct}%</p>
        )}
      </motion.div>
    </div>
  );
}
