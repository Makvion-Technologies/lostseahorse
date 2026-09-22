"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { ResultBoard } from "@/components/typing/ResultBoard";
import { PasteWaitPane, TypingPane } from "@/components/typing/TypingPane";
import { useTypingSession } from "@/hooks/useTypingSession";
import { generateWords } from "@/lib/generatePassage";
import { updateWpm } from "@/lib/storage";
import { calcAccuracy, calcWpm } from "@/lib/wpm";
import { loadSetup, saveSetup } from "@/lib/setup";
import { formatClock } from "@/lib/formatTime";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CustomTimeModal } from "@/components/ui/CustomTimeModal";
import { ExtraToggles, GoalToggle } from "@/components/ui/ExtraToggles";
import { CustomTextControl } from "@/components/ui/CustomTextControl";
import { Toast } from "@/components/ui/Toast";
import { customTimeSlot } from "@/components/ui/ClockGlyph";
import {
  CUSTOM_TEXT_MAX_BYTES,
  fileFromTransfer,
  isSupportedTextFile,
  normalizeCustomText,
  passageFromCustom,
  customWordList,
} from "@/lib/customText";
import {
  addRecentUpload,
  clearRecentUploads,
  loadRecentUploads,
  removeRecentUpload,
  touchRecentUpload,
  type RecentUpload,
} from "@/lib/recentUploads";
import {
  DEFAULT_COLOR,
  DEFAULT_STYLE,
  LEVELS,
  TIMES,
  isPresetTime,
  type GoalMode,
  type Level,
  type TimeLimit,
} from "@/lib/types";

type Phase = "racing" | "results";

