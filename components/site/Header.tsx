"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";

type Mode = "Solo" | "Stranger" | "Friends";

function modeFor(pathname: string | null, stranger: boolean): Mode {
  if (pathname?.startsWith("/stranger")) return "Stranger";
  if (pathname?.startsWith("/friends")) return "Friends";
  // Race rooms: ?stranger=1 marks a Strangers match, otherwise it's a friends room.
  if (pathname?.startsWith("/r/")) return stranger ? "Stranger" : "Friends";
  return "Solo";
}

const HOME: Record<Mode, string> = {
  Solo: "/",
  Stranger: "/stranger",
  Friends: "/friends",
};

function useMode(stranger: boolean): Mode {
  return modeFor(usePathname(), stranger);
}

const itemClass = (active: boolean) =>
  cn(
    "block w-full cursor-pointer px-4 py-2 text-left text-sm tracking-wide outline-none hover:text-teal focus-visible:text-teal",
    active ? "text-teal" : "text-muted",
  );

function ModeSelect({ mode }: { mode: Mode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-sm tracking-wide text-abyss outline-none focus-visible:ring-2 focus-visible:ring-teal"
      >
        {mode}
        <svg
          viewBox="0 0 24 24"
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          aria-hidden
        >
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <div className="absolute top-full left-0 z-30 mt-2 min-w-[9rem] rounded-xl border border-line bg-card py-1">
          {mode !== "Solo" ? (
            <Link href="/solo" onClick={() => setOpen(false)} className={itemClass(false)}>
              Solo
            </Link>
          ) : null}
          <Link
            href="/stranger"
            aria-current={mode === "Stranger" ? "page" : undefined}
            onClick={() => setOpen(false)}
            className={itemClass(mode === "Stranger")}
          >
            Stranger
          </Link>
          <Link
            href="/friends"
            aria-current={mode === "Friends" ? "page" : undefined}
            onClick={() => setOpen(false)}
            className={itemClass(mode === "Friends")}
          >
            Friends
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/**
 * useSearchParams updates in step with client navigation (router.push to
 * /r/<id>?stranger=1), unlike reading window.location during render, which
 * still held the old URL and showed "Friends". Suspense keeps static pages
 * prerenderable; the fallback only appears in static HTML for non-room pages.
 */
export function Header({ className }: { className?: string }) {
  return (
    <Suspense fallback={<HeaderView className={className} stranger={false} />}>
      <HeaderWithParams className={className} />
    </Suspense>
  );
}

function HeaderWithParams({ className }: { className?: string }) {
  const stranger = useSearchParams()?.get("stranger") === "1";
  return <HeaderView className={className} stranger={stranger} />;
}

function HeaderView({ className, stranger }: { className?: string; stranger: boolean }) {
  const pathname = usePathname();
  const mode = useMode(stranger);
  const home = HOME[mode] || pathname || "/";

  return (
    <>
      <header
        className={cn(
          "mx-auto flex items-center justify-between gap-3 py-4 sm:py-6",
          className,
        )}
      >
        <Link
          href={home}
          onClick={(event) => {
            if (mode === "Solo" && (pathname === "/solo" || pathname === "/")) {
              event.preventDefault();
              window.dispatchEvent(new Event("lostseahorse:home"));
            }
          }}
          className="header-logo flex min-w-0 shrink items-center gap-2 font-display text-lg whitespace-nowrap italic tracking-tight sm:gap-2.5 sm:text-xl"
        >
          <Image
            src="/brand/favicon-seahorse.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain mix-blend-screen"
            priority
          />
          <span className="truncate max-[22rem]:sr-only">lost seahorse</span>
        </Link>
        <div className="header-extras flex shrink-0 items-center gap-2 text-sm sm:gap-4">
          <ModeSelect mode={mode} />
          <ThemeToggle />
        </div>
      </header>
    </>
  );
}
