"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "ghost" | "icon";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-400/90 via-teal-400/90 to-cyan-500/90 text-slate-950 font-semibold shadow-[0_0_40px_-8px_rgba(34,211,238,0.55)] hover:shadow-[0_0_50px_-6px_rgba(34,211,238,0.7)] border border-cyan-200/30",
  ghost:
    "bg-white/5 text-cyan-50/90 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md",
  icon: "bg-white/5 text-cyan-100/80 border border-white/10 hover:bg-white/10 hover:border-cyan-300/30 backdrop-blur-md p-3 rounded-full",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      variant = "primary",
      className,
      type = "button",
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled}
        whileHover={disabled ? undefined : { y: -2, scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-sm tracking-wide transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50",
          variantStyles[variant],
          className as string | undefined,
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
