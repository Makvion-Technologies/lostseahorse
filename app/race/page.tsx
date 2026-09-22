import type { Metadata } from "next";
import { ComingSoonRedirect } from "@/components/site/ComingSoonRedirect";

export const metadata: Metadata = {
  title: "Stranger",
};

export default function RacePage() {
  return <ComingSoonRedirect />;
}
