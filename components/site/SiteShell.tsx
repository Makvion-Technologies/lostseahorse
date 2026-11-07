"use client";

import { OceanBackground } from "@/components/ocean/OceanBackground";
import Link from "next/link";
import { Header } from "./Header";
import { cn } from "@/lib/cn";

/**
 * Width of the typing column (main padding + max width per breakpoint).
 * Keep in sync with the classes below; Replay uses it to wrap lines identically.
 */
export function typingColumnWidth(viewport: number): number {
  // Mirrors the shell width below.
  const rem = 16;
  const w = viewport >= 64 * rem ? viewport * 0.82 : viewport >= 40 * rem ? viewport - 4 * rem : viewport - 2 * rem;
  return Math.max(0, Math.min(w, 2200));
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  // One content column for navbar and page: ~9% side margins on desktop, like Monkeytype.
  const width = "mx-auto w-[calc(100%-2rem)] max-w-[2200px] sm:w-[calc(100%-4rem)] lg:w-[82vw]";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <OceanBackground />
      <Header
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-20 [&>*]:pointer-events-auto",
          width,
        )}
      />
      <main className="relative z-10 flex min-h-dvh w-full min-w-0 items-center justify-center pt-24 pb-16 sm:pt-28 sm:pb-20">
        <div className={cn("w-full min-w-0", width)}>{children}</div>
      </main>
      <footer
        className={cn(
          "site-footer pointer-events-none absolute inset-x-0 bottom-[clamp(0.5rem,1.6dvh,1.4rem)] z-20 text-center text-[length:calc(var(--u)*0.72)] whitespace-nowrap text-muted [--u:clamp(0.8rem,min(0.93vw,1.6dvh),1.42rem)]",
          width,
        )}
      >
        <p className="pointer-events-auto inline-block">
          A product by{" "}
          <a
            href="https://makvion.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded text-ink/80 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-teal"
          >
            Makvion Technologies
          </a>
          , India
          <span className="mx-[0.7em] opacity-50">·</span>
          <Link href="/privacy" className="rounded text-ink/80 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-teal">
            Privacy
          </Link>
          <span className="mx-[0.7em] opacity-50">·</span>
          <Link href="/terms" className="rounded text-ink/80 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-teal">
            Terms
          </Link>
        </p>
      </footer>
    </div>
  );
}
