"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/Toast";
import { HOME_ACTIONS, HOME_BOTTOM, HOME_COL_DENSE, HOME_PAGE, HOME_REST, HOME_TOP, HOME_SETTINGS, ROW_PAD, HomeHeading, NameLine, PillRow, PrimaryButton, RING, StatLine, T_BASE } from "@/components/lobby/HomeParts";
import { InfoTip, NameField, migratedNick, useNameField } from "@/components/profile/NamePicker";
import { RenameInline } from "@/components/screens/StrangerScreen";
import { useProfile } from "@/hooks/useProfile";
import { useSave } from "@/hooks/useSave";
import {
  DEFAULT_STRANGER,
  loadStrangerPrefs,
  queueSettings,
  saveStrangerPrefs,
  type StrangerLength,
  type StrangerPrefs,
} from "@/lib/strangers";
import {
  DEFAULT_FRIENDS,
  clampMax,
  loadFriendPrefs,
  maxOf,
  saveFriendPrefs,
  type FriendPrefs,
  type FriendSize,
} from "@/lib/friends";
import { FRIENDS_MAX, FRIENDS_MIN } from "@/lib/party/events";
import { createRoomCode, isValidRoomCode, normalizeRoomCode } from "@/lib/roomCode";
import { LEVELS } from "@/lib/types";

const LENGTHS: { value: StrangerLength; label: string; ariaLabel: string }[] = [
  { value: "15", label: "15", ariaLabel: "15 seconds" },
  { value: "30", label: "30", ariaLabel: "30 seconds" },
  { value: "60", label: "60", ariaLabel: "60 seconds" },
  { value: "120", label: "120", ariaLabel: "120 seconds" },
];
const LEVEL_OPTS = LEVELS.map((value) => ({ value, label: value }));
const SIZES: { value: FriendSize; label: string; ariaLabel: string }[] = [
  { value: "duo", label: "Duo", ariaLabel: "Duo, up to 2 racers" },
  { value: "trio", label: "Trio", ariaLabel: "Trio, up to 3 racers" },
  { value: "squad", label: "Squad", ariaLabel: "Squad, up to 5 racers" },
  { value: "custom", label: "Custom", ariaLabel: "Custom room size" },
];

const STEP_BTN =
  "flex size-[calc(var(--u)*2)] cursor-pointer items-center justify-center rounded-lg text-[length:calc(var(--u)*1.1)] text-ink outline-none hover:bg-line focus-visible:ring-2 focus-visible:ring-teal disabled:cursor-not-allowed disabled:opacity-40";

