"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

function ModeSelect({ onSoon }: { onSoon: () => void }) {
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
        Solo
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
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSoon();
            }}
            className="block w-full cursor-pointer px-4 py-2 text-left text-sm tracking-wide text-muted outline-none hover:text-teal"
          >
            Stranger
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSoon();
            }}
            className="block w-full cursor-pointer px-4 py-2 text-left text-sm tracking-wide text-muted outline-none hover:text-teal"
          >
            Friends
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Header({ className }: { className?: string }) {
  const [toast, setToast] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <>
      <header
        className={cn(
          "mx-auto flex w-full items-center justify-between px-6 py-6",
          className,
        )}
      >
        <Link
          href="/solo"
          onClick={(event) => {
            if (pathname === "/solo" || pathname === "/") {
              event.preventDefault();
              window.dispatchEvent(new Event("lostseahorse:home"));
            }
          }}
          className="flex items-center gap-2.5 font-display text-xl italic tracking-tight"
        >
          <Image
            src="/brand/favicon-seahorse.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain mix-blend-screen"
            priority
          />
          lost seahorse
        </Link>
        <div className="header-extras flex items-center gap-4 text-sm">
          <ModeSelect
            onSoon={() =>
              setToast("Coming soon. Thank you for your patience.")
            }
          />
          <ThemeToggle />
          <button
            type="button"
            onClick={() =>
              setToast("Whoa, eager. We're not ready for your money yet.")
            }
            className="cursor-pointer text-muted hover:text-ink"
          >
            Donate
          </button>
        </div>
      </header>
      <Toast message={toast} onClear={() => setToast(null)} tone="notice" />
    </>
  );
}
