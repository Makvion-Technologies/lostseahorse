import type { Metadata } from "next";
import { ShopScreen } from "@/components/screens/ShopScreen";

export const metadata: Metadata = {
  title: "Shrimp",
};

export default function ShopPage() {
  return <ShopScreen />;
}
