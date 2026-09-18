"use client";

import { useReducedMotion } from "motion/react";

const BUBBLES = [
  { left: "8%", size: 6, dur: "18s", delay: "0s", drift: "18px" },
  { left: "18%", size: 4, dur: "22s", delay: "4s", drift: "-12px" },
  { left: "36%", size: 7, dur: "26s", delay: "8s", drift: "10px" },
  { left: "58%", size: 5, dur: "20s", delay: "2s", drift: "-16px" },
  { left: "72%", size: 3, dur: "16s", delay: "6s", drift: "8px" },
  { left: "88%", size: 6, dur: "24s", delay: "10s", drift: "-20px" },
];

export function OceanBackground() {
  const reduce = useReducedMotion();

  return (
    <div className="ocean-root pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="ocean-wash absolute inset-0" />
      <div className="ocean-caustic absolute inset-0" />
      <div className="ocean-rays absolute -inset-16" />
      <div className="ocean-grain absolute inset-0" />
      {!reduce
        ? BUBBLES.map((bubble) => (
            <span
              key={bubble.left}
              className="bubble absolute bottom-0"
              style={{
                left: bubble.left,
                width: bubble.size,
                height: bubble.size,
                ["--dur" as string]: bubble.dur,
                ["--delay" as string]: bubble.delay,
                ["--drift" as string]: bubble.drift,
              }}
            />
          ))
        : null}
    </div>
  );
}
