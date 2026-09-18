"use client";

import { usePathname } from "next/navigation";
import { OceanBackground } from "@/components/ocean/OceanBackground";
import { Header } from "./Header";
import { cn } from "@/lib/cn";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const home = usePathname() === "/";
  const width = home
    ? "max-w-6xl"
    : "max-w-[min(90rem,calc(100vw-10rem))]";

  return (
    <div className="relative flex min-h-dvh flex-col">
      <OceanBackground />
      <Header
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-20 [&>*]:pointer-events-auto",
          width,
        )}
      />
      <main className="relative z-10 flex min-h-dvh w-full items-center justify-center px-6 py-24">
        <div className={cn("w-full", width)}>{children}</div>
      </main>
    </div>
  );
}
