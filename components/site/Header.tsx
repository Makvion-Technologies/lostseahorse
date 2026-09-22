"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

export function Header({ className }: { className?: string }) {
  const [toast, setToast] = useState<string | null>(null);

  return (
    <>
    <header
      className={cn(
        "mx-auto flex w-full items-center justify-between px-6 py-6",
        className,
      )}
    >
      <Link
        href="/"
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
        <ThemeToggle />
        <button
          type="button"
          onClick={() => setToast("Whoa, eager. We're not ready for your money yet.")}
          className="cursor-pointer text-muted hover:text-ink"
        >
          Donate
        </button>
      </div>
    </header>
      <Toast
        message={toast}
        onClear={() => setToast(null)}
        tone="notice"
      />
    </>
  );
}
