import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WohlDraußen",
    short_name: "WohlDraußen",
    description:
      "Zeigt in Echtzeit, wo es sich gerade lohnt, rauszugehen, Schatten, Toilette, Zaun, Entfernung.",
    lang: "de",
    start_url: "/",
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
