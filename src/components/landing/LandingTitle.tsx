"use client";

import { motion } from "framer-motion";

export function LandingTitle() {
  return (
    <div className="pointer-events-none relative z-10 flex flex-col items-center px-4 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="font-display text-4xl font-semibold tracking-[0.18em] text-white sm:text-5xl md:text-6xl lg:text-7xl"
      >
        <span className="bg-gradient-to-b from-white via-cyan-50 to-cyan-200/90 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(103,232,249,0.25)]">
          LOSTSEAHORSE
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3 max-w-md text-sm font-light tracking-wide text-cyan-100/65 sm:mt-4 sm:text-base"
      >
        Protect the lost seahorse with your typing.
      </motion.p>
    </div>
  );
}
