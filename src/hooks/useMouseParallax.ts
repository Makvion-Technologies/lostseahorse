"use client";

import { useEffect, useState } from "react";

export interface MouseParallax {
  x: number;
  y: number;
}

/**
 * Normalized mouse position in the range [-1, 1].
 * Used for subtle camera / sphere parallax on the landing screen.
 */
export function useMouseParallax(): MouseParallax {
  const [position, setPosition] = useState<MouseParallax>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      setPosition({ x, y });
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return position;
}
