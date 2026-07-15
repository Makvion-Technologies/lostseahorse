import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LostSeahorse",
    short_name: "LostSeahorse",
    description:
      "A beautiful browser game where typing keeps a lonely seahorse alive.",
    start_url: "/",
    display: "standalone",
    background_color: "#021018",
    theme_color: "#021018",
    orientation: "any",
    categories: ["games", "entertainment"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
