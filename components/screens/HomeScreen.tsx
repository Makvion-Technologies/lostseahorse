"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { HeroSeahorse } from "@/components/seahorse/HeroSeahorse";

const DOORS = [
  {
    href: "/solo",
    title: "Solo",
    copy: "Instant. No one watching.",
  },
  {
    href: "/race",
    title: "Stranger",
    copy: "Someone in your current. Or the kelp will send one.",
  },
  {
    href: "/friends",
    title: "Friends",
    copy: "A room with a link. Same water.",
  },
];

export function HomeScreen() {
  const reduce = useReducedMotion();

  return (
    <div className="grid w-full items-center justify-items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:justify-items-stretch">
      <div className="w-full max-w-xl text-center lg:text-left">
        <p className="font-display text-5xl italic leading-[1.05] sm:text-7xl">
          lost seahorse
        </p>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted lg:mx-0">
          Type. Race. Feed your seahorse.
        </p>
        <div className="mt-12 grid gap-4">
          {DOORS.map((door, i) => (
            <motion.div
              key={door.href}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduce ? 0 : 0.08 * i,
                duration: reduce ? 0 : 0.4,
              }}
            >
              <Link
                href={door.href}
                className="block rounded-3xl border border-line bg-card/60 px-6 py-5 transition-colors hover:bg-card"
              >
                <p className="font-display text-2xl italic">{door.title}</p>
                <p className="mt-1 text-sm text-muted">{door.copy}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="flex w-full items-center justify-center">
        <div className="aspect-square w-full max-w-[min(32rem,70vh)]">
          <HeroSeahorse />
        </div>
      </div>
    </div>
  );
}
