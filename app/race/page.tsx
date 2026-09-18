import type { Metadata } from "next";
import { RaceQueueScreen } from "@/components/screens/RaceQueueScreen";

export const metadata: Metadata = {
  title: "Stranger",
};

export default function RacePage() {
  return <RaceQueueScreen />;
}
