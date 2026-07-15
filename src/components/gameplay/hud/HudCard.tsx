"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface HudCardProps {
  label: string;
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

/**
 * Glassmorphism HUD chip — ocean aesthetic, never loud.
 */
export function HudCard({
  label,
  children,
  className,
  align = "left",
}: HudCardProps) {
  return (
    <div
      className={cn(
        "hud-card rounded-2xl border border-white/10 bg-slate-950/40 px-3.5 py-2.5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.55)]",
        "backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/30",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
    >
      <p className="text-[9px] font-medium tracking-[0.18em] text-cyan-100/45 uppercase sm:text-[10px]">
        {label}
      </p>
      <div className="mt-0.5 font-display text-lg font-medium tracking-wide text-cyan-50/90 sm:text-xl">
        {children}
      </div>
    </div>
  );
}
