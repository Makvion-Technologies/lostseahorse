"use client";

import { useTheme } from "next-themes";
import { flushSync } from "react-dom";
import { cn } from "@/lib/cn";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 3v1.8M12 19.2V21M4.9 4.9l1.3 1.3M17.8 17.8l1.3 1.3M3 12h1.8M19.2 12H21M4.9 19.1l1.3-1.3M17.8 6.2l1.3-1.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M20 14.4A7.6 7.6 0 0 1 9.6 4 7.8 7.8 0 1 0 20 14.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme();

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const isDark = document.documentElement.classList.contains("dark");
    const next = isDark ? "light" : "dark";
    const apply = () => {
      flushSync(() => setTheme(next));
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof document.startViewTransition !== "function") {
      apply();
      return;
    }

    const { top, left, width, height } =
      event.currentTarget.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(apply);
    void transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 620,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

  return (
    <button
      type="button"
      className={cn(
        "relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-line text-muted transition-colors hover:text-ink",
        className,
      )}
      onClick={toggle}
      aria-label="Toggle theme"
    >
      <span className="relative h-[18px] w-[18px]">
        <span className="absolute inset-0 flex transition-all duration-300 ease-out dark:-rotate-45 dark:scale-75 dark:opacity-0 motion-reduce:transition-none">
          <MoonIcon />
        </span>
        <span className="absolute inset-0 flex rotate-45 scale-75 opacity-0 transition-all duration-300 ease-out dark:rotate-0 dark:scale-100 dark:opacity-100 motion-reduce:transition-none">
          <SunIcon />
        </span>
      </span>
    </button>
  );
}
