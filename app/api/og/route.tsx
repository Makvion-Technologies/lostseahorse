import { ImageResponse } from "next/og";
import { sanitizeName } from "@/lib/names";
import { COLORS, isGameMode, isStyleId } from "@/lib/types";

function placeLabel(place: number): string {
  if (place === 1) return "1st";
  if (place === 2) return "2nd";
  if (place === 3) return "3rd";
  if (place > 3) return `${place}th`;
  return "a quiet";
}

function clampInt(raw: string | null, min: number, max: number, fallback = 0) {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function safeColor(raw: string | null): string {
  const value = `#${(raw ?? "").replace(/[^0-9a-f]/gi, "").slice(0, 6)}`;
  const match = COLORS.find(
    (color) => color.toLowerCase() === value.toLowerCase(),
  );
  return match ?? "#6ed3c7";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = sanitizeName(searchParams.get("name"), "racer");
  const wpm = clampInt(searchParams.get("wpm"), 0, 400);
  const acc = clampInt(searchParams.get("acc"), 0, 100);
  const modeRaw = searchParams.get("mode");
  const mode = isGameMode(modeRaw) ? modeRaw : "practice";
  const place = clampInt(searchParams.get("place"), 0, 6);
  const theme = searchParams.get("theme") === "light" ? "light" : "dark";
  const style = isStyleId(searchParams.get("style"))
    ? searchParams.get("style")
    : "kelp";
  const color = safeColor(searchParams.get("color"));

  const abyss = theme === "light" ? "#f3efe6" : "#070b10";
  const ink = theme === "light" ? "#141820" : "#e7eef4";
  const muted = theme === "light" ? "#6b6458" : "#8b97a4";
  const placeText =
    mode === "practice" ? "practice" : `${placeLabel(place)} · ${mode}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: abyss,
          color: ink,
          padding: "72px",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
          }}
        >
          <div style={{ display: "flex", fontSize: 28, fontStyle: "italic" }}>
            lost seahorse
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 132, fontStyle: "italic" }}>
              {wpm}
              <span style={{ fontSize: 36, marginLeft: 16, marginTop: 64, color: muted }}>
                WPM
              </span>
            </div>
            <div style={{ display: "flex", fontSize: 32, color: muted, marginTop: 8 }}>
              {name} · {acc}% · {placeText}
            </div>
          </div>
          <div style={{ display: "flex", color: muted, fontSize: 24 }}>
            lostseahorse.com
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: 180,
            height: 280,
            marginTop: 40,
            background: color,
            borderRadius: "90px 90px 40px 80px",
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 96,
            top: 96,
            fontSize: 18,
            color: muted,
          }}
        >
          {style}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