export function PracticeScreen() {
  const { resolvedTheme } = useTheme();
  const client = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [time, setTime] = useState<TimeLimit>(() => loadSetup().time);
  const [timeLabel, setTimeLabel] = useState<string | undefined>(
    () => loadSetup().timeLabel,
  );
  const [level, setLevel] = useState<Level>(() => loadSetup().level);
  const [extras, setExtras] = useState(() => loadSetup().extras);
  const [goal, setGoal] = useState<GoalMode>(() => loadSetup().goal);
  const [phase, setPhase] = useState<Phase>("racing");
  const [passage, setPassage] = useState("");
  const [endsAt, setEndsAt] = useState(0);
  const [left, setLeft] = useState(() => loadSetup().time * 1000);
  const [result, setResult] = useState<{
    wpm: number;
    accuracy: number;
    finished: boolean;
  } | null>(null);
  const done = useRef(false);
  const startedAtRef = useRef(0);
  const [attempt, setAttempt] = useState(0);
  const [timeOpen, setTimeOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [peekChrome, setPeekChrome] = useState(false);
  const [customText, setCustomText] = useState("");
  const [usingCustom, setUsingCustom] = useState(false);
  const [pasteWait, setPasteWait] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentUpload[]>([]);
  const levelRef = useRef(level);
  const extrasRef = useRef(extras);
  const goalRef = useRef(goal);
  const timeRef = useRef(time);
  const usingCustomRef = useRef(usingCustom);
  const customTextRef = useRef(customText);
  const pasteWaitRef = useRef(pasteWait);
  const generatedTimeRef = useRef({ time, timeLabel });
  useEffect(() => {
    levelRef.current = level;
  }, [level]);
  useEffect(() => {
    extrasRef.current = extras;
  }, [extras]);
  useEffect(() => {
    goalRef.current = goal;
  }, [goal]);
  useEffect(() => {
    timeRef.current = time;
  }, [time]);
  useEffect(() => {
    usingCustomRef.current = usingCustom;
  }, [usingCustom]);
  useEffect(() => {
    customTextRef.current = customText;
  }, [customText]);
  useEffect(() => {
    pasteWaitRef.current = pasteWait;
  }, [pasteWait]);
  useEffect(() => {
    if (pasteWait || usingCustom) return;
    generatedTimeRef.current = { time, timeLabel };
  }, [pasteWait, time, timeLabel, usingCustom]);
  useEffect(() => {
    setRecents(loadRecentUploads());
  }, []);

  if (client && !passage) {
    const stored = loadSetup();
    if (stored.time !== time) setTime(stored.time);
    if (stored.timeLabel !== timeLabel) setTimeLabel(stored.timeLabel);
    if (stored.level !== level) setLevel(stored.level);
    if (
      stored.extras.punctuation !== extras.punctuation ||
      stored.extras.numbers !== extras.numbers
    ) {
      setExtras(stored.extras);
    }
    if (stored.goal !== goal) setGoal(stored.goal);
    setLeft(stored.time > 0 ? stored.time * 1000 : 0);
    setPassage(
      generateWords({
        level: stored.level,
        count:
          stored.goal === "words" && stored.time > 0 ? stored.time : 120,
        rng: Math.random,
        extras: stored.extras,
      }).join(" "),
    );
  }

  const begin = useCallback(
    (opts?: {
      time?: TimeLimit;
      timeLabel?: string;
      level?: Level;
      extras?: { punctuation: boolean; numbers: boolean };
      goal?: GoalMode;
      passage?: string;
      regen?: boolean;
      useCustom?: boolean;
    }) => {
      const nextTime = opts?.time ?? time;
      const nextLevel = opts?.level ?? level;
      const nextExtras = opts?.extras ?? extras;
      const nextGoal = opts?.goal ?? goal;
      const nextLabel =
        opts?.timeLabel !== undefined
          ? opts.timeLabel || undefined
          : opts?.time != null && isPresetTime(opts.time)
            ? undefined
            : timeLabel;
      if (opts?.time != null) setTime(opts.time);
      if (opts?.time != null || opts?.timeLabel !== undefined) {
        setTimeLabel(nextLabel);
      }
      if (opts?.level) setLevel(opts.level);
      if (opts?.extras) setExtras(opts.extras);
      if (opts?.goal) setGoal(opts.goal);
      saveSetup(nextTime, nextLevel, nextLabel, nextExtras, nextGoal);
      done.current = false;
      startedAtRef.current = 0;
      setRunning(false);
      setEndsAt(0);
      setLeft(nextTime > 0 ? nextTime * 1000 : 0);
      setResult(null);
      setAttempt((n) => n + 1);
      setPhase("racing");
      if (opts?.passage) {
        setPassage(opts.passage);
      } else if ((opts?.useCustom ?? usingCustom) && customText) {
        setPassage(passageFromCustom(customText, nextGoal, nextTime));
      } else if (
        opts?.regen ||
        opts?.level ||
        opts?.extras ||
        opts?.goal ||
        (nextGoal === "words" && opts?.time != null)
      ) {
        setPassage(
          generateWords({
            level: nextLevel,
            count:
              nextGoal === "words" && nextTime > 0 ? nextTime : 120,
            rng: Math.random,
            extras: nextExtras,
          }).join(" "),
        );
      }
    },
    [customText, extras, goal, level, time, timeLabel, usingCustom],
  );

  const finish = useCallback((opts: {
    correctChars: number;
    totalChars: number;
    finished: boolean;
  }) => {
    if (done.current) return;
    done.current = true;
    const started = startedAtRef.current || Date.now();
    const raw = Math.max(1 / 60, (Date.now() - started) / 1000);
    const elapsed =
      goal === "time" && time > 0 ? Math.min(time, raw) : raw;
    const wpm = calcWpm(opts.correctChars, elapsed / 60);
    const accuracy = calcAccuracy(opts.correctChars, opts.totalChars);
    updateWpm(wpm);
    setResult({
      wpm,
      accuracy,
      finished: opts.finished,
    });
    setPhase("results");
  }, [goal, time]);

  useEffect(() => {
    if (!running || phase !== "racing") {
      setPeekChrome(false);
      return;
    }
    const onMove = () => setPeekChrome(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea")) return;
      setPeekChrome(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, running]);
  useEffect(() => {
    const hide = running && phase === "racing" && !peekChrome;
    if (hide) document.documentElement.dataset.typingFocus = "1";
    else delete document.documentElement.dataset.typingFocus;
    return () => {
      delete document.documentElement.dataset.typingFocus;
    };
  }, [peekChrome, phase, running]);

  const armClock = useCallback(() => {
    if (startedAtRef.current) return;
    const now = Date.now();
    startedAtRef.current = now;
    setRunning(true);
    if (goal === "time" && time > 0) {
      setEndsAt(now + time * 1000);
      setLeft(time * 1000);
    } else {
      setEndsAt(0);
      setLeft(0);
    }
  }, [goal, time]);

  const applyCustomText = useCallback(
    (raw: string) => {
      const normalized = normalizeCustomText(raw);
      if (!normalized) {
        setToast("Nothing to type.");
        return;
      }
      setCustomText(normalized);
      setPasteWait(false);
      setUsingCustom(true);
      begin({
        time: 0,
        timeLabel: "∞",
        passage: passageFromCustom(normalized, goal, 0),
        useCustom: true,
      });
    },
    [begin, goal],
  );

  const readCustomFile = useCallback(
    (file: File) => {
      if (file.size > CUSTOM_TEXT_MAX_BYTES) {
        setToast("File is too large.");
        return;
      }
      if (!isSupportedTextFile(file)) {
        setToast("That file type is not supported.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const raw = String(reader.result ?? "");
        const normalized = normalizeCustomText(raw);
        if (!normalized) {
          setToast("Nothing to type.");
          return;
        }
        setRecents(addRecentUpload(file.name, normalized));
        applyCustomText(raw);
      };
      reader.onerror = () => setToast("Could not read that file.");
      reader.readAsText(file);
    },
    [applyCustomText],
  );

  const enterPasteWait = useCallback(() => {
    setPasteWait(true);
    setUsingCustom(false);
    setTime(0);
    setTimeLabel("∞");
    done.current = false;
    startedAtRef.current = 0;
    setRunning(false);
    setEndsAt(0);
    setLeft(0);
    setResult(null);
    setAttempt((n) => n + 1);
    setPhase("racing");
    saveSetup(0, levelRef.current, "∞", extrasRef.current, goalRef.current);
  }, []);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea")) return;
      if (!pasteWaitRef.current) return;
      event.preventDefault();
      if (event.clipboardData?.files?.[0]) {
        setToast("Drop files on the upload area below.");
        return;
      }
      const text = event.clipboardData?.getData("text/plain");
      if (text?.trim()) {
        applyCustomText(text);
        return;
      }
      setToast("Nothing to paste.");
    };
    const blockDrag = (event: DragEvent) => {
      event.preventDefault();
    };
    window.addEventListener("paste", onPaste);
    window.addEventListener("dragover", blockDrag);
    window.addEventListener("drop", blockDrag);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("dragover", blockDrag);
      window.removeEventListener("drop", blockDrag);
    };
  }, [applyCustomText]);

  const typing = useTypingSession({
    passage,
    resetKey: attempt,
    infinite: goal !== "words" || time === 0,
    moreWords: () => {
      if (goalRef.current === "words" && timeRef.current > 0) return [];
      if (usingCustomRef.current && customTextRef.current) {
        return customWordList(customTextRef.current);
      }
      return generateWords({
        level: levelRef.current,
        count: 120,
        rng: Math.random,
        extras: extrasRef.current,
      });
    },
    active: phase === "racing" && Boolean(passage) && !timeOpen && !pasteWait,
    onKey: (key) => {
      if (key.length === 1) armClock();
    },
  });

  useEffect(() => {
    if (phase !== "racing" || !running) return;
    if (goal === "words") return;
    if (time === 0) {
      const id = window.setInterval(() => {
        setLeft(Date.now() - startedAtRef.current);
      }, 100);
      return () => window.clearInterval(id);
    }
    if (!endsAt) return;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, endsAt - Date.now());
      setLeft(remaining);
      if (remaining <= 0) {
        const engine = typing.engineRef.current;
        finish({
          correctChars: engine.correctChars,
          totalChars: engine.totalChars,
          finished: startedAtRef.current !== 0,
        });
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [finish, goal, phase, endsAt, running, time, typing.engineRef]);

  useEffect(() => {
    if (goal !== "words" || time <= 0 || phase !== "racing" || done.current) {
      return;
    }
    if (typing.engine.resetKey !== attempt) return;
    if (!startedAtRef.current) return;
    const remaining = typing.engine.words.length - typing.engine.wordIndex;
    if (remaining > 0 || typing.engine.typed.length > 0) return;
    finish({
      correctChars: typing.engine.correctChars,
      totalChars: typing.engine.totalChars,
      finished: true,
    });
  }, [
    attempt,
    finish,
    goal,
    phase,
    time,
    typing.engine.correctChars,
    typing.engine.lifetimeWords,
    typing.engine.resetKey,
    typing.engine.totalChars,
    typing.engine.typed,
    typing.engine.wordIndex,
    typing.engine.words.length,
  ]);

  useEffect(() => {
    if (phase !== "racing" || time !== 0 || timeOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!startedAtRef.current || done.current) return;
      event.preventDefault();
      const engine = typing.engineRef.current;
      finish({
        correctChars: engine.correctChars,
        totalChars: engine.totalChars,
        finished: true,
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, phase, time, timeOpen, typing.engineRef]);

  const theme: "light" | "dark" =
    resolvedTheme === "light" ? "light" : "dark";

  const share = useMemo(
    () => ({
      name: "solo",
      wpm: result?.wpm ?? 0,
      acc: result?.accuracy ?? 0,
      mode: "practice" as const,
      place: 0,
      theme,
      style: DEFAULT_STYLE,
      color: DEFAULT_COLOR,
    }),
    [result, theme],
  );

  const controls = (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <SegmentedControl
        ariaLabel="Time"
        layoutId="solo-time"
        compact
        value={isPresetTime(time) ? time : "custom"}
        options={[
          ...TIMES.map((value) => ({
            value: value as number | "custom",
            label: String(value),
          })),
          {
            value: "custom" as const,
            label:
              goal === "words" && !isPresetTime(time)
                ? timeLabel && /^\d+$/.test(timeLabel)
                  ? timeLabel
                  : time === 0
                    ? "∞"
                    : String(time)
                : customTimeSlot(time, timeLabel),
            ariaLabel: isPresetTime(time)
              ? "Custom time"
              : time === 0
                ? "No limit"
                : `${time} seconds, custom time`,
          },
        ]}
        onChange={(value) => {
          if (value === "custom") {
            setTimeOpen(true);
            return;
          }
          if (value === time) return;
          begin({ time: value, regen: false });
        }}
      />
      <GoalToggle
        layoutId="solo-goal"
        value={goal}
        onChange={(next) => {
          if (next === goal) return;
          const nextLabel =
            next === "words" && timeLabel && /[hms]/.test(timeLabel)
              ? String(time)
              : timeLabel;
          begin({ goal: next, timeLabel: nextLabel ?? "", regen: false });
        }}
      />
      <CustomTextControl
        value={pasteWait || usingCustom ? "custom" : "generated"}
        onChange={(next) => {
          if (next === "generated") {
            if (!pasteWait && !usingCustom) return;
            setPasteWait(false);
            setUsingCustom(false);
            begin({
              regen: true,
              useCustom: false,
              time: generatedTimeRef.current.time,
              timeLabel: generatedTimeRef.current.timeLabel ?? "",
            });
            return;
          }
          if (pasteWait || usingCustom) return;
          if (customText) {
            setUsingCustom(true);
            begin({
              time: 0,
              timeLabel: "∞",
              passage: passageFromCustom(customText, goal, 0),
              useCustom: true,
            });
            return;
          }
          enterPasteWait();
        }}
      />
      <ExtraToggles
        punctuation={extras.punctuation}
        numbers={extras.numbers}
        onChange={(next) => begin({ extras: next, regen: true })}
        locked={usingCustom || pasteWait}
        onLocked={() =>
          setToast("Punctuations and numbers are off for your own passage.")
        }
      />
      <SegmentedControl
        ariaLabel="Level"
        layoutId="solo-level"
        compact
        tight
        locked={usingCustom || pasteWait}
        onLocked={() => setToast("Level is off for your own passage.")}
        value={level}
        options={LEVELS.map((value) => ({
          value,
          label: value,
        }))}
        onChange={(value) => {
          if (value === level) return;
          begin({ level: value });
        }}
      />
    </div>
  );

  const timeModal = (
    <CustomTimeModal
      open={timeOpen}
      current={time}
      mode={goal}
      onClose={() => setTimeOpen(false)}
      currentLabel={timeLabel}
      onApply={(seconds, label) =>
        begin({ time: seconds, timeLabel: label, regen: false })
      }
    />
  );

  const clock = (
    <p className="text-center font-sans text-3xl tabular-nums tracking-wide sm:text-4xl">
      {goal === "words"
        ? time === 0
          ? running
            ? String(typing.engine.lifetimeWords)
            : "∞"
          : typing.engine.lifetimeWords > 0
            ? `${Math.min(time, typing.engine.lifetimeWords)}/${time}`
            : String(time)
        : time === 0 && !running
          ? "∞"
          : formatClock(time === 0 || endsAt ? left / 1000 : time)}
    </p>
  );

  const body =
    phase === "results" && result ? (
      <ResultBoard
        mode="practice"
        share={share}
        onAgain={() => begin({ regen: true })}
        onRepeat={() => begin({ passage, regen: false })}
        rows={[
          {
            id: "you",
            name: "",
            style: DEFAULT_STYLE,
            color: DEFAULT_COLOR,
            wpm: result.wpm,
            accuracy: result.accuracy,
            place: 1,
            finished: result.finished,
            you: true,
          },
        ]}
      />
    ) : pasteWait ? (
      <PasteWaitPane
        onPaste={applyCustomText}
        onPickFile={readCustomFile}
        recents={recents}
        onUseRecent={(item) => {
          setRecents(touchRecentUpload(item.id));
          applyCustomText(item.text);
        }}
        onEmptyRecent={() => setToast("No recent files were uploaded.")}
        onRemoveRecent={(id) => setRecents(removeRecentUpload(id))}
        onRemoveAllRecents={() => setRecents(clearRecentUploads())}
        onNotice={setToast}
      />
    ) : passage ? (
      <TypingPane
        engine={typing.engine}
        onShift={typing.shift}
        onNeedMore={typing.fillMore}
        onRefresh={usingCustom ? undefined : () => begin({ regen: true })}
        onClear={
          usingCustom
            ? () => {
                setCustomText("");
                enterPasteWait();
              }
            : undefined
        }
        chrome={!running || peekChrome}
        recents={usingCustom && (!running || peekChrome) ? recents : undefined}
        onUseRecent={(item) => {
          setRecents(touchRecentUpload(item.id));
          applyCustomText(item.text);
        }}
        onEmptyRecent={() => setToast("No recent files were uploaded.")}
        onRemoveRecent={(id) => setRecents(removeRecentUpload(id))}
        onRemoveAllRecents={() => setRecents(clearRecentUploads())}
      />
    ) : null;

  return (
    <div
      className="relative flex h-[calc(100dvh-12rem)] flex-col"
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const file = fileFromTransfer(event.dataTransfer);
        if (file) {
          setToast(
            pasteWait
              ? "Drop files on the upload area below."
              : "Select My passage to upload a file.",
          );
          return;
        }
        if (pasteWait && event.dataTransfer.getData("text/plain")?.trim()) {
          setToast("Paste your text in the lines above.");
        }
      }}
    >
      {running && !peekChrome ? null : (
        <div className="absolute inset-x-0 top-0 z-20 pt-16">{controls}</div>
      )}
      {timeModal}
      <div
        className={
          phase === "results"
            ? "flex min-h-0 flex-1 flex-col overflow-y-auto"
            : "flex min-h-0 flex-1 flex-col overflow-visible"
        }
      >
        <div className="my-auto flex w-full -translate-y-12 flex-col gap-10 py-10">
          {clock}
          {body}
        </div>
      </div>
      <Toast message={toast} onClear={() => setToast(null)} />
    </div>
  );
}
