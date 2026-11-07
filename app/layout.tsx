import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SiteShell } from "@/components/site/SiteShell";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "lost seahorse",
    template: "%s · lost seahorse",
  },
  description: "Type. Race. Feed your seahorse.",
  applicationName: "lost seahorse",
  icons: {
    icon: "/brand/favicon-seahorse.png",
    shortcut: "/brand/favicon-seahorse.png",
    apple: "/brand/favicon-seahorse.png",
  },
  openGraph: {
    title: "lost seahorse",
    description: "Type. Race. Feed your seahorse.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070b10",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-abyss text-ink">
        <ThemeProvider>
          <SiteShell>{children}</SiteShell>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
