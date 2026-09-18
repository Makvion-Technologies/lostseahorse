import Image from "next/image";
import { cn } from "@/lib/cn";

export function RacerSeahorse({
  className,
  alt = "seahorse",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <Image
      src="/brand/racer-seahorse.png"
      alt={alt}
      width={980}
      height={980}
      className={cn("object-contain mix-blend-screen", className)}
    />
  );
}
