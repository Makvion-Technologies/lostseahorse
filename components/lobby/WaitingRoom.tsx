"use client";

import { motion, useReducedMotion } from "motion/react";
import { RacerSeahorse } from "@/components/seahorse/RacerSeahorse";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { siteUrl } from "@/lib/env";
import type { PlayerPublic, RoomState } from "@/lib/party/events";
import { useState } from "react";

export function WaitingRoom({
  state,
  onStart,
  onFillAi,
}: {
  state: RoomState;
  onStart: () => void;
  onFillAi: (on: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const link = `${siteUrl()}/r/${state.code}`;
  const humans = state.players.filter((p) => p.connected);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <p className="font-display text-3xl italic">waiting in the kelp</p>
      <p className="mt-2 text-sm text-muted">
        {state.settings.level} · {state.settings.time}s · /r/{state.code}
      </p>

      <div className="mt-8 flex flex-wrap gap-6">
        {humans.map((player, i) => (
          <motion.div
            key={player.id}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : i * 0.08 }}
            className="w-20 text-center"
          >
            <RacerSeahorse alt={player.name} className="mx-auto h-20 w-20" />
            <p className="mt-2 truncate text-xs text-muted">{player.name}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={copy}>
          {copied ? "Copied" : "Copy link"}
        </Button>
        {state.youAreHost ? (
          <>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={state.fillAi}
                onChange={(e) => onFillAi(e.target.checked)}
              />
              Fill empty slot
            </label>
            <Button onClick={onStart}>Start</Button>
          </>
        ) : (
          <p className="text-sm text-muted">Waiting for the host.</p>
        )}
      </div>
    </Card>
  );
}

export function playerLane(player: PlayerPublic, youId?: string) {
  return {
    id: player.id,
    name: player.name,
    style: player.style,
    color: player.color,
    progress: player.progress,
    you: player.id === youId,
  };
}
