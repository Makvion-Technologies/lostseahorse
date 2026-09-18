export function partyHost(): string {
  return process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999";
}

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")
  ).replace(/\/$/, "");
}

export function stripeLink(): string | null {
  const value = process.env.NEXT_PUBLIC_STRIPE_LINK?.trim();
  return value ? value : null;
}
