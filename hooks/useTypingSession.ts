"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  appendWords,
  applyKey,
  createEngine,
  dropPrefix,
  normalizeTyped,
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
  onKey?: (key: string, engine: TypingEngine) => void;
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

  const applyText = useCallback(
    (key: string) => {
      if (!activeRef.current) return;
      const current = engineRef.current;
      const result = applyKey(current, key);
      if (result === "ignore") return;
      refill(current);
      onKeyRef.current?.(key, current);
      const copy: TypingEngine = { ...current };
      publish(copy);
      if (copy.finished) onFinishRef.current?.(copy);
    },
    [publish, refill],
  );

  /*
   * Text arrives through a hidden, focused <textarea> and its `input` /
   * `compositionend` events rather than through `keydown.key`. keydown is
   * unreliable for producing characters: AltGr layouts (Polish, German,
   * Spanish, etc.) report ctrlKey+altKey, dead keys report "Dead", IMEs and
   * Android keyboards report "Unidentified" / keyCode 229, and iOS / macOS
   * substitute smart punctuation. The browser itself resolves all of that
   * into the final text, which is what we read here.
   */
  useEffect(() => {
    const SENTINEL = "\u200b";
    const field = document.createElement("textarea");
    field.setAttribute("data-typing-input", "");
    field.setAttribute("aria-label", "Typing input");
    field.setAttribute("autocomplete", "off");
    field.setAttribute("autocorrect", "off");
    field.setAttribute("autocapitalize", "off");
    field.setAttribute("spellcheck", "false");
    field.setAttribute("enterkeyhint", "next");
    field.setAttribute("data-gramm", "false");
    field.setAttribute("data-1p-ignore", "");
    field.tabIndex = -1;
    Object.assign(field.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: "1px",
      height: "1px",
      padding: "0",
      border: "0",
      opacity: "0",
      fontSize: "16px",
      resize: "none",
      overflow: "hidden",
      pointerEvents: "none",
      caretColor: "transparent",
      zIndex: "-1",
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(field);

    let composing = false;
    const reset = () => {
      field.value = SENTINEL;
      field.setSelectionRange(1, 1);
    };
    reset();

    const isEditable = (el: Element | null) =>
      !!el &&
      el !== field &&
      !!el.closest("input, textarea, select, [contenteditable='true']");

    const focusField = (force = true) => {
      if (!activeRef.current) return;
      const activeEl = document.activeElement;
      if (activeEl === field) return;
      if (isEditable(activeEl)) return;
      // Passive refocus never steals focus from a button/link the user tabbed to.
      if (!force && activeEl && activeEl !== document.body) return;
      if (document.querySelector("[role='dialog']")) return;
      field.focus({ preventScroll: true });
      reset();
    };

    const flush = () => {
      const raw = field.value;
      const hadSentinel = raw.startsWith(SENTINEL);
      const text = normalizeTyped(raw.split(SENTINEL).join(""));
      reset();
      if (!hadSentinel && !text) {
        // Sentinel was deleted (e.g. Android backspace reported as keyCode 229).
        applyText("Backspace");
        return;
      }
      for (const ch of text) {
        if (ch === "\n" || ch === "\r" || ch === "\t") continue;
        applyText(ch);
      }
    };

    const onInput = (event: Event) => {
      const input = event as InputEvent;
      if (composing || input.isComposing) return;
      flush();
    };
    const onCompositionStart = () => {
      composing = true;
    };
    const onCompositionEnd = () => {
      composing = false;
      // Some browsers fire the final input event after compositionend.
      window.setTimeout(flush, 0);
    };
    const onFieldKeyDown = (event: KeyboardEvent) => {
      if (!activeRef.current) return;
      if (event.key === "Tab") {
        event.preventDefault();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        return;
      }
      if (event.key === "Backspace" && !composing && !event.isComposing) {
        event.preventDefault();
        if (event.ctrlKey || event.metaKey || event.altKey) {
          // Delete the whole current word.
          const current = engineRef.current;
          const n = current.typed.length || 1;
          for (let i = 0; i < n; i++) applyText("Backspace");
          return;
        }
        applyText("Backspace");
      }
    };

    // Fallback: a key pressed while focus is on the page (not the field).
    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (!activeRef.current) return;
      if (event.target === field) return;
      if (isEditable(event.target as Element | null)) return;
      if (event.key === "Escape") return;
      const altGr = event.getModifierState?.("AltGraph");
      if ((event.ctrlKey || event.metaKey) && !altGr) return;
      if (event.key === "Tab") event.preventDefault();
      if (event.key === "Backspace") {
        event.preventDefault();
        applyText("Backspace");
        focusField();
        return;
      }
      if (event.key.length === 1 && !event.isComposing) {
        event.preventDefault();
        applyText(normalizeTyped(event.key));
      }
      focusField();
    };

    const onPointer = (event: Event) => {
      const target = event.target as Element | null;
      if (target?.closest("button, a, input, textarea, select, label, [role='dialog'], [contenteditable='true']")) {
        return;
      }
      focusField();
    };

    const blockInsert = (event: Event) => event.preventDefault();
    field.addEventListener("paste", blockInsert);
    field.addEventListener("drop", blockInsert);
    field.addEventListener("input", onInput);
    field.addEventListener("compositionstart", onCompositionStart);
    field.addEventListener("compositionend", onCompositionEnd);
    field.addEventListener("keydown", onFieldKeyDown);
    window.addEventListener("keydown", onWindowKeyDown);
    document.addEventListener("click", onPointer);
    const poll = window.setInterval(() => {
      if (activeRef.current) focusField(false);
      else if (document.activeElement === field) field.blur();
    }, 250);
    focusField(false);

    return () => {
      window.clearInterval(poll);
      field.removeEventListener("paste", blockInsert);
      field.removeEventListener("drop", blockInsert);
      field.removeEventListener("input", onInput);
      field.removeEventListener("compositionstart", onCompositionStart);
      field.removeEventListener("compositionend", onCompositionEnd);
      field.removeEventListener("keydown", onFieldKeyDown);
      window.removeEventListener("keydown", onWindowKeyDown);
      document.removeEventListener("click", onPointer);
      field.remove();
    };
  }, [applyText]);

  return {
    engine,
    progress: progressOf(engine),
    engineRef,
    shift,
    fillMore,
  };
}
