"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  appendWords,
  applyKey,
  createEngine,
  dropPrefix,
  progressOf,
  type TypingEngine,
} from "@/lib/typing";

const WORD_LOW = 80;
const WORD_CAP = 200;

export function useTypingSession(opts: {
  passage: string;
  active: boolean;
  resetKey?: number;
  infinite?: boolean;
  moreWords?: () => string[];
  onKey?: (key: string) => void;
  onFinish?: (engine: TypingEngine) => void;
}) {
  const [engine, setEngine] = useState(() =>
    createEngine(opts.passage, opts.resetKey, opts.infinite),
  );
  if (engine.passage !== opts.passage || engine.resetKey !== opts.resetKey) {
    setEngine(createEngine(opts.passage, opts.resetKey, opts.infinite));
  }
  const engineRef = useRef(engine);
  const onKeyRef = useRef(opts.onKey);
  const onFinishRef = useRef(opts.onFinish);
  const activeRef = useRef(opts.active);
  const infiniteRef = useRef(opts.infinite);
  const moreWordsRef = useRef(opts.moreWords);

  useEffect(() => {
    onKeyRef.current = opts.onKey;
    onFinishRef.current = opts.onFinish;
    activeRef.current = opts.active;
    infiniteRef.current = opts.infinite;
    moreWordsRef.current = opts.moreWords;
  }, [opts.active, opts.infinite, opts.moreWords, opts.onFinish, opts.onKey]);

  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  const publish = useCallback((next: TypingEngine) => {
    engineRef.current = next;
    setEngine(next);
  }, []);

  const refill = useCallback((current: TypingEngine) => {
    if (!infiniteRef.current || !moreWordsRef.current) return;
    const remaining = current.words.length - current.wordIndex;
    if (remaining >= WORD_LOW) return;
    appendWords(current, moreWordsRef.current());
  }, []);

  const fillMore = useCallback(() => {
    const current = engineRef.current;
    if (!infiniteRef.current || !moreWordsRef.current) return;
    if (current.words.length - current.wordIndex >= WORD_CAP) return;
    const extra = moreWordsRef.current();
    if (!extra.length) return;
    appendWords(current, extra);
    publish({ ...current });
  }, [publish]);

  const shift = useCallback(
    (count: number) => {
      const current = engineRef.current;
      dropPrefix(current, count);
      refill(current);
      publish({ ...current });
    },
    [publish, refill],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!activeRef.current) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) {
        return;
      }
      if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (event.key === "Tab") event.preventDefault();
      if (event.key.length !== 1 && event.key !== "Backspace") return;
      event.preventDefault();
      const current = engineRef.current;
      const result = applyKey(current, event.key);
      if (result === "ignore") return;
      refill(current);
      onKeyRef.current?.(event.key);
      const copy: TypingEngine = { ...current };
      publish(copy);
      if (copy.finished) onFinishRef.current?.(copy);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [publish, refill]);

  return {
    engine,
    progress: progressOf(engine),
    engineRef,
    shift,
    fillMore,
  };
}
