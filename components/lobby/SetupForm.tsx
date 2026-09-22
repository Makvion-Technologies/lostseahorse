"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CustomTimeModal } from "@/components/ui/CustomTimeModal";
import { ExtraToggles, GoalToggle } from "@/components/ui/ExtraToggles";
import { customTimeSlot } from "@/components/ui/ClockGlyph";
import { isPresetTime } from "@/lib/types";
import { useSave } from "@/hooks/useSave";
import {
  LEVELS,
  TIMES,
  type GoalMode,
  type Level,
  type TimeLimit,
} from "@/lib/types";
import { loadSetup, saveSetup } from "@/lib/setup";

export type SetupValue = {
  name: string;
  time: TimeLimit;
  level: Level;
  punctuation: boolean;
  numbers: boolean;
  goal: GoalMode;
};

export function SetupForm({
  title,
  subtitle,
  actionLabel,
  lockSettings = false,
  onSubmit,
}: {
  title: string;
  subtitle?: string;
  actionLabel: string;
  lockSettings?: boolean;
  onSubmit: (value: SetupValue) => void;
}) {
  const { save, ready } = useSave();
  const [time, setTime] = useState<TimeLimit>(() => loadSetup().time);
  const [timeLabel, setTimeLabel] = useState<string | undefined>(
    () => loadSetup().timeLabel,
  );
  const [level, setLevel] = useState<Level>(() => loadSetup().level);
  const [extras, setExtras] = useState(() => loadSetup().extras);
  const [goal, setGoal] = useState<GoalMode>(() => loadSetup().goal);
  const [timeOpen, setTimeOpen] = useState(false);

  const persist = (
    nextTime: TimeLimit,
    nextLevel: Level,
    nextLabel?: string,
    nextExtras = extras,
    nextGoal = goal,
  ) => {
    saveSetup(nextTime, nextLevel, nextLabel, nextExtras, nextGoal);
  };

  return (
    <Card className="mx-auto w-full max-w-xl">
      <p className="font-display text-3xl italic">{title}</p>
      {subtitle ? (
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
      ) : null}

      <p className="mt-8 text-xs uppercase tracking-[0.18em] text-muted">
        You are
      </p>
      <p className="mt-2 font-display text-2xl italic" suppressHydrationWarning>
        {ready && save.name ? save.name : "drifting…"}
      </p>

      {!lockSettings ? (
        <div className="mt-8 flex flex-col gap-4">
          <SegmentedControl
            ariaLabel="Time"
            layoutId="setup-time"
            value={isPresetTime(time) ? time : "custom"}
            options={[
              ...TIMES.map((value) => ({
                value: value as number | "custom",
                label: String(value),
              })),
              {
                value: "custom" as const,
                label: customTimeSlot(time, timeLabel),
                ariaLabel: isPresetTime(time)
                  ? "Custom time"
                  : `${time} seconds, custom time`,
              },
            ]}
            onChange={(value) => {
              if (value === "custom") {
                setTimeOpen(true);
                return;
              }
              setTime(value);
              setTimeLabel(undefined);
              persist(value, level);
            }}
          />
          <GoalToggle
            layoutId="setup-goal"
            value={goal}
            onChange={(next) => {
              setGoal(next);
              persist(time, level, timeLabel, extras, next);
            }}
          />
          <ExtraToggles
            punctuation={extras.punctuation}
            numbers={extras.numbers}
            onChange={(next) => {
              setExtras(next);
              persist(time, level, timeLabel, next);
            }}
          />
          <SegmentedControl
            ariaLabel="Level"
            layoutId="setup-level"
            value={level}
            options={LEVELS.map((value) => ({
              value,
              label: value,
            }))}
            onChange={(value) => {
              setLevel(value);
              persist(time, value, timeLabel);
            }}
          />
        </div>
      ) : null}

      <CustomTimeModal
        open={timeOpen}
        current={time}
        mode={goal}
        currentLabel={timeLabel}
        onClose={() => setTimeOpen(false)}
        onApply={(seconds, label) => {
          setTime(seconds);
          setTimeLabel(label);
          persist(seconds, level, label);
        }}
      />
      <Button
        className="mt-8 w-full"
        disabled={!ready || !save.name}
        onClick={() =>
          onSubmit({
            name: save.name,
            time,
            level,
            punctuation: extras.punctuation,
            numbers: extras.numbers,
            goal,
          })
        }
      >
        {actionLabel}
      </Button>
    </Card>
  );
}
