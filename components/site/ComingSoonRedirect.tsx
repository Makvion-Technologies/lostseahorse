"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ComingSoonRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return null;
}
