// Für den statischen App-Hüllen-Export nötig; fürs Web ohnehin korrekt.
export const dynamic = "force-static";

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PlatzDa",
    short_name: "PlatzDa",
    description:
      "Zeigt, wo es mit Kind gerade schön draußen ist – mit Schatten, der für diese Stunde gerechnet ist.",
    lang: "de",
    start_url: "/app",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F8F9FA",
    theme_color: "#2A9D8F",
    categories: ["lifestyle", "navigation", "travel"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
