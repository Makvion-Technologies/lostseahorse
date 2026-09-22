import type { Metadata } from "next";
import { ComingSoonRedirect } from "@/components/site/ComingSoonRedirect";

export const metadata: Metadata = {
  title: "Friends",
};

export default function FriendsPage() {
  return <ComingSoonRedirect />;
}
