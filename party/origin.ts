function allowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "lostseahorse.com" ||
      hostname.endsWith(".lostseahorse.com") ||
      hostname.endsWith(".vercel.app")
    );
  } catch {
    return false;
  }
}

type Headered = { headers: { get(name: string): string | null } };

export function gateOrigin<T extends Headered>(req: T): T | Response {
  const origin = req.headers.get("origin");
  if (!allowedOrigin(origin)) {
    return new Response("Forbidden origin", { status: 403 });
  }
  return req;
}

export function clientIp(req: Headered): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

const WINDOW_MS = 60_000;
const MAX_CREATES = 8;
const hits = new Map<string, number[]>();

export function rateLimitCreate(ip: string): boolean {
  const now = Date.now();
  const prev = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (prev.length >= MAX_CREATES) {
    hits.set(ip, prev);
    return false;
  }
  prev.push(now);
  hits.set(ip, prev);
  return true;
}
