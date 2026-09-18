"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

export function HeroSeahorse() {
  const reduce = useReducedMotion();

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        aria-hidden
        className="absolute inset-[8%] rounded-full bg-[#070b10] opacity-90 blur-xl dark:hidden"
      />
      <div
        aria-hidden
        className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,var(--glow),transparent_68%)] blur-2xl"
      />
      <motion.div
        className="relative h-full w-full max-w-[520px]"
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={
          reduce
            ? undefined
            : { duration: 7, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <Image
          src="/brand/hero-seahorse.png"
          alt="A lost seahorse"
          width={980}
          height={980}
          priority
          sizes="(min-width: 1024px) 520px, 80vw"
          className="h-full w-full object-contain dark:mix-blend-screen"
        />
      </motion.div>
    </div>
  );
}
