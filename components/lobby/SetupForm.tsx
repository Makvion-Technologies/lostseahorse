"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CustomTimeModal } from "@/components/ui/CustomTimeModal";
import { customTimeSlot } from "@/components/ui/ClockGlyph";
import { isPresetTime } from "@/lib/types";
import { useSave } from "@/hooks/useSave";
import { LEVELS, TIMES, type Level, type TimeLimit } from "@/lib/types";
import { loadSetup, saveSetup } from "@/lib/setup";

export type SetupValue = {
  name: string;
  time: TimeLimit;
  level: Level;
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
  const [level, setLevel] = useState<Level>(() => loadSetup().level);
  const [timeOpen, setTimeOpen] = useState(false);

  const persist = (nextTime: TimeLimit, nextLevel: Level) => {
    saveSetup(nextTime, nextLevel);
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
                label: customTimeSlot(time),
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
              persist(value, level);
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
              persist(time, value);
            }}
          />
        </div>
      ) : null}

      <CustomTimeModal
        open={timeOpen}
        current={time}
        onClose={() => setTimeOpen(false)}
        onApply={(seconds) => {
          setTime(seconds);
          persist(seconds, level);
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
          })
        }
      >
        {actionLabel}
      </Button>
    </Card>
  );
}
