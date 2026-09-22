import type { Metadata } from "next";
import { ComingSoonRedirect } from "@/components/site/ComingSoonRedirect";

export const metadata: Metadata = {
  title: "Donate",
};

export default function ShopPage() {
  return <ComingSoonRedirect />;
}
