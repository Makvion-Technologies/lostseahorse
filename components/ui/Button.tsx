import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "quiet";

type Props = {
  variant?: Variant;
  href?: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "href">;

const styles: Record<Variant, string> = {
  primary:
    "bg-ink text-abyss hover:opacity-90 disabled:opacity-40",
  ghost:
    "border border-line bg-transparent text-ink hover:bg-foam",
  quiet: "text-muted hover:text-ink",
};

export function Button({
  variant = "primary",
  href,
  external,
  className,
  children,
  type = "button",
  ...rest
}: Props) {
  const cls = cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm tracking-wide transition-colors disabled:cursor-not-allowed",
    styles[variant],
    className,
  );

  if (href) {
    if (external) {
      return (
        <a href={href} className={cls} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
