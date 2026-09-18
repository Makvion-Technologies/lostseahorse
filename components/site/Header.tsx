"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useSave } from "@/hooks/useSave";
import { stripeLink } from "@/lib/env";
import { cn } from "@/lib/cn";

export function Header({ className }: { className?: string }) {
  const { save, ready } = useSave();
  const donate = stripeLink();

  return (
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
      <div className="flex items-center gap-4 text-sm">
        <span className="hidden text-muted sm:inline" suppressHydrationWarning>
          {ready ? `${save.plankton} plankton` : ""}
        </span>
        <ThemeToggle />
        <Link
          href={donate ?? "/shop"}
          className="text-muted hover:text-ink"
          {...(donate
            ? { target: "_blank", rel: "noreferrer" }
            : {})}
        >
          Donate
        </Link>
      </div>
    </header>
  );
}
