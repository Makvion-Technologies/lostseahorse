"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SetupForm } from "@/components/lobby/SetupForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createRoomCode, isValidRoomCode, normalizeRoomCode } from "@/lib/roomCode";

export function FriendsScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const join = () => {
    const next = normalizeRoomCode(code);
    if (!isValidRoomCode(next)) {
      setError("That code does not look like a room.");
      return;
    }
    router.push(`/r/${next}`);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <SetupForm
        title="Friends"
        subtitle="Create a room. Settings lock for everyone else."
        actionLabel="Create room"
        onSubmit={(value) => {
          const room = createRoomCode();
          window.sessionStorage.setItem(
            "lostseahorse.host",
            JSON.stringify({
              code: room,
              time: value.time,
              level: value.level,
              fillAi: false,
            }),
          );
          router.push(`/r/${room}?host=1`);
        }}
      />
      <Card className="h-fit">
        <p className="font-display text-3xl italic">Join</p>
        <p className="mt-2 text-sm text-muted">Paste a code. Slip in quietly.</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="quiet-tide-xx"
          spellCheck={false}
          className="mt-6 w-full rounded-2xl border border-line bg-transparent px-4 py-3 font-mono outline-none"
        />
        {error ? <p className="mt-2 text-sm text-coral">{error}</p> : null}
        <Button className="mt-6" onClick={join}>
          Enter
        </Button>
      </Card>
    </div>
  );
}
