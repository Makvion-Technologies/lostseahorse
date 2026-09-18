import type { GameMode } from "./types";
import { sanitizeName } from "./names";
import { siteUrl } from "./env";

export type SharePayload = {
  name: string;
  wpm: number;
  acc: number;
  mode: GameMode;
  place: number;
  theme: "light" | "dark";
  style: string;
  color: string;
};

export function ogImageUrl(payload: SharePayload): string {
  const params = new URLSearchParams({
    name: sanitizeName(payload.name),
    wpm: String(Math.max(0, Math.min(400, Math.round(payload.wpm)))),
    acc: String(Math.max(0, Math.min(100, Math.round(payload.acc)))),
    mode: payload.mode,
    place: String(Math.max(0, Math.min(6, payload.place))),
    theme: payload.theme,
    style: payload.style,
    color: payload.color.replace("#", ""),
  });
  return `${siteUrl()}/api/og?${params.toString()}`;
}

export function tweetText(payload: SharePayload): string {
  const wpm = Math.round(payload.wpm);
  if (payload.mode === "practice") {
    return `${wpm} WPM · practice on lostseahorse.com`;
  }
  const place = placeLabel(payload.place);
  return `${wpm} WPM · ${place} in a ${payload.mode} race on lostseahorse.com`;
}

export function tweetIntentUrl(payload: SharePayload): string {
  const url = siteUrl();
  const params = new URLSearchParams({
    text: tweetText(payload),
    url,
  });
  return `https://x.com/intent/tweet?${params.toString()}`;
}

export function placeLabel(place: number): string {
  if (place === 1) return "1st";
  if (place === 2) return "2nd";
  if (place === 3) return "3rd";
  if (place > 3) return `${place}th`;
  return "a quiet";
}
