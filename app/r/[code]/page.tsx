import type { Metadata } from "next";
import { RoomScreen } from "@/components/screens/RoomScreen";

export const metadata: Metadata = {
  title: "Room",
};

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ host?: string; stranger?: string }>;
}) {
  const { code } = await params;
  const query = await searchParams;
  return (
    <RoomScreen
      code={code}
      isHost={query.host === "1"}
      stranger={query.stranger === "1"}
    />
  );
}
