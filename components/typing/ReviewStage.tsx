"use client";

import { useEffect, useState } from "react";
import { SheetCloseButton } from "@/components/results/ResultsPoster";
import { typingColumnWidth } from "@/components/site/SiteShell";
import { formatClock } from "@/lib/formatTime";
import type { GoalMode, Level } from "@/lib/types";
import type { TypedWord } from "@/lib/runStats";

function WordView({ expected, typed }: TypedWord) {
  const extra = typed.slice(expected.length);
  return (
    <span className="mr-[0.55em] inline-block max-w-full">
      {expected.split("").map((exp, i) => {
        const got = typed[i];
        const color =
          got == null
            ? "text-muted/45"
            : got !== exp
              ? "text-coral"
              : "text-teal";
        return (
          <span key={i} className={color}>
            {exp}
          </span>
        );
      })}
      {extra.split("").map((ch, i) => (
        <span key={`x-${i}`} className="text-coral">
          {ch}
        </span>
      ))}
    </span>
  );
}

export function ReviewStage({
  words,
  level,
  source,
  setTime,
  goal,
  title = "Review",
  onClose,
}: {
  title?: string;
  onClose?: () => void;
  words: TypedWord[];
  level: Level;
  source: "generated" | "custom";
  setTime: number;
  goal: GoalMode;
}) {
  const [paneWidth, setPaneWidth] = useState<number | null>(null);

  useEffect(() => {
    const measure = () =>
      setPaneWidth(typingColumnWidth(document.documentElement.clientWidth));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const mode = source === "custom" ? "Custom" : level;
  const timeText =
    goal === "words"
      ? setTime === 0
        ? "∞"
        : String(setTime)
      : setTime === 0
        ? "∞"
        : formatClock(setTime);

  return (
    <div className="flex flex-col gap-4 pb-8 sm:gap-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <p className="justify-self-start rounded-xl bg-teal px-3 py-1.5 text-sm tracking-wide text-abyss capitalize">
          {mode}
        </p>
        <div className="flex flex-col items-center gap-1">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted">{title}</p>
          <p className="text-center font-sans text-3xl tabular-nums tracking-wide sm:text-4xl">
            {timeText}
          </p>
        </div>
        {onClose ? <SheetCloseButton onClose={onClose} /> : <span aria-hidden />}
      </div>
      <div
        className="scroll h-[5.7em] max-w-full overflow-y-auto overscroll-contain scroll-smooth font-mono text-[clamp(1.15rem,0.85rem+1.35vw,2.1rem)] leading-[1.9em] [scrollbar-width:thin]"
        style={paneWidth ? { width: paneWidth } : undefined}
      >
        {words.length === 0 ? (
          <p className="text-muted/55">Nothing typed.</p>
        ) : (
          <p className="select-none font-mono tracking-wide break-words">
            {words.map((word, i) => (
              <WordView key={i} {...word} />
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
