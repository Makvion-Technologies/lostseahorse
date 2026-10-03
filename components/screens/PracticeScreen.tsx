"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SoloResults } from "@/components/typing/SoloResults";
import { PasteWaitPane, TypingPane } from "@/components/typing/TypingPane";
import { useTypingSession } from "@/hooks/useTypingSession";
import { generateWords } from "@/lib/generatePassage";
import { updateWpm } from "@/lib/storage";
import { calcWpm } from "@/lib/wpm";
import {
  buildRunStats,
  fillWordMarks,
  wordMarks,
  type ChartMark,
  type GhostFrame,
  type ReplayEvent,
  type RunStats,
  type WpmSample,
} from "@/lib/runStats";
import type { TypingEngine } from "@/lib/typing";
import { DEFAULT_SETUP, loadSetup, saveSetup } from "@/lib/setup";
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
  LEVELS,
  TIMES,
  isPresetTime,
  type GoalMode,
  type Level,
  type TimeLimit,
} from "@/lib/types";

type Phase = "racing" | "results";

export function PracticeScreen() {
  const client = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [time, setTime] = useState<TimeLimit>(DEFAULT_SETUP.time);
  const [timeLabel, setTimeLabel] = useState<string | undefined>();
  const [level, setLevel] = useState<Level>(DEFAULT_SETUP.level);
  const [extras, setExtras] = useState(DEFAULT_SETUP.extras);
  const [goal, setGoal] = useState<GoalMode>(DEFAULT_SETUP.goal);
  const [phase, setPhase] = useState<Phase>("racing");
  const [passage, setPassage] = useState("");
  const [endsAt, setEndsAt] = useState(0);
  const [left, setLeft] = useState(DEFAULT_SETUP.time * 1000);
  const [result, setResult] = useState<RunStats | null>(null);
  const done = useRef(false);
  const startedAtRef = useRef(0);
  const samplesRef = useRef<WpmSample[]>([]);
  const marksRef = useRef<ChartMark[]>([]);
  const ghostRef = useRef<GhostFrame[]>([]);
  const replayRef = useRef<ReplayEvent[]>([]);
  const fullWordsRef = useRef<string[]>([]);
  const competeRef = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [timeOpen, setTimeOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [peekChrome, setPeekChrome] = useState(false);
  const [customText, setCustomText] = useState("");
  const [usingCustom, setUsingCustom] = useState(false);
  const [pasteWait, setPasteWait] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentUpload[]>([]);
  const [ghost, setGhost] = useState<GhostFrame[] | null>(null);
  const [raceStart, setRaceStart] = useState(0);
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
    const first = generateWords({
      level: stored.level,
      count:
        stored.goal === "words" && stored.time > 0 ? stored.time : 120,
      rng: Math.random,
      extras: stored.extras,
    }).join(" ");
    fullWordsRef.current = first.split(/\s+/).filter(Boolean);
    setPassage(first);
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
      compete?: boolean;
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
      samplesRef.current = [];
      marksRef.current = [];
      ghostRef.current = [];
      replayRef.current = [];
      competeRef.current = Boolean(opts?.compete);
      if (!opts?.compete) setGhost(null);
      setRaceStart(0);
      setRunning(false);
      setEndsAt(0);
      setLeft(nextTime > 0 ? nextTime * 1000 : 0);
      setResult(null);
      setAttempt((n) => n + 1);
      setPhase("racing");
      if (opts?.passage) {
        setPassage(opts.passage);
        fullWordsRef.current = opts.passage.split(/\s+/).filter(Boolean);
      } else if ((opts?.useCustom ?? usingCustom) && customText) {
        const text = passageFromCustom(customText, nextGoal, nextTime);
        setPassage(text);
        fullWordsRef.current = text.split(/\s+/).filter(Boolean);
      } else if (
        opts?.regen ||
        opts?.level ||
        opts?.extras ||
        opts?.goal ||
        (nextGoal === "words" && opts?.time != null)
      ) {
        const text = generateWords({
          level: nextLevel,
          count:
            nextGoal === "words" && nextTime > 0 ? nextTime : 120,
          rng: Math.random,
          extras: nextExtras,
        }).join(" ");
        setPassage(text);
        fullWordsRef.current = text.split(/\s+/).filter(Boolean);
      } else {
        fullWordsRef.current = passage.split(/\s+/).filter(Boolean);
      }
    },
    [customText, extras, goal, level, passage, time, timeLabel, usingCustom],
  );

  useEffect(() => {
    const goHome = () => {
      setPasteWait(false);
      setUsingCustom(false);
      setGhost(null);
      setResult(null);
      begin({ regen: true, useCustom: false });
    };
    window.addEventListener("lostseahorse:home", goHome);
    return () => window.removeEventListener("lostseahorse:home", goHome);
  }, [begin]);

  const finish = useCallback(
    (engine: TypingEngine, finished: boolean) => {
      if (done.current) return;
      done.current = true;
      const started = startedAtRef.current || Date.now();
      const raw = Math.max(1 / 60, (Date.now() - started) / 1000);
      const elapsed =
        goal === "time" && time > 0 ? Math.min(time, raw) : raw;
      if (engine.typed.length > 0) {
        const wpmNow = calcWpm(engine.correctChars, elapsed / 60);
        const expected = engine.words[engine.wordIndex] ?? "";
        const typed = engine.typed;
        const wordKey = engine.lifetimeWords;
        marksRef.current = fillWordMarks(
          marksRef.current,
          wordKey,
          expected,
          typed,
        );
        const hasWord = marksRef.current.some((mark) => mark.wordKey === wordKey);
        if (!hasWord) {
          marksRef.current = [
            ...marksRef.current,
            ...wordMarks(elapsed, wpmNow, expected, typed, wordKey),
          ];
        }
      }
      const stats = buildRunStats({
        engine,
        elapsed,
        setTime: time,
        goal,
        level: levelRef.current,
        extras: extrasRef.current,
        source: usingCustomRef.current ? "custom" : "generated",
        finished,
        samples: samplesRef.current,
        marks: marksRef.current,
        ghost: ghostRef.current,
        replayPassage: fullWordsRef.current.join(" "),
        replay: replayRef.current,
      });
      updateWpm(stats.wpm);
      setResult(stats);
      setRunning(false);
      setPhase("results");
    },
    [goal, time],
  );

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
    setRaceStart(now);
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
    samplesRef.current = [];
    marksRef.current = [];
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
    infinite: !ghost && (goal !== "words" || time === 0),
    moreWords: () => {
      if (competeRef.current) return [];
      if (goalRef.current === "words" && timeRef.current > 0) return [];
      let extra: string[] = [];
      if (usingCustomRef.current && customTextRef.current) {
        extra = customWordList(customTextRef.current);
      } else {
        extra = generateWords({
          level: levelRef.current,
          count: 120,
          rng: Math.random,
          extras: extrasRef.current,
          avoid: fullWordsRef.current.at(-1),
        });
      }
      fullWordsRef.current = [...fullWordsRef.current, ...extra];
      return extra;
    },
    active: phase === "racing" && Boolean(passage) && !timeOpen && !pasteWait,
    onKey: (key, engine) => {
      if (key.length === 1) armClock();
      const started = startedAtRef.current;
      if (!started) return;
      const t = (Date.now() - started) / 1000;
      ghostRef.current.push({
        t,
        word: engine.lifetimeWords,
        letter: engine.typed.length,
      });
      replayRef.current.push({ t, key });
      const wpm = calcWpm(engine.correctChars, t / 60);
      if (key === " ") {
        const index = engine.wordIndex - 1;
        if (index < 0) return;
        const expected = engine.words[index] ?? "";
        const typed = engine.committed[index] ?? "";
        const wordKey = engine.lifetimeWords - 1;
        marksRef.current = fillWordMarks(
          marksRef.current,
          wordKey,
          expected,
          typed,
        );
        if (typed.length < expected.length) {
          marksRef.current.push({
            t,
            wpm,
            expected,
            typed,
            kind: "missed",
            wordKey,
            at: typed.length,
          });
        }
        return;
      }
      if (key.length !== 1) return;
      const expectedWord = engine.words[engine.wordIndex] ?? "";
      const typed = engine.typed;
      const pos = typed.length - 1;
      const expectedCh = expectedWord[pos];
      if (typed[pos] !== expectedCh) {
        marksRef.current.push({
          t,
          wpm,
          expected: expectedWord,
          typed,
          kind: "error",
          wordKey: engine.lifetimeWords,
          at: pos,
        });
      }
    },
    onFinish: (engine) => finish(engine, true),
  });

  useEffect(() => {
    if (!running || phase !== "racing") return;
    const id = window.setInterval(() => {
      const started = startedAtRef.current;
      if (!started || done.current) return;
      const elapsed = (Date.now() - started) / 1000;
      const engine = typing.engineRef.current;
      samplesRef.current = [
        ...samplesRef.current,
        { t: elapsed, wpm: calcWpm(engine.correctChars, elapsed / 60) },
      ];
    }, 400);
    return () => window.clearInterval(id);
  }, [phase, running, typing.engineRef]);

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
        finish(engine, startedAtRef.current !== 0);
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
    finish(typing.engine, true);
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
      finish(engine, true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, phase, time, timeOpen, typing.engineRef]);

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

  const remainSec = Math.ceil(left / 1000);
  const warnAt = time <= 15 ? 5 : 10;
  const clockUrgent =
    goal === "time" && time > 0 && running && remainSec <= warnAt;

  const clock = (
    <p
      className={
        clockUrgent
          ? "text-center font-sans text-3xl tabular-nums tracking-wide text-coral sm:text-4xl"
          : "text-center font-sans text-3xl tabular-nums tracking-wide sm:text-4xl"
      }
    >
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

  const body = pasteWait ? (
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
        ghost={ghost ?? undefined}
        ghostStart={raceStart}
        ghostWords={ghost ? passage.split(/\s+/).filter(Boolean) : undefined}
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

  if (phase === "results" && result) {
    return (
      <div className="relative w-full">
        <SoloResults
          stats={result}
          onNew={() => begin({ regen: true })}
          onRepeat={() =>
            begin({ passage: result.replayPassage, regen: false })
          }
          onCompete={() => {
            setGhost(result.ghost);
            begin({
              passage: result.replayPassage,
              regen: false,
              compete: true,
            });
          }}
        />
        <Toast message={toast} onClear={() => setToast(null)} />
      </div>
    );
  }

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
      <div className="flex min-h-0 flex-1 flex-col overflow-visible">
        <div className="my-auto flex w-full -translate-y-12 flex-col gap-10 py-10">
          {clock}
          {body}
        </div>
      </div>
      <Toast message={toast} onClear={() => setToast(null)} />
    </div>
  );
}
