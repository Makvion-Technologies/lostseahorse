import type { Metadata } from "next";
import { StrangerLeaderboard } from "@/components/stranger/Leaderboard";

export const metadata: Metadata = {
  title: "Strangers leaderboard",
};

export default function LeaderboardPage() {
  return <StrangerLeaderboard />;
}
