import type { Metadata } from "next";
import { StrangerScreen } from "@/components/screens/StrangerScreen";

export const metadata: Metadata = {
  title: "Strangers",
};

export default async function RacePage({
  searchParams,
}: {
  searchParams: Promise<{ go?: string; from?: string }>;
}) {
  const query = await searchParams;
  return <StrangerScreen autoGo={query.go === "1"} from={query.go === "1" && query.from === "leaderboard" ? "leaderboard" : null} />;
}
