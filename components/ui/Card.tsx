import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-line bg-card/80 p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)] backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
