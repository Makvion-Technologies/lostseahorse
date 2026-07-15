import { ImageResponse } from "next/og";

export const alt = "LostSeahorse — Type to Survive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at 50% 30%, #0d4a56 0%, #021018 55%, #01080e 100%)",
          color: "#e0f2fe",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 140,
            height: 140,
            borderRadius: 70,
            border: "2px solid rgba(103,232,249,0.4)",
            background:
              "radial-gradient(circle at 40% 35%, rgba(94,234,212,0.35), rgba(15,118,110,0.2))",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
            marginBottom: 28,
            boxShadow: "0 0 60px rgba(34,211,238,0.25)",
          }}
        >
          🌊
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: 6,
            color: "#ecfeff",
          }}
        >
          LostSeahorse
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 28,
            color: "rgba(165,243,252,0.78)",
            letterSpacing: 1,
          }}
        >
          Type to keep a lonely seahorse alive
        </div>
      </div>
    ),
    { ...size },
  );
}
