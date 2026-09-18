"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SetupForm } from "@/components/lobby/SetupForm";
import { Card } from "@/components/ui/Card";
import { useMatchmaker } from "@/hooks/useMatchmaker";
import { useSave } from "@/hooks/useSave";
import { DEFAULT_COLOR, DEFAULT_STYLE } from "@/lib/types";

export function RaceQueueScreen() {
  const router = useRouter();
  const { save } = useSave();
  const { status, code, error, queue } = useMatchmaker(true);

  useEffect(() => {
    if (status === "matched" && code) {
      router.push(`/r/${code}?stranger=1`);
    }
  }, [code, router, status]);

  if (status === "waiting") {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <p className="font-display text-3xl italic">
          Finding a racer in your current…
        </p>
        <p className="mt-3 text-sm text-muted">Racers in the kelp.</p>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <p className="font-display text-3xl italic">The current slipped.</p>
        <p className="mt-3 text-sm text-muted">{error}</p>
      </Card>
    );
  }

  return (
    <SetupForm
      title="Stranger"
      subtitle="Match someone near your pace. If the kelp is empty, it still starts."
      actionLabel="Find a racer"
      onSubmit={(value) => {
        queue({
          name: value.name,
          style: DEFAULT_STYLE,
          color: DEFAULT_COLOR,
          level: value.level,
          time: value.time,
          wpm: save.wpm,
          firstVisit: save.wpm == null,
        });
      }}
    />
  );
}
