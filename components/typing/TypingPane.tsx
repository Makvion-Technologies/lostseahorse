"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { TypingEngine } from "@/lib/typing";
import { cn } from "@/lib/cn";

function groupWordLines(root: HTMLElement): number[][] {
  const nodes = [...root.querySelectorAll<HTMLElement>("[data-word]")];
  const lines: number[][] = [];
  let band = -1;
  for (const node of nodes) {
    const index = Number(node.dataset.word);
    if (!Number.isFinite(index)) continue;
    const top = node.offsetTop;
    if (band < 0 || Math.abs(top - band) > 6) {
      lines.push([]);
      band = top;
    }
    lines[lines.length - 1]!.push(index);
  }
  return lines;
}

export const TypingPane = memo(function TypingPane({
  engine,
  onShift,
  onNeedMore,
  onRefresh,
}: {
  engine: TypingEngine;
  onShift?: (count: number) => void;
  onNeedMore?: () => void;
  onRefresh?: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLParagraphElement>(null);
  const onShiftRef = useRef(onShift);
  const onNeedMoreRef = useRef(onNeedMore);
  const started = engine.totalChars > 0 || engine.wordIndex > 0;
  const reduce = useReducedMotion();
  const [caret, setCaret] = useState({ x: 0, y: 0, h: 24, ready: false });

  useEffect(() => {
    onShiftRef.current = onShift;
    onNeedMoreRef.current = onNeedMore;
  }, [onNeedMore, onShift]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const lines = groupWordLines(root);
    if (!lines.length) return;
    const currentLine = lines.findIndex((line) =>
      line.includes(engine.wordIndex),
    );
    if (currentLine >= 2 && lines[0]?.length) {
      onShiftRef.current?.(lines[0].length);
      return;
    }
    if (lines.length < 4) onNeedMoreRef.current?.();
  }, [engine.wordIndex, engine.words.length, engine.typed]);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const root = rootRef.current;
    const mark = box?.querySelector("[data-caret]") as HTMLElement | null;
    const word = box?.querySelector(
      `[data-word="${engine.wordIndex}"]`,
    ) as HTMLElement | null;
    if (!box || !root || !mark) return;
    const boxRect = box.getBoundingClientRect();
    const markRect = mark.getBoundingClientRect();
    const wordRect = (word ?? mark).getBoundingClientRect();
    const fontSize = parseFloat(getComputedStyle(root).fontSize) || 24;
    const h = fontSize * 1.05;
    const x = markRect.left - boxRect.left;
    const y = wordRect.top - boxRect.top + (wordRect.height - h) / 2;
    setCaret((prev) => {
      if (
        prev.ready &&
        Math.abs(prev.x - x) < 0.4 &&
        Math.abs(prev.y - y) < 0.4 &&
        Math.abs(prev.h - h) < 0.4
      ) {
        return prev;
      }
      return { x, y, h, ready: true };
    });
  }, [engine.typed, engine.wordIndex, engine.words.length]);

  return (
    <div className="flex flex-col gap-10">
    <div
      ref={boxRef}
      className="relative h-[9.6rem] overflow-hidden sm:h-[10.8rem]"
    >
      <motion.span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-0 left-0 z-10 w-[2px] rounded-full bg-teal",
          !started && "caret",
        )}
        style={{ height: caret.h, opacity: caret.ready ? 1 : 0 }}
        initial={false}
        animate={{ x: caret.x, y: caret.y }}
        transition={
          !started || reduce || !caret.ready
            ? { duration: 0 }
            : { type: "tween", duration: 0.18, ease: [0.22, 1, 0.36, 1] }
        }
      />
      <p
        ref={rootRef}
        className="select-none font-mono text-[1.55rem] leading-[3.2rem] tracking-wide sm:text-[1.95rem] sm:leading-[3.6rem]"
      >
        {engine.words.map((word, wordIndex) => {
          const committed = engine.committed[wordIndex];
          const isCurrent = wordIndex === engine.wordIndex;
          const isPast = wordIndex < engine.wordIndex;
          const typed = isCurrent ? engine.typed : isPast ? committed ?? "" : "";
          const extras =
            typed.length > word.length ? typed.slice(word.length) : "";
          const hasError =
            extras.length > 0 ||
            word.split("").some((char, i) => typed[i] != null && typed[i] !== char);

          return (
            <span
              key={wordIndex}
              data-word={wordIndex}
              className={cn(
                "mr-[0.55em] inline-block text-muted/55",
                hasError &&
                  "underline decoration-coral/45 decoration-2 underline-offset-[6px]",
              )}
            >
              {word.split("").map((char, i) => {
                const got = typed[i];
                const ok = got == null ? null : got === char;
                const isNext = isCurrent && typed.length === i;
                return (
                  <span key={i} data-caret={isNext ? "" : undefined}>
                    <span
                      className={cn(
                        ok === true && "text-teal",
                        ok === false && "text-coral",
                      )}
                    >
                      {char}
                    </span>
                  </span>
                );
              })}
              {extras
                ? extras.split("").map((char, i) => {
                    const isNext =
                      isCurrent && typed.length === word.length + i;
                    return (
                      <span
                        key={`x-${i}`}
                        data-caret={isNext ? "" : undefined}
                        className="text-coral"
                      >
                        {char}
                      </span>
                    );
                  })
                : null}
              {isCurrent && typed.length >= word.length + extras.length ? (
                <span data-caret className="inline-block h-[1em] w-0" />
              ) : null}
            </span>
          );
        })}
      </p>
    </div>
      <div className="h-px w-full bg-line" />
      {onRefresh ? (
        <button
          type="button"
          aria-label="Refresh passage"
          onClick={onRefresh}
          className="group mx-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-full font-semibold text-muted/45 outline-none transition-colors hover:text-teal focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-abyss"
        >
          <span className="relative flex">
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold tracking-wide text-muted whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" style={{ marginBottom: "0.5rem" }}>
              Refresh passage
            </span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path
                d="M20 12a8 8 0 1 1-2.2-5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M20 4.5V8h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      ) : null}
    </div>
  );
});
