"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { GhostFrame } from "@/lib/runStats";
import { ghostPlayhead } from "@/lib/runStats";
import type { TypingEngine } from "@/lib/typing";
import {
  CUSTOM_TEXT_EXTS,
  fileFromTransfer,
  transferHasFiles,
} from "@/lib/customText";
import type { RecentUpload } from "@/lib/recentUploads";
import { RecentUploads } from "@/components/ui/RecentUploads";
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

export function PasteWaitPane({
  onPaste,
  onPickFile,
  recents,
  onUseRecent,
  onEmptyRecent,
  onRemoveRecent,
  onRemoveAllRecents,
  onNotice,
}: {
  onPaste: (text: string) => void;
  onPickFile: (file: File) => void;
  recents: RecentUpload[];
  onUseRecent: (item: RecentUpload) => void;
  onEmptyRecent: () => void;
  onRemoveRecent: (id: string) => void;
  onRemoveAllRecents: () => void;
  onNotice: (message: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileOver, setFileOver] = useState(false);
  const accept = CUSTOM_TEXT_EXTS.map((ext) => `.${ext}`).join(",");

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const allowFileDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (transferHasFiles(event.dataTransfer)) {
      event.dataTransfer.dropEffect = "copy";
      setFileOver(true);
    }
  };

  const takeDroppedFile = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setFileOver(false);
    const file = fileFromTransfer(event.dataTransfer);
    if (file) {
      onPickFile(file);
      return;
    }
    if (event.dataTransfer.getData("text/plain")?.trim()) {
      onNotice("Paste text in the lines above.");
      return;
    }
    onNotice("Drop a text file here.");
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-10">
      <div className="relative h-[5.7em] overflow-hidden font-mono text-[clamp(1.15rem,0.85rem+1.35vw,2.1rem)] leading-[1.9em] tracking-wide">
        <span
          aria-hidden
          className="caret pointer-events-none absolute left-0 z-10 w-[2px] rounded-full bg-teal"
          style={{ height: "1.05em", top: "calc((1lh - 1.05em) / 2)" }}
        />
        <p className="select-none">
          <span className="pl-[0.45em] text-muted/55">Paste your own text</span>
        </p>
        <textarea
          ref={ref}
          aria-label="Paste your own text"
          autoComplete="off"
          spellCheck={false}
          className="absolute inset-0 z-20 h-full w-full resize-none bg-transparent text-transparent caret-transparent outline-none"
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (transferHasFiles(event.dataTransfer)) {
              onNotice("Drop files on the upload area below.");
              return;
            }
            onNotice("Paste your text with Ctrl+V.");
          }}
          onPaste={(event) => {
            event.preventDefault();
            if (event.clipboardData?.files?.[0]) {
              onNotice("Drop files on the upload area below.");
              return;
            }
            const text = event.clipboardData?.getData("text/plain") ?? "";
            if (!text.trim()) {
              onNotice("Nothing to paste.");
              return;
            }
            onPaste(text);
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") {
              return;
            }
            event.preventDefault();
          }}
        />
      </div>
      <div className="h-px w-full bg-line" />
      <div
        className={cn(
          "grid min-h-11 grid-cols-1 items-start justify-items-center gap-4 rounded-2xl px-2 py-3 text-center sm:grid-cols-[1fr_auto_1fr] sm:justify-items-stretch sm:text-left",
          fileOver && "ring-1 ring-teal",
        )}
        onDragEnter={allowFileDrop}
        onDragOver={allowFileDrop}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setFileOver(false);
        }}
        onDrop={takeDroppedFile}
      >
        <div className="min-w-0 text-sm tracking-wide text-muted">
          <p>Supported files:</p>
          <p className="mt-1 text-muted/60">
            {CUSTOM_TEXT_EXTS.map((ext) => ext.toUpperCase()).join(", ")}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-full bg-foam px-5 py-2 text-sm tracking-wide text-muted ring-1 ring-line outline-none hover:text-teal focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-abyss"
          >
            Upload your own text files
          </button>
          <p className="text-sm leading-tight text-muted/60">
            You can drag and drop the files directly here
          </p>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onPickFile(file);
            }}
          />
        </div>
        <RecentUploads
          recents={recents}
          onUse={onUseRecent}
          onEmpty={onEmptyRecent}
          onRemove={onRemoveRecent}
          onRemoveAll={onRemoveAllRecents}
        />
      </div>
    </div>
  );
}

