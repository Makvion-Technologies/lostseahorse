import type { NextConfig } from "next";

const partyHost =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "127.0.0.1:1999";
const partyOrigins = [
  `http://${partyHost}`,
  `https://${partyHost}`,
  `ws://${partyHost}`,
  `wss://${partyHost}`,
];

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "worker-src 'self' blob:",
  `connect-src 'self' ws: wss: http://127.0.0.1:1999 http://localhost:1999 ws://127.0.0.1:1999 ws://localhost:1999 ${partyOrigins.join(" ")}`,
  "frame-src https://js.stripe.com https://hooks.stripe.com https://buy.stripe.com",
  "form-action 'self' https://checkout.stripe.com https://buy.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
]
  .join("; ")
  .replace(/\s+/g, " ")
  .trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
