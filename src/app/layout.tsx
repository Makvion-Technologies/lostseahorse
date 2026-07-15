import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lostseahorse.game";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LostSeahorse — Type to Survive",
    template: "%s · LostSeahorse",
  },
  description:
    "A beautiful browser game where typing keeps a lonely seahorse alive. Protect the deep — one word at a time.",
  applicationName: "LostSeahorse",
  keywords: [
    "typing game",
    "browser game",
    "seahorse",
    "underwater",
    "indie game",
    "WPM",
  ],
  authors: [{ name: "LostSeahorse" }],
  creator: "LostSeahorse",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "LostSeahorse",
    title: "LostSeahorse — Type to Survive",
    description:
      "A beautiful browser game where typing keeps a lonely seahorse alive.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "LostSeahorse — underwater typing game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LostSeahorse — Type to Survive",
    description:
      "A beautiful browser game where typing keeps a lonely seahorse alive.",
    images: ["/og.png"],
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LostSeahorse",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#021018" },
    { media: "(prefers-color-scheme: light)", color: "#021018" },
  ],
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-dvh overflow-hidden bg-ocean-deep text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