export const TypingPane = memo(function TypingPane({
  engine,
  onShift,
  onNeedMore,
  onRefresh,
  onClear,
  chrome = true,
  recents,
  onUseRecent,
  onEmptyRecent,
  onRemoveRecent,
  onRemoveAllRecents,
  ghost,
  ghostStart,
  ghostWords,
}: {
  engine: TypingEngine;
  onShift?: (count: number) => void;
  onNeedMore?: () => void;
  onRefresh?: () => void;
  onClear?: () => void;
  chrome?: boolean;
  recents?: RecentUpload[];
  onUseRecent?: (item: RecentUpload) => void;
  onEmptyRecent?: () => void;
  onRemoveRecent?: (id: string) => void;
  onRemoveAllRecents?: () => void;
  ghost?: GhostFrame[];
  ghostStart?: number;
  ghostWords?: string[];
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLParagraphElement>(null);
  const onShiftRef = useRef(onShift);
  const onNeedMoreRef = useRef(onNeedMore);
  const started = engine.totalChars > 0 || engine.wordIndex > 0;
  const reduce = useReducedMotion();
  const [caret, setCaret] = useState({ x: 0, y: 0, h: 24, ready: false });
  const [ghostCaret, setGhostCaret] = useState({
    x: 0,
    y: 0,
    h: 24,
    ready: false,
    visible: false,
  });

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

  useLayoutEffect(() => {
    if (!ghost?.length) return;
    const box = boxRef.current;
    const root = rootRef.current;
    if (!box || !root) return;
    let frameId = 0;
    const pointOf = (word: number, letter: number) => {
      const dropped = engine.lifetimeWords - engine.wordIndex;
      const vis = word - dropped;
      const wordEl = box.querySelector(
        `[data-word="${vis}"]`,
      ) as HTMLElement | null;
      if (!wordEl) return null;
      const letters = wordEl.querySelectorAll("[data-letter]");
      const fontSize = parseFloat(getComputedStyle(root).fontSize) || 24;
      const h = fontSize * 1.05;
      const boxRect = box.getBoundingClientRect();
      const wordRect = wordEl.getBoundingClientRect();
      const y = wordRect.top - boxRect.top + (wordRect.height - h) / 2;
      let x = wordRect.left - boxRect.left;
      if (letter <= 0) {
        x = wordRect.left - boxRect.left;
      } else if (letter >= letters.length) {
        const last = letters[letters.length - 1] as HTMLElement | undefined;
        x = last
          ? last.getBoundingClientRect().right - boxRect.left
          : wordRect.right - boxRect.left;
      } else {
        const mark = letters[letter] as HTMLElement;
        x = mark.getBoundingClientRect().left - boxRect.left;
      }
      return { x, y, h };
    };
    const measure = () => {
      const t = ghostStart ? (Date.now() - ghostStart) / 1000 : 0;
      const words = ghostWords?.length ? ghostWords : engine.words;
      const head = ghostPlayhead(ghost, words, t);
      const from = pointOf(head.word, head.letter);
      const wordLen = words[head.word]?.length ?? 0;
      const next =
        head.letter >= wordLen
          ? { word: head.word + 1, letter: 0 }
          : { word: head.word, letter: head.letter + 1 };
      const to = pointOf(next.word, next.letter);
      const pos = from ?? to;
      if (!pos) {
        setGhostCaret((prev) =>
          prev.visible ? { ...prev, visible: false } : prev,
        );
      } else {
        const target = to ?? pos;
        const u = head.frac;
        const x = pos.x + (target.x - pos.x) * u;
        const y = pos.y + (target.y - pos.y) * u;
        setGhostCaret((prev) => {
          if (
            prev.ready &&
            prev.visible &&
            Math.abs(prev.x - x) < 0.15 &&
            Math.abs(prev.y - y) < 0.15
          ) {
            return prev;
          }
          return { x, y, h: pos.h, ready: true, visible: true };
        });
      }
      frameId = requestAnimationFrame(measure);
    };
    frameId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frameId);
  }, [
    engine.lifetimeWords,
    engine.wordIndex,
    engine.words,
    ghost,
    ghostStart,
    ghostWords,
  ]);

  return (
    <div className="relative">
    <div
      ref={boxRef}
      className="relative h-[5.7em] overflow-hidden font-mono text-[clamp(1.15rem,0.85rem+1.35vw,2.1rem)] leading-[1.9em]"
    >
      {ghost?.length && ghostCaret.visible ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-[9] w-[2px] rounded-full bg-muted/40"
          style={{ height: ghostCaret.h, opacity: ghostCaret.ready ? 1 : 0 }}
          initial={false}
          animate={{ x: ghostCaret.x, y: ghostCaret.y }}
          transition={{ duration: 0 }}
        />
      ) : null}
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
        className="select-none font-mono tracking-wide break-words"
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
            (isPast && typed !== word) ||
            word.split("").some((char, i) => typed[i] != null && typed[i] !== char);

          return (
            <span
              key={wordIndex}
              data-word={wordIndex}
              className={cn(
                "mr-[0.55em] inline-block max-w-full text-muted/55",
                hasError &&
                  "underline decoration-coral/45 decoration-2 underline-offset-[6px]",
              )}
            >
              {word.split("").map((char, i) => {
                const got = typed[i];
                const ok = got == null ? null : got === char;
                const isNext = isCurrent && typed.length === i;
                return (
                  <span
                    key={i}
                    data-letter={i}
                    data-caret={isNext ? "" : undefined}
                  >
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
      {chrome ? (
      <div className="absolute top-full right-0 left-0 z-10 mt-6 flex flex-col gap-6 sm:mt-10 sm:gap-10">
      <div className="h-px w-full bg-line" />
      <div
        className={
          recents
            ? "grid min-h-11 grid-cols-[1fr_auto] items-start gap-3 sm:grid-cols-[1fr_auto_1fr]"
            : undefined
        }
      >
        {recents ? <div className="hidden sm:block" /> : null}
        {onClear || onRefresh ? (
        <button
          type="button"
          aria-label={onClear ? "Clear passage" : "Refresh passage"}
          onClick={onClear ?? onRefresh}
          className="group mx-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-full font-semibold text-muted/45 outline-none transition-colors hover:text-teal focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-abyss"
        >
          <span className="relative flex">
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold tracking-wide text-muted whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" style={{ marginBottom: "0.5rem" }}>
              {onClear ? "Clear passage" : "Refresh passage"}
            </span>
            {onClear ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path
                  d="M7 7l10 10M17 7L7 17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
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
            )}
          </span>
        </button>
        ) : null}
        {recents && onUseRecent && onEmptyRecent && onRemoveRecent && onRemoveAllRecents ? (
          <RecentUploads
            recents={recents}
            onUse={onUseRecent}
            onEmpty={onEmptyRecent}
            onRemove={onRemoveRecent}
            onRemoveAll={onRemoveAllRecents}
          />
        ) : null}
      </div>
      </div>
      ) : null}
    </div>
  );
});
