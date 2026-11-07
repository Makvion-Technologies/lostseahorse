"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import type { StyleId } from "@/lib/types";

/** Vector seahorse tinted with a racer's colour and decorated per style. */
export function SeahorseGlyph({
  color,
  style = "kelp",
  className,
  animate = true,
  title,
}: {
  color: string;
  style?: StyleId;
  className?: string;
  animate?: boolean;
  title?: string;
}) {
  const id = useId().replace(/:/g, "");
  const body = `sh-body-${id}`;
  const sheen = `sh-sheen-${id}`;
  const glow = `sh-glow-${id}`;
  const second =
    style === "dusk"
      ? "#6b3fa0"
      : style === "pearl"
        ? "#f6f1e7"
        : `color-mix(in oklab, ${color} 55%, #04121a)`;

  return (
    <svg
      viewBox="0 0 120 160"
      className={cn("overflow-visible", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={body} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={second} />
        </linearGradient>
        <radialGradient id={sheen} cx="0.35" cy="0.25" r="0.6">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* dorsal fin */}
      <path
        className={cn(animate && "sh-fin")}
        d="M41 66 C27 60 22 76 28 88 C32 85 36 83 40 83 Z"
        fill={color}
        opacity="0.55"
      />
      <path
        d="M30 70 L39 74 M28 76 L39 78 M29 82 L39 81"
        stroke="#fff"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* tail */}
      <path
        d="M50 114 C44 128 44 142 55 147 C66 151 72 139 64 134 C58 131 53 136 57 140"
        fill="none"
        stroke={`url(#${body})`}
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* crown */}
      <path d="M50 15 L47 4 L55 11 L60 2 L62 12 Z" fill={color} />

      {/* head + body */}
      <path
        d="M50 14 C62 8 76 14 78 26 L95 29 C100 30 100 37 95 38 L77 40 C73 47 67 50 66 54 C76 62 81 76 77 92 C74 104 64 112 56 118 L44 117 C44 106 40 96 38 84 C36 70 40 60 46 52 C40 46 38 38 40 30 C42 22 45 17 50 14 Z"
        fill={`url(#${body})`}
      />
      <path
        d="M50 14 C62 8 76 14 78 26 L95 29 C100 30 100 37 95 38 L77 40 C73 47 67 50 66 54 C76 62 81 76 77 92 C74 104 64 112 56 118 L44 117 C44 106 40 96 38 84 C36 70 40 60 46 52 C40 46 38 38 40 30 C42 22 45 17 50 14 Z"
        fill={`url(#${sheen})`}
      />

      {/* belly ridges */}
      <path
        d="M67 60 Q73 62 75 66 M70 70 Q76 72 77 76 M70 80 Q76 82 76 86 M68 90 Q73 92 72 96 M64 99 Q68 101 66 105 M59 107 Q62 109 60 113"
        fill="none"
        stroke={style === "kelp" || style === "drift" ? second : "#fff"}
        strokeOpacity={style === "kelp" ? 0.9 : 0.35}
        strokeWidth={style === "drift" ? 2.4 : 1.6}
        strokeDasharray={style === "drift" ? "1 3" : undefined}
        strokeLinecap="round"
      />

      {style === "foam" ? (
        <g fill="#fff" opacity="0.7">
          <circle cx="50" cy="40" r="2" />
          <circle cx="47" cy="62" r="2.6" />
          <circle cx="54" cy="78" r="1.8" />
          <circle cx="48" cy="96" r="2.2" />
          <circle cx="58" cy="30" r="1.4" />
        </g>
      ) : null}

      {style === "pearl" ? (
        <circle cx="56" cy="74" r="5" fill="#fff" opacity="0.85" />
      ) : null}

      {style === "lantern" ? (
        <g filter={`url(#${glow})`}>
          <path
            d="M60 3 C66 -6 78 -6 82 2"
            fill="none"
            stroke={color}
            strokeWidth="1.6"
          />
          <circle
            className={cn(animate && "sh-lantern")}
            cx="83"
            cy="5"
            r="4.5"
            fill="#ffe7a3"
          />
        </g>
      ) : null}

      {/* eye */}
      <circle cx="64" cy="26" r="4.6" fill="#fff" />
      <circle cx="65.2" cy="26" r="2.4" fill="#06131b" />
      <circle cx="66" cy="25" r="0.9" fill="#fff" />
    </svg>
  );
}
