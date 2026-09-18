import type { Metadata } from "next";
import { PracticeScreen } from "@/components/screens/PracticeScreen";

export const metadata: Metadata = {
  title: "Solo",
};

export default function SoloPage() {
  return <PracticeScreen />;
}
