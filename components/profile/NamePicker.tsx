"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { suggestName } from "@/lib/racerNames";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { setProfile, useProfile } from "@/hooks/useProfile";
import { useSave } from "@/hooks/useSave";
import { checkName, claimName } from "@/lib/profile";
import { NAME_MAX, NAME_MIN, nameProblem, type Profile } from "@/lib/profileName";

type Check =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok" }
  | { kind: "bad"; reason: string }
  | { kind: "offline" };

function StatusIcon({ kind }: { kind: "checking" | "ok" | "bad" | "idle" }) {
  if (kind === "checking") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
        <path d="M14 8a6 6 0 0 0-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "ok") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4 shrink-0">
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path d="M5 8.2l2 2 4-4.4" fill="none" stroke="var(--color-abyss, #000)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "bad") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4 shrink-0">
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="var(--color-abyss, #000)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4 shrink-0">
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7v4M8 4.8v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export const NAME_RULES = `${NAME_MIN}–${NAME_MAX} characters: letters, numbers, _ and -`;

/** (i) button: rules on hover, focus or tap; Esc / outside tap closes. */
export function InfoTip({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const shown = open || hover || focus;

  useEffect(() => {
    if (!shown) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
        setHover(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setHover(false);
        setFocus(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [shown]);

  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        aria-expanded={shown}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setFocus(true)}
        onBlur={() => {
          setFocus(false);
          setOpen(false);
        }}
        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-teal"
      >
        <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5">
          <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 7v4M8 4.8v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      <span
        id={id}
        role="tooltip"
        className={
          "absolute bottom-full left-1/2 z-30 mb-1.5 w-max max-w-[min(16rem,80vw)] -translate-x-1/2 rounded-lg border border-line bg-card px-3 py-2 text-xs normal-case tracking-normal text-ink " +
          (shown ? "block" : "hidden")
        }
      >
        {children}
      </span>
    </span>
  );
}

function RulesTip({ id }: { id: string }) {
  return (
    <InfoTip id={id} label="Name rules">
      {NAME_RULES}
    </InfoTip>
  );
}

/** Name input state: live availability check + claim. Shared by every name UI. */
export function useNameField({
  mode,
  initial = "",
  onDone,
}: {
  mode: "first" | "change";
  initial?: string;
  onDone?: (profile: Profile) => void;
}) {
  const { id } = useProfile();
  const [name, setName] = useState(initial);
  const [check, setCheck] = useState<Check>({ kind: "idle" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = name.trim();
  const local = trimmed ? nameProblem(trimmed) : null;

  useEffect(() => {
    if (!trimmed || local || !id) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      setCheck({ kind: "checking" });
      checkName(id, trimmed, ctrl.signal)
        .then((r) => setCheck(r.available ? { kind: "ok" } : { kind: "bad", reason: r.reason ?? "That name is taken." }))
        .catch((e: unknown) => {
          if ((e as Error).name !== "AbortError") setCheck({ kind: "offline" });
        });
    }, 300);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [id, local, trimmed]);

  const unchanged = mode === "change" && trimmed === initial;
  const bad = !!error || (!!trimmed && (!!local || check.kind === "bad" || check.kind === "offline"));
  const good = !local && !unchanged && check.kind === "ok" && !error;
  const pending = !!trimmed && !local && !unchanged && (check.kind === "idle" || check.kind === "checking");
  const status: string =
    error ??
    (!trimmed
      ? ""
      : local
        ? local
        : unchanged
          ? ""
          : pending
            ? "Checking…"
            : check.kind === "ok"
              ? `${trimmed} is available`
              : check.kind === "bad"
                ? check.reason
                : "Can't reach the server right now.");
  const icon = good ? "ok" : bad ? "bad" : pending ? "checking" : "idle";

  const edit = (value: string) => {
    setName(value.replace(/\s/g, "").slice(0, NAME_MAX));
    setError(null);
    setCheck({ kind: "idle" });
  };

  const submit = async (): Promise<Profile | null> => {
    if (!good || saving) return null;
    setSaving(true);
    setError(null);
    try {
      const res = await claimName(id, trimmed);
      if (res.profile) {
        setProfile(res.profile);
        onDone?.(res.profile);
        return res.profile;
      } else {
        setError(res.error ?? "Could not save. Try again.");
      }
    } catch {
      setError("Can't reach the server right now.");
    } finally {
      setSaving(false);
    }
    return null;
  };

  return { name, trimmed, edit, status, icon, good, bad, saving, submit } as const;
}

export type NameFieldState = ReturnType<typeof useNameField>;

/** Input row (Suggest, counter) + availability line. */
export function NameField({
  field,
  label = "Racer name",
  autoFocus = true,
  onEnter,
  onCancel,
  collapseStatus = false,
}: {
  field: NameFieldState;
  label?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
  onCancel?: () => void;
  /** Take no space while there is no status message (the live region stays for screen readers). */
  collapseStatus?: boolean;
}) {
  const { name, trimmed, edit, status, icon, good, bad } = field;
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div data-name-field className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <label htmlFor={inputId} className="text-xs uppercase tracking-[0.18em] text-muted">
          {label}
        </label>
        <RulesTip id={`${inputId}-rules`} />
      </div>
      <div
        className={
          "flex items-center gap-2 rounded-2xl bg-foam p-1.5 ring-1 transition-shadow focus-within:ring-2 " +
          (good ? "ring-teal" : bad ? "ring-coral" : "ring-line focus-within:ring-teal")
        }
      >
        <input
          ref={inputRef}
          id={inputId}
          autoFocus={autoFocus}
          autoComplete="nickname"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={NAME_MAX}
          value={name}
          placeholder="SwiftOtter"
          onChange={(e) => edit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              onEnter?.();
            }
            if (e.key === "Escape" && onCancel) {
              e.stopPropagation();
              onCancel();
            }
          }}
          aria-invalid={bad || undefined}
          aria-describedby={`${inputId}-rules ${inputId}-status ${inputId}-count`}
          className="h-12 min-w-0 flex-1 bg-transparent px-3 font-mono text-lg text-ink outline-none placeholder:text-muted/60 sm:text-xl"
        />
        <span id={`${inputId}-count`} className="hidden font-mono text-xs tabular-nums text-muted sm:inline" aria-label={`${trimmed.length} of ${NAME_MAX} characters`}>
          {trimmed.length}/{NAME_MAX}
        </span>
        <button
          type="button"
          onClick={() => {
            let next = suggestName();
            for (let i = 0; i < 4 && next === trimmed; i++) next = suggestName();
            edit(next);
            inputRef.current?.focus();
          }}
          className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-card px-3 text-sm text-ink ring-1 ring-line outline-none transition-colors hover:bg-line focus-visible:ring-2 focus-visible:ring-teal"
        >
          <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4">
            <rect x="2" y="2" width="12" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="5.5" cy="5.5" r="1.1" fill="currentColor" />
            <circle cx="10.5" cy="10.5" r="1.1" fill="currentColor" />
            <circle cx="8" cy="8" r="1.1" fill="currentColor" />
          </svg>
          Suggest
        </button>
      </div>
      <p
        id={`${inputId}-status`}
        aria-live="polite"
        className={
          (collapseStatus && !status ? "sr-only " : "flex min-h-5 items-center gap-1.5 text-sm ") +
          (good ? "text-teal" : bad ? "text-coral" : "text-muted")
        }
      >
        {status ? <StatusIcon kind={icon} /> : null}
        <span>{status}</span>
      </p>
    </div>
  );
}

/** Old edited nickname from before profiles existed, cleaned for the new rules. */
export function migratedNick(save: { nick?: string; nickEdited?: boolean }): string {
  return save.nickEdited && save.nick ? save.nick.replace(/[^A-Za-z0-9_-]/g, "").slice(0, NAME_MAX) : "";
}

/** Single input + Continue with a live availability check. */
export function NamePicker({
  mode,
  initial = "",
  onDone,
  onCancel,
}: {
  mode: "first" | "change";
  initial?: string;
  onDone?: (profile: Profile) => void;
  onCancel?: () => void;
}) {
  const field = useNameField({ mode, initial, onDone });
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void field.submit();
      }}
    >
      <NameField field={field} onEnter={() => void field.submit()} onCancel={onCancel} />
      <Button type="submit" className="min-h-14 w-full text-base" disabled={!field.good || field.saving}>
        {field.saving ? "Saving…" : mode === "first" ? "Continue" : "Change name"}
      </Button>
      {mode === "change" ? (
        <p className="text-center text-xs text-muted">{"Your best scores stay with you when you rename."}</p>
      ) : null}
      {onCancel ? (
        <Button variant="quiet" onClick={onCancel}>
          Cancel
        </Button>
      ) : null}
    </form>
  );
}

/** Required "Pick your racer name" step before anything that needs a name. */
export function NameGate({ children }: { children: React.ReactNode }) {
  const profile = useProfile();
  const { save, ready } = useSave();
  if (profile.status === "loading" || !ready) {
    return <p className="text-center text-muted">Drifting in…</p>;
  }
  if (profile.status === "ready") return <>{children}</>;
  return (
    <Card className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-5 sm:p-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pick your racer name</h1>
      </div>
      {profile.offline ? (
        <p role="alert" className="text-center text-sm text-coral">
          Can&apos;t reach the race server.{" "}
          <button type="button" onClick={profile.reload} className="cursor-pointer text-teal underline">
            Retry
          </button>
        </p>
      ) : null}
      {/* Migrate: prefill an older edited nickname, still needs confirming. */}
      <NamePicker mode="first" initial={migratedNick(save)} />
    </Card>
  );
}