/** Room code from a pasted code or invite link (".../r/<code>"). */
function codeFrom(input: string): string {
  const text = input.trim();
  const m = text.match(/\/r\/([^/?#\s]+)/);
  return normalizeRoomCode(m ? decodeURIComponent(m[1]!) : text);
}

function FriendsInner() {
  const router = useRouter();
  const { save } = useSave();
  const profile = useProfile();
  const me = profile.profile;
  const first = useNameField({ mode: "first", initial: migratedNick(save) });
  const [prefs, setPrefs] = useState<StrangerPrefs>(DEFAULT_STRANGER);
  const [room, setRoom] = useState<FriendPrefs>(DEFAULT_FRIENDS);
  const [renaming, setRenaming] = useState(false);
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read localStorage after mount
    setPrefs(loadStrangerPrefs());
    setRoom(loadFriendPrefs());
  }, []);

  const change = (patch: Partial<StrangerPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveStrangerPrefs(next);
      return next;
    });
  };
  const changeRoom = (patch: Partial<FriendPrefs>) => {
    setRoom((prev) => {
      const next = { ...prev, ...patch };
      saveFriendPrefs(next);
      return next;
    });
  };

  const create = useCallback(async () => {
    if (!me) {
      const claimed = await first.submit();
      if (!claimed) return;
    }
    const { goal, time } = queueSettings(prefs);
    const id = createRoomCode();
    window.sessionStorage.setItem(
      "lostseahorse.host",
      JSON.stringify({ code: id, time, level: prefs.level, goal, punctuation: false, numbers: false, fillAi: false, max: maxOf(room) }),
    );
    router.push(`/r/${id}?host=1`);
  }, [first, me, prefs, room, router]);
  const canCreate = !!me || (first.good && !first.saving);

  const parsed = codeFrom(code);
  const valid = isValidRoomCode(parsed);
  const join = useCallback(
    (raw?: string) => {
      const next = codeFrom(raw ?? code);
      if (!isValidRoomCode(next)) {
        setJoinError("That doesn't look like a room code or invite link.");
        return;
      }
      setJoining(true);
      router.push(`/r/${next}`);
    },
    [code, router],
  );
  const paste = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        setToast("Clipboard is empty.");
        return;
      }
      setCode(text);
      setJoinError(null);
      if (isValidRoomCode(codeFrom(text))) join(text);
      else setJoinError("Pasted text isn't a room code or invite link.");
    } catch {
      setToast("Paste blocked. Long-press the box and paste instead.");
    }
  };

  // Enter anywhere (outside controls) creates the room.
  useEffect(() => {
    if (renaming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, button, a, [role=radio]")) return;
      e.preventDefault();
      if (canCreate) void create();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canCreate, create, renaming]);

  const stats = me?.stats;
  const statLine =
    stats && stats.races > 0
      ? [
          ["Races", String(stats.races)],
          ["Best", `${stats.bestWpm} wpm`],
          ["Last", `${stats.lastWpm} wpm`],
        ]
      : null;

  return (
    <div className={HOME_PAGE}>
      <div className={HOME_TOP}>
        <HomeHeading title="Friends" line="Make a private room and share the link." />
      </div>
      <div className={HOME_REST}>
    <div className={`${HOME_COL_DENSE} my-auto`}>

      {!me ? (
        <NameField field={first} label="Racer name" onEnter={() => void create()} />
      ) : renaming ? (
        <RenameInline current={me.name} onClose={() => setRenaming(false)} />
      ) : null}

      <div className={HOME_SETTINGS}>
        <PillRow id="len" label="Length" value={prefs.length} options={LENGTHS} onChange={(length) => change({ length })} />
        <PillRow
          id="lvl"
          label={
            <span className="flex items-center gap-0.5">
              Level
              <InfoTip id="lvl-tip" label="About levels">
                <span className="flex flex-col gap-1 text-left">
                  <span><b>Easy</b>: short, common words.</span>
                  <span><b>Medium</b>: about half common words, half longer everyday ones.</span>
                  <span><b>Hard</b>: mostly long words like &ldquo;environment&rdquo;, mixed with medium ones.</span>
                  <span className="text-muted">Lowercase, no punctuation or numbers.</span>
                </span>
              </InfoTip>
            </span>
          }
          value={prefs.level}
          options={LEVEL_OPTS}
          onChange={(level) => change({ level })}
        />
        <PillRow id="size" label="Room size" value={room.size} options={SIZES} onChange={(size) => changeRoom({ size })} />
        {room.size === "custom" ? (
          <div className={`flex items-center justify-between gap-4 ${ROW_PAD}`}>
            <span className={`${T_BASE} text-muted`}>Racers</span>
            <div className="flex items-center gap-1 rounded-xl bg-foam p-[calc(var(--u)*0.28)] ring-1 ring-line" role="group" aria-label="Custom room size">
              <button
                type="button"
                className={STEP_BTN}
                aria-label="Fewer racers"
                disabled={room.custom <= FRIENDS_MIN}
                onClick={() => changeRoom({ custom: clampMax(room.custom - 1) })}
              >
                −
              </button>
              <span className="min-w-[2.2em] text-center font-mono text-[length:var(--u)] tabular-nums text-ink" aria-live="polite">
                {clampMax(room.custom)}
              </span>
              <button
                type="button"
                className={STEP_BTN}
                aria-label="More racers"
                disabled={room.custom >= FRIENDS_MAX}
                onClick={() => changeRoom({ custom: clampMax(room.custom + 1) })}
              >
                +
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className={HOME_ACTIONS}>
        <PrimaryButton
          disabled={!canCreate}
          onClick={() => void create()}
          label={first.saving ? "Saving name…" : "Create room"}
          hint={canCreate ? null : "Pick a name to create a room."}
        />
        {me && !renaming ? <NameLine name={me.name} canRename onRename={() => setRenaming(true)} /> : null}
      </div>

      <Toast message={toast} onClear={() => setToast(null)} tone="notice" />
    </div>
      </div>
      <div className={HOME_BOTTOM}>
      <div className="flex w-full flex-col gap-[calc(var(--u)*0.5)]">
        <form
          className="flex min-w-0 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            join();
          }}
        >
          <div className="relative min-w-0 flex-1">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setJoinError(null);
              }}
              placeholder="Have a code or link? Join"
              aria-label="Room code or invite link"
              aria-invalid={joinError ? true : undefined}
              aria-describedby="join-msg"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              enterKeyHint="go"
              className={`h-[calc(var(--u)*2.85)] w-full rounded-xl bg-foam pr-[4.5em] pl-[calc(var(--u)*0.85)] font-mono text-[length:var(--u)] text-ink ring-1 outline-none placeholder:font-sans placeholder:text-muted focus-visible:ring-2 focus-visible:ring-teal ${
                joinError ? "ring-coral" : "ring-line"
              }`}
            />
            <button
              type="button"
              onClick={() => void paste()}
              className={`absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded-md px-2 py-1 text-[length:calc(var(--u)*0.86)] text-muted hover:text-ink ${RING}`}
            >
              Paste
            </button>
          </div>
          <button
            type="submit"
            disabled={!code.trim() || joining}
            className={`h-[calc(var(--u)*2.85)] shrink-0 cursor-pointer rounded-xl px-[calc(var(--u)*1.15)] text-[length:var(--u)] font-medium ring-1 transition-colors disabled:cursor-not-allowed disabled:text-muted motion-reduce:transition-none ${
              valid ? "bg-teal text-abyss ring-teal" : "bg-foam text-ink ring-line"
            } ${RING}`}
          >
            {joining ? "Joining…" : "Join"}
          </button>
        </form>
        <p id="join-msg" role={joinError ? "alert" : undefined} className={`text-[length:calc(var(--u)*0.86)] empty:hidden ${joinError ? "text-coral" : "text-muted"}`}>
          {joinError ?? (valid ? `Room ${parsed}. Press Enter to join.` : null)}
        </p>
      </div>
        {statLine ? <StatLine rows={statLine} /> : null}
      </div>
    </div>
  );
}

export function FriendsScreen() {
  const profile = useProfile();
  const { ready } = useSave();
  if (profile.status === "loading" || !ready) {
    return <p className="text-center text-muted">Drifting in…</p>;
  }
  return <FriendsInner />;
}
